// Neural TTS Client Service ported from C:\Users\Reduan\Downloads\TTS\voice_studio

const LOCAL_DORPON_API = 'http://localhost:8000/api/tts';
const LOCAL_VOICE_STUDIO_API = 'http://localhost:5050/api';
const RENDER_CLOUD_API = 'https://tts-voice-studio-4yxi.onrender.com/api';

const audioCache = new Map<string, { audioUrl: string; duration: number }>();

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
  {
    id: 'en-US-AvaNeural',
    name: 'Ava',
    gender: 'Female',
    region: 'US 🇺🇸',
    language: 'English',
    tag: 'Melodic & Expressive',
    recommended: true,
  },
];

/**
 * Client-side text preparation with respiratory breath pauses
 * (Mirrors clean_and_inject_pauses from Voice Studio server.py)
 */
export function prepareSpeechText(text: string): { cleanedText: string; isBengali: boolean } {
  // Strip HTML
  let t = text.replace(/<[^>]+>/g, ' ');
  // Strip Markdown links
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

/**
 * Synthesizes neural audio via the TTS endpoints.
 * Returns a playable object URL (blob or data URI) and estimated duration.
 */
export async function synthesizeNeuralAudio(
  text: string,
  preferredVoice?: string,
  rate: string = '+0%'
): Promise<{ audioUrl: string; duration: number }> {
  const { cleanedText, isBengali } = prepareSpeechText(text);

  const voice = preferredVoice || (isBengali ? 'bn-BD-NabanitaNeural' : 'en-US-EmmaNeural');
  const cacheKey = `${voice}_${rate}_${cleanedText.slice(0, 80)}_${cleanedText.length}`;

  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const endpoints = [
    `${LOCAL_DORPON_API}/speak`,
    `${LOCAL_VOICE_STUDIO_API}/speak`,
    `${RENDER_CLOUD_API}/speak`,
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
          const wordCount = data.word_count || cleanedText.split(/\s+/).length;
          const duration = Math.max(15, Math.round(wordCount / 2.3));
          const result = { audioUrl: data.audio, duration };
          audioCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (e) {
      // Continue to next endpoint fallback
    }
  }

  // Final direct MP3 stream endpoint fallback
  try {
    const streamUrl = `${LOCAL_DORPON_API}/audio?text=${encodeURIComponent(cleanedText)}&voice=${encodeURIComponent(voice)}&rate=${encodeURIComponent(rate)}`;
    const check = await fetch(streamUrl, { method: 'HEAD' });
    if (check.ok) {
      const wordCount = cleanedText.split(/\s+/).length;
      const duration = Math.max(15, Math.round(wordCount / 2.3));
      return { audioUrl: streamUrl, duration };
    }
  } catch {}

  throw new Error('TTS service currently unavailable on local and cloud endpoints.');
}
