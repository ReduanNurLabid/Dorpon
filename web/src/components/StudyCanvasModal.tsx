import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ArrowLeft,
  Bookmark, 
  Share2, 
  Headphones, 
  Pause,
  Play,
  Check, 
  Type, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  Sparkles,
  Scale,
  BarChart3,
  HelpCircle,
  ShieldCheck,
  Compass,
  Lightbulb,
  Award
} from 'lucide-react';
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
    focusMode,
    setFocusMode,
    isSaved,
    toggleSave,
    playStoryAudio,
    pauseAudio,
    resumeAudio,
    isPlayingAudio,
    currentAudioStory,
    audioProgress,
    seekAudio,
    t,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
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

  const summary = isBn
    ? (buzz.summary_bn || buzz.summary_en)
    : (buzz.summary_en || buzz.summary_bn);

  const bullets = isBn
    ? (buzz.bullets_bn && buzz.bullets_bn.length > 0 ? buzz.bullets_bn : [buzz.summary_bn])
    : (buzz.bullets_en && buzz.bullets_en.length > 0 ? buzz.bullets_en : [buzz.summary_en]);

  const whyItMatters = isBn
    ? (buzz.why_it_matters_bn || '')
    : (buzz.why_it_matters_en || '');

  const categoryLabel = getLocalizedCategory(activeStory.primary_category, isBn);
  const timeFormatted = formatRelativeTime(activeStory.published_at, isBn);

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

  const fontClass = isSerif ? 'font-serif' : 'font-sans';
  const textBodySize =
    fontSize === 'sm' ? 'text-sm sm:text-base leading-relaxed' :
    fontSize === 'lg' ? 'text-lg sm:text-xl leading-loose' :
    'text-base sm:text-lg leading-relaxed';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-2xl bg-black/85 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeStory();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col bg-obsidian-bg sm:rounded-card border border-white/[0.1] shadow-2xl overflow-hidden z-10"
      >
        
        {/* Sticky Header with Prominent Back & Close */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-white/[0.08] bg-obsidian-lowest/95 backdrop-blur-xl sticky top-0 z-30">
          {/* Back Button (Prominent on mobile and desktop) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeStory();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/[0.08] border border-white/[0.12] text-white hover:bg-mint hover:text-obsidian-bg hover:border-mint transition-all duration-200 group active:scale-95"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs sm:text-sm font-bold">
              {isBn ? 'ফিরে যান' : 'Back'}
            </span>
          </button>

          {/* Center Category Badge */}
          <div className="flex items-center space-x-2 truncate px-2">
            <span className="px-2.5 py-0.5 rounded-full bg-mint/10 border border-mint/20 text-mint text-[11px] font-bold uppercase tracking-wider truncate">
              {categoryLabel}
            </span>
            {activeStory.is_bcs_pro_selected && (
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold">
                <Sparkles className="w-3 h-3 mr-1" />
                Dossier
              </span>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Listen Button */}
            <button
              onClick={toggleThisStoryAudio}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                isAudioActive
                  ? 'bg-mint text-obsidian-bg border-mint shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                  : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white'
              }`}
              title="Listen to this article"
            >
              {isAudioActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Headphones className="w-3.5 h-3.5 text-mint" />}
              <span className="hidden xs:inline">{isAudioActive ? t('pause') : t('listen')}</span>
            </button>

            {/* Font Toggle */}
            <button
              onClick={() => setIsSerif(!isSerif)}
              className={`p-2 rounded-full border text-xs transition-all ${
                isSerif
                  ? 'bg-gold/20 border-gold/40 text-gold'
                  : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white'
              }`}
              title="Toggle Serif / Sans"
            >
              <Type className="w-3.5 h-3.5" />
            </button>

            {/* Bookmark */}
            <button
              onClick={() => toggleSave(activeStory.story_id)}
              className={`p-2 rounded-full border transition-all ${
                bookmarked
                  ? 'bg-mint/20 border-mint/40 text-mint'
                  : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white'
              }`}
              title="Save"
            >
              <Bookmark className="w-3.5 h-3.5" fill={bookmarked ? 'currentColor' : 'none'} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white transition-all hidden xs:block"
              title="Share"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-mint" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            {/* Direct Close X Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeStory();
              }}
              className="p-2 rounded-full bg-white/[0.08] border border-white/[0.12] text-text-secondary hover:text-white hover:bg-red-500/20 hover:border-red-500/40 transition-all active:scale-95"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Reading Scroll Progress Bar across top of News Modal */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.08] overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-mint to-mint-bright shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-75"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>

        {/* Scrollable Canvas Body */}
        <div 
          onScroll={(e) => {
            const el = e.currentTarget;
            const maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll > 0) {
              const pct = Math.min(100, Math.max(0, (el.scrollTop / maxScroll) * 100));
              setScrollProgress(pct);
            }
          }}
          className="flex-1 overflow-y-auto px-5 sm:px-10 py-6 sm:py-8 space-y-8 pb-28"
        >
          
          {/* Integrated Audio Bar */}
          <div className="p-3.5 sm:p-4 rounded-tile bg-white/[0.03] border border-mint/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3 min-w-0">
              <button
                onClick={toggleThisStoryAudio}
                className="p-2.5 rounded-full bg-mint text-obsidian-bg hover:bg-mint-bright shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all flex-shrink-0"
              >
                {isAudioActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate">
                  {isBn ? 'এই সংবাদের অডিও শুনুন' : 'Listen to Audio Briefing'}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {isAudioActive ? t('playing') : `${toBanglaDigits(Math.ceil((buzz.read_time_seconds || 60) / 60))} ${t('minute_read')}`}
                </span>
              </div>
            </div>

            {isAudioCurrentStory && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                  seekAudio(pct);
                }}
                className="w-28 sm:w-44 h-2 bg-white/10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer relative group"
                title="Click to scrub audio"
              >
                <div
                  className="h-full bg-gradient-to-r from-mint to-mint-bright shadow-[0_0_8px_rgba(52,211,153,0.7)] transition-all duration-100"
                  style={{ width: `${Number.isFinite(audioProgress) ? Math.max(0, Math.min(100, audioProgress)) : 0}%` }}
                />
              </div>
            )}
          </div>

          {/* Headline & Metadata */}
          <div>
            <div className="flex items-center space-x-2 text-xs text-text-secondary mb-3">
              <span>{timeFormatted}</span>
              {activeStory.sources.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-mint font-medium">{activeStory.sources[0].name}</span>
                </>
              )}
            </div>

            <h1
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4 ${fontClass}`}
            >
              {headline}
            </h1>

            {/* Optional Cover Image */}
            {activeStory.image_url && (
              <div className="rounded-card overflow-hidden bg-obsidian-high border border-white/[0.06] mb-6 shadow-xl">
                <img
                  src={activeStory.image_url}
                  alt={activeStory.image_caption || headline}
                  className="w-full max-h-[420px] object-cover"
                />
                {activeStory.image_caption && (
                  <p className="p-3 text-xs text-text-secondary/80 bg-black/40 italic">
                    {activeStory.image_caption}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 3 Key Takeaway Bullets */}
          <div className="p-5 sm:p-6 rounded-card bg-mint/5 border border-mint/20 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mint flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>{isBn ? '৩টি মূল বার্তা (সারসংক্ষেপ)' : 'Core Takeaway Intelligence'}</span>
            </h3>
            <div className="space-y-2.5">
              {bullets.map((b, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <span className="w-2 h-2 rounded-full bg-mint mt-2 flex-shrink-0" />
                  <p className={`text-sm sm:text-base text-white/90 leading-relaxed ${fontClass}`}>
                    {b.replace(/^[•\-\*\d\.]+\s*/, '')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Why It Matters */}
          {whyItMatters && (
            <div className="p-5 sm:p-6 rounded-card bg-white/[0.03] border border-white/[0.08]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold-bright flex items-center space-x-2 mb-2">
                <Lightbulb className="w-4 h-4 text-gold" />
                <span>{t('why_it_matters')}</span>
              </h3>
              <p className={`text-sm sm:text-base text-text-secondary leading-relaxed whitespace-pre-line ${fontClass}`}>
                {whyItMatters}
              </p>
            </div>
          )}

          {/* Full Narrative Text if available */}
          {summary && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                {t('the_core_story')}
              </h3>
              <div className={`${textBodySize} ${fontClass} text-text-primary/90 space-y-4 whitespace-pre-line`}>
                {summary.replace(/^\s*[*_\-•\d.)]+\s*/, '').replace(/\s*[*_]+\s*$/, '').replace(/\*\*([^*]+)\*\*/g, '$1')}
              </div>
            </div>
          )}

          {/* Strategic Dossier Elements if present */}
          {bcs && (
            <div className="pt-6 border-t border-white/[0.08] space-y-8">
              <div className="flex items-center space-x-2 text-gold text-xs font-bold uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>{isBn ? 'কৌশলগত গভীর গবেষণা বিশ্লেষণ' : 'Strategic Inquiries & Constitutional Framework'}</span>
              </div>

              {/* Data Telemetry */}
              {bcs.data_stats && bcs.data_stats.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-mint mb-3 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>{t('stat_points')}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {bcs.data_stats.map((stat, idx) => (
                      <div key={idx} className="p-3.5 rounded-tile bg-white/[0.02] border border-white/[0.06]">
                        <div className="text-lg font-bold text-mint">{stat.value}</div>
                        <div className="text-xs font-semibold text-white mt-1">{stat.metric_name}</div>
                        <div className="text-[11px] text-text-secondary mt-1">{stat.context}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constitutional Articles */}
              {bcs.constitutional_articles && bcs.constitutional_articles.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-3 flex items-center space-x-2">
                    <Scale className="w-4 h-4" />
                    <span>{t('constitutional_articles')}</span>
                  </h4>
                  <div className="space-y-2">
                    {bcs.constitutional_articles.map((art, idx) => (
                      <div key={idx} className="p-3.5 rounded-tile bg-gold/5 border border-gold/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-0.5 rounded bg-gold/20 text-gold-bright text-xs font-mono font-bold">
                            {art.article_number}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {isBn ? art.article_title_bn : art.article_title_en}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary sm:text-right">
                          {art.legal_relevance}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Breakdowns */}
              {bcs.question_breakdowns && bcs.question_breakdowns.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-mint" />
                    <span>{t('key_questions')}</span>
                  </h4>
                  <div className="space-y-3">
                    {bcs.question_breakdowns.map((q, idx) => (
                      <div key={idx} className="p-4 rounded-tile bg-white/[0.02] border border-white/[0.06]">
                        <p className="text-sm font-bold text-white mb-2">{q.question}</p>
                        <div className="space-y-1.5 pl-2">
                          {q.anchor_points.map((pt, pIdx) => (
                            <p key={pIdx} className="text-xs sm:text-sm text-text-secondary flex items-start space-x-2">
                              <span className="text-mint font-bold">•</span>
                              <span>{pt}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenges & Way Forward */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bcs.challenges && bcs.challenges.length > 0 && (
                  <div className="p-4 rounded-tile bg-red-500/5 border border-red-500/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t('challenges')}</span>
                    </h4>
                    <div className="space-y-1.5">
                      {bcs.challenges.map((c, idx) => (
                        <p key={idx} className="text-xs sm:text-sm text-text-secondary flex items-start space-x-2">
                          <span className="text-red-400 font-bold">•</span>
                          <span>{c}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {bcs.way_forward && bcs.way_forward.length > 0 && (
                  <div className="p-4 rounded-tile bg-mint/5 border border-mint/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-mint mb-2 flex items-center space-x-1.5">
                      <Compass className="w-4 h-4" />
                      <span>{t('way_forward')}</span>
                    </h4>
                    <div className="space-y-1.5">
                      {bcs.way_forward.map((w, idx) => (
                        <p key={idx} className="text-xs sm:text-sm text-text-secondary flex items-start space-x-2">
                          <span className="text-mint font-bold">•</span>
                          <span>{w}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sources Links */}
          {activeStory.sources.length > 0 && (
            <div className="pt-6 border-t border-white/[0.08]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
                {t('sources')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeStory.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs text-text-secondary hover:text-mint hover:border-mint/30 transition-all"
                  >
                    <span>{src.name}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reader Interactive Reactions */}
          <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleVoteInsightful}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold transition-all ${
                  hasVotedInsightful
                    ? 'bg-mint/20 border-mint/40 text-mint shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-mint" />
                <span>{t('reactions_insightful')}</span>
                <span className="ml-1 opacity-75 font-mono">
                  ({isBn ? toBanglaDigits(insightfulCount) : insightfulCount})
                </span>
              </button>

              <button
                onClick={handleVoteHighYield}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold transition-all ${
                  hasVotedHighYield
                    ? 'bg-gold/20 border-gold/40 text-gold shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Award className="w-4 h-4 text-gold" />
                <span>{t('reactions_high_yield')}</span>
                <span className="ml-1 opacity-75 font-mono">
                  ({isBn ? toBanglaDigits(highYieldCount) : highYieldCount})
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeStory();
              }}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs sm:text-sm font-bold text-white transition-all border border-white/[0.15] active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isBn ? 'ফিরে যান' : 'Go Back'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Persistent Floating Quick-Back Pill - Outside modal dialog with high z-index */}
      <div className="sm:hidden fixed bottom-6 right-6 z-[70]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeStory();
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-obsidian-lowest/95 border-2 border-mint text-mint text-xs font-bold shadow-[0_8px_30px_rgba(0,0,0,0.9)] backdrop-blur-2xl active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'ফিরে যান' : 'Go Back'}</span>
        </button>
      </div>
    </div>
  );
};
