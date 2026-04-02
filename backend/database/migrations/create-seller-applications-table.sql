-- Create seller_applications table
CREATE TABLE IF NOT EXISTS seller_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
    reviewed_by_admin_id INTEGER REFERENCES users(id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_seller_applications_user_id ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);

-- Add subscription_status column to users if it doesn't exist
DO $
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'none';
    END IF;
END
$;

-- Add commission_rate column to users if it doesn't exist
DO $
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'commission_rate'
    ) THEN
        ALTER TABLE users ADD COLUMN commission_rate DECIMAL(5, 2) DEFAULT 5.00;
    END IF;
END
$;

SELECT 'Seller applications table created successfully!' as message;
