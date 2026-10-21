import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CapsuleStory } from '../types';
import { formatRelativeTime, getLocalizedCategory, toBanglaDigits } from '../utils/bilingual';
import { 
  Share2, 
  Lightbulb, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  FileText, 
  Mail,
  ArrowRight
} from 'lucide-react';

export const BroadsheetFrontPage: React.FC = () => {
  const { 
    buzzStories, 
    hourlyWires, 
    currentAffairs, 
    openStory, 
    language,
    setIsSettingsOpen
  } = useApp();

  const isBn = language === 'bn';
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [subscribedMessage, setSubscribedMessage] = useState(false);
  const [insightCount, setInsightCount] = useState<Record<string, number>>({});
  const [highYieldCount, setHighYieldCount] = useState<Record<string, number>>({});

  // Helper getters for bilingual content
  const getTitle = (story?: CapsuleStory | null) => {
    if (!story) return '';
    return isBn 
      ? (story.daily_buzz.title_bn || story.daily_buzz.title_en) 
      : (story.daily_buzz.title_en || story.daily_buzz.title_bn);
  };

  const getLead = (story?: CapsuleStory | null) => {
    if (!story) return '';
    return isBn
      ? (story.daily_buzz.lead_bn || story.daily_buzz.summary_bn || story.daily_buzz.lead_en)
      : (story.daily_buzz.lead_en || story.daily_buzz.summary_en || story.daily_buzz.lead_bn);
  };

  const getBullets = (story?: CapsuleStory | null): string[] => {
    if (!story) return [];
    const bullets = isBn 
      ? (story.daily_buzz.bullets_bn || story.daily_buzz.bullets_en) 
      : (story.daily_buzz.bullets_en || story.daily_buzz.bullets_bn);
    
    if (bullets && bullets.length > 0) return bullets.slice(0, 3);
    
    // Fallback: split summary into clean bullets if explicit bullets array is missing
    const summary = isBn ? story.daily_buzz.summary_bn : story.daily_buzz.summary_en;
    if (summary) {
      return summary
        .split(/(?<=[.!?।])\s+/)
        .filter(s => s.trim().length > 15)
        .slice(0, 3);
    }
    return [];
  };

  const getWhyItMatters = (story?: CapsuleStory | null) => {
    if (!story) return '';
    return isBn
      ? (story.daily_buzz.why_it_matters_bn || story.daily_buzz.impact_bn || story.daily_buzz.summary_bn)
      : (story.daily_buzz.why_it_matters_en || story.daily_buzz.impact_en || story.daily_buzz.summary_en);
  };

  const getCoreStory = (story?: CapsuleStory | null) => {
    if (!story) return '';
    return isBn
      ? (story.daily_buzz.details_bn || story.daily_buzz.summary_bn)
      : (story.daily_buzz.details_en || story.daily_buzz.summary_en);
  };

  const handleShare = async (story: CapsuleStory, e: React.MouseEvent) => {
    e.stopPropagation();
    const title = getTitle(story);
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: window.location.href,
        });
      } catch {
        // User dismissed
      }
    } else {
      navigator.clipboard.writeText(`${title} - ${window.location.href}`);
      alert(isBn ? 'সংবাদের লিঙ্ক কপি করা হয়েছে!' : 'Briefing link copied to clipboard!');
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribedEmail) {
      setSubscribedMessage(true);
      setTimeout(() => setSubscribedMessage(false), 5000);
      setSubscribedEmail('');
    }
  };

  // Divide available stories across the broadsheet columns
  const heroStory = buzzStories[0] || hourlyWires[0] || null;
  const leftStories = buzzStories.slice(1, 3);
  const wireDeskStories = hourlyWires.length > 0 ? hourlyWires.slice(0, 3) : buzzStories.slice(3, 6);
  
  // Lower 3-column investigations: prioritize current affairs or deeper buzz stories
  const lowerStories = currentAffairs.length >= 3 
    ? currentAffairs.slice(0, 3) 
    : (buzzStories.length > 4 ? buzzStories.slice(3, 6) : buzzStories.slice(0, 3));



  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 12-COLUMN BROADSHEET INK GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-l border-t border-primary/20 bg-background shadow-sm">
        
        {/* ============================================================== */}
        {/* COLUMN 1: Left 25% (Cols 1-3) Secondary Lead Briefings */}
        {/* ============================================================== */}
        <section className="md:col-span-3 border-r border-b border-primary/20 p-4 bg-background flex flex-col justify-between">
          <div className="space-y-6">
            {leftStories.map((story, idx) => {
              const title = getTitle(story);
              const bullets = getBullets(story);
              const whyItMatters = getWhyItMatters(story);
              const coreStory = getCoreStory(story);
              const timeStr = formatRelativeTime(story.published_at, isBn);
              const categoryLabel = getLocalizedCategory(story.primary_category, isBn);
              const primarySource = story.sources && story.sources.length > 0 ? story.sources[0] : null;

              return (
                <article key={story.story_id || idx} className="pb-5 border-b border-outline-variant last:border-b-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-sm text-label-sm uppercase text-secondary font-bold tracking-wider">
                      {categoryLabel}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {timeStr}
                    </span>
                  </div>

                  <h2 
                    onClick={() => openStory(story)}
                    className="font-serif text-lg sm:text-[19px] leading-[1.3] text-primary font-bold hover:text-secondary transition-colors cursor-pointer mb-2.5"
                  >
                    {title}
                  </h2>

                  {/* Thumbnail if present for second story */}
                  {idx === 1 && story.image_url && (
                    <div className="my-2.5 border border-primary/30 overflow-hidden cursor-pointer" onClick={() => openStory(story)}>
                      <img 
                        src={story.image_url} 
                        alt={title}
                        className="w-full h-28 object-cover filter grayscale contrast-125 hover:filter-none transition-all duration-300" 
                      />
                    </div>
                  )}

                  {/* TIER 1: Key Takeway */}
                  {bullets.length > 0 && (
                    <div className="rounded border border-secondary/40 bg-secondary-container/15 p-2.5 mb-2.5">
                      <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-bold uppercase mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-secondary" />
                        <span>{isBn ? 'মূল বিষয়' : 'Key Takeway'}</span>
                      </div>
                      <ul className="space-y-1.5 font-serif text-xs leading-snug text-on-surface">
                        {bullets.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-1.5">
                            <span className="text-secondary font-bold leading-none mt-0.5">❖</span>
                            <span>{b.replace(/^\*\*(.*?)\*\*/, '$1')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* TIER 2: Why It Matters */}
                  {whyItMatters && (
                    <div className="rounded border-l-2 border-secondary bg-surface-container p-2.5 mb-2.5">
                      <div className="flex items-center gap-1 font-label-sm text-label-sm font-bold uppercase text-on-tertiary-container mb-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isBn ? 'কেন এটি গুরুত্বপূর্ণ' : 'Why It Matters'}</span>
                      </div>
                      <p className="font-serif text-xs text-on-surface-variant leading-relaxed">
                        {whyItMatters}
                      </p>
                    </div>
                  )}

                  {/* TIER 3: The Core Story & Sources */}
                  <div className="pt-1">
                    <div className="font-label-sm text-label-sm uppercase font-bold text-outline mb-1">
                      {isBn ? 'মূল প্রতিবেদন' : 'The Core Story'}
                    </div>
                    <p 
                      onClick={() => openStory(story)}
                      className="font-serif text-xs text-on-surface leading-relaxed mb-2.5 line-clamp-3 hover:text-secondary cursor-pointer"
                    >
                      {coreStory}
                    </p>

                    <div className="flex items-center justify-between text-label-sm font-label-sm pt-1.5 border-t border-dashed border-outline-variant">
                      <span className="text-outline uppercase">{isBn ? 'যাচাইকৃত সূত্র:' : 'Verified Sources:'}</span>
                      {primarySource ? (
                        <a 
                          href={primarySource.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 bg-surface-container-high border border-outline-variant px-2 py-0.5 text-primary hover:border-secondary font-semibold transition-colors"
                        >
                          <span>{primarySource.name}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-on-surface-variant font-semibold">Dorpon Wire</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* COLUMN 2: Center 50% (Cols 4-9) Hero Executive Dossier */}
        {/* ============================================================== */}
        {heroStory ? (
          <article className="md:col-span-6 border-r border-b border-primary/20 p-5 sm:p-6 bg-background flex flex-col justify-between">
            <div>
              {/* Story Header Metadata & Actions */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-label-sm text-label-sm uppercase font-bold text-secondary tracking-wider">
                    {getLocalizedCategory(heroStory.primary_category, isBn)}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    • {formatRelativeTime(heroStory.published_at, isBn)}
                    {heroStory.sources && heroStory.sources.length > 0 && ` • ${heroStory.sources[0].name}`}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-on-surface-variant">
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1 hover:text-primary transition-colors cursor-pointer" 
                    title={isBn ? 'সেটিংস' : 'Settings'}
                  >
                    <span className="font-bold text-xs uppercase px-1 border border-outline-variant rounded">T</span>
                  </button>
                </div>
              </div>

              {/* Hero Headline */}
              <h1 
                onClick={() => openStory(heroStory)}
                className="font-serif text-2xl sm:text-3xl lg:text-[34px] leading-[1.15] text-primary font-bold tracking-tight mb-2 hover:text-secondary cursor-pointer transition-colors"
              >
                {getTitle(heroStory)}
              </h1>

              {/* Lead / Subhead */}
              {getLead(heroStory) && (
                <p className="font-serif text-base sm:text-lg italic text-on-surface-variant mb-4 leading-snug">
                  {getLead(heroStory)}
                </p>
              )}

              {/* Hero Lead Broadsheet Image */}
              {heroStory.image_url && (
                <div className="border border-primary/40 mb-4 cursor-pointer" onClick={() => openStory(heroStory)}>
                  <img 
                    src={heroStory.image_url} 
                    alt={getTitle(heroStory)} 
                    className="w-full h-56 sm:h-72 object-cover filter contrast-125 grayscale hover:filter-none transition-all duration-300"
                  />
                  <div className="p-2 bg-surface-container-high border-t border-primary/20 flex items-center justify-between font-label-sm text-label-sm">
                    <span className="italic text-on-surface-variant truncate mr-2">
                      {heroStory.image_caption || (isBn ? 'আর্কাইভাল টেলিমেট্রি: জাতীয় সংবাদের আলোকচিত্র।' : 'Archival Telemetry: Dorpon Intelligence photo report.')}
                    </span>
                    <span className="font-semibold text-primary shrink-0 uppercase">
                      WIRE: DORPON BUREAU
                    </span>
                  </div>
                </div>
              )}

              {/* TIER 1: Key Takeway (Matching Image 4 Spec) */}
              {getBullets(heroStory).length > 0 && (
                <div className="rounded-lg border-2 border-secondary/50 bg-secondary-container/20 p-4 mb-4">
                  <div className="flex items-center gap-1.5 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider mb-2.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{isBn ? 'মূল বিষয়' : 'Key Takeway'}</span>
                  </div>
                  <ul className="space-y-2 font-serif text-sm sm:text-[15px] leading-relaxed text-on-surface">
                    {getBullets(heroStory).map((bullet, idx) => {
                      const cleanBullet = bullet.replace(/^\*\*(.*?)\*\*/, '$1');
                      return (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-secondary font-bold text-base leading-none mt-0.5">❖</span>
                          <span>{cleanBullet}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* TIER 2: Why It Matters (Tinted Box) */}
              {getWhyItMatters(heroStory) && (
                <div className="rounded-lg border-2 border-primary/20 bg-surface-container p-4 mb-4">
                  <div className="flex items-center gap-1.5 font-label-md text-label-md font-bold uppercase text-on-tertiary-container mb-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>{isBn ? 'কেন এটি তাৎপর্যপূর্ণ' : 'Why It Matters'}</span>
                  </div>
                  <p className="font-serif text-sm sm:text-[15px] text-on-surface-variant leading-relaxed">
                    {getWhyItMatters(heroStory)}
                  </p>
                </div>
              )}

              {/* TIER 3: The Core Story & Verified Source Chip */}
              <div className="p-3.5 bg-surface-container-low border border-outline-variant mb-4">
                <div className="font-label-sm text-label-sm uppercase font-bold text-outline mb-1.5">
                  {isBn ? 'মূল বিবরণ' : 'The Core Story'}
                </div>
                <p 
                  onClick={() => openStory(heroStory)}
                  className="font-serif text-sm sm:text-base text-on-surface leading-relaxed mb-3 hover:text-secondary cursor-pointer"
                >
                  {getCoreStory(heroStory)}
                </p>
                <div className="pt-2 border-t border-outline-variant flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm uppercase text-outline">
                      {isBn ? 'যাচাইকৃত সূত্র:' : 'Verified Sources:'}
                    </span>
                    {heroStory.sources && heroStory.sources.map((src, sIdx) => (
                      <a 
                        key={sIdx}
                        href={src.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-surface-container-highest border border-primary/30 rounded px-2.5 py-1 text-label-sm font-label-sm text-primary font-semibold hover:bg-secondary-container transition-colors"
                      >
                        <span>{src.name}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                  <span className="text-on-surface-variant font-label-sm text-label-sm font-mono">
                    Ref #{heroStory.story_id.slice(0, 10).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Reaction / Utility Pills (Matching Image 4 Bottom Bar) */}
            <div className="pt-3 border-t border-dashed border-outline-variant flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setInsightCount(prev => ({ ...prev, [heroStory.story_id]: (prev[heroStory.story_id] || 142) + 1 }))}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-secondary/50 bg-secondary-container/30 text-secondary font-label-sm text-label-sm font-bold hover:bg-secondary-container transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{isBn ? 'তথ্যসমৃদ্ধ' : 'Insightful'} ({insightCount[heroStory.story_id] || 142})</span>
                </button>
                <button 
                  onClick={() => setHighYieldCount(prev => ({ ...prev, [heroStory.story_id]: (prev[heroStory.story_id] || 89) + 1 }))}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-outline-variant bg-surface-container font-label-sm text-label-sm font-bold text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'উচ্চ ফলনশীল' : 'High Yield'} ({highYieldCount[heroStory.story_id] || 89})</span>
                </button>
              </div>
              <div className="flex items-center space-x-2 font-label-sm text-label-sm uppercase">
                <button 
                  onClick={(e) => handleShare(heroStory, e)}
                  className="p-1 px-2.5 border border-outline hover:bg-surface-container text-primary flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'শেয়ার' : 'Share'}</span>
                </button>
              </div>
            </div>
          </article>
        ) : null}

        {/* ============================================================== */}
        {/* COLUMN 3: Right 25% (Cols 10-12) Popular Briefing Wire & BBS Analysis */}
        {/* ============================================================== */}
        <section className="md:col-span-3 border-r border-b border-primary/20 p-4 bg-background flex flex-col justify-between">
          <div>
            {/* Header for Popular Articles Wire */}
            <div className="flex items-center justify-between border-b-2 border-primary pb-1.5 mb-3">
              <h3 className="font-serif text-sm uppercase tracking-tight text-primary font-bold">
                {isBn ? 'নির্বাহী ওয়্যার ডেস্ক' : 'Executive Wire Desk'}
              </h3>
              <span className="bg-secondary text-on-secondary px-2 py-0.5 font-label-sm text-label-sm font-bold rounded">
                {wireDeskStories.length} {isBn ? 'সংক্ষেপ' : 'Briefs'}
              </span>
            </div>

            {/* STACKED 3-TIER CONDENSED BRIEFS */}
            <div className="space-y-4">
              {wireDeskStories.map((wire, idx) => {
                const title = getTitle(wire);
                const bullets = getBullets(wire);
                const whyItMatters = getWhyItMatters(wire);
                const coreStory = getCoreStory(wire);
                const timeStr = formatRelativeTime(wire.published_at, isBn);
                const categoryLabel = getLocalizedCategory(wire.primary_category, isBn);
                const primarySource = wire.sources && wire.sources.length > 0 ? wire.sources[0] : null;

                return (
                  <article key={wire.story_id || idx} className="pb-3 border-b border-outline-variant last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-sm text-label-sm uppercase text-secondary font-bold">
                        0{idx + 1} • {categoryLabel}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {timeStr}
                      </span>
                    </div>

                    <h4 
                      onClick={() => openStory(wire)}
                      className="font-serif text-sm font-bold text-primary hover:text-secondary cursor-pointer leading-snug mb-1.5 transition-colors"
                    >
                      {title}
                    </h4>

                    {/* Condensed Takeaways */}
                    {bullets.length > 0 && (
                      <div className="bg-secondary-container/15 border border-secondary/30 p-2 rounded mb-1.5">
                        <div className="font-label-sm text-label-sm font-bold text-secondary uppercase flex items-center gap-1">
                          <span>❖</span> {isBn ? 'মূল বিষয়:' : 'Key Takeaways:'}
                        </div>
                        <p className="font-serif text-xs text-on-surface leading-tight mt-0.5">
                          {bullets[0].replace(/^\*\*(.*?)\*\*/, '$1')}
                        </p>
                      </div>
                    )}

                    {whyItMatters && (
                      <div className="bg-surface-container p-1.5 border-l border-primary font-serif text-xs text-on-surface-variant mb-1.5">
                        <strong>{isBn ? 'গুরুত্ব:' : 'Why It Matters:'}</strong> {whyItMatters}
                      </div>
                    )}

                    <div 
                      onClick={() => openStory(wire)}
                      className="font-serif text-xs text-on-surface leading-snug mb-1 line-clamp-2 hover:text-secondary cursor-pointer"
                    >
                      {coreStory}
                    </div>

                    <div className="flex items-center justify-between text-label-sm font-label-sm pt-1">
                      <span className="text-outline uppercase">{isBn ? 'উৎস:' : 'Source:'}</span>
                      {primarySource ? (
                        <a 
                          href={primarySource.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>{primarySource.name}</span>
                          <ExternalLink className="w-2 h-2" />
                        </a>
                      ) : (
                        <span className="font-bold text-primary">Dorpon Wire</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Macro Telemetry Register Box */}
          <div className="mt-4 pt-3 border-t-2 border-primary">
            <div className="bg-surface-container-high border border-outline-variant p-3 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase font-bold text-primary">
                  {isBn ? 'সামষ্টিক টেলিমেট্রি রেজিস্টার' : 'Macro Telemetry Register'}
                </span>
                <span className="bg-secondary text-on-secondary px-1.5 py-0.2 text-[10px] font-bold rounded">
                  REGISTER #46
                </span>
              </div>
              <p className="font-serif text-xs text-on-surface mb-2">
                <strong>{isBn ? 'আইএমএফ BPM6 রিজার্ভ মানদণ্ড:' : 'BPM6 Reserve Standard:'}</strong>{' '}
                {isBn 
                  ? 'কেন্দ্রীয় ব্যাংকের মোট বনাম প্রকৃত ব্যবহারযোগ্য বৈদেশিক মুদ্রা রিজার্ভের হিসাব ও স্বল্পমেয়াদি ঋণ কভারেজ মেট্রিক্স।'
                  : 'Central bank gross vs. net usable foreign reserves differential and short-term debt cover metrics.'}
              </p>
              <button 
                onClick={() => heroStory && openStory(heroStory)}
                className="text-primary font-bold font-label-sm text-label-sm uppercase hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{isBn ? 'বিশ্লেষণ পড়ুন' : 'Read Full Analysis'}</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================== */}
      {/* LOWER SECTION: 3 Featured Investigations — Strict 3-Tier Summaries */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-r border-b border-primary/20 bg-background shadow-sm">
        {lowerStories.map((story, idx) => {
          const title = getTitle(story);
          const bullets = getBullets(story);
          const whyItMatters = getWhyItMatters(story);
          const coreStory = getCoreStory(story);
          const categoryLabel = getLocalizedCategory(story.primary_category, isBn);
          const primarySource = story.sources && story.sources.length > 0 ? story.sources[0] : null;

          return (
            <article 
              key={story.story_id || idx}
              className="border-b md:border-b-0 md:border-r border-primary/20 p-5 bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-sm text-label-sm uppercase font-bold text-on-tertiary-container">
                    {categoryLabel}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {formatRelativeTime(story.published_at, isBn)}
                  </span>
                </div>

                <h3 
                  onClick={() => openStory(story)}
                  className="font-serif text-lg font-bold text-primary hover:text-secondary transition-colors cursor-pointer mb-2.5 leading-snug"
                >
                  {title}
                </h3>

                {story.image_url && (
                  <div className="my-2.5 border border-primary/20 overflow-hidden cursor-pointer" onClick={() => openStory(story)}>
                    <img 
                      src={story.image_url} 
                      alt={title}
                      className="w-full h-32 object-cover filter contrast-125 grayscale hover:filter-none transition-all duration-300"
                    />
                  </div>
                )}

                {/* Tier 1 */}
                {bullets.length > 0 && (
                  <div className="rounded border border-secondary/40 bg-secondary-container/15 p-2.5 mb-2.5">
                    <div className="font-label-sm text-label-sm font-bold uppercase text-secondary mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{isBn ? 'মূল বিষয়' : 'Key Takeway'}</span>
                    </div>
                    <ul className="space-y-1 font-serif text-xs text-on-surface">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-1.5">
                          <span className="text-secondary text-xs font-bold leading-none mt-0.5">❖</span>
                          <span>{b.replace(/^\*\*(.*?)\*\*/, '$1')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tier 2 */}
                {whyItMatters && (
                  <div className="rounded border-l-2 border-primary bg-surface-container p-2.5 mb-2.5">
                    <div className="font-label-sm text-label-sm font-bold uppercase text-on-tertiary-container mb-0.5">
                      {isBn ? 'কেন এটি গুরুত্বপূর্ণ' : 'Why It Matters'}
                    </div>
                    <p className="font-serif text-xs text-on-surface-variant leading-relaxed">
                      {whyItMatters}
                    </p>
                  </div>
                )}

                {/* Tier 3 */}
                <div>
                  <div className="font-label-sm text-label-sm uppercase font-bold text-outline mb-0.5">
                    {isBn ? 'মূল প্রতিবেদন' : 'The Core Story'}
                  </div>
                  <p 
                    onClick={() => openStory(story)}
                    className="font-serif text-xs text-on-surface leading-relaxed line-clamp-3 hover:text-secondary cursor-pointer"
                  >
                    {coreStory}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-outline-variant flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-on-surface-variant font-semibold">
                  {story.sources && story.sources[0]?.name ? story.sources[0].name : 'Dorpon Desk'}
                </span>
                {primarySource ? (
                  <a 
                    href={primarySource.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-surface-container-highest border border-outline-variant px-2 py-0.5 text-primary hover:border-secondary font-bold inline-flex items-center gap-1"
                  >
                    <span>{primarySource.name}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <button onClick={() => openStory(story)} className="font-bold text-secondary hover:underline">
                    {isBn ? 'বিস্তারিত পড়ুন' : 'Read Full'} &rarr;
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* SUBSCRIBER BANNER (SONDESH EXPRESS DISPATCH) */}
      {/* ============================================================== */}
      <div id="subscribe" className="border-x border-b border-primary/20 bg-primary text-background p-6 sm:p-9 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm scroll-mt-6">
        <div className="max-w-2xl">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed flex items-center gap-1.5 font-bold">
            <Mail className="w-4 h-4" />
            <span>{isBn ? 'সন্দেশ এক্সপ্রেস মর্নিং ডেসপ্যাচ' : 'SONDESH EXPRESS MORNING DISPATCH'}</span>
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-background font-bold mt-2">
            {isBn 
              ? 'প্রতিদিনের সংক্ষেপিত সংবাদ ডসিয়ার সরাসরি আপনার ইমেইলে' 
              : 'Daily Scannable Briefings Delivered Directly to Your Inbox'}
          </h2>
          <p className="font-serif text-xs sm:text-sm text-inverse-primary mt-1.5 leading-relaxed">
            {isBn
              ? 'অপ্রয়োজনীয় তথ্য ও বিভ্রান্তিহীন নির্ভুল সারসংক্ষেপ, পেছনের কারণ এবং মূল সূত্রের সংযোগ—প্রতিদিন সকালে।'
              : 'Zero noise. Essential bulleted takeaways, why it matters, and direct source citations delivered fresh every morning.'}
          </p>
        </div>

        <div className="w-full md:w-auto">
          {subscribedMessage ? (
            <div className="bg-secondary text-on-secondary px-5 py-2.5 font-serif text-sm rounded font-semibold text-center shadow">
              ✓ {isBn ? 'ধন্যবাদ! আপনার সাবস্ক্রিপশন সম্পন্ন হয়েছে।' : 'Subscribed successfully! Welcome to the daily brief.'}
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <input 
                type="email"
                required
                value={subscribedEmail}
                onChange={(e) => setSubscribedEmail(e.target.value)}
                placeholder={isBn ? 'আপনার ইমেইল অ্যাড্রেস লিখুন...' : 'Enter your email address...'}
                className="bg-primary-container border border-outline text-background font-serif px-4 py-2.5 text-sm focus:outline-none focus:border-secondary w-full sm:w-72 placeholder:text-outline"
              />
              <button 
                type="submit"
                className="w-full sm:w-auto bg-surface text-primary font-label-md text-label-md uppercase font-bold px-6 py-2.5 hover:bg-surface-container-high transition-colors whitespace-nowrap cursor-pointer"
              >
                {isBn ? 'সাবস্ক্রাইব করুন' : 'Subscribe Free'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};
