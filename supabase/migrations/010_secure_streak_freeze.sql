-- Secure streak freeze function for authenticated users
-- Since public.streaks is a locked-down table (to prevent users from cheating and editing their streaks),
-- we use a SECURITY DEFINER postgres function that executes securely on the database side
-- to decrement freezes and freeze the active streak.

CREATE OR REPLACE FUNCTION public.use_streak_freeze()
RETURNS boolean AS $$
DECLARE
  calling_user_id UUID;
  current_freezes INTEGER;
  today_date DATE;
BEGIN
  -- Get the ID of the calling user
  calling_user_id := auth.uid();
  
  -- If not authenticated, return false
  IF calling_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Check if user has freezes left
  SELECT streak_freezes INTO current_freezes
  FROM public.streaks
  WHERE user_id = calling_user_id;

  -- If streak row doesn't exist or no freezes left, return false
  IF current_freezes IS NULL OR current_freezes <= 0 THEN
    RETURN false;
  END IF;

  -- 2. Consume 1 freeze and protect streak by setting last_scan_date to today
  today_date := CURRENT_DATE;
  
  UPDATE public.streaks
  SET 
    streak_freezes = current_freezes - 1,
    last_scan_date = today_date::text
  WHERE user_id = calling_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
