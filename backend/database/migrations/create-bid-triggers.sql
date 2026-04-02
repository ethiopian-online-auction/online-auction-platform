-- Database Triggers for Bid System
-- This creates automatic triggers for bid placement

-- 1. Create activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- 2. Function to update auction current_bid when a new bid is placed
CREATE OR REPLACE FUNCTION update_auction_current_bid()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the auction's current_bid to the new bid amount
  UPDATE auctions 
  SET current_bid = NEW.amount,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.auction_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to automatically update auction current_bid
DROP TRIGGER IF EXISTS trigger_update_auction_bid ON bids;
CREATE TRIGGER trigger_update_auction_bid
  AFTER INSERT ON bids
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION update_auction_current_bid();

-- 4. Function to log bid activity
CREATE OR REPLACE FUNCTION log_bid_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    NEW.bidder_id,
    'bid_placed',
    'bid',
    NEW.id,
    jsonb_build_object(
      'auction_id', NEW.auction_id,
      'amount', NEW.amount,
      'is_auto_bid', NEW.is_auto_bid,
      'status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger to log all bid activities
DROP TRIGGER IF EXISTS trigger_log_bid_activity ON bids;
CREATE TRIGGER trigger_log_bid_activity
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION log_bid_activity();

-- 6. Function to create notification when bid is placed
CREATE OR REPLACE FUNCTION create_bid_notification()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_var UUID;
  auction_title_var VARCHAR(500);
  bidder_name_var VARCHAR(255);
BEGIN
  -- Get auction details
  SELECT seller_id, title INTO seller_id_var, auction_title_var
  FROM auctions WHERE id = NEW.auction_id;
  
  -- Get bidder name
  SELECT name INTO bidder_name_var
  FROM users WHERE id = NEW.bidder_id;
  
  -- Create notification for seller
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_auction_id
  ) VALUES (
    seller_id_var,
    'new_bid',
    'New Bid Received',
    bidder_name_var || ' placed a bid of ' || NEW.amount || ' ETB on "' || auction_title_var || '"',
    NEW.auction_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to create notifications
DROP TRIGGER IF EXISTS trigger_create_bid_notification ON bids;
CREATE TRIGGER trigger_create_bid_notification
  AFTER INSERT ON bids
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION create_bid_notification();

-- 8. Function to notify outbid users
CREATE OR REPLACE FUNCTION notify_outbid_users()
RETURNS TRIGGER AS $$
DECLARE
  previous_bidder_id UUID;
  auction_title_var VARCHAR(500);
BEGIN
  -- Only process if this is an active bid
  IF NEW.status = 'active' THEN
    -- Get the previous active bidder (now outbid)
    SELECT bidder_id INTO previous_bidder_id
    FROM bids
    WHERE auction_id = NEW.auction_id
      AND status = 'outbid'
      AND bidder_id != NEW.bidder_id
    ORDER BY bid_time DESC
    LIMIT 1;
    
    -- If there was a previous bidder, notify them
    IF previous_bidder_id IS NOT NULL THEN
      SELECT title INTO auction_title_var
      FROM auctions WHERE id = NEW.auction_id;
      
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_auction_id
      ) VALUES (
        previous_bidder_id,
        'outbid',
        'You were outbid',
        'Someone placed a higher bid of ' || NEW.amount || ' ETB on "' || auction_title_var || '"',
        NEW.auction_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger to notify outbid users
DROP TRIGGER IF EXISTS trigger_notify_outbid ON bids;
CREATE TRIGGER trigger_notify_outbid
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_outbid_users();

-- Verify triggers are created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'bids'
ORDER BY trigger_name;

-- Test query to see if triggers work
-- After running this file, place a bid and check:
-- SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 5;
-- SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
-- SELECT id, title, current_bid FROM auctions WHERE id = 'YOUR_AUCTION_ID';
