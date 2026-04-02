-- Add profile_photo column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Show success message
SELECT 'profile_photo column added successfully!' as message;

-- Show updated table structure
\d users
