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
    const authHeader = req.headers.get('Authorization')
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
    const body = await req.json()
    
    // Support both generic proxy mode and simple compatibility mode
    let nimPayload: any = {}
    
    if (body.messages) {
      // Generic proxy mode: Forward payload properties exactly
      nimPayload = {
        model: body.model || 'meta/llama-3.2-90b-vision-instruct',
        messages: body.messages,
        temperature: body.temperature ?? 0.1,
        max_tokens: body.max_tokens,
        response_format: body.response_format,
      }
    } else {
      // Simple client compatibility mode (backward compatibility)
      const { imageBase64, prompt, maxTokens, isJson } = body
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
        messages.push({
          role: 'user',
          content: prompt
        })
      }
      
      nimPayload = {
        model: 'meta/llama-3.2-90b-vision-instruct',
        messages,
        temperature: isJson ? 0.2 : 0.7,
        max_tokens: maxTokens,
      }
      if (isJson) {
        nimPayload.response_format = { type: 'json_object' }
      }
    }

    // 3. Forward request to NVIDIA NIM with secure API Key
    const response = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
      body: JSON.stringify(nimPayload),
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

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
