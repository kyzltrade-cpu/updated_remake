-- Native account deletion function for authenticated users
-- Since client-side SDKs cannot delete from auth.users directly,
-- we use a SECURITY DEFINER postgres function that executes on the database side
-- and cascade-deletes the active user's credentials and records.

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the ID of the calling user
  current_user_id := auth.uid();
  
  -- If not authenticated, raise an exception
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from auth.users (ON DELETE CASCADE propagates this delete automatically to the profiles, scans, streaks, and subscriptions tables!)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
