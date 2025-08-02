import ballerina/sql;
import ballerina/log;

// Database configuration
configurable string dbHost = "aws-0-ap-south-1.pooler.supabase.com";
configurable int dbPort = 6543;
configurable string dbName = "postgres";
configurable string dbUser = "postgres.hhnxsixgjcdhvzuwbmzf";
configurable string dbPassword = "Anjana12345.";

// Database connection pool configuration
configurable int maxOpenConnections = 10;
configurable int maxConnectionLifeTime = 3600;

// Database client
public client sql:Client dbClient = check new (
    host = dbHost,
    port = dbPort,
    user = dbUser,
    password = dbPassword,
    database = dbName,
    options = {
        maxOpenConnections: maxOpenConnections,
        maxConnectionLifeTime: maxConnectionLifeTime
    }
);

// Database initialization function
public function initDatabase() returns error? {
    log:printInfo("Initializing database connection...");
    
    // Test the connection
    sql:ExecutionResult result = check dbClient->execute(`SELECT 1 as test`);
    log:printInfo("Database connection successful");
    
    return;
}

// Database cleanup function
public function closeDatabase() returns error? {
    log:printInfo("Closing database connection...");
    check dbClient.close();
    log:printInfo("Database connection closed");
    
    return;
}
