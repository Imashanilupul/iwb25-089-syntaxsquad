import ballerina/http;
import ballerina/log;
import ballerina/time;
import * as services from "../services/usr_services.bal";
import * as models from "../models/usr-model.bal";

// User Controller
service /api/users on new http:Listener(8080) {
    
    // Create a new user
    resource function post .(http:Request request) returns http:Response {
        models:CreateUserRequest? userData = check request.getJsonPayload();
        
        if (userData is models:CreateUserRequest) {
            models:ApiResponse<models:User> result = services:createUser(userData);
            
            if (result.success) {
                return http:Response {
                    statusCode: 201,
                    jsonPayload: result
                };
            } else {
                return http:Response {
                    statusCode: 400,
                    jsonPayload: result
                };
            }
        } else {
            return http:Response {
                statusCode: 400,
                jsonPayload: {
                    success: false,
                    message: "Invalid request data",
                    error: "Request body is required"
                }
            };
        }
    }
    
    // Get all users with pagination
    resource function get .(http:Request request) returns http:Response {
        string? pageParam = request.getQueryParam("page");
        string? limitParam = request.getQueryParam("limit");
        
        int page = pageParam is string ? check int:fromString(pageParam) : 1;
        int limit = limitParam is string ? check int:fromString(limitParam) : 10;
        
        models:PaginatedResponse<models:User> result = services:getAllUsers(page, limit);
        
        return http:Response {
            statusCode: result.success ? 200 : 500,
            jsonPayload: result
        };
    }
    
    // Get user by ID
    resource function get [string id](http:Request request) returns http:Response {
        int userId = check int:fromString(id);
        models:ApiResponse<models:User> result = services:getUserById(userId);
        
        return http:Response {
            statusCode: result.success ? 200 : 404,
            jsonPayload: result
        };
    }
    
    // Update user
    resource function put [string id](http:Request request) returns http:Response {
        int userId = check int:fromString(id);
        models:UpdateUserRequest? userData = check request.getJsonPayload();
        
        if (userData is models:UpdateUserRequest) {
            models:ApiResponse<models:User> result = services:updateUser(userId, userData);
            
            return http:Response {
                statusCode: result.success ? 200 : 404,
                jsonPayload: result
            };
        } else {
            return http:Response {
                statusCode: 400,
                jsonPayload: {
                    success: false,
                    message: "Invalid request data",
                    error: "Request body is required"
                }
            };
        }
    }
    
    // Delete user
    resource function delete [string id](http:Request request) returns http:Response {
        int userId = check int:fromString(id);
        models:ApiResponse<()> result = services:deleteUser(userId);
        
        return http:Response {
            statusCode: result.success ? 200 : 404,
            jsonPayload: result
        };
    }
}

// Petition Controller
service /api/petitions on new http:Listener(8080) {
    
    // Create a new petition
    resource function post .(http:Request request) returns http:Response {
        models:CreatePetitionRequest? petitionData = check request.getJsonPayload();
        
        if (petitionData is models:CreatePetitionRequest) {
            models:ApiResponse<models:Petition> result = services:createPetition(petitionData);
            
            if (result.success) {
                return http:Response {
                    statusCode: 201,
                    jsonPayload: result
                };
            } else {
                return http:Response {
                    statusCode: 400,
                    jsonPayload: result
                };
            }
        } else {
            return http:Response {
                statusCode: 400,
                jsonPayload: {
                    success: false,
                    message: "Invalid request data",
                    error: "Request body is required"
                }
            };
        }
    }
    
    // Get all petitions with pagination
    resource function get .(http:Request request) returns http:Response {
        string? pageParam = request.getQueryParam("page");
        string? limitParam = request.getQueryParam("limit");
        
        int page = pageParam is string ? check int:fromString(pageParam) : 1;
        int limit = limitParam is string ? check int:fromString(limitParam) : 10;
        
        models:PaginatedResponse<models:Petition> result = services:getAllPetitions(page, limit);
        
        return http:Response {
            statusCode: result.success ? 200 : 500,
            jsonPayload: result
        };
    }
}

// Category Controller
service /api/categories on new http:Listener(8080) {
    
    // Create a new category
    resource function post .(http:Request request) returns http:Response {
        models:CreateCategoryRequest? categoryData = check request.getJsonPayload();
        
        if (categoryData is models:CreateCategoryRequest) {
            models:ApiResponse<models:Category> result = services:createCategory(categoryData);
            
            if (result.success) {
                return http:Response {
                    statusCode: 201,
                    jsonPayload: result
                };
            } else {
                return http:Response {
                    statusCode: 400,
                    jsonPayload: result
                };
            }
        } else {
            return http:Response {
                statusCode: 400,
                jsonPayload: {
                    success: false,
                    message: "Invalid request data",
                    error: "Request body is required"
                }
            };
        }
    }
    
    // Get all categories
    resource function get .(http:Request request) returns http:Response {
        models:ApiResponse<models:Category[]> result = services:getAllCategories();
        
        return http:Response {
            statusCode: result.success ? 200 : 500,
            jsonPayload: result
        };
    }
}

// Health check endpoint
service /api/health on new http:Listener(8080) {
    resource function get .() returns http:Response {
        return http:Response {
            statusCode: 200,
            jsonPayload: {
                success: true,
                message: "✅ Backend is running!",
                timestamp: time:utcNow().toString()
            }
        };
    }
}
