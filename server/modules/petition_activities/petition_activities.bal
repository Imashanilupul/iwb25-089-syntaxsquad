import ballerina/http;
import ballerina/log;
import ballerina/time;

# Petition Activities service for handling petition activity operations
public class PetitionActivitiesService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize petition activities service
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
        log:printInfo("✅ Petition Activities service initialized");
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

    # Get all petition activities
    #
    # + return - Petition activities list or error
    public function getAllPetitionActivities() returns json|error {
        do {
            map<string> headers = self.getHeaders();

            http:Response response = check self.supabaseClient->get("/rest/v1/petition_activities?select=*&order=activity_date.desc", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get petition activities: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] activities = check result.ensureType();
            
            return {
                "success": true,
                "message": "Petition activities retrieved successfully",
                "data": activities,
                "count": activities.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get petition activities: " + e.message());
        }
    }

    # Get petition activity by ID
    #
    # + activityId - Activity ID to retrieve
    # + return - Activity data or error
    public function getPetitionActivityById(int activityId) returns json|error {
        // Validate input
        if activityId <= 0 {
            return error("Activity ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petition_activities?id=eq." + activityId.toString();
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get petition activity: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] activities = check result.ensureType();
            
            if activities.length() > 0 {
                return {
                    "success": true,
                    "message": "Petition activity retrieved successfully",
                    "data": activities[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Petition activity not found");
            }
            
        } on fail error e {
            return error("Failed to get petition activity: " + e.message());
        }
    }

    # Create a new petition activity
    #
    # + petitionId - Petition ID
    # + activityType - Activity type (SIGNATURE, COMMENT, SHARE, etc.)
    # + signatureCount - Signature count for this activity
    # + userId - User ID who performed the activity
    # + return - Created activity data or error
    public function createPetitionActivity(int petitionId, string activityType = "SIGNATURE", int signatureCount = 1, int? userId = ()) returns json|error {
        do {
            // Validate input
            if petitionId <= 0 {
                return error("Petition ID must be a positive integer");
            }
            
            if activityType.trim().length() == 0 {
                return error("Activity type cannot be empty");
            }
            
            if signatureCount <= 0 {
                return error("Signature count must be positive");
            }
            
            // Validate activity type
            string[] validActivityTypes = ["SIGNATURE", "COMMENT", "SHARE", "REPORT", "VIEW"];
            boolean isValidActivityType = false;
            foreach string validType in validActivityTypes {
                if activityType == validType {
                    isValidActivityType = true;
                    break;
                }
            }
            if !isValidActivityType {
                return error("Invalid activity type. Allowed values: SIGNATURE, COMMENT, SHARE, REPORT, VIEW");
            }
            
            json payload = {
                "petition_id": petitionId,
                "activity_type": activityType,
                "signature_count": signatureCount
            };
            
            // Add optional fields
            if userId is int {
                payload = check payload.mergeJson({"user_id": userId});
            }

            map<string> headers = self.getHeaders(true); // Include Prefer header
            http:Response response = check self.supabaseClient->post("/rest/v1/petition_activities", payload, headers);
            
            if response.statusCode == 201 {
                // Check if response has content
                json|error result = response.getJsonPayload();
                if result is error {
                    return {
                        "success": true,
                        "message": "Petition activity created successfully",
                        "data": payload,
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] activities = check result.ensureType();
                    if activities.length() > 0 {
                        return {
                            "success": true,
                            "message": "Petition activity created successfully",
                            "data": activities[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "Petition activity created successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                return error("Failed to create petition activity: " + response.statusCode.toString());
            }

        } on fail error e {
            return error("Failed to create petition activity: " + e.message());
        }
    }

    # Update petition activity by ID
    #
    # + activityId - Activity ID to update
    # + updateData - Update data as JSON
    # + return - Updated activity data or error
    public function updatePetitionActivity(int activityId, json updateData) returns json|error {
        // Validate input
        if activityId <= 0 {
            return error("Activity ID must be a positive integer");
        }
        
        do {
            map<json> payloadMap = {};
            
            // Build update payload from provided data
            json|error activityType = updateData.activity_type;
            if activityType is json {
                string|error typeStr = activityType.ensureType(string);
                if typeStr is string && typeStr.trim().length() > 0 {
                    // Validate activity type
                    string[] validActivityTypes = ["SIGNATURE", "COMMENT", "SHARE", "REPORT", "VIEW"];
                    boolean isValidActivityType = false;
                    foreach string validType in validActivityTypes {
                        if typeStr == validType {
                            isValidActivityType = true;
                            break;
                        }
                    }
                    if isValidActivityType {
                        payloadMap["activity_type"] = typeStr;
                    } else {
                        return error("Invalid activity type. Allowed values: SIGNATURE, COMMENT, SHARE, REPORT, VIEW");
                    }
                } else {
                    return error("Activity type cannot be empty");
                }
            }
            
            json|error signatureCount = updateData.signature_count;
            if signatureCount is json {
                int|error countInt = signatureCount.ensureType(int);
                if countInt is int && countInt > 0 {
                    payloadMap["signature_count"] = countInt;
                } else {
                    return error("Signature count must be positive");
                }
            }
            
            json|error userId = updateData.user_id;
            if userId is json {
                int|error userIdInt = userId.ensureType(int);
                if userIdInt is int {
                    payloadMap["user_id"] = userIdInt;
                }
            }
            
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            json payload = payloadMap;
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/petition_activities?id=eq." + activityId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to update petition activity: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] activities = check result.ensureType();
            
            if activities.length() > 0 {
                return {
                    "success": true,
                    "message": "Petition activity updated successfully",
                    "data": activities[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Petition activity not found");
            }
            
        } on fail error e {
            return error("Failed to update petition activity: " + e.message());
        }
    }

    # Delete petition activity by ID
    #
    # + activityId - Activity ID to delete
    # + return - Success message or error
    public function deletePetitionActivity(int activityId) returns json|error {
        // Validate input
        if activityId <= 0 {
            return error("Activity ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petition_activities?id=eq." + activityId.toString();
            http:Response response = check self.supabaseClient->delete(endpoint, (), headers);
            
            if response.statusCode != 200 && response.statusCode != 204 {
                return error("Failed to delete petition activity: " + response.statusCode.toString());
            }
            
            return {
                "success": true,
                "message": "Petition activity deleted successfully",
                "activityId": activityId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to delete petition activity: " + e.message());
        }
    }

    # Get activities by petition ID
    #
    # + petitionId - Petition ID to filter by
    # + return - Activities list or error
    public function getActivitiesByPetitionId(int petitionId) returns json|error {
        // Validate input
        if petitionId <= 0 {
            return error("Petition ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petition_activities?petition_id=eq." + petitionId.toString() + "&select=*&order=activity_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get activities by petition ID: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] activities = check result.ensureType();
            
            return {
                "success": true,
                "message": "Activities by petition retrieved successfully",
                "data": activities,
                "count": activities.length(),
                "petitionId": petitionId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get activities by petition ID: " + e.message());
        }
    }

    # Get activities by user ID
    #
    # + userId - User ID to filter by
    # + return - Activities list or error
    public function getActivitiesByUserId(int userId) returns json|error {
        // Validate input
        if userId <= 0 {
            return error("User ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petition_activities?user_id=eq." + userId.toString() + "&select=*&order=activity_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get activities by user ID: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] activities = check result.ensureType();
            
            return {
                "success": true,
                "message": "Activities by user retrieved successfully",
                "data": activities,
                "count": activities.length(),
                "userId": userId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get activities by user ID: " + e.message());
        }
    }

    # Get activities by type
    #
    # + activityType - Activity type to filter by
    # + return - Activities list or error
    public function getActivitiesByType(string activityType) returns json|error {
        // Validate activity type
        string[] validActivityTypes = ["SIGNATURE", "COMMENT", "SHARE", "REPORT", "VIEW"];
        boolean isValidActivityType = false;
        foreach string validType in validActivityTypes {
            if activityType == validType {
                isValidActivityType = true;
                break;
            }
        }
        if !isValidActivityType {
            return error("Invalid activity type. Allowed values: SIGNATURE, COMMENT, SHARE, REPORT, VIEW");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petition_activities?activity_type=eq." + activityType + "&select=*&order=activity_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get activities by type: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] activities = check result.ensureType();
            
            return {
                "success": true,
                "message": "Activities by type retrieved successfully",
                "data": activities,
                "count": activities.length(),
                "activityType": activityType,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get activities by type: " + e.message());
        }
    }

    # Get recent activities (last 30 days)
    #
    # + return - Recent activities list or error
    public function getRecentActivities() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petition_activities?activity_date=gte." + "now() - interval '30 days'" + "&select=*&order=activity_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get recent activities: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] activities = check result.ensureType();
            
            return {
                "success": true,
                "message": "Recent activities retrieved successfully",
                "data": activities,
                "count": activities.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get recent activities: " + e.message());
        }
    }

    # Get activity statistics
    #
    # + return - Activity statistics or error
    public function getActivityStatistics() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get("/rest/v1/petition_activities?select=*", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get activity statistics: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] activities = check result.ensureType();
            
            // Initialize counters
            map<int> typeCounts = {};
            map<int> petitionCounts = {};
            int totalActivities = activities.length();
            int totalSignatures = 0;
            
            foreach json activity in activities {
                if activity is map<json> {
                    // Count by activity type
                    json|error activityType = activity["activity_type"];
                    if activityType is json {
                        string typeStr = activityType.toString();
                        if typeCounts.hasKey(typeStr) {
                            typeCounts[typeStr] = typeCounts.get(typeStr) + 1;
                        } else {
                            typeCounts[typeStr] = 1;
                        }
                    }
                    
                    // Count by petition
                    json|error petitionId = activity["petition_id"];
                    if petitionId is json {
                        string petitionStr = petitionId.toString();
                        if petitionCounts.hasKey(petitionStr) {
                            petitionCounts[petitionStr] = petitionCounts.get(petitionStr) + 1;
                        } else {
                            petitionCounts[petitionStr] = 1;
                        }
                    }
                    
                    // Count signatures
                    json|error signatureCount = activity["signature_count"];
                    if signatureCount is json {
                        int|error countInt = signatureCount.ensureType(int);
                        if countInt is int {
                            totalSignatures += countInt;
                        }
                    }
                }
            }
            
            return {
                "success": true,
                "message": "Activity statistics retrieved successfully",
                "data": {
                    "total_activities": totalActivities,
                    "total_signatures": totalSignatures,
                    "activity_type_breakdown": typeCounts,
                    "petition_activity_breakdown": petitionCounts
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get activity statistics: " + e.message());
        }
    }

    # Validate petition activity data
    #
    # + activityData - Activity data to validate
    # + return - Validation result
    public function validatePetitionActivityData(json activityData) returns json {
        string[] errors = [];
        
        json|error petitionId = activityData.petition_id;
        if petitionId is error {
            errors.push("Petition ID is required");
        } else {
            int|error idInt = petitionId.ensureType(int);
            if idInt is error || idInt <= 0 {
                errors.push("Petition ID must be a positive integer");
            }
        }
        
        json|error activityType = activityData.activity_type;
        if activityType is json {
            string|error typeStr = activityType.ensureType(string);
            if typeStr is string {
                string[] validActivityTypes = ["SIGNATURE", "COMMENT", "SHARE", "REPORT", "VIEW"];
                boolean isValidActivityType = false;
                foreach string validType in validActivityTypes {
                    if typeStr == validType {
                        isValidActivityType = true;
                        break;
                    }
                }
                if !isValidActivityType {
                    errors.push("Invalid activity type. Allowed values: SIGNATURE, COMMENT, SHARE, REPORT, VIEW");
                }
            }
        }
        
        json|error signatureCount = activityData.signature_count;
        if signatureCount is json {
            int|error countInt = signatureCount.ensureType(int);
            if countInt is error || countInt <= 0 {
                errors.push("Signature count must be a positive integer");
            }
        }
        
        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }
}
