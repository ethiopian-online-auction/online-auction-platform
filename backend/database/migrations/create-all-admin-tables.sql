-- Create all admin-related tables
-- Run this to ensure all tables exist

-- 1. Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 2. Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reported_auction_id INTEGER REFERENCES auctions(id) ON DELETE SET NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open',
    admin_action VARCHAR(50),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 3. Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 4. Add is_verified column to users if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 5. Verify admin user
UPDATE users SET is_verified = true WHERE email = 'admin@auction.et';

-- Show results
SELECT 'Disputes table' as table_name, COUNT(*) as row_count FROM disputes
UNION ALL
SELECT 'Reports table', COUNT(*) FROM reports
UNION ALL
SELECT 'Transactions table', COUNT(*) FROM transactions
UNION ALL
SELECT 'Users (verified)', COUNT(*) FROM users WHERE is_verified = true;

-- Show table structures
\d disputes
\d reports
\d transactions
