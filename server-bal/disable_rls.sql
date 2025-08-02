-- Disable Row Level Security for Development Testing
-- Run this AFTER creating the tables to enable REST API access
-- WARNING: This is for development only! Enable RLS in production.

-- Disable RLS on all tables for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE policy_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE petitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE petition_activities DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'categories', 'projects', 'transactions', 'proposals', 'policies', 'policy_comments', 'reports', 'petitions', 'petition_activities');

SELECT 'Row Level Security disabled for all tables. REST API access should now work.' AS status;
