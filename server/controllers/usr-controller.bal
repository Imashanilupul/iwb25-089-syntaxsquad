import ballerina/http;
import ballerina/log;
import ballerina/time;

# Simple types for local use
type CreateUserRequest record {
    # User's username
    string userName;
    # User's email address
    string email;
    # User's National Identity Card number
    string nic;
    # User's mobile number
    string mobileNo;
    # User's Ethereum Virtual Machine address (optional)
    string? evm;
};

type User record {
    # User's unique identifier
    int id;
    # User's username
    string userName;
    # User's email address
    string email;
    # User's National Identity Card number
    string nic;
    # User's mobile number
    string mobileNo;
    # User's Ethereum Virtual Machine address (optional)
    string? evm;
};

type CreatePetitionRequest record {
    # Petition title
    string title;
    # Petition description
    string description;
    # Required signature count
    int requiredSignatureCount;
    # Creator ID
    int creatorId;
};

type CreateCategoryRequest record {
    # Category name
    string categoryName;
    # Allocated budget
    decimal allocatedBudget;
};

# User Controller service
service /api/usr/users on new http:Listener(8084) {
    
    # Create a new user
    #
    # + request - HTTP request containing user data
    # + return - HTTP response indicating success or failure
    resource function post .(http:Request request) returns http:Response|error {
        log:printInfo("User creation endpoint called");
        
        // Get request payload
        json|error payload = request.getJsonPayload();
        
        http:Response response = new;
        
        if payload is error {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid JSON payload",
                "error": payload.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
        
        // For now, return a placeholder response
        response.statusCode = 501;
        response.setJsonPayload({
            "success": false,
            "message": "User creation endpoint not implemented yet",
            "timestamp": time:utcNow()[0]
        });
        return response;
    }

    # Get all users
    #
    # + request - HTTP request for user list
    # + return - HTTP response with user list or error message
    resource function get .(http:Request request) returns http:Response|error {
        log:printInfo("Get all users endpoint called");
        
        http:Response response = new;
        response.statusCode = 501;
        response.setJsonPayload({
            "success": false,
            "message": "Get users endpoint not implemented yet",
            "timestamp": time:utcNow()[0]
        });
        return response;
    }

    # Get user by ID
    #
    # + id - User ID path parameter
    # + request - HTTP request
    # + return - HTTP response with user data or error message
    resource function get [string id](http:Request request) returns http:Response|error {
        log:printInfo("Get user by ID endpoint called for user: " + id);
        
        http:Response response = new;
        
        // Validate ID format
        int|error userId = int:fromString(id);
        if userId is error {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid user ID format",
                "error": "User ID must be a valid integer",
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
        
        response.statusCode = 501;
        response.setJsonPayload({
            "success": false,
            "message": "Get user by ID endpoint not implemented yet",
            "userId": id,
            "timestamp": time:utcNow()[0]
        });
        return response;
    }

    # Update user
    #
    # + id - User ID path parameter
    # + request - HTTP request containing updated user data
    # + return - HTTP response indicating success or failure
    resource function put [string id](http:Request request) returns http:Response|error {
        log:printInfo("Update user endpoint called for user: " + id);
        
        http:Response response = new;
        
        // Validate ID format
        int|error userId = int:fromString(id);
        if userId is error {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid user ID format",
                "error": "User ID must be a valid integer",
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
        
        // Get request payload
        json|error payload = request.getJsonPayload();
        if payload is error {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid JSON payload",
                "error": payload.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
        
        response.statusCode = 501;
        response.setJsonPayload({
            "success": false,
            "message": "Update user endpoint not implemented yet",
            "userId": id,
            "timestamp": time:utcNow()[0]
        });
        return response;
    }

    # Delete user
    #
    # + id - User ID path parameter
    # + request - HTTP request
    # + return - HTTP response indicating success or failure
    resource function delete [string id](http:Request request) returns http:Response|error {
        log:printInfo("Delete user endpoint called for user: " + id);
        
        http:Response response = new;
        
        // Validate ID format
        int|error userId = int:fromString(id);
        if userId is error {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid user ID format",
                "error": "User ID must be a valid integer",
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
        
        response.statusCode = 501;
        response.setJsonPayload({
            "success": false,
            "message": "Delete user endpoint not implemented yet",
            "userId": id,
            "timestamp": time:utcNow()[0]
        });
        return response;
    }
}

# Petition Controller service
service /api/usr/petitions on new http:Listener(8085) {
    
    # Create a new petition
    #
    # + request - HTTP request containing petition data
    # + return - HTTP response indicating success or failure
    resource function post .(http:Request request) returns http:Response|error {
        log:printInfo("Petition creation endpoint called");
        
        // Get request payload
        json|error payload = request.getJsonPayload();
        
        http:Response response = new;
        
        if payload is error {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid JSON payload",
                "error": payload.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
        
        response.statusCode = 501;
        response.setJsonPayload({
            "success": false,
            "message": "Petition creation endpoint not implemented yet",
            "timestamp": time:utcNow()[0]
        });
        return response;
    }
    
    # Get all petitions
    #
    # + request - HTTP request for petition list
    # + return - HTTP response with petition list or error message
    resource function get .(http:Request request) returns http:Response|error {
        log:printInfo("Get all petitions endpoint called");
        
        http:Response response = new;
        response.statusCode = 501;
        response.setJsonPayload({
            "success": false,
            "message": "Get petitions endpoint not implemented yet",
            "timestamp": time:utcNow()[0]
        });
        return response;
    }
}

# Category Controller service
service /api/usr/categories on new http:Listener(8086) {
    
    # Create a new category
    #
    # + request - HTTP request containing category data
    # + return - HTTP response indicating success or failure
    resource function post .(http:Request request) returns http:Response|error {
        log:printInfo("Category creation endpoint called");
        
        // Get request payload
        json|error payload = request.getJsonPayload();
        
        http:Response response = new;
        
        if payload is error {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid JSON payload",
                "error": payload.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
        
        response.statusCode = 501;
        response.setJsonPayload({
            "success": false,
            "message": "Category creation endpoint not implemented yet",
            "timestamp": time:utcNow()[0]
        });
        return response;
    }
    
    # Get all categories
    #
    # + request - HTTP request for category list
    # + return - HTTP response with category list or error message
    resource function get .(http:Request request) returns http:Response|error {
        log:printInfo("Get all categories endpoint called");
        
        http:Response response = new;
        response.statusCode = 501;
        response.setJsonPayload({
            "success": false,
            "message": "Get categories endpoint not implemented yet",
            "timestamp": time:utcNow()[0]
        });
        return response;
    }
}

# Health check endpoint
service /api/usr/health on new http:Listener(8087) {
    
    # Health check
    #
    # + return - HTTP response with health status
    resource function get .() returns http:Response|error {
        log:printInfo("Health check endpoint called");
        
        http:Response response = new;
        response.statusCode = 200;
        response.setJsonPayload({
            "success": true,
            "message": "✅ User services are running!",
            "timestamp": time:utcNow()[0]
        });
        return response;
    }
}
