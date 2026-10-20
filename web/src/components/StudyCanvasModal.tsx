import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Bookmark, 
  Share2, 
  Headphones, 
  Volume2, 
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
  ThumbsUp,
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
    isPlayingAudio,
    currentAudioStory,
    t,
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

  const headline = isBn
    ? (buzz.title_bn || buzz.title_en)
    : (buzz.title_en || buzz.title_bn);

  const summary = isBn
    ? (buzz.summary_bn || buzz.summary_en)
    : (buzz.summary_en || buzz.summary_bn);

  const whyInNews = isBn
    ? (bcs?.why_in_the_news_bn || summary)
    : (bcs?.why_in_the_news_en || summary);

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

  const fontClass = isSerif ? 'font-serif' : 'font-sans';
  const textBodySize =
    fontSize === 'sm' ? 'text-sm sm:text-base leading-relaxed' :
    fontSize === 'lg' ? 'text-lg sm:text-xl leading-loose' :
    'text-base sm:text-lg leading-relaxed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-2xl bg-black/80 animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={closeStory} />

      <div className="relative w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col bg-obsidian-bg sm:rounded-card border border-white/[0.1] shadow-2xl overflow-hidden z-10">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/[0.08] bg-obsidian-lowest/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-mint/10 border border-mint/20 text-mint text-xs font-bold uppercase tracking-wider">
              {categoryLabel}
            </span>
            {activeStory.is_bcs_pro_selected && (
              <span className="px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold-bright text-xs font-bold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Strategic Dossier
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Audio Listen */}
            <button
              onClick={() => playStoryAudio(activeStory)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                isAudioActive
                  ? 'bg-mint text-obsidian-bg border-mint shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                  : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-mint" />
              <span>{isAudioActive ? t('playing') : t('listen')}</span>
            </button>

            {/* Font Mode */}
            <button
              onClick={() => setIsSerif(!isSerif)}
              className={`p-2 rounded-full border text-xs transition-all ${
                isSerif
                  ? 'bg-gold/20 border-gold/40 text-gold'
                  : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white'
              }`}
              title="Toggle Serif / Sans Font"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Focus Mode */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`p-2 rounded-full border text-xs transition-all ${
                focusMode
                  ? 'bg-mint/20 border-mint/40 text-mint'
                  : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white'
              }`}
              title="Distraction-Free Focus Mode"
            >
              {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Bookmark */}
            <button
              onClick={() => toggleSave(activeStory.story_id)}
              className={`p-2 rounded-full border transition-all ${
                bookmarked
                  ? 'bg-mint/20 border-mint/40 text-mint'
                  : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white'
              }`}
              title="Bookmark"
            >
              <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white transition-all"
              title="Share"
            >
              {copied ? <Check className="w-4 h-4 text-mint" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={closeStory}
              className="p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.08] transition-all"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Canvas Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-6 sm:py-8 space-y-8">
          {/* Article Header */}
          <div>
            <div className="flex items-center space-x-2 text-xs text-text-secondary mb-3">
              <span>{timeFormatted}</span>
              <span>•</span>
              <span>{toBanglaDigits(Math.ceil((buzz.read_time_seconds || 60) / 60))} {t('minute_read')}</span>
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
              <div className="rounded-card overflow-hidden bg-obsidian-high border border-white/[0.06] mb-6">
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
                {summary}
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
              onClick={closeStory}
              className="px-5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-xs sm:text-sm font-semibold text-white transition-all"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
