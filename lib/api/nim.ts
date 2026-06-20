import { createClient } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

export function hasNimKey(): boolean {
  // Always true in production because the key is secured on the backend in Supabase Edge Functions!
  return true;
}

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
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke('analyze-makeup', {
    body: {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    }
  });

  if (error) {
    console.error('[NIM Proxy] Edge Function error for nimText:', error);
    throw new Error(`Edge Function error: ${error.message}`);
  }

  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function nimTextJson<T>(prompt: string, maxTokens = 3000): Promise<T> {
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke('analyze-makeup', {
    body: {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    }
  });

  if (error) {
    console.error('[NIM Proxy] Edge Function error for nimTextJson:', error);
    throw new Error(`Edge Function error: ${error.message}`);
  }

  const raw = data?.choices?.[0]?.message?.content ?? '';
  if (!raw) throw new Error('Empty NIM response');
  const text = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(text) as T;
}

export async function nimVision<T>(imageBase64: string, prompt: string): Promise<T> {
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke('analyze-makeup', {
    body: {
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }
  });

  if (error) {
    console.error('[NIM Proxy] Edge Function error for nimVision:', error);
    throw new Error(`Edge Function error: ${error.message}`);
  }

  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty NIM response');
  const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as T;
}

export async function nimVisionDual<T>(image1Base64: string, image2Base64: string, prompt: string): Promise<T> {
  // Since we pass only the primary image to avoid huge payload limits, we append the dual note to the prompt
  const dualPrompt = prompt + '\n\n(Note: Due to API limits, only the primary image is provided. Please perform your evaluation based on this image and the provided text details.)';
  return nimVision<T>(image1Base64, dualPrompt);
}
