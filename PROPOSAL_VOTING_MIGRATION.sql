-- PROPOSAL VOTING SYSTEM DATABASE MIGRATION
-- Run this SQL in your Supabase SQL Editor to enable proper vote tracking and vote changes

-- Step 1: Create proposal_votes table for tracking individual votes
CREATE TABLE IF NOT EXISTS proposal_votes (
    vote_id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    wallet_address VARCHAR(255) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('yes', 'no')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one vote per wallet per proposal (allows vote changes)
    UNIQUE(wallet_address, proposal_id)
);

-- Step 2: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal_id ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_wallet_address ON proposal_votes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_user_id ON proposal_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_vote_type ON proposal_votes(vote_type);

-- Step 3: Create function to handle vote changes and update proposal counts
CREATE OR REPLACE FUNCTION handle_proposal_vote_change()
RETURNS TRIGGER AS $$
DECLARE
    old_yes_count INTEGER;
    old_no_count INTEGER;
    new_yes_count INTEGER;
    new_no_count INTEGER;
BEGIN
    -- Get current vote counts for the proposal
    SELECT yes_votes, no_votes INTO old_yes_count, old_no_count
    FROM proposals 
    WHERE id = COALESCE(NEW.proposal_id, OLD.proposal_id);
    
    IF TG_OP = 'INSERT' THEN
        -- New vote
        IF NEW.vote_type = 'yes' THEN
            new_yes_count := old_yes_count + 1;
            new_no_count := old_no_count;
        ELSE
            new_yes_count := old_yes_count;
            new_no_count := old_no_count + 1;
        END IF;
        
        -- Update proposal vote counts
        UPDATE proposals 
        SET yes_votes = new_yes_count, 
            no_votes = new_no_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.proposal_id;
        
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
        
        -- Update proposal vote counts
        UPDATE proposals 
        SET yes_votes = new_yes_count, 
            no_votes = new_no_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.proposal_id;
        
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
        
        -- Update proposal vote counts
        UPDATE proposals 
        SET yes_votes = new_yes_count, 
            no_votes = new_no_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.proposal_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically handle vote count updates
DROP TRIGGER IF EXISTS trigger_proposal_vote_change ON proposal_votes;
CREATE TRIGGER trigger_proposal_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON proposal_votes
    FOR EACH ROW
    EXECUTE FUNCTION handle_proposal_vote_change();

-- Step 5: Add function to get user's current vote on a proposal
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

-- Step 6: Add function to record or update a proposal vote
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
    -- Check if proposal exists and is active
    SELECT yes_votes, no_votes INTO proposal_yes_votes, proposal_no_votes
    FROM proposals 
    WHERE id = proposal_id_param AND active_status = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Proposal not found or inactive'::TEXT, 'none'::VARCHAR, 'none'::VARCHAR, 0, 0;
        RETURN;
    END IF;
    
    -- Validate vote type
    IF vote_type_param NOT IN ('yes', 'no') THEN
        RETURN QUERY SELECT false, 'Invalid vote type. Must be yes or no'::TEXT, 'none'::VARCHAR, 'none'::VARCHAR, proposal_yes_votes, proposal_no_votes;
        RETURN;
    END IF;
    
    -- Get previous vote
    SELECT vote_type INTO previous_vote_type
    FROM proposal_votes
    WHERE proposal_id = proposal_id_param 
    AND wallet_address = wallet_address_param;
    
    -- Insert or update vote
    INSERT INTO proposal_votes (proposal_id, wallet_address, user_id, vote_type)
    VALUES (proposal_id_param, wallet_address_param, user_id_param, vote_type_param)
    ON CONFLICT (wallet_address, proposal_id)
    DO UPDATE SET 
        vote_type = vote_type_param,
        updated_at = CURRENT_TIMESTAMP,
        user_id = COALESCE(user_id_param, proposal_votes.user_id);
    
    -- Get updated vote counts
    SELECT yes_votes, no_votes INTO proposal_yes_votes, proposal_no_votes
    FROM proposals 
    WHERE id = proposal_id_param;
    
    RETURN QUERY SELECT 
        true, 
        'Vote recorded successfully'::TEXT, 
        COALESCE(previous_vote_type, 'none')::VARCHAR, 
        vote_type_param::VARCHAR,
        proposal_yes_votes,
        proposal_no_votes;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Verification queries
-- Check if the tables and functions were created successfully
SELECT 'proposal_votes table created' AS status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proposal_votes');

SELECT 'handle_proposal_vote_change function created' AS status 
WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_proposal_vote_change');

SELECT 'get_user_proposal_vote function created' AS status 
WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_proposal_vote');

SELECT 'record_proposal_vote function created' AS status 
WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'record_proposal_vote');

-- Step 8: Show table structure (alternative to \d command)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'proposal_votes' 
ORDER BY ordinal_position;
