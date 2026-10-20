import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CapsuleStory, Language, TabType } from '../types';
import { fetchDailyBuzzFeed, fetchCurrentAffairsFeed, fetchHourlyWiresFeed } from '../services/api';
import { translations } from '../utils/bilingual';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isSerif: boolean;
  setIsSerif: (val: boolean) => void;
  fontSize: 'sm' | 'base' | 'lg';
  setFontSize: (size: 'sm' | 'base' | 'lg') => void;
  focusMode: boolean;
  setFocusMode: (val: boolean) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  savedStoryIds: string[];
  toggleSave: (storyId: string) => void;
  isSaved: (storyId: string) => boolean;
  clearSaved: () => void;
  activeStory: CapsuleStory | null;
  openStory: (story: CapsuleStory) => void;
  closeStory: () => void;
  isAudioSheetOpen: boolean;
  setIsAudioSheetOpen: (val: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
  buzzStories: CapsuleStory[];
  currentAffairs: CapsuleStory[];
  hourlyWires: CapsuleStory[];
  allStories: CapsuleStory[];
  isLoading: boolean;
  refreshFeeds: () => Promise<void>;
  t: (key: keyof typeof translations['en']) => string;
  // Audio Player Engine
  currentAudioStory: CapsuleStory | null;
  isPlayingAudio: boolean;
  audioProgress: number; // 0-100 percentage
  audioTimeRemaining: number; // seconds
  audioPlaybackRate: number;
  setAudioPlaybackRate: (rate: number) => void;
  playStoryAudio: (story: CapsuleStory) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  toggleAudio: () => void;
  stopAudio: () => void;
  playNextAudio: () => void;
  playPrevAudio: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('dorpon_lang') as Language) || 'en';
  });
  const [isSerif, setIsSerifState] = useState<boolean>(() => {
    return localStorage.getItem('dorpon_serif') === 'true';
  });
  const [fontSize, setFontSizeState] = useState<'sm' | 'base' | 'lg'>('base');
  const [focusMode, setFocusModeState] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('top_stories');

  const [savedStoryIds, setSavedStoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dorpon_saved_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeStory, setActiveStory] = useState<CapsuleStory | null>(null);
  const [isAudioSheetOpen, setIsAudioSheetOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [buzzStories, setBuzzStories] = useState<CapsuleStory[]>([]);
  const [currentAffairs, setCurrentAffairs] = useState<CapsuleStory[]>([]);
  const [hourlyWires, setHourlyWires] = useState<CapsuleStory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Audio Engine State
  const [currentAudioStory, setCurrentAudioStory] = useState<CapsuleStory | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioTimeRemaining, setAudioTimeRemaining] = useState<number>(60);
  const [audioPlaybackRate, setAudioPlaybackRateState] = useState<number>(1.0);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    chimeAudioRef.current = new Audio('/data/transition_chime.wav');
    chimeAudioRef.current.volume = 0.4;
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('dorpon_lang', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'bn' : 'en';
    setLanguage(next);
  };

  const setIsSerif = (val: boolean) => {
    setIsSerifState(val);
    localStorage.setItem('dorpon_serif', String(val));
  };

  const setFontSize = (size: 'sm' | 'base' | 'lg') => {
    setFontSizeState(size);
  };

  const setFocusMode = (val: boolean) => {
    setFocusModeState(val);
  };

  const toggleSave = (storyId: string) => {
    setSavedStoryIds(prev => {
      const exists = prev.includes(storyId);
      const updated = exists ? prev.filter(id => id !== storyId) : [storyId, ...prev];
      localStorage.setItem('dorpon_saved_ids', JSON.stringify(updated));
      return updated;
    });
  };

  const isSaved = (storyId: string) => savedStoryIds.includes(storyId);

  const clearSaved = () => {
    setSavedStoryIds([]);
    localStorage.removeItem('dorpon_saved_ids');
  };

  const openStory = (story: CapsuleStory) => {
    setActiveStory(story);
  };

  const closeStory = () => {
    setActiveStory(null);
  };

  // Translation helper
  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  // Fetch feeds
  const refreshFeeds = async () => {
    setIsLoading(true);
    try {
      const [buzz, affairs, wires] = await Promise.all([
        fetchDailyBuzzFeed(),
        fetchCurrentAffairsFeed(),
        fetchHourlyWiresFeed(),
      ]);
      setBuzzStories(buzz);
      setCurrentAffairs(affairs);
      setHourlyWires(wires);
    } catch (err) {
      console.error('Error fetching feeds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshFeeds();
  }, []);

  const allStories = React.useMemo(() => {
    const map = new Map<string, CapsuleStory>();
    for (const s of buzzStories) map.set(s.story_id, s);
    for (const s of currentAffairs) map.set(s.story_id, s);
    for (const s of hourlyWires) map.set(s.story_id, s);
    return Array.from(map.values());
  }, [buzzStories, currentAffairs, hourlyWires]);

  // Audio Playback
  const stopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  const playStoryAudio = (story: CapsuleStory) => {
    stopAudio();
    setCurrentAudioStory(story);

    const isBn = language === 'bn';
    const buzz = story.daily_buzz;
    const title = isBn ? (buzz.title_bn || buzz.title_en) : (buzz.title_en || buzz.title_bn);
    const bullets = isBn ? (buzz.bullets_bn || []) : (buzz.bullets_en || []);
    const whyItMatters = isBn ? (buzz.why_it_matters_bn || buzz.summary_bn) : (buzz.why_it_matters_en || buzz.summary_en);

    const fullSpeechText = `${title}. ` +
      (bullets.length > 0 ? `Key takeaways: ${bullets.join('. ')}. ` : '') +
      `Why it matters: ${whyItMatters}`;

    if (!synthRef.current) {
      setIsPlayingAudio(true);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(fullSpeechText);
    utterance.rate = audioPlaybackRate;
    utterance.pitch = 1.0;

    // Pick appropriate voice
    const voices = synthRef.current.getVoices();
    if (isBn) {
      const bnVoice = voices.find(v => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'));
      if (bnVoice) utterance.voice = bnVoice;
    } else {
      const enVoice = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.name.includes('Natural'));
      if (enVoice) utterance.voice = enVoice;
    }

    const estimatedDurationSecs = Math.max(30, Math.round(fullSpeechText.split(/\s+/).length / (2.5 * audioPlaybackRate)));
    setAudioTimeRemaining(estimatedDurationSecs);
    let elapsedSecs = 0;

    progressTimerRef.current = window.setInterval(() => {
      elapsedSecs += 0.5;
      const pct = Math.min(100, Math.round((elapsedSecs / estimatedDurationSecs) * 100));
      setAudioProgress(pct);
      setAudioTimeRemaining(Math.max(0, Math.round(estimatedDurationSecs - elapsedSecs)));
      if (pct >= 100) {
        if (progressTimerRef.current) {
          window.clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
      }
    }, 500);

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setAudioProgress(100);
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      // Play subtle chime on finish
      try {
        chimeAudioRef.current?.play().catch(() => {});
      } catch {}
      // Auto-progress to next story if available
      playNextAudio();
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlayingAudio(true);
  };

  const pauseAudio = () => {
    if (synthRef.current && isPlayingAudio) {
      synthRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const resumeAudio = () => {
    if (synthRef.current && !isPlayingAudio) {
      synthRef.current.resume();
      setIsPlayingAudio(true);
    }
  };

  const toggleAudio = () => {
    if (isPlayingAudio) {
      pauseAudio();
    } else {
      if (currentAudioStory) {
        resumeAudio();
      } else if (buzzStories.length > 0) {
        playStoryAudio(buzzStories[0]);
      }
    }
  };

  const playNextAudio = () => {
    if (!currentAudioStory || buzzStories.length === 0) return;
    const currentIndex = buzzStories.findIndex(s => s.story_id === currentAudioStory.story_id);
    const nextIndex = (currentIndex + 1) % buzzStories.length;
    playStoryAudio(buzzStories[nextIndex]);
  };

  const playPrevAudio = () => {
    if (!currentAudioStory || buzzStories.length === 0) return;
    const currentIndex = buzzStories.findIndex(s => s.story_id === currentAudioStory.story_id);
    const prevIndex = (currentIndex - 1 + buzzStories.length) % buzzStories.length;
    playStoryAudio(buzzStories[prevIndex]);
  };

  const setAudioPlaybackRate = (rate: number) => {
    setAudioPlaybackRateState(rate);
    if (currentAudioStory && isPlayingAudio) {
      playStoryAudio(currentAudioStory);
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isSerif,
        setIsSerif,
        fontSize,
        setFontSize,
        focusMode,
        setFocusMode,
        activeTab,
        setActiveTab,
        savedStoryIds,
        toggleSave,
        isSaved,
        clearSaved,
        activeStory,
        openStory,
        closeStory,
        isAudioSheetOpen,
        setIsAudioSheetOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        buzzStories,
        currentAffairs,
        hourlyWires,
        allStories,
        isLoading,
        refreshFeeds,
        t,
        currentAudioStory,
        isPlayingAudio,
        audioProgress,
        audioTimeRemaining,
        audioPlaybackRate,
        setAudioPlaybackRate,
        playStoryAudio,
        pauseAudio,
        resumeAudio,
        toggleAudio,
        stopAudio,
        playNextAudio,
        playPrevAudio,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
