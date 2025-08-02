-- Database Migration SQL for Transparent Governance Platform
-- Copy and paste this entire content into Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nic VARCHAR(20) UNIQUE NOT NULL,
    mobile_no VARCHAR(15) NOT NULL,
    evm VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    allocated_budget DECIMAL(15,2) NOT NULL CHECK (allocated_budget >= 0),
    spent_budget DECIMAL(15,2) DEFAULT 0 CHECK (spent_budget >= 0 AND spent_budget <= allocated_budget),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    allocated_budget DECIMAL(15,2) NOT NULL,
    spent_budget DECIMAL(15,2) DEFAULT 0,
    state VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    ministry VARCHAR(255) NOT NULL,
    view_details TEXT,
    status VARCHAR(50) DEFAULT 'PLANNED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(50) NOT NULL DEFAULT 'EXPENSE' 
        CHECK (transaction_type IN ('EXPENSE', 'ALLOCATION', 'REFUND')),
    description TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    description_in_details TEXT NOT NULL,
    active_status BOOLEAN DEFAULT true,
    expired_date TIMESTAMP NOT NULL CHECK (expired_date > CURRENT_TIMESTAMP),
    yes_votes INTEGER DEFAULT 0 CHECK (yes_votes >= 0),
    no_votes INTEGER DEFAULT 0 CHECK (no_votes >= 0),
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    view_full_policy TEXT NOT NULL,
    ministry VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    effective_date TIMESTAMP,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create policy comments table
CREATE TABLE IF NOT EXISTS policy_comments (
    comment_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES policies(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    reply_id INTEGER REFERENCES policy_comments(comment_id) ON DELETE CASCADE,
    reply_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    report_id SERIAL PRIMARY KEY,
    report_title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM' 
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    assigned_to VARCHAR(255),
    evidence_hash VARCHAR(255) NOT NULL,
    resolved_status BOOLEAN DEFAULT false,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_time TIMESTAMP,
    CHECK (resolved_time IS NULL OR resolved_time >= created_time)
);

-- Create petitions table
CREATE TABLE IF NOT EXISTS petitions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_signature_count INTEGER NOT NULL,
    signature_count INTEGER DEFAULT 0,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP
);

-- Create petition activities table
CREATE TABLE IF NOT EXISTS petition_activities (
    id SERIAL PRIMARY KEY,
    petition_id INTEGER REFERENCES petitions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL DEFAULT 'SIGNATURE',
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signature_count INTEGER NOT NULL DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_petition_activities_petition_id 
    ON petition_activities(petition_id);

CREATE INDEX IF NOT EXISTS idx_petition_activities_date 
    ON petition_activities(activity_date);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_category_id ON proposals(category_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_policy_comments_user_id ON policy_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_comments_policy_id ON policy_comments(policy_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_petitions_creator_id ON petitions(creator_id);

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'categories', 'projects', 'transactions', 
    'proposals', 'policies', 'policy_comments', 
    'reports', 'petitions', 'petition_activities'
)
ORDER BY table_name;
