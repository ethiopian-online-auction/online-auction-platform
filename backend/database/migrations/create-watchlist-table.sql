-- Create watchlist table for buyer features
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, auction_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_auction ON watchlist(auction_id);

-- Add buyer_preferences column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'buyer_preferences'
    ) THEN
        ALTER TABLE users ADD COLUMN buyer_preferences JSONB DEFAULT '{}';
    END IF;
END $$;

COMMENT ON TABLE watchlist IS 'Stores auctions that buyers are watching';
COMMENT ON COLUMN users.buyer_preferences IS 'Stores buyer preferences like favorite categories, price ranges, etc.';
