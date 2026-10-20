import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CapsuleStory, Language, TabType } from '../types';
import { fetchDailyBuzzFeed, fetchCurrentAffairsFeed, fetchHourlyWiresFeed } from '../services/api';
import { translations } from '../utils/bilingual';
import { synthesizeNeuralAudio, prepareSpeechText } from '../services/ttsService';

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
  // Neural Audio Engine
  currentAudioStory: CapsuleStory | null;
  isPlayingAudio: boolean;
  isAudioLoading: boolean;
  audioProgress: number; // 0-100 percentage
  audioTimeRemaining: number; // seconds
  audioDuration: number; // total duration in seconds
  audioPlaybackRate: number;
  audioHeartbeatScale: number; // 1.0 to 1.8 dynamic scale for heartbeat animation
  setAudioPlaybackRate: (rate: number) => void;
  playStoryAudio: (story: CapsuleStory) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  toggleAudio: () => void;
  stopAudio: () => void;
  dismissAudioPlayer: () => void;
  playNextAudio: () => void;
  playPrevAudio: () => void;
  skipAudio: (seconds: number) => void;
  seekAudio: (percent: number) => void;
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
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(45);
  const [audioTimeRemaining, setAudioTimeRemaining] = useState<number>(45);
  const [audioPlaybackRate, setAudioPlaybackRateState] = useState<number>(1.0);
  const [audioHeartbeatScale, setAudioHeartbeatScale] = useState<number>(1.0);

  // Audio Elements & Context References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize HTML5 Audio Element
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    chimeAudioRef.current = new Audio('/data/transition_chime.wav');
    chimeAudioRef.current.volume = 0.3;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Exact progress and time listeners
    audio.ontimeupdate = () => {
      const cur = audio.currentTime;
      const dur = audio.duration;
      if (dur && !isNaN(dur) && dur > 0) {
        const pct = Math.min(100, (cur / dur) * 100);
        setAudioProgress(pct);
        setAudioTimeRemaining(Math.max(0, Math.round(dur - cur)));
      }
    };

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(Math.round(audio.duration));
        setAudioTimeRemaining(Math.round(audio.duration));
      }
    };

    audio.onended = () => {
      setIsPlayingAudio(false);
      setAudioProgress(100);
      try {
        chimeAudioRef.current?.play().catch(() => {});
      } catch {}
      playNextAudio();
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      setIsAudioLoading(false);
    };

    return () => {
      audio.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Web Audio Visualizer Setup
  const initAudioAnalyser = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (audioRef.current && !sourceNodeRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        sourceNodeRef.current = source;
      }
    } catch (err) {
      // AudioContext policy fallback
    }
  };

  // Heartbeat & Waveform animation loop
  useEffect(() => {
    let phase = 0;
    const updateHeartbeat = () => {
      if (isPlayingAudio) {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          // Scale from 1.0 to 1.6 based on real volume
          const scale = 1.0 + Math.min(0.6, (avg / 255) * 1.2);
          setAudioHeartbeatScale(scale);
        } else {
          // Organic breathing pulse fallback
          phase += 0.08;
          const scale = 1.0 + Math.sin(phase) * 0.15;
          setAudioHeartbeatScale(scale);
        }
      } else {
        setAudioHeartbeatScale(1.0);
      }
      animFrameRef.current = requestAnimationFrame(updateHeartbeat);
    };

    animFrameRef.current = requestAnimationFrame(updateHeartbeat);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlayingAudio]);

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

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

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

  // Audio Player Engine
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlayingAudio(false);
    setIsAudioLoading(false);
    setAudioProgress(0);
  };

  // Completely dismisses the floating player and sheet overlay
  const dismissAudioPlayer = () => {
    stopAudio();
    setCurrentAudioStory(null);
    setIsAudioSheetOpen(false);
  };

  const playStoryAudio = async (story: CapsuleStory) => {
    stopAudio();
    setCurrentAudioStory(story);
    setIsAudioLoading(true);

    const isBn = language === 'bn';
    const buzz = story.daily_buzz;
    const title = isBn ? (buzz.title_bn || buzz.title_en) : (buzz.title_en || buzz.title_bn);
    const bullets = isBn ? (buzz.bullets_bn || []) : (buzz.bullets_en || []);
    const whyItMatters = isBn ? (buzz.why_it_matters_bn || buzz.summary_bn) : (buzz.why_it_matters_en || buzz.summary_en);

    const speechScript = `${title}. ` +
      (bullets.length > 0 ? (isBn ? `মূল বার্তা: ${bullets.join('। ')}। ` : `Key takeaways: ${bullets.join('. ')}. `) : '') +
      (whyItMatters ? (isBn ? `কেন এটি গুরুত্বপূর্ণ: ${whyItMatters}` : `Why it matters: ${whyItMatters}`) : '');

    const voice = isBn ? 'bn-BD-NabanitaNeural' : 'en-US-EmmaNeural';
    const ratePercent = Math.round((audioPlaybackRate - 1.0) * 100);
    const rateStr = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;

    try {
      const { audioUrl, duration } = await synthesizeNeuralAudio(speechScript, voice, rateStr);
      if (audioRef.current) {
        initAudioAnalyser();
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = audioPlaybackRate;
        setAudioDuration(duration);
        setAudioTimeRemaining(duration);
        await audioRef.current.play();
        setIsPlayingAudio(true);
        setIsAudioLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Neural TTS failed, falling back to Web Speech:', err);
    }

    // Web Speech API Fallback
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(speechScript);
      utterance.rate = audioPlaybackRate;
      const voices = synthRef.current.getVoices();
      if (isBn) {
        const bnVoice = voices.find(v => v.lang.startsWith('bn'));
        if (bnVoice) utterance.voice = bnVoice;
      } else {
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }
      utterance.onend = () => {
        setIsPlayingAudio(false);
        playNextAudio();
      };
      synthRef.current.speak(utterance);
      setIsPlayingAudio(true);
    }
    setIsAudioLoading(false);
  };

  const pauseAudio = () => {
    if (audioRef.current && isPlayingAudio) {
      audioRef.current.pause();
    }
    if (synthRef.current) {
      synthRef.current.pause();
    }
    setIsPlayingAudio(false);
  };

  const resumeAudio = () => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    } else if (synthRef.current) {
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

  const skipAudio = (seconds: number) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds));
    }
  };

  const seekAudio = (percent: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const targetTime = (Math.max(0, Math.min(100, percent)) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = targetTime;
    }
  };

  const setAudioPlaybackRate = (rate: number) => {
    setAudioPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
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
        isAudioLoading,
        audioProgress,
        audioTimeRemaining,
        audioDuration,
        audioPlaybackRate,
        audioHeartbeatScale,
        setAudioPlaybackRate,
        playStoryAudio,
        pauseAudio,
        resumeAudio,
        toggleAudio,
        stopAudio,
        dismissAudioPlayer,
        playNextAudio,
        playPrevAudio,
        skipAudio,
        seekAudio,
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
