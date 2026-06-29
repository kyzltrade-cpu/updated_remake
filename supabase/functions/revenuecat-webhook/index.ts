import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

// Setup response headers for CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify Authorization Header (Security Guard)
    const authHeader = req.headers.get('Authorization')
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')

    if (!webhookSecret) {
      console.error("[RevenueCat Webhook] Missing REVENUECAT_WEBHOOK_SECRET environment variable.")
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // RevenueCat webhooks can send credentials in the Authorization header
    // Usually structured as: "Bearer <token>" or just "<token>"
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

    if (token !== webhookSecret) {
      console.warn("[RevenueCat Webhook] Unauthorized request received. Auth header mismatch.")
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Parse Webhook Event Body
    const body = await req.json()
    console.log("[RevenueCat Webhook] Received event payload:", JSON.stringify(body))

    const event = body.event
    if (!event) {
      return new Response(JSON.stringify({ error: "Missing event payload" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const {
      type: eventType,
      app_user_id: userId,
      entitlement_id: entitlementId,
      entitlement_ids: entitlementIds,
      expiration_at_ms: expirationAtMs,
    } = event

    // If there is no user ID, we cannot map this purchase to anyone in our DB
    if (!userId) {
      console.error("[RevenueCat Webhook] Missing app_user_id in event payload.")
      return new Response(JSON.stringify({ error: "Missing app_user_id" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Initialize Supabase Client (Using Service Role Key to bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Resolve Subscription State based on Event Type
    let plan = 'free'
    let status = 'active'
    let currentPeriodEnd: string | null = null

    // Helper: Convert timestamp to ISO String
    if (expirationAtMs) {
      currentPeriodEnd = new Date(expirationAtMs).toISOString()
    }

    // Check if the event carries 'pro' access
    const hasProAccess = entitlementId === 'pro' || (entitlementIds && entitlementIds.includes('pro'))

    // Map RevenueCat event types to database values
    // See full event types: https://docs.revenuecat.com/docs/webhooks
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'BILLING_ISSUE_RESOLVED':
      case 'TRANSFER':
        if (hasProAccess) {
          plan = 'pro'
          status = 'active'
        }
        break

      case 'CANCELLATION':
        // A cancellation in RevenueCat means auto-renew is turned off, but they 
        // still have premium access until the active billing period ends.
        if (hasProAccess) {
          plan = 'pro'
          status = 'cancelled'
        } else {
          plan = 'free'
          status = 'cancelled'
        }
        break

      case 'EXPIRATION':
      case 'BILLING_ISSUE':
        // Subscription has fully expired or failed payment
        plan = 'free'
        status = eventType === 'BILLING_ISSUE' ? 'past_due' : 'active'
        break

      default:
        console.log(`[RevenueCat Webhook] Unhandled event type: ${eventType}. Preserving current db state if possible.`)
        return new Response(JSON.stringify({ message: `Ignored unhandled event: ${eventType}` }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    console.log(`[RevenueCat Webhook] Processing mapping: User ${userId} ➔ Plan: ${plan}, Status: ${status}, Expiration: ${currentPeriodEnd}`)

    // 5. Update the Database
    // Using upsert to handle case where user signup is fast or race-conditioned
    const { error: dbError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: plan,
        status: status,
        current_period_end: currentPeriodEnd,
      }, { onConflict: 'user_id' })

    if (dbError) {
      console.error(`[RevenueCat Webhook] Database upsert failed for user ${userId}:`, dbError)
      throw dbError
    }

    console.log(`[RevenueCat Webhook] Successfully synchronized subscription for user ${userId}`)

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error("[RevenueCat Webhook] Exception occurred:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
