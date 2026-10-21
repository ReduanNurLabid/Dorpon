// Voice Companion & Neural TTS Client Engine for Dorpon Daily
// Directly mirrors Voice Studio (C:\Users\Reduan\Downloads\TTS\voice_studio)

const LOCAL_ENDPOINTS = [
  'http://localhost:8765/api/speak',
  'http://localhost:8000/api/tts/speak',
  'http://localhost:8000/api/speak',
  'http://localhost:5050/api/speak',
];

const CLOUD_ENDPOINT = 'https://tts-voice-studio-4yxi.onrender.com/api/speak';

export interface TTSVoice {
  id: string;
  name: string;
  gender: string;
  region: string;
  language: string;
  tag: string;
  recommended: boolean;
}

export const NEURAL_VOICES: TTSVoice[] = [
  {
    id: 'bn-BD-NabanitaNeural',
    name: 'Nabanita (নবনীত)',
    gender: 'Female',
    region: 'Bangladesh 🇧🇩',
    language: 'Bengali (বাংলা)',
    tag: 'Warm & Melodic',
    recommended: true,
  },
  {
    id: 'bn-BD-PradeepNeural',
    name: 'Pradeep (প্রদীপ)',
    gender: 'Male',
    region: 'Bangladesh 🇧🇩',
    language: 'Bengali (বাংলা)',
    tag: 'Natural & Narrative',
    recommended: true,
  },
  {
    id: 'bn-IN-TanishaaNeural',
    name: 'Tanishaa (তানিশা)',
    gender: 'Female',
    region: 'India 🇮🇳',
    language: 'Bengali (বাংলা)',
    tag: 'Sweet & Clear',
    recommended: false,
  },
  {
    id: 'en-US-EmmaNeural',
    name: 'Emma',
    gender: 'Female',
    region: 'US 🇺🇸',
    language: 'English',
    tag: 'Gentle & Reflective',
    recommended: true,
  },
  {
    id: 'en-US-AndrewNeural',
    name: 'Andrew',
    gender: 'Male',
    region: 'US 🇺🇸',
    language: 'English',
    tag: 'Warm & Conversational',
    recommended: true,
  },
];

/**
 * Clean & inject respiratory pauses (exact copy of Voice Studio clean_and_inject_pauses)
 */
export function prepareSpeechText(text: string): { cleanedText: string; isBengali: boolean } {
  let t = text.replace(/<[^>]+>/g, ' ');
  t = t.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  t = t.replace(/https?:\/\/\S+/g, '');

  const isBengali = /[\u0980-\u09FF]/.test(t);

  if (isBengali) {
    t = t.replace(/;/g, ', ');
    t = t.replace(/।\s*/g, '। ... ');
    const bnTransitions = ['তবে', 'কিন্তু', 'অবশ্যই', 'সুতরাং', 'অবশেষে', 'কারণ', 'যেমন'];
    for (const tr of bnTransitions) {
      t = t.replace(new RegExp(`(^|[।!?\\n]\\s*)(${tr})`, 'g'), '$1$2, ');
    }
  } else {
    t = t.replace(/;/g, ', ');
    t = t.replace(/\s*\(([^)]+)\)\s*/g, ' — $1 — ');
    t = t.replace(/^(\s*)(\d+)\.\s+([^:\n]+):/gm, '$1Point $2: $3... ');
    const enTransitions = [
      'First', 'Second', 'Third', 'Finally', 'During', 'When', 'There are',
      'Apparently', 'However', 'On the other hand', 'In fact', 'Actually',
      'For example', 'For instance', 'Notice that', 'Keep in mind'
    ];
    for (const tr of enTransitions) {
      t = t.replace(new RegExp(`(^|[.!?\\n]\\s*)(${tr}),?\\s+([A-Za-z])`, 'gi'), '$1$2, $3');
    }
    t = t.replace(/,?\s*(but|although|whereas|however)\s+/gi, ', $1 ');
    t = t.replace(/,?\s*(because|so that)\s+/gi, ', $1 ');
  }

  t = t.replace(/[*`#~|]/g, ' ');
  t = t.replace(/,\s*,+/g, ', ');
  t = t.replace(/\.{4,}/g, '... ');
  t = t.replace(/\s+/g, ' ').trim();

  return { cleanedText: t, isBengali };
}

export interface AudioSynthesisResult {
  audioUrl: string;
  duration: number;
  words?: Array<{ text: string; start: number; end: number }>;
}

const synthesisCache = new Map<string, AudioSynthesisResult>();

/**
 * Synthesizes neural audio matching Voice Studio.
 * 1. Checks memory cache
 * 2. Probes local Dorpon/Voice Studio servers (ports 8765, 8000, 5050)
 * 3. Probes Render Cloud Voice Studio API
 * 4. Falls back to direct standalone Google TTS stream if backend is offline
 */
export async function synthesizeAudioStory(
  text: string,
  preferredVoice?: string,
  rate: string = '+0%'
): Promise<AudioSynthesisResult> {
  const { cleanedText, isBengali } = prepareSpeechText(text);
  const voice = preferredVoice || (isBengali ? 'bn-BD-NabanitaNeural' : 'en-US-EmmaNeural');
  const cacheKey = `${voice}_${rate}_${cleanedText.slice(0, 100)}_${cleanedText.length}`;

  if (synthesisCache.has(cacheKey)) {
    return synthesisCache.get(cacheKey)!;
  }

  const wordCount = cleanedText.split(/\s+/).length;
  const estimatedDuration = Math.max(8, Math.round(wordCount / 2.2));

  // 1. Try local endpoints (fast 500ms timeout)
  for (const ep of LOCAL_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanedText,
          voice,
          rate,
          pitch: '+0Hz',
          natural_pauses: true,
          format: 'json',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.audio) {
          const result: AudioSynthesisResult = {
            audioUrl: data.audio,
            duration: estimatedDuration,
            words: data.words || [],
          };
          synthesisCache.set(cacheKey, result);
          return result;
        }
      }
    } catch {
      // Local endpoint offline or timed out
    }
  }

  // 2. Try Render Cloud Voice Studio API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(CLOUD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanedText,
        voice,
        rate,
        pitch: '+0Hz',
        natural_pauses: true,
        format: 'json',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.audio) {
        const result: AudioSynthesisResult = {
          audioUrl: data.audio,
          duration: estimatedDuration,
          words: data.words || [],
        };
        synthesisCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // Cloud API offline
  }

  // 3. Fallback: Standalone client-side Google TTS stream
  const lang = isBengali ? 'bn' : 'en';
  const standaloneUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanedText.slice(0, 190))}&tl=${lang}&client=tw-ob`;

  const fallbackResult: AudioSynthesisResult = {
    audioUrl: standaloneUrl,
    duration: estimatedDuration,
  };
  return fallbackResult;
}
