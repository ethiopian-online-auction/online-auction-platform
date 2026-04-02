-- Verify all existing users so they can place bids
-- This is a one-time fix for existing users

\echo '========================================';
\echo '  VERIFYING ALL EXISTING USERS';
\echo '========================================';
\echo '';

-- Update all users to be verified
UPDATE users 
SET is_verified = TRUE, 
    subscription_status = 'active'
WHERE is_verified IS NULL OR is_verified = FALSE;

\echo '';
\echo 'Verification complete!';
\echo '';

-- Show updated user count
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_verified = TRUE) as verified_users,
    COUNT(*) FILTER (WHERE is_verified = FALSE OR is_verified IS NULL) as unverified_users
FROM users;

\echo '';
\echo '========================================';
\echo '  ALL USERS ARE NOW VERIFIED!';
\echo '========================================';
\echo '';
\echo 'Users can now place bids without verification issues.';
\echo '';
