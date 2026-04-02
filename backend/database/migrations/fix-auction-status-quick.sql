-- Quick fix: Update all pending auctions to active
-- This allows bidding on all auctions immediately

UPDATE auctions 
SET status = 'active',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'pending';

-- Show updated auctions
SELECT id, title, status, start_time, end_time
FROM auctions
ORDER BY created_at DESC;
