-- Restore the update policy on the streaks table so users can apply streak freezes
CREATE POLICY "Users can update own streak" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);
