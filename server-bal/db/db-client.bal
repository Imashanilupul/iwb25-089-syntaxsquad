import ballerinax/postgresql;
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

// Database client using PostgreSQL driver
public postgresql:Client dbClient = check new (
    host = dbHost,
    port = dbPort,
    username = dbUser,
    password = dbPassword,
    database = dbName,
    options = {
        connectTimeout: 20,
        socketTimeout: 30
    }
);

// Database initialization function
public function initDatabase() returns error? {
    log:printInfo("Initializing database connection...");
    
    // Test the connection
    _ = check dbClient->execute(`SELECT 1 as test`);
    log:printInfo("Database connection successful");
    
    return;
}

// Database health check function
public function checkDatabaseHealth() returns record {|boolean connected; string message;|} {
    do {
        _ = check dbClient->execute(`SELECT 1 as health_check`);
        return {connected: true, message: "Database connection is healthy"};
    } on fail error e {
        log:printError("Database health check failed", 'error = e);
        return {connected: false, message: "Database connection failed: " + e.message()};
    }
}

// Database cleanup function
public function closeDatabase() returns error? {
    log:printInfo("Closing database connection...");
    check dbClient.close();
    log:printInfo("Database connection closed");
    
    return;
}
