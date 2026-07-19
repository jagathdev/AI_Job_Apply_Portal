import crypto from 'crypto';
import { AICache } from '../../models/schemas';

// Current flagship model as of mid-2026. grok-2 was retired — using it now
// returns "Model not found". Override via env var if xAI ships a newer
// canonical ID; don't hardcode a fallback API key here or anywhere else.
const GROK_MODEL = process.env.GROK_MODEL || 'grok-4.3';

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

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean = false
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

  // 2. Call Grok with retry and timeout
  let attempts = 0;
  const maxAttempts = 2;
  let lastError: any = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetchWithTimeout(systemPrompt, userPrompt, jsonMode);
      await writeCache(cacheKey, response);
      return response;
    } catch (error: any) {
      console.error(`AI call attempt ${attempts} failed:`, error.message || error);
      lastError = error;
      if (attempts < maxAttempts) {
        console.log('Retrying AI call...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // 3. Fallback to Gemini if Grok fails completely
  console.warn('Grok API failed. Falling back to Gemini API for high availability...');
  try {
    const fallbackResponse = await callGeminiFallback(systemPrompt, userPrompt, jsonMode);
    await writeCache(cacheKey, fallbackResponse);
    return fallbackResponse;
  } catch (geminiError: any) {
    console.error('Fallback Gemini API also failed:', geminiError.message || geminiError);
    throw new Error(
      `AI service unavailable. Grok: ${lastError?.message || lastError}, Gemini: ${geminiError?.message || geminiError}`
    );
  }
}

async function fetchWithTimeout(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean
): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    // Fail loudly instead of silently using a baked-in key.
    throw new Error('GROK_API_KEY is not set in environment variables.');
  }

  const url = 'https://api.x.ai/v1/chat/completions';

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
        model: GROK_MODEL,
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
      throw new Error(`Grok API HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as any;
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error('Grok API returned an empty reply.');
    }
    return reply;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function callGeminiFallback(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  // gemini-2.5-flash was retired for new API usage — gemini-3.5-flash is the
  // current GA stable model. Override via GEMINI_MODEL if Google ships a newer one.
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
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