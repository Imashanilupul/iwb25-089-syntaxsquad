// Database configuration types and client management
// Following Ballerina best practices for modular design

import ballerina/sql;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;
import ballerina/log;

# Database configuration record
# 
# + host - Database host address
# + port - Database port number  
# + name - Database name
# + username - Database username
# + password - Database password
public type DatabaseConfig record {|
    string host;
    int port;
    string name;
    string username;
    string password;
|};

# Database health status
#
# + connected - Whether database is connected
# + message - Status message
# + latency - Connection latency in milliseconds
public type HealthStatus record {|
    boolean connected;
    string message;
    int latency?;
|};

# Initialize database client with configuration
#
# + config - Database configuration
# + return - PostgreSQL client or error
public function initClient(DatabaseConfig config) returns postgresql:Client|error {
    log:printInfo("Initializing database connection...", host = config.host, port = config.port);
    
    postgresql:Client dbClient = check new (
        host = config.host,
        port = config.port,
        username = config.username,
        password = config.password,
        database = config.name
    );
    
    log:printInfo("Database client initialized successfully");
    return dbClient;
}

# Test database connection health
#
# + dbClient - Database client
# + return - Health status or error  
public function checkHealth(postgresql:Client dbClient) returns HealthStatus|error {
    stream<record{}, sql:Error?> resultStream = dbClient->query(`SELECT 1 as health_check`);
    record{}? result = check resultStream.next();
    check resultStream.close();
    
    if result is record{} {
        return {
            connected: true,
            message: "Database connection is healthy",
            latency: 0 // Simplified for now
        };
    } else {
        return {
            connected: false,
            message: "Database health check failed - no response"
        };
    }
}

# Close database client connection
#
# + dbClient - Database client to close
# + return - Error if closing fails
public function closeClient(postgresql:Client dbClient) returns error? {
    log:printInfo("Closing database connection...");
    check dbClient.close();
    log:printInfo("Database connection closed successfully");
}
