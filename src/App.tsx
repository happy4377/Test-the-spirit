/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowUpRight, BookOpen } from 'lucide-react';
import {
  STUDY_ARCHIVE,
  SCRIPTURE_EVIDENCE_LIST,
  FEATURE_PILLARS,
  StudyModule,
  FeaturePillar,
  ScriptureEvidence
} from './data/scriptureData';
import { ThrowableStudyDeck } from './components/ThrowableStudyDeck';
import { StudyReaderModal, StudyPlanModal } from './components/StudyModals';

export default function App() {
  // Motion preference & scroll state
  const [motionOk, setMotionOk] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState<number>(0);
  const [viewportH, setViewportH] = useState<number>(900);

  // Interactive application state
  const [activeDeckIndex, setActiveDeckIndex] = useState<number>(0);
  const [throwTriggerCount, setThrowTriggerCount] = useState<number>(0);
  const [selectedStudy, setSelectedStudy] = useState<StudyModule | null>(null);
  const [studyPlanModalOpen, setStudyPlanModalOpen] = useState<boolean>(false);
  const [activePillarForModal, setActivePillarForModal] = useState<FeaturePillar | null>(null);

  // Examine the Evidence search & selection state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('1-john-4-1');

  const heroSectionRef = useRef<HTMLElement | null>(null);
  const statementSectionRef = useRef<HTMLElement | null>(null);

  // Detect prefers-reduced-motion and bind scroll listener
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReduced = mq.matches;
    setMotionOk(!isReduced);
    setViewportH(window.innerHeight || 900);
    setScrollY(window.scrollY || 0);

    const onScroll = () => {
      setScrollY(window.scrollY);
    };
    const onResize = () => {
      setViewportH(window.innerHeight || 900);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // One-way IntersectionObserver for non-hero entry reveals (fires once, never un-reveals)
  useEffect(() => {
    if (!motionOk) return;
    const elements = document.querySelectorAll('.reveal-item');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [motionOk]);

  // Compute reversible Portal Hero progress [0 .. 1] bound strictly to scrollY
  const heroScrollSpan = Math.max(viewportH * 1.4, 800);
  const rawHeroProgress = motionOk ? Math.min(Math.max(scrollY / heroScrollSpan, 0), 1) : 1;

  // Portal opening physics (reversible on scroll up/down)
  // Left & Right opaque panels part outward past their own width (>500px in first 700px of scroll)
  const panelTranslatePct = rawHeroProgress * 106; // 0% (closed) -> 106% (completely clear of frame)
  // Hero background image settles from slight overscale (1.22) down to 1.0
  const imageScale = 1.22 - rawHeroProgress * 0.22;
  // Duotone wash rises from 0 to 0.26 opacity
  const duotoneOpacity = rawHeroProgress * 0.26;
  // Two accent dots travel from center toward opposite corners
  const dotTravelX = rawHeroProgress * 38; // vw
  const dotTravelY = rawHeroProgress * 34; // vh

  // Portal Title physics: scales UP while letter-spacing tightens and halves travel outward to uncover the center photo
  const titleScale = 1 + rawHeroProgress * 0.18;
  const titleTrackingEm = 0.04 - rawHeroProgress * 0.07; // +0.04em down to -0.03em
  const titleHalfShiftVw = rawHeroProgress * 12; // left span -12vw, right span +12vw

  // Statement fold circular scrolls image drift & rotation bound to scrollY
  const statementOffset = Math.max(0, scrollY - viewportH * 1.2);
  const circleRotateDeg = motionOk ? statementOffset * 0.035 : 0;
  const circleDriftY = motionOk ? Math.min(statementOffset * -0.08, 0) : 0;

  // Filtered Scripture Evidence rows for the table
  const filteredEvidenceList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SCRIPTURE_EVIDENCE_LIST;
    const matches = SCRIPTURE_EVIDENCE_LIST.filter(
      (item) =>
        item.reference.toLowerCase().includes(q) ||
        item.kjvText.toLowerCase().includes(q) ||
        item.theme.toLowerCase().includes(q) ||
        item.greekKey.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q) || q.includes(k))
    );
    return matches.length > 0 ? matches : SCRIPTURE_EVIDENCE_LIST;
  }, [searchQuery]);

  const activeEvidence: ScriptureEvidence = useMemo(() => {
    return (
      filteredEvidenceList.find((item) => item.id === selectedEvidenceId) ||
      filteredEvidenceList[0] ||
      SCRIPTURE_EVIDENCE_LIST[0]
    );
  }, [filteredEvidenceList, selectedEvidenceId]);

  const activeDeckStudy = STUDY_ARCHIVE[activeDeckIndex] || STUDY_ARCHIVE[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#0A0C0E] text-[#EDE7DC] font-sora selection:bg-[#E8913C] selection:text-[#0A0C0E] ${
        motionOk ? 'motion-ok' : ''
      }`}
    >
      {/* =====================================================================
          FIXED 58PX NAVIGATION BAR (3-Zone Contract, 14px Blur, Hairline Bottom)
      ====================================================================== */}
      <header
        className="fixed top-0 inset-x-0 z-50 h-[58px] bg-[#0A0C0E]/75 hairline-b flex items-center"
        style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      >
        <div className="w-full max-w-[1380px] mx-auto px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Display wordmark at 15px with trailing period in amber */}
          <a
            href="#portal-hero"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-syne font-extrabold text-[15px] tracking-[-0.025em] text-[#EDE7DC] whitespace-nowrap shrink-0"
          >
            TEST THE SPIRIT<span className="text-[#E8913C]">.</span>
          </a>

          {/* Zone 2: 5 single-line uppercase links at 10.5px turning amber on hover */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-8">
            {[
              { label: 'Home', id: 'portal-hero' },
              { label: 'Mission', id: 'statement-fold' },
              { label: 'Bible Studies', id: 'study-archive' },
              { label: 'Discernment', id: 'pillars-roster' },
              { label: 'Scripture', id: 'scripture-evidence' }
            ].map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.id);
                }}
                className="label-caps text-[#9EA5A8] hover:text-[#E8913C] transition-colors whitespace-nowrap shrink-0"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: 1 pill button (no filled accent area) */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setActivePillarForModal(FEATURE_PILLARS[0]);
                setStudyPlanModalOpen(true);
              }}
              className="px-4 py-1.5 rounded-full bg-transparent hairline-border label-caps text-[#EDE7DC] hover:text-[#E8913C] hover:border-[#E8913C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              GET STARTED
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* =====================================================================
            SECTION 1: PORTAL HERO (~2.5 Viewports Tall, Sticky Full-Height Stage)
        ====================================================================== */}
        <section
          id="portal-hero"
          ref={heroSectionRef}
          className="relative h-[250vh] bg-[#0A0C0E]"
        >
          <div className="sticky top-0 h-screen w-full overflow-hidden isolate">
            {/* Layer 1 (Back): Full-bleed looping Hero Video revealed as portal opens */}
            <div
              className="absolute inset-0 z-[10] flex items-center justify-center bg-[#0A0C0E]"
              style={{
                transform: `scale(${imageScale.toFixed(4)})`,
                willChange: 'transform'
              }}
            >
              <video
                src="/assets/aistudio/gemini_generated_video_e00cb7d9_4f498c19.mp4"
                poster="/assets/aistudio/file_0000000012ac8211860ec8fae52f06e3_ad643363.png"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Layer 2: Subtle duotone wash blending #E8913C and #2E6B72 at mix-blend-mode: overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-[15]"
              style={{
                background: 'linear-gradient(135deg, #E8913C 0%, #2E6B72 100%)',
                mixBlendMode: 'overlay',
                opacity: (duotoneOpacity * 0.65).toFixed(3)
              }}
            />

            {/* Layer 3: Measured radial veil darkening only the outer edges so the center cross and hands shine clearly */}
            <div
              className="pointer-events-none absolute inset-0 z-[20]"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(10,12,14,0) 42%, rgba(10,12,14,0.82) 100%)'
              }}
            />

            {/* Layer 4: TWO Solid Opaque Panels pinned left & right so hero begins CLOSED */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0 left-0 w-[51vw] bg-[#0A0C0E] border-r border-[rgba(237,231,220,0.13)] z-[30]"
              style={{
                transform: `translate3d(-${panelTranslatePct.toFixed(2)}%, 0, 0)`,
                willChange: 'transform'
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0 right-0 w-[51vw] bg-[#0A0C0E] border-l border-[rgba(237,231,220,0.13)] z-[30]"
              style={{
                transform: `translate3d(${panelTranslatePct.toFixed(2)}%, 0, 0)`,
                willChange: 'transform'
              }}
            />

            {/* Layer 5: Two small accent dots at the centre travelling toward opposite corners */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[35] w-2 h-2 rounded-full bg-[#E8913C]"
              style={{
                transform: `translate3d(-${dotTravelX.toFixed(2)}vw, -${dotTravelY.toFixed(2)}vh, 0)`
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[35] w-2 h-2 rounded-full bg-[#2E6B72]"
              style={{
                transform: `translate3d(${dotTravelX.toFixed(2)}vw, ${dotTravelY.toFixed(2)}vh, 0)`
              }}
            />

            {/* Layer 6 (Top): The Portal Title — Positioned in upper band so the center cross & hands are completely clear */}
            <div className="pointer-events-none absolute inset-x-0 top-[15%] sm:top-[14%] z-[45] flex flex-col items-center justify-center px-6">
              <h1
                className="font-syne font-extrabold uppercase text-[#EDE7DC] flex items-center justify-center gap-3 sm:gap-5 whitespace-nowrap select-none"
                style={{
                  fontSize: 'clamp(1.75rem, 4.2vw, 4.25rem)',
                  transform: `scale(${titleScale.toFixed(4)})`,
                  letterSpacing: `${titleTrackingEm.toFixed(4)}em`,
                  willChange: 'transform, letter-spacing'
                }}
              >
                <span
                  style={{
                    transform: `translate3d(-${titleHalfShiftVw.toFixed(2)}vw, 0, 0)`,
                    willChange: 'transform'
                  }}
                >
                  TEST THE
                </span>
                <span
                  style={{
                    transform: `translate3d(${titleHalfShiftVw.toFixed(2)}vw, 0, 0)`,
                    willChange: 'transform'
                  }}
                >
                  SPIRIT<span className="text-[#E8913C]">.</span>
                </span>
              </h1>
              <p
                className="mt-3 text-xs sm:text-sm text-[#EDE7DC] tracking-wide text-center"
                style={{
                  opacity: Math.min(Math.max((rawHeroProgress - 0.15) * 1.5, 0), 1)
                }}
              >
                Examine Every Teaching. Search the Scriptures. Hold Fast to the Truth.
              </p>
            </div>

            {/* Uncovered Lower Scripture Verse & Actions (Below the hands & cross so the center photo is 100% unobstructed) */}
            <div
              className="absolute inset-x-0 bottom-[10%] z-[40] max-w-xl mx-auto px-6 text-center"
              style={{
                opacity: Math.min(Math.max((rawHeroProgress - 0.25) * 1.6, 0), 1),
                pointerEvents: rawHeroProgress > 0.25 ? 'auto' : 'none'
              }}
            >
              <blockquote className="text-xs sm:text-sm text-[#EDE7DC]">
                “Beloved, believe not every spirit, but try the spirits whether they are of God.” —{' '}
                <span className="text-[#E8913C]">1 John 4:1</span>
              </blockquote>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection('study-archive')}
                  className="px-5 py-2 rounded-full bg-[#0A0C0E]/85 border border-[#E8913C] label-caps text-[#E8913C] hover:text-[#EDE7DC] hover:border-[#EDE7DC] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  EXPLORE SCRIPTURE
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('statement-fold')}
                  className="px-5 py-2 rounded-full bg-[#0A0C0E]/85 hairline-border label-caps text-[#EDE7DC] hover:text-[#E8913C] hover:border-[#E8913C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  OUR MISSION
                </button>
              </div>
            </div>

            {/* Layer 7: Corner Metadata Pinned to Top and Bottom Edges */}
            <div className="pointer-events-none absolute top-[74px] left-6 right-6 z-[45] flex items-center justify-between">
              <div className="label-caps text-[#9EA5A8]">
                <span className="text-[#E8913C]">1 JOHN 4:1</span> · TRY THE SPIRITS
              </div>
              <div className="label-caps text-[#9EA5A8] hidden sm:block">
                SCRIPTURE BANNER · <span className="text-[#2E6B72]">1 THESSALONIANS 5:21</span>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-5 left-6 right-6 z-[45] flex items-center justify-between">
              <div className="label-caps text-[#6C7378]">
                LED BY PASTOR SHAHID HANIF &amp; PASTOR SANDESH SHALOM
              </div>
              <div className="label-caps text-[#E8913C]">
                {rawHeroProgress < 0.85 ? 'SCROLL TO PART PORTAL ↓' : 'PORTAL OPEN · 1 JOHN 4:1'}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 2: STATEMENT FOLD (Full-Height Section with Scripture Banner & Mission)
        ====================================================================== */}
        <section
          id="statement-fold"
          ref={statementSectionRef}
          className="relative min-h-screen bg-[#0A0C0E] hairline-t overflow-hidden flex items-center py-24 px-6"
        >
          {/* Floating Circular Image off the right edge that drifts & rotates on scroll */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 sm:-right-16 top-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-full overflow-hidden hairline-border opacity-35"
            style={{
              transform: `translate3d(0, ${circleDriftY.toFixed(1)}px, 0) rotate(${circleRotateDeg.toFixed(2)}deg)`,
              willChange: 'transform'
            }}
          >
            <img
              src="/assets/aistudio/mission_scrolls.png"
              alt="Ancient Hebrew Torah scroll and leather-bound scriptures"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 w-full max-w-[1380px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
              <div className="lg:col-span-9 space-y-8 reveal-item">
                {/* Small uppercase label */}
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8913C]" />
                  <span className="label-caps text-[#9EA5A8]">
                    THE MISSION · DISCERNMENT THROUGH SCRIPTURE · 1 THESSALONIANS 5:21
                  </span>
                </div>

                {/* Statement at clamp(24px, 3.6vw, 52px) over ~22ch with one phrase in amber */}
                <h2
                  className="font-syne font-bold text-[#EDE7DC] leading-[1.12] tracking-[-0.025em] max-w-[23ch]"
                  style={{ fontSize: 'clamp(24px, 3.6vw, 52px)' }}
                >
                  “Prove all things;{' '}
                  <span className="text-[#E8913C]">hold fast that which is good</span>” — examine
                  every teaching by the written Word.
                </h2>

                {/* Mission paragraphs & pastoral attribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 hairline-t max-w-3xl">
                  <p className="text-sm text-[#9EA5A8] leading-relaxed">
                    Examine every spiritual teaching. Search the Scriptures. Hold fast to sound
                    biblical doctrine, and anchor your faith in the living Word of God. Study
                    biblical context and private interpretations in light of eternal Scripture.
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm text-[#EDE7DC] leading-relaxed">
                      “Led by Pastor Shahid Hanif &amp; Pastor Sandesh Shalom”
                    </p>
                    <div className="label-caps text-[#2E6B72]">
                      GROUNDED IN SCRIPTURE · GUIDED BY TRUTH
                    </div>
                  </div>
                </div>
              </div>

              {/* Outlined index numeral using -webkit-text-stroke with transparent fill */}
              <div className="lg:col-span-3 flex lg:justify-end">
                <span
                  aria-hidden="true"
                  className="outlined-numeral leading-none"
                  style={{ fontSize: 'clamp(5rem, 11vw, 9.5rem)' }}
                >
                  01
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 3: BIBLICAL STUDY ARCHIVE ("Releases" Two-Column Section + Throwable Deck)
        ====================================================================== */}
        <section
          id="study-archive"
          className="bg-[#101317] hairline-t py-24 sm:py-32 px-6 overflow-hidden"
        >
          <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Headline, Lede, Active Study Details, and Two Buttons */}
            <div className="lg:col-span-6 space-y-6 reveal-item">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B72]" />
                <span className="label-caps text-[#9EA5A8]">
                  BIBLICAL STUDY ARCHIVE · 06 VOLUMES
                </span>
              </div>

              <h2
                className="font-syne font-extrabold text-[#EDE7DC] tracking-[-0.03em] leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
              >
                EXPLORE THE WORD<span className="text-[#E8913C]">.</span>
              </h2>

              <p className="text-sm sm:text-base text-[#9EA5A8] leading-relaxed max-w-xl">
                Flip through our six foundational study sleeves—from{' '}
                <span className="text-[#EDE7DC]">Testing the Spirits</span> and{' '}
                <span className="text-[#EDE7DC]">False Prophets &amp; False Teaching</span> to{' '}
                <span className="text-[#EDE7DC]">The Holy Spirit in Scripture</span>,{' '}
                <span className="text-[#EDE7DC]">Prophecy &amp; Discernment</span>,{' '}
                <span className="text-[#EDE7DC]">Biblical Context</span>, and{' '}
                <span className="text-[#EDE7DC]">Christian Apologetics</span>.
              </p>

              {/* Currently Top-of-Deck Study Preview Box */}
              <div className="p-5 bg-[#0A0C0E] hairline-border space-y-2 max-w-xl">
                <div className="flex items-center justify-between">
                  <span className="label-caps text-[#E8913C]">
                    ACTIVE SLEEVE · 0{activeDeckIndex + 1} / 0{STUDY_ARCHIVE.length}
                  </span>
                  <span className="label-caps text-[#2E6B72]">
                    {activeDeckStudy.keyVerseRef}
                  </span>
                </div>
                <div className="font-syne font-bold text-xl text-[#EDE7DC]">
                  {activeDeckStudy.title}
                </div>
                <p className="text-xs sm:text-sm text-[#9EA5A8] leading-relaxed">
                  “{activeDeckStudy.keyVerseKJV}”
                </p>
              </div>

              {/* Two Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedStudy(activeDeckStudy)}
                  className="px-6 py-3 rounded-full bg-transparent border border-[#E8913C] label-caps text-[#E8913C] hover:text-[#EDE7DC] hover:border-[#EDE7DC] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  OPEN STUDY GUIDE (VOL. 0{activeDeckIndex + 1})
                </button>
                <button
                  type="button"
                  onClick={() => setThrowTriggerCount((c) => c + 1)}
                  className="px-6 py-3 rounded-full bg-transparent hairline-border label-caps text-[#EDE7DC] hover:text-[#E8913C] hover:border-[#E8913C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  THROW NEXT SLEEVE →
                </button>
              </div>
            </div>

            {/* Right Column: Physical Throwable Study Deck */}
            <div className="lg:col-span-6 reveal-item">
              <ThrowableStudyDeck
                items={STUDY_ARCHIVE}
                activeIndex={activeDeckIndex}
                onActiveIndexChange={setActiveDeckIndex}
                onOpenStudy={(study) => setSelectedStudy(study)}
                throwTriggerCount={throwTriggerCount}
              />
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 4: HAIRLINE ROSTER ("Three Feature Cards" & Study Directory)
        ====================================================================== */}
        <section id="pillars-roster" className="bg-[#0A0C0E] hairline-t py-24 px-6">
          <div className="max-w-[1380px] mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-12 reveal-item">
              <div>
                <div className="label-caps text-[#E8913C] mb-2">
                  THREE FEATURE PILLARS · BEREAN STANDARD
                </div>
                <h2
                  className="font-syne font-extrabold text-[#EDE7DC] tracking-[-0.025em]"
                  style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)' }}
                >
                  DISCERNMENT PILLARS<span className="text-[#E8913C]">.</span>
                </h2>
              </div>
              <span className="label-caps text-[#6C7378]">
                SELECT ANY PILLAR TO OPEN THE BEREAN CHECKLIST
              </span>
            </div>

            {/* Hairline-Ruled Rows Carrying Small Uppercase Accent Label, Display-Face Name, and Right-Aligned Count/Reference */}
            <div className="hairline-t">
              {FEATURE_PILLARS.map((pillar, idx) => (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => {
                    setActivePillarForModal(pillar);
                    setStudyPlanModalOpen(true);
                  }}
                  className="group w-full text-left py-7 px-2 hairline-b flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#101317] transition-colors cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-8">
                    <span className="label-caps text-[#E8913C] w-40 shrink-0">
                      PILLAR 0{idx + 1} · {pillar.scriptureAnchor}
                    </span>
                    <span className="font-syne font-bold text-2xl sm:text-3xl text-[#EDE7DC] group-hover:text-[#E8913C] transition-colors tracking-[-0.02em]">
                      {pillar.title}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#9EA5A8] max-w-md md:mx-auto">
                    {pillar.description}
                  </p>

                  <div className="label-caps text-[#2E6B72] group-hover:text-[#E8913C] shrink-0 md:text-right tabular-nums">
                    0{pillar.principles.length} CRITERIA →
                  </div>
                </button>
              ))}
            </div>

            {/* Complete 6-Study Archive Quick Roster */}
            <div className="mt-16">
              <div className="label-caps text-[#6C7378] mb-4">
                COMPLETE STUDY ARCHIVE INDEX (06 VOLUMES)
              </div>
              <div className="hairline-t">
                {STUDY_ARCHIVE.map((study, idx) => (
                  <button
                    key={study.id}
                    type="button"
                    onClick={() => setSelectedStudy(study)}
                    className="group w-full text-left py-4 px-2 hairline-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#101317] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <img
                        src={study.image}
                        alt={study.title}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 object-cover hairline-border shrink-0"
                      />
                      <div>
                        <span className="label-caps text-[#2E6B72] block">
                          VOL. 0{idx + 1} · {study.category}
                        </span>
                        <span className="font-syne font-bold text-lg text-[#EDE7DC] group-hover:text-[#E8913C] transition-colors">
                          {study.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 sm:justify-end">
                      <span className="text-xs text-[#9EA5A8] hidden lg:inline max-w-sm truncate">
                        {study.cardSnippet}
                      </span>
                      <span className="label-caps text-[#E8913C] shrink-0 tabular-nums">
                        {study.keyVerseRef} →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 5: EXAMINE THE EVIDENCE & FEATURED SCRIPTURES TABLE
        ====================================================================== */}
        <section id="scripture-evidence" className="bg-[#101317] hairline-t py-24 px-6">
          <div className="max-w-[1380px] mx-auto">
            {/* Header & Search Input */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12 reveal-item">
              <div className="lg:col-span-7">
                <div className="label-caps text-[#E8913C] mb-2">
                  FEATURED SCRIPTURES &amp; BIBLICAL PROOF
                </div>
                <h2
                  className="font-syne font-extrabold text-[#EDE7DC] tracking-[-0.025em]"
                  style={{ fontSize: 'clamp(1.75rem, 3.4vw, 3rem)' }}
                >
                  EXAMINE THE EVIDENCE<span className="text-[#E8913C]">.</span>
                </h2>
              </div>

              <div className="lg:col-span-5">
                <label htmlFor="evidence-search" className="block label-caps text-[#9EA5A8] mb-2">
                  SEARCH SCRIPTURE REFERENCE OR DOCTRINAL KEYWORD
                </label>
                <div className="flex items-center bg-[#0A0C0E] hairline-border focus-within:border-[#E8913C] px-3.5 py-2.5">
                  <Search className="w-4 h-4 text-[#E8913C] shrink-0 mr-3" />
                  <input
                    id="evidence-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter a biblical question or Scripture reference..."
                    className="w-full bg-transparent text-xs sm:text-sm text-[#EDE7DC] placeholder-[#6C7378] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="label-caps text-[#9EA5A8] hover:text-[#E8913C] ml-2 cursor-pointer"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Manuscript Strip (Using the Cropped Book & Scroll Thumbnails + Featured References) */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-12">
              <button
                type="button"
                onClick={() => setSelectedEvidenceId('galatians-1-8-9')}
                className={`group relative h-24 overflow-hidden bg-[#0A0C0E] border text-left p-2.5 flex items-end cursor-pointer ${
                  activeEvidence.id === 'galatians-1-8-9'
                    ? 'border-[#E8913C]'
                    : 'border-[rgba(237,231,220,0.13)] hover:border-[#2E6B72]'
                }`}
              >
                <img
                  src="/assets/aistudio/evidence_book_thumb.png"
                  alt="Open Bible Manuscript"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform"
                />
                <span className="relative z-10 label-caps text-[#EDE7DC] bg-[#0A0C0E]/85 px-2 py-0.5">
                  GAL 1:8–9
                </span>
              </button>

              {['1-john-4-1', '1-thess-5-16-21', 'acts-17-11'].map((id) => {
                const ev = SCRIPTURE_EVIDENCE_LIST.find((x) => x.id === id)!;
                const isSel = activeEvidence.id === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedEvidenceId(id)}
                    className={`h-24 bg-[#0A0C0E] border p-3 flex flex-col justify-between text-left transition-colors cursor-pointer ${
                      isSel
                        ? 'border-[#E8913C]'
                        : 'border-[rgba(237,231,220,0.13)] hover:border-[#2E6B72]'
                    }`}
                  >
                    <span className="label-caps text-[#2E6B72]">FEATURED</span>
                    <span className="font-syne font-bold text-sm text-[#EDE7DC]">
                      {ev.shortLabel}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedEvidenceId('isaiah-8-20')}
                className={`group relative h-24 overflow-hidden bg-[#0A0C0E] border text-left p-2.5 flex items-end cursor-pointer ${
                  activeEvidence.id === 'isaiah-8-20'
                    ? 'border-[#E8913C]'
                    : 'border-[rgba(237,231,220,0.13)] hover:border-[#2E6B72]'
                }`}
              >
                <img
                  src="/assets/aistudio/evidence_scroll_thumb.png"
                  alt="Ancient Torah Scroll"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform"
                />
                <span className="relative z-10 label-caps text-[#EDE7DC] bg-[#0A0C0E]/85 px-2 py-0.5">
                  ISA 8:20
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEvidenceId('2-timothy-3-16-17')}
                className={`h-24 bg-[#0A0C0E] border p-3 flex flex-col justify-between text-left transition-colors cursor-pointer ${
                  activeEvidence.id === '2-timothy-3-16-17'
                    ? 'border-[#E8913C]'
                    : 'border-[rgba(237,231,220,0.13)] hover:border-[#2E6B72]'
                }`}
              >
                <span className="label-caps text-[#E8913C]">KJV TYPOGRAPHY</span>
                <span className="font-syne font-bold text-sm text-[#EDE7DC]">
                  2 Timothy 3:16–17
                </span>
              </button>
            </div>

            {/* Table with Uppercase Headers over a Hairline, Display-Face First Column, Collapsing to 2-Col Grid on Narrow Screens */}
            <div className="mb-10">
              {/* Desktop Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 pb-3 hairline-b label-caps text-[#6C7378]">
                <div className="col-span-3">SCRIPTURE REFERENCE</div>
                <div className="col-span-3">DOCTRINAL MANDATE</div>
                <div className="col-span-3">LEXICAL KEY</div>
                <div className="col-span-2">BOOK CONTEXT</div>
                <div className="col-span-1 text-right">EXEGESIS</div>
              </div>

              <div className="divide-y divide-[rgba(237,231,220,0.13)] hairline-b">
                {filteredEvidenceList.map((item) => {
                  const isSelected = activeEvidence.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedEvidenceId(item.id)}
                      className={`w-full text-left py-4 px-2 grid grid-cols-2 md:grid-cols-12 gap-y-2 gap-x-4 items-center transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#0A0C0E]' : 'hover:bg-[#0A0C0E]/60'
                      }`}
                    >
                      {/* Display-face first column */}
                      <div className="col-span-1 md:col-span-3 flex items-center gap-2.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isSelected ? 'bg-[#E8913C]' : 'bg-[#2E6B72]'
                          }`}
                        />
                        <span className="font-syne font-bold text-base sm:text-lg text-[#EDE7DC]">
                          {item.reference}
                        </span>
                      </div>

                      {/* Neutral metadata columns */}
                      <div className="col-span-1 md:col-span-3 text-xs sm:text-sm text-[#9EA5A8] md:text-left text-right">
                        {item.theme}
                      </div>

                      <div className="col-span-1 md:col-span-3 text-xs text-[#6C7378]">
                        {item.greekKey.split('—')[0]}
                      </div>

                      <div className="col-span-1 md:col-span-2 label-caps text-[#9EA5A8] md:text-left text-right">
                        {item.bookContext.split('·')[0]}
                      </div>

                      <div className="col-span-2 md:col-span-1 md:text-right label-caps text-[#E8913C]">
                        {isSelected ? 'ACTIVE' : 'VIEW →'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Scripture Exegesis & KJV Panel */}
            <div className="bg-[#0A0C0E] hairline-border p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="label-caps text-[#E8913C]">{activeEvidence.reference}</span>
                  <span className="text-[#6C7378]">/</span>
                  <span className="label-caps text-[#2E6B72]">{activeEvidence.bookContext}</span>
                </div>
                <blockquote className="font-syne font-semibold text-lg sm:text-2xl text-[#EDE7DC] leading-snug">
                  “{activeEvidence.kjvText}”
                </blockquote>
              </div>

              <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-[rgba(237,231,220,0.13)] lg:pl-8">
                <div>
                  <div className="label-caps text-[#2E6B72] mb-1">ORIGINAL LANGUAGE KEY</div>
                  <div className="text-xs sm:text-sm text-[#EDE7DC]">{activeEvidence.greekKey}</div>
                </div>
                <div>
                  <div className="label-caps text-[#E8913C] mb-1">PASTORAL EXEGESIS</div>
                  <p className="text-xs sm:text-sm text-[#9EA5A8] leading-relaxed">
                    {activeEvidence.commentary}
                  </p>
                </div>
                <div className="pt-2 hairline-t label-caps text-[#6C7378]">
                  CROSS-REFERENCES: {activeEvidence.crossReferences.join(' · ')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 6: CLOSE & CROPPED FULL-WIDTH WORDMARK
        ====================================================================== */}
        <section className="relative bg-[#0A0C0E] hairline-t pt-20 overflow-hidden">
          <div className="max-w-[1380px] mx-auto px-6">
            {/* Final Call to Action Split Row with Illuminated Open Bible */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end pb-16 hairline-b">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8913C]" />
                  <span className="label-caps text-[#E8913C]">FINAL CALL TO ACTION</span>
                </div>
                <h2
                  className="font-syne font-extrabold text-[#EDE7DC] tracking-[-0.03em] leading-[1.06]"
                  style={{ fontSize: 'clamp(2rem, 4.2vw, 3.75rem)' }}
                >
                  TEST EVERY SPIRIT<span className="text-[#E8913C]">.</span>
                  <br />
                  STAND IN TRUTH<span className="text-[#2E6B72]">.</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#9EA5A8] max-w-lg leading-relaxed">
                  Return to Scripture. Examine the context. Seek truth with humility. Grounded in
                  Scripture. Guided by Truth. Led by Pastor Shahid Hanif &amp; Pastor Sandesh
                  Shalom.
                </p>
              </div>

              {/* Opposite Edge: Illuminated Open Bible Thumbnail + Two Buttons */}
              <div className="lg:col-span-5 flex flex-col lg:items-end justify-between gap-6">
                <div className="w-44 h-28 overflow-hidden hairline-border bg-[#101317]">
                  <img
                    src="/assets/aistudio/cta_open_bible.png"
                    alt="Illuminated open Holy Bible"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-right"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePillarForModal(FEATURE_PILLARS[0]);
                      setStudyPlanModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-full bg-transparent border border-[#E8913C] label-caps text-[#E8913C] hover:text-[#EDE7DC] hover:border-[#EDE7DC] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    BEGIN YOUR SCRIPTURE STUDY
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('study-archive')}
                    className="px-6 py-3 rounded-full bg-transparent hairline-border label-caps text-[#EDE7DC] hover:text-[#E8913C] hover:border-[#E8913C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    EXPLORE ARCHIVE
                  </button>
                </div>
              </div>
            </div>

            {/* Hairline Footer Strip */}
            <div className="py-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/nav_cross_logo.png"
                  alt="Cross Emblem"
                  referrerPolicy="no-referrer"
                  className="h-5 w-auto object-contain opacity-80"
                />
                <span className="label-caps text-[#9EA5A8]">
                  GROUNDED IN SCRIPTURE · GUIDED BY TRUTH
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {[
                  { label: 'Bible Studies', id: 'study-archive' },
                  { label: 'Scripture', id: 'scripture-evidence' },
                  { label: 'About', id: 'statement-fold' }
                ].map((nav) => (
                  <a
                    key={nav.label}
                    href={`#${nav.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(nav.id);
                    }}
                    className="label-caps text-[#6C7378] hover:text-[#E8913C] transition-colors whitespace-nowrap shrink-0"
                  >
                    {nav.label}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setActivePillarForModal(FEATURE_PILLARS[0]);
                    setStudyPlanModalOpen(true);
                  }}
                  className="label-caps text-[#6C7378] hover:text-[#E8913C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Contact
                </button>
              </div>

              <div className="label-caps text-[#6C7378]">
                PASTOR SHAHID HANIF &amp; PASTOR SANDESH SHALOM
              </div>
            </div>
          </div>

          {/* Full-Width Wordmark Translated Down Slightly so the Page Edge Crops It */}
          <div
            aria-hidden="true"
            className="w-full overflow-hidden select-none pointer-events-none pt-2"
          >
            <div
              className="font-syne font-extrabold uppercase text-[#EDE7DC] text-center whitespace-nowrap leading-[0.82] tracking-[-0.035em] translate-y-[24%]"
              style={{ fontSize: 'clamp(3.2rem, 11.2vw, 11.5rem)' }}
            >
              TEST THE SPIRIT<span className="text-[#E8913C]">.</span>
            </div>
          </div>
        </section>
      </main>

      {/* Interactive Study Guide & Berean Framework Modals */}
      <StudyReaderModal
        study={selectedStudy}
        onClose={() => setSelectedStudy(null)}
        onSelectStudy={(nextStudy) => setSelectedStudy(nextStudy)}
      />

      <StudyPlanModal
        isOpen={studyPlanModalOpen}
        initialPillar={activePillarForModal}
        onClose={() => setStudyPlanModalOpen(false)}
        onOpenStudy={(study) => setSelectedStudy(study)}
      />
    </div>
  );
}
