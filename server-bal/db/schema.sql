-- Transparent Governance Platform Database Schema
-- This file contains all the SQL statements to create the database tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nic VARCHAR(20) UNIQUE NOT NULL,
    mobile_no VARCHAR(15) NOT NULL,
    evm VARCHAR(255)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    allocated_budget DECIMAL(15,2) NOT NULL,
    spent_budget DECIMAL(15,2) DEFAULT 0
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(category_id),
    allocated_budget DECIMAL(15,2) NOT NULL,
    spent_budget DECIMAL(15,2) DEFAULT 0,
    state VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    ministry VARCHAR(255) NOT NULL,
    view_details TEXT
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(category_id),
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    spent DECIMAL(15,2) NOT NULL,
    allocated DECIMAL(15,2) NOT NULL
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    description_in_details TEXT NOT NULL,
    active_status BOOLEAN DEFAULT true,
    expired_date TIMESTAMP NOT NULL,
    yes_votes INTEGER DEFAULT 0,
    no_votes INTEGER DEFAULT 0,
    category_id INTEGER REFERENCES categories(category_id)
);

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    view_full_policy TEXT NOT NULL,
    ministry VARCHAR(255) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policy Comments table
CREATE TABLE IF NOT EXISTS policy_comments (
    comment_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    policy_id INTEGER REFERENCES policies(id),
    comment TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    reply_id INTEGER REFERENCES policy_comments(comment_id),
    reply_comment TEXT
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    report_id SERIAL PRIMARY KEY,
    report_title VARCHAR(255) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority VARCHAR(50) NOT NULL,
    assigned_to VARCHAR(255) NOT NULL,
    evidence_hash VARCHAR(255) NOT NULL,
    resolved_status BOOLEAN DEFAULT false,
    user_id INTEGER REFERENCES users(id)
);

-- Petitions table
CREATE TABLE IF NOT EXISTS petitions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_signature_count INTEGER NOT NULL,
    signature_count INTEGER DEFAULT 0,
    creator_id INTEGER REFERENCES users(id)
);

-- Petition Activities table
CREATE TABLE IF NOT EXISTS petition_activities (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    count INTEGER NOT NULL,
    petition_id INTEGER REFERENCES petitions(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nic ON users(nic);
CREATE INDEX IF NOT EXISTS idx_petitions_creator ON petitions(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_proposals_category ON proposals(category_id);
CREATE INDEX IF NOT EXISTS idx_policy_comments_policy ON policy_comments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_comments_user ON policy_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_petition_activities_petition ON petition_activities(petition_id); 