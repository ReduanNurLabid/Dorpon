import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Maximize2, 
  Headphones, 
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { toBanglaDigits, getLocalizedCategory } from '../utils/bilingual';

export const AudioPlayerDock: React.FC = () => {
  const {
    currentAudioStory,
    isPlayingAudio,
    toggleAudio,
    stopAudio,
    playNextAudio,
    playPrevAudio,
    skipAudio,
    seekAudio,
    audioProgress,
    audioTimeRemaining,
    audioDuration,
    audioPlaybackRate,
    setAudioPlaybackRate,
    setIsAudioSheetOpen,
    language,
    t,
  } = useApp();

  const progressBarRef = useRef<HTMLDivElement | null>(null);

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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    seekAudio(pct);
  };

  return (
    <div
      onClick={() => setIsAudioSheetOpen(true)}
      className="fixed z-40 cursor-pointer rounded-2xl backdrop-blur-2xl bg-obsidian-lowest/95 border border-mint/30 shadow-[0_16px_40px_rgba(0,0,0,0.8)] p-3 transition-all duration-300 hover:border-mint/60 animate-slideUp
        bottom-20 left-1/2 -translate-x-1/2 w-[94%] max-w-lg
        md:bottom-6 md:right-6 md:left-auto md:translate-x-0 md:w-[420px]"
    >
      {/* Clickable interactive scrubber */}
      <div 
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="group/scrub relative h-2 -mt-1 mb-2 bg-white/10 rounded-full cursor-pointer overflow-hidden"
        title="Click to scrub audio"
      >
        <div
          className="h-full bg-gradient-to-r from-mint to-mint-bright shadow-[0_0_10px_rgba(52,211,153,0.8)] transition-all duration-200"
          style={{ width: `${audioProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Story details */}
        <div className="flex items-center space-x-3 overflow-hidden min-w-0 flex-1">
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

          <div className="overflow-hidden min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mint">
                {categoryLabel}
              </span>
              <span className="text-[10px] text-text-secondary/70 font-mono">
                {isBn ? `${toBanglaDigits(audioTimeRemaining)}s` : `${audioTimeRemaining}s`}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white truncate">
              {title}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div 
          className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Skip -10s */}
          <button
            onClick={() => skipAudio(-10)}
            className="p-1.5 rounded-full text-text-secondary hover:text-white hover:bg-white/[0.06] transition-all"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Toggle */}
          <button
            onClick={cycleSpeed}
            className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] font-bold text-mint hover:bg-white/[0.1] transition-all"
            title="Toggle Speed"
          >
            {audioPlaybackRate}x
          </button>

          {/* Play/Pause */}
          <button
            onClick={toggleAudio}
            className="p-2 sm:p-2.5 rounded-full bg-mint text-obsidian-bg hover:bg-mint-bright shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all transform hover:scale-105"
            title={isPlayingAudio ? 'Pause' : 'Play'}
          >
            {isPlayingAudio ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip +10s */}
          <button
            onClick={() => skipAudio(10)}
            className="p-1.5 rounded-full text-text-secondary hover:text-white hover:bg-white/[0.06] transition-all"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Next Story */}
          <button
            onClick={playNextAudio}
            className="p-1.5 rounded-full text-text-secondary hover:text-white hover:bg-white/[0.06] transition-all"
            title="Next Story"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Expand to Full Sheet */}
          <button
            onClick={() => setIsAudioSheetOpen(true)}
            className="p-1.5 rounded-full text-text-secondary hover:text-white hover:bg-white/[0.06] transition-all hidden sm:block"
            title="Expand Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Stop / Close */}
          <button
            onClick={stopAudio}
            className="p-1.5 rounded-full text-text-secondary hover:text-red-400 hover:bg-white/[0.06] transition-all"
            title="Stop & Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
