-- Add the missing Province column to the existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS Province VARCHAR(100);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
