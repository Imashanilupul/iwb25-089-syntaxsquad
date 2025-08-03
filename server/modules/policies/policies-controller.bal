import ballerina/http;
import ballerina/log;
import ballerina/time;

# Request types for policies
type CreatePolicyRequest record {
    # Policy name
    string name;
    # Policy description
    string description;
    # Full policy document
    string view_full_policy;
    # Ministry responsible for the policy
    string ministry;
    # Policy status (optional, defaults to 'DRAFT')
    string? status = "DRAFT";
    # Effective date (optional)
    string? effective_date;
};

type UpdatePolicyRequest record {
    # Policy name (optional)
    string? name;
    # Policy description (optional)
    string? description;
    # Full policy document (optional)
    string? view_full_policy;
    # Ministry responsible for the policy (optional)
    string? ministry;
    # Policy status (optional)
    string? status;
    # Effective date (optional)
    string? effective_date;
};

# Response types for policies
type Policy record {
    # Policy unique identifier
    int id;
    # Policy name
    string name;
    # Policy description
    string description;
    # Full policy document
    string view_full_policy;
    # Ministry responsible for the policy
    string ministry;
    # Policy status
    string status;
    # Effective date
    string? effective_date;
    # Creation timestamp
    string created_time;
    # Update timestamp
    string updated_at;
};

type PolicyResponse record {
    # Success status
    boolean success;
    # Response message
    string message;
    # Policy data (optional)
    Policy? data;
    # Timestamp
    int timestamp;
};

type PoliciesListResponse record {
    # Success status
    boolean success;
    # Response message
    string message;
    # Policies data array (optional)
    Policy[]? data;
    # Total count
    int count;
    # Timestamp
    int timestamp;
};

