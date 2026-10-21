import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { Compass, Flame, BookOpen } from 'lucide-react';

export const FloatingDock: React.FC = () => {
  const { activeTab, setActiveTab, t } = useApp();

  const navItems: { id: TabType; labelKey: any; icon: React.ReactNode; isGold?: boolean }[] = [
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
      id: 'discover',
      labelKey: 'discover',
      icon: <Compass className="w-5 h-5" />,
    },
  ];

  return (
    // Hidden on desktop (md:hidden) so desktop cleanly uses the header navigation bar!
    <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-2 py-1.5 rounded-full backdrop-blur-2xl bg-obsidian-lowest/90 border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex items-center space-x-1 transition-all">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              isActive
                ? item.isGold
                  ? 'bg-gold/15 text-gold-bright shadow-[0_0_20px_rgba(234,179,8,0.3)] border border-gold/30'
                  : 'bg-mint/15 text-mint-bright shadow-[0_0_20px_rgba(52,211,153,0.3)] border border-mint/30'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span className={isActive ? 'inline-block' : 'hidden'}>
              {t(item.labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
