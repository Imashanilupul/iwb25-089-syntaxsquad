import ballerina/http;
import ballerina/log;
import ballerina/time;

# Request types for categories
type CreateCategoryRequest record {
    # Category name
    string categoryName;
    # Allocated budget
    decimal allocatedBudget;
    # Spent budget (optional, defaults to 0)
    decimal? spentBudget = 0;
};

type UpdateCategoryRequest record {
    # Category name (optional)
    string? categoryName;
    # Allocated budget (optional)
    decimal? allocatedBudget;
    # Spent budget (optional)
    decimal? spentBudget;
};

# Response types for categories
type Category record {
    # Category unique identifier
    int category_id;
    # Category name
    string category_name;
    # Allocated budget
    decimal allocated_budget;
    # Spent budget
    decimal spent_budget;
    # Creation timestamp
    string created_at;
    # Update timestamp
    string updated_at;
};

type CategoryResponse record {
    # Success status
    boolean success;
    # Response message
    string message;
    # Category data (optional)
    Category? data;
    # Timestamp
    int timestamp;
};

type CategoriesListResponse record {
    # Success status
    boolean success;
    # Response message
    string message;
    # Categories data array (optional)
    Category[]? data;
    # Total count
    int count;
    # Timestamp
    int timestamp;
};

# Categories Controller service
service /api/categories on new http:Listener(8085) {
    
    # Create a new category
    #
    # + request - HTTP request containing category data
    # + return - HTTP response indicating success or failure
    resource function post .(http:Request request) returns http:Response|error {
        log:printInfo("Create category endpoint called");
        
        http:Response response = new;
        
        do {
            // Get request payload
            json payload = check request.getJsonPayload();
            CreateCategoryRequest categoryRequest = check payload.cloneWithType(CreateCategoryRequest);
            
            // Validate input
            if categoryRequest.categoryName.trim().length() == 0 {
                response.statusCode = 400;
                response.setJsonPayload({
                    "success": false,
                    "message": "Category name cannot be empty",
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            if categoryRequest.allocatedBudget < 0d {
                response.statusCode = 400;
                response.setJsonPayload({
                    "success": false,
                    "message": "Allocated budget cannot be negative",
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            if categoryRequest.spentBudget is decimal && categoryRequest.spentBudget < 0d {
                response.statusCode = 400;
                response.setJsonPayload({
                    "success": false,
                    "message": "Spent budget cannot be negative",
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            // Call service to create category
            json|error result = createCategory(categoryRequest);
            
            if result is error {
                response.statusCode = 500;
                response.setJsonPayload({
                    "success": false,
                    "message": "Failed to create category: " + result.message(),
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            response.statusCode = 201;
            response.setJsonPayload(result);
            return response;
            
        } on fail error e {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid request payload: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Get all categories
    #
    # + request - HTTP request for categories list
    # + return - HTTP response with categories list or error message
    resource function get .(http:Request request) returns http:Response|error {
        log:printInfo("Get all categories endpoint called");
        
        http:Response response = new;
        
        do {
            // Call service to get all categories
            json|error result = getAllCategories();
            
            if result is error {
                response.statusCode = 500;
                response.setJsonPayload({
                    "success": false,
                    "message": "Failed to retrieve categories: " + result.message(),
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            response.statusCode = 200;
            response.setJsonPayload(result);
            return response;
            
        } on fail error e {
            response.statusCode = 500;
            response.setJsonPayload({
                "success": false,
                "message": "Internal server error: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Get category by ID
    #
    # + request - HTTP request for specific category
    # + categoryId - Category ID from path parameter
    # + return - HTTP response with category data or error message
    resource function get [int categoryId](http:Request request) returns http:Response|error {
        log:printInfo("Get category by ID endpoint called for ID: " + categoryId.toString());
        
        http:Response response = new;
        
        do {
            // Call service to get category by ID
            json|error result = getCategoryById(categoryId);
            
            if result is error {
                response.statusCode = 404;
                response.setJsonPayload({
                    "success": false,
                    "message": "Category not found: " + result.message(),
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            response.statusCode = 200;
            response.setJsonPayload(result);
            return response;
            
        } on fail error e {
            response.statusCode = 500;
            response.setJsonPayload({
                "success": false,
                "message": "Internal server error: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Update category by ID
    #
    # + request - HTTP request containing updated category data
    # + categoryId - Category ID from path parameter
    # + return - HTTP response indicating success or failure
    resource function put [int categoryId](http:Request request) returns http:Response|error {
        log:printInfo("Update category endpoint called for ID: " + categoryId.toString());
        
        http:Response response = new;
        
        do {
            // Get request payload
            json payload = check request.getJsonPayload();
            UpdateCategoryRequest updateRequest = check payload.cloneWithType(UpdateCategoryRequest);
            
            // Call service to update category
            json|error result = updateCategory(categoryId, updateRequest);
            
            if result is error {
                response.statusCode = 404;
                response.setJsonPayload({
                    "success": false,
                    "message": "Failed to update category: " + result.message(),
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            response.statusCode = 200;
            response.setJsonPayload(result);
            return response;
            
        } on fail error e {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid request payload: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Delete category by ID
    #
    # + request - HTTP request for category deletion
    # + categoryId - Category ID from path parameter
    # + return - HTTP response indicating success or failure
    resource function delete [int categoryId](http:Request request) returns http:Response|error {
        log:printInfo("Delete category endpoint called for ID: " + categoryId.toString());
        
        http:Response response = new;
        
        do {
            // Call service to delete category
            json|error result = deleteCategory(categoryId);
            
            if result is error {
                response.statusCode = 404;
                response.setJsonPayload({
                    "success": false,
                    "message": "Failed to delete category: " + result.message(),
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            response.statusCode = 200;
            response.setJsonPayload(result);
            return response;
            
        } on fail error e {
            response.statusCode = 500;
            response.setJsonPayload({
                "success": false,
                "message": "Internal server error: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }
}

# Service functions for categories operations

# Create a new category
#
# + categoryData - Category creation request data
# + return - Created category data or error
function createCategory(CreateCategoryRequest categoryData) returns json|error {
    do {
        // Initialize database service
        string supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co";
        string serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjYwMjQ4NSwiZXhwIjoyMDM4MTc4NDg1fQ.m7uHZHJ6yMgb_Dv6k2Fz_sQKlTz_HEW0uOmnJRqBIH4";
        
        http:Client httpClient = check new (supabaseUrl);
        
        // Prepare headers
        map<string> headers = {
            "apikey": serviceRoleKey,
            "Authorization": "Bearer " + serviceRoleKey,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        };
        
        // Prepare payload
        json payload = {
            "category_name": categoryData.categoryName,
            "allocated_budget": categoryData.allocatedBudget,
            "spent_budget": categoryData.spentBudget ?: 0
        };
        
        // Make POST request to Supabase
        http:Response response = check httpClient->post("/rest/v1/categories", payload, headers);
        
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

# Get all categories
#
# + return - Categories list or error
function getAllCategories() returns json|error {
    do {
        // Initialize database service
        string supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co";
        string apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTA2NjIsImV4cCI6MjA2OTQ2NjY2Mn0._k-5nnUnFUGH2GO0rk_d9U0oFAvs3V5SPLvySQZ-YgA";
        
        http:Client httpClient = check new (supabaseUrl);
        
        // Prepare headers
        map<string> headers = {
            "apikey": apiKey,
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
        };
        
        // Make GET request to Supabase
        http:Response response = check httpClient->get("/rest/v1/categories?select=*&order=created_at.desc", headers);
        
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
        // Initialize database service
        string supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co";
        string apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTA2NjIsImV4cCI6MjA2OTQ2NjY2Mn0._k-5nnUnFUGH2GO0rk_d9U0oFAvs3V5SPLvySQZ-YgA";
        
        http:Client httpClient = check new (supabaseUrl);
        
        // Prepare headers
        map<string> headers = {
            "apikey": apiKey,
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
        };
        
        // Make GET request to Supabase
        string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
        http:Response response = check httpClient->get(endpoint, headers);
        
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

# Update category by ID
#
# + categoryId - Category ID to update
# + updateData - Update request data
# + return - Updated category data or error
function updateCategory(int categoryId, UpdateCategoryRequest updateData) returns json|error {
    do {
        // Initialize database service
        string supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co";
        string serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjYwMjQ4NSwiZXhwIjoyMDM4MTc4NDg1fQ.m7uHZHJ6yMgb_Dv6k2Fz_sQKlTz_HEW0uOmnJRqBIH4";
        
        http:Client httpClient = check new (supabaseUrl);
        
        // Prepare headers
        map<string> headers = {
            "apikey": serviceRoleKey,
            "Authorization": "Bearer " + serviceRoleKey,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        };
        
        // Prepare payload (only include fields that are provided)
        map<json> payloadMap = {};
        if updateData.categoryName is string {
            payloadMap["category_name"] = updateData.categoryName;
        }
        if updateData.allocatedBudget is decimal {
            payloadMap["allocated_budget"] = updateData.allocatedBudget;
        }
        if updateData.spentBudget is decimal {
            payloadMap["spent_budget"] = updateData.spentBudget;
        }
        
        // Add updated_at timestamp
        payloadMap["updated_at"] = "now()";
        
        json payload = payloadMap;
        
        // Make PATCH request to Supabase
        string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
        http:Response response = check httpClient->patch(endpoint, payload, headers);
        
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
        // Initialize database service
        string supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co";
        string serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobnhzaXhnamNkaHZ6dXdibXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjYwMjQ4NSwiZXhwIjoyMDM4MTc4NDg1fQ.m7uHZHJ6yMgb_Dv6k2Fz_sQKlTz_HEW0uOmnJRqBIH4";
        
        http:Client httpClient = check new (supabaseUrl);
        
        // Prepare headers
        map<string> headers = {
            "apikey": serviceRoleKey,
            "Authorization": "Bearer " + serviceRoleKey,
            "Content-Type": "application/json"
        };
        
        // Make DELETE request to Supabase
        string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
        http:Response response = check httpClient->delete(endpoint, headers);
        
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
