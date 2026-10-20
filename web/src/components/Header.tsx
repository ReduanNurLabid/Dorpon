import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { 
  Headphones, 
  Volume2, 
  Type, 
  Settings as SettingsIcon,
  Flame,
  BookOpen,
  Compass,
  Bookmark,
  Sparkles
} from 'lucide-react';
import { toBanglaDigits } from '../utils/bilingual';

export const Header: React.FC = () => {
  const {
    language,
    toggleLanguage,
    isSerif,
    setIsSerif,
    activeTab,
    setActiveTab,
    savedStoryIds,
    t,
    isPlayingAudio,
    toggleAudio,
    setIsAudioSheetOpen,
    setIsSettingsOpen,
  } = useApp();

  const isBn = language === 'bn';

  const desktopNavItems: { id: TabType; labelKey: any; icon: React.ReactNode; isGold?: boolean }[] = [
    {
      id: 'top_stories',
      labelKey: 'top_stories',
      icon: <Flame className="w-4 h-4" />,
    },
    {
      id: 'current_affairs',
      labelKey: 'current_affairs',
      icon: <BookOpen className="w-4 h-4" />,
      isGold: true,
    },
    {
      id: 'discover',
      labelKey: 'discover',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'saved',
      labelKey: 'saved',
      icon: <Bookmark className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-obsidian-bg/90 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Full Size SVG Logo & Branding */}
        <div 
          onClick={() => setActiveTab('top_stories')}
          className="flex items-center space-x-3 cursor-pointer group flex-shrink-0"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-black/40 border border-mint/30 shadow-[0_0_20px_rgba(52,211,153,0.2)] flex items-center justify-center p-0.5 group-hover:scale-105 group-hover:border-mint transition-all duration-300">
            <img 
              src="/Dorpon_logo.svg" 
              alt="Dorpon Daily Logo" 
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight leading-none group-hover:text-mint transition-colors">
                {isBn ? 'দর্পণ' : 'Dorpon'}
              </span>
              <span className="text-[11px] font-bold text-mint px-2 py-0.5 rounded-full bg-mint/10 border border-mint/20 tracking-wide uppercase">
                {isBn ? 'ডেইলি' : 'Daily'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 font-medium leading-none hidden sm:block">
              {isBn ? 'সময় বাঁচানো চলতি ঘটনাবলী' : 'Daily Current Affairs & Intelligence'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Bar (Integrated in Header on md+ screens) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 bg-obsidian-lowest/80 p-1.5 rounded-full border border-white/[0.08] shadow-inner">
          {desktopNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs lg:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? item.isGold
                      ? 'bg-gold/15 text-gold-bright border border-gold/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                      : 'bg-mint/15 text-mint-bright border border-mint/30 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                    : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>{item.icon}</span>
                <span>{t(item.labelKey)}</span>

                {item.id === 'saved' && savedStoryIds.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-mint text-obsidian-bg text-[10px] font-bold">
                    {savedStoryIds.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* Quick Audio Briefing Button */}
          <button
            onClick={() => {
              if (!isPlayingAudio) {
                toggleAudio();
              }
              setIsAudioSheetOpen(true);
            }}
            className={`group flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border text-xs sm:text-sm font-semibold transition-all duration-300 ${
              isPlayingAudio
                ? 'bg-mint/15 border-mint/40 text-mint shadow-[0_0_15px_rgba(52,211,153,0.25)]'
                : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Listen to Audio Briefing"
          >
            {isPlayingAudio ? (
              <div className="flex items-center space-x-0.5 h-3">
                <span className="w-0.5 h-2 bg-mint animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="w-0.5 h-3 bg-mint animate-[pulse_0.4s_ease-in-out_infinite]" />
                <span className="w-0.5 h-1.5 bg-mint animate-[pulse_0.8s_ease-in-out_infinite]" />
              </div>
            ) : (
              <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-mint" />
            )}
            <span className="hidden sm:inline">
              {isPlayingAudio ? t('playing') : t('listen')}
            </span>
          </button>

          {/* Font Toggle (Serif / Sans) */}
          <button
            onClick={() => setIsSerif(!isSerif)}
            className={`p-2 rounded-full border text-xs font-medium transition-all ${
              isSerif
                ? 'bg-gold/15 border-gold/40 text-gold shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.08]'
            }`}
            title={isSerif ? 'Switch to Sans-Serif' : 'Switch to Editorial Serif'}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Bilingual Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="relative flex items-center bg-obsidian-container border border-white/[0.08] rounded-full p-0.5 transition-all hover:border-mint/30"
            title="Toggle English / বাংলা"
          >
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${
                !isBn
                  ? 'bg-mint text-obsidian-bg shadow-sm font-bold'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              EN
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-300 font-bangla ${
                isBn
                  ? 'bg-mint text-obsidian-bg shadow-sm font-bold'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              বাং
            </span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.08] transition-all"
            title="Settings & Preferences"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
