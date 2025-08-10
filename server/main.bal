import server_bal.categories;
import server_bal.policy;

import ballerina/http;
import ballerina/jwt;
import ballerina/log;
import ballerina/time;

# Environment variables configuration
configurable int port = ?;
configurable int petitionPort = ?;
configurable string supabaseUrl = ?;
configurable string supabaseServiceRoleKey = ?;

# HTTP listener for the API
listener http:Listener apiListener = new (port);

# web3 service URL
http:Client web3Service = check new ("http://localhost:3001");

# Global HTTP client for Supabase API
http:Client supabaseClient = check new (supabaseUrl);

categories:CategoriesService categoriesService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
policy:PoliciesService policiesService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);

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

    # Server information endpoint
    #
    # + return - Server information
    resource function get info() returns json {
        [int, decimal] currentTime = time:utcNow();
        return {
            "server": "Transparent Governance Platform Backend",
            "version": "2.0.0",
            "status": "Running",
            "environment": "Configured from environment variables",
            "database": {
                "type": "PostgreSQL",
                "provider": "Supabase",
                "connection": "HTTP REST API"
            },
            "endpoints": [
                "GET /api/health - Basic health check",
                "GET /api/status - Server status",
                "GET /api/db/health - Database health check",
                "GET /api/info - Server information",
                "GET /api/categories - List all budget categories",
                "POST /api/categories - Create a new category",
                "GET /api/categories/{id} - Get category by ID",
                "PUT /api/categories/{id} - Update category by ID",
                "DELETE /api/categories/{id} - Delete category by ID",
                "GET /api/policies - List all policies",
                "POST /api/policies - Create a new policy",
                "GET /api/policies/{id} - Get policy by ID",
                "PUT /api/policies/{id} - Update policy by ID",
                "DELETE /api/policies/{id} - Delete policy by ID",
                "GET /api/policies/status/{status} - Get policies by status",
                "GET /api/policies/ministry/{ministry} - Get policies by ministry"
            ],
            "features": [
                "Environment-based configuration",
                "Modular architecture",
                "Category management",
                "Policy management",
                "Database health monitoring"
            ],
            "timestamp": currentTime[0]
        };
    }

    # Get all categories
    #
    # + return - Categories list or error
    resource function get categories() returns json|error {
        log:printInfo("Get all categories endpoint called");
        return categoriesService.getAllCategories();
    }

    # Get category by ID
    #
    # + categoryId - Category ID to retrieve
    # + return - Category data or error
    resource function get categories/[int categoryId]() returns json|error {
        log:printInfo("Get category by ID endpoint called for ID: " + categoryId.toString());
        return categoriesService.getCategoryById(categoryId);
    }

    # Create a new category
    #
    # + request - HTTP request containing category data
    # + return - Created category data or error
    resource function post categories(http:Request request) returns json|error {
        log:printInfo("Create category endpoint called");

        json payload = check request.getJsonPayload();

        // Validate required fields
        string categoryName = check payload.categoryName.ensureType(string);
        decimal allocatedBudget = check payload.allocatedBudget.ensureType(decimal);
        decimal spentBudget = payload.spentBudget is () ? 0d : check payload.spentBudget.ensureType(decimal);

        // Validate input
        if categoryName.trim().length() == 0 {
            return {
                "success": false,
                "message": "Category name cannot be empty",
                "timestamp": time:utcNow()[0]
            };
        }

        if allocatedBudget < 0d {
            return {
                "success": false,
                "message": "Allocated budget cannot be negative",
                "timestamp": time:utcNow()[0]
            };
        }

        if spentBudget < 0d {
            return {
                "success": false,
                "message": "Spent budget cannot be negative",
                "timestamp": time:utcNow()[0]
            };
        }

        return categoriesService.createCategory(categoryName, allocatedBudget, spentBudget);
    }

    # Update category by ID
    #
    # + request - HTTP request containing updated category data
    # + categoryId - Category ID to update
    # + return - Updated category data or error
    resource function put categories/[int categoryId](http:Request request) returns json|error {
        log:printInfo("Update category endpoint called for ID: " + categoryId.toString());

        json payload = check request.getJsonPayload();
        return categoriesService.updateCategory(categoryId, payload);
    }

    # Delete category by ID
    #
    # + categoryId - Category ID to delete
    # + return - Success message or error
    resource function delete categories/[int categoryId]() returns json|error {
        log:printInfo("Delete category endpoint called for ID: " + categoryId.toString());
        return categoriesService.deleteCategory(categoryId);
    }

    # Get all policies
    #
    # + return - Policies list or error
    resource function get policies() returns json|error {
        log:printInfo("Get all policies endpoint called");
        return policiesService.getAllPolicies();
    }

    # Get policy by ID
    #
    # + policyId - Policy ID to retrieve
    # + return - Policy data or error
    resource function get policies/[int policyId]() returns json|error {
        log:printInfo("Get policy by ID endpoint called for ID: " + policyId.toString());
        return policiesService.getPolicyById(policyId);
    }

    # Create a new policy
    #
    # + request - HTTP request containing policy data
    # + return - Created policy data or error
    resource function post policies(http:Request request) returns json|error {
        log:printInfo("Create policy endpoint called");

        json payload = check request.getJsonPayload();

        // Extract required fields
        string name = check payload.name;
        string description = check payload.description;
        string viewFullPolicy = check payload.view_full_policy;
        string ministry = check payload.ministry;

        // Extract optional fields
        string status = payload.status is string ? check payload.status : "DRAFT";
        string? effectiveDate = payload.effective_date is string ? check payload.effective_date : ();

        return policiesService.createPolicy(name, description, viewFullPolicy, ministry, status, effectiveDate);
    }

    # Update policy by ID
    #
    # + request - HTTP request containing updated policy data
    # + policyId - Policy ID to update
    # + return - Updated policy data or error
    resource function put policies/[int policyId](http:Request request) returns json|error {
        log:printInfo("Update policy endpoint called for ID: " + policyId.toString());

        json payload = check request.getJsonPayload();
        return policiesService.updatePolicy(policyId, payload);
    }

    # Delete policy by ID
    #
    # + policyId - Policy ID to delete
    # + return - Success message or error
    resource function delete policies/[int policyId]() returns json|error {
        log:printInfo("Delete policy endpoint called for ID: " + policyId.toString());
        return policiesService.deletePolicy(policyId);
    }

    # Get policies by status
    #
    # + status - Policy status to filter by
    # + return - Filtered policies list or error
    resource function get policies/status/[string status]() returns json|error {
        log:printInfo("Get policies by status endpoint called for status: " + status);
        return policiesService.getPoliciesByStatus(status);
    }

    # Get policies by ministry
    #
    # + ministry - Ministry name to filter by
    # + return - Filtered policies list or error
    resource function get policies/ministry/[string ministry]() returns json|error {
        log:printInfo("Get policies by ministry endpoint called for ministry: " + ministry);
        return policiesService.getPoliciesByMinistry(ministry);
    }
}

