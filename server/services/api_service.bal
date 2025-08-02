import ballerina/http;
import ballerina/time;
import ballerina/log;

# API service providing various endpoints for the governance platform
public class ApiService {
    private final string supabaseUrl;
    private final string apiKey;
    private final string serviceRoleKey;
    private final http:Client httpClient;

    public function init(string supabaseUrl, string apiKey, string serviceRoleKey) returns error? {
        self.supabaseUrl = supabaseUrl;
        self.apiKey = apiKey;
        self.serviceRoleKey = serviceRoleKey;
        self.httpClient = check new (supabaseUrl);
    }

    # Health check endpoint
    #
    # + return - Simple health check response
    public function getHealth() returns string {
        return "✅ Backend is running!";
    }
    
    # Server status endpoint
    #
    # + return - Server status message
    public function getStatus() returns string {
        return "Server is healthy and HTTP-based database integration is ready";
    }
    
    # Database health check endpoint via HTTP
    #
    # + return - Database health status
    public function getDbHealth() returns json|error {
        return self.checkDatabaseHealth();
    }
    
    # Database setup endpoint - provides setup instructions
    #
    # + return - Setup instructions
    public function getDbSetup() returns json {
        return self.getDatabaseSetupInstructions();
    }
    
    # Check if database tables exist via HTTP
    #
    # + return - Table existence status
    public function getDbTables() returns json|error {
        return self.checkTablesExist();
    }
    
    # Server information endpoint
    #
    # + return - Comprehensive server information
    public function getInfo() returns json {
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
                "GET /api/db/health - Database health check (HTTP)",
                "POST /api/db/setup - Database setup instructions",
                "GET /api/db/tables - Check if tables exist (HTTP)",
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
            "note": "Using HTTP REST API for database operations to avoid PostgreSQL driver compatibility issues",
            "timestamp": currentTime[0]
        };
    }

    # Generic data retrieval endpoints using HTTP
    #
    # + return - User data from database
    public function getUsers() returns json|error {
        return self.executeHttpQuery("/rest/v1/users");
    }

    # Get categories data
    #
    # + return - Category data from database
    public function getCategories() returns json|error {
        return self.executeHttpQuery("/rest/v1/categories");
    }

    # Get projects data
    #
    # + return - Project data from database
    public function getProjects() returns json|error {
        return self.executeHttpQuery("/rest/v1/projects");
    }

    # Get proposals data
    #
    # + return - Proposal data from database
    public function getProposals() returns json|error {
        return self.executeHttpQuery("/rest/v1/proposals");
    }

    # Get policies data
    #
    # + return - Policy data from database
    public function getPolicies() returns json|error {
        return self.executeHttpQuery("/rest/v1/policies");
    }

    # Get reports data
    #
    # + return - Report data from database
    public function getReports() returns json|error {
        return self.executeHttpQuery("/rest/v1/reports");
    }

    # Get petitions data
    #
    # + return - Petition data from database
    public function getPetitions() returns json|error {
        return self.executeHttpQuery("/rest/v1/petitions");
    }

    # Initialize the service
    #
    # + return - Error if initialization fails
    public function initialize() returns error? {
        log:printInfo("🔄 Initializing API service...");
        
        do {
            map<string> headers = self.getHeaders();
            
            http:Response response = check self.httpClient->get("/rest/v1/", headers);
            
            if response.statusCode == 200 {
                log:printInfo("✅ Supabase REST API connection successful");
                
                // Check if tables exist
                http:Response tableResponse = check self.httpClient->get("/rest/v1/users?limit=1", headers);
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
            log:printWarn("⚠️  Service will start but database features may not work");
        }
        
        return;
    }

    # Check database health via HTTP
    #
    # + return - Health status as JSON or error
    private function checkDatabaseHealth() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            
            [int, decimal] startTime = time:utcNow();
            http:Response response = check self.httpClient->get("/rest/v1/", headers);
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
                        "url": self.supabaseUrl,
                        "api": "REST v1"
                    }
                },
                "timestamp": currentTime[0]
            };
        } on fail error e {
            return error("Database health check failed: " + e.message());
        }
    }

    # Check if database tables exist
    #
    # + return - Table existence status as JSON or error
    private function checkTablesExist() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            
            // Try to query the users table
            http:Response response = check self.httpClient->get("/rest/v1/users?limit=1", headers);
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

    # Get setup instructions for database
    #
    # + return - Setup instructions as JSON
    private function getDatabaseSetupInstructions() returns json {
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
    private function executeHttpQuery(string endpoint) returns json|error {
        do {
            map<string> headers = self.getHeaders();
            
            http:Response response = check self.httpClient->get(endpoint, headers);
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

    # Get headers for HTTP requests
    #
    # + return - Headers map
    private function getHeaders() returns map<string> {
        return {
            "apikey": self.apiKey,
            "Authorization": "Bearer " + self.serviceRoleKey,
            "Content-Type": "application/json"
        };
    }
}
