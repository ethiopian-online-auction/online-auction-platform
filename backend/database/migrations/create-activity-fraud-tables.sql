-- ========================================
-- CREATE ACTIVITY LOGGING & FRAUD DETECTION TABLES
-- Run this in pgAdmin Query Tool
-- ========================================

-- 1. Create activity_logs table
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

-- 2. Create fraud_alerts table
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

-- 3. Create user_sessions table (for tracking multiple logins)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create suspicious_activities table
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

-- 5. Add fraud-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_suspicious_activity TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ip ON activity_logs(ip_address);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user ON fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_created ON fraud_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user ON suspicious_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_type ON suspicious_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_score ON suspicious_activities(risk_score);

-- 7. Verify tables were created
SELECT 
    'activity_logs' as table_name, 
    COUNT(*) as row_count 
FROM activity_logs
UNION ALL
SELECT 'fraud_alerts', COUNT(*) FROM fraud_alerts
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'suspicious_activities', COUNT(*) FROM suspicious_activities;

-- Show success message
SELECT '✅ Activity Logging & Fraud Detection tables created successfully!' as status;
