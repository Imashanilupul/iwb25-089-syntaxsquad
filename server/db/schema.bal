import ballerina/sql;
import ballerinax/postgresql;
import ballerina/log;

# Setup all database tables for the governance platform
#
# + dbClient - Database client connection
# + return - Error if setup fails
public function setupTables(postgresql:Client dbClient) returns error? {
    log:printInfo("Setting up database tables...");
    
    // Create tables in dependency order
    check createUsersTable(dbClient);
    check createCategoriesTable(dbClient);
    check createProjectsTable(dbClient);
    check createTransactionsTable(dbClient);
    check createProposalsTable(dbClient);
    check createPoliciesTable(dbClient);
    check createPolicyCommentsTable(dbClient);
    check createReportsTable(dbClient);
    check createPetitionsTable(dbClient);
    check createPetitionActivitiesTable(dbClient);
    
    log:printInfo("All database tables created successfully");
}

# Check if core tables exist in the database
#
# + dbClient - Database client connection
# + return - True if all core tables exist, false otherwise, or error
public function tablesExist(postgresql:Client dbClient) returns boolean|error {
    string[] requiredTables = ["users", "categories", "projects", "transactions", 
                               "proposals", "policies", "policy_comments", 
                               "reports", "petitions", "petition_activities"];
    
    foreach string tableName in requiredTables {
        stream<record {|boolean exists;|}, sql:Error?> resultStream = dbClient->query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = ${tableName}
            )
        `);
        
        record {|record {|boolean exists;|} value;|}? result = check resultStream.next();
        check resultStream.close();
        
        boolean tableExists = result?.value?.exists ?: false;
        if (!tableExists) {
            return false; // Return false if any required table is missing
        }
    }
    
    return true; // All tables exist
}

# Create users table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createUsersTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            user_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            nic VARCHAR(20) UNIQUE NOT NULL,
            mobile_no VARCHAR(15) NOT NULL,
            evm VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    log:printInfo("Users table ready");
}

# Create categories table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createCategoriesTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS categories (
            category_id SERIAL PRIMARY KEY,
            category_name VARCHAR(255) NOT NULL UNIQUE,
            allocated_budget DECIMAL(15,2) NOT NULL CHECK (allocated_budget >= 0),
            spent_budget DECIMAL(15,2) DEFAULT 0 CHECK (spent_budget >= 0 AND spent_budget <= allocated_budget),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    log:printInfo("Categories table ready");
}

# Create projects table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createProjectsTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
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
        )
    `);
    log:printInfo("Projects table ready");
}

# Create transactions table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createTransactionsTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
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
        )
    `);
    log:printInfo("Transactions table ready");
}

# Create proposals table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createProposalsTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
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
        )
    `);
    log:printInfo("Proposals table ready");
}

# Create policies table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createPoliciesTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
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
        )
    `);
    log:printInfo("Policies table ready");
}

# Create policy comments table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createPolicyCommentsTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
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
        )
    `);
    log:printInfo("Policy comments table ready");
}

# Create reports table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createReportsTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS reports (
            report_id SERIAL PRIMARY KEY,
            report_title VARCHAR(255) NOT NULL,
            description TEXT,
            priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM' 
                CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
            assigned_to VARCHAR(255),
            evidence_hash VARCHAR(255) NOT NULL,
            wallet_address VARCHAR(255),
            resolved_status BOOLEAN DEFAULT false,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_time TIMESTAMP,
            CHECK (resolved_time IS NULL OR resolved_time >= created_time)
        )
    `);
    log:printInfo("Reports table ready");
}

# Create petitions table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createPetitionsTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
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
        )
    `);
    log:printInfo("Petitions table ready");
}

# Create petition activities table
#
# + dbClient - Database client connection
# + return - Error if table creation fails
function createPetitionActivitiesTable(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS petition_activities (
            id SERIAL PRIMARY KEY,
            petition_id INTEGER REFERENCES petitions(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            activity_type VARCHAR(50) NOT NULL DEFAULT 'SIGNATURE',
            activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            signature_count INTEGER NOT NULL DEFAULT 1
        )
    `);
    
    // Create indexes for better performance
    _ = check dbClient->execute(`
        CREATE INDEX IF NOT EXISTS idx_petition_activities_petition_id 
        ON petition_activities(petition_id)
    `);
    
    _ = check dbClient->execute(`
        CREATE INDEX IF NOT EXISTS idx_petition_activities_date 
        ON petition_activities(activity_date)
    `);
    
    log:printInfo("Petition activities table and indexes ready");
}
