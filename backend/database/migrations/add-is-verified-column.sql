-- Add is_verified column to users table if it doesn't exist
-- This column is used to verify users before they can create auctions or place bids

-- Add the column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Verify the admin user
UPDATE users SET is_verified = true WHERE email = 'admin@auction.et';

-- Optional: Verify all existing users (uncomment if you want to verify everyone)
-- UPDATE users SET is_verified = true;

-- Check the results
SELECT id, name, email, is_verified, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
