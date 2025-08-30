import ballerina/http;
import ballerina/log;
import ballerina/time;
import ballerina/regex;

# Reports service for handling report operations
public class ReportsService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize reports service
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
        log:printInfo("✅ Reports service initialized");
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

    # Normalize a raw DB report row to API expected fields
    private function normalizeReport(json raw) returns json|error {
        if raw is map<json> {
            map<json> out = {};
            // id -> report_id
            json|error idj = raw["id"];
            if idj is json {
                int|error idnum = idj.ensureType(int);
                if idnum is int {
                    out["report_id"] = idnum;
                }
            }
            // title / report_title
            json|error titlej = raw["title"];
            if titlej is json {
                string|error ts = titlej.ensureType(string);
                if ts is string {
                    out["report_title"] = ts;
                }
            }
            if out["report_title"] == null {
                json|error rtj = raw["report_title"];
                if rtj is json {
                    string|error rts = rtj.ensureType(string);
                    if rts is string {
                        out["report_title"] = rts;
                    }
                }
            }
            // description
            if raw.hasKey("description") {
                out["description"] = raw["description"];
            }
            // priority
            if raw.hasKey("priority") {
                out["priority"] = raw["priority"];
            }
            // assigned_to
            if raw.hasKey("assigned_to") {
                out["assigned_to"] = raw["assigned_to"];
            }
            // created_at -> created_time
            if raw.hasKey("created_at") {
                out["created_time"] = raw["created_at"];
            }
            // last_updated_time
            if raw.hasKey("last_updated_time") {
                out["last_updated_time"] = raw["last_updated_time"];
            }
            // resolved_time
            if raw.hasKey("resolved_time") {
                out["resolved_time"] = raw["resolved_time"];
            }
            // upvotes/downvotes -> likes/dislikes
            if raw.hasKey("upvotes") {
                out["likes"] = raw["upvotes"];
            }
            if raw.hasKey("downvotes") {
                out["dislikes"] = raw["downvotes"];
            }
            // removed/resolved_status
            if raw.hasKey("removed") {
                out["removed"] = raw["removed"];
            }
            if raw.hasKey("resolved_status") {
                out["resolved_status"] = raw["resolved_status"];
            }

            return out;
        }
        return error("Invalid report row format");
    }

    # Get all reports
    #
    # + return - Reports list or error
    public function getAllReports() returns json|error {
        do {
            map<string> headers = self.getHeaders();

            http:Response response = check self.supabaseClient->get("/rest/v1/reports?removed=eq.false&select=*&order=created_at.desc", headers);

            if response.statusCode != 200 {
                string|error errorBody = response.getTextPayload();
                log:printError("Supabase error body: " + (errorBody is string ? errorBody : "(no body)"));
                return error("Failed to get reports: " + response.statusCode.toString());
            }

            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();

            // Normalize DB columns to API expected fields
            json[] normalized = [];
            foreach json r in reports {
                json nr = check self.normalizeReport(r);
                normalized.push(nr);
            }

            return {
                "success": true,
                "message": "Reports retrieved successfully",
                "data": normalized,
                "count": normalized.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get reports: " + e.message());
        }
    }

    # Get report by ID
    #
    # + reportId - Report ID to retrieve
    # + return - Report data or error
    public function getReportById(int reportId) returns json|error {
        // Validate input
        if reportId <= 0 {
            return error("Report ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/reports?id=eq." + reportId.toString() + "&removed=eq.false";
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get report: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();

            if reports.length() > 0 {
                json normalized = check self.normalizeReport(reports[0]);
                return {
                    "success": true,
                    "message": "Report retrieved successfully",
                    "data": normalized,
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Report not found");
            }
            
        } on fail error e {
            return error("Failed to get report: " + e.message());
        }
    }

    # Create a new report
    #
    # + reportTitle - Report title
    # + evidenceHash - Evidence hash for the report
    # + description - Report description
    # + priority - Report priority (LOW, MEDIUM, HIGH, CRITICAL)
    # + assignedTo - Person assigned to handle the report
    # + userId - User ID who created the report
    # + walletAddress - Wallet address of the user who created the report
    # + blockchainTxHash - Optional blockchain transaction hash to store
    # + blockchainBlockNumber - Optional blockchain block number
    # + blockchainReportId - Optional ID assigned by the blockchain for the report
    # + titleCid - Optional IPFS CID for the title
    # + descriptionCid - Optional IPFS CID for the description
    # + evidenceHashCid - Optional IPFS CID for the evidence hash
    # + return - Created report data or error
    public function createReport(string reportTitle, string? evidenceHash = (), string? description = (), string priority = "MEDIUM", string? assignedTo = (), int? userId = (), string? walletAddress = (), string? blockchainTxHash = (), int? blockchainBlockNumber = (), string? blockchainReportId = (), string? titleCid = (), string? descriptionCid = (), string? evidenceHashCid = ()) returns json|error {
        do {
            // Validate input
            if reportTitle.trim().length() == 0 {
                return error("Report title cannot be empty");
            }
            
            // Evidence hash is optional now; frontend may omit it
            
            // Validate priority
            string[] validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
            boolean isValidPriority = false;
            foreach string validPriority in validPriorities {
                if priority == validPriority {
                    isValidPriority = true;
                    break;
                }
            }
            if !isValidPriority {
                return error("Invalid priority. Allowed values: LOW, MEDIUM, HIGH, CRITICAL");
            }
            
            json payload = {
                "report_title": reportTitle,
                "priority": priority
            };
            
            // Add optional fields
            if description is string && description.trim().length() > 0 {
                payload = check payload.mergeJson({"description": description});
            }
            
            if assignedTo is string && assignedTo.trim().length() > 0 {
                payload = check payload.mergeJson({"assigned_to": assignedTo});
            }
            
            if userId is int {
                payload = check payload.mergeJson({"user_id": userId});
            }
            
            if walletAddress is string && walletAddress.trim().length() > 0 {
                payload = check payload.mergeJson({"wallet_address": walletAddress});
            }

            map<string> headers = self.getHeaders(true); // Include Prefer header
            http:Response response = check self.supabaseClient->post("/rest/v1/reports", payload, headers);
            
            if response.statusCode == 201 {
                // Check if response has content
                json|error result = response.getJsonPayload();
                if result is error {
                    return {
                        "success": true,
                        "message": "Report created successfully",
                        "data": payload,
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] reports = check result.ensureType();
                    if reports.length() > 0 {
                        return {
                            "success": true,
                            "message": "Report created successfully",
                            "data": reports[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "Report created successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                // Try to extract response body for debugging
                string|error respBody = response.getTextPayload();
                string bodyStr = respBody is string ? respBody : "(no body)";
                log:printError("Supabase create report failed: status=" + response.statusCode.toString() + " body=" + bodyStr);
                return error("Failed to create report: " + response.statusCode.toString() + " " + bodyStr);
            }

        } on fail error e {
            return error("Failed to create report: " + e.message());
        }
    }

    # Update report by ID
    #
    # + reportId - Report ID to update
    # + updateData - Update data as JSON
    # + return - Updated report data or error
    public function updateReport(int reportId, json updateData) returns json|error {
        // Validate input
        if reportId <= 0 {
            return error("Report ID must be a positive integer");
        }
        
        do {
            map<json> payloadMap = {};
            
            // Build update payload from provided data
            json|error reportTitle = updateData.report_title;
            if reportTitle is json {
                string|error titleStr = reportTitle.ensureType(string);
                if titleStr is string && titleStr.trim().length() > 0 {
                    payloadMap["report_title"] = titleStr;
                } else {
                    return error("Report title cannot be empty");
                }
            }
            
            json|error description = updateData.description;
            if description is json {
                string|error descStr = description.ensureType(string);
                if descStr is string {
                    payloadMap["description"] = descStr;
                }
            }
            
            json|error priority = updateData.priority;
            if priority is json {
                string|error priorityStr = priority.ensureType(string);
                if priorityStr is string {
                    // Validate priority
                    string[] validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
                    boolean isValidPriority = false;
                    foreach string validPriority in validPriorities {
                        if priorityStr == validPriority {
                            isValidPriority = true;
                            break;
                        }
                    }
                    if isValidPriority {
                        payloadMap["priority"] = priorityStr;
                    } else {
                        return error("Invalid priority. Allowed values: LOW, MEDIUM, HIGH, CRITICAL");
                    }
                }
            }
            
            json|error assignedTo = updateData.assigned_to;
            if assignedTo is json {
                string|error assignedStr = assignedTo.ensureType(string);
                if assignedStr is string {
                    payloadMap["assigned_to"] = assignedStr;
                }
            }
            
            json|error evidenceHash = updateData.evidence_hash;
            if evidenceHash is json {
                string|error hashStr = evidenceHash.ensureType(string);
                if hashStr is string && hashStr.trim().length() > 0 {
                    payloadMap["evidence_hash"] = hashStr;
                } else {
                    return error("Evidence hash cannot be empty");
                }
            }
            
            json|error resolvedStatus = updateData.resolved_status;
            if resolvedStatus is json {
                boolean|error statusBool = resolvedStatus.ensureType(boolean);
                if statusBool is boolean {
                    payloadMap["resolved_status"] = statusBool;
                    // Set resolved_time if marking as resolved
                    if statusBool {
                        payloadMap["resolved_time"] = "now()";
                    }
                }
            }
            
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            payloadMap["last_updated_time"] = "now()";
            json payload = payloadMap;
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/reports?report_id=eq." + reportId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to update report: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            
            if reports.length() > 0 {
                return {
                    "success": true,
                    "message": "Report updated successfully",
                    "data": reports[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Report not found");
            }
            
        } on fail error e {
            return error("Failed to update report: " + e.message());
        }
    }

    # Delete report by ID
    #
    # + reportId - Report ID to delete
    # + return - Success message or error
    public function deleteReport(int reportId) returns json|error {
        // Validate input
        if reportId <= 0 {
            return error("Report ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/reports?report_id=eq." + reportId.toString();
            http:Response response = check self.supabaseClient->delete(endpoint, (), headers);
            
            if response.statusCode != 200 && response.statusCode != 204 {
                return error("Failed to delete report: " + response.statusCode.toString());
            }
            
            return {
                "success": true,
                "message": "Report deleted successfully",
                "reportId": reportId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to delete report: " + e.message());
        }
    }

    # Get reports by user ID
    #
    # + userId - User ID to filter by
    # + return - Reports list or error
    public function getReportsByUserId(int userId) returns json|error {
        // Validate input
        if userId <= 0 {
            return error("User ID must be a positive integer");
        }
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/reports?user_id=eq." + userId.toString() + "&removed=eq.false";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            if response.statusCode != 200 {
                return error("Failed to get reports by user: " + response.statusCode.toString());
            }
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            return {
                "success": true,
                "message": "Reports retrieved successfully by user",
                "data": reports,
                "count": reports.length(),
                "userId": userId,
                "timestamp": time:utcNow()[0]
            };
        } on fail error e {
            return error("Failed to get reports by user: " + e.message());
        }
    }

    # Get reports by priority
    #
    # + priority - Priority to filter by
    # + return - Reports list or error
    public function getReportsByPriority(string priority) returns json|error {
        // Validate priority
        string[] validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        boolean isValidPriority = false;
        foreach string validPriority in validPriorities {
            if priority == validPriority {
                isValidPriority = true;
                break;
            }
        }
        if !isValidPriority {
            return error("Invalid priority. Allowed values: LOW, MEDIUM, HIGH, CRITICAL");
        }
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/reports?priority=eq." + priority + "&removed=eq.false";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            if response.statusCode != 200 {
                return error("Failed to get reports by priority: " + response.statusCode.toString());
            }
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            return {
                "success": true,
                "message": "Reports retrieved successfully by priority",
                "data": reports,
                "count": reports.length(),
                "priority": priority,
                "timestamp": time:utcNow()[0]
            };
        } on fail error e {
            return error("Failed to get reports by priority: " + e.message());
        }
    }

    # Get reports by resolved status
    #
    # + resolved - Resolved status to filter by
    # + return - Reports list or error
    public function getReportsByStatus(boolean resolved) returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/reports?resolved=eq." + resolved.toString() + "&removed=eq.false";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            if response.statusCode != 200 {
                return error("Failed to get reports by status: " + response.statusCode.toString());
            }
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            return {
                "success": true,
                "message": "Reports retrieved successfully by status",
                "data": reports,
                "count": reports.length(),
                "resolved": resolved,
                "timestamp": time:utcNow()[0]
            };
        } on fail error e {
            return error("Failed to get reports by status: " + e.message());
        }
    }

    # Get reports by evidence hash
    #
    # + evidenceHash - Evidence hash to search for
    # + return - Reports list or error
    public function getReportsByEvidenceHash(string evidenceHash) returns json|error {
        // Validate input
        if evidenceHash.trim().length() == 0 {
            return error("Evidence hash cannot be empty");
        }
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/reports?evidence_hash=eq." + evidenceHash + "&removed=eq.false";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            if response.statusCode != 200 {
                return error("Failed to get reports by evidence hash: " + response.statusCode.toString());
            }
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            return {
                "success": true,
                "message": "Reports retrieved successfully by evidence hash",
                "data": reports,
                "count": reports.length(),
                "evidenceHash": evidenceHash,
                "timestamp": time:utcNow()[0]
            };
        } on fail error e {
            return error("Failed to get reports by evidence hash: " + e.message());
        }
    }

    # Search reports by keyword
    #
    # + keyword - Keyword to search for in report title or description
    # + return - Matching reports or error
    public function searchReports(string keyword) returns json|error {
        // Validate input
        if keyword.trim().length() == 0 {
            return error("Search keyword cannot be empty");
        }
        do {
            map<string> headers = self.getHeaders();
            string searchTerm = "%" + keyword + "%";
            string endpoint = "/rest/v1/reports?or=(report_title.ilike." + searchTerm + ",description.ilike." + searchTerm + ")&removed=eq.false";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            if response.statusCode != 200 {
                return error("Failed to search reports: " + response.statusCode.toString());
            }
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            return {
                "success": true,
                "message": "Reports search completed successfully",
                "data": reports,
                "count": reports.length(),
                "keyword": keyword,
                "timestamp": time:utcNow()[0]
            };
        } on fail error e {
            return error("Failed to search reports: " + e.message());
        }
    }

    # Get report statistics
    #
    # + return - Report statistics or error
    public function getReportStatistics() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get("/rest/v1/reports?removed=eq.false&select=*", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get report statistics: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            
            // Initialize counters
            map<int> priorityCounts = {};
            int totalReports = reports.length();
            int resolvedReports = 0;
            int unresolvedReports = 0;
            
            foreach json report in reports {
                if report is map<json> {
                    // Count by priority
                    json|error priority = report["priority"];
                    if priority is json {
                        string priorityStr = priority.toString();
                        if priorityCounts.hasKey(priorityStr) {
                            priorityCounts[priorityStr] = priorityCounts.get(priorityStr) + 1;
                        } else {
                            priorityCounts[priorityStr] = 1;
                        }
                    }
                    
                    // Count by resolved status
                    json|error resolved = report["resolved_status"];
                    if resolved is json {
                        boolean|error resolvedBool = resolved.ensureType(boolean);
                        if resolvedBool is boolean {
                            if resolvedBool {
                                resolvedReports += 1;
                            } else {
                                unresolvedReports += 1;
                            }
                        }
                    }
                }
            }
            
            decimal resolutionRate = totalReports > 0 ? (resolvedReports * 100.0) / totalReports : 0.0;
            
            return {
                "success": true,
                "message": "Report statistics retrieved successfully",
                "data": {
                    "total_reports": totalReports,
                    "resolved_reports": resolvedReports,
                    "unresolved_reports": unresolvedReports,
                    "resolution_rate_percentage": resolutionRate,
                    "priority_breakdown": priorityCounts
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get report statistics: " + e.message());
        }
    }

    # Get recent reports (last 30 days)
    #
    # + return - Recent reports list or error
    public function getRecentReports() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/reports?created_at=gte." + "now() - interval '30 days'" + "&removed=eq.false&select=*&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get recent reports: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            
            return {
                "success": true,
                "message": "Recent reports retrieved successfully",
                "data": reports,
                "count": reports.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get recent reports: " + e.message());
        }
    }

    # Mark report as resolved
    #
    # + reportId - Report ID to mark as resolved
    # + return - Updated report data or error
    public function resolveReport(int reportId) returns json|error {
        // Validate input
        if reportId <= 0 {
            return error("Report ID must be a positive integer");
        }
        
        do {
            json payload = {
                "resolved_status": true,
                "resolved_time": "now()",
                "last_updated_time": "now()"
            };
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/reports?report_id=eq." + reportId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to resolve report: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            
            if reports.length() > 0 {
                return {
                    "success": true,
                    "message": "Report resolved successfully",
                    "data": reports[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Report not found");
            }
            
        } on fail error e {
            return error("Failed to resolve report: " + e.message());
        }
    }

    # Mark report as pending (unresolve)
    #
    # + reportId - Report ID to mark as pending
    # + return - Updated report data or error
    public function unresolveReport(int reportId) returns json|error {
        // Validate input
        if reportId <= 0 {
            return error("Report ID must be a positive integer");
        }
        
        do {
            json payload = {
                "resolved_status": false,
                "resolved_time": (),
                "last_updated_time": "now()"
            };
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/reports?report_id=eq." + reportId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to unresolve report: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            
            if reports.length() > 0 {
                return {
                    "success": true,
                    "message": "Report marked as pending successfully",
                    "data": reports[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Report not found");
            }
            
        } on fail error e {
            return error("Failed to unresolve report: " + e.message());
        }
    }

    # Validate report data
    #
    # + reportData - Report data to validate
    # + return - Validation result
    public function validateReportData(json reportData) returns json {
        string[] errors = [];
        
        json|error reportTitle = reportData.report_title;
        if reportTitle is error || reportTitle.toString().trim().length() == 0 {
            errors.push("Report title is required and cannot be empty");
        }
        
        json|error evidenceHash = reportData.evidence_hash;
        if evidenceHash is error || evidenceHash.toString().trim().length() == 0 {
            errors.push("Evidence hash is required and cannot be empty");
        }
        
        json|error priority = reportData.priority;
        if priority is json {
            string|error priorityStr = priority.ensureType(string);
            if priorityStr is string {
                string[] validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
                boolean isValidPriority = false;
                foreach string validPriority in validPriorities {
                    if priorityStr == validPriority {
                        isValidPriority = true;
                        break;
                    }
                }
                if !isValidPriority {
                    errors.push("Invalid priority. Allowed values: LOW, MEDIUM, HIGH, CRITICAL");
                }
            }
        }
        
        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }

    # Confirm report draft with blockchain data
    #
    # + reportId - Report ID to confirm
    # + txHash - Blockchain transaction hash
    # + blockNumber - Block number
    # + blockchainReportId - Blockchain report ID
    # + titleCid - IPFS CID for title
    # + descriptionCid - IPFS CID for description
    # + evidenceHashCid - IPFS CID for evidence hash
    # + return - Confirmed report data or error
    public function confirmReportDraft(int reportId, string? txHash, int? blockNumber, string? blockchainReportId, string? titleCid, string? descriptionCid, string? evidenceHashCid) returns json|error {
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
            if blockchainReportId is string {
                updateData["blockchain_report_id"] = blockchainReportId;
            }
            if titleCid is string {
                updateData["title_cid"] = titleCid;
            }
            if descriptionCid is string {
                updateData["description_cid"] = descriptionCid;
            }
            if evidenceHashCid is string {
                updateData["evidence_hash_cid"] = evidenceHashCid;
            }
            
            updateData["status"] = "CONFIRMED";
            updateData["confirmed_at"] = time:utcToString(time:utcNow());
            
            string endpoint = "/rest/v1/reports?id=eq." + reportId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, updateData, headers);
            
            if response.statusCode != 200 {
                return error("Failed to confirm report draft: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] reports = check result.ensureType();
            
            if reports.length() > 0 {
                return {
                    "success": true,
                    "message": "Report draft confirmed successfully",
                    "data": reports[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Report not found");
            }
            
        } on fail error e {
            return error("Failed to confirm report draft: " + e.message());
        }
    }

    # Like a report and update priority based on votes
    #
    # + reportId - Report ID to like
    # + walletAddress - User's wallet address
    # + return - Updated report data or error
    public function likeReport(int reportId, string walletAddress) returns json|error {
        do {
            // Check if user has already voted
            string? existingVote = check self.checkUserVote(reportId, walletAddress);
            
            // Get current report data
            json reportResult = check self.getReportById(reportId);
            if reportResult is map<json> {
                json|error reportData = reportResult["data"];
                if reportData is map<json> {
                    // Get current likes and dislikes
                    int currentLikes = 0;
                    int currentDislikes = 0;
                    
                    json|error likesJson = reportData["likes"];
                    if likesJson is json {
                        int|error likesInt = likesJson.ensureType(int);
                        if likesInt is int {
                            currentLikes = likesInt;
                        }
                    }
                    
                    json|error dislikesJson = reportData["dislikes"];
                    if dislikesJson is json {
                        int|error dislikesInt = dislikesJson.ensureType(int);
                        if dislikesInt is int {
                            currentDislikes = dislikesInt;
                        }
                    }
                    
                    int newLikes = currentLikes;
                    int newDislikes = currentDislikes;
                    
                    if (existingVote is string) {
                        if (existingVote == "like") {
                            return error("User has already upvoted this report");
                        } else if (existingVote == "dislike") {
                            // Change from downvote to upvote
                            newDislikes = currentDislikes - 1;
                            newLikes = currentLikes + 1;
                            check self.updateUserVote(reportId, walletAddress, "like");
                        }
                    } else {
                        // New upvote
                        newLikes = currentLikes + 1;
                        check self.recordUserVote(reportId, walletAddress, "like");
                    }
                    
                    // Calculate new priority based on votes
                    string newPriority = self.calculatePriorityFromVotes(newLikes, newDislikes);
                    
                    // Update report with new likes, dislikes and priority
                            // Map likes/dislikes to DB columns upvotes/downvotes
                            json payload = {
                                "upvotes": newLikes,
                                "downvotes": newDislikes,
                                "priority": newPriority,
                                "last_updated_time": time:utcToString(time:utcNow())
                            };

                            map<string> headers = self.getHeaders(true);
                            string endpoint = "/rest/v1/reports?id=eq." + reportId.toString();
                            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);

                            if response.statusCode != 200 {
                                // Try to extract response body for logging
                                string|error respBody = response.getTextPayload();
                                string bodyStr = respBody is string ? respBody : "(no body)";
                                log:printError("Supabase like report failed: status=" + response.statusCode.toString() + " body=" + bodyStr);

                                // If the database schema uses legacy columns 'likes'/'dislikes', retry with those keys
                                if (regex:matches(bodyStr, "dislikes") || regex:matches(bodyStr, "likes")) {
                                    log:printInfo("Retrying like update using legacy columns likes/dislikes");
                                    json altPayload = {
                                        "likes": newLikes,
                                        "dislikes": newDislikes,
                                        "priority": newPriority,
                                        "last_updated_time": time:utcToString(time:utcNow())
                                    };
                                    http:Response altResp = check self.supabaseClient->patch(endpoint, altPayload, headers);
                                    if altResp.statusCode != 200 {
                                        string|error altBody = altResp.getTextPayload();
                                        string altBodyStr = altBody is string ? altBody : "(no body)";
                                        log:printError("Supabase like report retry failed: status=" + altResp.statusCode.toString() + " body=" + altBodyStr);
                                        return error("Failed to like report after retry: " + altResp.statusCode.toString() + " " + altBodyStr);
                                    }
                                    response = altResp;
                                } else {
                                    return error("Failed to like report: " + response.statusCode.toString() + " " + bodyStr);
                                }
                            }
                    
                    json result = check response.getJsonPayload();
                    json[] reports = check result.ensureType();

                    if reports.length() > 0 {
                        // Normalize DB row to API shape before returning to client
                        json normalized = check self.normalizeReport(reports[0]);
                        return {
                            "success": true,
                            "message": "Report liked successfully",
                            "data": normalized,
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return error("Report not found");
                    }
                } else {
                    return error("Invalid report data format");
                }
            } else {
                return error("Failed to retrieve report data");
            }
        } on fail error e {
            return error("Failed to like report: " + e.message());
        }
    }

    # Dislike a report and update priority based on votes
    #
    # + reportId - Report ID to dislike
    # + walletAddress - User's wallet address
    # + return - Updated report data or error
    public function dislikeReport(int reportId, string walletAddress) returns json|error {
        do {
            // Check if user has already voted
            string? existingVote = check self.checkUserVote(reportId, walletAddress);
            
            // Get current report data
            json reportResult = check self.getReportById(reportId);
            if reportResult is map<json> {
                json|error reportData = reportResult["data"];
                if reportData is map<json> {
                    // Get current likes and dislikes
                    int currentLikes = 0;
                    int currentDislikes = 0;
                    
                    json|error likesJson = reportData["likes"];
                    if likesJson is json {
                        int|error likesInt = likesJson.ensureType(int);
                        if likesInt is int {
                            currentLikes = likesInt;
                        }
                    }
                    
                    json|error dislikesJson = reportData["dislikes"];
                    if dislikesJson is json {
                        int|error dislikesInt = dislikesJson.ensureType(int);
                        if dislikesInt is int {
                            currentDislikes = dislikesInt;
                        }
                    }
                    
                    int newLikes = currentLikes;
                    int newDislikes = currentDislikes;
                    
                    if (existingVote is string) {
                        if (existingVote == "dislike") {
                            return error("User has already downvoted this report");
                        } else if (existingVote == "like") {
                            // Change from upvote to downvote
                            newLikes = currentLikes - 1;
                            newDislikes = currentDislikes + 1;
                            check self.updateUserVote(reportId, walletAddress, "dislike");
                        }
                    } else {
                        // New downvote
                        newDislikes = currentDislikes + 1;
                        check self.recordUserVote(reportId, walletAddress, "dislike");
                    }
                    
                    // Calculate new priority based on votes
                    string newPriority = self.calculatePriorityFromVotes(newLikes, newDislikes);
                    
                    // Update report with new likes, dislikes and priority
                    // Map likes/dislikes to DB columns upvotes/downvotes
                    json payload = {
                        "upvotes": newLikes,
                        "downvotes": newDislikes,
                        "priority": newPriority,
                        "last_updated_time": time:utcToString(time:utcNow())
                    };

                    map<string> headers = self.getHeaders(true);
                    string endpoint = "/rest/v1/reports?id=eq." + reportId.toString();
                    http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);

                    if response.statusCode != 200 {
                        // Try to extract response body for logging
                        string|error respBody = response.getTextPayload();
                        string bodyStr = respBody is string ? respBody : "(no body)";
                        log:printError("Supabase dislike report failed: status=" + response.statusCode.toString() + " body=" + bodyStr);

                        // If the database schema uses legacy columns 'likes'/'dislikes', retry with those keys
                        if (regex:matches(bodyStr, "dislikes") || regex:matches(bodyStr, "likes")) {
                            log:printInfo("Retrying dislike update using legacy columns likes/dislikes");
                            json altPayload = {
                                "likes": newLikes,
                                "dislikes": newDislikes,
                                "priority": newPriority,
                                "last_updated_time": time:utcToString(time:utcNow())
                            };
                            http:Response altResp = check self.supabaseClient->patch(endpoint, altPayload, headers);
                            if altResp.statusCode != 200 {
                                string|error altBody = altResp.getTextPayload();
                                string altBodyStr = altBody is string ? altBody : "(no body)";
                                log:printError("Supabase dislike report retry failed: status=" + altResp.statusCode.toString() + " body=" + altBodyStr);
                                return error("Failed to dislike report after retry: " + altResp.statusCode.toString() + " " + altBodyStr);
                            }
                            response = altResp;
                        } else {
                            return error("Failed to dislike report: " + response.statusCode.toString() + " " + bodyStr);
                        }
                    }
                    
                    json result = check response.getJsonPayload();
                    json[] reports = check result.ensureType();

                    if reports.length() > 0 {
                        // Normalize DB row to API shape before returning to client
                        json normalized = check self.normalizeReport(reports[0]);
                        return {
                            "success": true,
                            "message": "Report disliked successfully",
                            "data": normalized,
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return error("Report not found");
                    }
                } else {
                    return error("Invalid report data format");
                }
            } else {
                return error("Failed to retrieve report data");
            }
        } on fail error e {
            return error("Failed to dislike report: " + e.message());
        }
    }

    # Calculate priority based on likes and dislikes
    #
    # + likes - Number of likes
    # + dislikes - Number of dislikes
    # + return - Calculated priority string
    private function calculatePriorityFromVotes(int likes, int dislikes) returns string {
        int netVotes = likes - dislikes;
        
        if netVotes >= 50 {
            return "CRITICAL";
        } else if netVotes >= 20 {
            return "HIGH";
        } else if netVotes >= 5 {
            return "MEDIUM";
        } else if netVotes >= 0 {
            return "MEDIUM";
        } else if netVotes >= -20 {
            return "LOW";
        } else {
            return "LOW";
        }
    }

    # Check if a user has already voted on a report
    #
    # + reportId - Report ID to check
    # + walletAddress - User's wallet address
    # + return - Vote type if exists, null if no vote, or error
    public function checkUserVote(int reportId, string walletAddress) returns string?|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/user_votes?report_id=eq." + reportId.toString() + "&wallet_address=eq." + walletAddress;
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to check user vote: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] votes = check result.ensureType();
            
            if votes.length() > 0 {
                json voteData = votes[0];
                if voteData is map<json> {
                    json|error voteType = voteData["vote_type"];
                    if voteType is json {
                        string|error voteTypeStr = voteType.ensureType(string);
                        if voteTypeStr is string {
                            return voteTypeStr;
                        }
                    }
                }
            }
            
            return ();
        } on fail error e {
            return error("Failed to check user vote: " + e.message());
        }
    }

    # Record a user's vote on a report
    #
    # + reportId - Report ID to vote on
    # + walletAddress - User's wallet address
    # + voteType - Type of vote ('upvote' or 'downvote')
    # + return - Success status or error
    private function recordUserVote(int reportId, string walletAddress, string voteType) returns error? {
        do {
            json payload = {
                "report_id": reportId,
                "wallet_address": walletAddress,
                "vote_type": voteType
            };
            
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/user_votes";
            http:Response response = check self.supabaseClient->post(endpoint, payload, headers);
            
            if response.statusCode != 201 {
                return error("Failed to record user vote: " + response.statusCode.toString());
            }
            
            return;
        } on fail error e {
            return error("Failed to record user vote: " + e.message());
        }
    }

    # Update an existing user vote
    #
    # + reportId - Report ID to update vote on
    # + walletAddress - User's wallet address
    # + newVoteType - New vote type ('upvote' or 'downvote')
    # + return - Success status or error
    private function updateUserVote(int reportId, string walletAddress, string newVoteType) returns error? {
        do {
            json payload = {
                "vote_type": newVoteType
            };
            
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/user_votes?report_id=eq." + reportId.toString() + "&wallet_address=eq." + walletAddress;
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 && response.statusCode != 204 {
                return error("Failed to update user vote: " + response.statusCode.toString());
            }
            
            return;
        } on fail error e {
            return error("Failed to update user vote: " + e.message());
        }
    }
}
