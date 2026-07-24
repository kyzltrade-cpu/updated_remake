-- Migration: Add promo codes system for content creators and VIP upgrades

-- Add is_admin column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  max_uses INTEGER CHECK (max_uses > 0),
  current_uses INTEGER DEFAULT 0 NOT NULL CHECK (current_uses >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create promo_code_redemptions table
CREATE TABLE IF NOT EXISTS public.promo_code_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT REFERENCES public.promo_codes(code) ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, code)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for promo_codes
CREATE POLICY "Admins have full access to promo_codes" ON public.promo_codes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- RLS policies for promo_code_redemptions
CREATE POLICY "Admins have full access to promo_code_redemptions" ON public.promo_code_redemptions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Transactional function to redeem a promo code securely (SECURITY DEFINER bypasses table RLS for verification)
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_duration_days INT;
  v_max_uses INT;
  v_current_uses INT;
  v_already_redeemed BOOLEAN;
  v_new_period_end TIMESTAMPTZ;
  v_normalized_code TEXT;
BEGIN
  -- Get active user ID from the request context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Normalize the code (uppercase and trimmed)
  v_normalized_code := upper(trim(p_code));

  IF v_normalized_code = '' OR v_normalized_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Code cannot be empty');
  END IF;

  -- Select details locking row to prevent race conditions (SELECT FOR UPDATE)
  SELECT duration_days, max_uses, current_uses
  INTO v_duration_days, v_max_uses, v_current_uses
  FROM public.promo_codes
  WHERE upper(code) = v_normalized_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid promo code');
  END IF;

  -- Check usage limits
  IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN
    RETURN jsonb_build_object('success', false, 'message', 'This promo code has reached its maximum redemption limit');
  END IF;

  -- Check if user already redeemed this exact code
  SELECT EXISTS (
    SELECT 1 FROM public.promo_code_redemptions
    WHERE user_id = v_user_id AND upper(code) = v_normalized_code
  ) INTO v_already_redeemed;

  IF v_already_redeemed THEN
    RETURN jsonb_build_object('success', false, 'message', 'You have already redeemed this promo code');
  END IF;

  -- Log redemption
  INSERT INTO public.promo_code_redemptions (user_id, code)
  VALUES (v_user_id, v_normalized_code);

  -- Increment use counter
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1
  WHERE upper(code) = v_normalized_code;

  -- Calculate new subscription expiration
  v_new_period_end := now() + (v_duration_days * INTERVAL '1 day');

  -- Upsert into subscriptions table
  INSERT INTO public.subscriptions (user_id, plan, status, current_period_end)
  VALUES (v_user_id, 'pro', 'active', v_new_period_end)
  ON CONFLICT (user_id) DO UPDATE
  SET plan = 'pro',
      status = 'active',
      current_period_end = v_new_period_end;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Promo code applied successfully! Enjoy your Pro access ✦',
    'current_period_end', to_jsonb(v_new_period_end)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
