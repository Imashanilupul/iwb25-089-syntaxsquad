import ballerina/http;
import ballerina/time;
import ballerina/lang.'string as strings;

# Categories service for database operations

# Category record type
public type Category record {
    # Category unique identifier
    int category_id;
    # Category name
    string category_name;
    # Allocated budget amount
    decimal allocated_budget;
    # Spent budget amount
    decimal spent_budget;
    # Creation timestamp
    string created_at;
    # Last update timestamp
    string updated_at;
};

# Request types
public type CreateCategoryRequest record {
    # Category name
    string categoryName;
    # Allocated budget amount
    decimal allocatedBudget;
    # Spent budget amount (optional, defaults to 0)
    decimal? spentBudget = 0d;
};

public type UpdateCategoryRequest record {
    # Category name (optional)
    string? categoryName;
    # Allocated budget amount (optional)
    decimal? allocatedBudget;
    # Spent budget amount (optional)
    decimal? spentBudget;
};

# Categories Service Class
public class CategoriesService {
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

    # Create a new category
    #
    # + categoryData - Category creation request data
    # + return - Created category data or error
    public function createCategory(CreateCategoryRequest categoryData) returns json|error {
        // Validate input
        string trimmedName = strings:trim(categoryData.categoryName);
        if trimmedName.length() == 0 {
            return error("Category name cannot be empty");
        }
        
        if categoryData.allocatedBudget < 0d {
            return error("Allocated budget cannot be negative");
        }
        
        decimal spentBudget = categoryData.spentBudget ?: 0d;
        if spentBudget < 0d {
            return error("Spent budget cannot be negative");
        }
        
        if spentBudget > categoryData.allocatedBudget {
            return error("Spent budget cannot exceed allocated budget");
        }
        
        do {
            // Prepare headers
            map<string> headers = {
                "apikey": self.serviceRoleKey,
                "Authorization": "Bearer " + self.serviceRoleKey,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            };
            
            // Prepare payload
            json payload = {
                "category_name": trimmedName,
                "allocated_budget": categoryData.allocatedBudget,
                "spent_budget": spentBudget
            };
            
            // Make POST request to Supabase
            http:Response response = check self.httpClient->post("/rest/v1/categories", payload, headers);
            
            if response.statusCode == 201 {
                json responseBody = check response.getJsonPayload();
                if responseBody is json[] && responseBody.length() > 0 {
                    return {
                        "success": true,
                        "message": "Category created successfully",
                        "data": responseBody[0],
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    return error("No category data returned from database");
                }
            } else {
                string errorMsg = "Database error";
                json|error responseBody = response.getJsonPayload();
                if responseBody is json {
                    errorMsg = "Database error: " + responseBody.toString();
                }
                return error(errorMsg);
            }
            
        } on fail error e {
            return error("Failed to create category: " + e.message());
        }
    }

    # Get all categories
    #
    # + return - Categories list or error
    public function getAllCategories() returns json|error {
        do {
            // Prepare headers
            map<string> headers = {
                "apikey": self.serviceRoleKey,
                "Authorization": "Bearer " + self.serviceRoleKey,
                "Content-Type": "application/json"
            };
            
            // Make GET request to Supabase
            http:Response response = check self.httpClient->get("/rest/v1/categories?select=*&order=created_at.desc", headers);
            
            if response.statusCode == 200 {
                json responseBody = check response.getJsonPayload();
                if responseBody is json[] {
                    return {
                        "success": true,
                        "message": "Categories retrieved successfully",
                        "data": responseBody,
                        "count": responseBody.length(),
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    return error("Invalid response format from database");
                }
            } else {
                json|error responseBody = response.getJsonPayload();
                string errorMsg = responseBody is json ? "Database error: " + responseBody.toString() : "Database connection error";
                return error(errorMsg);
            }
            
        } on fail error e {
            return error("Failed to get categories: " + e.message());
        }
    }

    # Get category by ID
    #
    # + categoryId - Category ID to retrieve
    # + return - Category data or error
    public function getCategoryById(int categoryId) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }
        
        do {
            // Prepare headers
            map<string> headers = {
                "apikey": self.serviceRoleKey,
                "Authorization": "Bearer " + self.serviceRoleKey,
                "Content-Type": "application/json"
            };
            
            // Make GET request to Supabase
            string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
            http:Response response = check self.httpClient->get(endpoint, headers);
            
            if response.statusCode == 200 {
                json responseBody = check response.getJsonPayload();
                if responseBody is json[] {
                    if responseBody.length() > 0 {
                        return {
                            "success": true,
                            "message": "Category retrieved successfully",
                            "data": responseBody[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return error("Category not found");
                    }
                } else {
                    return error("Invalid response format from database");
                }
            } else if response.statusCode == 404 {
                return error("Category not found");
            } else {
                json|error responseBody = response.getJsonPayload();
                string errorMsg = responseBody is json ? "Database error: " + responseBody.toString() : "Database connection error";
                return error(errorMsg);
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
    public function updateCategory(int categoryId, UpdateCategoryRequest updateData) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }
        
        // Validate update data
        string? categoryName = updateData.categoryName;
        if categoryName is string {
            string trimmedName = strings:trim(categoryName);
            if trimmedName.length() == 0 {
                return error("Category name cannot be empty");
            }
        }
        
        if updateData.allocatedBudget is decimal && updateData.allocatedBudget < 0d {
            return error("Allocated budget cannot be negative");
        }
        
        if updateData.spentBudget is decimal && updateData.spentBudget < 0d {
            return error("Spent budget cannot be negative");
        }
        
        do {
            // Prepare headers
            map<string> headers = {
                "apikey": self.serviceRoleKey,
                "Authorization": "Bearer " + self.serviceRoleKey,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            };
            
            // Prepare payload (only include fields that are provided)
            map<json> payloadMap = {};
            if categoryName is string {
                payloadMap["category_name"] = strings:trim(categoryName);
            }
            if updateData.allocatedBudget is decimal {
                payloadMap["allocated_budget"] = updateData.allocatedBudget;
            }
            if updateData.spentBudget is decimal {
                payloadMap["spent_budget"] = updateData.spentBudget;
            }
            
            // Only proceed if there's something to update
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            // Add updated_at timestamp
            payloadMap["updated_at"] = "now()";
            json payload = payloadMap;
            
            // Make PATCH request to Supabase
            string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
            http:Response response = check self.httpClient->patch(endpoint, payload, headers);
            
            if response.statusCode == 200 {
                json responseBody = check response.getJsonPayload();
                if responseBody is json[] {
                    if responseBody.length() > 0 {
                        return {
                            "success": true,
                            "message": "Category updated successfully",
                            "data": responseBody[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return error("Category not found");
                    }
                } else {
                    return error("Invalid response format from database");
                }
            } else if response.statusCode == 404 {
                return error("Category not found");
            } else {
                json|error responseBody = response.getJsonPayload();
                string errorMsg = responseBody is json ? "Database error: " + responseBody.toString() : "Database connection error";
                return error(errorMsg);
            }
            
        } on fail error e {
            return error("Failed to update category: " + e.message());
        }
    }

    # Delete category by ID
    #
    # + categoryId - Category ID to delete
    # + return - Success message or error
    public function deleteCategory(int categoryId) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }
        
        do {
            // Prepare headers
            map<string> headers = {
                "apikey": self.serviceRoleKey,
                "Authorization": "Bearer " + self.serviceRoleKey,
                "Content-Type": "application/json"
            };
            
            // Make DELETE request to Supabase
            string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
            http:Response response = check self.httpClient->delete(endpoint, headers);
            
            if response.statusCode == 204 {
                return {
                    "success": true,
                    "message": "Category deleted successfully",
                    "timestamp": time:utcNow()[0]
                };
            } else if response.statusCode == 404 {
                return error("Category not found");
            } else {
                json|error responseBody = response.getJsonPayload();
                string errorMsg = responseBody is json ? "Database error: " + responseBody.toString() : "Database connection error";
                return error(errorMsg);
            }
            
        } on fail error e {
            return error("Failed to delete category: " + e.message());
        }
    }

    # Get categories with budget analysis
    #
    # + return - Categories with budget analysis or error
    public function getCategoriesWithBudgetAnalysis() returns json|error {
        do {
            // Prepare headers
            map<string> headers = {
                "apikey": self.serviceRoleKey,
                "Authorization": "Bearer " + self.serviceRoleKey,
                "Content-Type": "application/json"
            };
            
            // Make GET request to Supabase
            http:Response response = check self.httpClient->get("/rest/v1/categories?select=*&order=allocated_budget.desc", headers);
            
            if response.statusCode == 200 {
                json responseBody = check response.getJsonPayload();
                if responseBody is json[] {
                    // Calculate budget analysis
                    decimal totalAllocated = 0d;
                    decimal totalSpent = 0d;
                    json[] analysis = [];
                    
                    foreach json category in responseBody {
                        if category is map<json> {
                            decimal allocated = check category["allocated_budget"].ensureType(decimal);
                            decimal spent = check category["spent_budget"].ensureType(decimal);
                            decimal remaining = allocated - spent;
                            decimal utilizationPercentage = allocated > 0d ? (spent / allocated) * 100d : 0d;
                            
                            totalAllocated += allocated;
                            totalSpent += spent;
                            
                            json categoryAnalysis = {
                                "category_id": category["category_id"],
                                "category_name": category["category_name"],
                                "allocated_budget": category["allocated_budget"],
                                "spent_budget": category["spent_budget"],
                                "created_at": category["created_at"],
                                "updated_at": category["updated_at"],
                                "remaining_budget": remaining,
                                "utilization_percentage": utilizationPercentage,
                                "status": utilizationPercentage > 90d ? "High Utilization" : 
                                         utilizationPercentage > 70d ? "Medium Utilization" : "Low Utilization"
                            };
                            
                            analysis.push(categoryAnalysis);
                        }
                    }
                    
                    decimal overallUtilization = totalAllocated > 0d ? (totalSpent / totalAllocated) * 100d : 0d;
                    
                    return {
                        "success": true,
                        "message": "Categories with budget analysis retrieved successfully",
                        "data": analysis,
                        "summary": {
                            "total_allocated": totalAllocated,
                            "total_spent": totalSpent,
                            "total_remaining": totalAllocated - totalSpent,
                            "overall_utilization_percentage": overallUtilization
                        },
                        "count": analysis.length(),
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    return error("Invalid response format from database");
                }
            } else {
                json|error responseBody = response.getJsonPayload();
                string errorMsg = responseBody is json ? "Database error: " + responseBody.toString() : "Database connection error";
                return error(errorMsg);
            }
            
        } on fail error e {
            return error("Failed to get categories with budget analysis: " + e.message());
        }
    }
}
