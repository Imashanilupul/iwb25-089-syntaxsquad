-- Add voting fields to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Add constraints for likes and dislikes
ALTER TABLE reports 
ADD CONSTRAINT IF NOT EXISTS check_likes_positive CHECK (likes >= 0),
ADD CONSTRAINT IF NOT EXISTS check_dislikes_positive CHECK (dislikes >= 0);

-- Create user_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_votes (
    vote_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, wallet_address)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_votes_report_id ON user_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_wallet ON user_votes(wallet_address);

-- Update existing reports to have default values
UPDATE reports SET likes = 0, dislikes = 0 WHERE likes IS NULL OR dislikes IS NULL;

-- Set default priority for reports based on current likes/dislikes (if any)
UPDATE reports 
SET priority = CASE 
    WHEN (COALESCE(likes, 0) - COALESCE(dislikes, 0)) >= 50 THEN 'CRITICAL'
    WHEN (COALESCE(likes, 0) - COALESCE(dislikes, 0)) >= 20 THEN 'HIGH'
    WHEN (COALESCE(likes, 0) - COALESCE(dislikes, 0)) >= 5 THEN 'MEDIUM'
    ELSE 'LOW'
END
WHERE priority IS NULL OR priority = '';

-- Commit the changes
COMMIT;
