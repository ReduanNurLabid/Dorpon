import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { Compass, Flame, BookOpen, Bookmark, Sparkles } from 'lucide-react';

export const FloatingDock: React.FC = () => {
  const { activeTab, setActiveTab, savedStoryIds, t } = useApp();

  const navItems: { id: TabType; labelKey: any; icon: React.ReactNode; isGold?: boolean }[] = [
    {
      id: 'discover',
      labelKey: 'discover',
      icon: <Compass className="w-5 h-5" />,
    },
    {
      id: 'top_stories',
      labelKey: 'top_stories',
      icon: <Flame className="w-5 h-5" />,
    },
    {
      id: 'current_affairs',
      labelKey: 'current_affairs',
      icon: <BookOpen className="w-5 h-5" />,
      isGold: true,
    },
    {
      id: 'saved',
      labelKey: 'saved',
      icon: <Bookmark className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full backdrop-blur-2xl bg-obsidian-lowest/85 border border-white/[0.1] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center space-x-1 sm:space-x-2 transition-all">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative flex items-center space-x-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
              isActive
                ? item.isGold
                  ? 'bg-gold/15 text-gold-bright shadow-[0_0_20px_rgba(234,179,8,0.25)] border border-gold/30'
                  : 'bg-mint/15 text-mint-bright shadow-[0_0_20px_rgba(52,211,153,0.25)] border border-mint/30'
                : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </span>
            <span className={`transition-all duration-300 ${isActive ? 'inline-block font-semibold' : 'hidden md:inline-block'}`}>
              {t(item.labelKey)}
            </span>

            {/* Saved badge counter */}
            {item.id === 'saved' && savedStoryIds.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-mint text-obsidian-bg text-[10px] font-bold flex items-center justify-center">
                {savedStoryIds.length}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
