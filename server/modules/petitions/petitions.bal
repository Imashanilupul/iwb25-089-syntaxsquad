import ballerina/http;
import ballerina/log;
import ballerina/time;

# Petitions service for handling petition operations
public class PetitionsService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize petitions service
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
        log:printInfo("✅ Petitions service initialized");
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

    # Get all petitions
    #
    # + return - Petitions list or error
    public function getAllPetitions() returns json|error {
        do {
            map<string> headers = self.getHeaders();

            http:Response response = check self.supabaseClient->get("/rest/v1/petitions?select=*&order=created_at.desc", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get petitions: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] petitions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Petitions retrieved successfully",
                "data": petitions,
                "count": petitions.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get petitions: " + e.message());
        }
    }

    # Get petition by ID
    #
    # + petitionId - Petition ID to retrieve
    # + return - Petition data or error
    public function getPetitionById(int petitionId) returns json|error {
        // Validate input
        if petitionId <= 0 {
            return error("Petition ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petitions?id=eq." + petitionId.toString();
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get petition: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] petitions = check result.ensureType();
            
            if petitions.length() > 0 {
                return {
                    "success": true,
                    "message": "Petition retrieved successfully",
                    "data": petitions[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Petition not found");
            }
            
        } on fail error e {
            return error("Failed to get petition: " + e.message());
        }
    }

    # Create a new petition
    #
    # + title - Petition title
    # + description - Petition description
    # + requiredSignatureCount - Required signature count
    # + creatorId - Creator user ID
    # + deadline - Petition deadline
    # + return - Created petition data or error
    public function createPetition(string title, string description, int requiredSignatureCount, int? creatorId = (), string? deadline = ()) returns json|error {
        do {
            // Validate input
            if title.trim().length() == 0 {
                return error("Petition title cannot be empty");
            }
            
            if description.trim().length() == 0 {
                return error("Petition description cannot be empty");
            }
            
            if requiredSignatureCount <= 0 {
                return error("Required signature count must be positive");
            }
            
            json payload = {
                "title": title,
                "description": description,
                "required_signature_count": requiredSignatureCount
            };
            
            // Add optional fields
            if creatorId is int {
                payload = check payload.mergeJson({"creator_id": creatorId});
            }
            
            if deadline is string && deadline.trim().length() > 0 {
                payload = check payload.mergeJson({"deadline": deadline});
            }

            map<string> headers = self.getHeaders(true); // Include Prefer header
            http:Response response = check self.supabaseClient->post("/rest/v1/petitions", payload, headers);
            
            if response.statusCode == 201 {
                // Check if response has content
                json|error result = response.getJsonPayload();
                if result is error {
                    return {
                        "success": true,
                        "message": "Petition created successfully",
                        "data": payload,
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] petitions = check result.ensureType();
                    if petitions.length() > 0 {
                        return {
                            "success": true,
                            "message": "Petition created successfully",
                            "data": petitions[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "Petition created successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                return error("Failed to create petition: " + response.statusCode.toString());
            }

        } on fail error e {
            return error("Failed to create petition: " + e.message());
        }
    }

    # Update petition by ID
    #
    # + petitionId - Petition ID to update
    # + updateData - Update data as JSON
    # + return - Updated petition data or error
    public function updatePetition(int petitionId, json updateData) returns json|error {
        // Validate input
        if petitionId <= 0 {
            return error("Petition ID must be a positive integer");
        }
        
        do {
            map<json> payloadMap = {};
            
            // Build update payload from provided data
            json|error title = updateData.title;
            if title is json {
                string|error titleStr = title.ensureType(string);
                if titleStr is string && titleStr.trim().length() > 0 {
                    payloadMap["title"] = titleStr;
                } else {
                    return error("Petition title cannot be empty");
                }
            }
            
            json|error description = updateData.description;
            if description is json {
                string|error descStr = description.ensureType(string);
                if descStr is string && descStr.trim().length() > 0 {
                    payloadMap["description"] = descStr;
                } else {
                    return error("Petition description cannot be empty");
                }
            }
            
            json|error requiredSignatureCount = updateData.required_signature_count;
            if requiredSignatureCount is json {
                int|error countInt = requiredSignatureCount.ensureType(int);
                if countInt is int && countInt > 0 {
                    payloadMap["required_signature_count"] = countInt;
                } else {
                    return error("Required signature count must be positive");
                }
            }
            
            json|error signatureCount = updateData.signature_count;
            if signatureCount is json {
                int|error countInt = signatureCount.ensureType(int);
                if countInt is int && countInt >= 0 {
                    payloadMap["signature_count"] = countInt;
                } else {
                    return error("Signature count must be non-negative");
                }
            }
            
            json|error status = updateData.status;
            if status is json {
                string|error statusStr = status.ensureType(string);
                if statusStr is string {
                    string[] validStatuses = ["ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"];
                    boolean isValidStatus = false;
                    foreach string validStatus in validStatuses {
                        if statusStr == validStatus {
                            isValidStatus = true;
                            break;
                        }
                    }
                    if isValidStatus {
                        payloadMap["status"] = statusStr;
                    } else {
                        return error("Invalid status. Allowed values: ACTIVE, COMPLETED, EXPIRED, CANCELLED");
                    }
                }
            }
            
            json|error deadline = updateData.deadline;
            if deadline is json {
                string|error deadlineStr = deadline.ensureType(string);
                if deadlineStr is string {
                    payloadMap["deadline"] = deadlineStr;
                }
            }
            
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            payloadMap["updated_at"] = "now()";
            json payload = payloadMap;
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/petitions?id=eq." + petitionId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to update petition: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] petitions = check result.ensureType();
            
            if petitions.length() > 0 {
                return {
                    "success": true,
                    "message": "Petition updated successfully",
                    "data": petitions[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Petition not found");
            }
            
        } on fail error e {
            return error("Failed to update petition: " + e.message());
        }
    }

    # Delete petition by ID
    #
    # + petitionId - Petition ID to delete
    # + return - Success message or error
    public function deletePetition(int petitionId) returns json|error {
        // Validate input
        if petitionId <= 0 {
            return error("Petition ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petitions?id=eq." + petitionId.toString();
            http:Response response = check self.supabaseClient->delete(endpoint, (), headers);
            
            if response.statusCode != 200 && response.statusCode != 204 {
                return error("Failed to delete petition: " + response.statusCode.toString());
            }
            
            return {
                "success": true,
                "message": "Petition deleted successfully",
                "petitionId": petitionId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to delete petition: " + e.message());
        }
    }

    # Get petitions by creator
    #
    # + creatorId - Creator ID to filter by
    # + return - Petitions list or error
    public function getPetitionsByCreator(int creatorId) returns json|error {
        // Validate input
        if creatorId <= 0 {
            return error("Creator ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petitions?creator_id=eq." + creatorId.toString() + "&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get petitions by creator: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] petitions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Petitions by creator retrieved successfully",
                "data": petitions,
                "count": petitions.length(),
                "creatorId": creatorId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get petitions by creator: " + e.message());
        }
    }

    # Get petitions by status
    #
    # + status - Status to filter by
    # + return - Petitions list or error
    public function getPetitionsByStatus(string status) returns json|error {
        // Validate status
        string[] validStatuses = ["ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"];
        boolean isValidStatus = false;
        foreach string validStatus in validStatuses {
            if status == validStatus {
                isValidStatus = true;
                break;
            }
        }
        if !isValidStatus {
            return error("Invalid status. Allowed values: ACTIVE, COMPLETED, EXPIRED, CANCELLED");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petitions?status=eq." + status + "&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get petitions by status: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] petitions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Petitions by status retrieved successfully",
                "data": petitions,
                "count": petitions.length(),
                "status": status,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get petitions by status: " + e.message());
        }
    }

    # Search petitions by keyword
    #
    # + keyword - Keyword to search for in title or description
    # + return - Matching petitions or error
    public function searchPetitions(string keyword) returns json|error {
        // Validate input
        if keyword.trim().length() == 0 {
            return error("Search keyword cannot be empty");
        }
        
        do {
            // Search in both title and description fields
            string searchTerm = "%" + keyword + "%";
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petitions?or=(title.ilike." + searchTerm + ",description.ilike." + searchTerm + ")&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to search petitions: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] petitions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Petitions search completed successfully",
                "data": petitions,
                "count": petitions.length(),
                "keyword": keyword,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to search petitions: " + e.message());
        }
    }

    # Get petition statistics
    #
    # + return - Petition statistics or error
    public function getPetitionStatistics() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get("/rest/v1/petitions?select=*", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get petition statistics: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] petitions = check result.ensureType();
            
            // Initialize counters
            map<int> statusCounts = {};
            int totalPetitions = petitions.length();
            int totalSignatures = 0;
            int completedPetitions = 0;
            
            foreach json petition in petitions {
                if petition is map<json> {
                    // Count by status
                    json|error status = petition["status"];
                    if status is json {
                        string statusStr = status.toString();
                        if statusCounts.hasKey(statusStr) {
                            statusCounts[statusStr] = statusCounts.get(statusStr) + 1;
                        } else {
                            statusCounts[statusStr] = 1;
                        }
                        
                        if statusStr == "COMPLETED" {
                            completedPetitions += 1;
                        }
                    }
                    
                    // Count signatures
                    json|error signatureCount = petition["signature_count"];
                    if signatureCount is json {
                        int|error countInt = signatureCount.ensureType(int);
                        if countInt is int {
                            totalSignatures += countInt;
                        }
                    }
                }
            }
            
            decimal completionRate = totalPetitions > 0 ? (completedPetitions * 100.0) / totalPetitions : 0.0;
            
            return {
                "success": true,
                "message": "Petition statistics retrieved successfully",
                "data": {
                    "total_petitions": totalPetitions,
                    "total_signatures": totalSignatures,
                    "completed_petitions": completedPetitions,
                    "completion_rate_percentage": completionRate,
                    "status_breakdown": statusCounts
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get petition statistics: " + e.message());
        }
    }

    # Get active petitions
    #
    # + return - Active petitions list or error
    public function getActivePetitions() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/petitions?status=eq.ACTIVE&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get active petitions: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] petitions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Active petitions retrieved successfully",
                "data": petitions,
                "count": petitions.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get active petitions: " + e.message());
        }
    }

    # Sign a petition (increment signature count) - only once per user
    #
    # + petitionId - Petition ID to sign
    # + userId - User ID who is signing
    # + return - Updated petition data or error
    public function signPetition(int petitionId, int? userId = ()) returns json|error {
        // Validate input
        if petitionId <= 0 {
            return error("Petition ID must be a positive integer");
        }
        
        do {
            // If userId is provided, check if user has already signed this petition
            if userId is int {
                // Check if user has already signed this petition
                string checkEndpoint = "/rest/v1/petition_activities?petition_id=eq." + petitionId.toString() + "&user_id=eq." + userId.toString() + "&activity_type=eq.SIGNATURE";
                map<string> headers = self.getHeaders();
                http:Response checkResponse = check self.supabaseClient->get(checkEndpoint, headers);
                
                if checkResponse.statusCode == 200 {
                    json checkResult = check checkResponse.getJsonPayload();
                    json[] existingSignatures = check checkResult.ensureType();
                    
                    if existingSignatures.length() > 0 {
                        return {
                            "success": false,
                            "message": "User has already signed this petition",
                            "error": "ALREADY_SIGNED",
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            }
            
            // First get current petition data
            json petitionResult = check self.getPetitionById(petitionId);
            if petitionResult is map<json> {
                json|error petitionData = petitionResult["data"];
                if petitionData is map<json> {
                    json|error currentCount = petitionData["signature_count"];
                    int newCount = 1; // Default to 1 if no current count
                    if currentCount is json {
                        int|error countInt = currentCount.ensureType(int);
                        if countInt is int {
                            newCount = countInt + 1;
                        }
                    }
                    
                    // Update signature count
                    json payload = {
                        "signature_count": newCount,
                        "updated_at": "now()"
                    };
                    
                    map<string> headers = self.getHeaders(true); // Include Prefer header
                    string endpoint = "/rest/v1/petitions?id=eq." + petitionId.toString();
                    http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
                    
                    if response.statusCode != 200 {
                        return error("Failed to sign petition: " + response.statusCode.toString());
                    }
                    
                    json result = check response.getJsonPayload();
                    json[] petitions = check result.ensureType();
                    
                    if petitions.length() > 0 {
                        // If userId is provided, create activity record
                        if userId is int {
                            // Create petition activity record
                            json activityPayload = {
                                "petition_id": petitionId,
                                "user_id": userId,
                                "activity_type": "SIGNATURE",
                                "signature_count": 1,
                                "activity_date": "now()"
                            };
                            
                            map<string> activityHeaders = self.getHeaders(true);
                            http:Response activityResponse = check self.supabaseClient->post("/rest/v1/petition_activities", activityPayload, activityHeaders);
                            
                            if activityResponse.statusCode != 201 {
                                log:printWarn("Failed to create petition activity record: " + activityResponse.statusCode.toString());
                            }
                        }
                        
                        return {
                            "success": true,
                            "message": "Petition signed successfully",
                            "data": petitions[0],
                            "newSignatureCount": newCount,
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return error("Petition not found");
                    }
                } else {
                    return error("Invalid petition data format");
                }
            } else {
                return error("Failed to retrieve petition data");
            }
            
        } on fail error e {
            return error("Failed to sign petition: " + e.message());
        }
    }

    # Check if a user has already signed a petition
    #
    # + petitionId - Petition ID to check
    # + userId - User ID to check
    # + return - True if user has already signed, false otherwise
    public function hasUserSignedPetition(int petitionId, int userId) returns boolean|error {
        do {
            string endpoint = "/rest/v1/petition_activities?petition_id=eq." + petitionId.toString() + "&user_id=eq." + userId.toString() + "&activity_type=eq.SIGNATURE";
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode == 200 {
                json result = check response.getJsonPayload();
                json[] activities = check result.ensureType();
                return activities.length() > 0;
            } else {
                return false;
            }
        } on fail error e {
            log:printError("Error checking if user has signed petition: " + e.message());
            return false;
        }
    }

    # Validate petition data
    #
    # + petitionData - Petition data to validate
    # + return - Validation result
    public function validatePetitionData(json petitionData) returns json {
        string[] errors = [];
        
        json|error title = petitionData.title;
        if title is error || title.toString().trim().length() == 0 {
            errors.push("Petition title is required and cannot be empty");
        }
        
        json|error description = petitionData.description;
        if description is error || description.toString().trim().length() == 0 {
            errors.push("Petition description is required and cannot be empty");
        }
        
        json|error requiredSignatureCount = petitionData.required_signature_count;
        if requiredSignatureCount is error {
            errors.push("Required signature count is required");
        } else {
            int|error countInt = requiredSignatureCount.ensureType(int);
            if countInt is error || countInt <= 0 {
                errors.push("Required signature count must be a positive integer");
            }
        }
        
        json|error status = petitionData.status;
        if status is json {
            string|error statusStr = status.ensureType(string);
            if statusStr is string {
                string[] validStatuses = ["ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"];
                boolean isValidStatus = false;
                foreach string validStatus in validStatuses {
                    if statusStr == validStatus {
                        isValidStatus = true;
                        break;
                    }
                }
                if !isValidStatus {
                    errors.push("Invalid status. Allowed values: ACTIVE, COMPLETED, EXPIRED, CANCELLED");
                }
            }
        }
        
        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }

    # Confirm petition draft with blockchain data
    #
    # + petitionId - Petition ID to confirm
    # + txHash - Blockchain transaction hash
    # + blockNumber - Block number
    # + blockchainPetitionId - Blockchain petition ID
    # + titleCid - IPFS CID for title
    # + descriptionCid - IPFS CID for description
    # + return - Confirmed petition data or error
    public function confirmPetitionDraft(int petitionId, string? txHash, int? blockNumber, string? blockchainPetitionId, string? titleCid, string? descriptionCid) returns json|error {
        do {
            map<string> headers = self.getHeaders(true);
            
            // Prepare update data
            map<json> updateData = {};
            
            if txHash is string {
                updateData["blockchain_tx_hash"] = txHash;
            }
            if blockNumber is int {
                updateData["blockchain_block_number"] = blockNumber;
            }
            if blockchainPetitionId is string {
                updateData["blockchain_petition_id"] = blockchainPetitionId;
            }
            if titleCid is string {
                updateData["title_cid"] = titleCid;
            }
            if descriptionCid is string {
                updateData["description_cid"] = descriptionCid;
            }
            
            updateData["status"] = "ACTIVE";
            updateData["confirmed_at"] = time:utcToString(time:utcNow());
            
            string endpoint = "/rest/v1/petitions?id=eq." + petitionId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, updateData, headers);
            
            if response.statusCode != 200 {
                return error("Failed to confirm petition draft: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] petitions = check result.ensureType();
            
            if petitions.length() > 0 {
                return {
                    "success": true,
                    "message": "Petition draft confirmed successfully",
                    "data": petitions[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Petition not found");
            }
            
        } on fail error e {
            return error("Failed to confirm petition draft: " + e.message());
        }
    }
}
