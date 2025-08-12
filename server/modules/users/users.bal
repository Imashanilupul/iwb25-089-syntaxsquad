import ballerina/http;
import ballerina/log;
import ballerina/time;

# Users service for handling user operations
public class UsersService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize users service
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
        log:printInfo("✅ Users service initialized");
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

    # Get all users
    #
    # + return - Users list or error
    public function getAllUsers() returns json|error {
        do {
            map<string> headers = self.getHeaders();

            http:Response response = check self.supabaseClient->get("/rest/v1/users?select=*&order=created_at.desc", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get users: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] users = check result.ensureType();
            
            return {
                "success": true,
                "message": "Users retrieved successfully",
                "data": users,
                "count": users.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get users: " + e.message());
        }
    }

    # Get user by ID
    #
    # + userId - User ID to retrieve
    # + return - User data or error
    public function getUserById(int userId) returns json|error {
        // Validate input
        if userId <= 0 {
            return error("User ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/users?id=eq." + userId.toString();
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get user: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] users = check result.ensureType();
            
            if users.length() > 0 {
                return {
                    "success": true,
                    "message": "User retrieved successfully",
                    "data": users[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("User not found");
            }
            
        } on fail error e {
            return error("Failed to get user: " + e.message());
        }
    }

    # Create a new user
    #
    # + userName - User name
    # + email - User email
    # + nic - National Identity Card number
    # + mobileNo - Mobile number
    # + evm - EVM address (optional)
    # + province - Province (optional)
    # + return - Created user data or error
    public function createUser(string userName, string email, string nic, string mobileNo, string? evm = (), string? province = ()) returns json|error {
        do {
            // Validate input
            if userName.trim().length() == 0 {
                return error("User name cannot be empty");
            }
            
            if email.trim().length() == 0 {
                return error("Email cannot be empty");
            }
            
            if nic.trim().length() == 0 {
                return error("NIC cannot be empty");
            }
            
            if mobileNo.trim().length() == 0 {
                return error("Mobile number cannot be empty");
            }
            
            // Basic email validation
            if !email.includes("@") {
                return error("Invalid email format");
            }
            
            json payload = {
                "user_name": userName,
                "email": email,
                "nic": nic,
                "mobile_no": mobileNo
            };
            
            // Add EVM address if provided
            if evm is string && evm.trim().length() > 0 {
                payload = check payload.mergeJson({"evm": evm});
            }

            // Add Province if provided
            if province is string && province.trim().length() > 0 {
                payload = check payload.mergeJson({"Province": province});
            }

            map<string> headers = self.getHeaders(true); // Include Prefer header
            http:Response response = check self.supabaseClient->post("/rest/v1/users", payload, headers);
            
            if response.statusCode == 201 {
                // Check if response has content
                json|error result = response.getJsonPayload();
                if result is error {
                    return {
                        "success": true,
                        "message": "User created successfully",
                        "data": payload,
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] users = check result.ensureType();
                    if users.length() > 0 {
                        return {
                            "success": true,
                            "message": "User created successfully",
                            "data": users[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "User created successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                return error("Failed to create user: " + response.statusCode.toString());
            }

        } on fail error e {
            return error("Failed to create user: " + e.message());
        }
    }

    # Update user by ID
    #
    # + userId - User ID to update
    # + updateData - Update data as JSON
    # + return - Updated user data or error
    public function updateUser(int userId, json updateData) returns json|error {
        // Validate input
        if userId <= 0 {
            return error("User ID must be a positive integer");
        }
        
        do {
            map<json> payloadMap = {};
            
            // Build update payload from provided data
            json|error userName = updateData.user_name;
            if userName is json {
                string|error nameStr = userName.ensureType(string);
                if nameStr is string && nameStr.trim().length() > 0 {
                    payloadMap["user_name"] = nameStr;
                } else {
                    return error("User name cannot be empty");
                }
            }
            
            json|error email = updateData.email;
            if email is json {
                string|error emailStr = email.ensureType(string);
                if emailStr is string && emailStr.trim().length() > 0 {
                    // Basic email validation
                    if !emailStr.includes("@") {
                        return error("Invalid email format");
                    }
                    payloadMap["email"] = emailStr;
                } else {
                    return error("Email cannot be empty");
                }
            }
            
            json|error nic = updateData.nic;
            if nic is json {
                string|error nicStr = nic.ensureType(string);
                if nicStr is string && nicStr.trim().length() > 0 {
                    payloadMap["nic"] = nicStr;
                } else {
                    return error("NIC cannot be empty");
                }
            }
            
            json|error mobileNo = updateData.mobile_no;
            if mobileNo is json {
                string|error mobileStr = mobileNo.ensureType(string);
                if mobileStr is string && mobileStr.trim().length() > 0 {
                    payloadMap["mobile_no"] = mobileStr;
                } else {
                    return error("Mobile number cannot be empty");
                }
            }
            
            json|error evm = updateData.evm;
            if evm is json {
                string|error evmStr = evm.ensureType(string);
                if evmStr is string {
                    payloadMap["evm"] = evmStr;
                }
            }
            
            json|error province = updateData.Province;
            if province is json {
                string|error provinceStr = province.ensureType(string);
                if provinceStr is string && provinceStr.trim().length() > 0 {
                    payloadMap["Province"] = provinceStr;
                }
            }
            
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            payloadMap["updated_at"] = "now()";
            json payload = payloadMap;
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/users?id=eq." + userId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to update user: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] users = check result.ensureType();
            
            if users.length() > 0 {
                return {
                    "success": true,
                    "message": "User updated successfully",
                    "data": users[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("User not found");
            }
            
        } on fail error e {
            return error("Failed to update user: " + e.message());
        }
    }

    # Delete user by ID
    #
    # + userId - User ID to delete
    # + return - Success message or error
    public function deleteUser(int userId) returns json|error {
        // Validate input
        if userId <= 0 {
            return error("User ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/users?id=eq." + userId.toString();
            http:Response response = check self.supabaseClient->delete(endpoint, (), headers);
            
            if response.statusCode != 200 && response.statusCode != 204 {
                return error("Failed to delete user: " + response.statusCode.toString());
            }
            
            return {
                "success": true,
                "message": "User deleted successfully",
                "userId": userId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to delete user: " + e.message());
        }
    }

    # Get user by email
    #
    # + email - Email to search for
    # + return - User data or error
    public function getUserByEmail(string email) returns json|error {
        // Validate input
        if email.trim().length() == 0 {
            return error("Email cannot be empty");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/users?email=eq." + email + "&select=*";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get user by email: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] users = check result.ensureType();
            
            if users.length() > 0 {
                return {
                    "success": true,
                    "message": "User retrieved successfully",
                    "data": users[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("User not found");
            }
            
        } on fail error e {
            return error("Failed to get user by email: " + e.message());
        }
    }

    # Get user by NIC
    #
    # + nic - NIC to search for
    # + return - User data or error
    public function getUserByNic(string nic) returns json|error {
        // Validate input
        if nic.trim().length() == 0 {
            return error("NIC cannot be empty");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/users?nic=eq." + nic + "&select=*";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get user by NIC: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] users = check result.ensureType();
            
            if users.length() > 0 {
                return {
                    "success": true,
                    "message": "User retrieved successfully",
                    "data": users[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("User not found");
            }
            
        } on fail error e {
            return error("Failed to get user by NIC: " + e.message());
        }
    }

    # Search users by keyword
    #
    # + keyword - Keyword to search for in user name or email
    # + return - Matching users or error
    public function searchUsers(string keyword) returns json|error {
        // Validate input
        if keyword.trim().length() == 0 {
            return error("Search keyword cannot be empty");
        }
        
        do {
            // Search in both user_name and email fields
            string searchTerm = "%" + keyword + "%";
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/users?or=(user_name.ilike." + searchTerm + ",email.ilike." + searchTerm + ")&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to search users: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] users = check result.ensureType();
            
            return {
                "success": true,
                "message": "Users search completed successfully",
                "data": users,
                "count": users.length(),
                "keyword": keyword,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to search users: " + e.message());
        }
    }

    # Validate user data
    #
    # + userData - User data to validate
    # + return - Validation result
    public function validateUserData(json userData) returns json {
        string[] errors = [];
        
        json|error userName = userData.user_name;
        if userName is error || userName.toString().trim().length() == 0 {
            errors.push("User name is required and cannot be empty");
        }
        
        json|error email = userData.email;
        if email is error || email.toString().trim().length() == 0 {
            errors.push("Email is required and cannot be empty");
        } else if !email.toString().includes("@") {
            errors.push("Invalid email format");
        }
        
        json|error nic = userData.nic;
        if nic is error || nic.toString().trim().length() == 0 {
            errors.push("NIC is required and cannot be empty");
        }
        
        json|error mobileNo = userData.mobile_no;
        if mobileNo is error || mobileNo.toString().trim().length() == 0 {
            errors.push("Mobile number is required and cannot be empty");
        }
        
        // Validate Province if provided
        json|error province = userData.Province;
        if province is json && province.toString().trim().length() > 0 {
            string[] validProvinces = ["Western", "Central", "Southern", "Northern", "Eastern", "North Western", "North Central", "Uva", "Sabaragamuwa"];
            string provinceStr = province.toString();
            boolean isValidProvince = false;
            foreach string validProvince in validProvinces {
                if provinceStr == validProvince {
                    isValidProvince = true;
                    break;
                }
            }
            if !isValidProvince {
                errors.push("Invalid province. Must be one of: " + string:'join(", ", ...validProvinces));
            }
        }
        
        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }

    # Get user statistics
    #
    # + return - User statistics or error
    public function getUserStatistics() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get("/rest/v1/users?select=*", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get user statistics: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] users = check result.ensureType();
            
            int totalUsers = users.length();
            int usersWithEvm = 0;
            
            foreach json user in users {
                if user is map<json> {
                    json|error evm = user["evm"];
                    if evm is json && evm.toString().trim().length() > 0 {
                        usersWithEvm += 1;
                    }
                }
            }
            
            return {
                "success": true,
                "message": "User statistics retrieved successfully",
                "data": {
                    "total_users": totalUsers,
                    "users_with_evm": usersWithEvm,
                    "users_without_evm": totalUsers - usersWithEvm,
                    "evm_adoption_percentage": totalUsers > 0 ? (usersWithEvm * 100) / totalUsers : 0
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get user statistics: " + e.message());
        }
    }

    # Get recent users (last 30 days)
    #
    # + return - Recent users list or error
    public function getRecentUsers() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            // Simplified approach: get all users and sort by created_at descending
            // This avoids potential date formatting issues with Supabase
            string endpoint = "/rest/v1/users?select=*&order=created_at.desc&limit=50";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get recent users: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] users = check result.ensureType();
            
            return {
                "success": true,
                "message": "Recent users retrieved successfully",
                "data": users,
                "count": users.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get recent users: " + e.message());
        }
    }

    # Get province statistics
    #
    # + return - Province statistics or error
    public function getProvinceStatistics() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/users?select=Province&Province=not.is.null";
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get province data: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] users = check result.ensureType();
            
            // Count users by province
            map<int> provinceCounts = {};
            int totalUsers = users.length();
            
            foreach json user in users {
                json|error provinceResult = user.Province;
                if provinceResult is json && provinceResult != () {
                    string province = provinceResult.toString();
                    if provinceCounts.hasKey(province) {
                        provinceCounts[province] = provinceCounts.get(province) + 1;
                    } else {
                        provinceCounts[province] = 1;
                    }
                }
            }
            
            // Convert to array format for frontend
            json[] provinceData = [];
            foreach string province in provinceCounts.keys() {
                int count = provinceCounts.get(province);
                provinceData.push({
                    "province": province,
                    "count": count,
                    "percentage": totalUsers > 0 ? (count * 100) / totalUsers : 0
                });
            }
            
            return {
                "success": true,
                "message": "Province statistics retrieved successfully",
                "data": {
                    "total_users_with_province": totalUsers,
                    "provinces": provinceData
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get province statistics: " + e.message());
        }
    }
}
