-- Add expo_push_token column to the profiles table to support push notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
