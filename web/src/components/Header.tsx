import React from 'react';
import { useApp } from '../context/AppContext';
import { Headphones, Volume2, Type, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { toBanglaDigits } from '../utils/bilingual';

export const Header: React.FC = () => {
  const {
    language,
    toggleLanguage,
    isSerif,
    setIsSerif,
    t,
    isPlayingAudio,
    toggleAudio,
    setIsAudioSheetOpen,
    setIsSettingsOpen,
  } = useApp();

  const isBn = language === 'bn';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('good_morning');
    if (hour >= 12 && hour < 17) return t('good_afternoon');
    if (hour >= 17 && hour < 21) return t('good_evening');
    return t('welcome_back');
  };

  const getFormattedDate = () => {
    const now = new Date();
    if (isBn) {
      const weekdaysBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      const monthsBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
      const dayName = weekdaysBn[now.getDay()];
      const monthName = monthsBn[now.getMonth()];
      return `দৈনিক ব্রিফ • ${dayName}, ${monthName} ${toBanglaDigits(now.getDate())}`;
    }
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Daily Brief • ${weekdays[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-obsidian-bg/80 border-b border-white/[0.06] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand & Greeting */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-mint/20 via-mint/5 to-transparent border border-mint/30 shadow-[0_0_20px_rgba(52,211,153,0.15)] overflow-hidden">
            <img 
              src="/Dorpon_logo.svg" 
              alt="Dorpon Logo" 
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow" 
              onError={(e) => {
                // fallback if svg fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-bold text-mint text-lg tracking-tight select-none">দ</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg sm:text-xl text-white tracking-tight leading-none">
                {isBn ? 'দর্পণ' : 'Dorpon'}
                <span className="text-mint font-normal text-xs sm:text-sm ml-1.5 px-2 py-0.5 rounded-full bg-mint/10 border border-mint/20">
                  {isBn ? 'ডেইলি' : 'Daily'}
                </span>
              </h1>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 font-medium hidden sm:block">
              {getGreeting()} — <span className="text-text-primary/70">{getFormattedDate()}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Audio Briefing Button */}
          <button
            onClick={() => {
              if (!isPlayingAudio) {
                toggleAudio();
              }
              setIsAudioSheetOpen(true);
            }}
            className={`group flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border text-xs sm:text-sm font-medium transition-all duration-300 ${
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
            <span className="hidden xs:inline">
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
            <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
