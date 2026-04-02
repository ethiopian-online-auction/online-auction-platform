-- Add missing columns to notifications table if they don't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Show table structure
\d notifications

SELECT 'Notifications table updated successfully!' as message;
