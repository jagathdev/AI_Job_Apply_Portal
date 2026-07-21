import crypto from 'crypto';
import { AICache } from '../../models/schemas';

// Groq (GroqCloud) — OpenAI-compatible endpoint, NOT xAI. Key format is
// "gsk_...". llama-3.3-70b-versatile / llama-3.1-8b-instant were deprecated
// June 17, 2026 — openai/gpt-oss-120b (quality) and openai/gpt-oss-20b
// (speed/cheap) are the current recommended replacements. Override via env
// var if Groq ships a newer canonical ID; don't hardcode a fallback API key
// here or anywhere else.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

function generateCacheKey(systemPrompt: string, userPrompt: string): string {
  return crypto
    .createHash('sha256')
    .update(`${systemPrompt}|||${userPrompt}`)
    .digest('hex');
}

// Uses upsert instead of create/insert. Two concurrent identical requests
// can both miss the cache and both try to write the same key — an insert
// crashes on the unique index in that case, an upsert just no-ops the loser.
async function writeCache(cacheKey: string, response: string): Promise<void> {
  try {
    await AICache.updateOne(
      { key: cacheKey },
      { $setOnInsert: { key: cacheKey, response } },
      { upsert: true }
    );
  } catch (cacheErr) {
    console.error('Failed to write response to AI cache:', cacheErr);
  }
}

export interface CustomApiKeys {
  groqApiKey?: string;
  geminiApiKey?: string;
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean = false,
  customApiKeys?: CustomApiKeys
): Promise<string> {
  const cacheKey = generateCacheKey(systemPrompt, userPrompt);

  // 1. Check database cache
  try {
    const cached = await AICache.findOne({ key: cacheKey });
    if (cached && cached.response) {
      console.log('AI cache hit, returning cached result.');
      return cached.response;
    }
  } catch (err) {
    console.error('AI cache lookup failed:', err);
  }

  // Fallback keys order:
  // 1. User's custom GROQ key
  // 2. User's custom Gemini key
  // 3. System env GROQ key
  // 4. System env Gemini key

  const keyChain = [];
  if (customApiKeys?.groqApiKey) {
    keyChain.push({ provider: 'groq', key: customApiKeys.groqApiKey, source: 'user' });
  }
  if (customApiKeys?.geminiApiKey) {
    keyChain.push({ provider: 'gemini', key: customApiKeys.geminiApiKey, source: 'user' });
  }
  if (process.env.GROQ_API_KEY) {
    keyChain.push({ provider: 'groq', key: process.env.GROQ_API_KEY, source: 'system' });
  }
  if (process.env.GEMINI_API_KEY) {
    keyChain.push({ provider: 'gemini', key: process.env.GEMINI_API_KEY, source: 'system' });
  }

  if (keyChain.length === 0) {
    throw new Error('No API keys configured (neither User Custom nor System Default).');
  }

  let lastError: any = null;

  for (const item of keyChain) {
    console.log(`Attempting AI call using ${item.source} ${item.provider} API key...`);
    try {
      let response = '';
      if (item.provider === 'groq') {
        response = await fetchWithTimeout(systemPrompt, userPrompt, jsonMode, item.key);
      } else {
        response = await callGeminiWithRetry(systemPrompt, userPrompt, jsonMode, item.key);
      }
      await writeCache(cacheKey, response);
      return response;
    } catch (error: any) {
      console.error(`AI call using ${item.source} ${item.provider} failed:`, error.message || error);
      lastError = error;
    }
  }

  throw new Error(`AI service completely unavailable. Last error: ${lastError?.message || lastError}`);
}

async function fetchWithTimeout(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean,
  apiKey: string
): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as any;
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error('Groq API returned an empty reply.');
    }
    return reply;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Wraps the Gemini call with retry + exponential backoff, AND a model
// fallback chain. A 503 "high demand" is often specific to one model
// (usually whichever is newest/most popular) — a less-loaded model often
// succeeds immediately even when the primary one is saturated.
const GEMINI_MODEL_CHAIN = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

async function callGeminiWithRetry(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean,
  apiKey: string
): Promise<string> {
  let lastError: any = null;

  for (const model of GEMINI_MODEL_CHAIN) {
    const maxAttempts = 2; // fewer retries per model since we have several models to try
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await callGeminiFallback(systemPrompt, userPrompt, jsonMode, model, apiKey);
      } catch (error: any) {
        lastError = error;
        console.error(`Gemini (${model}) attempt ${attempt} failed:`, error.message || error);

        // Don't retry on auth/config errors — they won't fix themselves.
        const isRetryable =
          error.message?.includes('HTTP 503') ||
          error.message?.includes('HTTP 429') ||
          error.message?.includes('HTTP 500');

        if (!isRetryable) {
          throw error; // auth/config problem — no point trying other models either
        }

        if (attempt < maxAttempts) {
          const backoffMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s...
          console.log(`Retrying ${model} in ${backoffMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }
    console.warn(`${model} exhausted retries, trying next model in chain...`);
  }

  throw lastError;
}

async function callGeminiFallback(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean,
  geminiModel: string,
  apiKey: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const fullPrompt = `${systemPrompt}\n\nUSER INPUT:\n${userPrompt}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: jsonMode ? 'application/json' : 'text/plain',
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API HTTP ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as any;
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error('Gemini API returned an empty candidate.');
    }
    return reply;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}