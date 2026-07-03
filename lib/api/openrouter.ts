import { createClient } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export function hasOpenRouterKey(): boolean {
  // Always true in production because the key is secured on the backend in Supabase Edge Functions!
  return true;
}

const base64Cache = new Map<string, string>();

export async function uriToBase64(uri: string): Promise<string> {
  if (base64Cache.has(uri)) {
    console.log('[OpenRouter Cache] Reusing cached Base64 string for URI:', uri.substring(0, 60) + '...');
    return base64Cache.get(uri)!;
  }
  try {
    console.log('[Image Compression] Shrinking and compressing raw selfie client-side...');
    
    // Scale maximum dimension to 1024px while keeping aspect ratio, and compress to 0.7 JPEG
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.7, format: SaveFormat.JPEG, base64: true }
    );

    const base64 = manipResult.base64;
    if (!base64) {
      throw new Error('Base64 result is empty after manipulation');
    }

    console.log('[Image Compression] Compression complete! Shrank payload from raw format to optimized base64 string.');

    base64Cache.set(uri, base64);
    // Prevent memory leaks by keeping only the most recent scans in cache
    if (base64Cache.size > 3) {
      const firstKey = base64Cache.keys().next().value;
      if (firstKey) base64Cache.delete(firstKey);
    }
    return base64;
  } catch (e) {
    console.error('Error compressing/converting URI to Base64:', e);
    
    // Graceful fallback to raw reading in case manipulator fails
    console.warn('[Image Compression] Manipulator failed, falling back to raw disk read...');
    try {
      const rawBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return rawBase64;
    } catch (err) {
      console.error('Raw read fallback also failed:', err);
      throw new Error('Failed to read or compress image file');
    }
  }
}

export async function openRouterText(
  prompt: string, 
  maxTokens = 200, 
  model = 'meta-llama/llama-3.2-11b-vision-instruct'
): Promise<string> {
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke('analyze-makeup', {
    body: {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    }
  });

  if (error) {
    console.error('[OpenRouter Proxy] Edge Function error for openRouterText:', error);
    throw new Error(`Edge Function error: ${error.message}`);
  }

  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function openRouterTextJson<T>(
  prompt: string, 
  maxTokens = 3000, 
  model = 'meta-llama/llama-3.2-11b-vision-instruct'
): Promise<T> {
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke('analyze-makeup', {
    body: {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    }
  });

  if (error) {
    console.error('[OpenRouter Proxy] Edge Function error for openRouterTextJson:', error);
    throw new Error(`Edge Function error: ${error.message}`);
  }

  const raw = data?.choices?.[0]?.message?.content ?? '';
  if (!raw) throw new Error('Empty OpenRouter response');
  const text = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(text) as T;
}

export async function openRouterVision<T>(
  imageBase64: string, 
  prompt: string, 
  model = 'meta-llama/llama-3.2-11b-vision-instruct'
): Promise<T> {
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke('analyze-makeup', {
    body: {
      model,
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
    console.error('[OpenRouter Proxy] Edge Function error for openRouterVision:', error);
    throw new Error(`Edge Function error: ${error.message}`);
  }

  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty OpenRouter response');
  const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as T;
}

export async function openRouterVisionDual<T>(
  image1Base64: string, 
  image2Base64: string, 
  prompt: string, 
  model = 'meta-llama/llama-3.2-11b-vision-instruct'
): Promise<T> {
  // Since we pass only the primary image to avoid huge payload limits, we append the dual note to the prompt
  const dualPrompt = prompt + '\n\n(Note: Due to API limits, only the primary image is provided. Please perform your evaluation based on this image and the provided text details.)';
  return openRouterVision<T>(image1Base64, dualPrompt, model);
}
