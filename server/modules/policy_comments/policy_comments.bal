import ballerina/http;
import ballerina/log;
import ballerina/time;

# Policy Comments service for handling policy comment operations
public class PolicyCommentsService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize policy comments service
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
        log:printInfo("✅ Policy Comments service initialized");
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

    # Get all policy comments
    #
    # + return - Policy comments list or error
    public function getAllPolicyComments() returns json|error {
        do {
            map<string> headers = self.getHeaders();

            http:Response response = check self.supabaseClient->get("/rest/v1/policy_comments?select=*&order=created_at.desc", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get policy comments: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] comments = check result.ensureType();
            
            return {
                "success": true,
                "message": "Policy comments retrieved successfully",
                "data": comments,
                "count": comments.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get policy comments: " + e.message());
        }
    }

    # Get policy comment by ID
    #
    # + commentId - Comment ID to retrieve
    # + return - Comment data or error
    public function getPolicyCommentById(int commentId) returns json|error {
        // Validate input
        if commentId <= 0 {
            return error("Comment ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/policy_comments?comment_id=eq." + commentId.toString();
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get policy comment: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] comments = check result.ensureType();
            
            if comments.length() > 0 {
                return {
                    "success": true,
                    "message": "Policy comment retrieved successfully",
                    "data": comments[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Policy comment not found");
            }
            
        } on fail error e {
            return error("Failed to get policy comment: " + e.message());
        }
    }

    # Create a new policy comment
    #
    # + comment - Comment text
    # + userId - User ID who made the comment
    # + policyId - Policy ID being commented on
    # + replyId - Reply ID if this is a reply to another comment
    # + replyComment - Reply comment text
    # + return - Created comment data or error
    public function createPolicyComment(string comment, int userId, int policyId, int? replyId = (), string? replyComment = ()) returns json|error {
        do {
            // Validate input
            if comment.trim().length() == 0 {
                return error("Comment cannot be empty");
            }
            
            if userId <= 0 {
                return error("User ID must be a positive integer");
            }
            
            if policyId <= 0 {
                return error("Policy ID must be a positive integer");
            }
            
            json payload = {
                "comment": comment,
                "user_id": userId,
                "policy_id": policyId
            };
            
            // Add optional fields
            if replyId is int && replyId > 0 {
                payload = check payload.mergeJson({"reply_id": replyId});
            }
            
            if replyComment is string && replyComment.trim().length() > 0 {
                payload = check payload.mergeJson({"reply_comment": replyComment});
            }

            map<string> headers = self.getHeaders(true); // Include Prefer header
            http:Response response = check self.supabaseClient->post("/rest/v1/policy_comments", payload, headers);
            
            if response.statusCode == 201 {
                // Check if response has content
                json|error result = response.getJsonPayload();
                if result is error {
                    return {
                        "success": true,
                        "message": "Policy comment created successfully",
                        "data": payload,
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] comments = check result.ensureType();
                    if comments.length() > 0 {
                        return {
                            "success": true,
                            "message": "Policy comment created successfully",
                            "data": comments[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "Policy comment created successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                return error("Failed to create policy comment: " + response.statusCode.toString());
            }

        } on fail error e {
            return error("Failed to create policy comment: " + e.message());
        }
    }

    # Update policy comment by ID
    #
    # + commentId - Comment ID to update
    # + updateData - Update data as JSON
    # + return - Updated comment data or error
    public function updatePolicyComment(int commentId, json updateData) returns json|error {
        // Validate input
        if commentId <= 0 {
            return error("Comment ID must be a positive integer");
        }
        
        do {
            map<json> payloadMap = {};
            
            // Build update payload from provided data
            json|error comment = updateData.comment;
            if comment is json {
                string|error commentStr = comment.ensureType(string);
                if commentStr is string && commentStr.trim().length() > 0 {
                    payloadMap["comment"] = commentStr;
                } else {
                    return error("Comment cannot be empty");
                }
            }
            
            json|error replyComment = updateData.reply_comment;
            if replyComment is json {
                string|error replyStr = replyComment.ensureType(string);
                if replyStr is string {
                    payloadMap["reply_comment"] = replyStr;
                }
            }
            
            json|error likes = updateData.likes;
            if likes is json {
                int|error likesInt = likes.ensureType(int);
                if likesInt is int && likesInt >= 0 {
                    payloadMap["likes"] = likesInt;
                } else {
                    return error("Likes must be non-negative");
                }
            }
            
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            payloadMap["updated_at"] = "now()";
            json payload = payloadMap;
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/policy_comments?comment_id=eq." + commentId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to update policy comment: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] comments = check result.ensureType();
            
            if comments.length() > 0 {
                return {
                    "success": true,
                    "message": "Policy comment updated successfully",
                    "data": comments[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Policy comment not found");
            }
            
        } on fail error e {
            return error("Failed to update policy comment: " + e.message());
        }
    }

    # Delete policy comment by ID
    #
    # + commentId - Comment ID to delete
    # + return - Success message or error
    public function deletePolicyComment(int commentId) returns json|error {
        // Validate input
        if commentId <= 0 {
            return error("Comment ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/policy_comments?comment_id=eq." + commentId.toString();
            http:Response response = check self.supabaseClient->delete(endpoint, (), headers);
            
            if response.statusCode != 200 && response.statusCode != 204 {
                return error("Failed to delete policy comment: " + response.statusCode.toString());
            }
            
            return {
                "success": true,
                "message": "Policy comment deleted successfully",
                "commentId": commentId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to delete policy comment: " + e.message());
        }
    }

    # Get comments by user ID
    #
    # + userId - User ID to filter by
    # + return - Comments list or error
    public function getCommentsByUserId(int userId) returns json|error {
        // Validate input
        if userId <= 0 {
            return error("User ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/policy_comments?user_id=eq." + userId.toString() + "&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get comments by user ID: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] comments = check result.ensureType();
            
            return {
                "success": true,
                "message": "Comments by user retrieved successfully",
                "data": comments,
                "count": comments.length(),
                "userId": userId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get comments by user ID: " + e.message());
        }
    }

    # Get comments by policy ID
    #
    # + policyId - Policy ID to filter by
    # + return - Comments list or error
    public function getCommentsByPolicyId(int policyId) returns json|error {
        // Validate input
        if policyId <= 0 {
            return error("Policy ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/policy_comments?policy_id=eq." + policyId.toString() + "&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get comments by policy ID: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] comments = check result.ensureType();
            
            return {
                "success": true,
                "message": "Comments by policy retrieved successfully",
                "data": comments,
                "count": comments.length(),
                "policyId": policyId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get comments by policy ID: " + e.message());
        }
    }

    # Get replies to a specific comment
    #
    # + commentId - Comment ID to get replies for
    # + return - Replies list or error
    public function getRepliesByCommentId(int commentId) returns json|error {
        // Validate input
        if commentId <= 0 {
            return error("Comment ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/policy_comments?reply_id=eq." + commentId.toString() + "&select=*&order=created_at.asc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get replies by comment ID: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] replies = check result.ensureType();
            
            return {
                "success": true,
                "message": "Replies retrieved successfully",
                "data": replies,
                "count": replies.length(),
                "parentCommentId": commentId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get replies by comment ID: " + e.message());
        }
    }

    # Search comments by keyword
    #
    # + keyword - Keyword to search for in comment text
    # + return - Matching comments or error
    public function searchComments(string keyword) returns json|error {
        // Validate input
        if keyword.trim().length() == 0 {
            return error("Search keyword cannot be empty");
        }
        
        do {
            // Search in both comment and reply_comment fields
            string searchTerm = "%" + keyword + "%";
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/policy_comments?or=(comment.ilike." + searchTerm + ",reply_comment.ilike." + searchTerm + ")&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to search comments: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] comments = check result.ensureType();
            
            return {
                "success": true,
                "message": "Comments search completed successfully",
                "data": comments,
                "count": comments.length(),
                "keyword": keyword,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to search comments: " + e.message());
        }
    }

    # Get comment statistics
    #
    # + return - Comment statistics or error
    public function getCommentStatistics() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get("/rest/v1/policy_comments?select=*", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get comment statistics: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] comments = check result.ensureType();
            
            // Initialize counters
            map<int> userCounts = {};
            map<int> policyCounts = {};
            int totalComments = comments.length();
            int totalLikes = 0;
            int repliesCount = 0;
            
            foreach json comment in comments {
                if comment is map<json> {
                    // Count by user
                    json|error userId = comment["user_id"];
                    if userId is json {
                        string userStr = userId.toString();
                        if userCounts.hasKey(userStr) {
                            userCounts[userStr] = userCounts.get(userStr) + 1;
                        } else {
                            userCounts[userStr] = 1;
                        }
                    }
                    
                    // Count by policy
                    json|error policyId = comment["policy_id"];
                    if policyId is json {
                        string policyStr = policyId.toString();
                        if policyCounts.hasKey(policyStr) {
                            policyCounts[policyStr] = policyCounts.get(policyStr) + 1;
                        } else {
                            policyCounts[policyStr] = 1;
                        }
                    }
                    
                    // Count likes
                    json|error likes = comment["likes"];
                    if likes is json {
                        int|error likesInt = likes.ensureType(int);
                        if likesInt is int {
                            totalLikes += likesInt;
                        }
                    }
                    
                    // Count replies
                    json|error replyId = comment["reply_id"];
                    if replyId is json && replyId != () {
                        repliesCount += 1;
                    }
                }
            }
            
            decimal avgLikesPerComment = totalComments > 0 ? (totalLikes * 1.0) / totalComments : 0.0;
            
            return {
                "success": true,
                "message": "Comment statistics retrieved successfully",
                "data": {
                    "total_comments": totalComments,
                    "total_likes": totalLikes,
                    "replies_count": repliesCount,
                    "average_likes_per_comment": avgLikesPerComment,
                    "user_activity_breakdown": userCounts,
                    "policy_engagement_breakdown": policyCounts
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get comment statistics: " + e.message());
        }
    }

    # Get recent comments (last 30 days)
    #
    # + return - Recent comments list or error
    public function getRecentComments() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/policy_comments?created_at=gte." + "now() - interval '30 days'" + "&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get recent comments: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] comments = check result.ensureType();
            
            return {
                "success": true,
                "message": "Recent comments retrieved successfully",
                "data": comments,
                "count": comments.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get recent comments: " + e.message());
        }
    }

    # Like a comment (increment likes count)
    #
    # + commentId - Comment ID to like
    # + return - Updated comment data or error
    public function likeComment(int commentId) returns json|error {
        // Validate input
        if commentId <= 0 {
            return error("Comment ID must be a positive integer");
        }
        
        do {
            // First get current comment data
            json commentResult = check self.getPolicyCommentById(commentId);
            if commentResult is map<json> {
                json|error commentData = commentResult["data"];
                if commentData is map<json> {
                    json|error currentLikes = commentData["likes"];
                    int newLikes = 1; // Default to 1 if no current likes
                    if currentLikes is json {
                        int|error likesInt = currentLikes.ensureType(int);
                        if likesInt is int {
                            newLikes = likesInt + 1;
                        }
                    }
                    
                    // Update likes count
                    json payload = {
                        "likes": newLikes,
                        "updated_at": "now()"
                    };
                    
                    map<string> headers = self.getHeaders(true); // Include Prefer header
                    string endpoint = "/rest/v1/policy_comments?comment_id=eq." + commentId.toString();
                    http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
                    
                    if response.statusCode != 200 {
                        return error("Failed to like comment: " + response.statusCode.toString());
                    }
                    
                    json result = check response.getJsonPayload();
                    json[] comments = check result.ensureType();
                    
                    if comments.length() > 0 {
                        return {
                            "success": true,
                            "message": "Comment liked successfully",
                            "data": comments[0],
                            "newLikesCount": newLikes,
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return error("Comment not found");
                    }
                } else {
                    return error("Invalid comment data format");
                }
            } else {
                return error("Failed to retrieve comment data");
            }
            
        } on fail error e {
            return error("Failed to like comment: " + e.message());
        }
    }

    # Get top liked comments
    #
    # + limit - Number of top comments to retrieve
    # + return - Top liked comments list or error
    public function getTopLikedComments(int 'limit = 10) returns json|error {
        // Validate input
        if 'limit <= 0 {
            return error("Limit must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/policy_comments?select=*&order=likes.desc&limit=" + 'limit.toString();
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get top liked comments: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] comments = check result.ensureType();
            
            return {
                "success": true,
                "message": "Top liked comments retrieved successfully",
                "data": comments,
                "count": comments.length(),
                "limit": 'limit,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get top liked comments: " + e.message());
        }
    }

    # Validate policy comment data
    #
    # + commentData - Comment data to validate
    # + return - Validation result
    public function validatePolicyCommentData(json commentData) returns json {
        string[] errors = [];
        
        json|error comment = commentData.comment;
        if comment is error || comment.toString().trim().length() == 0 {
            errors.push("Comment is required and cannot be empty");
        }
        
        json|error userId = commentData.user_id;
        if userId is error {
            errors.push("User ID is required");
        } else {
            int|error userIdInt = userId.ensureType(int);
            if userIdInt is error || userIdInt <= 0 {
                errors.push("User ID must be a positive integer");
            }
        }
        
        json|error policyId = commentData.policy_id;
        if policyId is error {
            errors.push("Policy ID is required");
        } else {
            int|error policyIdInt = policyId.ensureType(int);
            if policyIdInt is error || policyIdInt <= 0 {
                errors.push("Policy ID must be a positive integer");
            }
        }
        
        json|error likes = commentData.likes;
        if likes is json {
            int|error likesInt = likes.ensureType(int);
            if likesInt is error || likesInt < 0 {
                errors.push("Likes must be a non-negative integer");
            }
        }
        
        json|error replyId = commentData.reply_id;
        if replyId is json {
            int|error replyIdInt = replyId.ensureType(int);
            if replyIdInt is error || replyIdInt <= 0 {
                errors.push("Reply ID must be a positive integer");
            }
        }
        
        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }
}
