-- Add verdict and compliment to scans
ALTER TABLE scans ADD COLUMN IF NOT EXISTS verdict TEXT CHECK (verdict IN ('GO', 'FIX')) DEFAULT 'GO';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS coaching_compliment TEXT DEFAULT '';

-- Add DNA result storage to profiles (one per user, updated on each DNA scan)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dna_result JSONB;
