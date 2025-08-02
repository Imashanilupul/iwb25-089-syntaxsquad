import ballerina/http;
import ballerina/log;

configurable int port = 8080;

listener http:Listener apiListener = new (port);

service /api on apiListener {
    resource function get health() returns string {
        return "✅ Backend is running!";
    }
    
    resource function get status() returns string {
        return "Server is healthy and ready for database integration";
    }
}

public function main() returns error? {
    log:printInfo("Starting Transparent Governance Platform Backend...");
    log:printInfo("Server started on port " + port.toString());
    log:printInfo("Health check available at: http://localhost:" + port.toString() + "/api/health");
    log:printInfo("Status check available at: http://localhost:" + port.toString() + "/api/status");
    
    return;
}