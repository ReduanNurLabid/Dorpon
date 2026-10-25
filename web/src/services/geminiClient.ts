// Client-Side AI Refinement Engine for Sondesh Express Social Media Studio

export interface SocialCardContent {
  hookTitle: string;
  keyPoints: string[];
  caption: string;
}

export interface RefineRequest {
  title: string;
  summary?: string;
  bullets?: string[];
  language: 'bn' | 'en';
  tone: 'positive' | 'critical';
  apiKey?: string;
}

/**
 * Heuristic fallback when Gemini API is unavailable or unconfigured.
 */
export function getHeuristicSocialContent(
  title: string,
  summary: string = '',
  bullets: string[] = [],
  language: 'bn' | 'en',
  tone: 'positive' | 'critical'
): SocialCardContent {
  const isBn = language === 'bn';

  // 1. Clean headline
  let hookTitle = title.trim();
  hookTitle = hookTitle.replace(/^[•\-\*\d\.\)\:\s]+/, '');

  // 2. Pick 2-3 summarized key points
  const keyPoints: string[] = [];
  if (bullets && bullets.length > 0) {
    for (const b of bullets) {
      const cleaned = b.trim().replace(/^[•\-\*\d\.\)\:\s]+/, '');
      if (cleaned.length > 5 && !keyPoints.includes(cleaned)) {
        keyPoints.push(cleaned);
      }
      if (keyPoints.length >= 3) break;
    }
  }

  // Fallback to summary sentences if bullets are sparse
  if (keyPoints.length < 2 && summary.trim()) {
    const sentences = summary
      .split(/[।.\n]/)
      .map((s) => s.trim().replace(/^[•\-\*\d\.\)\:\s]+/, ''))
      .filter((s) => s.length > 12);
    for (const s of sentences) {
      if (!keyPoints.includes(s)) {
        keyPoints.push(s);
      }
      if (keyPoints.length >= 3) break;
    }
  }

  // Guaranteed fallback
  if (keyPoints.length === 0) {
    keyPoints.push(
      isBn
        ? 'ঘটনার বিস্তারিত ও বিশ্লেষণ জানতে ভিজিট করুন সন্দেশ এক্সপ্রেস।'
        : 'Stay informed with high-signal dispatches from Sondesh Express.'
    );
  }

  // 3. Minimalist caption
  const hashtags = isBn
    ? '#সন্দেশএক্সপ্রেস #SondeshExpress #বাংলাদেশ #CurrentAffairs #BangladeshNews'
    : '#SondeshExpress #Bangladesh #CurrentAffairs #WorldNews #DailyDispatch';

  const caption = `${hookTitle}\n\n🔗 sondesh.web.app\n\n${hashtags}`;

  return {
    hookTitle,
    keyPoints,
    caption
  };
}

/**
 * Calls Gemini REST API to generate a punchy social media headline hook and summarized key points.
 */
export async function refineSocialCardWithGemini(req: RefineRequest): Promise<SocialCardContent> {
  const { title, summary = '', bullets = [], language, tone, apiKey } = req;
  const isBn = language === 'bn';

  const effectiveKey = 
    apiKey?.trim() || 
    localStorage.getItem('dorpon_gemini_api_key')?.trim() || 
    (import.meta as any).env?.VITE_GEMINI_API_KEY?.trim();

  if (!effectiveKey) {
    return getHeuristicSocialContent(title, summary, bullets, language, tone);
  }

  const toneInstruction = tone === 'positive'
    ? (isBn ? 'ইতিবাচক, আশাবাদী, উন্নয়ন ও অনুপ্রেরণামূলক টোন বজায় রাখুন।' : 'Maintain an inspiring, constructive, and forward-looking positive tone.')
    : (isBn ? 'সতর্কতামূলক, বিশ্লেষণধর্মী ও গুরুত্বপূর্ণ জরুরি খবরের গুরুত্ব ফুটিয়ে তুলুন।' : 'Maintain a high-urgency, critical, and investigative tone.');

  const langInstruction = isBn
    ? 'উত্তর সম্পূর্ণ সাবলীল ও নির্ভুল বাংলায় (Bangla) দিন।'
    : 'Provide the response strictly in clear, modern journalistic English.';

  const prompt = `You are the lead social media editor for "Sondesh Express" (সন্দেশ এক্সপ্রেস), a premium Bangladeshi news card publisher.
Transform the following news story into a punchy, viral photo card text optimized for Facebook & Instagram mobile feeds.

Rules:
1. "hookTitle": A bold, arresting headline of MAXIMUM 8 to 12 words that immediately grabs attention on social media. Avoid generic headlines.
2. "keyPoints": An array of EXACTLY 2 or 3 concise, highly readable bullet points summarizing the core developments, policy actions, or facts. Each bullet point MUST be between 10 to 18 words max so it fits perfectly on a mobile news card.
3. "caption": A minimalist social caption containing:
   - Line 1: The punchy hookTitle
   - Line 2: Empty
   - Line 3: "🔗 sondesh.web.app"
   - Line 4: Empty
   - Line 5: 4-5 relevant hashtags including #SondeshExpress ${isBn ? '#সন্দেশএক্সপ্রেস #বাংলাদেশ' : '#Bangladesh #CurrentAffairs'}

Story Details:
- Title: ${title}
- Summary: ${summary}
- Key Points: ${bullets.slice(0, 3).join(' | ')}
- Tone Style: ${toneInstruction}
- Language requirement: ${langInstruction}

Return ONLY valid JSON matching this exact schema:
{
  "hookTitle": "string",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "caption": "string"
}`;

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 600,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText.replace(/```json/gi, '').replace(/```/g, '').trim());
        if (parsed.hookTitle && Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0) {
          return {
            hookTitle: parsed.hookTitle.trim(),
            keyPoints: parsed.keyPoints.map((p: any) => String(p).trim()).slice(0, 3),
            caption: parsed.caption?.trim() || `${parsed.hookTitle}\n\n🔗 sondesh.web.app\n\n#SondeshExpress`
          };
        }
      }
    } catch (err) {
      console.warn(`Gemini model ${model} failed, trying fallback:`, err);
    }
  }

  // Fallback to heuristic
  return getHeuristicSocialContent(title, summary, bullets, language, tone);
}
