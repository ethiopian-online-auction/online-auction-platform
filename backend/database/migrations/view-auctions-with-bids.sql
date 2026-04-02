-- View all auctions with bid counts and current highest bid
SELECT 
    a.id,
    a.title,
    a.status,
    a.starting_bid,
    a.current_bid,
    a.start_time,
    a.end_time,
    a.seller_id,
    u.name as seller_name,
    COUNT(b.id) as total_bids,
    MAX(b.amount) as highest_bid_amount
FROM auctions a
LEFT JOIN users u ON a.seller_id = u.id
LEFT JOIN bids b ON a.id = b.auction_id
GROUP BY a.id, u.name
ORDER BY a.created_at DESC;
