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
        self.databaseService = databaseService;
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
    resource function get users() returns json|error {
        return self.databaseService.executeQuery("/rest/v1/users");
    }

    resource function get categories() returns json|error {
        return self.databaseService.executeQuery("/rest/v1/categories");
    }

    resource function get projects() returns json|error {
        return self.databaseService.executeQuery("/rest/v1/projects");
    }

    resource function get proposals() returns json|error {
        return self.databaseService.executeQuery("/rest/v1/proposals");
    }

    resource function get policies() returns json|error {
        return self.databaseService.executeQuery("/rest/v1/policies");
    }

    resource function get reports() returns json|error {
        return self.databaseService.executeQuery("/rest/v1/reports");
    }

    resource function get petitions() returns json|error {
        return self.databaseService.executeQuery("/rest/v1/petitions");
    }
}
