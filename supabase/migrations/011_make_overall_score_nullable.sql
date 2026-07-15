-- Migration: Make overall_score in scans table nullable for barefaced (no makeup) scans
ALTER TABLE scans ALTER COLUMN overall_score DROP NOT NULL;
