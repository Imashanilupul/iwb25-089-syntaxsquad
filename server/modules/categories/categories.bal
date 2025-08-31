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

    # Get headers for HTTP requests with optional prefer header
    #
    # + includePrefer - Whether to include Prefer header for POST/PUT operations
    # + return - Headers map
    public function getHeaders(boolean includePrefer = false) returns map<string> {
        map<string> headers = {
            "apikey": self.supabaseServiceRoleKey,
            "Authorization": "Bearer " + self.supabaseServiceRoleKey,
            "Content-Type": "application/json"
        };
        
        if includePrefer {
            headers["Prefer"] = "return=representation";
        }
        
        return headers;
    }

    # Get all categories (spent budget is now maintained in database)
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

    # Get category by ID (spent budget is now maintained in database)
    #
    # + categoryId - Category ID to retrieve
    # + return - Category data or error
    public function getCategoryById(int categoryId) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }

        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get category: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
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
    # + return - Created category data or error
    public function createCategory(string categoryName, decimal allocatedBudget) returns json|error {
        do {
            // Validate input
            if categoryName.trim().length() == 0 {
                return error("Category name cannot be empty");
            }

            if allocatedBudget < 0d {
                return error("Allocated budget cannot be negative");
            }

            // Supabase table requires explicit category_id (no serial/default).
            // Get current max category_id and increment to produce a new unique id.
            int nextCategoryId = 1;
            string maxIdEndpoint = "/rest/v1/categories?select=category_id&order=category_id.desc&limit=1";
            http:Response maxIdResp = check self.supabaseClient->get(maxIdEndpoint, self.getHeaders());
            if maxIdResp.statusCode == 200 {
                json maxBody = check maxIdResp.getJsonPayload();
                json[] items = check maxBody.ensureType();
                if items.length() > 0 {
                    json first = items[0];
                    if first is map<json> {
                        json|error idJson = first["category_id"];
                        if idJson is json {
                            int|error idVal = idJson.ensureType(int);
                            if idVal is int {
                                nextCategoryId = idVal + 1;
                            }
                        }
                    }
                }
            } else {
                // If we cannot read current max id, fail early with useful message
                return error("Failed to determine next category_id: HTTP " + maxIdResp.statusCode.toString());
            }

            // Ensure the id will fit into smallint
            if nextCategoryId > 32767 {
                return error("Category ID overflow: cannot assign new category_id (exceeds smallint)");
            }

            json payload = {
                "category_id": nextCategoryId,
                "category_name": categoryName,
                "allocated_budget": allocatedBudget,
                "spent_budget": 0d // Will be calculated from projects
            };

            map<string> headers = self.getHeaders(true); // Include Prefer header
            // Use non-throwing call to inspect HTTP errors (Response|error)
            http:Response|error responseOrErr = self.supabaseClient->post("/rest/v1/categories", payload, headers);

            if responseOrErr is error {
                // Return the error message for non-HTTP Response errors (network/client issues)
                string errMsg = responseOrErr.message();
                return error("Failed to create category: " + errMsg);
            }

            http:Response response = responseOrErr;

            if response.statusCode == 201 {
                // Check if response has content
                json|error result = response.getJsonPayload();
                if result is error {
                    // If no content returned, that's also success for Supabase
                    return {
                        "success": true,
                        "message": "Category created successfully",
                        "data": payload, // Return the original payload since no data returned
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] categories = check result.ensureType();
                    if categories.length() > 0 {
                        return {
                            "success": true,
                            "message": "Category created successfully",
                            "data": categories[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "Category created successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                // Non-201 response: try to parse error body
                json|error errBody = response.getJsonPayload();
                string details = "HTTP " + response.statusCode.toString();
                if errBody is json {
                    details += " - " + errBody.toString();
                }

                if response.statusCode == 409 {
                    return {
                        "success": false,
                        "message": "Category already exists",
                        "details": details,
                        "timestamp": time:utcNow()[0]
                    };
                }

                return error("Failed to create category: " + details);
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

            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode == 200 {
                json|error result = response.getJsonPayload();
                if result is error {
                    return {
                        "success": true,
                        "message": "Category updated successfully",
                        "data": payload,
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] categories = check result.ensureType();
                    if categories.length() > 0 {
                        return {
                            "success": true,
                            "message": "Category updated successfully",
                            "data": categories[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "Category updated successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                return error("Failed to update category: " + response.statusCode.toString());
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
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
            http:Response response = check self.supabaseClient->delete(endpoint, (), headers);
            
            if response.statusCode == 200 || response.statusCode == 204 {
                return {
                    "success": true,
                    "message": "Category deleted successfully",
                    "categoryId": categoryId,
                    "timestamp": time:utcNow()[0]
                };
            } else if response.statusCode == 404 {
                return error("Category with ID " + categoryId.toString() + " not found");
            } else {
                string responseBody = "";
                json|error result = response.getJsonPayload();
                if result is json {
                    responseBody = result.toString();
                }
                return error("Failed to delete category: HTTP " + response.statusCode.toString() + " - " + responseBody);
            }
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
                if budget is decimal && spent > budget {
                    errors.push("Spent budget cannot exceed allocated budget");
                }
            }
        }

        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }

    # Update category spent budget based on all projects in that category
    #
    # + categoryId - Category ID to update
    # + return - Success or error
    public function updateCategorySpentBudget(int categoryId) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }

        do {
            map<string> headers = self.getHeaders();
            
            // Get total spent from all projects in this category
            // Note: category_id in projects table is text, so we need to compare as string
            string projectsEndpoint = "/rest/v1/projects?category_id=eq." + categoryId.toString() + "&removed=is.false&select=spent_budget";
            http:Response projectsResponse = check self.supabaseClient->get(projectsEndpoint, headers);
            
            decimal totalSpent = 0d;
            int projectCount = 0;
            
            if projectsResponse.statusCode == 200 {
                json projectsBody = check projectsResponse.getJsonPayload();
                json[] projects = check projectsBody.ensureType();
                
                log:printInfo("Found " + projects.length().toString() + " projects for category " + categoryId.toString());
                
                foreach json project in projects {
                    if project is map<json> {
                        json|error spentBudgetJson = project["spent_budget"];
                        if spentBudgetJson is json && spentBudgetJson != () {
                            decimal projectSpent = 0d;
                            
                            // Handle different data types from database (projects.spent_budget is bigint)
                            if spentBudgetJson is int {
                                projectSpent = <decimal>spentBudgetJson;
                            } else if spentBudgetJson is decimal {
                                projectSpent = spentBudgetJson;
                            } else if spentBudgetJson is string {
                                decimal|error parsed = decimal:fromString(spentBudgetJson);
                                if parsed is decimal {
                                    projectSpent = parsed;
                                }
                            }
                            
                            totalSpent += projectSpent;
                            projectCount += 1;
                            log:printInfo("Project spent: " + projectSpent.toString() + ", running total: " + totalSpent.toString());
                        }
                    }
                }
            } else {
                log:printError("Failed to get projects for category " + categoryId.toString() + ": " + projectsResponse.statusCode.toString());
            }
            
            log:printInfo("Final total spent for category " + categoryId.toString() + ": " + totalSpent.toString() + " from " + projectCount.toString() + " projects");
            
            // Update the category's spent_budget in the database
            json payload = {
                "spent_budget": totalSpent,
                "updated_at": "now()"
            };
            
            map<string> updateHeaders = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, updateHeaders);
            
            if response.statusCode == 200 {
                log:printInfo("Successfully updated category " + categoryId.toString() + " spent budget to " + totalSpent.toString());
                return {
                    "success": true,
                    "message": "Category spent budget updated successfully",
                    "categoryId": categoryId,
                    "newSpentBudget": totalSpent,
                    "projectCount": projectCount,
                    "timestamp": time:utcNow()[0]
                };
            } else {
                json|error errorBody = response.getJsonPayload();
                string errorMsg = errorBody is json ? errorBody.toString() : "Unknown error";
                log:printError("Failed to update category spent budget: " + response.statusCode.toString() + " - " + errorMsg);
                return error("Failed to update category spent budget: " + response.statusCode.toString());
            }
            
        } on fail error e {
            return error("Failed to update category spent budget: " + e.message());
        }
    }

    # Get available budget for a category (allocated - spent from projects)
    #
    # + categoryId - Category ID to check
    # + return - Available budget amount or error
    public function getCategoryAvailableBudget(int categoryId) returns decimal|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }

        do {
            map<string> headers = self.getHeaders();
            
            // Get category allocated budget
            string categoryEndpoint = "/rest/v1/categories?category_id=eq." + categoryId.toString() + "&select=allocated_budget";
            http:Response categoryResponse = check self.supabaseClient->get(categoryEndpoint, headers);
            
            if categoryResponse.statusCode != 200 {
                return error("Failed to get category: " + categoryResponse.statusCode.toString());
            }
            
            json categoryResult = check categoryResponse.getJsonPayload();
            json[] categories = check categoryResult.ensureType();
            
            if categories.length() == 0 {
                return error("Category not found");
            }
            
            json category = categories[0];
            decimal allocatedBudget = 0d;
            if category is map<json> {
                json|error allocatedJson = category["allocated_budget"];
                if allocatedJson is json {
                    allocatedBudget = check allocatedJson.ensureType(decimal);
                }
            }
            
            // Get total spent from all projects in this category (sum of all project spent budgets)
            // Note: category_id in projects table is text, so we need to compare as string
            string projectsEndpoint = "/rest/v1/projects?category_id=eq." + categoryId.toString() + "&removed=is.false&select=spent_budget";
            http:Response projectsResponse = check self.supabaseClient->get(projectsEndpoint, headers);
            
            decimal totalSpent = 0d;
            if projectsResponse.statusCode == 200 {
                json projectsBody = check projectsResponse.getJsonPayload();
                json[] projects = check projectsBody.ensureType();
                
                foreach json project in projects {
                    if project is map<json> {
                        json|error spentBudgetJson = project["spent_budget"];
                        if spentBudgetJson is json && spentBudgetJson != () {
                            // Handle different data types from database (projects.spent_budget is bigint)
                            if spentBudgetJson is int {
                                totalSpent += <decimal>spentBudgetJson;
                            } else if spentBudgetJson is decimal {
                                totalSpent += spentBudgetJson;
                            } else if spentBudgetJson is string {
                                decimal|error parsed = decimal:fromString(spentBudgetJson);
                                if parsed is decimal {
                                    totalSpent += parsed;
                                }
                            }
                        }
                    }
                }
            }
            
            return allocatedBudget - totalSpent;
            
        } on fail error e {
            return error("Failed to get category available budget: " + e.message());
        }
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
