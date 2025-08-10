import ballerina/http;
import ballerina/log;
import ballerina/time;


# Categories service for handling category operations
public class CategoriesService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize categories service
    #
    # + supabaseClient - Database client instance
    # + port - Port number for the service
    # + supabaseUrl - Supabase URL
    # + supabaseServiceRoleKey - Supabase service role key
    public function init(http:Client supabaseClient, int port, string supabaseUrl, string supabaseServiceRoleKey) {
        self.supabaseClient = supabaseClient;
        self.port = port;
        self.supabaseUrl = supabaseUrl; 
        self.supabaseServiceRoleKey = supabaseServiceRoleKey;
        log:printInfo("✅ Categories service initialized");
    }

    # Get headers for HTTP requests
    #
    # + return - Headers map
    public function getHeaders() returns map<string> {
        return {
            "apikey": self.supabaseServiceRoleKey,
            "Authorization": "Bearer " + self.supabaseServiceRoleKey,
            "Content-Type": "application/json"
        };
    }

    # Get all categories
    #
    # + return - Categories list or error
    public function getAllCategories() returns json|error {
        do {
            map<string> headers = self.getHeaders();

            http:Response response = check self.supabaseClient->get("/rest/v1/categories?select=*&order=created_at.desc", headers);

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
    public function getCategoryById(int categoryId) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }

        do {
            string endpoint = "/categories?category_id=eq." + categoryId.toString();
            json result = check self.supabaseClient->get(endpoint);
            json[] categories = check result.ensureType();

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

        } on fail error e {
            return error("Failed to get category: " + e.message());
        }
    }

    # Create a new category
    #
    # + categoryName - Category name
    # + allocatedBudget - Allocated budget
    # + spentBudget - Spent budget (optional, defaults to 0)
    # + return - Created category data or error
    public function createCategory(string categoryName, decimal allocatedBudget, decimal spentBudget = 0d) returns json|error {
        do {
            // Validate input
            if categoryName.trim().length() == 0 {
                return error("Category name cannot be empty");
            }

            if allocatedBudget < 0d {
                return error("Allocated budget cannot be negative");
            }

            if spentBudget < 0d {
                return error("Spent budget cannot be negative");
            }

            if spentBudget > allocatedBudget {
                return error("Spent budget cannot exceed allocated budget");
            }

            json payload = {
                "category_name": categoryName,
                "allocated_budget": allocatedBudget,
                "spent_budget": spentBudget
            };

            json result = check self.supabaseClient->post("/categories", payload);
            json[] categories = check result.ensureType();

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

        } on fail error e {
            return error("Failed to create category: " + e.message());
        }
    }

    # Update category by ID
    #
    # + categoryId - Category ID to update
    # + updateData - Update data as JSON
    # + return - Updated category data or error
    public function updateCategory(int categoryId, json updateData) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }

        do {
            map<json> payloadMap = {};

            // Build update payload from provided data
            json|error categoryName = updateData.categoryName;
            if categoryName is json {
                string|error nameStr = categoryName.ensureType(string);
                if nameStr is string && nameStr.trim().length() > 0 {
                    payloadMap["category_name"] = nameStr;
                } else {
                    return error("Category name cannot be empty");
                }
            }

            json|error allocatedBudget = updateData.allocatedBudget;
            if allocatedBudget is json {
                decimal|error budget = allocatedBudget.ensureType(decimal);
                if budget is decimal && budget >= 0d {
                    payloadMap["allocated_budget"] = budget;
                } else {
                    return error("Allocated budget must be non-negative");
                }
            }

            json|error spentBudget = updateData.spentBudget;
            if spentBudget is json {
                decimal|error spent = spentBudget.ensureType(decimal);
                if spent is decimal && spent >= 0d {
                    payloadMap["spent_budget"] = spent;
                } else {
                    return error("Spent budget must be non-negative");
                }
            }

            // Validate that spent doesn't exceed allocated if both are provided
            if payloadMap.hasKey("allocated_budget") && payloadMap.hasKey("spent_budget") {
                decimal allocated = check payloadMap["allocated_budget"].ensureType(decimal);
                decimal spent = check payloadMap["spent_budget"].ensureType(decimal);
                if spent > allocated {
                    return error("Spent budget cannot exceed allocated budget");
                }
            }

            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }

            payloadMap["updated_at"] = "now()";
            json payload = payloadMap;

            string endpoint = "/categories?category_id=eq." + categoryId.toString();
            json result = check self.supabaseClient->patch(endpoint, payload);
            json[] categories = check result.ensureType();

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
            string endpoint = "/categories?category_id=eq." + categoryId.toString();
            json result = check self.supabaseClient->delete(endpoint);

            return {
                "success": true,
                "message": "Category deleted successfully",
                "timestamp": time:utcNow()[0]
            };

        } on fail error e {
            return error("Failed to delete category: " + e.message());
        }
    }

    # Validate category data
    #
    # + categoryData - Category data to validate
    # + return - Validation result
    public function validateCategoryData(json categoryData) returns json {
        string[] errors = [];

        json|error categoryName = categoryData.categoryName;
        if categoryName is error || categoryName.toString().trim().length() == 0 {
            errors.push("Category name is required and cannot be empty");
        }

        json|error allocatedBudget = categoryData.allocatedBudget;
        if allocatedBudget is error {
            errors.push("Allocated budget is required");
        } else {
            decimal|error budget = allocatedBudget.ensureType(decimal);
            if budget is error || budget < 0d {
                errors.push("Allocated budget must be a non-negative number");
            }
        }

        json|error spentBudget = categoryData.spentBudget;
        if spentBudget is json {
            decimal|error spent = spentBudget.ensureType(decimal);
            if spent is error || spent < 0d {
                errors.push("Spent budget must be a non-negative number");
            } else if allocatedBudget is json {
                decimal|error budget = allocatedBudget.ensureType(decimal);
                if budget is decimal && spent is decimal && spent > budget {
                    errors.push("Spent budget cannot exceed allocated budget");
                }
            }
        }

        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }

    # Get categories with budget analysis
    #
    # + return - Categories with budget analysis or error
    public function getCategoriesWithBudgetAnalysis() returns json|error {
        do {
            json result = check self.supabaseClient->get("/categories?select=*&order=allocated_budget.desc");
            json[] categories = check result.ensureType();

            // Calculate budget analysis
            decimal totalAllocated = 0d;
            decimal totalSpent = 0d;
            json[] analysis = [];

            foreach json category in categories {
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

        } on fail error e {
            return error("Failed to get categories with budget analysis: " + e.message());
        }
    }
}
