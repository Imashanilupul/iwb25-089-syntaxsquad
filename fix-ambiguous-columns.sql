-- QUICK FIX FOR AMBIGUOUS COLUMN REFERENCE
-- Run this in Supabase SQL Editor to fix the voting system

-- Drop and recreate the record_proposal_vote function with fixed column references
DROP FUNCTION IF EXISTS record_proposal_vote(INTEGER, VARCHAR, VARCHAR, INTEGER);

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
        p.active_status
    INTO 
        proposal_exists, 
        proposal_active
    FROM proposals p
    WHERE p.id = proposal_id_param;
    
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
    SELECT pv.vote_type INTO previous_vote_type
    FROM proposal_votes pv
    WHERE pv.proposal_id = proposal_id_param 
    AND pv.wallet_address = wallet_address_param;
    
    -- Insert or update vote (this will trigger the vote count update automatically)
    INSERT INTO proposal_votes (proposal_id, wallet_address, user_id, vote_type, created_at, updated_at)
    VALUES (proposal_id_param, wallet_address_param, user_id_param, vote_type_param, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (wallet_address, proposal_id)
    DO UPDATE SET 
        vote_type = vote_type_param,
        updated_at = CURRENT_TIMESTAMP,
        user_id = COALESCE(user_id_param, proposal_votes.user_id);
    
    -- Get updated vote counts from the proposals table (updated by trigger)
    -- Use table alias to avoid ambiguous column references
    SELECT p.yes_votes, p.no_votes INTO final_yes_votes, final_no_votes
    FROM proposals p
    WHERE p.id = proposal_id_param;
    
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
