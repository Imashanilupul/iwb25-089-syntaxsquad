import ballerina/http;
import ballerina/log;

# Database client for Supabase HTTP API
public class DatabaseClient {
    private http:Client supabaseClient;
    private string serviceRoleKey;
    private string restEndpoint;

    # Initialize database client
    #
    # + url - Supabase URL
    # + serviceRoleKey - Service role API key
    # + restEndpoint - REST API endpoint
    # + return - Error if initialization fails
    public function init(string url, string serviceRoleKey, string restEndpoint) returns error? {
        self.serviceRoleKey = serviceRoleKey;
        self.restEndpoint = restEndpoint;
        self.supabaseClient = check new (url);
        log:printInfo("✅ Database client initialized");
    }

    # Get headers for HTTP requests
    #
    # + return - Headers map
    public function getHeaders() returns map<string> {
        return {
            "apikey": self.serviceRoleKey,
            "Authorization": "Bearer " + self.serviceRoleKey,
            "Content-Type": "application/json"
        };
    }

    # Check database health
    #
    # + return - Health status as JSON or error
    public function checkHealth() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            
            http:Response response = check self.supabaseClient->get(self.restEndpoint + "/", headers);
            boolean connected = response.statusCode == 200;
            
            return {
                "database": {
                    "connected": connected,
                    "message": connected ? "Database connection successful" : "Connection failed",
                    "method": "HTTP REST API"
                }
            };
        } on fail error e {
            return error("Database health check failed: " + e.message());
        }
    }

    # Execute a GET query
    #
    # + endpoint - API endpoint to query
    # + return - Query result as JSON or error
    public function get(string endpoint) returns json|error {
        do {
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get(self.restEndpoint + endpoint, headers);
            
            if response.statusCode == 200 {
                json responseBody = check response.getJsonPayload();
                return responseBody;
            } else {
                json errorBody = check response.getJsonPayload();
                return error("Database error: " + errorBody.toString());
            }
        } on fail error e {
            return error("GET request failed: " + e.message());
        }
    }

    # Execute a POST query
    #
    # + endpoint - API endpoint to post to
    # + payload - Data to post
    # + return - Response as JSON or error
    public function post(string endpoint, json payload) returns json|error {
        do {
            map<string> headers = self.getHeaders();
            headers["Prefer"] = "return=representation";
            
            http:Response response = check self.supabaseClient->post(self.restEndpoint + endpoint, payload, headers);
            
            if response.statusCode == 201 {
                json responseBody = check response.getJsonPayload();
                return responseBody;
            } else {
                json errorBody = check response.getJsonPayload();
                return error("Database error: " + errorBody.toString());
            }
        } on fail error e {
            return error("POST request failed: " + e.message());
        }
    }

    # Execute a PUT/PATCH query
    #
    # + endpoint - API endpoint to update
    # + payload - Data to update
    # + return - Response as JSON or error
    public function patch(string endpoint, json payload) returns json|error {
        do {
            map<string> headers = self.getHeaders();
            headers["Prefer"] = "return=representation";
            
            http:Response response = check self.supabaseClient->patch(self.restEndpoint + endpoint, payload, headers);
            
            if response.statusCode == 200 {
                json responseBody = check response.getJsonPayload();
                return responseBody;
            } else {
                json errorBody = check response.getJsonPayload();
                return error("Database error: " + errorBody.toString());
            }
        } on fail error e {
            return error("PATCH request failed: " + e.message());
        }
    }

    # Execute a DELETE query
    #
    # + endpoint - API endpoint to delete from
    # + return - Response as JSON or error
    public function delete(string endpoint) returns json|error {
        do {
            map<string> headers = self.getHeaders();
            
            http:Response response = check self.supabaseClient->delete(self.restEndpoint + endpoint, headers);
            
            if response.statusCode == 204 {
                return {"success": true, "message": "Resource deleted successfully"};
            } else if response.statusCode == 404 {
                return error("Resource not found");
            } else {
                json errorBody = check response.getJsonPayload();
                return error("Database error: " + errorBody.toString());
            }
        } on fail error e {
            return error("DELETE request failed: " + e.message());
        }
    }

    # Check if tables exist
    #
    # + return - Table existence status
    public function checkTablesExist() returns json|error {
        do {
            json|error result = self.get("/users?limit=1");
            boolean tablesExist = result !is error;
            
            return {
                "tablesExist": tablesExist,
                "message": tablesExist ? "Tables are accessible" : "Tables not found or not accessible"
            };
        } on fail error e {
            return {
                "tablesExist": false,
                "message": "Failed to check tables: " + e.message()
            };
        }
    }
}
