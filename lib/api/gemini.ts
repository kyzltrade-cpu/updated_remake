const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export function hasGeminiKey(): boolean {
  return GEMINI_API_KEY.length > 10;
}

export async function uriToBase64(uri: string): Promise<string> {
  const res = await fetch(uri);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const CHUNK = 8192;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode(...Array.from(bytes.subarray(i, i + CHUNK))));
  }
  return btoa(parts.join(''));
}

export async function geminiText(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  } finally {
    clearTimeout(timer);
  }
}

export async function geminiVision<T>(imageBase64: string, prompt: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1500,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini ${res.status}: ${errText}`);
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('Empty Gemini response');

    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}
