const NIM_API_KEY = process.env.EXPO_PUBLIC_NIM_API_KEY ?? '';
const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export function hasNimKey(): boolean {
  return NIM_API_KEY.length > 10;
}

import * as FileSystem from 'expo-file-system/legacy';

export async function uriToBase64(uri: string): Promise<string> {
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (e) {
    console.error('Error converting URI to Base64:', e);
    throw new Error('Failed to read image file');
  }
}

export async function nimText(prompt: string, maxTokens = 200): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'meta/llama-3.2-90b-vision-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) throw new Error(`NIM ${res.status}`);
    const data = await res.json() as any;
    return data?.choices?.[0]?.message?.content?.trim() ?? '';
  } finally {
    clearTimeout(timer);
  }
}

export async function nimTextJson<T>(prompt: string, maxTokens = 3000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'meta/llama-3.2-90b-vision-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`NIM ${res.status}: ${errText}`);
    }
    const data = await res.json() as any;
    const raw = data?.choices?.[0]?.message?.content ?? '';
    if (!raw) throw new Error('Empty NIM response');
    const text = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function nimVisionDual<T>(image1Base64: string, image2Base64: string, prompt: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  try {
    const res = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'meta/llama-3.2-90b-vision-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image1Base64}` } },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image2Base64}` } }
          ]
        }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
    });
    if (!res.ok) throw new Error(`NIM ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    const text = data?.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('Empty NIM response');
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function nimVision<T>(imageBase64: string, prompt: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'meta/llama-3.2-90b-vision-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`NIM ${res.status}: ${errText}`);
    }

    const data = await res.json() as any;
    const text = data?.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('Empty NIM response');
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned) as T;
  } finally {
    clearTimeout(timer);
  }
}
