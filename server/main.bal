import ballerina/http;
import ballerina/log;
import ballerina/time;

# Configurable server settings
configurable int port = 8080;
configurable string supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co";
configurable string supabaseApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI2MDI0ODUsImV4cCI6MjAzODE3ODQ4NX0.wlwUeFUhTyGOjSl-1xrxFnpOWLYKnfEk5_A4HdSBN9c";
configurable string supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjYwMjQ4NSwiZXhwIjoyMDM4MTc4NDg1fQ.m7uHZHJ6yMgb_Dv6k2Fz_sQKlTz_HEW0uOmnJRqBIH4";

# HTTP listener for the API
listener http:Listener apiListener = new (port);

# Global HTTP client for Supabase API
http:Client supabaseClient = check new (supabaseUrl);

# Main API service
service /api on apiListener {
    
    # Health check endpoint
    #
    # + return - Health status message
    resource function get health() returns string {
        return "✅ Backend is running!";
    }
    
    # Server status endpoint
    #
    # + return - Server status message
    resource function get status() returns string {
        return "Server is healthy and HTTP-based database integration is ready";
    }
    
    # Database health check endpoint
    #
    # + return - Database health status
    resource function get db/health() returns json|error {
        return checkDatabaseHealth();
    }
    
    # Database setup endpoint
    #
    # + return - Setup instructions
    resource function post db/setup() returns json {
        return getDatabaseSetupInstructions();
    }
    
    # Check database tables endpoint
    #
    # + return - Table existence status
    resource function get db/tables() returns json|error {
        return checkTablesExist();
    }
    
    # Server information endpoint
    #
    # + return - Server information
    resource function get info() returns json {
        [int, decimal] currentTime = time:utcNow();
        return {
            "server": "Transparent Governance Platform Backend",
            "version": "1.0.0",
            "status": "Running",
            "database": {
                "type": "PostgreSQL",
                "provider": "Supabase",
                "connection": "HTTP REST API"
            },
            "endpoints": [
                "GET /api/health - Basic health check",
                "GET /api/status - Server status", 
                "GET /api/db/health - Database health check",
                "POST /api/db/setup - Database setup instructions",
                "GET /api/db/tables - Check if tables exist",
                "GET /api/info - Server information",
                "GET /api/users - List all users",
                "GET /api/categories - List all budget categories",
                "GET /api/projects - List all projects",
                "GET /api/proposals - List all proposals",
                "GET /api/policies - List all policies",
                "GET /api/reports - List all reports",
                "GET /api/petitions - List all petitions"
            ],
            "features": [
                "User Management",
                "Budget Tracking",
                "Project Management", 
                "Proposal Voting",
                "Policy Management",
                "Whistleblowing System",
                "Petition System"
            ],
            "note": "Using HTTP REST API for database operations",
            "timestamp": currentTime[0]
        };
    }

    # Data retrieval endpoints
    #
    # + return - User data or error
    resource function get users() returns json|error {
        return executeHttpQuery("/rest/v1/users");
    }

    # + return - Category data or error  
    resource function get categories() returns json|error {
        return executeHttpQuery("/rest/v1/categories");
    }

    # + return - Project data or error
    resource function get projects() returns json|error {
        return executeHttpQuery("/rest/v1/projects");
    }

    # + return - Proposal data or error
    resource function get proposals() returns json|error {
        return executeHttpQuery("/rest/v1/proposals");
    }

    # + return - Policy data or error
    resource function get policies() returns json|error {
        return executeHttpQuery("/rest/v1/policies");
    }

    # + return - Report data or error
    resource function get reports() returns json|error {
        return executeHttpQuery("/rest/v1/reports");
    }

    # + return - Petition data or error
    resource function get petitions() returns json|error {
        return executeHttpQuery("/rest/v1/petitions");
    }
}

# Get headers for HTTP requests
#
# + return - Headers map
function getHeaders() returns map<string> {
    return {
        "apikey": supabaseApiKey,
        "Authorization": "Bearer " + supabaseServiceRoleKey,
        "Content-Type": "application/json"
    };
}

# Check database health via HTTP
#
# + return - Health status as JSON or error
function checkDatabaseHealth() returns json|error {
    do {
        map<string> headers = getHeaders();
        
        [int, decimal] startTime = time:utcNow();
        http:Response response = check supabaseClient->get("/rest/v1/", headers);
        [int, decimal] endTime = time:utcNow();
        int latency = endTime[0] - startTime[0];
        
        boolean connected = response.statusCode == 200;
        [int, decimal] currentTime = time:utcNow();
        
        return {
            "database": {
                "connected": connected,
                "message": connected ? "Supabase REST API connection successful" : "Connection failed",
                "latency": latency,
                "method": "HTTP REST API",
                "config": {
                    "url": supabaseUrl,
                    "api": "REST v1"
                }
            },
            "timestamp": currentTime[0]
        };
    } on fail error e {
        return error("Database health check failed: " + e.message());
    }
}

