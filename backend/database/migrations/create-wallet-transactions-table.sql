-- Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'bid_placed', 'bid_refund', 'payment'
    amount NUMERIC(15, 2) NOT NULL,
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    reference_id VARCHAR(255), -- External payment reference
    payment_method VARCHAR(50), -- 'chapa', 'telebirr', 'cbe_birr', 'test'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Show success message
SELECT 'wallet_transactions table created successfully!' as message;
