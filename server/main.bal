import ballerina/http;
import ballerina/log;
import ballerina/time;
import server_bal.categories;

# Environment variables configuration
configurable int port = ?;
configurable string supabaseUrl = ?;
configurable string supabaseServiceRoleKey = ?;

# HTTP listener for the API
listener http:Listener apiListener = new (port);

# Global HTTP client for Supabase API
http:Client supabaseClient = check new (supabaseUrl);

categories:CategoriesService categoriesService = new (supabaseClient,port, supabaseUrl, supabaseServiceRoleKey);

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
        return getAllPolicies();
    }

    # Get policy by ID
    #
    # + policyId - Policy ID to retrieve
    # + return - Policy data or error
    resource function get policies/[int policyId]() returns json|error {
        log:printInfo("Get policy by ID endpoint called for ID: " + policyId.toString());
        return getPolicyById(policyId);
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
        
        return createPolicy(name, description, viewFullPolicy, ministry, status, effectiveDate);
    }

    # Update policy by ID
    #
    # + request - HTTP request containing updated policy data
    # + policyId - Policy ID to update
    # + return - Updated policy data or error
    resource function put policies/[int policyId](http:Request request) returns json|error {
        log:printInfo("Update policy endpoint called for ID: " + policyId.toString());
        
        json payload = check request.getJsonPayload();
        return updatePolicy(policyId, payload);
    }

    # Delete policy by ID
    #
    # + policyId - Policy ID to delete
    # + return - Success message or error
    resource function delete policies/[int policyId]() returns json|error {
        log:printInfo("Delete policy endpoint called for ID: " + policyId.toString());
        return deletePolicy(policyId);
    }

    # Get policies by status
    #
    # + status - Policy status to filter by
    # + return - Filtered policies list or error
    resource function get policies/status/[string status]() returns json|error {
        log:printInfo("Get policies by status endpoint called for status: " + status);
        return getPoliciesByStatus(status);
    }

    # Get policies by ministry
    #
    # + ministry - Ministry name to filter by
    # + return - Filtered policies list or error
    resource function get policies/ministry/[string ministry]() returns json|error {
        log:printInfo("Get policies by ministry endpoint called for ministry: " + ministry);
        return getPoliciesByMinistry(ministry);
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

# Get all policies
#
# + return - Policies list or error
function getAllPolicies() returns json|error {
    do {
        map<string> headers = getHeaders();
        http:Response response = check supabaseClient->get("/rest/v1/policies?select=*&order=created_time.desc", headers);
        
        if response.statusCode == 200 {
            json responseBody = check response.getJsonPayload();
            json[] policies = check responseBody.ensureType();
            
            return {
                "success": true,
                "message": "Policies retrieved successfully",
                "data": policies,
                "count": policies.length(),
                "timestamp": time:utcNow()[0]
            };
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to get policies: " + e.message());
    }
}

# Get policy by ID
#
# + policyId - Policy ID to retrieve
# + return - Policy data or error
function getPolicyById(int policyId) returns json|error {
    do {
        map<string> headers = getHeaders();
        string endpoint = "/rest/v1/policies?id=eq." + policyId.toString();
        http:Response response = check supabaseClient->get(endpoint, headers);
        
        if response.statusCode == 200 {
            json responseBody = check response.getJsonPayload();
            json[] policies = check responseBody.ensureType();
            
            if policies.length() > 0 {
                return {
                    "success": true,
                    "message": "Policy retrieved successfully",
                    "data": policies[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Policy not found");
            }
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to get policy: " + e.message());
    }
}

# Create a new policy
#
# + name - Policy name
# + description - Policy description
# + viewFullPolicy - Full policy document
# + ministry - Ministry responsible for the policy
# + status - Policy status (defaults to 'DRAFT')
# + effectiveDate - Effective date (optional)
# + return - Created policy data or error
function createPolicy(string name, string description, string viewFullPolicy, string ministry, string status = "DRAFT", string? effectiveDate = ()) returns json|error {
    do {
        map<string> headers = getHeaders();
        headers["Prefer"] = "return=representation";
        
        // Validate input
        if name.trim().length() == 0 {
            return error("Policy name cannot be empty");
        }
        
        if description.trim().length() == 0 {
            return error("Policy description cannot be empty");
        }
        
        if viewFullPolicy.trim().length() == 0 {
            return error("Policy full document cannot be empty");
        }
        
        if ministry.trim().length() == 0 {
            return error("Ministry cannot be empty");
        }
        
        // Validate status
        string[] validStatuses = ["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "INACTIVE", "ARCHIVED"];
        boolean isValidStatus = false;
        foreach string validStatus in validStatuses {
            if status == validStatus {
                isValidStatus = true;
                break;
            }
        }
        if !isValidStatus {
            return error("Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED");
        }
        
        json payload = {
            "name": name,
            "description": description,
            "view_full_policy": viewFullPolicy,
            "ministry": ministry,
            "status": status
        };
        
        // Add effective_date if provided
        if effectiveDate is string {
            payload = check payload.mergeJson({"effective_date": effectiveDate});
        }
        
        http:Response response = check supabaseClient->post("/rest/v1/policies", payload, headers);
        
        if response.statusCode == 201 {
            json responseBody = check response.getJsonPayload();
            json[] policies = check responseBody.ensureType();
            
            if policies.length() > 0 {
                return {
                    "success": true,
                    "message": "Policy created successfully",
                    "data": policies[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("No policy data returned from database");
            }
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to create policy: " + e.message());
    }
}

# Update policy by ID
#
# + policyId - Policy ID to update
# + updateData - Update data as JSON
# + return - Updated policy data or error
function updatePolicy(int policyId, json updateData) returns json|error {
    do {
        map<string> headers = getHeaders();
        headers["Prefer"] = "return=representation";
        
        map<json> payloadMap = {};
        
        json|error name = updateData.name;
        if name is json {
            payloadMap["name"] = name;
        }
        
        json|error description = updateData.description;
        if description is json {
            payloadMap["description"] = description;
        }
        
        json|error viewFullPolicy = updateData.view_full_policy;
        if viewFullPolicy is json {
            payloadMap["view_full_policy"] = viewFullPolicy;
        }
        
        json|error ministry = updateData.ministry;
        if ministry is json {
            payloadMap["ministry"] = ministry;
        }
        
        json|error status = updateData.status;
        if status is json {
            // Validate status
            string statusStr = check status.ensureType(string);
            string[] validStatuses = ["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "INACTIVE", "ARCHIVED"];
            boolean isValidStatus = false;
            foreach string validStatus in validStatuses {
                if statusStr == validStatus {
                    isValidStatus = true;
                    break;
                }
            }
            if isValidStatus {
                payloadMap["status"] = statusStr;
            } else {
                return error("Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED");
            }
        }
        
        json|error effectiveDate = updateData.effective_date;
        if effectiveDate is json {
            payloadMap["effective_date"] = effectiveDate;
        }
        
        payloadMap["updated_at"] = "now()";
        json payload = payloadMap;
        
        string endpoint = "/rest/v1/policies?id=eq." + policyId.toString();
        http:Response response = check supabaseClient->patch(endpoint, payload, headers);
        
        if response.statusCode == 200 {
            json responseBody = check response.getJsonPayload();
            json[] policies = check responseBody.ensureType();
            
            if policies.length() > 0 {
                return {
                    "success": true,
                    "message": "Policy updated successfully",
                    "data": policies[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Policy not found");
            }
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to update policy: " + e.message());
    }
}

# Delete policy by ID
#
# + policyId - Policy ID to delete
# + return - Success message or error
function deletePolicy(int policyId) returns json|error {
    do {
        map<string> headers = getHeaders();
        string endpoint = "/rest/v1/policies?id=eq." + policyId.toString();
        http:Response response = check supabaseClient->delete(endpoint, headers);
        
        if response.statusCode == 204 {
            return {
                "success": true,
                "message": "Policy deleted successfully",
                "timestamp": time:utcNow()[0]
            };
        } else if response.statusCode == 404 {
            return error("Policy not found");
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to delete policy: " + e.message());
    }
}

# Get policies by status
#
# + status - Policy status to filter by
# + return - Policies list or error
function getPoliciesByStatus(string status) returns json|error {
    do {
        // Validate status
        string[] validStatuses = ["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "INACTIVE", "ARCHIVED"];
        boolean isValidStatus = false;
        foreach string validStatus in validStatuses {
            if status == validStatus {
                isValidStatus = true;
                break;
            }
        }
        if !isValidStatus {
            return error("Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED");
        }
        
        map<string> headers = getHeaders();
        string endpoint = "/rest/v1/policies?status=eq." + status + "&select=*&order=created_time.desc";
        http:Response response = check supabaseClient->get(endpoint, headers);
        
        if response.statusCode == 200 {
            json responseBody = check response.getJsonPayload();
            json[] policies = check responseBody.ensureType();
            
            return {
                "success": true,
                "message": "Policies retrieved successfully by status",
                "data": policies,
                "count": policies.length(),
                "status": status,
                "timestamp": time:utcNow()[0]
            };
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to get policies by status: " + e.message());
    }
}

# Get policies by ministry
#
# + ministry - Ministry name to filter by
# + return - Policies list or error
function getPoliciesByMinistry(string ministry) returns json|error {
    do {
        map<string> headers = getHeaders();
        string endpoint = "/rest/v1/policies?ministry=eq." + ministry + "&select=*&order=created_time.desc";
        http:Response response = check supabaseClient->get(endpoint, headers);
        
        if response.statusCode == 200 {
            json responseBody = check response.getJsonPayload();
            json[] policies = check responseBody.ensureType();
            
            return {
                "success": true,
                "message": "Policies retrieved successfully by ministry",
                "data": policies,
                "count": policies.length(),
                "ministry": ministry,
                "timestamp": time:utcNow()[0]
            };
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to get policies by ministry: " + e.message());
    }
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
