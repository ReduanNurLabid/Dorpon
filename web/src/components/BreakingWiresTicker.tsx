import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Zap } from 'lucide-react';
import { formatRelativeTime } from '../utils/bilingual';

export const BreakingWiresTicker: React.FC = () => {
  const { hourlyWires, buzzStories, openStory, language } = useApp();
  const isBn = language === 'bn';

  // Use hourly wires, with buzz stories fallback if wires are empty
  const rawWires = useMemo(() => {
    if (hourlyWires && hourlyWires.length > 0) return hourlyWires;
    return buzzStories || [];
  }, [hourlyWires, buzzStories]);

  if (!rawWires || rawWires.length === 0) return null;

  // Duplicate items to ensure a seamless infinite scrolling ticker
  const displayWires = [...rawWires, ...rawWires];
  // Calculate calm reading speed (~18s per wire item, minimum 110s)
  const durationSeconds = Math.max(110, rawWires.length * 18);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4">
      <div className="bg-surface-container-high border border-primary/20 shadow-xs overflow-hidden select-none">
        <div className="px-3 sm:px-4 py-1.5 flex items-center text-body-sm">
        {/* TAJA KHOBOR / LATEST NEWS BADGE */}
        <div
          className="bg-primary text-background px-2.5 py-0.5 font-label-sm text-label-sm uppercase font-bold tracking-wider mr-3 whitespace-nowrap flex items-center gap-1.5 shrink-0 shadow-sm z-10"
          aria-hidden="true"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-secondary-container" />
          <span>{isBn ? 'তাজা খবর' : 'LATEST NEWS'}</span>
        </div>

        {/* Continuous Rotating Wire Stream */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            className="animate-ticker space-x-8 py-0.5"
            style={{ animationDuration: `${durationSeconds}s` }}
          >
            {displayWires.map((wire, idx) => {
              const headline = isBn
                ? (wire.daily_buzz.title_bn || wire.daily_buzz.title_en)
                : (wire.daily_buzz.title_en || wire.daily_buzz.title_bn);
              const timeStr = formatRelativeTime(wire.published_at, isBn);

              return (
                <button
                  key={`${wire.story_id}-${idx}`}
                  onClick={() => openStory(wire)}
                  className="inline-flex items-center space-x-2 text-on-surface hover:text-secondary group transition-colors cursor-pointer text-left font-serif text-xs sm:text-[13px] mr-8"
                  aria-label={isBn ? `খবর পড়ুন: ${headline}` : `Read: ${headline}`}
                >
                  <span className="font-serif font-semibold text-primary group-hover:text-secondary transition-colors">
                    {timeStr}:
                  </span>
                  <span className="group-hover:underline">
                    {headline}
                  </span>
                  <span className="text-secondary font-bold ml-4">❖</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
