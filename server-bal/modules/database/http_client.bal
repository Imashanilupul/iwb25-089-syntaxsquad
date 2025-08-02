import ballerina/http;
import ballerina/log;
import ballerina/time;

# Supabase REST API client configuration
public type SupabaseConfig record {|
    string url;
    string apiKey;
    string serviceRoleKey;
|};

# Health status for HTTP-based database client
public type HttpHealthStatus record {|
    boolean connected;
    string message;
    int? latency;
|};

# Initialize HTTP client for Supabase REST API
public function initHttpClient(SupabaseConfig config) returns http:Client|error {
    http:Client httpClient = check new (config.url);
    log:printInfo("HTTP client initialized for Supabase REST API", url = config.url);
    return httpClient;
}

# Check database health via HTTP
public function checkHttpHealth(http:Client httpClient, SupabaseConfig config) returns HttpHealthStatus|error {
    int startTime = checkpanic time:utcNow()[0];
    
    map<string> headers = {
        "apikey": config.apiKey,
        "Authorization": "Bearer " + config.serviceRoleKey,
        "Content-Type": "application/json"
    };
    
    do {
        http:Response response = check httpClient->get("/rest/v1/", headers);
        int endTime = checkpanic time:utcNow()[0];
        int latency = endTime - startTime;
        
        if response.statusCode == 200 {
            return {
                connected: true,
                message: "Supabase REST API connection successful",
                latency: latency
            };
        } else {
            return {
                connected: false,
                message: "Supabase REST API connection failed: " + response.statusCode.toString(),
                latency: latency
            };
        }
    } on fail error e {
        return {
            connected: false,
            message: "HTTP connection failed: " + e.message(),
            latency: ()
        };
    }
}

# Check if tables exist via HTTP
public function checkTablesExistHttp(http:Client httpClient, SupabaseConfig config) returns boolean|error {
    map<string> headers = {
        "apikey": config.apiKey,
        "Authorization": "Bearer " + config.serviceRoleKey,
        "Content-Type": "application/json"
    };
    
    do {
        // Try to query the users table
        http:Response response = check httpClient->get("/rest/v1/users?limit=1", headers);
        return response.statusCode == 200;
    } on fail error e {
        // If table doesn't exist, we'll get a 404 or similar error
        return false;
    }
}

# Create tables via SQL execution (if Supabase supports it)
public function setupTablesHttp(http:Client httpClient, SupabaseConfig config) returns error? {
    map<string> headers = {
        "apikey": config.apiKey,
        "Authorization": "Bearer " + config.serviceRoleKey,
        "Content-Type": "application/json"
    };
    
    // Note: This is a simplified approach. In production, you would use Supabase's
    // SQL editor or migrations feature to set up tables
    log:printInfo("⚠️  HTTP-based table setup requires manual schema creation in Supabase dashboard");
    log:printInfo("📋 Please create tables using the provided SQL schema in the Supabase dashboard");
    
    return;
}
