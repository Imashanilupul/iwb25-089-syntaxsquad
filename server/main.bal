import ballerina/http;
import ballerina/log;
import ballerina/time;

# Configurable server settings
configurable int port = 8080;
configurable string supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co";
configurable string supabaseApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTA2NjIsImV4cCI6MjA2OTQ2NjY2Mn0._k-5nnUnFUGH2GO0rk_d9U0oFAvs3V5SPLvySQZ-YgA";
configurable string supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTA2NjIsImV4cCI6MjA2OTQ2NjY2Mn0._k-5nnUnFUGH2GO0rk_d9U0oFAvs3V5SPLvySQZ-YgA";

# HTTP listener for the API
listener http:Listener apiListener = new (port);

# Global HTTP client for Supabase API
http:Client supabaseClient = check new (supabaseUrl);

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
    
    # Database setup endpoint
    #
    # + return - Setup instructions
    resource function post db/setup() returns json {
        return getDatabaseSetupInstructions();
    }
    
    # Check database tables endpoint
    #
    # + return - Table existence status
    resource function get db/tables() returns json|error {
        return checkTablesExist();
    }
    
    # Server information endpoint
    #
    # + return - Server information
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
                "GET /api/db/health - Database health check",
                "POST /api/db/setup - Database setup instructions",
                "GET /api/db/tables - Check if tables exist",
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
            "note": "Using HTTP REST API for database operations",
            "timestamp": currentTime[0]
        };
    }

    # Categories endpoints
    
    # Get all categories
    #
    # + return - Categories list or error
    resource function get categories() returns json|error {
        log:printInfo("Get all categories endpoint called");
        return getAllCategories();
    }

    # Get category by ID
    #
    # + categoryId - Category ID to retrieve
    # + return - Category data or error
    resource function get categories/[int categoryId]() returns json|error {
        log:printInfo("Get category by ID endpoint called for ID: " + categoryId.toString());
        return getCategoryById(categoryId);
    }

    # Create a new category
    #
    # + request - HTTP request containing category data
    # + return - Created category data or error
    resource function post categories(http:Request request) returns json|error {
        log:printInfo("Create category endpoint called");
        
        // Get request payload
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
        
        return createCategory(categoryName, allocatedBudget, spentBudget);
    }

    # Update category by ID
    #
    # + request - HTTP request containing updated category data
    # + categoryId - Category ID to update
    # + return - Updated category data or error
    resource function put categories/[int categoryId](http:Request request) returns json|error {
        log:printInfo("Update category endpoint called for ID: " + categoryId.toString());
        
        // Get request payload
        json payload = check request.getJsonPayload();
        
        return updateCategory(categoryId, payload);
    }

    # Delete category by ID
    #
    # + categoryId - Category ID to delete
    # + return - Success message or error
    resource function delete categories/[int categoryId]() returns json|error {
        log:printInfo("Delete category endpoint called for ID: " + categoryId.toString());
        return deleteCategory(categoryId);
    }

    # Data retrieval endpoints
    #
    # + return - User data or error
    resource function get users() returns json|error {
        return executeHttpQuery("/rest/v1/users");
    }

    # + return - Category data or error  
    # resource function get categories() returns json|error {
    #     return executeHttpQuery("/rest/v1/categories");
    # }

    # + return - Project data or error
    resource function get projects() returns json|error {
        return executeHttpQuery("/rest/v1/projects");
    }

    # + return - Proposal data or error
    resource function get proposals() returns json|error {
        return executeHttpQuery("/rest/v1/proposals");
    }

    # + return - Policy data or error
    resource function get policies() returns json|error {
        return executeHttpQuery("/rest/v1/policies");
    }

    # + return - Report data or error
    resource function get reports() returns json|error {
        return executeHttpQuery("/rest/v1/reports");
    }

    # + return - Petition data or error
    resource function get petitions() returns json|error {
        return executeHttpQuery("/rest/v1/petitions");
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

# Check if database tables exist via HTTP
#
# + return - Table existence status as JSON or error
function checkTablesExist() returns json|error {
    do {
        map<string> headers = getHeaders();
        
        // Try to query the users table
        http:Response response = check supabaseClient->get("/rest/v1/users?limit=1", headers);
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

# Database setup instructions
#
# + return - Setup instructions as JSON
function getDatabaseSetupInstructions() returns json {
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
function executeHttpQuery(string endpoint) returns json|error {
    do {
        map<string> headers = getHeaders();
        
        http:Response response = check supabaseClient->get(endpoint, headers);
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
            
            // Check if tables exist
            http:Response tableResponse = check supabaseClient->get("/rest/v1/users?limit=1", headers);
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

# Categories service functions

# Get all categories
#
# + return - Categories list or error
function getAllCategories() returns json|error {
    do {
        map<string> headers = getHeaders();
        
        http:Response response = check supabaseClient->get("/rest/v1/categories?select=*&order=created_at.desc", headers);
        
        if response.statusCode == 200 {
            json responseBody = check response.getJsonPayload();
            json[] categories = check responseBody.ensureType();
            
            return {
                "success": true,
                "message": "Categories retrieved successfully",
                "data": categories,
                "count": categories.length(),
                "timestamp": time:utcNow()[0]
            };
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to get categories: " + e.message());
    }
}

# Get category by ID
#
# + categoryId - Category ID to retrieve
# + return - Category data or error
function getCategoryById(int categoryId) returns json|error {
    do {
        map<string> headers = getHeaders();
        
        string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
        http:Response response = check supabaseClient->get(endpoint, headers);
        
        if response.statusCode == 200 {
            json responseBody = check response.getJsonPayload();
            json[] categories = check responseBody.ensureType();
            
            if categories.length() > 0 {
                return {
                    "success": true,
                    "message": "Category retrieved successfully",
                    "data": categories[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Category not found");
            }
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to get category: " + e.message());
    }
}

# Create a new category
#
# + categoryName - Category name
# + allocatedBudget - Allocated budget
# + spentBudget - Spent budget
# + return - Created category data or error
function createCategory(string categoryName, decimal allocatedBudget, decimal spentBudget) returns json|error {
    do {
        map<string> headers = getHeaders();
        headers["Prefer"] = "return=representation";
        
        json payload = {
            "category_name": categoryName,
            "allocated_budget": allocatedBudget,
            "spent_budget": spentBudget
        };
        
        http:Response response = check supabaseClient->post("/rest/v1/categories", payload, headers);
        
        if response.statusCode == 201 {
            json responseBody = check response.getJsonPayload();
            json[] categories = check responseBody.ensureType();
            
            if categories.length() > 0 {
                return {
                    "success": true,
                    "message": "Category created successfully",
                    "data": categories[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("No category data returned from database");
            }
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to create category: " + e.message());
    }
}

# Update category by ID
#
# + categoryId - Category ID to update
# + updateData - Update data as JSON
# + return - Updated category data or error
function updateCategory(int categoryId, json updateData) returns json|error {
    do {
        map<string> headers = getHeaders();
        headers["Prefer"] = "return=representation";
        
        map<json> payloadMap = {};
        
        json|error categoryName = updateData.categoryName;
        if categoryName is json {
            payloadMap["category_name"] = categoryName;
        }
        
        json|error allocatedBudget = updateData.allocatedBudget;
        if allocatedBudget is json {
            payloadMap["allocated_budget"] = allocatedBudget;
        }
        
        json|error spentBudget = updateData.spentBudget;
        if spentBudget is json {
            payloadMap["spent_budget"] = spentBudget;
        }
        
        payloadMap["updated_at"] = "now()";
        json payload = payloadMap;
        
        string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
        http:Response response = check supabaseClient->patch(endpoint, payload, headers);
        
        if response.statusCode == 200 {
            json responseBody = check response.getJsonPayload();
            json[] categories = check responseBody.ensureType();
            
            if categories.length() > 0 {
                return {
                    "success": true,
                    "message": "Category updated successfully",
                    "data": categories[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Category not found");
            }
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to update category: " + e.message());
    }
}

# Delete category by ID
#
# + categoryId - Category ID to delete
# + return - Success message or error
function deleteCategory(int categoryId) returns json|error {
    do {
        map<string> headers = getHeaders();
        
        string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
        http:Response response = check supabaseClient->delete(endpoint, headers);
        
        if response.statusCode == 204 {
            return {
                "success": true,
                "message": "Category deleted successfully",
                "timestamp": time:utcNow()[0]
            };
        } else if response.statusCode == 404 {
            return error("Category not found");
        } else {
            json responseBody = check response.getJsonPayload();
            return error("Database error: " + responseBody.toString());
        }
        
    } on fail error e {
        return error("Failed to delete category: " + e.message());
    }
}

# Application entry point
#
# + return - Error if application fails to start
public function main() returns error? {
    log:printInfo("🚀 Starting Transparent Governance Platform Backend...");
    
    // Initialize database connection at startup
    check initializeDatabase();
    
    log:printInfo("🌐 Server started on port " + port.toString());
    log:printInfo("📋 Available endpoints:");
    log:printInfo("  ➤ Health check: http://localhost:" + port.toString() + "/api/health");
    log:printInfo("  ➤ Server status: http://localhost:" + port.toString() + "/api/status");
    log:printInfo("  ➤ Database health: http://localhost:" + port.toString() + "/api/db/health");
    log:printInfo("  ➤ Server info: http://localhost:" + port.toString() + "/api/info");
    log:printInfo("🎉 Server is ready to accept requests!");
    log:printInfo("💡 Note: Using HTTP REST API for database operations");
    
    return;
}
