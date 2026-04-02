-- ============================================================
-- ML Fraud Detection — Real Training Data Seed
-- Run this in pgAdmin after create-activity-fraud-tables.sql
-- ============================================================

-- 0. Create prerequisite tables if they don't exist yet
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    request_body JSONB,
    response_status INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    description TEXT NOT NULL,
    evidence JSONB,
    ip_address VARCHAR(45),
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suspicious_activities (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    risk_score INTEGER DEFAULT 0,
    ip_address VARCHAR(45),
    metadata JSONB,
    auto_flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_suspicious_activity TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;

-- 1. Create fraud_detection_logs table (used by ml-fraud-detection.service.js)
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    auction_id UUID REFERENCES auctions(id) ON DELETE SET NULL,
    fraud_score DECIMAL(4,3) NOT NULL,          -- 0.000 to 1.000
    risk_level VARCHAR(20) NOT NULL,             -- minimal/low/medium/high/critical
    indicators JSONB DEFAULT '[]',
    actual_fraud BOOLEAN,                        -- feedback label for training
    feedback_at TIMESTAMP,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fdl_user      ON fraud_detection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fdl_risk      ON fraud_detection_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_fdl_score     ON fraud_detection_logs(fraud_score);
CREATE INDEX IF NOT EXISTS idx_fdl_detected  ON fraud_detection_logs(detected_at);
CREATE INDEX IF NOT EXISTS idx_fdl_feedback  ON fraud_detection_logs(actual_fraud);

-- 2. ML model thresholds table — lets the system self-tune from real data
CREATE TABLE IF NOT EXISTS ml_thresholds (
    id SERIAL PRIMARY KEY,
    threshold_name VARCHAR(100) UNIQUE NOT NULL,
    threshold_value DECIMAL(10,4) NOT NULL,
    description TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial thresholds (tuned for Ethiopian auction context)
INSERT INTO ml_thresholds (threshold_name, threshold_value, description) VALUES
  ('rapid_bidding_per_min',   5,       'Max bids per minute before flagging'),
  ('suspicious_amount_etb',   500000,  'Bid amount in ETB considered unusually high'),
  ('new_account_hours',       48,      'Account age in hours considered new/risky'),
  ('bid_cancel_rate',         0.30,    'Bid cancellation rate threshold (30%)'),
  ('ip_duplicate_accounts',   3,       'Max accounts from same IP in 24h'),
  ('fraud_block_score',       0.70,    'Fraud score at which to auto-block'),
  ('fraud_review_score',      0.50,    'Fraud score at which to flag for review'),
  ('fraud_monitor_score',     0.30,    'Fraud score at which to monitor'),
  ('auto_lock_fraud_score',   80,      'User fraud_score (0-100) to auto-lock account'),
  ('velocity_window_minutes', 60,      'Time window in minutes for velocity checks')
ON CONFLICT (threshold_name) DO NOTHING;

-- 3. Seed realistic fraud detection training data
--    These represent historical patterns seen in online auction fraud
--    actual_fraud = true  → confirmed fraud (used to train/validate the model)
--    actual_fraud = false → confirmed legitimate (false positives)
--    actual_fraud = NULL  → not yet reviewed

-- Get real user IDs from the database for seeding
DO $$
DECLARE
  v_user1 UUID;
  v_user2 UUID;
  v_user3 UUID;
  v_auction1 UUID;
  v_auction2 UUID;
BEGIN
  -- Pick first few real users and auctions if they exist
  SELECT id INTO v_user1 FROM users WHERE role = 'buyer' LIMIT 1;
  SELECT id INTO v_user2 FROM users WHERE role = 'seller' LIMIT 1;
  SELECT id INTO v_user3 FROM users ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_auction1 FROM auctions LIMIT 1;
  SELECT id INTO v_auction2 FROM auctions OFFSET 1 LIMIT 1;

  -- Only seed if we have real users
  IF v_user1 IS NOT NULL THEN

    -- Pattern 1: Shill bidding (seller bidding on own auction) — HIGH fraud
    INSERT INTO fraud_detection_logs (user_id, auction_id, fraud_score, risk_level, indicators, actual_fraud, feedback_at, detected_at)
    VALUES
      (v_user1, v_auction1, 0.85, 'critical',
       '[{"type":"shill_bidding","severity":"high","description":"User bidding on own auction"},{"type":"new_account","severity":"medium","description":"Account created 12 hours ago"}]',
       true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days'),

      (v_user1, v_auction1, 0.78, 'critical',
       '[{"type":"shill_bidding","severity":"high","description":"User bidding on own auction"},{"type":"rapid_bidding","severity":"high","description":"8 bids in last minute"}]',
       true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days'),

    -- Pattern 2: Rapid bidding / bot behavior — HIGH fraud
      (v_user2, v_auction2, 0.72, 'critical',
       '[{"type":"rapid_bidding","severity":"high","description":"12 bids in last minute"},{"type":"suspicious_amount","severity":"medium","description":"Unusually high bid: 750000 ETB"}]',
       true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'),

      (v_user1, v_auction2, 0.65, 'high',
       '[{"type":"rapid_bidding","severity":"high","description":"7 bids in last minute"}]',
       true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),

    -- Pattern 3: New account with suspicious amount — MEDIUM fraud
      (v_user3, v_auction1, 0.55, 'high',
       '[{"type":"new_account","severity":"medium","description":"Account created 6 hours ago"},{"type":"suspicious_amount","severity":"medium","description":"Bid of 600000 ETB from new account"}]',
       true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),

    -- Pattern 4: Bid sniping (low severity, often legitimate)
      (v_user1, v_auction1, 0.15, 'low',
       '[{"type":"bid_sniping","severity":"low","description":"Bid placed in last 2 minutes"}]',
       false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),

      (v_user2, v_auction2, 0.12, 'low',
       '[{"type":"bid_sniping","severity":"low","description":"Bid placed in last 90 seconds"}]',
       false, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day'),

    -- Pattern 5: Legitimate users flagged (false positives — important for training)
      (v_user1, v_auction2, 0.08, 'minimal',
       '[]',
       false, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '12 hours'),

      (v_user2, v_auction1, 0.05, 'minimal',
       '[]',
       false, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '6 hours'),

    -- Pattern 6: Unreviewed recent detections (NULL actual_fraud)
      (v_user3, v_auction2, 0.45, 'medium',
       '[{"type":"new_account","severity":"medium","description":"Account created 30 hours ago"},{"type":"bid_sniping","severity":"low","description":"Last-second bid"}]',
       NULL, NULL, NOW() - INTERVAL '2 hours'),

      (v_user1, v_auction1, 0.62, 'high',
       '[{"type":"rapid_bidding","severity":"high","description":"6 bids in last minute"},{"type":"new_account","severity":"medium","description":"Account created 20 hours ago"}]',
       NULL, NULL, NOW() - INTERVAL '1 hour'),

      (v_user2, v_auction2, 0.33, 'medium',
       '[{"type":"suspicious_amount","severity":"medium","description":"Bid of 520000 ETB"}]',
       NULL, NULL, NOW() - INTERVAL '30 minutes');

  END IF;
END $$;

-- 4. Seed suspicious_activities with realistic patterns
DO $$
DECLARE v_user UUID;
BEGIN
  SELECT id INTO v_user FROM users WHERE role = 'buyer' LIMIT 1;
  IF v_user IS NOT NULL THEN
    INSERT INTO suspicious_activities (user_id, activity_type, description, risk_score, ip_address, auto_flagged, created_at)
    VALUES
      (v_user, 'rapid_bidding',        'Placed 8 bids within 1 minute on auction #1042',          25, '196.188.45.12', true,  NOW() - INTERVAL '3 days'),
      (v_user, 'shill_bidding',        'Bid detected on own auction listing',                      40, '196.188.45.12', true,  NOW() - INTERVAL '2 days'),
      (v_user, 'multiple_accounts',    '4 different accounts accessed from same IP in 24 hours',   30, '196.188.45.12', true,  NOW() - INTERVAL '1 day'),
      (v_user, 'bid_sniping',          'Last-second bid pattern detected (5 times in 7 days)',     10, '197.156.72.88', true,  NOW() - INTERVAL '12 hours'),
      (v_user, 'frequent_cancellations','4 bid cancellations in 7 days',                           15, '197.156.72.88', false, NOW() - INTERVAL '6 hours');
  END IF;
END $$;

-- 5. Seed fraud_alerts with realistic data
DO $$
DECLARE v_user UUID;
BEGIN
  SELECT id INTO v_user FROM users WHERE role = 'buyer' LIMIT 1;
  IF v_user IS NOT NULL THEN
    INSERT INTO fraud_alerts (user_id, alert_type, severity, description, evidence, ip_address, status, created_at)
    VALUES
      (v_user, 'shill_bidding',     'critical', 'User placed bids on their own auction 3 times',
       '{"bids_on_own_auction":3,"auction_ids":["auto-detected"]}', '196.188.45.12', 'pending',  NOW() - INTERVAL '2 days'),

      (v_user, 'rapid_bidding',     'high',     '12 bids placed within 60 seconds — possible bot',
       '{"bids_per_minute":12,"threshold":5}',                      '196.188.45.12', 'pending',  NOW() - INTERVAL '1 day'),

      (v_user, 'multiple_accounts', 'high',     '4 accounts from same IP address in 24 hours',
       '{"accounts_from_ip":4,"ip":"196.188.45.12"}',               '196.188.45.12', 'reviewed', NOW() - INTERVAL '5 days'),

      (v_user, 'suspicious_amount', 'medium',   'Bid of 750,000 ETB from account created 6 hours ago',
       '{"bid_amount":750000,"account_age_hours":6}',               '197.156.72.88', 'dismissed',NOW() - INTERVAL '7 days');
  END IF;
END $$;

-- 6. View summary of seeded data
SELECT 'fraud_detection_logs' as table_name, COUNT(*) as rows, 
       COUNT(*) FILTER (WHERE actual_fraud = true)  as confirmed_fraud,
       COUNT(*) FILTER (WHERE actual_fraud = false) as confirmed_legit,
       COUNT(*) FILTER (WHERE actual_fraud IS NULL) as unreviewed,
       ROUND(AVG(fraud_score)::numeric, 3) as avg_score
FROM fraud_detection_logs
UNION ALL
SELECT 'suspicious_activities', COUNT(*), 
       COUNT(*) FILTER (WHERE auto_flagged = true), 0, 0, AVG(risk_score)
FROM suspicious_activities
UNION ALL
SELECT 'fraud_alerts', COUNT(*),
       COUNT(*) FILTER (WHERE status = 'pending'),
       COUNT(*) FILTER (WHERE status = 'reviewed'),
       COUNT(*) FILTER (WHERE status = 'dismissed'), 0
FROM fraud_alerts
UNION ALL
SELECT 'ml_thresholds', COUNT(*), 0, 0, 0, 0
FROM ml_thresholds;

SELECT '✅ ML training data seeded successfully!' as status;
