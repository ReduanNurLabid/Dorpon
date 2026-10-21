import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  getLocalizedCategory, 
  formatRelativeTime, 
  toBanglaDigits 
} from '../utils/bilingual';
import confetti from 'canvas-confetti';

export const StudyCanvasModal: React.FC = () => {
  const {
    activeStory,
    closeStory,
    language,
    isSerif,
    setIsSerif,
    fontSize,
    setFontSize,
    isSaved,
    toggleSave,
    playStoryAudio,
    pauseAudio,
    resumeAudio,
    isPlayingAudio,
    currentAudioStory,
    audioProgress,
    audioPlaybackRate,
    setAudioPlaybackRate,
    seekAudio,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [insightfulCount, setInsightfulCount] = useState(142);
  const [hasVotedInsightful, setHasVotedInsightful] = useState(false);
  const [highYieldCount, setHighYieldCount] = useState(89);
  const [hasVotedHighYield, setHasVotedHighYield] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeStory();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeStory]);

  if (!activeStory) return null;

  const isBn = language === 'bn';
  const buzz = activeStory.daily_buzz;
  const bcs = activeStory.bcs_pro;
  const bookmarked = isSaved(activeStory.story_id);
  const isAudioActive = currentAudioStory?.story_id === activeStory.story_id && isPlayingAudio;
  const isAudioCurrentStory = currentAudioStory?.story_id === activeStory.story_id;

  const headline = isBn
    ? (buzz.title_bn || buzz.title_en)
    : (buzz.title_en || buzz.title_bn);

  const lead = isBn
    ? (buzz.lead_bn || buzz.summary_bn || buzz.lead_en)
    : (buzz.lead_en || buzz.summary_en || buzz.lead_bn);

  const rawBullets = isBn
    ? (buzz.bullets_bn && buzz.bullets_bn.length > 0 ? buzz.bullets_bn : [buzz.summary_bn])
    : (buzz.bullets_en && buzz.bullets_en.length > 0 ? buzz.bullets_en : [buzz.summary_en]);

  const cleanText = (str?: string) => {
    if (!str) return '';
    return str
      .replace(/^\s*[*_\-•\d.)]+\s*/, '')
      .replace(/\s*[*_]+\s*$/, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .trim();
  };

  const bullets = rawBullets.map(b => cleanText(b)).filter(Boolean);

  const whyItMatters = cleanText(
    isBn
      ? (buzz.why_it_matters_bn || buzz.impact_bn || '')
      : (buzz.why_it_matters_en || buzz.impact_en || '')
  );

  const coreStory = cleanText(
    isBn
      ? (buzz.details_bn || buzz.summary_bn)
      : (buzz.details_en || buzz.summary_en)
  );

  const categoryLabel = getLocalizedCategory(activeStory.primary_category, isBn);
  const timeFormatted = formatRelativeTime(activeStory.published_at, isBn);
  const serialRef = `Ref #${activeStory.story_id.slice(0, 8).toUpperCase()}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: headline,
          text: whyItMatters || headline,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(`${headline}\n${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVoteInsightful = () => {
    if (hasVotedInsightful) {
      setInsightfulCount(prev => prev - 1);
      setHasVotedInsightful(false);
    } else {
      setInsightfulCount(prev => prev + 1);
      setHasVotedInsightful(true);
      try {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      } catch {}
    }
  };

  const handleVoteHighYield = () => {
    if (hasVotedHighYield) {
      setHighYieldCount(prev => prev - 1);
      setHasVotedHighYield(false);
    } else {
      setHighYieldCount(prev => prev + 1);
      setHasVotedHighYield(true);
      try {
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
      } catch {}
    }
  };

  const toggleThisStoryAudio = () => {
    if (isAudioActive) {
      pauseAudio();
    } else if (isAudioCurrentStory) {
      resumeAudio();
    } else {
      playStoryAudio(activeStory);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currIdx = speeds.indexOf(audioPlaybackRate);
    const nextIdx = (currIdx + 1) % speeds.length;
    setAudioPlaybackRate(speeds[nextIdx]);
  };

  const cycleFontSize = () => {
    if (fontSize === 'sm') setFontSize('base');
    else if (fontSize === 'base') setFontSize('lg');
    else setFontSize('sm');
  };

  const textBodySize =
    fontSize === 'sm' ? 'text-sm sm:text-base leading-relaxed' :
    fontSize === 'lg' ? 'text-lg sm:text-xl leading-loose' :
    'text-base sm:text-lg leading-relaxed';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-y-auto backdrop-blur-md bg-[#21201D]/75 animate-fadeIn paper-texture"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeStory();
        }
      }}
    >
      {/* BEGIN: ArticleReadingSheetModal */}
      <main 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-paper border-2 border-ink shadow-2xl relative my-auto p-4 sm:p-7 md:p-10 registration-mark transition-all duration-200 text-ink font-serif max-h-[92vh] overflow-y-auto custom-scroll" 
        data-purpose="broadsheet-modal-container" 
        id="article-intelligence-dossier"
      >
        {/* Top Registration Header Bar & Masthead Stamp */}
        <div className="flex items-center justify-between border-b border-ink/40 pb-2 mb-4 font-sans text-[11px] tracking-wider uppercase text-ink-muted">
          <span>{isBn ? `সন্দেশ এক্সপ্রেস ব্রিফিং • সিরিয়াল ${serialRef}` : `SONDESH EXPRESS BRIEFING • SERIAL ARCHIVE ${serialRef}`}</span>
          <span className="hidden sm:inline">{isBn ? '৩-স্তরীয় স্ক্যানযোগ্য ডসিয়ার সিস্টেম' : '3-TIER SCANNABLE DOSSIER SYSTEM'}</span>
          <span>{isBn ? 'সংস্করণ: আন্তর্জাতিক ওয়্যার' : 'EDITION: DIPLOMATIC WIRE'}</span>
        </div>

        {/* BEGIN: ModalControlBar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-4 mb-6" data-purpose="top-navigation-strip">
          {/* Back to Broadsheet Trigger */}
          <button 
            onClick={closeStory}
            className="inline-flex items-center gap-2 font-serif text-sm font-semibold tracking-wide text-ink hover:text-accent-emerald hover:underline transition-colors px-2 py-1 rounded focus:outline-none cursor-pointer" 
            data-purpose="back-navigation-button" 
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>{isBn ? 'ব্রডশিটে ফিরে যান' : 'Return to Broadsheet'}</span>
          </button>

          {/* Center Classified Department Capsule */}
          <div className="border border-ink px-3 py-1 font-sans text-[10px] md:text-xs font-bold tracking-[0.18em] uppercase bg-paper-box text-ink shadow-[1px_1px_0px_#141414]" data-purpose="department-capsule-badge">
            {categoryLabel}
          </div>

          {/* Right Action Utilities (Audio, Text Resizer, Bookmark, Close) */}
          <div className="flex items-center space-x-1 sm:space-x-2" data-purpose="reader-actions">
            {/* Audio quick toggle */}
            <button 
              onClick={toggleThisStoryAudio}
              aria-label="Toggle Audio Mode" 
              className={`w-8 h-8 rounded-full border border-ink/50 hover:border-ink hover:bg-paper-dim flex items-center justify-center text-ink transition-colors cursor-pointer ${
                isAudioActive ? 'bg-accent-emerald text-paper border-accent-emerald' : ''
              }`} 
              title={isBn ? 'অডিও মোড' : 'Audio Mode'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>

            {/* Typography Font Size Toggle */}
            <button 
              onClick={cycleFontSize}
              aria-label="Adjust font size" 
              className="w-8 h-8 rounded-full border border-ink/50 hover:border-ink hover:bg-paper-dim flex items-center justify-center font-serif text-sm font-bold text-ink transition-colors cursor-pointer" 
              title={isBn ? `ফন্ট সাইজ (${fontSize})` : `Adjust Font Size (${fontSize})`}
            >
              Aa
            </button>

            {/* Typography Serif/Sans Toggle */}
            <button 
              onClick={() => setIsSerif(!isSerif)}
              aria-label="Toggle Serif" 
              className={`w-8 h-8 rounded-full border border-ink/50 hover:border-ink hover:bg-paper-dim flex items-center justify-center text-xs font-bold text-ink transition-colors cursor-pointer ${
                isSerif ? 'bg-paper-dim border-ink' : ''
              }`} 
              title={isSerif ? 'Sans-Serif' : 'Serif'}
            >
              T
            </button>

            {/* Save Citation / Bookmark */}
            <button 
              onClick={() => toggleSave(activeStory.story_id)}
              aria-label="Bookmark article" 
              className={`w-8 h-8 rounded-full border border-ink/50 hover:border-ink hover:bg-paper-dim flex items-center justify-center text-ink transition-colors cursor-pointer ${
                bookmarked ? 'bg-ink text-paper' : ''
              }`} 
              title={isBn ? 'সংরক্ষণ করুন' : 'Add to Revision Binder'}
            >
              <svg className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>

            {/* Dismiss Modal Button */}
            <button 
              onClick={closeStory}
              aria-label="Close modal dialog" 
              className="w-8 h-8 rounded-full border-2 border-ink hover:bg-ink hover:text-paper flex items-center justify-center text-ink transition-colors ml-1 cursor-pointer" 
              title={isBn ? 'বন্ধ করুন' : 'Close Dossier'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
          </div>
        </header>
        {/* END: ModalControlBar */}

        {/* BEGIN: AudioBriefingWidget */}
        <section className="mb-6 bg-paper-box border border-ink p-3 sm:p-4 rounded-sm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-purpose="audio-broadcast-strip">
          <div className="flex items-center gap-3.5">
            {/* Play / Pause Ink Button */}
            <button 
              onClick={toggleThisStoryAudio}
              aria-label="Play audio briefing" 
              className="w-10 h-10 rounded-full bg-ink text-paper hover:bg-accent-emerald flex items-center justify-center shrink-0 transition-colors shadow-sm focus:outline-none cursor-pointer" 
              data-purpose="play-audio-button" 
              type="button"
            >
              {isAudioActive ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"></path>
                </svg>
              )}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base text-ink">
                  {isBn ? 'অডিও ব্রিফিং শুনুন' : 'Listen to Audio Briefing'}
                </span>
                <span className="font-sans text-[9px] uppercase font-bold tracking-widest bg-ink text-paper px-1.5 py-0.5 rounded">
                  AI Voice
                </span>
              </div>
              <p className="font-sans text-xs text-ink-muted">
                {isBn 
                  ? `${toBanglaDigits(Math.ceil((buzz.read_time_seconds || 60) / 60))} মিনিট পাঠ • ব্রডকাস্ট টেলিমেট্রি`
                  : `${Math.ceil((buzz.read_time_seconds || 60) / 60)} min read • Broadcast telemetry synthesized`}
              </p>
            </div>
          </div>

          {/* Playback Speed & Sound Waveform Indicator */}
          <div className="flex items-center gap-3 self-end sm:self-center font-sans text-xs text-ink-muted">
            {isAudioCurrentStory && (
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                  seekAudio(pct);
                }}
                className="w-24 sm:w-32 h-2 bg-ink/20 rounded-full overflow-hidden cursor-pointer relative"
                title="Seek audio"
              >
                <div 
                  className="h-full bg-accent-emerald transition-all duration-100" 
                  style={{ width: `${Number.isFinite(audioProgress) ? Math.max(0, Math.min(100, audioProgress)) : 0}%` }}
                />
              </div>
            )}

            <div aria-hidden="true" className="flex items-end gap-0.5 h-4 px-2">
              <span className={`w-0.5 ${isAudioActive ? 'h-2 bg-accent-emerald animate-pulse' : 'h-2 bg-ink/40'}`}></span>
              <span className={`w-0.5 ${isAudioActive ? 'h-3.5 bg-accent-emerald animate-pulse delay-75' : 'h-3 bg-ink'}`}></span>
              <span className={`w-0.5 ${isAudioActive ? 'h-4 bg-accent-emerald animate-pulse delay-150' : 'h-4 bg-ink/70'}`}></span>
              <span className={`w-0.5 ${isAudioActive ? 'h-2 bg-accent-emerald animate-pulse delay-100' : 'h-1.5 bg-ink/40'}`}></span>
              <span className={`w-0.5 ${isAudioActive ? 'h-3 bg-accent-emerald animate-pulse' : 'h-3.5 bg-ink'}`}></span>
            </div>

            <button 
              onClick={cycleSpeed}
              className="border border-ink/40 hover:border-ink px-2 py-0.5 rounded text-[11px] font-medium uppercase hover:bg-paper cursor-pointer font-mono"
            >
              {audioPlaybackRate.toFixed(1)}x Speed
            </button>
          </div>
        </section>
        {/* END: AudioBriefingWidget */}

        {/* BEGIN: ArticleHeadlineAndMeta */}
        <article className="space-y-6" data-purpose="editorial-article-body">
          <div className="border-b border-ink/20 pb-4">
            {/* Wire Dispatch Stamp and Timestamp */}
            <div className="font-sans text-xs uppercase tracking-wider text-ink-faint font-semibold mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{timeFormatted}</span>
              <span className="text-ink/30">•</span>
              <span className="text-ink font-bold">
                {activeStory.sources.length > 0 ? activeStory.sources[0].name : 'Dorpon Intelligence'}
              </span>
              <span className="text-ink/30">•</span>
              <span>{isBn ? 'টেলিমেট্রি ডেস্ক কর্তৃক দাখিলকৃত' : 'Filed by Telemetry Desk'}</span>
              <span className="text-ink/30">•</span>
              <span className="font-mono text-[11px] bg-paper-dim px-1.5 py-0.2 border border-ink/20">
                {serialRef}
              </span>
            </div>

            {/* Big Broadsheet Display Headline */}
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink leading-tight tracking-tight mt-1 mb-2">
              {headline}
            </h1>

            {/* Sub-lead sentence */}
            {lead && (
              <p className="font-serif text-lg md:text-xl italic text-ink-muted leading-snug">
                {lead}
              </p>
            )}
          </div>
          {/* END: ArticleHeadlineAndMeta */}

          {/* BEGIN: KeyTakeway */}
          {bullets.length > 0 && (
            <section className="bg-paper-tint border-2 border-accent-emerald/80 p-4 sm:p-5 rounded-none relative" data-purpose="tier-1-core-takeaway">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-accent-emerald text-base font-bold">✦</span>
                <h2 className="font-sans text-xs sm:text-sm font-bold uppercase tracking-wider text-accent-emerald">
                  {isBn ? 'মূল বিষয়' : 'Key Takeway'}
                </h2>
              </div>
              <ul className="space-y-2.5 font-serif text-[15px] sm:text-base text-ink leading-relaxed">
                {bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald mt-2 shrink-0"></span>
                    <div>{bullet}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {/* END: CoreTakeawayIntelligence */}

          {/* BEGIN: WhyItMattersBox */}
          {whyItMatters && (
            <section className="bg-paper-ochre ink-border-double p-4 sm:p-5 relative" data-purpose="tier-2-why-it-matters">
              <div className="flex items-center gap-2 mb-2 font-sans text-xs font-bold uppercase tracking-wider text-accent-amber">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span>{isBn ? 'কেন এটি তাৎপর্যপূর্ণ — নির্বাহী বিশ্লেষণ' : 'Why It Matters — Executive Synthesis'}</span>
              </div>
              <p className="font-serif text-base sm:text-[17px] text-ink leading-relaxed font-normal">
                {whyItMatters}
              </p>

              {/* Jurisprudential / Constitutional Policy Anchor */}
              {bcs && bcs.constitutional_articles && bcs.constitutional_articles.length > 0 ? (
                <div className="mt-3 pt-2.5 border-t border-ink/20 font-sans text-xs text-ink-muted flex items-start gap-1.5">
                  <span className="font-semibold uppercase tracking-wider text-ink text-[10px]">
                    {isBn ? 'সাংবিধানিক প্রাসঙ্গিকতা:' : 'Institutional Nexus:'}
                  </span>
                  <span>
                    {bcs.constitutional_articles[0].article_number} ({isBn ? bcs.constitutional_articles[0].article_title_bn : bcs.constitutional_articles[0].article_title_en}) — {bcs.constitutional_articles[0].legal_relevance}
                  </span>
                </div>
              ) : (
                <div className="mt-3 pt-2.5 border-t border-ink/20 font-sans text-xs text-ink-muted flex items-start gap-1.5">
                  <span className="font-semibold uppercase tracking-wider text-ink text-[10px]">
                    {isBn ? 'প্রাতিষ্ঠানিক সংযোগ:' : 'Institutional Nexus:'}
                  </span>
                  <span>
                    {isBn
                      ? 'জাতীয় নীতি সুরক্ষা, সুশাসন ও নির্বাহী নির্দেশিকা কাঠামোর অধীন।'
                      : 'Executive Governance, Public Interest Oversight & Regulatory Compliance Protocol.'}
                  </span>
                </div>
              )}
            </section>
          )}
          {/* END: WhyItMattersBox */}

          {/* BEGIN: CoreContextAndNewsWireImage */}
          <section className="space-y-4" data-purpose="tier-3-core-narrative">
            {coreStory && (
              <div>
                <h3 className="font-sans text-[11px] font-bold uppercase tracking-widest text-ink-faint mb-1.5">
                  {isBn ? 'মূল প্রতিবেদন' : 'The Core Story'}
                </h3>
                <p className={`font-serif ${textBodySize} text-ink leading-relaxed`}>
                  {coreStory}
                </p>
              </div>
            )}

            {/* Wire Archive Photo Box with Halftone Editorial Treatment */}
            {activeStory.image_url && (
              <figure className="border border-ink p-1 bg-paper-box">
                <div className="overflow-hidden bg-ink/10 max-h-60 sm:max-h-72">
                  <img 
                    alt={activeStory.image_caption || headline} 
                    className="w-full h-48 sm:h-60 object-cover newsprint-filter" 
                    src={activeStory.image_url} 
                  />
                </div>
                <figcaption className="px-2 pt-2 pb-1 font-sans text-[11px] text-ink-muted flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-ink/10 mt-1">
                  <span>
                    {activeStory.image_caption || (isBn ? 'আর্কাইভাল টেলিমেট্রি: তথ্য ও সম্প্রচার চিত্র প্রতিবেদন।' : 'Archival Telemetry: Dorpon Intelligence photo report.')}
                  </span>
                  <span className="font-semibold uppercase text-ink text-[10px] tracking-wide shrink-0">
                    WIRE: DORPON BUREAU
                  </span>
                </figcaption>
              </figure>
            )}
          </section>
          {/* END: CoreContextAndNewsWireImage */}

          {/* BEGIN: VerifiedSourceCitations */}
          <section className="pt-2 border-t border-ink/20" data-purpose="verified-sources-dossiers">
            <h4 className="font-sans text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2.5">
              {isBn ? 'যাচাইকৃত সূত্র ও উন্মুক্ত তথ্যসূত্র' : 'Verified Sources & Public Records'}
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {activeStory.sources.map((src, idx) => (
                <a 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-dim border border-ink text-xs font-sans font-semibold text-ink hover:bg-ink hover:text-paper transition-colors" 
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{src.name}</span>
                  <span className="text-[10px]">↗</span>
                </a>
              ))}
              <span className="font-mono text-[11px] text-ink-faint px-2 py-1">
                Ref #{activeStory.story_id.slice(0, 12)}
              </span>
            </div>
          </section>
          {/* END: VerifiedSourceCitations */}

          {/* BEGIN: AnalyticalTelemetryDossier */}
          {bcs?.data_stats && bcs.data_stats.length > 0 && (
            <aside className="border border-ink bg-paper-box p-3.5 sm:p-4 text-xs font-sans text-ink space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold tracking-wider uppercase text-[10px] bg-ink text-paper px-2 py-0.5">
                  {isBn ? 'যাচাইকৃত পরিসংখ্যান ও উপাত্ত' : 'Verified Telemetry & Empirical Data'}
                </span>
                <span className="font-mono text-[10px] text-accent-emerald font-semibold uppercase">
                  Verified Data
                </span>
              </div>
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bcs.data_stats.map((stat, sIdx) => (
                  <div key={sIdx} className="p-2.5 border border-ink/30 bg-paper">
                    <span className="font-bold text-accent-emerald block text-sm">{stat.value}</span>
                    <span className="font-semibold text-ink text-xs">{stat.metric_name}</span>
                    {stat.context && <span className="text-[11px] text-ink-muted block mt-0.5">{stat.context}</span>}
                  </div>
                ))}
              </div>
            </aside>
          )}
          {/* END: AnalyticalTelemetryDossier */}
        </article>

        {/* BEGIN: EngagementFooterControls */}
        <footer className="mt-8 pt-4 border-t-2 border-ink flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs" data-purpose="article-footer-toolbar">
          {/* Reader Evaluation Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleVoteInsightful}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink font-medium text-ink transition-colors cursor-pointer ${
                hasVotedInsightful ? 'bg-paper-dim border-accent-amber font-bold' : 'bg-paper hover:bg-paper-dim'
              }`} 
              type="button"
            >
              <span className="text-accent-amber">💡</span>
              <span>{isBn ? 'তথ্যসমৃদ্ধ' : 'Insightful'}</span>
              <span className="text-ink-faint font-semibold ml-0.5">({insightfulCount})</span>
            </button>

            <button 
              onClick={handleVoteHighYield}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink font-medium text-ink transition-colors cursor-pointer ${
                hasVotedHighYield ? 'bg-paper-dim border-accent-brick font-bold' : 'bg-paper hover:bg-paper-dim'
              }`} 
              type="button"
            >
              <span className="text-accent-brick">⚡</span>
              <span>{isBn ? 'উচ্চ ফলনশীল' : 'High Yield'}</span>
              <span className="text-ink-faint font-semibold ml-0.5">({highYieldCount})</span>
            </button>

            <button 
              onClick={() => toggleSave(activeStory.story_id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink/40 bg-paper hover:border-ink font-medium text-ink transition-colors cursor-pointer" 
              type="button"
            >
              <span>{bookmarked ? '✓' : '🔖'}</span>
              <span>{bookmarked ? (isBn ? 'সংরক্ষিত' : 'Saved') : (isBn ? 'সংরক্ষণ' : 'Save Dossier')}</span>
            </button>

            <button 
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink/40 bg-paper hover:border-ink font-medium text-ink transition-colors cursor-pointer" 
              type="button"
            >
              <span>↗</span>
              <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'শেয়ার' : 'Share')}</span>
            </button>
          </div>

          {/* Prominent Return Button */}
          <button 
            onClick={closeStory}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-ink text-paper hover:bg-accent-emerald font-serif text-sm font-semibold tracking-wide transition-colors cursor-pointer" 
            data-purpose="bottom-close-button" 
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>{isBn ? 'মূল পাতায় ফিরে যান' : 'Back to Front Page'}</span>
          </button>
        </footer>
        {/* END: EngagementFooterControls */}

        {/* Micro Print Imprint Footer */}
        <div className="mt-4 pt-2 border-t border-ink/20 flex items-center justify-between text-[10px] font-sans text-ink-faint uppercase tracking-widest">
          <span>{isBn ? 'সন্দেশ এক্সপ্রেস' : 'Sondesh Express'}</span>
          <span>{isBn ? 'যাচাইকৃত ৩-স্তরীয় ফরম্যাট' : 'Verified 3-Tier Scannable Format'}</span>
          <span>{isBn ? 'ঢাকা ও জেনেভায় প্রকাশিত' : 'Published in Dhaka & Geneva'}</span>
        </div>
      </main>
      {/* END: ArticleReadingSheetModal */}
    </div>
  );
};
