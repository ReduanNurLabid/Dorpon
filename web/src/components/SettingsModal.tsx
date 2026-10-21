import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Settings as SettingsIcon, 
  Languages, 
  Type, 
  Eye, 
  Bell, 
  HardDrive, 
  Trash2, 
  Info, 
  Check, 
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    language,
    setLanguage,
    isSerif,
    setIsSerif,
    fontSize,
    setFontSize,
    focusMode,
    setFocusMode,
    clearSaved,
    t,
  } = useApp();

  const [cacheCleared, setCacheCleared] = useState(false);
  const [morningNotification, setMorningNotification] = useState(true);
  const [breakingNotification, setBreakingNotification] = useState(true);

  if (!isSettingsOpen) return null;

  const isBn = language === 'bn';

  const handleClearCache = () => {
    localStorage.removeItem('dorpon_saved_ids');
    clearSaved();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl bg-black/85 animate-fadeIn"
      onClick={() => setIsSettingsOpen(false)}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-obsidian-lowest rounded-card border border-white/[0.1] shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-obsidian-lowest">
          <div className="flex items-center space-x-2.5 text-white font-bold">
            <SettingsIcon className="w-5 h-5 text-mint" />
            <span>{t('settings')}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsSettingsOpen(false);
            }}
            className="p-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-text-secondary hover:text-white hover:bg-white/[0.1] transition-all"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Section: Language */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center space-x-2">
              <Languages className="w-4 h-4 text-mint" />
              <span>{t('language_preference')}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLanguage('en')}
                className={`p-3 rounded-tile border text-sm font-semibold flex items-center justify-between transition-all ${
                  language === 'en'
                    ? 'bg-mint/15 border-mint text-mint shadow-sm'
                    : 'bg-white/[0.02] border-white/[0.08] text-text-secondary hover:text-white'
                }`}
              >
                <span>English</span>
                {language === 'en' && <Check className="w-4 h-4 text-mint" />}
              </button>

              <button
                onClick={() => setLanguage('bn')}
                className={`p-3 rounded-tile border text-sm font-semibold flex items-center justify-between font-bangla transition-all ${
                  language === 'bn'
                    ? 'bg-mint/15 border-mint text-mint shadow-sm'
                    : 'bg-white/[0.02] border-white/[0.08] text-text-secondary hover:text-white'
                }`}
              >
                <span>বাংলা (Bengali)</span>
                {language === 'bn' && <Check className="w-4 h-4 text-mint" />}
              </button>
            </div>
          </div>

          {/* Section: Typography */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center space-x-2">
              <Type className="w-4 h-4 text-mint" />
              <span>{t('reading_font')}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setIsSerif(false)}
                className={`p-3 rounded-tile border text-xs sm:text-sm font-medium flex items-center justify-between transition-all font-sans ${
                  !isSerif
                    ? 'bg-mint/15 border-mint text-mint shadow-sm'
                    : 'bg-white/[0.02] border-white/[0.08] text-text-secondary hover:text-white'
                }`}
              >
                <div>
                  <span className="font-bold block">{t('sans')}</span>
                  <span className="text-[11px] text-text-secondary">Plus Jakarta / Hind</span>
                </div>
                {!isSerif && <Check className="w-4 h-4 text-mint" />}
              </button>

              <button
                onClick={() => setIsSerif(true)}
                className={`p-3 rounded-tile border text-xs sm:text-sm font-medium flex items-center justify-between transition-all font-serif ${
                  isSerif
                    ? 'bg-gold/15 border-gold text-gold shadow-sm'
                    : 'bg-white/[0.02] border-white/[0.08] text-text-secondary hover:text-white'
                }`}
              >
                <div>
                  <span className="font-bold block">{t('serif')}</span>
                  <span className="text-[11px] text-text-secondary">Lora / Noto Serif</span>
                </div>
                {isSerif && <Check className="w-4 h-4 text-gold" />}
              </button>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between p-3 rounded-tile bg-white/[0.02] border border-white/[0.06]">
              <span className="text-xs font-semibold text-text-secondary">
                {isBn ? 'লেখা প্রদর্শনের আকার' : 'Reading Text Size'}
              </span>
              <div className="flex items-center space-x-1.5">
                {(['sm', 'base', 'lg'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      fontSize === sz
                        ? 'bg-mint text-obsidian-bg'
                        : 'bg-white/[0.04] text-text-secondary hover:text-white'
                    }`}
                  >
                    {sz === 'sm' ? 'A-' : sz === 'base' ? 'A' : 'A+'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Focus Mode */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center space-x-2">
              <Eye className="w-4 h-4 text-mint" />
              <span>{isBn ? 'মনোযোগ ও ডিসপ্লে মোড' : 'Focus & Display Mode'}</span>
            </h4>
            <div className="flex items-center justify-between p-3.5 rounded-tile bg-white/[0.02] border border-white/[0.06]">
              <div>
                <span className="text-sm font-semibold text-white block">
                  {t('focus_mode')}
                </span>
                <span className="text-xs text-text-secondary">
                  {isBn ? 'পঠনকালে অপ্রয়োজনীয় বার আড়াল করুন' : 'Hide distractions during reading'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={focusMode}
                onChange={(e) => setFocusMode(e.target.checked)}
                className="w-5 h-5 accent-mint rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Section: Storage & Cache */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-mint" />
              <span>{t('storage')}</span>
            </h4>
            <div className="flex items-center justify-between p-3.5 rounded-tile bg-white/[0.02] border border-white/[0.06]">
              <div>
                <span className="text-sm font-semibold text-white block">
                  {t('clear_cache')}
                </span>
                <span className="text-xs text-text-secondary">
                  {cacheCleared ? (
                    <span className="text-mint font-semibold">{t('cache_cleared')}</span>
                  ) : isBn ? (
                    'অফলাইন ডেটা ও সংরক্ষিত খবর সাফ করুন'
                  ) : (
                    'Remove offline stored snapshots and bookmarks'
                  )}
                </span>
              </div>
              <button
                onClick={handleClearCache}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'সাফ করুন' : 'Clear'}</span>
              </button>
            </div>
          </div>

          {/* About Platform */}
          <div className="p-4 rounded-tile bg-mint/5 border border-mint/20 space-y-2">
            <div className="flex items-center space-x-2 text-mint text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Sondesh Express Autonomous Intelligence</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Autonomous news ingestion powered by Google Gemini AI, cross-source deduplication, and Google Cloud Firestore. Designed for calm, high-signal intelligence.
            </p>
            <div className="flex items-center space-x-3 text-[11px] text-text-tertiary pt-1">
              <span>Version 2.0 Web</span>
              <span>•</span>
              <span>Obsidian Glass UI</span>
              <span>•</span>
              <span>Bilingual EN/BN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
