import ballerina/http;
import ballerina/time;

# API service providing various endpoints for the governance platform
public service class ApiService {
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
    resource function get health() returns string {
        return "✅ Backend is running!";
    }
    
    # Server status endpoint
    #
    # + return - Server status message
    resource function get status() returns string {
        return "Server is healthy and HTTP-based database integration is ready";
    }
    
    # Database health check endpoint via HTTP
    #
    # + return - Database health status
    resource function get db/health() returns json|error {
        return self.checkDatabaseHealth();
    }
    
    # Database setup endpoint - provides setup instructions
    #
    # + return - Setup instructions
    resource function post db/setup() returns json {
        return self.getDatabaseSetupInstructions();
    }
    
    # Check if database tables exist via HTTP
    #
    # + return - Table existence status
    resource function get db/tables() returns json|error {
        return self.checkTablesExist();
    }
    
    # Server information endpoint
    #
    # + return - Comprehensive server information
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
    resource function get users() returns json|error {
        return self.executeHttpQuery("/rest/v1/users");
    }

    resource function get categories() returns json|error {
        return self.executeHttpQuery("/rest/v1/categories");
    }

    resource function get projects() returns json|error {
        return self.executeHttpQuery("/rest/v1/projects");
    }

    resource function get proposals() returns json|error {
        return self.executeHttpQuery("/rest/v1/proposals");
    }

    resource function get policies() returns json|error {
        return self.executeHttpQuery("/rest/v1/policies");
    }

    resource function get reports() returns json|error {
        return self.executeHttpQuery("/rest/v1/reports");
    }

    resource function get petitions() returns json|error {
        return self.executeHttpQuery("/rest/v1/petitions");
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
                "4. Use the Ballerina schema functions from db/schema.bal",
                "5. Tables will be created automatically"
            ],
            "schema_file": "db/schema.bal",
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

    # Initialize database connection
    #
    # + return - Error if initialization fails
    public function initialize() returns error? {
        do {
            map<string> headers = self.getHeaders();
            
            http:Response response = check self.httpClient->get("/rest/v1/", headers);
            
            if response.statusCode == 200 {
                // Check if tables exist
                http:Response tableResponse = check self.httpClient->get("/rest/v1/users?limit=1", headers);
                if tableResponse.statusCode == 200 {
                    return;
                } else {
                    return error("Database tables may not exist");
                }
            } else {
                return error("Supabase REST API connection failed");
            }
        } on fail error e {
            return error("HTTP database connection failed: " + e.message());
        }
    }
}
