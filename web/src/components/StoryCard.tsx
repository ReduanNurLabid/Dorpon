import React, { useState } from 'react';
import { CapsuleStory } from '../types';
import { useApp } from '../context/AppContext';
import { 
  getLocalizedCategory, 
  formatRelativeTime, 
  toBanglaDigits 
} from '../utils/bilingual';
import { 
  Clock, 
  Bookmark, 
  Headphones, 
  Share2, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  Check,
  BookOpen
} from 'lucide-react';

interface StoryCardProps {
  story: CapsuleStory;
  featured?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, featured = false }) => {
  const {
    language,
    isSerif,
    openStory,
    toggleSave,
    isSaved,
    playStoryAudio,
    currentAudioStory,
    isPlayingAudio,
    t,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const isBn = language === 'bn';
  const buzz = story.daily_buzz;
  const isBookmarked = isSaved(story.story_id);
  const isCurrentAudio = currentAudioStory?.story_id === story.story_id && isPlayingAudio;

  const title = isBn
    ? (buzz.title_bn || buzz.title_en)
    : (buzz.title_en || buzz.title_bn);

  const bullets = isBn
    ? (buzz.bullets_bn && buzz.bullets_bn.length > 0 ? buzz.bullets_bn : [buzz.summary_bn])
    : (buzz.bullets_en && buzz.bullets_en.length > 0 ? buzz.bullets_en : [buzz.summary_en]);

  const whyItMatters = isBn
    ? (buzz.why_it_matters_bn || '')
    : (buzz.why_it_matters_en || '');

  const categoryLabel = getLocalizedCategory(story.primary_category, isBn);
  const timeFormatted = formatRelativeTime(story.published_at, isBn);
  const readTime = isBn
    ? `${toBanglaDigits(Math.ceil((buzz.read_time_seconds || 60) / 60))} ${t('minute_read')}`
    : `${Math.ceil((buzz.read_time_seconds || 60) / 60)} ${t('minute_read')}`;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: whyItMatters || title,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(`${title}\n${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playStoryAudio(story);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave(story.story_id);
  };

  if (featured && story.image_url) {
    return (
      <article
        onClick={() => openStory(story)}
        className="group relative cursor-pointer overflow-hidden rounded-card bg-obsidian-lowest border border-white/[0.08] hover:border-mint/30 transition-all duration-300 shadow-2xl mb-8"
      >
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-obsidian-high">
          <img
            src={story.image_url}
            alt={story.image_caption || title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-bg via-obsidian-bg/60 to-transparent" />

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-mint/90 text-obsidian-bg text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              {categoryLabel}
            </span>
            {story.is_bcs_pro_selected && (
              <span className="px-3 py-1 rounded-full bg-gold/90 text-obsidian-bg text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Strategic Dossier
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-black/60 text-white/90 text-xs font-medium backdrop-blur-md flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 mr-1 text-mint" />
              {timeFormatted}
            </span>
          </div>

          {/* Quick Play Floating on Image */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
            <button
              onClick={handleAudioClick}
              className={`p-3 sm:p-4 rounded-full backdrop-blur-xl border transition-all duration-300 ${
                isCurrentAudio
                  ? 'bg-mint text-obsidian-bg border-mint shadow-[0_0_25px_rgba(52,211,153,0.5)] scale-110'
                  : 'bg-black/60 text-white border-white/20 hover:scale-105 hover:bg-mint hover:text-obsidian-bg'
              }`}
            >
              <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <h2
            className={`text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-mint transition-colors duration-300 leading-tight mb-4 ${
              isSerif ? 'font-serif' : 'font-sans'
            }`}
          >
            {title}
          </h2>

          {/* Bullets */}
          <div className="space-y-2 mb-6">
            {bullets.slice(0, 3).map((bullet, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-sm sm:text-base text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-mint mt-2 flex-shrink-0" />
                <p className="line-clamp-2">{bullet.replace(/^[•\-\*\d\.]+\s*/, '')}</p>
              </div>
            ))}
          </div>

          {/* Why It Matters Callout */}
          {whyItMatters && (
            <div className="p-4 rounded-tile bg-white/[0.03] border border-mint/20 mb-6">
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-mint" />
                <span className="text-xs font-bold uppercase tracking-wider text-mint">
                  {t('why_it_matters')}
                </span>
              </div>
              <p className="text-sm text-text-primary/90 leading-relaxed line-clamp-2">
                {whyItMatters}
              </p>
            </div>
          )}

          {/* Footer controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveClick}
                className={`p-2 rounded-full border transition-all ${
                  isBookmarked
                    ? 'bg-mint/20 border-mint/40 text-mint'
                    : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white'
                }`}
                title={isBookmarked ? 'Remove Bookmark' : 'Save Story'}
              >
                <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white transition-all"
                title="Share Article"
              >
                {copied ? <Check className="w-4 h-4 text-mint" /> : <Share2 className="w-4 h-4" />}
              </button>

              <span className="text-xs text-text-secondary/70 ml-2 hidden sm:inline">
                {readTime}
              </span>
            </div>

            <div className="flex items-center space-x-1 text-sm font-semibold text-mint group-hover:translate-x-1 transition-transform">
              <span>{t('read_full')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => openStory(story)}
      className="group relative cursor-pointer overflow-hidden rounded-card bg-obsidian-lowest/70 backdrop-blur-md border border-white/[0.07] hover:border-mint/30 hover:bg-obsidian-lowest transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        {/* Header tags & timing */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-mint/10 border border-mint/20 text-mint text-[11px] font-semibold tracking-wide">
              {categoryLabel}
            </span>
            {story.is_bcs_pro_selected && (
              <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold">
                Dossier
              </span>
            )}
          </div>
          <span className="text-xs text-text-secondary/70 flex items-center">
            {timeFormatted}
          </span>
        </div>

        {/* Thumbnail Image if available */}
        {story.image_url && (
          <div className="relative aspect-[16/9] w-full rounded-tile overflow-hidden mb-4 bg-obsidian-high">
            <img
              src={story.image_url}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* Headline */}
        <h3
          className={`text-base sm:text-lg font-bold text-white group-hover:text-mint transition-colors duration-200 leading-snug mb-3 ${
            isSerif ? 'font-serif' : 'font-sans'
          }`}
        >
          {title}
        </h3>

        {/* 3 Key Takeaways */}
        <div className="space-y-1.5 mb-4">
          {bullets.slice(0, 3).map((bullet, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-mint/80 mt-1.5 flex-shrink-0" />
              <p className="line-clamp-2 leading-relaxed">{bullet.replace(/^[•\-\*\d\.]+\s*/, '')}</p>
            </div>
          ))}
        </div>

        {/* Why it matters inline chip */}
        {whyItMatters && (
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mint block mb-1">
              {t('why_it_matters')}
            </span>
            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {whyItMatters}
            </p>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between pt-3.5 border-t border-white/[0.06] mt-2">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleAudioClick}
            className={`p-2 rounded-full border transition-all ${
              isCurrentAudio
                ? 'bg-mint text-obsidian-bg border-mint shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Listen to Story"
          >
            <Headphones className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSaveClick}
            className={`p-2 rounded-full border transition-all ${
              isBookmarked
                ? 'bg-mint/20 border-mint/40 text-mint'
                : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.08]'
            }`}
            title={isBookmarked ? 'Remove' : 'Save'}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white transition-all"
            title="Share"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-mint" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center space-x-1 text-xs font-semibold text-mint group-hover:translate-x-1 transition-transform">
          <span>{readTime}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </article>
  );
};