# Check if database tables exist via HTTP
#
# + return - Table existence status as JSON or error
function checkTablesExist() returns json|error {
    do {
        map<string> headers = getHeaders();
        
        // Try to query the users table
        http:Response response = check supabaseClient->get("/rest/v1/users?limit=1", headers);
        boolean tablesExist = response.statusCode == 200;
        [int, decimal] currentTime = time:utcNow();
        
        return {
            "tablesExist": tablesExist,
            "message": tablesExist ? "Tables are accessible via REST API" : "Tables not found or not accessible",
            "method": "HTTP REST API",
            "statusCode": response.statusCode,
            "timestamp": currentTime[0]
        };
    } on fail error e {
        [int, decimal] currentTime = time:utcNow();
        return {
            "tablesExist": false,
            "message": "Failed to check tables: " + e.message(),
            "method": "HTTP REST API",
            "timestamp": currentTime[0]
        };
    }
}

# Database setup instructions
#
# + return - Setup instructions as JSON
function getDatabaseSetupInstructions() returns json {
    [int, decimal] currentTime = time:utcNow();
    return {
        "success": false,
        "message": "HTTP-based setup requires manual table creation",
        "instructions": [
            "1. Go to https://supabase.com/dashboard",
            "2. Navigate to your project: hhnxsixgjcdhvzuwbmzf",
            "3. Go to SQL Editor",
            "4. Run the SQL schema from db/schema.sql",
            "5. Tables will be created automatically"
        ],
        "schema_file": "db/schema.sql",
        "timestamp": currentTime[0]
    };
}

# Execute HTTP query to Supabase
#
# + endpoint - The REST endpoint to query
# + return - Query result as JSON or error
function executeHttpQuery(string endpoint) returns json|error {
    do {
        map<string> headers = getHeaders();
        
        http:Response response = check supabaseClient->get(endpoint, headers);
        json responseBody = check response.getJsonPayload();
        
        return {
            "success": true,
            "data": responseBody,
            "count": responseBody is json[] ? responseBody.length() : 0,
            "message": "Data retrieved successfully"
        };
    } on fail error e {
        return {
            "success": false,
            "message": "Failed to retrieve data: " + e.message(),
            "error": e.message()
        };
    }
}

# Initialize database connection at startup
#
# + return - Error if initialization fails
function initializeDatabase() returns error? {
    log:printInfo("🔄 Initializing database connection...");
    
    do {
        map<string> headers = getHeaders();
        
        http:Response response = check supabaseClient->get("/rest/v1/", headers);
        
        if response.statusCode == 200 {
            log:printInfo("✅ Supabase REST API connection successful");
            
            // Check if tables exist
            http:Response tableResponse = check supabaseClient->get("/rest/v1/users?limit=1", headers);
            if tableResponse.statusCode == 200 {
                log:printInfo("✅ Database tables are accessible");
            } else {
                log:printWarn("⚠️  Database tables may not exist. Please run setup via Supabase dashboard.");
            }
        } else {
            log:printWarn("⚠️  Supabase REST API connection failed");
        }
    } on fail error e {
        log:printError("❌ HTTP database connection failed", 'error = e);
        log:printWarn("⚠️  Server will start but database features may not work");
    }
    
    return;
}

# Application entry point
#
# + return - Error if application fails to start
public function main() returns error? {
    log:printInfo("🚀 Starting Transparent Governance Platform Backend...");
    
    // Initialize database connection at startup
    check initializeDatabase();
    
    log:printInfo("🌐 Server started on port " + port.toString());
    log:printInfo("📋 Available endpoints:");
    log:printInfo("  ➤ Health check: http://localhost:" + port.toString() + "/api/health");
    log:printInfo("  ➤ Server status: http://localhost:" + port.toString() + "/api/status");
    log:printInfo("  ➤ Database health: http://localhost:" + port.toString() + "/api/db/health");
    log:printInfo("  ➤ Server info: http://localhost:" + port.toString() + "/api/info");
    log:printInfo("🎉 Server is ready to accept requests!");
    log:printInfo("💡 Note: Using HTTP REST API for database operations");
    
    return;
}
