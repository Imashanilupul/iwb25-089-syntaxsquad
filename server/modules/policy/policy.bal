import ballerina/http;
import ballerina/log;
import ballerina/time;

# Add the correct import or type definition for DatabaseClient
# For example, if using a module named db, import it:
# import db;



# Policies service for handling policy operations
public class PoliciesService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize policies service
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
        log:printInfo("✅ Policies service initialized");
    }

    # Get all policies
    #
    # + return - Policies list or error
    public function getAllPolicies() returns json|error {
        do {
            json result = check self.supabaseClient->get("/policies?select=*&order=created_time.desc");
            json[] policies = check result.ensureType();
            
            return {
                "success": true,
                "message": "Policies retrieved successfully",
                "data": policies,
                "count": policies.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get policies: " + e.message());
        }
    }

    # Get policy by ID
    #
    # + policyId - Policy ID to retrieve
    # + return - Policy data or error
    public function getPolicyById(int policyId) returns json|error {
        // Validate input
        if policyId <= 0 {
            return error("Policy ID must be a positive integer");
        }
        
        do {
            string endpoint = "/policies?id=eq." + policyId.toString();
            json result = check self.supabaseClient->get(endpoint);
            json[] policies = check result.ensureType();
            
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
            
        } on fail error e {
            return error("Failed to get policy: " + e.message());
        }
    }

    # Create a new policy
    #
    # + name - Policy name
    # + description - Policy description
    # + viewFullPolicy - Full policy document
    # + ministry - Ministry responsible for the policy
    # + status - Policy status (optional, defaults to 'DRAFT')
    # + effectiveDate - Effective date (optional)
    # + return - Created policy data or error
    public function createPolicy(string name, string description, string viewFullPolicy, string ministry, string status = "DRAFT", string? effectiveDate = ()) returns json|error {
        do {
            // Validate input
            if name.trim().length() == 0 {
                return error("Policy name cannot be empty");
            }
            
            if description.trim().length() == 0 {
                return error("Policy description cannot be empty");
            }
            
            if viewFullPolicy.trim().length() == 0 {
                return error("Policy full document cannot be empty");
            }
            
            if ministry.trim().length() == 0 {
                return error("Ministry cannot be empty");
            }
            
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
                return error("Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED");
            }
            
            json payload = {
                "name": name,
                "description": description,
                "view_full_policy": viewFullPolicy,
                "ministry": ministry,
                "status": status
            };
            
            // Add effective_date if provided
            if effectiveDate is string {
                payload = check payload.mergeJson({"effective_date": effectiveDate});
            }
            
            json result = check self.supabaseClient->post("/policies", payload);
            json[] policies = check result.ensureType();
            
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
            
        } on fail error e {
            return error("Failed to create policy: " + e.message());
        }
    }

    # Update policy by ID
    #
    # + policyId - Policy ID to update
    # + updateData - Update data as JSON
    # + return - Updated policy data or error
    public function updatePolicy(int policyId, json updateData) returns json|error {
        // Validate input
        if policyId <= 0 {
            return error("Policy ID must be a positive integer");
        }
        
        do {
            map<json> payloadMap = {};
            
            // Build update payload from provided data
            json|error name = updateData.name;
            if name is json {
                string|error nameStr = name.ensureType(string);
                if nameStr is string && nameStr.trim().length() > 0 {
                    payloadMap["name"] = nameStr;
                } else {
                    return error("Policy name cannot be empty");
                }
            }
            
            json|error description = updateData.description;
            if description is json {
                string|error descStr = description.ensureType(string);
                if descStr is string && descStr.trim().length() > 0 {
                    payloadMap["description"] = descStr;
                } else {
                    return error("Policy description cannot be empty");
                }
            }
            
            json|error viewFullPolicy = updateData.view_full_policy;
            if viewFullPolicy is json {
                string|error fullPolicyStr = viewFullPolicy.ensureType(string);
                if fullPolicyStr is string && fullPolicyStr.trim().length() > 0 {
                    payloadMap["view_full_policy"] = fullPolicyStr;
                } else {
                    return error("Policy full document cannot be empty");
                }
            }
            
            json|error ministry = updateData.ministry;
            if ministry is json {
                string|error ministryStr = ministry.ensureType(string);
                if ministryStr is string && ministryStr.trim().length() > 0 {
                    payloadMap["ministry"] = ministryStr;
                } else {
                    return error("Ministry cannot be empty");
                }
            }
            
            json|error status = updateData.status;
            if status is json {
                string|error statusStr = status.ensureType(string);
                if statusStr is string {
                    string[] validStatuses = ["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "INACTIVE", "ARCHIVED"];
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
                        return error("Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED");
                    }
                }
            }
            
            json|error effectiveDate = updateData.effective_date;
            if effectiveDate is json {
                string|error dateStr = effectiveDate.ensureType(string);
                if dateStr is string {
                    payloadMap["effective_date"] = dateStr;
                }
            }
            
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            payloadMap["updated_at"] = "now()";
            json payload = payloadMap;
            
            string endpoint = "/policies?id=eq." + policyId.toString();
            json result = check self.supabaseClient->patch(endpoint, payload);
            json[] policies = check result.ensureType();
            
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
            
        } on fail error e {
            return error("Failed to update policy: " + e.message());
        }
    }

    # Delete policy by ID
    #
    # + policyId - Policy ID to delete
    # + return - Success message or error
    public function deletePolicy(int policyId) returns json|error {
        // Validate input
        if policyId <= 0 {
            return error("Policy ID must be a positive integer");
        }
        
        do {
            string endpoint = "/policies?id=eq." + policyId.toString();
            json result = check self.supabaseClient->delete(endpoint);
            
            return {
                "success": true,
                "message": "Policy deleted successfully",
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to delete policy: " + e.message());
        }
    }

    # Get policies by status
    #
    # + status - Policy status to filter by
    # + return - Policies list or error
    public function getPoliciesByStatus(string status) returns json|error {
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
            return error("Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED");
        }
        
        do {
            string endpoint = "/policies?status=eq." + status + "&select=*&order=created_time.desc";
            json result = check self.supabaseClient->get(endpoint);
            json[] policies = check result.ensureType();
            
            return {
                "success": true,
                "message": "Policies retrieved successfully by status",
                "data": policies,
                "count": policies.length(),
                "status": status,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get policies by status: " + e.message());
        }
    }

    # Get policies by ministry
    #
    # + ministry - Ministry name to filter by
    # + return - Policies list or error
    public function getPoliciesByMinistry(string ministry) returns json|error {
        // Validate input
        if ministry.trim().length() == 0 {
            return error("Ministry name cannot be empty");
        }
        
        do {
            string endpoint = "/policies?ministry=eq." + ministry + "&select=*&order=created_time.desc";
            json result = check self.supabaseClient->get(endpoint);
            json[] policies = check result.ensureType();
            
            return {
                "success": true,
                "message": "Policies retrieved successfully by ministry",
                "data": policies,
                "count": policies.length(),
                "ministry": ministry,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get policies by ministry: " + e.message());
        }
    }

    # Validate policy data
    #
    # + policyData - Policy data to validate
    # + return - Validation result
    public function validatePolicyData(json policyData) returns json {
        string[] errors = [];
        
        json|error name = policyData.name;
        if name is error || name.toString().trim().length() == 0 {
            errors.push("Policy name is required and cannot be empty");
        }
        
        json|error description = policyData.description;
        if description is error || description.toString().trim().length() == 0 {
            errors.push("Policy description is required and cannot be empty");
        }
        
        json|error viewFullPolicy = policyData.view_full_policy;
        if viewFullPolicy is error || viewFullPolicy.toString().trim().length() == 0 {
            errors.push("Policy full document is required and cannot be empty");
        }
        
        json|error ministry = policyData.ministry;
        if ministry is error || ministry.toString().trim().length() == 0 {
            errors.push("Ministry is required and cannot be empty");
        }
        
        json|error status = policyData.status;
        if status is json {
            string|error statusStr = status.ensureType(string);
            if statusStr is string {
                string[] validStatuses = ["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "INACTIVE", "ARCHIVED"];
                boolean isValidStatus = false;
                foreach string validStatus in validStatuses {
                    if statusStr == validStatus {
                        isValidStatus = true;
                        break;
                    }
                }
                if !isValidStatus {
                    errors.push("Invalid status. Allowed values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED");
                }
            }
        }
        
        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }

    # Get policy statistics
    #
    # + return - Policy statistics or error
    public function getPolicyStatistics() returns json|error {
        do {
            json result = check self.supabaseClient->get("/policies?select=*");
            json[] policies = check result.ensureType();
            
            // Initialize counters
            map<int> statusCounts = {};
            map<int> ministryCounts = {};
            int totalPolicies = policies.length();
            
            foreach json policy in policies {
                if policy is map<json> {
                    // Count by status
                    json|error statusJson = policy["status"];
                    if statusJson is json {
                        string|error status = statusJson.ensureType(string);
                        if status is string {
                            int currentCount = statusCounts[status] ?: 0;
                            statusCounts[status] = currentCount + 1;
                        }
                    }
                    
                    // Count by ministry
                    json|error ministryJson = policy["ministry"];
                    if ministryJson is json {
                        string|error ministry = ministryJson.ensureType(string);
                        if ministry is string {
                            int currentCount = ministryCounts[ministry] ?: 0;
                            ministryCounts[ministry] = currentCount + 1;
                        }
                    }
                }
            }
            
            return {
                "success": true,
                "message": "Policy statistics retrieved successfully",
                "statistics": {
                    "total_policies": totalPolicies,
                    "status_distribution": statusCounts,
                    "ministry_distribution": ministryCounts
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get policy statistics: " + e.message());
        }
    }

    # Search policies by keyword
    #
    # + keyword - Keyword to search for in policy name or description
    # + return - Matching policies or error
    public function searchPolicies(string keyword) returns json|error {
        // Validate input
        if keyword.trim().length() == 0 {
            return error("Search keyword cannot be empty");
        }
        
        do {
            // Search in both name and description fields
            string searchTerm = "%" + keyword + "%";
            string endpoint = "/policies?or=(name.ilike." + searchTerm + ",description.ilike." + searchTerm + ")&select=*&order=created_time.desc";
            json result = check self.supabaseClient->get(endpoint);
            json[] policies = check result.ensureType();
            
            return {
                "success": true,
                "message": "Policy search completed successfully",
                "data": policies,
                "count": policies.length(),
                "keyword": keyword,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to search policies: " + e.message());
        }
    }

    # Get active policies (status = 'ACTIVE')
    #
    # + return - Active policies list or error
    public function getActivePolicies() returns json|error {
        do {
            string endpoint = "/policies?status=eq.ACTIVE&select=*&order=created_time.desc";
            json result = check self.supabaseClient->get(endpoint);
            json[] policies = check result.ensureType();
            
            return {
                "success": true,
                "message": "Active policies retrieved successfully",
                "data": policies,
                "count": policies.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get active policies: " + e.message());
        }
    }

    # Get draft policies (status = 'DRAFT')
    #
    # + return - Draft policies list or error
    public function getDraftPolicies() returns json|error {
        do {
            string endpoint = "/policies?status=eq.DRAFT&select=*&order=created_time.desc";
            json result = check self.supabaseClient->get(endpoint);
            json[] policies = check result.ensureType();
            
            return {
                "success": true,
                "message": "Draft policies retrieved successfully",
                "data": policies,
                "count": policies.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get draft policies: " + e.message());
        }
    }

    # Get policies with effective dates in the future
    #
    # + return - Future effective policies list or error
    public function getFutureEffectivePolicies() returns json|error {
        do {
            string endpoint = "/policies?effective_date=gt.now()&select=*&order=effective_date.asc";
            json result = check self.supabaseClient->get(endpoint);
            json[] policies = check result.ensureType();
            
            return {
                "success": true,
                "message": "Future effective policies retrieved successfully",
                "data": policies,
                "count": policies.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get future effective policies: " + e.message());
        }
    }
}
