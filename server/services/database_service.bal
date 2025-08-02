import ballerina/http;
import ballerina/log;
import ballerina/time;

# Database service for HTTP-based Supabase operations
public class DatabaseService {
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

    # Check database health via HTTP
    #
    # + return - Health status as JSON or error
    public function checkHealth() returns json|error {
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
    public function checkTablesExist() returns json|error {
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

    # Execute HTTP query to Supabase
    #
    # + endpoint - The REST endpoint to query
    # + return - Query result as JSON or error
    public function executeQuery(string endpoint) returns json|error {
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

    # Initialize database connection
    #
    # + return - Error if initialization fails
    public function initialize() returns error? {
        log:printInfo("🔄 Initializing database connection...");
        
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
            log:printWarn("⚠️  Server will start but database features may not work");
        }
        
        return;
    }

    # Get setup instructions for database
    #
    # + return - Setup instructions as JSON
    public function getSetupInstructions() returns json {
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
