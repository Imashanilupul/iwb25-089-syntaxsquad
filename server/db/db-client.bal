import ballerinax/postgresql;
import ballerina/log;

# Database configuration
configurable string dbHost = "db.hhnxsixgjcdhvzuwbmzf.supabase.co";
configurable string dbName = "postgres";
configurable string dbUser = "postgres";
configurable string dbPassword = "SrilankaHackathon@2024";
configurable int dbPort = 5432;

# Global database client - initialized when needed
postgresql:Client? dbClient = ();

# Get database client instance (lazy initialization)
#
# + return - Database client or error
public function getDbClient() returns postgresql:Client|error {
    postgresql:Client? currentClient = dbClient;
    if currentClient is postgresql:Client {
        return currentClient;
    }
    
    postgresql:Client newClient = check new (
        host = dbHost,
        port = dbPort,
        database = dbName,
        username = dbUser,
        password = dbPassword,
        options = {
            ssl: {
                mode: "REQUIRE"
            }
        }
    );
    
    dbClient = newClient;
    log:printInfo("✅ Database client initialized successfully");
    return newClient;
}

# Test database connection
#
# + return - True if connection successful, false otherwise
public function testConnection() returns boolean {
    do {
        postgresql:Client dbConnection = check getDbClient();
        stream<record {}, error?> result = dbConnection->query(`SELECT 1`);
        _ = check result.next();
        check result.close();
        log:printInfo("✅ Database connection test successful");
        return true;
    } on fail error e {
        log:printError("❌ Database connection test failed", 'error = e);
        return false;
    }
}

# Close database connection
#
# + return - Error if closing fails
public function closeConnection() returns error? {
    postgresql:Client? currentClient = dbClient;
    if currentClient is postgresql:Client {
        error? closeResult = currentClient.close();
        if closeResult is error {
            log:printError("❌ Error closing database connection", 'error = closeResult);
            return closeResult;
        }
        dbClient = ();
        log:printInfo("✅ Database connection closed");
    }
}
