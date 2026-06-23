-- Add streak_freezes to public.streaks table to support streak freeze mechanics
ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS streak_freezes INTEGER DEFAULT 2;
