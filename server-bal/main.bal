import ballerina/http;
import ballerina/log;
import ballerina/time;

configurable int port = 8080;

// Supabase configuration
configurable string supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co";
configurable string supabaseApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI2MDI0ODUsImV4cCI6MjAzODE3ODQ4NX0.wlwUeFUhTyGOjSl-1xrxFnpOWLYKnfEk5_A4HdSBN9c";
configurable string supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjYwMjQ4NSwiZXhwIjoyMDM4MTc4NDg1fQ.m7uHZHJ6yMgb_Dv6k2Fz_sQKlTz_HEW0uOmnJRqBIH4";

listener http:Listener apiListener = new (port);

service /api on apiListener {
    # Health check endpoint
    resource function get health() returns string {
        return "✅ Backend is running!";
    }
    
    # Server status endpoint
    resource function get status() returns string {
        return "Server is healthy and HTTP-based database integration is ready";
    }
    
    # Database health check endpoint via HTTP
    resource function get db/health() returns json|error {
        do {
            http:Client httpClient = check new (supabaseUrl);
            
            map<string> headers = {
                "apikey": supabaseApiKey,
                "Authorization": "Bearer " + supabaseServiceRoleKey,
                "Content-Type": "application/json"
            };
            
            [int, decimal] startTime = time:utcNow();
            http:Response response = check httpClient->get("/rest/v1/", headers);
            [int, decimal] endTime = time:utcNow();
            int latency = endTime[0] - startTime[0];
            
            boolean connected = response.statusCode == 200;
            [int, decimal] currentTime = time:utcNow();
            
            json result = {
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
            return result;
        } on fail error e {
            return error("Database health check failed: " + e.message());
        }
    }
    
    # Database setup endpoint - provides setup instructions
    resource function post db/setup() returns json {
        [int, decimal] currentTime = time:utcNow();
        return {
            "success": false,
            "message": "HTTP-based setup requires manual table creation",
            "instructions": [
                "1. Go to https://supabase.com/dashboard",
                "2. Navigate to your project: hhnxsixgjcdhvzuwbmzf",
                "3. Go to SQL Editor",
                "4. Run the SQL schema from database_setup.sql",
                "5. Tables will be created automatically"
            ],
            "schema_file": "database_setup.sql",
            "timestamp": currentTime[0]
        };
    }
    
    # Check if database tables exist via HTTP
    resource function get db/tables() returns json|error {
        do {
            http:Client httpClient = check new (supabaseUrl);
            
            map<string> headers = {
                "apikey": supabaseApiKey,
                "Authorization": "Bearer " + supabaseServiceRoleKey,
                "Content-Type": "application/json"
            };
            
            // Try to query the users table
            http:Response response = check httpClient->get("/rest/v1/users?limit=1", headers);
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
    
    # Server information endpoint
    resource function get info() returns json {
        [int, decimal] currentTime = time:utcNow();
        return {
            "server": "Transparent Governance Platform Backend",
            "version": "0.2.0",
            "status": "Running",
            "database": {
                "type": "PostgreSQL",
                "provider": "Supabase",
                "connection": "HTTP REST API",
                "url": supabaseUrl
            },
            "endpoints": [
                "GET /api/health - Basic health check",
                "GET /api/status - Server status", 
                "GET /api/db/health - Database health check (HTTP)",
                "POST /api/db/setup - Database setup instructions",
                "GET /api/db/tables - Check if tables exist (HTTP)",
                "GET /api/info - Server information"
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
            "note": "Using HTTP REST API for database operations to avoid PostgreSQL driver compatibility issues",
            "timestamp": currentTime[0]
        };
    }
}

public function main() returns error? {
    log:printInfo("🚀 Starting Transparent Governance Platform Backend (HTTP Mode)...");
    
    // Test HTTP-based database connection at startup
    do {
        http:Client httpClient = check new (supabaseUrl);
        
        map<string> headers = {
            "apikey": supabaseApiKey,
            "Authorization": "Bearer " + supabaseServiceRoleKey,
            "Content-Type": "application/json"
        };
        
        http:Response response = check httpClient->get("/rest/v1/", headers);
        
        if response.statusCode == 200 {
            log:printInfo("✅ Supabase REST API connection successful");
            
            // Check if tables exist
            http:Response tableResponse = check httpClient->get("/rest/v1/users?limit=1", headers);
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
    
    log:printInfo("🌐 Server started on port " + port.toString());
    log:printInfo("📋 Available endpoints:");
    log:printInfo("  ➤ Health check: http://localhost:" + port.toString() + "/api/health");
    log:printInfo("  ➤ Server status: http://localhost:" + port.toString() + "/api/status");
    log:printInfo("  ➤ Database health (HTTP): http://localhost:" + port.toString() + "/api/db/health");
    log:printInfo("  ➤ Database setup: http://localhost:" + port.toString() + "/api/db/setup (POST)");
    log:printInfo("  ➤ Check tables (HTTP): http://localhost:" + port.toString() + "/api/db/tables");
    log:printInfo("  ➤ Server info: http://localhost:" + port.toString() + "/api/info");
    log:printInfo("🎉 Server is ready to accept requests!");
    log:printInfo("💡 Note: Using HTTP REST API for database operations");
    
    return;
}
