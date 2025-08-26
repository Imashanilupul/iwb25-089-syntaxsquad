-- URGENT: Report Voting System Database Migration
-- Run this SQL in your Supabase SQL Editor to fix the 500/404 errors

-- Step 1: Add likes and dislikes columns to existing reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0 CHECK (likes >= 0),
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0 CHECK (dislikes >= 0);

-- Step 2: Create user_votes table for tracking report likes/dislikes
CREATE TABLE IF NOT EXISTS user_votes (
    vote_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    report_id INTEGER REFERENCES reports(report_id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure one vote per user per report
    UNIQUE(user_id, report_id),
    -- Ensure one vote per wallet per report
    UNIQUE(wallet_address, report_id)
);

-- Step 3: Create report_likes table (for better performance)
CREATE TABLE IF NOT EXISTS report_likes (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(report_id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure one like per wallet per report
    UNIQUE(wallet_address, report_id)
);

-- Step 4: Create report_dislikes table (for better performance)
CREATE TABLE IF NOT EXISTS report_dislikes (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(report_id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure one dislike per wallet per report
    UNIQUE(wallet_address, report_id)
);

-- Step 5: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_votes_user_id ON user_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_report_id ON user_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_wallet_address ON user_votes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_report_likes_report_id ON report_likes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_likes_wallet_address ON report_likes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_report_dislikes_report_id ON report_dislikes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_dislikes_wallet_address ON report_dislikes(wallet_address);

-- Step 6: Create functions to automatically update like/dislike counts
CREATE OR REPLACE FUNCTION update_report_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reports 
        SET likes = (SELECT COUNT(*) FROM report_likes WHERE report_id = NEW.report_id)
        WHERE report_id = NEW.report_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reports 
        SET likes = (SELECT COUNT(*) FROM report_likes WHERE report_id = OLD.report_id)
        WHERE report_id = OLD.report_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_report_dislike_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reports 
        SET dislikes = (SELECT COUNT(*) FROM report_dislikes WHERE report_id = NEW.report_id)
        WHERE report_id = NEW.report_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reports 
        SET dislikes = (SELECT COUNT(*) FROM report_dislikes WHERE report_id = OLD.report_id)
        WHERE report_id = OLD.report_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers to automatically update counts
DROP TRIGGER IF EXISTS trigger_update_report_like_count ON report_likes;
CREATE TRIGGER trigger_update_report_like_count
    AFTER INSERT OR DELETE ON report_likes
    FOR EACH ROW EXECUTE FUNCTION update_report_like_count();

DROP TRIGGER IF EXISTS trigger_update_report_dislike_count ON report_dislikes;
CREATE TRIGGER trigger_update_report_dislike_count
    AFTER INSERT OR DELETE ON report_dislikes
    FOR EACH ROW EXECUTE FUNCTION update_report_dislike_count();

-- Step 8: Initialize existing reports with 0 likes and dislikes
UPDATE reports SET 
    likes = COALESCE((SELECT COUNT(*) FROM report_likes WHERE report_likes.report_id = reports.report_id), 0),
    dislikes = COALESCE((SELECT COUNT(*) FROM report_dislikes WHERE report_dislikes.report_id = reports.report_id), 0)
WHERE likes IS NULL OR dislikes IS NULL;

-- Step 9: Verify the tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_votes', 'report_likes', 'report_dislikes')
ORDER BY table_name;

-- Step 10: Verify the columns were added to reports table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND table_schema = 'public'
AND column_name IN ('likes', 'dislikes')
ORDER BY column_name;

-- Success message
SELECT 'Report voting system migration completed successfully!' as status;
