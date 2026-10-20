import React from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, SkipForward, SkipBack, X, Maximize2, Headphones, Gauge } from 'lucide-react';
import { toBanglaDigits, getLocalizedCategory } from '../utils/bilingual';

export const AudioPlayerDock: React.FC = () => {
  const {
    currentAudioStory,
    isPlayingAudio,
    toggleAudio,
    stopAudio,
    playNextAudio,
    playPrevAudio,
    audioProgress,
    audioTimeRemaining,
    audioPlaybackRate,
    setAudioPlaybackRate,
    setIsAudioSheetOpen,
    language,
  } = useApp();

  if (!currentAudioStory) return null;

  const isBn = language === 'bn';
  const buzz = currentAudioStory.daily_buzz;
  const title = isBn
    ? (buzz.title_bn || buzz.title_en)
    : (buzz.title_en || buzz.title_bn);

  const categoryLabel = getLocalizedCategory(currentAudioStory.primary_category, isBn);

  const speedOptions = [1, 1.25, 1.5, 2];

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currIdx = speedOptions.indexOf(audioPlaybackRate);
    const nextIdx = (currIdx + 1) % speedOptions.length;
    setAudioPlaybackRate(speedOptions[nextIdx]);
  };

  return (
    <div
      onClick={() => setIsAudioSheetOpen(true)}
      className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-xl cursor-pointer rounded-2xl backdrop-blur-2xl bg-obsidian-lowest/95 border border-mint/30 shadow-[0_10px_35px_rgba(0,0,0,0.7)] p-2.5 sm:p-3 transition-all hover:border-mint/50 animate-slideUp"
    >
      {/* Top micro progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 rounded-t-2xl overflow-hidden">
        <div
          className="h-full bg-mint transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          style={{ width: `${audioProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Left: Thumbnail & Title */}
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-mint/15 border border-mint/30 flex items-center justify-center text-mint">
            {isPlayingAudio ? (
              <div className="flex items-center space-x-0.5 h-4">
                <span className="w-1 h-3 bg-mint rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="w-1 h-4 bg-mint rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
                <span className="w-1 h-2.5 bg-mint rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
              </div>
            ) : (
              <Headphones className="w-5 h-5" />
            )}
          </div>

          <div className="overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mint block">
              {categoryLabel}
            </span>
            <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-[260px]">
              {title}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Speed Toggle */}
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-mint hover:bg-white/[0.08] transition-all"
            title="Playback Speed"
          >
            {audioPlaybackRate}x
          </button>

          {/* Prev */}
          <button
            onClick={playPrevAudio}
            className="p-1.5 rounded-full text-text-secondary hover:text-white hover:bg-white/[0.06] transition-all hidden xs:block"
            title="Previous Story"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={toggleAudio}
            className="p-2 sm:p-2.5 rounded-full bg-mint text-obsidian-bg hover:bg-mint-bright shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all"
            title={isPlayingAudio ? 'Pause' : 'Play'}
          >
            {isPlayingAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Next */}
          <button
            onClick={playNextAudio}
            className="p-1.5 rounded-full text-text-secondary hover:text-white hover:bg-white/[0.06] transition-all"
            title="Next Story"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Dismiss */}
          <button
            onClick={stopAudio}
            className="p-1.5 rounded-full text-text-secondary/70 hover:text-white hover:bg-white/[0.06] transition-all"
            title="Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
