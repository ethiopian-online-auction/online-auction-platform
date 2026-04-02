-- AI and Blockchain Feature Tables
-- Run this to create tables for fraud detection and blockchain escrow

-- Fraud Detection Logs Table
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
    fraud_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    risk_level VARCHAR(20) NOT NULL, -- minimal, low, medium, high, critical
    indicators JSONB, -- Array of fraud indicators
    actual_fraud BOOLEAN DEFAULT NULL, -- Feedback: was it actually fraud?
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    feedback_at TIMESTAMP,
    CONSTRAINT valid_fraud_score CHECK (fraud_score >= 0 AND fraud_score <= 1),
    CONSTRAINT valid_risk_level CHECK (risk_level IN ('minimal', 'low', 'medium', 'high', 'critical'))
);

-- Blockchain Escrows Table
CREATE TABLE IF NOT EXISTS blockchain_escrows (
    id SERIAL PRIMARY KEY,
    escrow_id VARCHAR(100) UNIQUE NOT NULL,
    transaction_id INTEGER REFERENCES escrow_transactions(id) ON DELETE CASCADE,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    state VARCHAR(20) NOT NULL, -- created, funded, shipped, delivered, released, disputed, refunded
    network VARCHAR(50) NOT NULL, -- polygon-mumbai, polygon-mainnet, ethereum-goerli, ethereum-mainnet
    
    -- Blockchain transaction hashes
    blockchain_tx_hash VARCHAR(66), -- Contract deployment hash
    funding_tx_hash VARCHAR(66), -- Funding transaction hash
    shipping_tx_hash VARCHAR(66), -- Shipping update hash
    delivery_tx_hash VARCHAR(66), -- Delivery confirmation hash
    release_tx_hash VARCHAR(66), -- Fund release hash
    refund_tx_hash VARCHAR(66), -- Refund hash
    
    -- Tracking information
    tracking_number VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    funded_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    released_at TIMESTAMP,
    refunded_at TIMESTAMP,
    
    -- Admin actions
    released_by INTEGER REFERENCES users(id),
    refunded_by INTEGER REFERENCES users(id),
    refund_reason TEXT,
    
    CONSTRAINT valid_state CHECK (state IN ('created', 'funded', 'shipped', 'delivered', 'released', 'disputed', 'refunded'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fraud_logs_user ON fraud_detection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_auction ON fraud_detection_logs(auction_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_risk ON fraud_detection_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_detected ON fraud_detection_logs(detected_at);

CREATE INDEX IF NOT EXISTS idx_blockchain_escrow_id ON blockchain_escrows(escrow_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transaction ON blockchain_escrows(transaction_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_buyer ON blockchain_escrows(buyer_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_seller ON blockchain_escrows(seller_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_state ON blockchain_escrows(state);

-- Comments
COMMENT ON TABLE fraud_detection_logs IS 'ML-based fraud detection analysis logs';
COMMENT ON TABLE blockchain_escrows IS 'Blockchain-based escrow smart contracts';

COMMENT ON COLUMN fraud_detection_logs.fraud_score IS 'Calculated fraud probability (0-1)';
COMMENT ON COLUMN fraud_detection_logs.indicators IS 'JSON array of detected fraud patterns';
COMMENT ON COLUMN fraud_detection_logs.actual_fraud IS 'Admin feedback for ML training';

COMMENT ON COLUMN blockchain_escrows.escrow_id IS 'Unique escrow identifier';
COMMENT ON COLUMN blockchain_escrows.blockchain_tx_hash IS 'Smart contract deployment transaction hash';
COMMENT ON COLUMN blockchain_escrows.state IS 'Current escrow state in the workflow';
