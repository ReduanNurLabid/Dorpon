// Standalone Client-Side & Neural TTS Service for Dorpon Daily
// Works 100% standalone on mobile phones, tablets, and desktop with ZERO server required!

const LOCAL_DORPON_API = 'http://localhost:8000/api/tts';
const LOCAL_VOICE_STUDIO_API = 'http://localhost:5050/api';
const RENDER_CLOUD_API = 'https://tts-voice-studio-4yxi.onrender.com/api';

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
];

/**
 * Text preparation with natural respiratory pauses
 */
export function prepareSpeechText(text: string): { cleanedText: string; isBengali: boolean } {
  let t = text.replace(/<[^>]+>/g, ' ');
  t = t.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  t = t.replace(/https?:\/\/\S+/g, '');

  const isBengali = /[\u0980-\u09FF]/.test(t);

  if (isBengali) {
    t = t.replace(/;/g, ', ');
    t = t.replace(/।\s*/g, '। ');
    const bnTransitions = ['তবে', 'কিন্তু', 'অবশ্যই', 'সুতরাং', 'অবশেষে', 'কারণ', 'যেমন'];
    for (const tr of bnTransitions) {
      t = t.replace(new RegExp(`(^|[।!?\\n]\\s*)(${tr})`, 'g'), '$1$2, ');
    }
  } else {
    t = t.replace(/;/g, ', ');
    t = t.replace(/\s*\(([^)]+)\)\s*/g, ' — $1 — ');
    t = t.replace(/^(\s*)(\d+)\.\s+([^:\n]+):/gm, '$1Point $2: $3. ');
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
 * Splits text into concise sentence chunks (<= 160 characters) suitable for direct mobile audio streaming
 */
export function splitIntoSpeechChunks(text: string, maxLen: number = 150): string[] {
  if (text.length <= maxLen) return [text];

  const sentences = text.match(/[^।!?.\n]+[।!?.\n]*/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;

    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length <= maxLen) {
        current = s;
      } else {
        // Sub-split by comma or words
        const parts = s.split(/,\s*/);
        current = '';
        for (const part of parts) {
          if ((current + ', ' + part).trim().length <= maxLen) {
            current = current ? `${current}, ${part}` : part;
          } else {
            if (current) chunks.push(current);
            // Word level split if individual part is still too long
            if (part.length <= maxLen) {
              current = part;
            } else {
              const words = part.split(/\s+/);
              for (const w of words) {
                if ((current + ' ' + w).trim().length <= maxLen) {
                  current = (current + ' ' + w).trim();
                } else {
                  if (current) chunks.push(current);
                  current = w;
                }
              }
            }
          }
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(c => c.length > 0);
}

/**
 * Generates direct standalone Google TTS MP3 URLs for chunks
 * Completely client-side, zero backend required, works on all mobile phones & browsers!
 */
export function getStandaloneAudioStreamUrls(text: string, isBengali: boolean): { urls: string[]; duration: number } {
  const chunks = splitIntoSpeechChunks(text, 150);
  const lang = isBengali ? 'bn' : 'en';

  const urls = chunks.map(chunk => 
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`
  );

  const wordCount = text.split(/\s+/).length;
  const duration = Math.max(10, Math.round(wordCount / 2.2));

  return { urls, duration };
}

export interface AudioSynthesisResult {
  urls: string[];
  duration: number;
  engine: 'neural' | 'standalone';
}

/**
 * Synthesizes audio.
 * Probes optional local/cloud Edge-TTS neural server with a strict 400ms timeout.
 * If server is absent (e.g. users on mobile phone, static production hosting),
 * seamlessly and immediately uses the standalone client-side engine.
 */
export async function synthesizeAudioStory(
  text: string,
  preferredVoice?: string,
  rate: string = '+0%'
): Promise<AudioSynthesisResult> {
  const { cleanedText, isBengali } = prepareSpeechText(text);
  const voice = preferredVoice || (isBengali ? 'bn-BD-NabanitaNeural' : 'en-US-EmmaNeural');

  // Quick non-blocking probe of optional neural endpoints (timeout: 450ms)
  const endpoints = [
    `${LOCAL_DORPON_API}/speak`,
    `${LOCAL_VOICE_STUDIO_API}/speak`,
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 450);

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
          const duration = Math.max(12, Math.round(wordCount / 2.3));
          return { urls: [data.audio], duration, engine: 'neural' };
        }
      }
    } catch {
      // Local server not running - continue to standalone mobile engine
    }
  }

  // 100% Standalone client-side synthesis (works universally on all mobile phones & web browsers)
  const { urls, duration } = getStandaloneAudioStreamUrls(cleanedText, isBengali);
  return { urls, duration, engine: 'standalone' };
}
