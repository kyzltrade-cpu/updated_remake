import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory cache to enforce a 20-second spam cooldown per User ID
const cooldownCache = new Map<string, number>()

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify Authentication & Identity
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY is not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Guard 3: Payload Size Restrictor (Max 1MB / 1,000,000 bytes)
    const contentLengthStr = req.headers.get('content-length')
    if (contentLengthStr) {
      const contentLength = parseInt(contentLengthStr, 10)
      if (contentLength > 1000000) {
        return new Response(JSON.stringify({ error: 'Payload size exceeds 1MB limit' }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Get User ID from JWT Token
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id

    // Guard 2: 20-second request cooldown
    const now = Date.now()
    const lastRequestTime = cooldownCache.get(userId)
    if (lastRequestTime && (now - lastRequestTime < 20000)) {
      const waitTime = Math.ceil((20000 - (now - lastRequestTime)) / 1000)
      return new Response(JSON.stringify({ error: `Please wait ${waitTime}s before scanning again.` }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    cooldownCache.set(userId, now)

    // Guard 1: Paywall Gate (Check active Pro subscription or trial onboarding scans)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('face_setup_completed')
      .eq('id', userId)
      .maybeSingle()

    // To verify subscription, query the subscriptions table
    const { data: sub } = await supabaseClient
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .maybeSingle()

    const { count: scanCount } = await supabaseClient
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    const isPro = sub?.plan === 'pro' && sub?.status === 'active'
    const hasFreeScanLeft = (scanCount ?? 0) === 0

    if (!isPro && !hasFreeScanLeft) {
      return new Response(JSON.stringify({ error: 'Subscription required to scan' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Parse & Forward Payload to OpenRouter
    const body = await req.json()
    
    let payload: any = {}
    if (body.messages) {
      payload = {
        model: body.model || 'openai/gpt-4o-mini',
        messages: body.messages,
        temperature: body.temperature ?? 0.1,
        max_tokens: body.max_tokens,
        response_format: body.response_format,
      }
    } else {
      const { imageBase64, prompt, maxTokens, isJson, model } = body
      if (!prompt) {
        return new Response(JSON.stringify({ error: 'Missing prompt' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const messages: any[] = []
      if (imageBase64) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        })
      } else {
        messages.push({ role: 'user', content: prompt })
      }

      payload = {
        model: model || 'openai/gpt-4o-mini',
        messages,
        temperature: isJson ? 0.2 : 0.7,
        max_tokens: maxTokens,
      }
      if (isJson) {
        payload.response_format = { type: 'json_object' }
      }
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://remake.beauty',
        'X-Title': 'ReMake App',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(JSON.stringify({ error: `OpenRouter failed: ${response.status}`, details: errText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
