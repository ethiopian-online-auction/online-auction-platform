-- Create virtual assistant logs table
-- This table stores all conversations with the AI assistant for analytics and improvement

\echo '========================================';
\echo '  CREATING VIRTUAL ASSISTANT TABLE';
\echo '========================================';
\echo '';

-- Check if table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'virtual_assistant_logs') THEN
        CREATE TABLE virtual_assistant_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            user_message TEXT NOT NULL,
            bot_response TEXT NOT NULL,
            category VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create index for faster queries
        CREATE INDEX idx_assistant_user_id ON virtual_assistant_logs(user_id);
        CREATE INDEX idx_assistant_category ON virtual_assistant_logs(category);
        CREATE INDEX idx_assistant_created_at ON virtual_assistant_logs(created_at);
        
        RAISE NOTICE '✓ Created virtual_assistant_logs table with indexes';
    ELSE
        RAISE NOTICE '✓ virtual_assistant_logs table already exists';
    END IF;
END
$$;

\echo '';
\echo '========================================';
\echo '  TABLE VERIFICATION';
\echo '========================================';
\echo '';

-- Show table structure
\d virtual_assistant_logs

-- Show row count
SELECT 'virtual_assistant_logs' as table_name, COUNT(*) as row_count 
FROM virtual_assistant_logs;

\echo '';
\echo '========================================';
\echo '  SETUP COMPLETE!';
\echo '========================================';
\echo '';
\echo 'Virtual Assistant table is ready to use.';
\echo 'The AI assistant can now log conversations.';
\echo '';
