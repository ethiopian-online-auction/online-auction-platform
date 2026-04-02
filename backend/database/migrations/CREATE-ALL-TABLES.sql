-- ========================================
-- CREATE ALL ADMIN TABLES
-- Run this in pgAdmin Query Tool
-- ========================================

-- 1. Create disputes table
DROP TABLE IF EXISTS disputes CASCADE;
CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 2. Create reports table
DROP TABLE IF EXISTS reports CASCADE;
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_auction_id UUID REFERENCES auctions(id) ON DELETE SET NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open',
    admin_action VARCHAR(50),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 3. Create transactions table
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 4. Create seller_applications table
CREATE TABLE IF NOT EXISTS seller_applications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    documents JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by_admin_id UUID REFERENCES users(id)
);

-- 5. Create escrow_transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id SERIAL PRIMARY KEY,
    escrow_id VARCHAR(50) UNIQUE NOT NULL,
    auction_id UUID REFERENCES auctions(id),
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'in-escrow',
    shipping_id VARCHAR(255),
    blockchain_tx_hash VARCHAR(255),
    smart_contract_address VARCHAR(255),
    shipping_verified_at TIMESTAMP,
    released_at TIMESTAMP,
    verified_by_admin_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 5.00;

-- 7. Verify admin user
UPDATE users SET is_verified = true WHERE email = 'admin@auction.et';

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);

-- Verify tables were created
SELECT 
    'disputes' as table_name, 
    COUNT(*) as row_count 
FROM disputes
UNION ALL
SELECT 'reports', COUNT(*) FROM reports
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'seller_applications', COUNT(*) FROM seller_applications
UNION ALL
SELECT 'escrow_transactions', COUNT(*) FROM escrow_transactions;

-- Show success message
SELECT 'All tables created successfully!' as status;
