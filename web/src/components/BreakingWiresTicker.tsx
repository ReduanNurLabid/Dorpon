import React from 'react';
import { useApp } from '../context/AppContext';
import { Radio, ChevronRight, Zap } from 'lucide-react';
import { formatRelativeTime } from '../utils/bilingual';

export const BreakingWiresTicker: React.FC = () => {
  const { hourlyWires, openStory, language, t } = useApp();
  const isBn = language === 'bn';

  if (!hourlyWires || hourlyWires.length === 0) return null;

  return (
    <div className="w-full bg-mint/5 border-y border-mint/20 py-2.5 overflow-hidden backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center space-x-3">
        {/* Pulsing Live Pill */}
        <div className="flex-shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-mint/20 border border-mint/30 text-mint text-xs font-bold tracking-wider">
          <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
          <span className="text-[11px] uppercase">{t('live_badge')}</span>
        </div>

        {/* Scrollable / Clickable Wires List */}
        <div className="flex-1 flex items-center space-x-4 overflow-x-auto no-scrollbar py-0.5">
          {hourlyWires.map((wire) => {
            const headline = isBn
              ? (wire.daily_buzz.title_bn || wire.daily_buzz.title_en)
              : (wire.daily_buzz.title_en || wire.daily_buzz.title_bn);
            const timeStr = formatRelativeTime(wire.published_at, isBn);

            return (
              <button
                key={wire.story_id}
                onClick={() => openStory(wire)}
                className="flex-shrink-0 flex items-center space-x-2 text-xs sm:text-sm text-text-secondary hover:text-white group transition-colors pr-4 border-r border-white/10 last:border-r-0"
              >
                <Zap className="w-3.5 h-3.5 text-mint group-hover:scale-120 transition-transform" />
                <span className="max-w-[280px] sm:max-w-[420px] truncate text-left font-medium text-text-primary group-hover:text-mint transition-colors">
                  {headline}
                </span>
                <span className="text-[11px] text-text-secondary/60 ml-1">
                  • {timeStr}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
