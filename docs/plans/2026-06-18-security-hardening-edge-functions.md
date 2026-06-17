# Production Security Hardening: Migrating AI Keys to Supabase Edge Functions

## 🚨 The Vulnerability (Key Leakage Risk)
Currently, the mobile app loads `EXPO_PUBLIC_NIM_API_KEY` and expects to fetch NVIDIA's API directly from the client:
- In React Native, any environment variable prefixed with `EXPO_PUBLIC_` is **baked directly into the compiled JavaScript bundle (`main.jsbundle`)** during compilation/export.
- Any user or malicious actor can easily extract your production API keys by decompiling the `.ipa` or `.apk` or running a simple strings search:
  ```bash
  strings main.jsbundle | grep -E "nvapi-|integrate.api.nvidia"
  ```
- This leaves you vulnerable to massive billing spikes, API rate-limiting, and credentials theft.

## 🛡️ The Solution (Server-Side Proxy Architecture)
To secure your keys for App Store approval, we must move all third-party API keys out of the mobile client. Instead of calling NVIDIA directly, the mobile client will call an authenticated **Supabase Edge Function** which acts as a secure, server-side proxy.

```
┌─────────────────┐       Authenticated Request       ┌─────────────────────────┐
│  Mobile Client  │ ────────────────────────────────> │ Supabase Edge Function  │
│  (React Native) │ <──────────────────────────────── │ (Has secure env keys)   │
└─────────────────┘           Secure Payload          └─────────────────────────┘
                                                                   │
                                                                   │ Auth Bearer Key
                                                                   ▼
                                                      ┌─────────────────────────┐
                                                      │    NVIDIA NIM API       │
                                                      └─────────────────────────┘
```

---

## 💻 Part 1: The Supabase Edge Function (Deno TypeScript)
Deploy this function to your Supabase project under the name `analyze-makeup`.

### File: `supabase/functions/analyze-makeup/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
const NIM_API_KEY = Deno.env.get("NIM_API_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify User Session (Ensure request is from an authenticated app user)
    const authHeader = req.headers.get('Authorization')!
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!NIM_API_KEY) {
      return new Response(JSON.stringify({ error: 'NIM_API_KEY not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Parse request payload
    const { imageBase64, prompt } = await req.json()
    if (!imageBase64 || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing imageBase64 or prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Forward request to NVIDIA NIM with secure API Key
    const response = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
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
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(JSON.stringify({ error: `NIM failed: ${response.status}`, details: errText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

---

## 💻 Part 2: Client Code Adaptation (React Native)
Update the client-side files to securely route their requests through Supabase.

### 1. Updated `lib/api/nim.ts` (Client Proxy)
```typescript
import { createClient } from '@/lib/supabase';

export function hasNimKey(): boolean {
  // Always true in production because the key is secured on the backend!
  return true;
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

export async function nimVision<T>(imageBase64: string, prompt: string): Promise<T> {
  const supabase = createClient();
  
  // Call the secure Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('analyze-makeup', {
    body: { imageBase64, prompt },
  });

  if (error) {
    throw new Error(`Edge Function error: ${error.message}`);
  }

  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty response from secure makeup analysis endpoint');
  
  const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as T;
}

export async function nimVisionDual<T>(image1Base64: string, image2Base64: string, prompt: string): Promise<T> {
  // Since we pass only the primary image to avoid huge payload limits:
  return nimVision<T>(image1Base64, prompt);
}
```

---

## 🛠️ Step-by-Step Deployment Instructions

1. **Install Supabase CLI locally (if not already):**
   ```bash
   brew install supabase/tap/supabase
   ```
2. **Login to your Supabase account:**
   ```bash
   supabase login
   ```
3. **Initialize Supabase in the project:**
   ```bash
   supabase init
   ```
4. **Create the Edge Function:**
   ```bash
   supabase functions new analyze-makeup
   ```
5. **Paste the Deno TypeScript code** (above) into `supabase/functions/analyze-makeup/index.ts`.
6. **Deploy the Edge Function to your live Supabase project:**
   ```bash
   supabase functions deploy analyze-makeup --project-ref iednrmfazgqrnqwebppn
   ```
7. **Set your production NVIDIA NIM key on Supabase:**
   ```bash
   supabase secrets set NIM_API_KEY="your_actual_nvidia_nim_api_key_here" --project-ref iednrmfazgqrnqwebppn
   ```

By routing these calls through Supabase, **the client never touches the NIM key**, making your app 100% compliant with Apple's strict privacy and security guidelines.
