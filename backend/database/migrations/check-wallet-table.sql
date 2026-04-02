-- Check if wallet_transactions table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'wallet_transactions'
);

-- If it exists, show its structure
\d wallet_transactions
