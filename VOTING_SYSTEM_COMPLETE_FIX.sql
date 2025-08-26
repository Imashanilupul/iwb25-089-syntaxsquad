-- COMPLETE VOTING SYSTEM FIX FOR PROPOSAL VOTES
-- This script creates the proper database structure and functions for the voting system
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Drop existing triggers and functions to avoid conflicts
DROP TRIGGER IF EXISTS trigger_proposal_vote_change ON proposal_votes;
DROP FUNCTION IF EXISTS handle_proposal_vote_change();
DROP FUNCTION IF EXISTS record_proposal_vote(INTEGER, VARCHAR, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS get_user_proposal_vote(INTEGER, VARCHAR);

-- Step 2: Create or update proposal_votes table
CREATE TABLE IF NOT EXISTS proposal_votes (
    vote_id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL,
    user_id INTEGER NULL,
    wallet_address VARCHAR(255) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('yes', 'no')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_proposal_votes_proposal FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    CONSTRAINT fk_proposal_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Ensure one vote per wallet per proposal (allows vote changes)
    CONSTRAINT unique_wallet_proposal UNIQUE(wallet_address, proposal_id)
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal_id ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_wallet_address ON proposal_votes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_user_id ON proposal_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_vote_type ON proposal_votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal_vote_type ON proposal_votes(proposal_id, vote_type);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_wallet_proposal ON proposal_votes(wallet_address, proposal_id);

-- Step 4: Create comprehensive function to handle vote changes and update proposal counts
CREATE OR REPLACE FUNCTION handle_proposal_vote_change()
RETURNS TRIGGER AS $$
DECLARE
    current_yes_count INTEGER;
    current_no_count INTEGER;
    new_yes_count INTEGER;
    new_no_count INTEGER;
    proposal_id_to_update INTEGER;
BEGIN
    -- Determine which proposal to update
    proposal_id_to_update := COALESCE(NEW.proposal_id, OLD.proposal_id);
    
    -- Recalculate actual vote counts from proposal_votes table for accuracy
    SELECT 
        COALESCE(SUM(CASE WHEN vote_type = 'yes' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN vote_type = 'no' THEN 1 ELSE 0 END), 0)
    INTO new_yes_count, new_no_count
    FROM proposal_votes
    WHERE proposal_id = proposal_id_to_update;
    
    -- If this is a delete operation and we're deleting the last record, counts might be 0
    IF TG_OP = 'DELETE' THEN
        -- Adjust counts for the deleted record
        IF OLD.vote_type = 'yes' THEN
            new_yes_count := GREATEST(0, new_yes_count);
        ELSE
            new_no_count := GREATEST(0, new_no_count);
        END IF;
    END IF;
    
    -- Update proposal vote counts
    UPDATE proposals 
    SET 
        yes_votes = new_yes_count, 
        no_votes = new_no_count,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = proposal_id_to_update;
    
    -- Log the change for debugging
    RAISE NOTICE 'Proposal % vote counts updated: Yes=%, No=%', proposal_id_to_update, new_yes_count, new_no_count;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically handle vote count updates
CREATE TRIGGER trigger_proposal_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON proposal_votes
    FOR EACH ROW
    EXECUTE FUNCTION handle_proposal_vote_change();

-- Step 6: Function to get user's current vote on a proposal
CREATE OR REPLACE FUNCTION get_user_proposal_vote(proposal_id_param INTEGER, wallet_address_param VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    current_vote VARCHAR(10);
BEGIN
    SELECT vote_type INTO current_vote
    FROM proposal_votes
    WHERE proposal_id = proposal_id_param 
    AND wallet_address = wallet_address_param;
    
    RETURN COALESCE(current_vote, 'none');
END;
$$ LANGUAGE plpgsql;

-- Step 7: Comprehensive function to record or update a proposal vote
CREATE OR REPLACE FUNCTION record_proposal_vote(
    proposal_id_param INTEGER,
    wallet_address_param VARCHAR,
    vote_type_param VARCHAR,
    user_id_param INTEGER DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    previous_vote VARCHAR,
    new_vote VARCHAR,
    yes_votes INTEGER,
    no_votes INTEGER
) AS $$
DECLARE
    previous_vote_type VARCHAR(10);
    proposal_exists BOOLEAN;
    proposal_active BOOLEAN;
    final_yes_votes INTEGER;
    final_no_votes INTEGER;
BEGIN
    -- Check if proposal exists and get its status
    SELECT 
        TRUE, 
        active_status
    INTO 
        proposal_exists, 
        proposal_active
    FROM proposals 
    WHERE id = proposal_id_param;
    
    IF NOT proposal_exists THEN
        RETURN QUERY SELECT false, 'Proposal not found'::TEXT, 'none'::VARCHAR, 'none'::VARCHAR, 0, 0;
        RETURN;
    END IF;
    
    IF NOT proposal_active THEN
        RETURN QUERY SELECT false, 'Proposal is not active'::TEXT, 'none'::VARCHAR, 'none'::VARCHAR, 0, 0;
        RETURN;
    END IF;
    
    -- Validate vote type
    IF vote_type_param NOT IN ('yes', 'no') THEN
        RETURN QUERY SELECT false, 'Invalid vote type. Must be yes or no'::TEXT, 'none'::VARCHAR, 'none'::VARCHAR, 0, 0;
        RETURN;
    END IF;
    
    -- Validate wallet address
    IF wallet_address_param IS NULL OR LENGTH(TRIM(wallet_address_param)) = 0 THEN
        RETURN QUERY SELECT false, 'Wallet address is required'::TEXT, 'none'::VARCHAR, 'none'::VARCHAR, 0, 0;
        RETURN;
    END IF;
    
    -- Get previous vote
    SELECT vote_type INTO previous_vote_type
    FROM proposal_votes
    WHERE proposal_id = proposal_id_param 
    AND wallet_address = wallet_address_param;
    
    -- Insert or update vote (this will trigger the vote count update automatically)
    INSERT INTO proposal_votes (proposal_id, wallet_address, user_id, vote_type, created_at, updated_at)
    VALUES (proposal_id_param, wallet_address_param, user_id_param, vote_type_param, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (wallet_address, proposal_id)
    DO UPDATE SET 
        vote_type = vote_type_param,
        updated_at = CURRENT_TIMESTAMP,
        user_id = COALESCE(user_id_param, proposal_votes.user_id);
    
    -- Get updated vote counts from the proposals table (updated by trigger)
    SELECT yes_votes, no_votes INTO final_yes_votes, final_no_votes
    FROM proposals 
    WHERE id = proposal_id_param;
    
    -- Return success result
    RETURN QUERY SELECT 
        true, 
        CASE 
            WHEN previous_vote_type IS NULL THEN 'Vote recorded successfully'
            WHEN previous_vote_type = vote_type_param THEN 'Vote confirmed (no change)'
            ELSE 'Vote changed successfully'
        END::TEXT, 
        COALESCE(previous_vote_type, 'none')::VARCHAR, 
        vote_type_param::VARCHAR,
        final_yes_votes,
        final_no_votes;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Sync existing vote counts (if any proposals exist)
-- This will ensure that existing proposals have correct vote counts
DO $$
DECLARE
    proposal_record RECORD;
    actual_yes_votes INTEGER;
    actual_no_votes INTEGER;
BEGIN
    FOR proposal_record IN SELECT id FROM proposals LOOP
        -- Calculate actual vote counts from proposal_votes table
        SELECT 
            COALESCE(SUM(CASE WHEN vote_type = 'yes' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN vote_type = 'no' THEN 1 ELSE 0 END), 0)
        INTO actual_yes_votes, actual_no_votes
        FROM proposal_votes
        WHERE proposal_id = proposal_record.id;
        
        -- Update the proposal with correct counts
        UPDATE proposals 
        SET 
            yes_votes = actual_yes_votes,
            no_votes = actual_no_votes,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = proposal_record.id;
        
        RAISE NOTICE 'Synced proposal % vote counts: Yes=%, No=%', proposal_record.id, actual_yes_votes, actual_no_votes;
    END LOOP;
END $$;

-- Step 9: Verification and status check
DO $$
BEGIN
    RAISE NOTICE '=== VOTING SYSTEM SETUP VERIFICATION ===';
    
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proposal_votes') THEN
        RAISE NOTICE '✅ proposal_votes table exists';
    ELSE
        RAISE NOTICE '❌ proposal_votes table missing';
    END IF;
    
    -- Check if functions exist
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_proposal_vote_change') THEN
        RAISE NOTICE '✅ handle_proposal_vote_change function exists';
    ELSE
        RAISE NOTICE '❌ handle_proposal_vote_change function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'record_proposal_vote') THEN
        RAISE NOTICE '✅ record_proposal_vote function exists';
    ELSE
        RAISE NOTICE '❌ record_proposal_vote function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_proposal_vote') THEN
        RAISE NOTICE '✅ get_user_proposal_vote function exists';
    ELSE
        RAISE NOTICE '❌ get_user_proposal_vote function missing';
    END IF;
    
    -- Check if trigger exists
    IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_proposal_vote_change') THEN
        RAISE NOTICE '✅ trigger_proposal_vote_change exists';
    ELSE
        RAISE NOTICE '❌ trigger_proposal_vote_change missing';
    END IF;
    
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;

-- Step 10: Show table structure for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'proposal_votes' 
ORDER BY ordinal_position;

-- Step 11: Test the system with sample data (optional - commented out)
/*
-- Uncomment and run this section to test with sample data
INSERT INTO proposals (title, short_description, description_in_details, expired_date, active_status, yes_votes, no_votes)
VALUES ('Test Proposal', 'Test Description', 'Test Details', '2025-12-31 23:59:59', true, 0, 0)
ON CONFLICT DO NOTHING;

-- Test the vote recording function
SELECT * FROM record_proposal_vote(1, '0x1234567890123456789012345678901234567890', 'yes', NULL);
SELECT * FROM record_proposal_vote(1, '0x1234567890123456789012345678901234567890', 'no', NULL);

-- Check the results
SELECT * FROM proposal_votes WHERE proposal_id = 1;
SELECT id, title, yes_votes, no_votes FROM proposals WHERE id = 1;
*/
