-- Check if database functions exist
SELECT routine_name, routine_type, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('record_proposal_vote', 'handle_proposal_vote_change', 'get_user_proposal_vote');

-- Check if proposal_votes table exists with correct structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'proposal_votes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any votes in the proposal_votes table
SELECT id, proposal_id, user_id, wallet_address, vote_type, created_at, updated_at 
FROM proposal_votes 
ORDER BY created_at DESC 
LIMIT 10;

-- Check the current vote counts in proposals table
SELECT id, title, yes_votes, no_votes, total_votes 
FROM proposals 
ORDER BY created_at DESC 
LIMIT 5;
