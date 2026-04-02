-- Update Auction Status Automatically
-- This updates pending auctions to active when start_time is reached

-- Function to update auction status
CREATE OR REPLACE FUNCTION update_auction_status()
RETURNS void AS $$
BEGIN
  -- Update pending auctions to active if start_time has passed
  UPDATE auctions
  SET status = 'active',
      updated_at = CURRENT_TIMESTAMP
  WHERE status = 'pending'
    AND start_time <= CURRENT_TIMESTAMP
    AND end_time > CURRENT_TIMESTAMP;
  
  -- Update active auctions to ended if end_time has passed
  UPDATE auctions
  SET status = 'ended',
      updated_at = CURRENT_TIMESTAMP
  WHERE status IN ('active', 'pending')
    AND end_time <= CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Run the function immediately
SELECT update_auction_status();

-- Show updated auctions
SELECT id, title, status, start_time, end_time
FROM auctions
ORDER BY created_at DESC
LIMIT 10;
