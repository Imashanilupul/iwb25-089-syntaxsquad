import ballerina/http;
import ballerina/log;
import ballerina/time;

# Proposals service for handling proposal operations
public class ProposalsService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize proposals service
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
        log:printInfo("✅ Proposals service initialized");
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

    # Get all proposals
    #
    # + return - Proposals list or error
    public function getAllProposals() returns json|error {
        do {
            map<string> headers = self.getHeaders();

            http:Response response = check self.supabaseClient->get("/rest/v1/proposals?select=*&order=created_at.desc", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get proposals: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            return {
                "success": true,
                "message": "Proposals retrieved successfully",
                "data": proposals,
                "count": proposals.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get proposals: " + e.message());
        }
    }

    # Get proposal by ID
    #
    # + proposalId - Proposal ID to retrieve
    # + return - Proposal data or error
    public function getProposalById(int proposalId) returns json|error {
        // Validate input
        if proposalId <= 0 {
            return error("Proposal ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/proposals?id=eq." + proposalId.toString();
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get proposal: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            if proposals.length() > 0 {
                return {
                    "success": true,
                    "message": "Proposal retrieved successfully",
                    "data": proposals[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Proposal not found");
            }
            
        } on fail error e {
            return error("Failed to get proposal: " + e.message());
        }
    }

    # Create a new proposal
    #
    # + title - Proposal title
    # + shortDescription - Short description of the proposal
    # + descriptionInDetails - Detailed description of the proposal
    # + expiredDate - Expiry date for voting
    # + categoryId - Category ID (optional)
    # + createdBy - User ID who created the proposal (optional)
    # + activeStatus - Active status (optional, defaults to true)
    # + yesVotes - Initial yes votes (optional, defaults to 0)
    # + noVotes - Initial no votes (optional, defaults to 0)
    # + return - Created proposal data or error
    public function createProposal(string title, string shortDescription, string descriptionInDetails, string expiredDate, 
                                   int? categoryId = (), int? createdBy = (), boolean activeStatus = true, 
                                   int yesVotes = 0, int noVotes = 0) returns json|error {
        do {
            // Validate input
            if title.trim().length() == 0 {
                return error("Proposal title cannot be empty");
            }
            
            if shortDescription.trim().length() == 0 {
                return error("Short description cannot be empty");
            }
            
            if descriptionInDetails.trim().length() == 0 {
                return error("Detailed description cannot be empty");
            }
            
            if expiredDate.trim().length() == 0 {
                return error("Expiry date cannot be empty");
            }
            
            // Validate vote counts
            if yesVotes < 0 {
                return error("Yes votes cannot be negative");
            }
            
            if noVotes < 0 {
                return error("No votes cannot be negative");
            }
            
            json payload = {
                "title": title,
                "short_description": shortDescription,
                "description_in_details": descriptionInDetails,
                "expired_date": expiredDate,
                "active_status": activeStatus,
                "yes_votes": yesVotes,
                "no_votes": noVotes
            };
            
            // Add optional fields if provided
            if categoryId is int {
                payload = check payload.mergeJson({"category_id": categoryId});
            }
            
            if createdBy is int {
                payload = check payload.mergeJson({"created_by": createdBy});
            }

            map<string> headers = self.getHeaders(true); // Include Prefer header
            http:Response response = check self.supabaseClient->post("/rest/v1/proposals", payload, headers);
            
            if response.statusCode == 201 {
                // Check if response has content
                json|error result = response.getJsonPayload();
                if result is error {
                    // If no content returned, that's also success for Supabase
                    return {
                        "success": true,
                        "message": "Proposal created successfully",
                        "data": payload,
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] proposals = check result.ensureType();
                    if proposals.length() > 0 {
                        return {
                            "success": true,
                            "message": "Proposal created successfully",
                            "data": proposals[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "Proposal created successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                return error("Failed to create proposal: " + response.statusCode.toString());
            }

        } on fail error e {
            return error("Failed to create proposal: " + e.message());
        }
    }

    # Update proposal by ID
    #
    # + proposalId - Proposal ID to update
    # + updateData - Update data as JSON
    # + return - Updated proposal data or error
    public function updateProposal(int proposalId, json updateData) returns json|error {
        // Validate input
        if proposalId <= 0 {
            return error("Proposal ID must be a positive integer");
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
                    return error("Title cannot be empty");
                }
            }
            
            json|error shortDescription = updateData.shortDescription;
            if shortDescription is json {
                string|error shortDescStr = shortDescription.ensureType(string);
                if shortDescStr is string && shortDescStr.trim().length() > 0 {
                    payloadMap["short_description"] = shortDescStr;
                } else {
                    return error("Short description cannot be empty");
                }
            }
            
            json|error descriptionInDetails = updateData.descriptionInDetails;
            if descriptionInDetails is json {
                string|error detailsStr = descriptionInDetails.ensureType(string);
                if detailsStr is string && detailsStr.trim().length() > 0 {
                    payloadMap["description_in_details"] = detailsStr;
                } else {
                    return error("Detailed description cannot be empty");
                }
            }
            
            json|error expiredDate = updateData.expiredDate;
            if expiredDate is json {
                string|error dateStr = expiredDate.ensureType(string);
                if dateStr is string && dateStr.trim().length() > 0 {
                    payloadMap["expired_date"] = dateStr;
                } else {
                    return error("Expiry date cannot be empty");
                }
            }
            
            json|error activeStatus = updateData.activeStatus;
            if activeStatus is json {
                boolean|error statusBool = activeStatus.ensureType(boolean);
                if statusBool is boolean {
                    payloadMap["active_status"] = statusBool;
                }
            }
            
            json|error yesVotes = updateData.yesVotes;
            if yesVotes is json {
                int|error yesVotesInt = yesVotes.ensureType(int);
                if yesVotesInt is int && yesVotesInt >= 0 {
                    payloadMap["yes_votes"] = yesVotesInt;
                } else {
                    return error("Yes votes must be non-negative");
                }
            }
            
            json|error noVotes = updateData.noVotes;
            if noVotes is json {
                int|error noVotesInt = noVotes.ensureType(int);
                if noVotesInt is int && noVotesInt >= 0 {
                    payloadMap["no_votes"] = noVotesInt;
                } else {
                    return error("No votes must be non-negative");
                }
            }
            
            json|error categoryId = updateData.categoryId;
            if categoryId is json {
                int|error categoryIdInt = categoryId.ensureType(int);
                if categoryIdInt is int {
                    payloadMap["category_id"] = categoryIdInt;
                }
            }
            
            json|error createdBy = updateData.createdBy;
            if createdBy is json {
                int|error createdByInt = createdBy.ensureType(int);
                if createdByInt is int {
                    payloadMap["created_by"] = createdByInt;
                }
            }
            
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            payloadMap["updated_at"] = "now()";
            json payload = payloadMap;
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/proposals?id=eq." + proposalId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to update proposal: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            if proposals.length() > 0 {
                return {
                    "success": true,
                    "message": "Proposal updated successfully",
                    "data": proposals[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Proposal not found or no changes made");
            }
            
        } on fail error e {
            return error("Failed to update proposal: " + e.message());
        }
    }

    # Delete proposal by ID
    #
    # + proposalId - Proposal ID to delete
    # + return - Success message or error
    public function deleteProposal(int proposalId) returns json|error {
        // Validate input
        if proposalId <= 0 {
            return error("Proposal ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/proposals?id=eq." + proposalId.toString();
            http:Response response = check self.supabaseClient->delete(endpoint, (), headers);
            
            if response.statusCode != 200 && response.statusCode != 204 {
                return error("Failed to delete proposal: " + response.statusCode.toString());
            }
            
            return {
                "success": true,
                "message": "Proposal deleted successfully",
                "proposalId": proposalId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to delete proposal: " + e.message());
        }
    }

    # Get proposals by category
    #
    # + categoryId - Category ID to filter by
    # + return - Proposals list or error
    public function getProposalsByCategory(int categoryId) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/proposals?category_id=eq." + categoryId.toString() + "&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get proposals by category: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            return {
                "success": true,
                "message": "Proposals by category retrieved successfully",
                "data": proposals,
                "count": proposals.length(),
                "categoryId": categoryId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get proposals by category: " + e.message());
        }
    }

    # Get proposals by status
    #
    # + activeStatus - Active status to filter by
    # + return - Proposals list or error
    public function getProposalsByStatus(boolean activeStatus) returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/proposals?active_status=eq." + activeStatus.toString() + "&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get proposals by status: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            return {
                "success": true,
                "message": "Proposals by status retrieved successfully",
                "data": proposals,
                "count": proposals.length(),
                "activeStatus": activeStatus,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get proposals by status: " + e.message());
        }
    }

    # Get proposals by creator
    #
    # + createdBy - User ID who created the proposals
    # + return - Proposals list or error
    public function getProposalsByCreator(int createdBy) returns json|error {
        // Validate input
        if createdBy <= 0 {
            return error("Creator ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/proposals?created_by=eq." + createdBy.toString() + "&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get proposals by creator: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            return {
                "success": true,
                "message": "Proposals by creator retrieved successfully",
                "data": proposals,
                "count": proposals.length(),
                "createdBy": createdBy,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get proposals by creator: " + e.message());
        }
    }

    # Search proposals by keyword
    #
    # + keyword - Keyword to search for in title or descriptions
    # + return - Matching proposals or error
    public function searchProposals(string keyword) returns json|error {
        // Validate input
        if keyword.trim().length() == 0 {
            return error("Search keyword cannot be empty");
        }
        
        do {
            // Search in title, short_description, and description_in_details fields
            string searchTerm = "%" + keyword + "%";
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/proposals?or=(title.ilike." + searchTerm + ",short_description.ilike." + searchTerm + ",description_in_details.ilike." + searchTerm + ")&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to search proposals: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            return {
                "success": true,
                "message": "Proposal search completed successfully",
                "data": proposals,
                "count": proposals.length(),
                "keyword": keyword,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to search proposals: " + e.message());
        }
    }

    # Get proposal statistics
    #
    # + return - Proposal statistics or error
    public function getProposalStatistics() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get("/rest/v1/proposals?select=*", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get proposal statistics: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            // Initialize counters
            int totalProposals = proposals.length();
            int activeProposals = 0;
            int totalYesVotes = 0;
            int totalNoVotes = 0;
            map<int> categoryStats = {};
            
            foreach json proposal in proposals {
                if proposal is map<json> {
                    // Count active/inactive
                    boolean|error active = proposal["active_status"].ensureType(boolean);
                    if active is boolean && active {
                        activeProposals += 1;
                    }
                    
                    // Count votes
                    int|error yesVotes = proposal["yes_votes"].ensureType(int);
                    if yesVotes is int {
                        totalYesVotes += yesVotes;
                    }
                    
                    int|error noVotes = proposal["no_votes"].ensureType(int);
                    if noVotes is int {
                        totalNoVotes += noVotes;
                    }
                    
                    // Category statistics
                    json|error categoryId = proposal["category_id"];
                    if categoryId is int {
                        if categoryStats.hasKey(categoryId.toString()) {
                            categoryStats[categoryId.toString()] = categoryStats.get(categoryId.toString()) + 1;
                        } else {
                            categoryStats[categoryId.toString()] = 1;
                        }
                    }
                }
            }
            
            int totalVotes = totalYesVotes + totalNoVotes;
            decimal averageParticipation = totalProposals > 0 ? <decimal>totalVotes / <decimal>totalProposals : 0d;
            
            return {
                "success": true,
                "message": "Proposal statistics retrieved successfully",
                "data": {
                    "total_proposals": totalProposals,
                    "active_proposals": activeProposals,
                    "inactive_proposals": totalProposals - activeProposals,
                    "total_yes_votes": totalYesVotes,
                    "total_no_votes": totalNoVotes,
                    "total_votes": totalVotes,
                    "average_participation": averageParticipation,
                    "category_distribution": categoryStats
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get proposal statistics: " + e.message());
        }
    }

    # Get active proposals (not expired and active_status = true)
    #
    # + return - Active proposals list or error
    public function getActiveProposals() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/proposals?active_status=eq.true&expired_date=gt.now()&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get active proposals: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            return {
                "success": true,
                "message": "Active proposals retrieved successfully",
                "data": proposals,
                "count": proposals.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get active proposals: " + e.message());
        }
    }

    # Get expired proposals
    #
    # + return - Expired proposals list or error
    public function getExpiredProposals() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/proposals?expired_date=lt.now()&select=*&order=expired_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get expired proposals: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            return {
                "success": true,
                "message": "Expired proposals retrieved successfully",
                "data": proposals,
                "count": proposals.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get expired proposals: " + e.message());
        }
    }

    # Vote on a proposal with proper vote change handling
    #
    # + proposalId - Proposal ID to vote on
    # + voteType - Type of vote ("yes" or "no")
    # + walletAddress - Wallet address of the voter
    # + userId - User ID (optional)
    # + return - Vote result data or error
    public function voteOnProposal(int proposalId, string voteType, string? walletAddress = (), int? userId = ()) returns json|error {
        // Validate input
        if proposalId <= 0 {
            return error("Proposal ID must be a positive integer");
        }
        
        if voteType != "yes" && voteType != "no" {
            return error("Vote type must be 'yes' or 'no'");
        }
        
        do {
            log:printInfo("🗳️ Processing vote: " + voteType + " for proposal ID: " + proposalId.toString());
            
            if walletAddress is string && walletAddress.trim().length() > 0 {
                log:printInfo("👤 Voter wallet: " + walletAddress);
                
                // Use the new database function for proper vote handling
                map<string> headers = self.getHeaders();
                
                // Prepare the function call with correct parameter names
                json functionPayload = {
                    "proposal_id_param": proposalId,
                    "wallet_address_param": walletAddress,
                    "vote_type_param": voteType
                };
                
                if userId is int {
                    functionPayload = check functionPayload.mergeJson({"user_id_param": userId});
                }
                
                log:printInfo("📤 Calling database function with payload: " + functionPayload.toJsonString());
                
                // Call the database function
                string endpoint = "/rest/v1/rpc/record_proposal_vote";
                http:Response response = check self.supabaseClient->post(endpoint, functionPayload, headers);
                
                if response.statusCode != 200 {
                    string errorBody = "Unknown error";
                    string|error textPayload = response.getTextPayload();
                    if textPayload is string {
                        errorBody = textPayload;
                    }
                    log:printError("❌ Database function call failed with status: " + response.statusCode.toString() + ", body: " + errorBody);
                    return error("Failed to record vote: HTTP " + response.statusCode.toString() + " - " + errorBody);
                }
                
                json result = check response.getJsonPayload();
                log:printInfo("📥 Database function response: " + result.toJsonString());
                
                // The response should be an array of objects from the function
                if result is json[] {
                    json[] functionResults = result;
                    
                    if functionResults.length() > 0 {
                        map<json> voteResult = check functionResults[0].ensureType();
                        boolean success = check voteResult["success"].ensureType(boolean);
                        
                        if success {
                            string message = check voteResult["message"].ensureType(string);
                            string previousVote = check voteResult["previous_vote"].ensureType(string);
                            string newVote = check voteResult["new_vote"].ensureType(string);
                            int yesVotes = check voteResult["yes_votes"].ensureType(int);
                            int noVotes = check voteResult["no_votes"].ensureType(int);
                            
                            log:printInfo("✅ Vote recorded successfully");
                            log:printInfo("📊 Vote change: " + previousVote + " → " + newVote);
                            log:printInfo("📊 Final counts - Yes: " + yesVotes.toString() + ", No: " + noVotes.toString());
                            
                            return {
                                "success": true,
                                "message": message,
                                "data": {
                                    "proposal_id": proposalId,
                                    "wallet_address": walletAddress,
                                    "previous_vote": previousVote,
                                    "new_vote": newVote,
                                    "vote_change": previousVote != newVote && previousVote != "none",
                                    "yes_votes": yesVotes,
                                    "no_votes": noVotes
                                },
                                "timestamp": time:utcNow()[0]
                            };
                        } else {
                            string errorMessage = check voteResult["message"].ensureType(string);
                            log:printError("❌ Vote recording failed: " + errorMessage);
                            return error(errorMessage);
                        }
                    } else {
                        log:printError("❌ No result returned from database function");
                        return error("No result returned from vote recording function");
                    }
                } else {
                    log:printError("❌ Unexpected response format from database function");
                    log:printError("Response: " + result.toJsonString());
                    return error("Unexpected response format from database function");
                }
                
            } else {
                // Fallback to old method if no wallet address provided
                log:printWarn("⚠️ No wallet address provided, using fallback method");
                return self.voteOnProposalFallback(proposalId, voteType);
            }
            
        } on fail error e {
            log:printError("❌ Vote processing failed: " + e.message());
            return error("Failed to vote on proposal: " + e.message());
        }
    }

    # Fallback voting method (old implementation for compatibility)
    #
    # + proposalId - Proposal ID to vote on
    # + voteType - Type of vote ("yes" or "no")
    # + return - Updated proposal data or error
    public function voteOnProposalFallback(int proposalId, string voteType) returns json|error {
        // Validate input
        if proposalId <= 0 {
            return error("Proposal ID must be a positive integer");
        }
        
        if voteType != "yes" && voteType != "no" {
            return error("Vote type must be 'yes' or 'no'");
        }
        
        do {
            log:printInfo("🗳️ Processing fallback vote: " + voteType + " for proposal ID: " + proposalId.toString());
            
            // First get the current proposal to increment the vote count
            json currentProposal = check self.getProposalById(proposalId);
            map<json> proposalData = check currentProposal.data.ensureType();
            
            int currentYesVotes = check proposalData["yes_votes"].ensureType(int);
            int currentNoVotes = check proposalData["no_votes"].ensureType(int);
            
            log:printInfo("📊 Current votes - Yes: " + currentYesVotes.toString() + ", No: " + currentNoVotes.toString());
            
            map<json> updatePayload = {};
            
            if voteType == "yes" {
                updatePayload["yes_votes"] = currentYesVotes + 1;
                log:printInfo("➕ Incrementing YES votes to: " + (currentYesVotes + 1).toString());
            } else {
                updatePayload["no_votes"] = currentNoVotes + 1;
                log:printInfo("➕ Incrementing NO votes to: " + (currentNoVotes + 1).toString());
            }
            
            updatePayload["updated_at"] = "now()";
            json payload = updatePayload;
            
            map<string> headers = self.getHeaders(true);
            string endpoint = "/rest/v1/proposals?id=eq." + proposalId.toString();
            
            log:printInfo("🔄 Sending database update request to: " + endpoint);
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                log:printError("❌ Database update failed with status: " + response.statusCode.toString());
                return error("Failed to vote on proposal: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] proposals = check result.ensureType();
            
            if proposals.length() > 0 {
                log:printInfo("✅ Vote recorded successfully in database");
                
                // Log the updated vote counts for verification
                map<json> updatedProposal = check proposals[0].ensureType();
                int updatedYesVotes = check updatedProposal["yes_votes"].ensureType(int);
                int updatedNoVotes = check updatedProposal["no_votes"].ensureType(int);
                log:printInfo("📊 Updated votes - Yes: " + updatedYesVotes.toString() + ", No: " + updatedNoVotes.toString());
                
                return {
                    "success": true,
                    "message": "Vote recorded successfully",
                    "data": proposals[0],
                    "voteType": voteType,
                    "previousVotes": {
                        "yes": currentYesVotes,
                        "no": currentNoVotes
                    },
                    "newVotes": {
                        "yes": updatedYesVotes,
                        "no": updatedNoVotes
                    },
                    "timestamp": time:utcNow()[0]
                };
            } else {
                log:printError("❌ No proposal returned after update");
                return error("Proposal not found");
            }
            
        } on fail error e {
            log:printError("❌ Vote processing failed: " + e.message());
            return error("Failed to vote on proposal: " + e.message());
        }
    }

    # Get user's current vote on a proposal
    #
    # + proposalId - Proposal ID
    # + walletAddress - Wallet address of the user
    # + return - Current vote type or error
    public function getUserVote(int proposalId, string walletAddress) returns json|error {
        do {
            map<string> headers = self.getHeaders();
            
            json functionPayload = {
                "proposal_id_param": proposalId,
                "wallet_address_param": walletAddress
            };
            
            string endpoint = "/rest/v1/rpc/get_user_proposal_vote";
            http:Response response = check self.supabaseClient->post(endpoint, functionPayload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get user vote: " + response.statusCode.toString());
            }
            
            string currentVote = check response.getTextPayload();
            
            return {
                "success": true,
                "data": {
                    "proposal_id": proposalId,
                    "wallet_address": walletAddress,
                    "current_vote": currentVote
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get user vote: " + e.message());
        }
    }

    # Validate proposal data
    #
    # + proposalData - Proposal data to validate
    # + return - Validation result
    public function validateProposalData(json proposalData) returns json {
        string[] errors = [];
        
        json|error title = proposalData.title;
        if title is error || title.toString().trim().length() == 0 {
            errors.push("Title is required and cannot be empty");
        }
        
        json|error shortDescription = proposalData.shortDescription;
        if shortDescription is error || shortDescription.toString().trim().length() == 0 {
            errors.push("Short description is required and cannot be empty");
        }
        
        json|error descriptionInDetails = proposalData.descriptionInDetails;
        if descriptionInDetails is error || descriptionInDetails.toString().trim().length() == 0 {
            errors.push("Detailed description is required and cannot be empty");
        }
        
        json|error expiredDate = proposalData.expiredDate;
        if expiredDate is error || expiredDate.toString().trim().length() == 0 {
            errors.push("Expiry date is required and cannot be empty");
        }
        
        json|error yesVotes = proposalData.yesVotes;
        if yesVotes is json {
            int|error yesVotesInt = yesVotes.ensureType(int);
            if yesVotesInt is error || yesVotesInt < 0 {
                errors.push("Yes votes must be a non-negative integer");
            }
        }
        
        json|error noVotes = proposalData.noVotes;
        if noVotes is json {
            int|error noVotesInt = noVotes.ensureType(int);
            if noVotesInt is error || noVotesInt < 0 {
                errors.push("No votes must be a non-negative integer");
            }
        }
        
        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }
}
