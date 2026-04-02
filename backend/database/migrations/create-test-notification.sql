-- Create a test notification for your user
-- Replace 'YOUR_USER_ID' with your actual user ID

INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    is_read,
    created_at
) VALUES (
    '1a73db37-e6cc-43a7-8233-521ab3ca8ea8', -- Your user ID (Endu Endrias)
    'bid',
    'New Bid Placed',
    'You successfully placed a bid of 47,000 ETB on Apple iPhone 17 Pro',
    '/auction/1bc958d6-09df-41ab-805d-dd4f02ef0e60',
    false,
    NOW()
);

SELECT 'Test notification created!' as message;
