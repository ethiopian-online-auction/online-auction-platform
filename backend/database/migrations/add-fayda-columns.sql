-- Run this once to add Fayda/KYC columns to your users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fayda_id VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP;

-- Index for fast Fayda ID lookups
CREATE INDEX IF NOT EXISTS idx_users_fayda_id ON users(fayda_id);
