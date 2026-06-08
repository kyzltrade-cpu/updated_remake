-- Step 1: Add referral columns to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(12);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shelf_audit_unlocked BOOLEAN DEFAULT FALSE;

-- Step 2: Create a referrals table to track invite signups
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies for referrals
CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can insert own referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referred_user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- Step 3: Trigger function to automatically unlock shelf audit when >= 3 referrals are reached
CREATE OR REPLACE FUNCTION check_referral_threshold()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_referral_count INT;
BEGIN
    v_referrer_id := NEW.referrer_id;
    
    -- Count verified referral signups
    SELECT COUNT(*) INTO v_referral_count 
    FROM public.referrals 
    WHERE referrer_id = v_referrer_id;
    
    -- If they hit the target of 3, unlock their scan results / shelf audit
    IF v_referral_count >= 3 THEN
        UPDATE public.profiles 
        SET shelf_audit_unlocked = TRUE 
        WHERE id = v_referrer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on referral insert
DROP TRIGGER IF EXISTS trg_after_referral_insert ON public.referrals;
CREATE TRIGGER trg_after_referral_insert
AFTER INSERT ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION check_referral_threshold();

-- Step 4: Function to automatically generate a unique 8-character referral code on profile creation
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(12);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random uppercase alphanumeric code of 8 characters
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    NEW.referral_code := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate referral code before inserting a new profile
DROP TRIGGER IF EXISTS trg_before_profile_insert ON public.profiles;
CREATE TRIGGER trg_before_profile_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION generate_unique_referral_code();
