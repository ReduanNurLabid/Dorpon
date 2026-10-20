import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Headphones, 
  Volume2, 
  Sparkles,
  RotateCcw,
  RotateCw,
  ListOrdered
} from 'lucide-react';
import { toBanglaDigits, getLocalizedCategory } from '../utils/bilingual';

export const AudioPlayerSheet: React.FC = () => {
  const {
    isAudioSheetOpen,
    setIsAudioSheetOpen,
    currentAudioStory,
    isPlayingAudio,
    toggleAudio,
    playNextAudio,
    playPrevAudio,
    audioProgress,
    audioTimeRemaining,
    audioPlaybackRate,
    setAudioPlaybackRate,
    buzzStories,
    playStoryAudio,
    language,
    t,
  } = useApp();

  if (!isAudioSheetOpen || !currentAudioStory) return null;

  const isBn = language === 'bn';
  const buzz = currentAudioStory.daily_buzz;
  const title = isBn
    ? (buzz.title_bn || buzz.title_en)
    : (buzz.title_en || buzz.title_bn);

  const categoryLabel = getLocalizedCategory(currentAudioStory.primary_category, isBn);
  const bullets = isBn ? (buzz.bullets_bn || []) : (buzz.bullets_en || []);

  const speeds = [1, 1.25, 1.5, 2];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 backdrop-blur-2xl bg-black/85 animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={() => setIsAudioSheetOpen(false)} />

      <div className="relative w-full max-w-xl bg-obsidian-lowest rounded-t-card sm:rounded-card border border-white/[0.1] shadow-2xl overflow-hidden z-10 p-6 sm:p-8 animate-slideUp">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
          <div className="flex items-center space-x-2 text-mint text-xs font-bold uppercase tracking-wider">
            <Headphones className="w-4 h-4" />
            <span>{t('audio_briefing_title')}</span>
          </div>

          <button
            onClick={() => setIsAudioSheetOpen(false)}
            className="p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="flex items-center justify-center space-x-1.5 h-20 mb-6 bg-white/[0.02] rounded-tile border border-white/[0.06] p-4 overflow-hidden">
          {[40, 70, 25, 90, 60, 30, 80, 100, 45, 65, 85, 30, 95, 50, 75, 40, 80, 60, 90, 35, 70, 50].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPlayingAudio ? 'bg-mint' : 'bg-white/20'
              }`}
              style={{
                height: isPlayingAudio ? `${Math.max(15, (h * (0.6 + Math.random() * 0.4)))}%` : '20%',
                opacity: isPlayingAudio ? 0.9 : 0.3,
              }}
            />
          ))}
        </div>

        {/* Current Story Metadata */}
        <div className="text-center mb-6">
          <span className="px-3 py-1 rounded-full bg-mint/15 text-mint border border-mint/30 text-xs font-bold uppercase tracking-wider inline-block mb-2">
            {categoryLabel}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-white line-clamp-2 leading-tight">
            {title}
          </h3>
        </div>

        {/* Progress Bar & Time */}
        <div className="mb-6">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-mint shadow-[0_0_12px_rgba(52,211,153,0.8)] transition-all duration-300"
              style={{ width: `${audioProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-secondary font-mono">
            <span>{isBn ? `${toBanglaDigits(audioProgress)}%` : `${audioProgress}%`}</span>
            <span>
              {isBn
                ? `${toBanglaDigits(audioTimeRemaining)} সেকেন্ড বাকি`
                : `${audioTimeRemaining}s remaining`}
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4 sm:space-x-6 mb-8">
          {/* Previous */}
          <button
            onClick={playPrevAudio}
            className="p-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-all"
            title="Previous Story"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Big Play/Pause */}
          <button
            onClick={toggleAudio}
            className="p-5 rounded-full bg-mint text-obsidian-bg hover:bg-mint-bright shadow-[0_0_30px_rgba(52,211,153,0.5)] transition-all transform hover:scale-105"
            title={isPlayingAudio ? 'Pause' : 'Play'}
          >
            {isPlayingAudio ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNextAudio}
            className="p-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-all"
            title="Next Story"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center justify-center space-x-2 pb-6 border-b border-white/[0.08] mb-6">
          <span className="text-xs text-text-secondary mr-2">{t('speed')}:</span>
          {speeds.map((rate) => (
            <button
              key={rate}
              onClick={() => setAudioPlaybackRate(rate)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                audioPlaybackRate === rate
                  ? 'bg-mint text-obsidian-bg border-mint shadow-sm'
                  : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Chapter / Stories Queue List */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
            <ListOrdered className="w-4 h-4 text-mint" />
            <span>{isBn ? 'ব্রিফিং ক্রমতালিকা' : 'Briefing Queue'}</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
            {buzzStories.slice(0, 6).map((story, idx) => {
              const isSelected = story.story_id === currentAudioStory.story_id;
              const storyTitle = isBn
                ? (story.daily_buzz.title_bn || story.daily_buzz.title_en)
                : (story.daily_buzz.title_en || story.daily_buzz.title_bn);

              return (
                <button
                  key={story.story_id}
                  onClick={() => playStoryAudio(story)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-tile text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-mint/15 border-mint/30 text-white font-semibold'
                      : 'bg-white/[0.02] border-white/[0.05] text-text-secondary hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="font-mono text-mint font-bold">
                      {isBn ? toBanglaDigits(idx + 1) : idx + 1}.
                    </span>
                    <span className="truncate">{storyTitle}</span>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-mint flex-shrink-0 animate-pulse ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
