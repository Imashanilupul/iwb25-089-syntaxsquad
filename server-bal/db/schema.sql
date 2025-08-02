-- Transparent Governance Platform Database Schema
-- Complete setup script for Supabase
-- Run this ENTIRE script in Supabase SQL Editor

-- Users table with complete governance platform fields
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

-- Categories table with budget tracking
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    allocated_budget DECIMAL(15,2) NOT NULL,
    spent_budget DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table with complete governance tracking
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

-- Enhanced transactions table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL DEFAULT 'EXPENSE',
    description TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proposals table with voting system
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    description_in_details TEXT NOT NULL,
    active_status BOOLEAN DEFAULT true,
    expired_date TIMESTAMP NOT NULL,
    yes_votes INTEGER DEFAULT 0,
    no_votes INTEGER DEFAULT 0,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policies table with status tracking
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

-- Policy Comments table with enhanced reply system
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

-- Reports table with whistleblowing features
CREATE TABLE IF NOT EXISTS reports (
    report_id SERIAL PRIMARY KEY,
    report_title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    assigned_to VARCHAR(255),
    evidence_hash VARCHAR(255) NOT NULL,
    resolved_status BOOLEAN DEFAULT false,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_time TIMESTAMP
);

-- Petitions table with deadline tracking
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

-- Petition Activities table with detailed tracking
CREATE TABLE IF NOT EXISTS petition_activities (
    id SERIAL PRIMARY KEY,
    petition_id INTEGER REFERENCES petitions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL DEFAULT 'SIGNATURE',
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signature_count INTEGER NOT NULL DEFAULT 1
);

-- Create comprehensive indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nic ON users(nic);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(category_name);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_proposals_category_id ON proposals(category_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(active_status);
CREATE INDEX IF NOT EXISTS idx_policies_ministry ON policies(ministry);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policy_comments_user_id ON policy_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_comments_policy_id ON policy_comments(policy_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(resolved_status);
CREATE INDEX IF NOT EXISTS idx_petitions_creator_id ON petitions(creator_id);
CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);
CREATE INDEX IF NOT EXISTS idx_petition_activities_petition_id ON petition_activities(petition_id);
CREATE INDEX IF NOT EXISTS idx_petition_activities_date ON petition_activities(activity_date);

-- Insert sample data for testing
INSERT INTO categories (category_name, allocated_budget) VALUES 
('Infrastructure', 5000000.00),
('Education', 3000000.00),
('Healthcare', 2500000.00),
('Transportation', 2000000.00),
('Environment', 1500000.00),
('Technology', 1000000.00),
('Agriculture', 800000.00),
('Social Welfare', 600000.00)
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO users (user_name, email, nic, mobile_no) VALUES 
('Admin User', 'admin@gov.lk', '123456789V', '+94771234567'),
('John Doe', 'john.doe@example.com', '987654321V', '+94777654321'),
('Jane Smith', 'jane.smith@example.com', '456789123V', '+94771112233'),
('Minister Tech', 'minister.tech@gov.lk', '111222333V', '+94771000001'),
('Citizen One', 'citizen1@email.com', '444555666V', '+94772000001')
ON CONFLICT (email) DO NOTHING;

-- Create sample projects
INSERT INTO projects (project_name, category_id, allocated_budget, state, province, ministry, view_details, status) VALUES 
('Digital Infrastructure Development', 1, 1000000.00, 'Western Province', 'Colombo', 'Ministry of Technology', 'A comprehensive project to improve digital infrastructure across the Western Province', 'ACTIVE'),
('School Building Program', 2, 750000.00, 'Central Province', 'Kandy', 'Ministry of Education', 'Building new schools in rural areas to improve education access', 'PLANNED'),
('Hospital Modernization', 3, 500000.00, 'Southern Province', 'Galle', 'Ministry of Health', 'Upgrading medical equipment and facilities in regional hospitals', 'ACTIVE'),
('Road Development Project', 4, 300000.00, 'Northern Province', 'Jaffna', 'Ministry of Transport', 'Improving road connectivity in the Northern Province', 'PLANNED')
ON CONFLICT DO NOTHING;

-- Create sample proposals
INSERT INTO proposals (title, short_description, description_in_details, expired_date, category_id, created_by) VALUES 
('Improve Public Transportation', 'Proposal to enhance bus services', 'A comprehensive plan to improve public transportation system including new buses, better routes, and digital payment systems.', '2025-12-31 23:59:59', 4, 2),
('Green Energy Initiative', 'Promote renewable energy sources', 'Initiative to install solar panels on government buildings and promote wind energy projects across the country.', '2025-11-30 23:59:59', 5, 3),
('Free Wi-Fi in Public Places', 'Provide internet access in public areas', 'Proposal to install free Wi-Fi hotspots in parks, libraries, and other public spaces to improve digital accessibility.', '2025-10-31 23:59:59', 6, 4)
ON CONFLICT DO NOTHING;

-- Create sample policies
INSERT INTO policies (name, description, view_full_policy, ministry, status) VALUES 
('Digital Governance Policy', 'Policy for digital transformation of government services', 'Complete digital governance framework including online services, digital identity, and cybersecurity measures for all government departments.', 'Ministry of Technology', 'DRAFT'),
('Environmental Protection Act', 'Comprehensive environmental protection guidelines', 'New regulations for environmental protection including waste management, pollution control, and conservation efforts.', 'Ministry of Environment', 'ACTIVE'),
('Education Reform Policy', 'Modernization of education system', 'Policy framework for updating curriculum, teacher training, and integration of technology in education.', 'Ministry of Education', 'DRAFT')
ON CONFLICT DO NOTHING;

-- CRITICAL: Disable Row Level Security for REST API Access (Development Mode)
-- This enables our Ballerina backend to access the tables via Supabase REST API
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

-- Verify setup completion
SELECT 
    'SUCCESS: Transparent Governance Platform database setup completed! ' ||
    'Tables: ' || COUNT(*) || ' created with sample data and indexes. ' ||
    'Row Level Security disabled for development. Backend API access enabled.' AS setup_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'categories', 'projects', 'transactions', 'proposals', 'policies', 'policy_comments', 'reports', 'petitions', 'petition_activities');

-- Show created tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'categories', 'projects', 'transactions', 'proposals', 'policies', 'policy_comments', 'reports', 'petitions', 'petition_activities')
ORDER BY table_name; 