# Policies Controller service
service /api/policies on new http:Listener(8086) {
    
    # Create a new policy
    #
    # + request - HTTP request containing policy data
    # + return - HTTP response indicating success or failure
    resource function post .(http:Request request) returns http:Response|error {
        log:printInfo("Create policy endpoint called");
        
        http:Response response = new;
        
        do {
            // Get request payload
            json payload = check request.getJsonPayload();
            CreatePolicyRequest policyRequest = check payload.cloneWithType(CreatePolicyRequest);
            
            // Validate input
            if policyRequest.name.trim().length() == 0 {
                response.statusCode = 400;
                response.setJsonPayload({
                    "success": false,
                    "message": "Policy name cannot be empty",
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            if policyRequest.description.trim().length() == 0 {
                response.statusCode = 400;
                response.setJsonPayload({
                    "success": false,
                    "message": "Policy description cannot be empty",
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            if policyRequest.view_full_policy.trim().length() == 0 {
                response.statusCode = 400;
                response.setJsonPayload({
                    "success": false,
                    "message": "Policy full document cannot be empty",
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            if policyRequest.ministry.trim().length() == 0 {
                response.statusCode = 400;
                response.setJsonPayload({
                    "success": false,
                    "message": "Ministry cannot be empty",
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            // Validate status if provided
            if policyRequest.status is string {
                string[] validStatuses = ["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "INACTIVE", "ARCHIVED"];
                boolean isValidStatus = false;
                foreach string validStatus in validStatuses {
                    if policyRequest.status == validStatus {
                        isValidStatus = true;
                        break;
                    }
                }
                if !isValidStatus {
                    response.statusCode = 400;
                    response.setJsonPayload({
                        "success": false,
                        "message": "Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED",
                        "timestamp": time:utcNow()[0]
                    });
                    return response;
                }
            }
            
            // Call service to create policy
            json|error result = createPolicy(policyRequest);
            
            if result is error {
                response.statusCode = 500;
                response.setJsonPayload({
                    "success": false,
                    "message": result.message(),
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
                "message": "Invalid request format: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Get all policies
    #
    # + request - HTTP request for policies list
    # + return - HTTP response with policies list or error message
    resource function get .(http:Request request) returns http:Response|error {
        log:printInfo("Get all policies endpoint called");
        
        http:Response response = new;
        
        do {
            // Call service to get all policies
            json|error result = getAllPolicies();
            
            if result is error {
                response.statusCode = 500;
                response.setJsonPayload({
                    "success": false,
                    "message": result.message(),
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
                "message": "Server error: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Get policy by ID
    #
    # + request - HTTP request for specific policy
    # + policyId - Policy ID from path parameter
    # + return - HTTP response with policy data or error message
    resource function get [int policyId](http:Request request) returns http:Response|error {
        log:printInfo("Get policy by ID endpoint called for ID: " + policyId.toString());
        
        http:Response response = new;
        
        do {
            // Call service to get policy by ID
            json|error result = getPolicyById(policyId);
            
            if result is error {
                if result.message().includes("not found") {
                    response.statusCode = 404;
                    response.setJsonPayload({
                        "success": false,
                        "message": result.message(),
                        "timestamp": time:utcNow()[0]
                    });
                } else {
                    response.statusCode = 500;
                    response.setJsonPayload({
                        "success": false,
                        "message": result.message(),
                        "timestamp": time:utcNow()[0]
                    });
                }
                return response;
            }
            
            response.statusCode = 200;
            response.setJsonPayload(result);
            return response;
            
        } on fail error e {
            response.statusCode = 500;
            response.setJsonPayload({
                "success": false,
                "message": "Server error: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Update policy by ID
    #
    # + request - HTTP request containing updated policy data
    # + policyId - Policy ID from path parameter
    # + return - HTTP response indicating success or failure
    resource function put [int policyId](http:Request request) returns http:Response|error {
        log:printInfo("Update policy endpoint called for ID: " + policyId.toString());
        
        http:Response response = new;
        
        do {
            // Get request payload
            json payload = check request.getJsonPayload();
            UpdatePolicyRequest updateRequest = check payload.cloneWithType(UpdatePolicyRequest);
            
            // Validate status if provided
            if updateRequest.status is string {
                string[] validStatuses = ["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "INACTIVE", "ARCHIVED"];
                boolean isValidStatus = false;
                foreach string validStatus in validStatuses {
                    if updateRequest.status == validStatus {
                        isValidStatus = true;
                        break;
                    }
                }
                if !isValidStatus {
                    response.statusCode = 400;
                    response.setJsonPayload({
                        "success": false,
                        "message": "Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED",
                        "timestamp": time:utcNow()[0]
                    });
                    return response;
                }
            }
            
            // Call service to update policy
            json|error result = updatePolicy(policyId, updateRequest);
            
            if result is error {
                if result.message().includes("not found") {
                    response.statusCode = 404;
                    response.setJsonPayload({
                        "success": false,
                        "message": result.message(),
                        "timestamp": time:utcNow()[0]
                    });
                } else {
                    response.statusCode = 500;
                    response.setJsonPayload({
                        "success": false,
                        "message": result.message(),
                        "timestamp": time:utcNow()[0]
                    });
                }
                return response;
            }
            
            response.statusCode = 200;
            response.setJsonPayload(result);
            return response;
            
        } on fail error e {
            response.statusCode = 400;
            response.setJsonPayload({
                "success": false,
                "message": "Invalid request format: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Delete policy by ID
    #
    # + request - HTTP request for policy deletion
    # + policyId - Policy ID from path parameter
    # + return - HTTP response indicating success or failure
    resource function delete [int policyId](http:Request request) returns http:Response|error {
        log:printInfo("Delete policy endpoint called for ID: " + policyId.toString());
        
        http:Response response = new;
        
        do {
            // Call service to delete policy
            json|error result = deletePolicy(policyId);
            
            if result is error {
                if result.message().includes("not found") {
                    response.statusCode = 404;
                    response.setJsonPayload({
                        "success": false,
                        "message": result.message(),
                        "timestamp": time:utcNow()[0]
                    });
                } else {
                    response.statusCode = 500;
                    response.setJsonPayload({
                        "success": false,
                        "message": result.message(),
                        "timestamp": time:utcNow()[0]
                    });
                }
                return response;
            }
            
            response.statusCode = 200;
            response.setJsonPayload(result);
            return response;
            
        } on fail error e {
            response.statusCode = 500;
            response.setJsonPayload({
                "success": false,
                "message": "Server error: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Get policies by status
    #
    # + request - HTTP request for policies by status
    # + status - Policy status from path parameter
    # + return - HTTP response with policies list or error message
    resource function get status/[string status](http:Request request) returns http:Response|error {
        log:printInfo("Get policies by status endpoint called for status: " + status);
        
        http:Response response = new;
        
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
                response.statusCode = 400;
                response.setJsonPayload({
                    "success": false,
                    "message": "Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED",
                    "timestamp": time:utcNow()[0]
                });
                return response;
            }
            
            // Call service to get policies by status
            json|error result = getPoliciesByStatus(status);
            
            if result is error {
                response.statusCode = 500;
                response.setJsonPayload({
                    "success": false,
                    "message": result.message(),
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
                "message": "Server error: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }

    # Get policies by ministry
    #
    # + request - HTTP request for policies by ministry
    # + ministry - Ministry name from path parameter
    # + return - HTTP response with policies list or error message
    resource function get ministry/[string ministry](http:Request request) returns http:Response|error {
        log:printInfo("Get policies by ministry endpoint called for ministry: " + ministry);
        
        http:Response response = new;
        
        do {
            // Call service to get policies by ministry
            json|error result = getPoliciesByMinistry(ministry);
            
            if result is error {
                response.statusCode = 500;
                response.setJsonPayload({
                    "success": false,
                    "message": result.message(),
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
                "message": "Server error: " + e.message(),
                "timestamp": time:utcNow()[0]
            });
            return response;
        }
    }
}

# Service functions for policies operations

# Create a new policy
#
# + policyData - Policy creation request data
# + return - Created policy data or error
function createPolicy(CreatePolicyRequest policyData) returns json|error {
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
            "name": policyData.name,
            "description": policyData.description,
            "view_full_policy": policyData.view_full_policy,
            "ministry": policyData.ministry,
            "status": policyData.status ?: "DRAFT"
        };
        
        // Add effective_date if provided
        if policyData.effective_date is string {
            payload = check payload.mergeJson({"effective_date": policyData.effective_date});
        }
        
        // Make POST request to Supabase
        http:Response response = check httpClient->post("/rest/v1/policies", payload, headers);
        
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

# Get all policies
#
# + return - Policies list or error
function getAllPolicies() returns json|error {
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
        http:Response response = check httpClient->get("/rest/v1/policies?select=*&order=created_time.desc", headers);
        
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
        string endpoint = "/rest/v1/policies?id=eq." + policyId.toString();
        http:Response response = check httpClient->get(endpoint, headers);
        
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

# Update policy by ID
#
# + policyId - Policy ID to update
# + updateData - Update request data
# + return - Updated policy data or error
function updatePolicy(int policyId, UpdatePolicyRequest updateData) returns json|error {
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
        if updateData.name is string {
            payloadMap["name"] = updateData.name;
        }
        if updateData.description is string {
            payloadMap["description"] = updateData.description;
        }
        if updateData.view_full_policy is string {
            payloadMap["view_full_policy"] = updateData.view_full_policy;
        }
        if updateData.ministry is string {
            payloadMap["ministry"] = updateData.ministry;
        }
        if updateData.status is string {
            payloadMap["status"] = updateData.status;
        }
        if updateData.effective_date is string {
            payloadMap["effective_date"] = updateData.effective_date;
        }
        
        // Add updated_at timestamp
        payloadMap["updated_at"] = "now()";
        
        json payload = payloadMap;
        
        // Make PATCH request to Supabase
        string endpoint = "/rest/v1/policies?id=eq." + policyId.toString();
        http:Response response = check httpClient->patch(endpoint, payload, headers);
        
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
        string endpoint = "/rest/v1/policies?id=eq." + policyId.toString();
        http:Response response = check httpClient->delete(endpoint, headers);
        
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
        string endpoint = "/rest/v1/policies?status=eq." + status + "&select=*&order=created_time.desc";
        http:Response response = check httpClient->get(endpoint, headers);
        
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
        string endpoint = "/rest/v1/policies?ministry=eq." + ministry + "&select=*&order=created_time.desc";
        http:Response response = check httpClient->get(endpoint, headers);
        
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
