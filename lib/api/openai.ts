export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export function hasOpenAIKey(): boolean {
  return OPENAI_API_KEY.length > 10;
}

export async function openaiVisionJson<T>(imageBase64: string, schema: any): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "low"
                }
              },
              {
                type: "text",
                text: "Analyze this face for Beauty DNA."
              }
            ]
          }
        ],
        response_format: schema,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    
    if (!text) throw new Error('Empty OpenAI response');

    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}
