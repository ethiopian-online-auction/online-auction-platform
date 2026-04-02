-- Check if profile photo was saved for your user
SELECT 
    name,
    email,
    CASE 
        WHEN profile_photo IS NULL THEN 'NULL - No photo'
        WHEN profile_photo = '' THEN 'EMPTY STRING - No photo'
        WHEN LENGTH(profile_photo) > 0 THEN 'HAS PHOTO - Length: ' || LENGTH(profile_photo) || ' characters'
        ELSE 'UNKNOWN'
    END as photo_status,
    LEFT(profile_photo, 50) as photo_preview
FROM users
WHERE email = 'Amanu@gmail.com';
