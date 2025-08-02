import ballerina/sql;
import ballerina/log;
import . from "./db-client.bal";

// Database setup function to create tables
public function setupDatabase() returns error? {
    log:printInfo("Setting up database tables...");
    
    // Read the schema file
    string schemaSQL = check readSchemaFile();
    
    // Split the SQL statements and execute them
    string[] statements = schemaSQL.split(";");
    
    foreach string statement in statements {
        string trimmedStatement = statement.trim();
        if (trimmedStatement.length() > 0) {
            log:printInfo("Executing: " + trimmedStatement.substring(0, 50) + "...");
            sql:ExecutionResult result = check dbClient->execute(trimmedStatement);
            log:printInfo("Statement executed successfully");
        }
    }
    
    log:printInfo("Database setup completed successfully");
    return;
}

// Function to read the schema file
function readSchemaFile() returns string {
    // For now, we'll return the schema as a string
    // In a production environment, you might want to read from a file
    return `
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
    `;
}

// Function to check if tables exist
public function checkTablesExist() returns boolean {
    sql:ParameterizedCallQuery sqlQuery = {
        sql: `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        )`,
        parameters: []
    };
    
    stream<record {}, sql:Error?> resultStream = dbClient->query(sqlQuery);
    record {|boolean exists;|}? result = check resultStream.next();
    
    return result?.exists ?: false;
}

// Function to drop all tables (for testing/reset)
public function dropAllTables() returns error? {
    log:printInfo("Dropping all tables...");
    
    string[] tables = [
        "petition_activities",
        "petitions", 
        "reports",
        "policy_comments",
        "policies",
        "proposals",
        "transactions",
        "projects",
        "categories",
        "users"
    ];
    
    foreach string table in tables {
        string dropSQL = `DROP TABLE IF EXISTS ${table} CASCADE`;
        sql:ExecutionResult result = check dbClient->execute(dropSQL);
        log:printInfo("Dropped table: " + table);
    }
    
    log:printInfo("All tables dropped successfully");
    return;
} 