import ballerina/http;
import ballerina/io;

public function testApiKey() returns error? {
    string supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co";
    string testKey = "YOUR_NEW_SERVICE_ROLE_KEY_HERE";
    
    http:Client supabaseClient = check new (supabaseUrl);
    
    map<string> headers = {
        "Authorization": "Bearer " + testKey,
        "apikey": testKey,
        "Content-Type": "application/json"
    };
    
    // Test the API key by making a simple request
    http:Response|error response = supabaseClient->get("/rest/v1/categories?select=*&limit=1", headers);
    
    if response is http:Response {
        int statusCode = response.statusCode;
        string|error body = response.getTextPayload();
        
        io:println("Status Code: ", statusCode);
        if body is string {
            io:println("Response: ", body);
        }
        
        if statusCode == 200 {
            io:println("✅ API Key is VALID and working!");
        } else if statusCode == 401 {
            io:println("❌ API Key is INVALID or expired!");
        } else {
            io:println("⚠️  Unexpected response - check your configuration");
        }
    } else {
        io:println("❌ Error making request: ", response);
    }
}
