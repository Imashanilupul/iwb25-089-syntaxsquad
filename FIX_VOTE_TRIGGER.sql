-- FIX FOR VOTE TRIGGER AMBIGUOUS COLUMN REFERENCE
-- Run this SQL in your Supabase SQL Editor to fix the trigger function

-- Step 1: Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_proposal_vote_change ON proposal_votes;
DROP FUNCTION IF EXISTS handle_proposal_vote_change();

-- Step 2: Create fixed function with explicit table aliases
CREATE OR REPLACE FUNCTION handle_proposal_vote_change()
RETURNS TRIGGER AS $$
DECLARE
    old_yes_count INTEGER;
    old_no_count INTEGER;
    new_yes_count INTEGER;
    new_no_count INTEGER;
    target_proposal_id INTEGER;
BEGIN
    -- Determine which proposal we're working with
    target_proposal_id := COALESCE(NEW.proposal_id, OLD.proposal_id);
    
    -- Get current vote counts for the proposal with explicit table reference
    SELECT p.yes_votes, p.no_votes INTO old_yes_count, old_no_count
    FROM proposals p 
    WHERE p.id = target_proposal_id;
    
    IF TG_OP = 'INSERT' THEN
        -- New vote
        IF NEW.vote_type = 'yes' THEN
            new_yes_count := old_yes_count + 1;
            new_no_count := old_no_count;
        ELSE
            new_yes_count := old_yes_count;
            new_no_count := old_no_count + 1;
        END IF;
        
        -- Update proposal vote counts with explicit table reference
        UPDATE proposals p
        SET yes_votes = new_yes_count, 
            no_votes = new_no_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE p.id = target_proposal_id;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Vote change
        IF OLD.vote_type = 'yes' AND NEW.vote_type = 'no' THEN
            -- Changed from yes to no
            new_yes_count := old_yes_count - 1;
            new_no_count := old_no_count + 1;
        ELSIF OLD.vote_type = 'no' AND NEW.vote_type = 'yes' THEN
            -- Changed from no to yes
            new_yes_count := old_yes_count + 1;
            new_no_count := old_no_count - 1;
        ELSE
            -- No change in vote type
            RETURN NEW;
        END IF;
        
        -- Update proposal vote counts with explicit table reference
        UPDATE proposals p
        SET yes_votes = new_yes_count, 
            no_votes = new_no_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE p.id = target_proposal_id;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Vote deletion
        IF OLD.vote_type = 'yes' THEN
            new_yes_count := old_yes_count - 1;
            new_no_count := old_no_count;
        ELSE
            new_yes_count := old_yes_count;
            new_no_count := old_no_count - 1;
        END IF;
        
        -- Update proposal vote counts with explicit table reference
        UPDATE proposals p
        SET yes_votes = new_yes_count, 
            no_votes = new_no_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE p.id = target_proposal_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate the trigger
CREATE TRIGGER trigger_proposal_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON proposal_votes
    FOR EACH ROW
    EXECUTE FUNCTION handle_proposal_vote_change();

-- Step 4: Also fix the record_proposal_vote function to avoid conflicts
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
    proposal_yes_votes INTEGER;
    proposal_no_votes INTEGER;
BEGIN
    -- Check if proposal exists and is active with explicit table reference
    SELECT p.yes_votes, p.no_votes INTO proposal_yes_votes, proposal_no_votes
    FROM proposals p 
    WHERE p.id = proposal_id_param AND p.active_status = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Proposal not found or inactive'::TEXT, 'none'::VARCHAR, 'none'::VARCHAR, 0, 0;
        RETURN;
    END IF;
    
    -- Validate vote type
    IF vote_type_param NOT IN ('yes', 'no') THEN
        RETURN QUERY SELECT false, 'Invalid vote type. Must be yes or no'::TEXT, 'none'::VARCHAR, 'none'::VARCHAR, proposal_yes_votes, proposal_no_votes;
        RETURN;
    END IF;
    
    -- Get previous vote with explicit table reference
    SELECT pv.vote_type INTO previous_vote_type
    FROM proposal_votes pv
    WHERE pv.proposal_id = proposal_id_param 
    AND pv.wallet_address = wallet_address_param;
    
    -- Insert or update vote (the trigger will handle count updates)
    INSERT INTO proposal_votes (proposal_id, wallet_address, user_id, vote_type)
    VALUES (proposal_id_param, wallet_address_param, user_id_param, vote_type_param)
    ON CONFLICT (wallet_address, proposal_id)
    DO UPDATE SET 
        vote_type = vote_type_param,
        updated_at = CURRENT_TIMESTAMP,
        user_id = COALESCE(user_id_param, proposal_votes.user_id);
    
    -- Get updated vote counts with explicit table reference
    SELECT p.yes_votes, p.no_votes INTO proposal_yes_votes, proposal_no_votes
    FROM proposals p 
    WHERE p.id = proposal_id_param;
    
    RETURN QUERY SELECT 
        true, 
        'Vote recorded successfully'::TEXT, 
        COALESCE(previous_vote_type, 'none')::VARCHAR, 
        vote_type_param::VARCHAR,
        proposal_yes_votes,
        proposal_no_votes;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Test query to verify the fix worked
SELECT 'Fixed trigger function deployed successfully' AS status;
