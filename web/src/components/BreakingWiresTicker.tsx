import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap } from 'lucide-react';
import { formatRelativeTime } from '../utils/bilingual';

export const BreakingWiresTicker: React.FC = () => {
  const { hourlyWires, openStory, language } = useApp();
  const isBn = language === 'bn';

  if (!hourlyWires || hourlyWires.length === 0) return null;

  return (
    <div className="w-full bg-surface-container-high border-b border-primary/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center text-body-sm">
        {/* EXECUTIVE WIRE BADGE */}
        <span className="bg-primary text-background px-2.5 py-0.5 font-label-sm text-label-sm uppercase font-bold tracking-wider mr-3 whitespace-nowrap flex items-center gap-1.5 shrink-0 shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-current text-secondary-container" />
          <span>{isBn ? 'নির্বাহী ওয়্যার' : 'EXECUTIVE WIRE'}</span>
        </span>

        {/* Dynamic Wire Stream */}
        <div className="flex-1 flex items-center space-x-6 overflow-x-auto no-scrollbar py-0.5 custom-scroll">
          {hourlyWires.map((wire, idx) => {
            const headline = isBn
              ? (wire.daily_buzz.title_bn || wire.daily_buzz.title_en)
              : (wire.daily_buzz.title_en || wire.daily_buzz.title_bn);
            const timeStr = formatRelativeTime(wire.published_at, isBn);

            return (
              <button
                key={wire.story_id || idx}
                onClick={() => openStory(wire)}
                className="shrink-0 flex items-center space-x-2 text-on-surface hover:text-secondary group transition-colors cursor-pointer text-left font-sans text-xs sm:text-[13px]"
              >
                <span className="font-semibold text-primary group-hover:text-secondary transition-colors">
                  {timeStr}:
                </span>
                <span className="max-w-[280px] sm:max-w-[480px] truncate group-hover:underline">
                  {headline}
                </span>
                <span className="text-outline-variant font-bold ml-3">❖</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
