import ballerina/http;
import ballerina/log;
import ballerina/time;

# Projects service for handling project operations
public class ProjectsService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize projects service
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
        log:printInfo("✅ Projects service initialized");
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

    # Get all projects
    #
    # + return - Projects list or error
    public function getAllProjects() returns json|error {
        do {
            map<string> headers = self.getHeaders();

            http:Response response = check self.supabaseClient->get("/rest/v1/projects?select=*,categories(category_name)&order=created_at.desc", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get projects: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            return {
                "success": true,
                "message": "Projects retrieved successfully",
                "data": projects,
                "count": projects.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get projects: " + e.message());
        }
    }

    # Get project by ID
    #
    # + projectId - Project ID to retrieve
    # + return - Project data or error
    public function getProjectById(int projectId) returns json|error {
        // Validate input
        if projectId <= 0 {
            return error("Project ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/projects?project_id=eq." + projectId.toString() + "&select=*,categories(category_name)";
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get project: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            if projects.length() > 0 {
                return {
                    "success": true,
                    "message": "Project retrieved successfully",
                    "data": projects[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Project not found");
            }
            
        } on fail error e {
            return error("Failed to get project: " + e.message());
        }
    }

    # Create a new project
    #
    # + projectName - Project name
    # + state - State where project is located
    # + province - Province where project is located
    # + ministry - Ministry responsible for the project
    # + allocatedBudget - Allocated budget
    # + categoryId - Category ID (optional)
    # + spentBudget - Spent budget (optional, defaults to 0)
    # + viewDetails - Project details (optional)
    # + status - Project status (optional, defaults to 'PLANNED')
    # + return - Created project data or error
    public function createProject(string projectName, string state, string province, string ministry, decimal allocatedBudget, int? categoryId = (), decimal spentBudget = 0d, string? viewDetails = (), string status = "PLANNED") returns json|error {
        do {
            // Validate input
            if projectName.trim().length() == 0 {
                return error("Project name cannot be empty");
            }
            
            if allocatedBudget < 0d {
                return error("Allocated budget cannot be negative");
            }
            
            if spentBudget < 0d {
                return error("Spent budget cannot be negative");
            }
            
            if spentBudget > allocatedBudget {
                return error("Spent budget cannot exceed allocated budget");
            }
            
            if state.trim().length() == 0 {
                return error("State cannot be empty");
            }
            
            if province.trim().length() == 0 {
                return error("Province cannot be empty");
            }
            
            if ministry.trim().length() == 0 {
                return error("Ministry cannot be empty");
            }
            
            // Validate status
            string[] validStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"];
            boolean isValidStatus = false;
            foreach string validStatus in validStatuses {
                if status == validStatus {
                    isValidStatus = true;
                    break;
                }
            }
            if !isValidStatus {
                return error("Invalid status. Allowed values: PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED");
            }
            
            json payload = {
                "project_name": projectName,
                "allocated_budget": allocatedBudget,
                "spent_budget": spentBudget,
                "state": state,
                "province": province,
                "ministry": ministry,
                "status": status
            };
            
            // Add optional fields if provided
            if categoryId is int {
                payload = check payload.mergeJson({"category_id": categoryId});
            }
            
            if viewDetails is string {
                payload = check payload.mergeJson({"view_details": viewDetails});
            }

            map<string> headers = self.getHeaders(true); // Include Prefer header
            http:Response response = check self.supabaseClient->post("/rest/v1/projects", payload, headers);
            
            if response.statusCode == 201 {
                // Check if response has content
                json|error result = response.getJsonPayload();
                if result is error {
                    return {
                        "success": true,
                        "message": "Project created successfully",
                        "data": payload,
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] projects = check result.ensureType();
                    if projects.length() > 0 {
                        return {
                            "success": true,
                            "message": "Project created successfully",
                            "data": projects[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "Project created successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                return error("Failed to create project: " + response.statusCode.toString());
            }

        } on fail error e {
            return error("Failed to create project: " + e.message());
        }
    }

    # Update project by ID
    #
    # + projectId - Project ID to update
    # + updateData - Update data as JSON
    # + return - Updated project data or error
    public function updateProject(int projectId, json updateData) returns json|error {
        // Validate input
        if projectId <= 0 {
            return error("Project ID must be a positive integer");
        }
        
        do {
            map<json> payloadMap = {};
            
            // Build update payload from provided data
            json|error projectName = updateData.projectName;
            if projectName is json {
                string|error nameStr = projectName.ensureType(string);
                if nameStr is string && nameStr.trim().length() > 0 {
                    payloadMap["project_name"] = nameStr;
                } else {
                    return error("Project name cannot be empty");
                }
            }
            
            json|error categoryId = updateData.categoryId;
            if categoryId is json {
                int|error catId = categoryId.ensureType(int);
                if catId is int {
                    payloadMap["category_id"] = catId;
                }
            }
            
            json|error allocatedBudget = updateData.allocatedBudget;
            if allocatedBudget is json {
                decimal|error budget = allocatedBudget.ensureType(decimal);
                if budget is decimal && budget >= 0d {
                    payloadMap["allocated_budget"] = budget;
                } else {
                    return error("Allocated budget must be non-negative");
                }
            }
            
            json|error spentBudget = updateData.spentBudget;
            if spentBudget is json {
                decimal|error spent = spentBudget.ensureType(decimal);
                if spent is decimal && spent >= 0d {
                    payloadMap["spent_budget"] = spent;
                } else {
                    return error("Spent budget must be non-negative");
                }
            }
            
            json|error state = updateData.state;
            if state is json {
                string|error stateStr = state.ensureType(string);
                if stateStr is string && stateStr.trim().length() > 0 {
                    payloadMap["state"] = stateStr;
                } else {
                    return error("State cannot be empty");
                }
            }
            
            json|error province = updateData.province;
            if province is json {
                string|error provinceStr = province.ensureType(string);
                if provinceStr is string && provinceStr.trim().length() > 0 {
                    payloadMap["province"] = provinceStr;
                } else {
                    return error("Province cannot be empty");
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
            
            json|error viewDetails = updateData.viewDetails;
            if viewDetails is json {
                string|error detailsStr = viewDetails.ensureType(string);
                if detailsStr is string {
                    payloadMap["view_details"] = detailsStr;
                }
            }
            
            json|error status = updateData.status;
            if status is json {
                string|error statusStr = status.ensureType(string);
                if statusStr is string {
                    string[] validStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"];
                    boolean isValidStatus = false;
                    foreach string validStatus in validStatuses {
                        if statusStr == validStatus {
                            isValidStatus = true;
                            break;
                        }
                    }
                    if !isValidStatus {
                        return error("Invalid status. Allowed values: PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED");
                    }
                    payloadMap["status"] = statusStr;
                }
            }

            // Validate that spent doesn't exceed allocated if both are provided
            if payloadMap.hasKey("allocated_budget") && payloadMap.hasKey("spent_budget") {
                decimal allocated = check payloadMap["allocated_budget"].ensureType(decimal);
                decimal spent = check payloadMap["spent_budget"].ensureType(decimal);
                if spent > allocated {
                    return error("Spent budget cannot exceed allocated budget");
                }
            }
            
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            payloadMap["updated_at"] = "now()";
            json payload = payloadMap;
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/projects?project_id=eq." + projectId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to update project: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            if projects.length() > 0 {
                return {
                    "success": true,
                    "message": "Project updated successfully",
                    "data": projects[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return {
                    "success": true,
                    "message": "Project updated successfully",
                    "data": payload,
                    "timestamp": time:utcNow()[0]
                };
            }
            
        } on fail error e {
            return error("Failed to update project: " + e.message());
        }
    }

    # Delete project by ID
    #
    # + projectId - Project ID to delete
    # + return - Success message or error
    public function deleteProject(int projectId) returns json|error {
        // Validate input
        if projectId <= 0 {
            return error("Project ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/projects?project_id=eq." + projectId.toString();
            http:Response response = check self.supabaseClient->delete(endpoint, (), headers);
            
            if response.statusCode != 200 && response.statusCode != 204 {
                return error("Failed to delete project: " + response.statusCode.toString());
            }
            
            return {
                "success": true,
                "message": "Project deleted successfully",
                "projectId": projectId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to delete project: " + e.message());
        }
    }

    # Get projects by category
    #
    # + categoryId - Category ID to filter by
    # + return - Projects list or error
    public function getProjectsByCategory(int categoryId) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/projects?category_id=eq." + categoryId.toString() + "&select=*,categories(category_name)&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get projects by category: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            return {
                "success": true,
                "message": "Projects retrieved successfully by category",
                "data": projects,
                "count": projects.length(),
                "categoryId": categoryId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get projects by category: " + e.message());
        }
    }

    # Get projects by status
    #
    # + status - Project status to filter by
    # + return - Projects list or error
    public function getProjectsByStatus(string status) returns json|error {
        // Validate status
        string[] validStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"];
        boolean isValidStatus = false;
        foreach string validStatus in validStatuses {
            if status == validStatus {
                isValidStatus = true;
                break;
            }
        }
        if !isValidStatus {
            return error("Invalid status. Allowed values: PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/projects?status=eq." + status + "&select=*,categories(category_name)&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get projects by status: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            return {
                "success": true,
                "message": "Projects retrieved successfully by status",
                "data": projects,
                "count": projects.length(),
                "status": status,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get projects by status: " + e.message());
        }
    }

    # Get projects by ministry
    #
    # + ministry - Ministry name to filter by
    # + return - Projects list or error
    public function getProjectsByMinistry(string ministry) returns json|error {
        // Validate input
        if ministry.trim().length() == 0 {
            return error("Ministry name cannot be empty");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/projects?ministry=eq." + ministry + "&select=*,categories(category_name)&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get projects by ministry: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            return {
                "success": true,
                "message": "Projects retrieved successfully by ministry",
                "data": projects,
                "count": projects.length(),
                "ministry": ministry,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get projects by ministry: " + e.message());
        }
    }

    # Get projects by state
    #
    # + state - State name to filter by
    # + return - Projects list or error
    public function getProjectsByState(string state) returns json|error {
        // Validate input
        if state.trim().length() == 0 {
            return error("State name cannot be empty");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/projects?state=eq." + state + "&select=*,categories(category_name)&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get projects by state: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            return {
                "success": true,
                "message": "Projects retrieved successfully by state",
                "data": projects,
                "count": projects.length(),
                "state": state,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get projects by state: " + e.message());
        }
    }

    # Get projects by province
    #
    # + province - Province name to filter by
    # + return - Projects list or error
    public function getProjectsByProvince(string province) returns json|error {
        // Validate input
        if province.trim().length() == 0 {
            return error("Province name cannot be empty");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/projects?province=eq." + province + "&select=*,categories(category_name)&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get projects by province: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            return {
                "success": true,
                "message": "Projects retrieved successfully by province",
                "data": projects,
                "count": projects.length(),
                "province": province,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get projects by province: " + e.message());
        }
    }

    # Search projects by keyword
    #
    # + keyword - Keyword to search for in project name or details
    # + return - Matching projects or error
    public function searchProjects(string keyword) returns json|error {
        // Validate input
        if keyword.trim().length() == 0 {
            return error("Search keyword cannot be empty");
        }
        
        do {
            // Search in project name and view_details fields
            string searchTerm = "%" + keyword + "%";
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/projects?or=(project_name.ilike." + searchTerm + ",view_details.ilike." + searchTerm + ")&select=*,categories(category_name)&order=created_at.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to search projects: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            return {
                "success": true,
                "message": "Projects search completed successfully",
                "data": projects,
                "count": projects.length(),
                "keyword": keyword,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to search projects: " + e.message());
        }
    }

    # Get project statistics
    #
    # + return - Project statistics or error
    public function getProjectStatistics() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get("/rest/v1/projects?select=*", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get project statistics: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] projects = check result.ensureType();
            
            // Initialize counters
            map<int> statusCounts = {};
            map<int> ministryCounts = {};
            map<int> stateCounts = {};
            map<int> provinceCounts = {};
            int totalProjects = projects.length();
            decimal totalAllocatedBudget = 0d;
            decimal totalSpentBudget = 0d;
            
            foreach json project in projects {
                if project is map<json> {
                    // Count by status
                    json|error statusJson = project["status"];
                    if statusJson is json {
                        string status = statusJson.toString();
                        statusCounts[status] = (statusCounts[status] ?: 0) + 1;
                    }
                    
                    // Count by ministry
                    json|error ministryJson = project["ministry"];
                    if ministryJson is json {
                        string ministry = ministryJson.toString();
                        ministryCounts[ministry] = (ministryCounts[ministry] ?: 0) + 1;
                    }
                    
                    // Count by state
                    json|error stateJson = project["state"];
                    if stateJson is json {
                        string state = stateJson.toString();
                        stateCounts[state] = (stateCounts[state] ?: 0) + 1;
                    }
                    
                    // Count by province
                    json|error provinceJson = project["province"];
                    if provinceJson is json {
                        string province = provinceJson.toString();
                        provinceCounts[province] = (provinceCounts[province] ?: 0) + 1;
                    }
                    
                    // Sum budgets
                    json|error allocatedJson = project["allocated_budget"];
                    if allocatedJson is json {
                        decimal|error allocated = allocatedJson.ensureType(decimal);
                        if allocated is decimal {
                            totalAllocatedBudget += allocated;
                        }
                    }
                    
                    json|error spentJson = project["spent_budget"];
                    if spentJson is json {
                        decimal|error spent = spentJson.ensureType(decimal);
                        if spent is decimal {
                            totalSpentBudget += spent;
                        }
                    }
                }
            }
            
            decimal budgetUtilization = totalAllocatedBudget > 0d ? (totalSpentBudget / totalAllocatedBudget) * 100d : 0d;
            
            return {
                "success": true,
                "message": "Project statistics retrieved successfully",
                "data": {
                    "totalProjects": totalProjects,
                    "statusBreakdown": statusCounts,
                    "ministryBreakdown": ministryCounts,
                    "stateBreakdown": stateCounts,
                    "provinceBreakdown": provinceCounts,
                    "budgetSummary": {
                        "totalAllocatedBudget": totalAllocatedBudget,
                        "totalSpentBudget": totalSpentBudget,
                        "remainingBudget": totalAllocatedBudget - totalSpentBudget,
                        "budgetUtilizationPercentage": budgetUtilization
                    }
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get project statistics: " + e.message());
        }
    }

    # Validate project data
    #
    # + projectData - Project data to validate
    # + return - Validation result
    public function validateProjectData(json projectData) returns json {
        string[] errors = [];
        
        json|error projectName = projectData.projectName;
        if projectName is error || projectName.toString().trim().length() == 0 {
            errors.push("Project name is required and cannot be empty");
        }
        
        json|error allocatedBudget = projectData.allocatedBudget;
        if allocatedBudget is error {
            errors.push("Allocated budget is required");
        } else {
            decimal|error budget = allocatedBudget.ensureType(decimal);
            if budget is error || budget < 0d {
                errors.push("Allocated budget must be a non-negative number");
            }
        }
        
        json|error spentBudget = projectData.spentBudget;
        if spentBudget is json {
            decimal|error spent = spentBudget.ensureType(decimal);
            if spent is error || spent < 0d {
                errors.push("Spent budget must be a non-negative number");
            } else if allocatedBudget is json {
                decimal|error budget = allocatedBudget.ensureType(decimal);
                if budget is decimal && spent > budget {
                    errors.push("Spent budget cannot exceed allocated budget");
                }
            }
        }
        
        json|error state = projectData.state;
        if state is error || state.toString().trim().length() == 0 {
            errors.push("State is required and cannot be empty");
        }
        
        json|error province = projectData.province;
        if province is error || province.toString().trim().length() == 0 {
            errors.push("Province is required and cannot be empty");
        }
        
        json|error ministry = projectData.ministry;
        if ministry is error || ministry.toString().trim().length() == 0 {
            errors.push("Ministry is required and cannot be empty");
        }
        
        json|error status = projectData.status;
        if status is json {
            string statusStr = status.toString();
            string[] validStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"];
            boolean isValidStatus = false;
            foreach string validStatus in validStatuses {
                if statusStr == validStatus {
                    isValidStatus = true;
                    break;
                }
            }
            if !isValidStatus {
                errors.push("Invalid status. Allowed values: PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED");
            }
        }
        
        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }
}