listener http:Listener newListener = new (petitionPort);

service /petitions on newListener {

    resource function post create(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload();
        json response = check web3Service->post("/create-petition", payload);
        check caller->respond(response);
    }

    resource function post sign(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload();
        json response = check web3Service->post("/sign-petition", payload);
        check caller->respond(response);
    }

    // Fix: Use path parameter syntax
    resource function get [string id](http:Caller caller, http:Request req) returns error? {
        json response = check web3Service->get("/petition/" + id);
        check caller->respond(response);
    }

    // Fix: Use path parameter syntax for multiple parameters
    resource function get [string id]/[string address](http:Caller caller, http:Request req) returns error? {
        json response = check web3Service->get("/has-signed/" + id + "/" + address);
        check caller->respond(response);
    }

    resource function get health() returns string {
        return "Ballerina service is running!";
    }

}

service /auth on newListener {
    resource function post authorize(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload();
        json response = check web3Service->post("/auth/authorize", payload);
        check caller->respond(response);
    }

    resource function post revoke(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload();
        json response = check web3Service->post("/auth/revoke", payload);
        check caller->respond(response);
    }

    resource function get isauthorized/[string address](http:Caller caller, http:Request req) returns error? {
    json response = check web3Service->get("/auth/is-authorized/" + address);
    map<anydata> respMap = check response.cloneWithType(map<anydata>);
    boolean isVerified = respMap["isAuthorized"] is boolean ? <boolean>respMap["isAuthorized"] : false;

    if isVerified {
        // JWT payload
        map<anydata> claims = {
            iss: "TransparentGovernancePlatform",
            sub: address,
            aud: "TransparentGovernancePlatform",
            exp: time:utcNow().seconds + 3600 // 1 hour expiry
        };
        // Encode JWT
        string token = check jwt:encode(claims, "your-secret-key", jwt:HS256);
        check caller->respond({
            address: address,
            verified: true,
            token: token
        });
    } else {
        check caller->respond({
            address: address,
            verified: false,
            token: ()
        });
    }
}

    resource function get health() returns string {
        return "Auth service is running!";
    }
}

# Get headers for HTTP requests
#
# + return - Headers map
function getHeaders() returns map<string> {
    return {
        "apikey": supabaseServiceRoleKey,
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
    log:printInfo("🚀 Starting Transparent Governance Platform Backend v2.0...");

    // Initialize database connection at startup
    check initializeDatabase();

    log:printInfo("🌐 Server started on port " + port.toString());
    log:printInfo("📋 Available endpoints:");
    log:printInfo("  ➤ Health check: http://localhost:" + port.toString() + "/api/health");
    log:printInfo("  ➤ Server status: http://localhost:" + port.toString() + "/api/status");
    log:printInfo("  ➤ Database health: http://localhost:" + port.toString() + "/api/db/health");
    log:printInfo("  ➤ Server info: http://localhost:" + port.toString() + "/api/info");
    log:printInfo("  ➤ Categories CRUD: http://localhost:" + port.toString() + "/api/categories");
    log:printInfo("  ➤ Policies CRUD: http://localhost:" + port.toString() + "/api/policies");
    log:printInfo("🎉 Server is ready to accept requests!");
    log:printInfo("💡 Note: Now using environment variables for configuration");

    return;
}
