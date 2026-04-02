-- Check if profile_photo column exists and show user data
SELECT 
    id, 
    name, 
    email,
    profile_photo,
    CASE 
        WHEN profile_photo IS NULL THEN 'No photo'
        WHEN profile_photo = '' THEN 'Empty string'
        ELSE 'Has photo'
    END as photo_status
FROM users
LIMIT 5;
