-- Add funds to user wallets for testing

-- Show current wallet balances
SELECT id, name, email, wallet_balance 
FROM users 
ORDER BY created_at DESC;

-- Add 100,000 ETB to all users (except admin)
UPDATE users 
SET wallet_balance = 100000 
WHERE role != 'admin';

-- Show updated balances
SELECT id, name, email, wallet_balance 
FROM users 
ORDER BY created_at DESC;
