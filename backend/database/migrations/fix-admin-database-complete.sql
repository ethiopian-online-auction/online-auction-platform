-- Complete database fix for admin functionality
-- This script will check and create all required tables and columns

\echo '========================================';
\echo '  CHECKING AND FIXING DATABASE';
\echo '========================================';
\echo '';

-- 1. Check if disputes table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'disputes') THEN
        CREATE TABLE disputes (
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
        RAISE NOTICE '✓ Created disputes table';
    ELSE
        RAISE NOTICE '✓ Disputes table already exists';
    END IF;
END
$$;

-- 2. Check if reports table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
        CREATE TABLE reports (
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
        RAISE NOTICE '✓ Created reports table';
    ELSE
        RAISE NOTICE '✓ Reports table already exists';
    END IF;
END
$$;

-- 3. Check if transactions table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        CREATE TABLE transactions (
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
        RAISE NOTICE '✓ Created transactions table';
    ELSE
        RAISE NOTICE '✓ Transactions table already exists';
    END IF;
END
$$;

-- 4. Add is_verified column to users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
        RAISE NOTICE '✓ Added is_verified column to users table';
    ELSE
        RAISE NOTICE '✓ is_verified column already exists';
    END IF;
END
$$;

-- 5. Verify admin user
UPDATE users SET is_verified = true WHERE email = 'admin@auction.et';

\echo '';
\echo '========================================';
\echo '  VERIFICATION';
\echo '========================================';
\echo '';

-- Show table counts
SELECT 'disputes' as table_name, COUNT(*) as row_count FROM disputes
UNION ALL
SELECT 'reports', COUNT(*) FROM reports
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'users (total)', COUNT(*) FROM users
UNION ALL
SELECT 'users (verified)', COUNT(*) FROM users WHERE is_verified = true
UNION ALL
SELECT 'auctions', COUNT(*) FROM auctions
UNION ALL
SELECT 'bids', COUNT(*) FROM bids;

\echo '';
\echo '========================================';
\echo '  SETUP COMPLETE!';
\echo '========================================';
\echo '';
\echo 'Next steps:';
\echo '1. Restart backend server (Ctrl+C, then npm start)';
\echo '2. Refresh admin page in browser (F5)';
\echo '3. Check console for success messages';
\echo '';
