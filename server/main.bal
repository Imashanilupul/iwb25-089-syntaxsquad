import server_bal.categories;
import server_bal.policy;
import server_bal.projects;
import server_bal.transactions;
import server_bal.proposals;
import server_bal.reports;
import server_bal.users;
import server_bal.petitions;
import server_bal.petition_activities;
import server_bal.policy_comments;
import ballerina/http;
import ballerina/log;
import ballerina/time;



# Environment variables configuration
configurable int port = ?;
configurable int petitionPort = ?;
configurable string supabaseUrl = ?;
configurable string supabaseServiceRoleKey = ?;


# HTTP listener for the API
listener http:Listener apiListener = new (port);

# web3 service URL
http:Client web3Service = check new ("http://localhost:3001", {
    timeout: 3000,  // 5 minutes timeout
    retryConfig: {
        interval: 3,
        count: 2,
        backOffFactor: 2.0
    }
});
http:Client fastapiChat = check new ("http://localhost:8001");

# Global HTTP client for Supabase API
http:Client supabaseClient = check new (supabaseUrl);

categories:CategoriesService categoriesService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
policy:PoliciesService policiesService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
projects:ProjectsService projectsService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
transactions:TransactionsService transactionsService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
proposals:ProposalsService proposalsService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
reports:ReportsService reportsService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
users:UsersService usersService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
petitions:PetitionsService petitionsService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
petition_activities:PetitionActivitiesService petitionActivitiesService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
policy_comments:PolicyCommentsService policyCommentsService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);


# Main API service with CORS configuration
@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000"],
        allowCredentials: true,
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    }
}
service /api on apiListener {

    # Health check endpoint
    #
    # + return - Health status message
    resource function get health() returns string {
        return "✅ Backend is running!";
    }

    # Server status endpoint
    #
    # + return - Server status message
    resource function get status() returns string {
        return "Server is healthy and HTTP-based database integration is ready";
    }

    # Database health check endpoint
    #
    # + return - Database health status
    resource function get db/health() returns json|error {
        return checkDatabaseHealth();
    }

    # Server information endpoint
    #
    # + return - Server information
    resource function get info() returns json {
        [int, decimal] currentTime = time:utcNow();
        return {
            "server": "Transparent Governance Platform Backend",
            "version": "2.0.0",
            "status": "Running",
            "environment": "Configured from environment variables",
            "database": {
                "type": "PostgreSQL",
                "provider": "Supabase",
                "connection": "HTTP REST API"
            },
            "endpoints": [
                "GET /api/health - Basic health check",
                "GET /api/status - Server status",
                "GET /api/db/health - Database health check",
                "GET /api/info - Server information",
                "GET /api/categories - List all budget categories",
                "POST /api/categories - Create a new category",
                "GET /api/categories/{id} - Get category by ID",
                "PUT /api/categories/{id} - Update category by ID",
                "DELETE /api/categories/{id} - Delete category by ID",
                "GET /api/policies - List all policies",
                "POST /api/policies - Create a new policy",
                "GET /api/policies/{id} - Get policy by ID",
                "PUT /api/policies/{id} - Update policy by ID",
                "DELETE /api/policies/{id} - Delete policy by ID",
                "GET /api/policies/status/{status} - Get policies by status",
                "GET /api/policies/ministry/{ministry} - Get policies by ministry",
                "GET /api/projects - List all projects",
                "POST /api/projects - Create a new project",
                "GET /api/projects/{id} - Get project by ID",
                "PUT /api/projects/{id} - Update project by ID",
                "DELETE /api/projects/{id} - Delete project by ID",
                "GET /api/projects/category/{categoryId} - Get projects by category",
                "GET /api/projects/status/{status} - Get projects by status",
                "GET /api/projects/ministry/{ministry} - Get projects by ministry",
                "GET /api/projects/state/{state} - Get projects by state",
                "GET /api/projects/province/{province} - Get projects by province",
                "GET /api/projects/search/{keyword} - Search projects by keyword",
                "GET /api/projects/statistics - Get project statistics",
                "GET /api/transactions - List all transactions",
                "POST /api/transactions - Create a new transaction",
                "GET /api/transactions/{id} - Get transaction by ID",
                "PUT /api/transactions/{id} - Update transaction by ID",
                "DELETE /api/transactions/{id} - Delete transaction by ID",
                "GET /api/transactions/category/{categoryId} - Get transactions by category",
                "GET /api/transactions/project/{projectId} - Get transactions by project",
                "GET /api/transactions/type/{type} - Get transactions by type",
                "GET /api/transactions/search/{keyword} - Search transactions",
                "GET /api/transactions/statistics - Get transaction statistics",
                "GET /api/transactions/recent - Get recent transactions",
                "GET /api/users - List all users",
                "POST /api/users - Create a new user",
                "GET /api/users/{id} - Get user by ID",
                "PUT /api/users/{id} - Update user by ID",
                "DELETE /api/users/{id} - Delete user by ID",
                "GET /api/users/email/{email} - Get user by email",
                "GET /api/users/nic/{nic} - Get user by NIC",
                "GET /api/users/search/{keyword} - Search users by keyword",
                "GET /api/users/statistics - Get user statistics",
                "GET /api/users/recent - Get recent users",
                "GET /api/policycomments - List all policy comments",
                "POST /api/policycomments - Create a new policy comment",
                "GET /api/policycomments/{id} - Get policy comment by ID",
                "PUT /api/policycomments/{id} - Update policy comment by ID",
                "DELETE /api/policycomments/{id} - Delete policy comment by ID",
                "GET /api/policycomments/user/{userId} - Get comments by user ID",
                "GET /api/policycomments/policy/{policyId} - Get comments by policy ID",
                "GET /api/policycomments/{id}/replies - Get replies to a comment",
                "GET /api/policycomments/search/{keyword} - Search comments by keyword",
                "GET /api/policycomments/statistics - Get comment statistics",
                "GET /api/policycomments/recent - Get recent comments",
                "POST /api/policycomments/{id}/like - Like a comment",
                "POST /api/policycomments/{id}/unlike - Unlike a comment",
                "GET /api/policycomments/top/{limit} - Get top liked comments"
            ],
            "features": [
                "Environment-based configuration",
                "Modular architecture",
                "Category management",
                "Policy management",
                "Project management",
                "Transaction management",
                "User management",
                "Petition management",
                "Petition activities tracking",
                "Policy comments and engagement",
                "Database health monitoring"
            ],
            "timestamp": currentTime[0]
        };
    }

    # Start blockchain sync job (async)
    #
    # + request - HTTP request with sync parameters
    # + return - Job ID or error
    resource function post blockchain/sync(http:Request request) returns json|error {
        log:printInfo("� Blockchain sync job request received");
        
        json requestPayload = check request.getJsonPayload();
        
        // Extract parameters with proper type checking
        int blocksBack = 1000;
        boolean isFullSync = false;
        
        json|error blocksBackValue = requestPayload.blocksBack;
        if blocksBackValue is int {
            blocksBack = blocksBackValue;
        }
        
        json|error isFullSyncValue = requestPayload.isFullSync;
        if isFullSyncValue is boolean {
            isFullSync = isFullSyncValue;
        }
        
        log:printInfo(string `🔄 Creating blockchain sync job (isFullSync: ${isFullSync}, blocksBack: ${blocksBack})`);
        
        // Call Node.js job manager to start async job
        http:Request jobRequest = new;
        jobRequest.setJsonPayload({
            blocksBack: isFullSync ? 999999 : blocksBack,
            isFullSync: isFullSync
        });
        
        http:Response jobResponse = check web3Service->post("/jobs/blockchain-sync", jobRequest);
        
        if jobResponse.statusCode != 200 {
            return error("Failed to create blockchain sync job");
        }
        
        json jobData = check jobResponse.getJsonPayload();
        
        // Extract jobId with type checking
        json|error jobIdValue = jobData.jobId;
        string jobIdStr = "";
        if jobIdValue is string {
            jobIdStr = jobIdValue;
        }
        
        return {
            success: true,
            message: "Blockchain sync job started",
            jobId: jobIdStr,
            statusUrl: string `/api/blockchain/sync/status/${jobIdStr}`,
            resultUrl: string `/api/blockchain/sync/result/${jobIdStr}`
        };
    }

    # Get blockchain sync job status
    #
    # + jobId - Job ID to check status
    # + return - Job status or error
    resource function get blockchain/sync/status/[string jobId]() returns json|error {
        log:printInfo(string `📊 Checking blockchain sync job status: ${jobId}`);
        
        http:Response statusResponse = check web3Service->get(string `/jobs/${jobId}/status`);
        
        if statusResponse.statusCode == 404 {
            return error("Job not found");
        } else if statusResponse.statusCode != 200 {
            return error("Failed to get job status");
        }
        
        return check statusResponse.getJsonPayload();
    }

    # Get blockchain sync job result
    #
    # + jobId - Job ID to get result
    # + return - Job result or error
    resource function get blockchain/sync/result/[string jobId]() returns json|error {
        log:printInfo(string `📋 Getting blockchain sync job result: ${jobId}`);
        
        http:Response resultResponse = check web3Service->get(string `/jobs/${jobId}/result`);
        
        if resultResponse.statusCode == 404 {
            return error("Job not found");
        } else if resultResponse.statusCode == 400 {
            _ = check resultResponse.getJsonPayload(); // Consume the response payload
            return error("Bad request - job failed");
        } else if resultResponse.statusCode != 200 {
            return error("Failed to get job result");
        }
        
        json resultData = check resultResponse.getJsonPayload();
        
        // Extract result fields with type checking
        json resultValue = {};
        json completedAtValue = "";
        
        json|error resultField = resultData.result;
        if resultField is json {
            resultValue = resultField;
        }
        
        json|error completedAtField = resultData.completedAt;
        if completedAtField is string {
            completedAtValue = completedAtField;
        }
        
        return {
            success: true,
            message: "Blockchain sync job result retrieved",
            jobId: jobId,
            result: resultValue,
            completedAt: completedAtValue,
            timestamp: time:utcNow()
        };
    }

    # Execute blockchain synchronization (called by Node.js job manager)
    #
    # + request - HTTP request with sync parameters
    # + return - Sync results or error
    resource function post blockchain/execute\-sync(http:Request request) returns json|error {
        log:printInfo("🚀 Starting blockchain synchronization execution...");
        
        json requestPayload = check request.getJsonPayload();
        
        // Extract parameters
        int blocksBack = 1000;
        boolean isFullSync = false;
        
        json|error blocksBackValue = requestPayload.blocksBack;
        if blocksBackValue is int {
            blocksBack = blocksBackValue;
        }
        
        json|error isFullSyncValue = requestPayload.isFullSync;
        if isFullSyncValue is boolean {
            isFullSync = isFullSyncValue;
        }
        
        // Calculate block range for sync (simplified approach)
        int currentBlock = 1000000; // You might want to fetch this from the blockchain
        int fromBlock = currentBlock - blocksBack;
        int toBlock = currentBlock;
        
        log:printInfo(string `📊 Syncing blockchain data from block ${fromBlock} to ${toBlock}`);
        
        // Execute all sync functions in sequence
        json[] syncResults = [];
        
        // 1. Sync Proposals
        log:printInfo("🗳️ Syncing proposals...");
        json|error proposalsResult = syncProposalsFromBlockchain(fromBlock, toBlock);
        if proposalsResult is json {
            syncResults.push({
                "type": "proposals",
                "result": proposalsResult
            });
        } else {
            syncResults.push({
                "type": "proposals",
                "error": proposalsResult.message()
            });
        }
        
        // 2. Sync Petitions
        log:printInfo("📝 Syncing petitions...");
        json|error petitionsResult = syncPetitionsFromBlockchain(fromBlock, toBlock);
        if petitionsResult is json {
            syncResults.push({
                "type": "petitions",
                "result": petitionsResult
            });
        } else {
            syncResults.push({
                "type": "petitions",
                "error": petitionsResult.message()
            });
        }
        
        // 3. Sync Reports
        log:printInfo("📊 Syncing reports...");
        json|error reportsResult = syncReportsFromBlockchain(fromBlock, toBlock);
        if reportsResult is json {
            syncResults.push({
                "type": "reports",
                "result": reportsResult
            });
        } else {
            syncResults.push({
                "type": "reports",
                "error": reportsResult.message()
            });
        }
        
        // 4. Sync Policies
        log:printInfo("📜 Syncing policies...");
        json|error policiesResult = syncPoliciesFromBlockchain(fromBlock, toBlock);
        if policiesResult is json {
            syncResults.push({
                "type": "policies",
                "result": policiesResult
            });
        } else {
            syncResults.push({
                "type": "policies",
                "error": policiesResult.message()
            });
        }
        
        // 5. Sync Projects
        log:printInfo("🏗️ Syncing projects...");
        json|error projectsResult = syncProjectsFromBlockchain(fromBlock, toBlock);
        if projectsResult is json {
            syncResults.push({
                "type": "projects",
                "result": projectsResult
            });
        } else {
            syncResults.push({
                "type": "projects",
                "error": projectsResult.message()
            });
        }
        
        // Calculate totals
        int totalNew = 0;
        int totalUpdated = 0;
        int totalRemoved = 0;
        int totalErrors = 0;
        
        foreach json result in syncResults {
            json|error typeField = result.'type;
            json|error resultField = result.result;
            if (typeField is json && resultField is json) {
                json resultData = resultField;
                map<json> resultMap = <map<json>>resultData;
                if (resultMap.hasKey("results")) {
                    json resultsValue = resultMap["results"];
                    map<json> results = <map<json>>resultsValue;
                    
                    if (results.hasKey("new")) {
                        json newValue = results["new"];
                        if (newValue is int) {
                            totalNew += newValue;
                        }
                    }
                    
                    if (results.hasKey("updated")) {
                        json updatedValue = results["updated"];
                        if (updatedValue is int) {
                            totalUpdated += updatedValue;
                        }
                    }
                    
                    if (results.hasKey("removed")) {
                        json removedValue = results["removed"];
                        if (removedValue is int) {
                            totalRemoved += removedValue;
                        }
                    }
                    
                    if (results.hasKey("errors")) {
                        json errorsValue = results["errors"];
                        if (errorsValue is json[]) {
                            json[] errors = errorsValue;
                            totalErrors += errors.length();
                        }
                    }
                }
            }
        }
        
        log:printInfo(string `✅ Blockchain sync completed! New: ${totalNew}, Updated: ${totalUpdated}, Removed: ${totalRemoved}, Errors: ${totalErrors}`);
        
        return {
            "status": "completed",
            "fromBlock": fromBlock,
            "toBlock": toBlock,
            "isFullSync": isFullSync,
            "summary": {
                "totalNew": totalNew,
                "totalUpdated": totalUpdated,
                "totalRemoved": totalRemoved,
                "totalErrors": totalErrors
            },
            "details": syncResults,
            "timestamp": time:utcNow()[0]
        };
    }

    # Get all categories
    #
    # + return - Categories list or error
    resource function get categories() returns json|error {
        log:printInfo("Get all categories endpoint called");
        return categoriesService.getAllCategories();
    }

    # Get category by ID
    #
    # + categoryId - Category ID to retrieve
    # + return - Category data or error
    resource function get categories/[int categoryId]() returns json|error {
        log:printInfo("Get category by ID endpoint called for ID: " + categoryId.toString());
        return categoriesService.getCategoryById(categoryId);
    }

    # Create a new category
    #
    # + request - HTTP request containing category data
    # + return - Created category data or error
    resource function post categories(http:Request request) returns json|error {
        log:printInfo("Create category endpoint called");

        json payload = check request.getJsonPayload();

        // Validate required fields
        string categoryName = check payload.categoryName.ensureType(string);
        decimal allocatedBudget = check payload.allocatedBudget.ensureType(decimal);
        decimal spentBudget = payload.spentBudget is () ? 0d : check payload.spentBudget.ensureType(decimal);

        // Validate input
        if categoryName.trim().length() == 0 {
            return {
                "success": false,
                "message": "Category name cannot be empty",
                "timestamp": time:utcNow()[0]
            };
        }

        if allocatedBudget < 0d {
            return {
                "success": false,
                "message": "Allocated budget cannot be negative",
                "timestamp": time:utcNow()[0]
            };
        }

        if spentBudget < 0d {
            return {
                "success": false,
                "message": "Spent budget cannot be negative",
                "timestamp": time:utcNow()[0]
            };
        }

        return categoriesService.createCategory(categoryName, allocatedBudget, spentBudget);
    }

    # Update category by ID
    #
    # + request - HTTP request containing updated category data
    # + categoryId - Category ID to update
    # + return - Updated category data or error
    resource function put categories/[int categoryId](http:Request request) returns json|error {
        log:printInfo("Update category endpoint called for ID: " + categoryId.toString());

        json payload = check request.getJsonPayload();
        return categoriesService.updateCategory(categoryId, payload);
    }

    # Delete category by ID
    #
    # + categoryId - Category ID to delete
    # + return - Success message or error
    resource function delete categories/[int categoryId]() returns json|error {
        log:printInfo("Delete category endpoint called for ID: " + categoryId.toString());
        return categoriesService.deleteCategory(categoryId);
    }

    # Get all policies with pagination
    #
    # + page - Page number (optional, default: 1)
    # + pageLimit - Number of items per page (optional, default: 20)
    # + return - Policies list with pagination metadata or error
    resource function get policies(int page = 1, int pageLimit = 20) returns json|error {
        log:printInfo(string `Get all policies endpoint called - Page: ${page}, Limit: ${pageLimit}`);
        return policiesService.getAllPolicies(page, pageLimit);
    }

    # Get policy by ID
    #
    # + policyId - Policy ID to retrieve
    # + return - Policy data or error
    resource function get policies/[int policyId]() returns json|error {
        log:printInfo("Get policy by ID endpoint called for ID: " + policyId.toString());
        return policiesService.getPolicyById(policyId);
    }

    # Create a new policy
    #
    # + request - HTTP request containing policy data
    # + return - Created policy data or error
    resource function post policies(http:Request request) returns json|error {
        log:printInfo("Create policy endpoint called");

        json payload = check request.getJsonPayload();

        // Extract required fields
        string name = check payload.name;
        string description = check payload.description;
        string viewFullPolicy = check payload.view_full_policy;
        string ministry = check payload.ministry;

        // Extract optional fields
        string status = payload.status is string ? check payload.status : "DRAFT";
        string? effectiveDate = payload.effective_date is string ? check payload.effective_date : ();

        return policiesService.createPolicy(name, description, viewFullPolicy, ministry, status, effectiveDate);
    }

    # Update policy by ID
    #
    # + request - HTTP request containing updated policy data
    # + policyId - Policy ID to update
    # + return - Updated policy data or error
    resource function put policies/[int policyId](http:Request request) returns json|error {
        log:printInfo("Update policy endpoint called for ID: " + policyId.toString());

        json payload = check request.getJsonPayload();
        return policiesService.updatePolicy(policyId, payload);
    }

    # Delete policy by ID
    #
    # + policyId - Policy ID to delete
    # + return - Success message or error
    resource function delete policies/[int policyId]() returns json|error {
        log:printInfo("Delete policy endpoint called for ID: " + policyId.toString());
        return policiesService.deletePolicy(policyId);
    }

    # Get policies by status
    #
    # + status - Policy status to filter by
    # + return - Filtered policies list or error
    resource function get policies/status/[string status]() returns json|error {
        log:printInfo("Get policies by status endpoint called for status: " + status);
        return policiesService.getPoliciesByStatus(status);
    }

    # Get policies by ministry
    #
    # + ministry - Ministry name to filter by
    # + return - Filtered policies list or error
    resource function get policies/ministry/[string ministry]() returns json|error {
        log:printInfo("Get policies by ministry endpoint called for ministry: " + ministry);
        return policiesService.getPoliciesByMinistry(ministry);
    }

    # Search policies by keyword
    #
    # + keyword - Keyword to search for
    # + return - Matching policies list or error
    resource function get policies/search/[string keyword]() returns json|error {
        log:printInfo("Search policies endpoint called for keyword: " + keyword);
        return policiesService.searchPolicies(keyword);
    }

    # Get policy statistics
    #
    # + return - Policy statistics or error
    resource function get policies/statistics() returns json|error {
        log:printInfo("Get policy statistics endpoint called");
        return policiesService.getPolicyStatistics();
    }

    # Get active policies
    #
    # + return - Active policies list or error
    resource function get policies/active() returns json|error {
        log:printInfo("Get active policies endpoint called");
        return policiesService.getActivePolicies();
    }

    # Get draft policies
    #
    # + return - Draft policies list or error
    resource function get policies/draft() returns json|error {
        log:printInfo("Get draft policies endpoint called");
        return policiesService.getDraftPolicies();
    }

    # Get all projects
    #
    # + return - Projects list or error
    resource function get projects() returns json|error {
        log:printInfo("Get all projects endpoint called");
        return projectsService.getAllProjects();
    }

    # Get project by ID
    #
    # + projectId - Project ID to retrieve
    # + return - Project data or error
    resource function get projects/[int projectId]() returns json|error {
        log:printInfo("Get project by ID endpoint called for ID: " + projectId.toString());
        return projectsService.getProjectById(projectId);
    }

    # Create a new project
    #
    # + request - HTTP request containing project data
    # + return - Created project data or error
    resource function post projects(http:Request request) returns json|error {
        log:printInfo("Create project endpoint called");

        json payload = check request.getJsonPayload();

        // Extract required fields
        string projectName = check payload.projectName;
        string state = check payload.state;
        string province = check payload.province;
        string ministry = check payload.ministry;
        decimal allocatedBudget = check payload.allocatedBudget;

        // Extract optional fields
        int? categoryId = payload.categoryId is int ? check payload.categoryId : ();
        decimal spentBudget = payload.spentBudget is decimal ? check payload.spentBudget : 0d;
        string? viewDetails = payload.viewDetails is string ? check payload.viewDetails : ();
        string status = payload.status is string ? check payload.status : "PLANNED";

        return projectsService.createProject(projectName, state, province, ministry, allocatedBudget, categoryId, spentBudget, viewDetails, status);
    }

    # Update project by ID
    #
    # + request - HTTP request containing updated project data
    # + projectId - Project ID to update
    # + return - Updated project data or error
    resource function put projects/[int projectId](http:Request request) returns json|error {
        log:printInfo("Update project endpoint called for ID: " + projectId.toString());

        json payload = check request.getJsonPayload();
        return projectsService.updateProject(projectId, payload);
    }

    # Delete project by ID
    #
    # + projectId - Project ID to delete
    # + return - Success message or error
    resource function delete projects/[int projectId]() returns json|error {
        log:printInfo("Delete project endpoint called for ID: " + projectId.toString());
        return projectsService.deleteProject(projectId);
    }

    # Get projects by category
    #
    # + categoryId - Category ID to filter by
    # + return - Filtered projects list or error
    resource function get projects/category/[int categoryId]() returns json|error {
        log:printInfo("Get projects by category endpoint called for category ID: " + categoryId.toString());
        return projectsService.getProjectsByCategory(categoryId);
    }

    # Get projects by status
    #
    # + status - Project status to filter by
    # + return - Filtered projects list or error
    resource function get projects/status/[string status]() returns json|error {
        log:printInfo("Get projects by status endpoint called for status: " + status);
        return projectsService.getProjectsByStatus(status);
    }

    # Get projects by ministry
    #
    # + ministry - Ministry name to filter by
    # + return - Filtered projects list or error
    resource function get projects/ministry/[string ministry]() returns json|error {
        log:printInfo("Get projects by ministry endpoint called for ministry: " + ministry);
        return projectsService.getProjectsByMinistry(ministry);
    }

    # Get projects by state
    #
    # + state - State name to filter by
    # + return - Filtered projects list or error
    resource function get projects/state/[string state]() returns json|error {
        log:printInfo("Get projects by state endpoint called for state: " + state);
        return projectsService.getProjectsByState(state);
    }

    # Get projects by province
    #
    # + province - Province name to filter by
    # + return - Filtered projects list or error
    resource function get projects/province/[string province]() returns json|error {
        log:printInfo("Get projects by province endpoint called for province: " + province);
        return projectsService.getProjectsByProvince(province);
    }

    # Search projects by keyword
    #
    # + keyword - Keyword to search for
    # + return - Matching projects list or error
    resource function get projects/search/[string keyword]() returns json|error {
        log:printInfo("Search projects endpoint called for keyword: " + keyword);
        return projectsService.searchProjects(keyword);
    }

    # Get project statistics
    #
    # + return - Project statistics or error
    resource function get projects/statistics() returns json|error {
        log:printInfo("Get project statistics endpoint called");
        return projectsService.getProjectStatistics();
    }

    # Get all transactions
    #
    # + return - Transactions list or error
    resource function get transactions() returns json|error {
        log:printInfo("Get all transactions endpoint called");
        return transactionsService.getAllTransactions();
    }

    # Get transaction by ID
    #
    # + transactionId - Transaction ID to retrieve
    # + return - Transaction data or error
    resource function get transactions/[int transactionId]() returns json|error {
        log:printInfo("Get transaction by ID endpoint called for ID: " + transactionId.toString());
        return transactionsService.getTransactionById(transactionId);
    }

    # Create a new transaction
    #
    # + request - HTTP request containing transaction data
    # + return - Created transaction data or error
    resource function post transactions(http:Request request) returns json|error {
        log:printInfo("Create transaction endpoint called");

        json payload = check request.getJsonPayload();

        // Extract required fields
        decimal amount = check payload.amount;
        string transactionType = check payload.transactionType;

        // Extract optional fields
        string? description = payload.description is string ? check payload.description : ();
        int? categoryId = payload.categoryId is int ? check payload.categoryId : ();
        int? projectId = payload.projectId is int ? check payload.projectId : ();

        return transactionsService.createTransaction(amount, transactionType, description, categoryId, projectId);
    }

    # Update transaction by ID
    #
    # + request - HTTP request containing updated transaction data
    # + transactionId - Transaction ID to update
    # + return - Updated transaction data or error
    resource function put transactions/[int transactionId](http:Request request) returns json|error {
        log:printInfo("Update transaction endpoint called for ID: " + transactionId.toString());

        json payload = check request.getJsonPayload();
        return transactionsService.updateTransaction(transactionId, payload);
    }

    # Delete transaction by ID
    #
    # + transactionId - Transaction ID to delete
    # + return - Success message or error
    resource function delete transactions/[int transactionId]() returns json|error {
        log:printInfo("Delete transaction endpoint called for ID: " + transactionId.toString());
        return transactionsService.deleteTransaction(transactionId);
    }

    # Get transactions by category
    #
    # + categoryId - Category ID to filter by
    # + return - Filtered transactions list or error
    resource function get transactions/category/[int categoryId]() returns json|error {
        log:printInfo("Get transactions by category endpoint called for category ID: " + categoryId.toString());
        return transactionsService.getTransactionsByCategory(categoryId);
    }

    # Get transactions by project
    #
    # + projectId - Project ID to filter by
    # + return - Filtered transactions list or error
    resource function get transactions/project/[int projectId]() returns json|error {
        log:printInfo("Get transactions by project endpoint called for project ID: " + projectId.toString());
        return transactionsService.getTransactionsByProject(projectId);
    }

    # Get transactions by type
    #
    # + transactionType - Transaction type to filter by
    # + return - Filtered transactions list or error
    resource function get transactions/'type/[string transactionType]() returns json|error {
        log:printInfo("Get transactions by type endpoint called for type: " + transactionType);
        return transactionsService.getTransactionsByType(transactionType);
    }

    # Search transactions by keyword
    #
    # + keyword - Keyword to search for
    # + return - Matching transactions list or error
    resource function get transactions/search/[string keyword]() returns json|error {
        log:printInfo("Search transactions endpoint called for keyword: " + keyword);
        return transactionsService.searchTransactions(keyword);
    }

    # Get transaction statistics
    #
    # + return - Transaction statistics or error
    resource function get transactions/statistics() returns json|error {
        log:printInfo("Get transaction statistics endpoint called");
        return transactionsService.getTransactionStatistics();
    }

    # Get recent transactions
    #
    # + return - Recent transactions list or error
    resource function get transactions/recent() returns json|error {
        log:printInfo("Get recent transactions endpoint called");
        return transactionsService.getRecentTransactions();
    }

    # Get all proposals
    #
    # + return - Proposals list or error
    resource function get proposals() returns json|error {
        log:printInfo("Get all proposals endpoint called");
        return proposalsService.getAllProposals();
    }

    # Get proposal by ID
    #
    # + proposalId - Proposal ID to retrieve
    # + return - Proposal data or error
    resource function get proposals/[int proposalId]() returns json|error {
        log:printInfo("Get proposal by ID endpoint called for ID: " + proposalId.toString());
        return proposalsService.getProposalById(proposalId);
    }

    # Create a new proposal
    #
    # + request - HTTP request containing proposal data
    # + return - Created proposal data or error
    resource function post proposals(http:Request request) returns json|error {
        log:printInfo("Create proposal endpoint called");

        json payload = check request.getJsonPayload();

        // Extract required fields
        string title = check payload.title;
        string shortDescription = check payload.shortDescription;
        string descriptionInDetails = check payload.descriptionInDetails;
        string expiredDate = check payload.expiredDate;

        // Extract optional fields
        int? categoryId = payload.categoryId is int ? check payload.categoryId : ();
        int? createdBy = payload.createdBy is int ? check payload.createdBy : ();
        boolean activeStatus = payload.activeStatus is boolean ? check payload.activeStatus : true;
        int yesVotes = payload.yesVotes is int ? check payload.yesVotes : 0;
        int noVotes = payload.noVotes is int ? check payload.noVotes : 0;

        return proposalsService.createProposal(title, shortDescription, descriptionInDetails, expiredDate, categoryId, createdBy, activeStatus, yesVotes, noVotes);
    }

    # Update proposal by ID
    #
    # + request - HTTP request containing updated proposal data
    # + proposalId - Proposal ID to update
    # + return - Updated proposal data or error
    resource function put proposals/[int proposalId](http:Request request) returns json|error {
        log:printInfo("Update proposal endpoint called for ID: " + proposalId.toString());

        json payload = check request.getJsonPayload();
        return proposalsService.updateProposal(proposalId, payload);
    }

    # Delete proposal by ID
    #
    # + proposalId - Proposal ID to delete
    # + return - Success message or error
    resource function delete proposals/[int proposalId]() returns json|error {
        log:printInfo("Delete proposal endpoint called for ID: " + proposalId.toString());
        return proposalsService.deleteProposal(proposalId);
    }

    # Get proposals by category
    #
    # + categoryId - Category ID to filter by
    # + return - Filtered proposals list or error
    resource function get proposals/category/[int categoryId]() returns json|error {
        log:printInfo("Get proposals by category endpoint called for category ID: " + categoryId.toString());
        return proposalsService.getProposalsByCategory(categoryId);
    }

    # Get proposals by status
    #
    # + activeStatus - Active status to filter by (true/false)
    # + return - Filtered proposals list or error
    resource function get proposals/status/[boolean activeStatus]() returns json|error {
        log:printInfo("Get proposals by status endpoint called for status: " + activeStatus.toString());
        return proposalsService.getProposalsByStatus(activeStatus);
    }

    # Get proposals by creator
    #
    # + createdBy - Creator user ID to filter by
    # + return - Filtered proposals list or error
    resource function get proposals/creator/[int createdBy]() returns json|error {
        log:printInfo("Get proposals by creator endpoint called for creator ID: " + createdBy.toString());
        return proposalsService.getProposalsByCreator(createdBy);
    }

    # Search proposals by keyword
    #
    # + keyword - Keyword to search for
    # + return - Matching proposals list or error
    resource function get proposals/search/[string keyword]() returns json|error {
        log:printInfo("Search proposals endpoint called for keyword: " + keyword);
        return proposalsService.searchProposals(keyword);
    }

    # Get proposal statistics
    #
    # + return - Proposal statistics or error
    resource function get proposals/statistics() returns json|error {
        log:printInfo("Get proposal statistics endpoint called");
        return proposalsService.getProposalStatistics();
    }

    # Get active proposals
    #
    # + return - Active proposals list or error
    resource function get proposals/active() returns json|error {
        log:printInfo("Get active proposals endpoint called");
        return proposalsService.getActiveProposals();
    }

    # Get expired proposals
    #
    # + return - Expired proposals list or error
    resource function get proposals/expired() returns json|error {
        log:printInfo("Get expired proposals endpoint called");
        return proposalsService.getExpiredProposals();
    }

    # Vote on a proposal
    #
    # + proposalId - Proposal ID to vote on
    # + voteType - Vote type (yes/no)
    # + return - Updated proposal data or error
    resource function post proposals/[int proposalId]/vote/[string voteType]() returns json|error {
        log:printInfo("Vote on proposal endpoint called for ID: " + proposalId.toString() + " with vote: " + voteType);
        return proposalsService.voteOnProposal(proposalId, voteType);
    }

    # Direct database vote endpoint (for backup/testing)
    #
    # + return - Vote response
    resource function post proposals/vote(http:Caller caller, http:Request req) returns error? {
        log:printInfo("Direct database vote endpoint called");
        
        do {
            json payload = check req.getJsonPayload();
            
            int|error proposalId = payload.proposalId.ensureType(int);
            if proposalId is error {
                check caller->respond({"error": "Invalid or missing proposalId"});
                return;
            }
            
            string|error voteType = payload.voteType.ensureType(string);
            if voteType is error {
                check caller->respond({"error": "Invalid or missing voteType"});
                return;
            }
            
            if voteType != "yes" && voteType != "no" {
                check caller->respond({"error": "voteType must be 'yes' or 'no'"});
                return;
            }
            
            // Extract wallet address if provided
            string? walletAddress = ();
            map<json> payloadMap = check payload.ensureType();
            if payloadMap.hasKey("walletAddress") {
                string|error walletAddr = payloadMap["walletAddress"].ensureType(string);
                if walletAddr is string {
                    walletAddress = walletAddr;
                    log:printInfo("👤 Wallet address provided: " + walletAddr);
                }
            }
            
            // Extract user ID if provided
            int? userId = ();
            if payloadMap.hasKey("userId") {
                int|error userIdVal = payloadMap["userId"].ensureType(int);
                if userIdVal is int {
                    userId = userIdVal;
                }
            }
            
            json result = check proposalsService.voteOnProposal(proposalId, voteType, walletAddress, userId);
            check caller->respond(result);
            
        } on fail error e {
            log:printError("Error in direct database vote: " + e.message());
            check caller->respond({"error": "Failed to process vote: " + e.message()});
        }
    }

    # Get user's current vote on a proposal
    #
    # + proposalId - Proposal ID
    # + walletAddress - Wallet address
    # + return - Current vote
    resource function get proposals/[int proposalId]/vote/[string walletAddress](http:Caller caller, http:Request req) returns error? {
        do {
            log:printInfo("🔍 Getting user vote for proposal " + proposalId.toString() + " and wallet " + walletAddress);
            
            json result = check proposalsService.getUserVote(proposalId, walletAddress);
            
            check caller->respond(result);
        } on fail error e {
            log:printError("❌ Get user vote error: " + e.message());
            json errorResponse = {
                "success": false,
                "error": e.message(),
                "timestamp": time:utcNow()[0]
            };
            check caller->respond(errorResponse);
        }
    }

    # Get voter demographics
    #
    # + return - Voter demographics data by age groups
    resource function get proposals/voterdemographics() returns json|error {
        log:printInfo("Get voter demographics endpoint called");
        return proposalsService.getVoterDemographics();
    }

    # Get voting activity
    #
    # + return - Hourly voting activity data for today
    resource function get proposals/votingactivity() returns json|error {
        log:printInfo("Get voting activity endpoint called");
        return proposalsService.getVotingActivity();
    }

    # Get all users
    #
    # + return - Users list or error
    resource function get users() returns json|error {
        log:printInfo("Get all users endpoint called");
        return usersService.getAllUsers();
    }

    # Get user by ID
    #
    # + userId - User ID to retrieve
    # + return - User data or error
    resource function get users/[int userId]() returns json|error {
        log:printInfo("Get user by ID endpoint called for ID: " + userId.toString());
        return usersService.getUserById(userId);
    }

    # Create a new user
    #
    # + request - HTTP request containing user data
    # + return - Created user data or error
    resource function post users(http:Request request) returns json|error {
        log:printInfo("Create user endpoint called");

        json payload = check request.getJsonPayload();

        // Extract required fields
        string userName = check payload.user_name;
        string email = check payload.email;
        string nic = check payload.nic;
        string mobileNo = check payload.mobile_no;

        // Extract optional fields
        string? evm = payload.evm is string ? check payload.evm : ();
        string? province = payload.province is string ? check payload.province : ();

        return usersService.createUser(userName, email, nic, mobileNo, evm, province);
    }

    # Update user by ID
    #
    # + request - HTTP request containing updated user data
    # + userId - User ID to update
    # + return - Updated user data or error
    resource function put users/[int userId](http:Request request) returns json|error {
        log:printInfo("Update user endpoint called for ID: " + userId.toString());

        json payload = check request.getJsonPayload();
        return usersService.updateUser(userId, payload);
    }

    # Delete user by ID
    #
    # + userId - User ID to delete
    # + return - Success message or error
    resource function delete users/[int userId]() returns json|error {
        log:printInfo("Delete user endpoint called for ID: " + userId.toString());
        return usersService.deleteUser(userId);
    }

    # Get user by email
    #
    # + email - Email to search for
    # + return - User data or error
    resource function get users/email/[string email]() returns json|error {
        log:printInfo("Get user by email endpoint called for email: " + email);
        return usersService.getUserByEmail(email);
    }

    # Get user by NIC
    #
    # + nic - NIC to search for
    # + return - User data or error
    resource function get users/nic/[string nic]() returns json|error {
        log:printInfo("Get user by NIC endpoint called for NIC: " + nic);
        return usersService.getUserByNic(nic);
    }

    # Get user by mobile number
    #
    # + mobile - Mobile number to search for
    # + return - User data or error
    resource function get users/mobile/[string mobile]() returns json|error {
        log:printInfo("Get user by mobile endpoint called for mobile: " + mobile);
        return usersService.getUserByMobile(mobile);
    }

    # Get user by EVM address
    #
    # + evm - EVM address to search for
    # + return - User data or error
    resource function get users/evm/[string evm]() returns json|error {
        log:printInfo("Get user by EVM endpoint called for EVM: " + evm);
        return usersService.getUserByEvm(evm);
    }

    # Search users by keyword
    #
    # + keyword - Keyword to search for
    # + return - Matching users list or error
    resource function get users/search/[string keyword]() returns json|error {
        log:printInfo("Search users endpoint called for keyword: " + keyword);
        return usersService.searchUsers(keyword);
    }

    # Get user statistics
    #
    # + return - User statistics or error
    resource function get users/statistics() returns json|error {
        log:printInfo("Get user statistics endpoint called");
        return usersService.getUserStatistics();
    }

    # Get province statistics
    #
    # + return - Province statistics or error
    resource function get users/provinces() returns json|error {
        log:printInfo("Get province statistics endpoint called");
        return usersService.getProvinceStatistics();
    }

    # Get recent users
    #
    # + return - Recent users list or error
    resource function get users/recent() returns json|error {
        log:printInfo("Get recent users endpoint called");
        return usersService.getRecentUsers();
    }

    # Get all reports
    #
    # + return - Reports list or error
    resource function get reports() returns json|error {
        log:printInfo("Get all reports endpoint called");
        return reportsService.getAllReports();
    }

    # Get report by ID
    #
    # + reportId - Report ID to retrieve
    # + return - Report data or error
    resource function get reports/[int reportId]() returns json|error {
        log:printInfo("Get report by ID endpoint called for ID: " + reportId.toString());
        return reportsService.getReportById(reportId);
    }

    # Create a new report
    #
    # + request - HTTP request containing report data
    # + return - Created report data or error
    resource function post reports(http:Request request) returns json|error {
        log:printInfo("Create report endpoint called");

        json payload = check request.getJsonPayload();

        // Extract required fields
        string reportTitle = check payload.report_title;
        string evidenceHash = check payload.evidence_hash;

        // Extract optional fields
        string? description = payload.description is string ? check payload.description : ();
        string priority = payload.priority is string ? check payload.priority : "MEDIUM";
        string? assignedTo = payload.assigned_to is string ? check payload.assigned_to : ();
        int? userId = payload.user_id is int ? check payload.user_id : ();

        return reportsService.createReport(reportTitle, evidenceHash, description, priority, assignedTo, userId);
    }

    # Update report by ID
    #
    # + request - HTTP request containing updated report data
    # + reportId - Report ID to update
    # + return - Updated report data or error
    resource function put reports/[int reportId](http:Request request) returns json|error {
        log:printInfo("Update report endpoint called for ID: " + reportId.toString());

        json payload = check request.getJsonPayload();
        return reportsService.updateReport(reportId, payload);
    }

    # Delete report by ID
    #
    # + reportId - Report ID to delete
    # + return - Success message or error
    resource function delete reports/[int reportId]() returns json|error {
        log:printInfo("Delete report endpoint called for ID: " + reportId.toString());
        return reportsService.deleteReport(reportId);
    }

    # Get reports by user ID
    #
    # + userId - User ID to filter by
    # + return - Filtered reports list or error
    resource function get reports/user/[int userId]() returns json|error {
        log:printInfo("Get reports by user ID endpoint called for user ID: " + userId.toString());
        return reportsService.getReportsByUserId(userId);
    }

    # Get reports by priority
    #
    # + priority - Priority to filter by
    # + return - Filtered reports list or error
    resource function get reports/priority/[string priority]() returns json|error {
        log:printInfo("Get reports by priority endpoint called for priority: " + priority);
        return reportsService.getReportsByPriority(priority);
    }

    # Get reports by status
    #
    # + resolved - Resolved status to filter by
    # + return - Filtered reports list or error
    resource function get reports/status/[boolean resolved]() returns json|error {
        log:printInfo("Get reports by status endpoint called for resolved: " + resolved.toString());
        return reportsService.getReportsByStatus(resolved);
    }

    # Get reports by evidence hash
    #
    # + evidenceHash - Evidence hash to search for
    # + return - Filtered reports list or error
    resource function get reports/evidence/[string evidenceHash]() returns json|error {
        log:printInfo("Get reports by evidence hash endpoint called for hash: " + evidenceHash);
        return reportsService.getReportsByEvidenceHash(evidenceHash);
    }

    # Search reports by keyword
    #
    # + keyword - Keyword to search for
    # + return - Matching reports list or error
    resource function get reports/search/[string keyword]() returns json|error {
        log:printInfo("Search reports endpoint called for keyword: " + keyword);
        return reportsService.searchReports(keyword);
    }

    # Get report statistics
    #
    # + return - Report statistics or error
    resource function get reports/statistics() returns json|error {
        log:printInfo("Get report statistics endpoint called");
        return reportsService.getReportStatistics();
    }

    # Get recent reports
    #
    # + return - Recent reports list or error
    resource function get reports/recent() returns json|error {
        log:printInfo("Get recent reports endpoint called");
        return reportsService.getRecentReports();
    }

    # Mark report as resolved
    #
    # + reportId - Report ID to mark as resolved
    # + return - Updated report data or error
    resource function post reports/[int reportId]/resolve() returns json|error {
        log:printInfo("Resolve report endpoint called for ID: " + reportId.toString());
        return reportsService.resolveReport(reportId);
    }

    # Mark report as pending (unresolve)
    #
    # + reportId - Report ID to mark as pending
    # + return - Updated report data or error
    resource function post reports/[int reportId]/unresolve() returns json|error {
        log:printInfo("Unresolve report endpoint called for ID: " + reportId.toString());
        return reportsService.unresolveReport(reportId);
    }

    # Like a report
    #
    # + reportId - Report ID to like
    # + request - HTTP request containing wallet address
    # + return - Updated report data or error
    resource function post reports/[int reportId]/like(http:Request request) returns json|error {
        log:printInfo("Like report endpoint called for ID: " + reportId.toString());
        
        json|error maybePayload = request.getJsonPayload();
        if maybePayload is error {
            return {
                "success": false,
                "message": "Invalid JSON payload",
                "error": maybePayload.message(),
                "timestamp": time:utcNow()[0]
            };
        }
        
        if maybePayload is map<json> {
            map<json> payload = maybePayload;
            
            if !payload.hasKey("wallet_address") {
                return {
                    "success": false,
                    "message": "Missing required field: wallet_address",
                    "timestamp": time:utcNow()[0]
                };
            }
            
            string|error walletAddress = payload["wallet_address"].ensureType(string);
            if walletAddress is error {
                return {
                    "success": false,
                    "message": "Invalid 'wallet_address' field: must be a string",
                    "timestamp": time:utcNow()[0]
                };
            }
            
            return reportsService.likeReport(reportId, walletAddress);
        }
        
        return {
            "success": false,
            "message": "Invalid request payload",
            "timestamp": time:utcNow()[0]
        };
    }

    # Dislike a report
    #
    # + reportId - Report ID to dislike
    # + request - HTTP request containing wallet address
    # + return - Updated report data or error
    resource function post reports/[int reportId]/dislike(http:Request request) returns json|error {
        log:printInfo("Dislike report endpoint called for ID: " + reportId.toString());
        
        json|error maybePayload = request.getJsonPayload();
        if maybePayload is error {
            return {
                "success": false,
                "message": "Invalid JSON payload",
                "error": maybePayload.message(),
                "timestamp": time:utcNow()[0]
            };
        }
        
        if maybePayload is map<json> {
            map<json> payload = maybePayload;
            
            if !payload.hasKey("wallet_address") {
                return {
                    "success": false,
                    "message": "Missing required field: wallet_address",
                    "timestamp": time:utcNow()[0]
                };
            }
            
            string|error walletAddress = payload["wallet_address"].ensureType(string);
            if walletAddress is error {
                return {
                    "success": false,
                    "message": "Invalid 'wallet_address' field: must be a string",
                    "timestamp": time:utcNow()[0]
                };
            }
            
            return reportsService.dislikeReport(reportId, walletAddress);
        }
        
        return {
            "success": false,
            "message": "Invalid request payload",
            "timestamp": time:utcNow()[0]
        };
    }

    # Check user vote on a report
    #
    # + reportId - Report ID to check
    # + walletAddress - User's wallet address
    # + return - User's vote or null if no vote
    resource function get reports/[int reportId]/vote/[string walletAddress]() returns json|error {
        log:printInfo("Check user vote endpoint called for report ID: " + reportId.toString() + ", wallet: " + walletAddress);
        
        string? vote = check reportsService.checkUserVote(reportId, walletAddress);
        
        return {
            "success": true,
            "data": {
                "report_id": reportId,
                "wallet_address": walletAddress,
                "vote": vote
            },
            "timestamp": time:utcNow()[0]
        };
    }

    # Get all petitions
    #
    # + return - Petitions list or error
    resource function get petitions() returns json|error {
        log:printInfo("Get all petitions endpoint called");
        return petitionsService.getAllPetitions();
    }

    # Get petition by ID
    #
    # + petitionId - Petition ID to retrieve
    # + return - Petition data or error
    resource function get petitions/[int petitionId]() returns json|error {
        log:printInfo("Get petition by ID endpoint called for ID: " + petitionId.toString());
        return petitionsService.getPetitionById(petitionId);
    }

    # Create a new petition
    #
    # + request - HTTP request containing petition data
    # + return - Created petition data or error
    resource function post petitions(http:Request request) returns json|error {
        log:printInfo("Create petition endpoint called");

        json|error maybePayload = request.getJsonPayload();
        if maybePayload is error {
            return {
                "success": false,
                "message": "Invalid JSON payload",
                "error": maybePayload.message(),
                "timestamp": time:utcNow()[0]
            };
        }

        if maybePayload is map<json> {
            map<json> payload = maybePayload;

            string[] missing = [];
            if !payload.hasKey("title") {
                missing.push("title");
            }
            if !payload.hasKey("description") {
                missing.push("description");
            }
            if !payload.hasKey("required_signature_count") {
                missing.push("required_signature_count");
            }

            if missing.length() > 0 {
                string missingStr = "";
                foreach int i in 0 ..< missing.length() {
                    if i == 0 {
                        missingStr = missing[i];
                    } else {
                        missingStr = missingStr + ", " + missing[i];
                    }
                }

                return {
                    "success": false,
                    "message": "Missing required fields: " + missingStr,
                    "timestamp": time:utcNow()[0]
                };
            }

            // Validate and extract fields
            string|error titleVal = payload["title"].ensureType(string);
            if titleVal is error {
                return { "success": false, "message": "Invalid 'title' field: must be a string", "timestamp": time:utcNow()[0] };
            }
            string title = titleVal;

            string|error descVal = payload["description"].ensureType(string);
            if descVal is error {
                return { "success": false, "message": "Invalid 'description' field: must be a string", "timestamp": time:utcNow()[0] };
            }
            string description = descVal;

            int|error reqSigVal = payload["required_signature_count"].ensureType(int);
            if reqSigVal is error {
                return { "success": false, "message": "Invalid 'required_signature_count': must be an integer", "timestamp": time:utcNow()[0] };
            }
            int requiredSignatureCount = reqSigVal;

            int? creatorId = ();
            if payload.hasKey("creator_id") {
                if payload["creator_id"] is int {
                    creatorId = check payload["creator_id"].ensureType(int);
                }
            }

            string? deadline = ();
            if payload.hasKey("deadline") {
                if payload["deadline"] is string {
                    deadline = check payload["deadline"].ensureType(string);
                }
            }

            return petitionsService.createPetition(title, description, requiredSignatureCount, creatorId, deadline);
        } else {
            return {
                "success": false,
                "message": "Invalid payload format: expected JSON object",
                "timestamp": time:utcNow()[0]
            };
        }
    }

    # Update petition by ID
    #
    # + request - HTTP request containing updated petition data
    # + petitionId - Petition ID to update
    # + return - Updated petition data or error
    resource function put petitions/[int petitionId](http:Request request) returns json|error {
        log:printInfo("Update petition endpoint called for ID: " + petitionId.toString());

        json payload = check request.getJsonPayload();
        return petitionsService.updatePetition(petitionId, payload);
    }

    # Delete petition by ID
    #
    # + petitionId - Petition ID to delete
    # + return - Success message or error
    resource function delete petitions/[int petitionId]() returns json|error {
        log:printInfo("Delete petition endpoint called for ID: " + petitionId.toString());
        return petitionsService.deletePetition(petitionId);
    }

    # Get petitions by creator
    #
    # + creatorId - Creator ID to filter by
    # + return - Filtered petitions list or error
    resource function get petitions/creator/[int creatorId]() returns json|error {
        log:printInfo("Get petitions by creator endpoint called for creator ID: " + creatorId.toString());
        return petitionsService.getPetitionsByCreator(creatorId);
    }

    # Get petitions by status
    #
    # + status - Status to filter by
    # + return - Filtered petitions list or error
    resource function get petitions/status/[string status]() returns json|error {
        log:printInfo("Get petitions by status endpoint called for status: " + status);
        return petitionsService.getPetitionsByStatus(status);
    }

    # Search petitions by keyword
    #
    # + keyword - Keyword to search for
    # + return - Matching petitions list or error
    resource function get petitions/search/[string keyword]() returns json|error {
        log:printInfo("Search petitions endpoint called for keyword: " + keyword);
        return petitionsService.searchPetitions(keyword);
    }

    # Get petition statistics
    #
    # + return - Petition statistics or error
    resource function get petitions/statistics() returns json|error {
        log:printInfo("Get petition statistics endpoint called");
        return petitionsService.getPetitionStatistics();
    }

    # Get active petitions
    #
    # + return - Active petitions list or error
    resource function get petitions/active() returns json|error {
        log:printInfo("Get active petitions endpoint called");
        return petitionsService.getActivePetitions();
    }

    # Sign a petition
    #
    # + petitionId - Petition ID to sign
    # + request - HTTP request containing user information (optional)
    # + return - Updated petition data or error
    resource function post petitions/[int petitionId]/sign(http:Request request) returns json|error {
        log:printInfo("Sign petition endpoint called for ID: " + petitionId.toString());
        
        // Try to get user information from request body
        int? userId = ();
        json|error payload = request.getJsonPayload();
        if payload is json && payload.user_id is json {
            int|error userIdValue = payload.user_id.ensureType(int);
            if userIdValue is int {
                userId = userIdValue;
            }
        }
        
        return petitionsService.signPetition(petitionId, userId);
    }

    # Check if user has signed a petition
    #
    # + petitionId - Petition ID to check
    # + userId - User ID to check
    # + return - Boolean indicating if user has signed
    resource function get petitions/[int petitionId]/signed/[int userId]() returns json|error {
        log:printInfo("Check user signature endpoint called for petition " + petitionId.toString() + " and user " + userId.toString());
        boolean hasSigned = check petitionsService.hasUserSignedPetition(petitionId, userId);
        return {
            "success": true,
            "hasSigned": hasSigned,
            "petitionId": petitionId,
            "userId": userId,
            "timestamp": time:utcNow()[0]
        };
    }

    # Get all petition activities
    #
    # + return - Petition activities list or error
    resource function get petitionactivities() returns json|error {
        log:printInfo("Get all petition activities endpoint called");
        return petitionActivitiesService.getAllPetitionActivities();
    }

    # Get petition activity by ID
    #
    # + activityId - Activity ID to retrieve
    # + return - Activity data or error
    resource function get petitionactivities/[int activityId]() returns json|error {
        log:printInfo("Get petition activity by ID endpoint called for ID: " + activityId.toString());
        return petitionActivitiesService.getPetitionActivityById(activityId);
    }

    # Create a new petition activity
    #
    # + request - HTTP request containing activity data
    # + return - Created activity data or error
    resource function post petitionactivities(http:Request request) returns json|error {
        log:printInfo("Create petition activity endpoint called");

        json payload = check request.getJsonPayload();

        // Extract required fields
        int petitionId = check payload.petition_id;

        // Extract optional fields
        string activityType = payload.activity_type is string ? check payload.activity_type : "SIGNATURE";
        int signatureCount = payload.signature_count is int ? check payload.signature_count : 1;
        int? userId = payload.user_id is int ? check payload.user_id : ();

        return petitionActivitiesService.createPetitionActivity(petitionId, activityType, signatureCount, userId);
    }

    # Update petition activity by ID
    #
    # + request - HTTP request containing updated activity data
    # + activityId - Activity ID to update
    # + return - Updated activity data or error
    resource function put petitionactivities/[int activityId](http:Request request) returns json|error {
        log:printInfo("Update petition activity endpoint called for ID: " + activityId.toString());

        json payload = check request.getJsonPayload();
        return petitionActivitiesService.updatePetitionActivity(activityId, payload);
    }

    # Delete petition activity by ID
    #
    # + activityId - Activity ID to delete
    # + return - Success message or error
    resource function delete petitionactivities/[int activityId]() returns json|error {
        log:printInfo("Delete petition activity endpoint called for ID: " + activityId.toString());
        return petitionActivitiesService.deletePetitionActivity(activityId);
    }

    # Get activities by petition ID
    #
    # + petitionId - Petition ID to filter by
    # + return - Filtered activities list or error
    resource function get petitionactivities/petition/[int petitionId]() returns json|error {
        log:printInfo("Get activities by petition ID endpoint called for petition ID: " + petitionId.toString());
        return petitionActivitiesService.getActivitiesByPetitionId(petitionId);
    }

    # Get activities by user ID
    #
    # + userId - User ID to filter by
    # + return - Filtered activities list or error
    resource function get petitionactivities/user/[int userId]() returns json|error {
        log:printInfo("Get activities by user ID endpoint called for user ID: " + userId.toString());
        return petitionActivitiesService.getActivitiesByUserId(userId);
    }

    # Get activities by type
    #
    # + activityType - Activity type to filter by
    # + return - Filtered activities list or error
    resource function get petitionactivities/'type/[string activityType]() returns json|error {
        log:printInfo("Get activities by type endpoint called for type: " + activityType);
        return petitionActivitiesService.getActivitiesByType(activityType);
    }

    # Get recent activities
    #
    # + return - Recent activities list or error
    resource function get petitionactivities/recent() returns json|error {
        log:printInfo("Get recent petition activities endpoint called");
        return petitionActivitiesService.getRecentActivities();
    }

    # Get activity statistics
    #
    # + return - Activity statistics or error
    resource function get petitionactivities/statistics() returns json|error {
        log:printInfo("Get petition activity statistics endpoint called");
        return petitionActivitiesService.getActivityStatistics();
    }

    # Get all policy comments
    #
    # + return - Policy comments list or error
    resource function get policycomments() returns json|error {
        log:printInfo("Get all policy comments endpoint called");
        return policyCommentsService.getAllPolicyComments();
    }

    # Get policy comment by ID
    #
    # + commentId - Comment ID to retrieve
    # + return - Comment data or error
    resource function get policycomments/[int commentId]() returns json|error {
        log:printInfo("Get policy comment by ID endpoint called for ID: " + commentId.toString());
        return policyCommentsService.getPolicyCommentById(commentId);
    }

    # Create a new policy comment
    #
    # + request - HTTP request containing comment data
    # + return - Created comment data or error
    resource function post policycomments(http:Request request) returns json|error {
        log:printInfo("Create policy comment endpoint called");

        json payload = check request.getJsonPayload();

        // Extract required fields
        string comment = check payload.comment;
        int userId = check payload.user_id;
        int policyId = check payload.policy_id;

        // Extract optional fields
        int? replyId = payload.reply_id is int ? check payload.reply_id : ();
        string? replyComment = payload.reply_comment is string ? check payload.reply_comment : ();

        return policyCommentsService.createPolicyComment(comment, userId, policyId, replyId, replyComment);
    }

    # Update policy comment by ID
    #
    # + request - HTTP request containing updated comment data
    # + commentId - Comment ID to update
    # + return - Updated comment data or error
    resource function put policycomments/[int commentId](http:Request request) returns json|error {
        log:printInfo("Update policy comment endpoint called for ID: " + commentId.toString());

        json payload = check request.getJsonPayload();
        return policyCommentsService.updatePolicyComment(commentId, payload);
    }

    # Delete policy comment by ID
    #
    # + commentId - Comment ID to delete
    # + return - Success message or error
    resource function delete policycomments/[int commentId]() returns json|error {
        log:printInfo("Delete policy comment endpoint called for ID: " + commentId.toString());
        return policyCommentsService.deletePolicyComment(commentId);
    }

    # Get comments by user ID
    #
    # + userId - User ID to filter by
    # + return - Filtered comments list or error
    resource function get policycomments/user/[int userId]() returns json|error {
        log:printInfo("Get comments by user ID endpoint called for user ID: " + userId.toString());
        return policyCommentsService.getCommentsByUserId(userId);
    }

    # Get comments by policy ID
    #
    # + policyId - Policy ID to filter by
    # + return - Filtered comments list or error
    resource function get policycomments/policy/[int policyId]() returns json|error {
        log:printInfo("Get comments by policy ID endpoint called for policy ID: " + policyId.toString());
        return policyCommentsService.getCommentsByPolicyId(policyId);
    }

    # Get replies to a specific comment
    #
    # + commentId - Comment ID to get replies for
    # + return - Replies list or error
    resource function get policycomments/[int commentId]/replies() returns json|error {
        log:printInfo("Get replies by comment ID endpoint called for comment ID: " + commentId.toString());
        return policyCommentsService.getRepliesByCommentId(commentId);
    }

    # Search comments by keyword
    #
    # + keyword - Keyword to search for
    # + return - Matching comments list or error
    resource function get policycomments/search/[string keyword]() returns json|error {
        log:printInfo("Search policy comments endpoint called for keyword: " + keyword);
        return policyCommentsService.searchComments(keyword);
    }

    # Get comment statistics
    #
    # + return - Comment statistics or error
    resource function get policycomments/statistics() returns json|error {
        log:printInfo("Get policy comment statistics endpoint called");
        return policyCommentsService.getCommentStatistics();
    }

    # Get recent comments
    #
    # + return - Recent comments list or error
    resource function get policycomments/recent() returns json|error {
        log:printInfo("Get recent policy comments endpoint called");
        return policyCommentsService.getRecentComments();
    }

    # Like a comment
    #
    # + commentId - Comment ID to like
    # + return - Updated comment data or error
    resource function post policycomments/[int commentId]/like() returns json|error {
        log:printInfo("Like comment endpoint called for ID: " + commentId.toString());
        return policyCommentsService.likeComment(commentId);
    }

    # Unlike a comment
    #
    # + commentId - Comment ID to unlike
    # + return - Updated comment data or error
    resource function post policycomments/[int commentId]/unlike() returns json|error {
        log:printInfo("Unlike comment endpoint called for ID: " + commentId.toString());
        return policyCommentsService.unlikeComment(commentId);
    }

    # Get top liked comments
    #
    # + limit - Number of top comments to retrieve (default 10)
    # + return - Top liked comments list or error
    resource function get policycomments/top/[int 'limit]() returns json|error {
        log:printInfo("Get top liked comments endpoint called with limit: " + 'limit.toString());
        return policyCommentsService.getTopLikedComments('limit);
    }

    # Auth endpoints
    #
    # + request - HTTP request containing authorization data
    # + return - Authorization response
    resource function post auth/authorize(http:Request request) returns json|error {
        json payload = check request.getJsonPayload();
        json response = check web3Service->post("/auth/authorize", payload);
        return response;
    }

    # Revoke authorization
    #
    # + request - HTTP request containing revocation data  
    # + return - Revocation response
    resource function post auth/revoke(http:Request request) returns json|error {
        json payload = check request.getJsonPayload();
        json response = check web3Service->post("/auth/revoke", payload);
        return response;
    }

    # Check if address is authorized
    #
    # + address - Wallet address to check authorization for
    # + return - Authorization status response
    resource function get auth/isauthorized/[string address]() returns json|error {
        do {
            json response = check web3Service->get("/auth/is-authorized/" + address);
            map<anydata> respMap = check response.cloneWithType();
            boolean isVerified = respMap["isAuthorized"] is boolean ? <boolean>respMap["isAuthorized"] : false;

            if isVerified {
                // For now, return a simple token structure
                // In production, you would use proper JWT encoding
                string simpleToken = "jwt_" + address + "_" + time:utcNow()[0].toString();
                
                return {
                    address: address,
                    verified: true,
                    token: simpleToken
                };
            } else {
                return {
                    address: address,
                    verified: false,
                    token: ()
                };
            }
        } on fail error e {
            // If web3Service is not available, return default response
            log:printWarn("Web3 service not available for auth check: " + e.message());
            return {
                address: address,
                verified: false,
                token: ()
            };
        }
    }

    # Smart contract voting endpoints
    
    # Handle preflight requests for smart contract voting
    #
    # + caller - HTTP caller
    # + return - CORS preflight response
    resource function options proposal/'vote\-yes(http:Caller caller) returns error? {
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.statusCode = 200;
        check caller->respond(response);
    }

    # Handle preflight requests for smart contract voting
    #
    # + caller - HTTP caller
    # + return - CORS preflight response
    resource function options proposal/'vote\-no(http:Caller caller) returns error? {
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.statusCode = 200;
        check caller->respond(response);
    }
    
    # Vote YES on a proposal via smart contract
    #
    # + caller - HTTP caller
    # + req - HTTP request
    # + return - Smart contract vote response
    resource function post proposal/'vote\-yes(http:Caller caller, http:Request req) returns error? {
        log:printInfo("Smart contract vote YES endpoint called");
        
        // Set CORS headers explicitly
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        
        do {
            json payload = check req.getJsonPayload();
            log:printInfo("Vote YES payload: " + payload.toJsonString());
            
            // Extract proposal ID and signer index from payload
            int|error proposalId = payload.proposalId.ensureType(int);
            if proposalId is error {
                response.setJsonPayload({"error": "Invalid or missing proposalId"});
                response.statusCode = 400;
                check caller->respond(response);
                return;
            }
            
            int|error signerIndex = payload.signerIndex.ensureType(int);
            if signerIndex is error {
                response.setJsonPayload({"error": "Invalid or missing signerIndex"});
                response.statusCode = 400;
                check caller->respond(response);
                return;
            }

            // Extract wallet address if provided
            string? walletAddress = ();
            json|error walletAddressJson = payload.walletAddress;
            if walletAddressJson is json {
                string|error walletAddr = walletAddressJson.ensureType(string);
                if walletAddr is string {
                    walletAddress = walletAddr;
                    log:printInfo("👤 Wallet address: " + walletAddr);
                }
            }
            
            // Forward to smart contract service
            json web3Payload = {
                "proposalId": proposalId,
                "signerIndex": signerIndex
            };
            
            json web3Response = check web3Service->post("/proposal/vote-yes", web3Payload);
            log:printInfo("Smart contract YES vote response: " + web3Response.toJsonString());
            
            // Also update the database vote count with wallet address
            json|error updateResult = proposalsService.voteOnProposal(proposalId, "yes", walletAddress);
            if updateResult is error {
                log:printWarn("Failed to update database vote count: " + updateResult.message());
                // Still return success if blockchain vote succeeded
            } else {
                log:printInfo("Database vote count updated successfully");
            }
            
            response.setJsonPayload(web3Response);
            response.statusCode = 200;
            check caller->respond(response);
            
        } on fail error e {
            log:printError("Error in smart contract vote YES: " + e.message());
            response.setJsonPayload({"error": "Failed to process vote: " + e.message()});
            response.statusCode = 500;
            check caller->respond(response);
        }
    }
    
    # Vote NO on a proposal via smart contract
    #
    # + caller - HTTP caller
    # + req - HTTP request
    # + return - Smart contract vote response
    resource function post proposal/'vote\-no(http:Caller caller, http:Request req) returns error? {
        log:printInfo("Smart contract vote NO endpoint called");
        
        // Set CORS headers explicitly
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        
        do {
            json payload = check req.getJsonPayload();
            log:printInfo("Vote NO payload: " + payload.toJsonString());
            
            // Extract proposal ID and signer index from payload
            int|error proposalId = payload.proposalId.ensureType(int);
            if proposalId is error {
                response.setJsonPayload({"error": "Invalid or missing proposalId"});
                response.statusCode = 400;
                check caller->respond(response);
                return;
            }
            
            int|error signerIndex = payload.signerIndex.ensureType(int);
            if signerIndex is error {
                response.setJsonPayload({"error": "Invalid or missing signerIndex"});
                response.statusCode = 400;
                check caller->respond(response);
                return;
            }

            // Extract wallet address if provided
            string? walletAddress = ();
            json|error walletAddressJson = payload.walletAddress;
            if walletAddressJson is json {
                string|error walletAddr = walletAddressJson.ensureType(string);
                if walletAddr is string {
                    walletAddress = walletAddr;
                    log:printInfo("👤 Wallet address: " + walletAddr);
                }
            }
            
            // Forward to smart contract service
            json web3Payload = {
                "proposalId": proposalId,
                "signerIndex": signerIndex
            };
            
            json web3Response = check web3Service->post("/proposal/vote-no", web3Payload);
            log:printInfo("Smart contract NO vote response: " + web3Response.toJsonString());
            
            // Also update the database vote count with wallet address
            json|error updateResult = proposalsService.voteOnProposal(proposalId, "no", walletAddress);
            if updateResult is error {
                log:printWarn("Failed to update database vote count: " + updateResult.message());
                // Still return success if blockchain vote succeeded
            } else {
                log:printInfo("Database vote count updated successfully");
            }
            
            response.setJsonPayload(web3Response);
            check caller->respond(response);
            
        } on fail error e {
            log:printError("Error in smart contract vote NO: " + e.message());
            response.setJsonPayload({"error": "Failed to process vote: " + e.message()});
            response.statusCode = 500;
            check caller->respond(response);
        }
    }
}

listener http:Listener newListener = new (petitionPort);

service /petitions on newListener {

    resource function post create(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload();
        json response = check web3Service->post("/create-petition", payload);
        check caller->respond(response);
    }

    resource function post sign(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload();
        json response = check web3Service->post("/sign-petition", payload);
        check caller->respond(response);
    }

    // Fix: Use path parameter syntax
    resource function get [string id](http:Caller caller, http:Request req) returns error? {
        json response = check web3Service->get("/petition/" + id);
        check caller->respond(response);
    }

    // Fix: Use path parameter syntax for multiple parameters
    resource function get [string id]/[string address](http:Caller caller, http:Request req) returns error? {
        json response = check web3Service->get("/has-signed/" + id + "/" + address);
        check caller->respond(response);
    }



    resource function get health() returns string {
        return "Ballerina service is running!";
    }

}

# Get headers for HTTP requests
#
# + return - Headers map
function getHeaders() returns map<string> {
    return {
        "apikey": supabaseServiceRoleKey,
        "Authorization": "Bearer " + supabaseServiceRoleKey,
        "Content-Type": "application/json"
    };
}



# Ballerina service to connect to FastAPI chat endpoint
service / on new http:Listener(9090) {
    
    resource function post chat(http:Caller caller, http:Request req) returns error? {
        // Read JSON payload from frontend
        json payload = check req.getJsonPayload();

        // Forward to FastAPI with explicit application/json header
        http:Request forwardReq = new;
        forwardReq.setJsonPayload(payload);
        forwardReq.setHeader("Content-Type", "application/json");

    

        // Send request to FastAPI
        http:Response res = check fastapiChat->post("/chat", forwardReq);

        // Convert response to JSON
        json response = check res.getJsonPayload();

        // Send back to frontend
        check caller->respond(response);
    }
}





# Check database health via HTTP
#
# + return - Health status as JSON or error
function checkDatabaseHealth() returns json|error {
    do {
        map<string> headers = getHeaders();

        [int, decimal] startTime = time:utcNow();
        http:Response response = check supabaseClient->get("/rest/v1/", headers);
        [int, decimal] endTime = time:utcNow();
        int latency = endTime[0] - startTime[0];

        boolean connected = response.statusCode == 200;
        [int, decimal] currentTime = time:utcNow();

        return {
            "database": {
                "connected": connected,
                "message": connected ? "Supabase REST API connection successful" : "Connection failed",
                "latency": latency,
                "method": "HTTP REST API",
                "config": {
                    "url": supabaseUrl,
                    "api": "REST v1"
                }
            },
            "timestamp": currentTime[0]
        };
    } on fail error e {
        return error("Database health check failed: " + e.message());
    }
}

# Initialize database connection at startup
#
# + return - Error if initialization fails
function initializeDatabase() returns error? {
    log:printInfo("🔄 Initializing database connection...");

    do {
        map<string> headers = getHeaders();

        http:Response response = check supabaseClient->get("/rest/v1/", headers);

        if response.statusCode == 200 {
            log:printInfo("✅ Supabase REST API connection successful");
        } else {
            log:printWarn("⚠️  Supabase REST API connection failed");
        }
    } on fail error e {
        log:printError("❌ HTTP database connection failed", 'error = e);
        log:printWarn("⚠️  Server will start but database features may not work");
    }

    return;
}

// Helper: fetch aggregated blockchain data from web3 service using blocksBack
function fetchAllBlockchainData(int blocksBack) returns json|error {
    // Use GET query param style used by the web3 service
    string url = "/all/blockchain-data?blocksBack=" + blocksBack.toString();
    // Call the web3 service and handle errors gracefully (timeouts, connection failures, etc.)
    http:Response|error resp = web3Service->get(url);
    if resp is error {
        log:printError("❌ Error contacting web3 service", 'error = resp);
        // Convert to a friendly error for callers
        return error("Failed to fetch aggregated blockchain data: " + resp.message());
    }

    if resp.statusCode != 200 {
        log:printWarn("⚠️  Web3 service returned non-200 status", 'statusCode = resp.statusCode);
        return error("Failed to fetch aggregated blockchain data: " + resp.statusCode.toString());
    }

    json|error payloadOrErr = resp.getJsonPayload();
    if payloadOrErr is error {
        log:printError("❌ Failed to parse JSON from web3 service response", 'error = payloadOrErr);
        return error("Failed to fetch aggregated blockchain data: " + payloadOrErr.message());
    }

    return payloadOrErr;
}

# Sync proposals from blockchain
#
# + fromBlock - Starting block number
# + toBlock - Ending block number  
# + return - Sync results or error
function syncProposalsFromBlockchain(int fromBlock, int toBlock) returns json|error {
    log:printInfo("🗳️ Syncing proposals from blockchain...");
    
    // Fetch aggregated data and extract proposals
    json|error _aggProposalsResp = fetchAllBlockchainData((toBlock - fromBlock) > 0 ? toBlock - fromBlock : 1);
    json[] proposals = [];
    if _aggProposalsResp is json {
        json aggJson = _aggProposalsResp;
        if aggJson.proposals is json {
            json|error proposalsField = aggJson.proposals;
            json proposalsVal = check proposalsField.ensureType();
            proposals = <json[]>check proposalsVal.ensureType();
        }
    } else {
        return error("Failed to fetch aggregated blockchain data: " + _aggProposalsResp.message());
    }

    int newCount = 0;
    int updatedCount = 0;
    int removedCount = 0;
    json[] errors = [];

    // Get existing DB data
    json|error dbResponse = proposalsService.getAllProposals();
    json[] dbProposals = [];
    if dbResponse is json {
        dbProposals = <json[]>check dbResponse.data;
    }
    
    log:printInfo(string `📊 Found ${proposals.length()} proposals in blockchain and ${dbProposals.length()} in database`);

    // Phase 1: Check each DB record against blockchain data
    log:printInfo("🔍 Phase 1: Checking existing DB records against blockchain data...");
    foreach int i in 0 ..< dbProposals.length() {
        json dbProposal = dbProposals[i];
        int dbId = <int>check dbProposal.id;
        
        log:printInfo(string `🔍 Checking DB proposal ${i + 1}/${dbProposals.length()}: ID ${dbId}`);
        
        // Look for this record in blockchain data
        boolean foundInBlockchain = false;
        int blockchainIdValue = 0;
        
        if (dbProposal.blockchain_proposal_id is json) {
            blockchainIdValue = <int>check dbProposal.blockchain_proposal_id;
            
            foreach json blockchainProposal in proposals {
                if (blockchainProposal.blockchain_proposal_id is json) {
                    int bcId = <int>check blockchainProposal.blockchain_proposal_id;
                    if (bcId == blockchainIdValue) {
                        foundInBlockchain = true;
                        
                        // Compare data and update if different
                        boolean needsUpdate = false;
                        string dbTitle = <string>check dbProposal.title;
                        string bcTitle = <string>check blockchainProposal.title;
                        
                        if (dbTitle != bcTitle) {
                            needsUpdate = true;
                            log:printInfo(string `📝 Title differs: DB="${dbTitle}" vs BC="${bcTitle}"`);
                        }
                        
                        if (dbProposal.short_description is json && blockchainProposal.description is json) {
                            string dbDesc = <string>check dbProposal.short_description;
                            string bcDesc = <string>check blockchainProposal.description;
                            if (dbDesc != bcDesc) {
                                needsUpdate = true;
                                log:printInfo(string `📝 Description differs for proposal ${blockchainIdValue}`);
                            }
                        }
                        
                        if (dbProposal.yes_votes is json && blockchainProposal.yes_votes is json) {
                            int dbYes = <int>check dbProposal.yes_votes;
                            int bcYes = <int>check blockchainProposal.yes_votes;
                            if (dbYes != bcYes) {
                                needsUpdate = true;
                                log:printInfo(string `🗳️ Yes votes differ: DB=${dbYes} vs BC=${bcYes} for proposal ${blockchainIdValue}`);
                            }
                        }
                        
                        if (dbProposal.no_votes is json && blockchainProposal.no_votes is json) {
                            int dbNo = <int>check dbProposal.no_votes;
                            int bcNo = <int>check blockchainProposal.no_votes;
                            if (dbNo != bcNo) {
                                needsUpdate = true;
                                log:printInfo(string `🗳️ No votes differ: DB=${dbNo} vs BC=${bcNo} for proposal ${blockchainIdValue}`);
                            }
                        }
                        
                        if (needsUpdate) {
                            // Create update payload
                            map<json> updatePayload = {
                                "title": check blockchainProposal.title,
                                "short_description": check blockchainProposal.description,
                                "blockchain_proposal_id": check blockchainProposal.blockchain_proposal_id
                            };
                            
                            if (blockchainProposal.detailed_description is json) {
                                updatePayload["description_in_details"] = check blockchainProposal.detailed_description;
                            }
                            
                            if (blockchainProposal.yes_votes is json) {
                                updatePayload["yes_votes"] = check blockchainProposal.yes_votes;
                            }
                            
                            if (blockchainProposal.no_votes is json) {
                                updatePayload["no_votes"] = check blockchainProposal.no_votes;
                            }
                            
                            json|error updateResult = proposalsService.updateProposal(dbId, updatePayload);
                            if updateResult is json {
                                updatedCount += 1;
                                log:printInfo(string `✅ Updated proposal ${blockchainIdValue} in database`);
                            } else {
                                errors.push({"type": "update", "id": blockchainIdValue, "error": updateResult.message()});
                                log:printError(string `❌ Failed to update proposal ${blockchainIdValue}: ${updateResult.message()}`);
                            }
                        } else {
                            log:printInfo(string `✅ Proposal ${blockchainIdValue} is up to date`);
                        }
                        break;
                    }
                }
            }
        }
        
        if (!foundInBlockchain) {
            // This DB record doesn't exist in blockchain - delete it
            json|error deleteResult = proposalsService.deleteProposal(dbId);
            if deleteResult is json {
                removedCount += 1;
                log:printInfo(string `�️ Removed proposal ${dbId} (blockchain_id: ${blockchainIdValue}) from database - not found in blockchain`);
            } else {
                errors.push({"type": "delete", "id": dbId, "error": deleteResult.message()});
                log:printError(string `❌ Failed to delete proposal ${dbId}: ${deleteResult.message()}`);
            }
        }
    }

    // Phase 2: Check for new blockchain records not in database
    log:printInfo("🔍 Phase 2: Checking for new blockchain records...");
    foreach json blockchainProposal in proposals {
        int blockchainId = <int>check blockchainProposal.blockchain_proposal_id;
        
        // Look for this blockchain record in database
        boolean foundInDb = false;
        foreach json dbProposal in dbProposals {
            if (dbProposal.blockchain_proposal_id is json) {
                int dbBlockchainId = <int>check dbProposal.blockchain_proposal_id;
                if (dbBlockchainId == blockchainId) {
                    foundInDb = true;
                    break;
                }
            }
        }
        
        if (!foundInDb) {
            // New proposal from blockchain - create in DB
            string title = <string>check blockchainProposal.title;
            string description = <string>check blockchainProposal.description;
            string detailedDesc = "";
            if (blockchainProposal.detailed_description is json) {
                detailedDesc = <string>check blockchainProposal.detailed_description;
            }
            
            string deadline = "";
            if (blockchainProposal.deadline is json) {
                deadline = <string>check blockchainProposal.deadline;
            }
            
            int? creatorId = ();
            if (blockchainProposal.creator_id is json) {
                creatorId = <int>check blockchainProposal.creator_id;
            }
            
            int yesVotes = 0;
            if (blockchainProposal.yes_votes is json) {
                yesVotes = <int>check blockchainProposal.yes_votes;
            }
            
            int noVotes = 0;
            if (blockchainProposal.no_votes is json) {
                noVotes = <int>check blockchainProposal.no_votes;
            }
            
            json|error createResult = proposalsService.createProposal(title, description, detailedDesc, deadline, (), creatorId, true, yesVotes, noVotes);
            if createResult is json {
                newCount += 1;
                log:printInfo(string `✅ Created new proposal ${blockchainId} in database`);
            } else {
                errors.push({"type": "create", "id": blockchainId, "error": createResult.message()});
                log:printError(string `❌ Failed to create proposal ${blockchainId}: ${createResult.message()}`);
            }
        }
    }

    return {
        "status": "completed",
        "fromBlock": fromBlock,
        "toBlock": toBlock,
        "isFullSync": false,
        "results": {
            "new": newCount,
            "updated": updatedCount,
            "removed": removedCount,
            "errors": errors
        },
        "timestamp": time:utcNow()[0]
    };
}

# Sync petitions from blockchain  
#
# + fromBlock - Starting block number
# + toBlock - Ending block number
# + return - Sync results or error
function syncPetitionsFromBlockchain(int fromBlock, int toBlock) returns json|error {
    log:printInfo("📝 Syncing petitions from blockchain...");
    
    // request payload removed - using aggregated endpoint
    
    // Update: at the start of syncPetitionsFromBlockchain, replace the per-contract HTTP call with aggregated fetch
    // (the tool will insert this code where the function is defined)

    // Insert marker for syncPetitionsFromBlockchain usage
    // Note: this snippet will be used by the runtime to obtain the 'petitions' array
    // Ensure variable names don't conflict with existing ones in the function body

    // Fetch aggregated data and extract petitions
    json|error _aggPetitionsResp = fetchAllBlockchainData((toBlock - fromBlock) > 0 ? toBlock - fromBlock : 1);
    json[] petitions = [];
    if _aggPetitionsResp is json {
        json aggJson = _aggPetitionsResp;
        if aggJson.petitions is json {
            json|error petitionsField = aggJson.petitions;
            json petitionsVal = check petitionsField.ensureType();
            petitions = <json[]>check petitionsVal.ensureType();
        }
    } else {
        return error("Failed to fetch aggregated blockchain data: " + _aggPetitionsResp.message());
    }

    int newCount = 0;
    int updatedCount = 0;
    int removedCount = 0;
    json[] errors = [];

    // Get existing DB data
    json|error dbResponse = petitionsService.getAllPetitions();
    json[] dbPetitions = [];
    if dbResponse is json {
        dbPetitions = <json[]>check dbResponse.data;
    }

    // Sync each blockchain petition
    foreach json petition in petitions {
    json|error _blockchainIdVal = petition.blockchain_petition_id;
    int blockchainId = check _blockchainIdVal.ensureType(int);

        json? existingPetition = ();
        foreach json dbPet in dbPetitions {
            if (dbPet.blockchain_petition_id is json) {
                if (<int>check dbPet.blockchain_petition_id) == blockchainId {
                    existingPetition = dbPet;
                    break;
                }
            }
        }

        if existingPetition is () {
            // New petition - create in DB
            json|error _titleVal = petition.title;
            string title = check _titleVal.ensureType(string);
            json|error _descVal = petition.description;
            string description = check _descVal.ensureType(string);
            json|error _requiredVal = petition.required_signature_count;
            int required = check _requiredVal.ensureType(int);
            int? creatorId = ();
            if (petition.creator_id is json) {
                creatorId = check petition.creator_id.ensureType(int);
            }
            string? deadline = ();
            if (petition.deadline is json) {
                deadline = check petition.deadline.ensureType(string);
            }

            json|error createResult = petitionsService.createPetition(title, description, required, creatorId, deadline);
            if createResult is json {
                newCount += 1;
                log:printInfo(string `✅ Created petition ${blockchainId}`);
            } else {
                errors.push({"type": "create", "id": blockchainId, "error": createResult.message()});
            }
        } else {
            // Compare and update if needed
            boolean needsUpdate = false;
            
            // Check if title changed
            if ((<string>check existingPetition.title) != (<string>check petition.title)) {
                needsUpdate = true;
            }
            
            // Check if description changed
            if ((<string>check existingPetition.description) != (<string>check petition.description)) {
                needsUpdate = true;
            }
            
            // Check if required signature count changed
            if ((<int>check existingPetition.required_signature_count) != (<int>check petition.required_signature_count)) {
                needsUpdate = true;
            }
            
            // Check if current signature count changed
            if (petition.signature_count is json && existingPetition.signature_count is json) {
                if ((<int>check existingPetition.signature_count) != (<int>check petition.signature_count)) {
                    needsUpdate = true;
                }
            }
            
            // Check if status changed
            if (petition.is_active is json && existingPetition.is_active is json) {
                if ((<boolean>check existingPetition.is_active) != (<boolean>check petition.is_active)) {
                    needsUpdate = true;
                }
            }

            if needsUpdate {
                // Create update payload with proper field mapping
                map<json> updatePayload = {
                    "title": check petition.title,
                    "description": check petition.description,
                    "required_signature_count": check petition.required_signature_count,
                    "blockchain_petition_id": check petition.blockchain_petition_id
                };
                
                if (petition.signature_count is json) {
                    updatePayload["signature_count"] = check petition.signature_count;
                }
                
                if (petition.is_active is json) {
                    updatePayload["is_active"] = check petition.is_active;
                }
                
                json|error updateResult = petitionsService.updatePetition(<int>check existingPetition.id, updatePayload);
                if updateResult is json {
                    updatedCount += 1;
                    log:printInfo(string `🔄 Updated petition ${blockchainId}`);
                } else {
                    errors.push({"type": "update", "id": blockchainId, "error": updateResult.message()});
                }
            }
        }
    }

    // Remove DB entries not present in blockchain
    foreach json dbPet in dbPetitions {
        if (dbPet.blockchain_petition_id is json) {
            int dbBlockchainId = <int>check dbPet.blockchain_petition_id;
            boolean existsInBlockchain = false;
            foreach json petition in petitions {
                if (<int>check petition.blockchain_petition_id) == dbBlockchainId {
                    existsInBlockchain = true;
                    break;
                }
            }
            if !existsInBlockchain {
                json|error deleteResult = petitionsService.deletePetition(<int>check dbPet.id);
                if deleteResult is json {
                    removedCount += 1;
                    log:printInfo(string `🗑️ Removed petition ${dbBlockchainId}`);
                } else {
                    errors.push({"type": "delete", "id": dbBlockchainId, "error": deleteResult.message()});
                }
            }
        }
    }

    return {
        "status": "completed",
        "fromBlock": fromBlock,
        "toBlock": toBlock,
        "isFullSync": false,
        "results": {
            "new": newCount,
            "updated": updatedCount,
            "removed": removedCount,
            "errors": errors
        },
        "timestamp": time:utcNow()[0]
    };
}

# Sync reports from blockchain
#
# + fromBlock - Starting block number  
# + toBlock - Ending block number
# + return - Sync results or error
function syncReportsFromBlockchain(int fromBlock, int toBlock) returns json|error {
    log:printInfo("📊 Syncing reports from blockchain...");
    
    // request payload removed - using aggregated endpoint
    
    // Update: at the start of syncReportsFromBlockchain, replace the per-contract HTTP call with aggregated fetch
    // (the tool will insert this code where the function is defined)

    // Insert marker for syncReportsFromBlockchain usage
    // Note: this snippet will be used by the runtime to obtain the 'reports' array
    // Ensure variable names don't conflict with existing ones in the function body

    // Fetch aggregated data and extract reports
    json|error _aggReportsResp = fetchAllBlockchainData((toBlock - fromBlock) > 0 ? toBlock - fromBlock : 1);
    json[] reports = [];
    if _aggReportsResp is json {
        json aggJson = _aggReportsResp;
        if aggJson.reports is json {
            json|error reportsField = aggJson.reports;
            json reportsVal = check reportsField.ensureType();
            reports = <json[]>check reportsVal.ensureType();
        }
    } else {
        return error("Failed to fetch aggregated blockchain data: " + _aggReportsResp.message());
    }

    int newCount = 0;
    int updatedCount = 0;
    int removedCount = 0;
    json[] errors = [];

    json|error dbResponse = reportsService.getAllReports();
    json[] dbReports = [];
    if dbResponse is json {
        dbReports = <json[]>check dbResponse.data;
    }

    foreach json report in reports {
        int blockchainId = <int>check report.blockchain_report_id;

        json? existingReport = ();
        foreach json dbR in dbReports {
            if (dbR.blockchain_report_id is json) {
                if (<int>check dbR.blockchain_report_id) == blockchainId {
                    existingReport = dbR;
                    break;
                }
            }
        }

        if existingReport is () {
            json|error _rTitle = report.title;
            string title = check _rTitle.ensureType(string);
            json|error _rDesc = report.description;
            string description = check _rDesc.ensureType(string);
            string priority = "MEDIUM";
            if (report.priority is json) {
                priority = check report.priority.ensureType(string);
            }
            if (report.upvotes is json) {
                var _ = check report.upvotes.ensureType(int);
            }
            if (report.downvotes is json) {
                var _ = check report.downvotes.ensureType(int);
            }
            string creator = "";
            if (report.creator_address is json) {
                creator = check report.creator_address.ensureType(string);
            }

            json|error createResult = reportsService.createReport(title, "blockchain_evidence", description, priority, creator, ());
            if createResult is json {
                newCount += 1;
                log:printInfo(string `✅ Created report ${blockchainId}`);
            } else {
                errors.push({"type": "create", "id": blockchainId, "error": createResult.message()});
            }
        } else {
            // Compare and update if needed
            boolean needsUpdate = false;
            
            // Check if title changed
            if (<string>check existingReport.report_title) != (<string>check report.title) {
                needsUpdate = true;
            }
            
            // Check if description changed
            if (<string>check existingReport.description) != (<string>check report.description) {
                needsUpdate = true;
            }
            
            // Check if priority changed
            if (report.priority is json && existingReport.priority is json) {
                if (<string>check existingReport.priority) != (<string>check report.priority) {
                    needsUpdate = true;
                }
            }
            
            if needsUpdate {
                // Create update payload with proper field mapping
                map<json> updatePayload = {
                    "report_title": check report.title,
                    "description": check report.description,
                    "blockchain_report_id": check report.blockchain_report_id
                };
                
                if (report.priority is json) {
                    updatePayload["priority"] = check report.priority;
                }
                
                json|error updateResult = reportsService.updateReport(<int>check existingReport.report_id, updatePayload);
                if updateResult is json {
                    updatedCount += 1;
                    log:printInfo(string `🔄 Updated report ${blockchainId}`);
                } else {
                    errors.push({"type": "update", "id": blockchainId, "error": updateResult.message()});
                }
            }
        }
    }

    foreach json dbR in dbReports {
        if (dbR.blockchain_report_id is json) {
            int dbBlockchainId = <int>check dbR.blockchain_report_id;
            boolean existsInBlockchain = false;
            foreach json report in reports {
                if (<int>check report.blockchain_report_id) == dbBlockchainId {
                    existsInBlockchain = true;
                    break;
                }
            }
            if !existsInBlockchain {
                json|error deleteResult = reportsService.deleteReport(<int>check dbR.report_id);
                if deleteResult is json {
                    removedCount += 1;
                    log:printInfo(string `🗑️ Removed report ${dbBlockchainId}`);
                } else {
                    errors.push({"type": "delete", "id": dbBlockchainId, "error": deleteResult.message()});
                }
            }
        }
    }

    return {
        "status": "completed",
        "fromBlock": fromBlock,
        "toBlock": toBlock,
        "isFullSync": false,
        "results": {
            "new": newCount,
            "updated": updatedCount,
            "removed": removedCount,
            "errors": errors
        },
        "timestamp": time:utcNow()[0]
    };
}

# Sync policies from blockchain
#
# + fromBlock - Starting block number
# + toBlock - Ending block number  
# + return - Sync results or error
function syncPoliciesFromBlockchain(int fromBlock, int toBlock) returns json|error {
    log:printInfo("📜 Syncing policies from blockchain...");
    
    // request payload removed - using aggregated endpoint
    
    // Update: at the start of syncPoliciesFromBlockchain, replace the per-contract HTTP call with aggregated fetch
    // (the tool will insert this code where the function is defined)

    // Insert marker for syncPoliciesFromBlockchain usage
    // Note: this snippet will be used by the runtime to obtain the 'policies' array
    // Ensure variable names don't conflict with existing ones in the function body

    // Fetch aggregated data and extract policies
    json|error _aggPoliciesResp = fetchAllBlockchainData((toBlock - fromBlock) > 0 ? toBlock - fromBlock : 1);
    json[] policies = [];
    if _aggPoliciesResp is json {
        json aggJson = _aggPoliciesResp;
        if aggJson.policies is json {
            json|error policiesField = aggJson.policies;
            json policiesVal = check policiesField.ensureType();
            policies = <json[]>check policiesVal.ensureType();
        }
    } else {
        return error("Failed to fetch aggregated blockchain data: " + _aggPoliciesResp.message());
    }

    int newCount = 0;
    int updatedCount = 0;
    int removedCount = 0;
    json[] errors = [];

    json|error dbResponse = policiesService.getAllPolicies(1, 1000);
    json[] dbPolicies = [];
    if dbResponse is json {
        dbPolicies = <json[]>check dbResponse.data;
    }

    foreach json policy in policies {
        int blockchainId = <int>check policy.blockchain_policy_id;

        json? existingPolicy = ();
        foreach json dbP in dbPolicies {
            if (dbP.blockchain_policy_id is json) {
                if (<int>check dbP.blockchain_policy_id) == blockchainId {
                    existingPolicy = dbP;
                    break;
                }
            }
        }

        if existingPolicy is () {
            json|error _pTitle = policy.title;
            string title = check _pTitle.ensureType(string);
            json|error _pContent = policy.content;
            string content = check _pContent.ensureType(string);
            
            string description = content;
            if (policy.description is json) {
                description = check policy.description.ensureType(string);
            }
            
            string ministry = "UNKNOWN";
            if (policy.ministry is json) {
                ministry = check policy.ministry.ensureType(string);
            }
            
            string status = "DRAFT";
            if (policy.status is json) {
                status = check policy.status.ensureType(string);
            }
            
            if (policy.category_id is json) {
                var _ = check policy.category_id.ensureType(int);
            }
            if (policy.author_address is json) {
                var _ = check policy.author_address.ensureType(string);
            }

            json|error createResult = policiesService.createPolicy(title, description, content, ministry, status, ());
            if createResult is json {
                newCount += 1;
                log:printInfo(string `✅ Created policy ${blockchainId}`);
            } else {
                errors.push({"type": "create", "id": blockchainId, "error": createResult.message()});
            }
        } else {
            // Compare and update if needed
            boolean needsUpdate = false;
            
            // Check if title changed
            if (<string>check existingPolicy.name) != (<string>check policy.title) {
                needsUpdate = true;
            }
            
            // Check if content changed
            if (<string>check existingPolicy.description) != (<string>check policy.content) {
                needsUpdate = true;
            }
            
            // Check if view_full_policy changed
            if (<string>check existingPolicy.view_full_policy) != (<string>check policy.content) {
                needsUpdate = true;
            }
            
            // Check if status changed
            if (policy.status is json && existingPolicy.status is json) {
                if (<string>check existingPolicy.status) != (<string>check policy.status) {
                    needsUpdate = true;
                }
            }
            
            if needsUpdate {
                // Create update payload with proper field mapping
                map<json> updatePayload = {
                    "name": check policy.title,
                    "description": check policy.content,
                    "view_full_policy": check policy.content,
                    "blockchain_policy_id": check policy.blockchain_policy_id
                };
                
                if (policy.status is json) {
                    updatePayload["status"] = check policy.status;
                }
                
                if (policy.ministry is json) {
                    updatePayload["ministry"] = check policy.ministry;
                }
                
                json|error updateResult = policiesService.updatePolicy(<int>check existingPolicy.id, updatePayload);
                if updateResult is json {
                    updatedCount += 1;
                    log:printInfo(string `🔄 Updated policy ${blockchainId}`);
                } else {
                    errors.push({"type": "update", "id": blockchainId, "error": updateResult.message()});
                }
            }
        }
    }

    foreach json dbP in dbPolicies {
        if (dbP.blockchain_policy_id is json) {
            int dbBlockchainId = <int>check dbP.blockchain_policy_id;
            boolean existsInBlockchain = false;
            foreach json policy in policies {
                if (<int>check policy.blockchain_policy_id) == dbBlockchainId {
                    existsInBlockchain = true;
                    break;
                }
            }
            if !existsInBlockchain {
                json|error deleteResult = policiesService.deletePolicy(<int>check dbP.id);
                if deleteResult is json {
                    removedCount += 1;
                    log:printInfo(string `🗑️ Removed policy ${dbBlockchainId}`);
                } else {
                    errors.push({"type": "delete", "id": dbBlockchainId, "error": deleteResult.message()});
                }
            }
        }
    }

    return {
        "status": "completed",
        "fromBlock": fromBlock,
        "toBlock": toBlock,
        "isFullSync": false,
        "results": {
            "new": newCount,
            "updated": updatedCount,
            "removed": removedCount,
            "errors": errors
        },
        "timestamp": time:utcNow()[0]
    };
}

# Sync projects from blockchain  
#
# + fromBlock - Starting block number
# + toBlock - Ending block number
# + return - Sync results or error
function syncProjectsFromBlockchain(int fromBlock, int toBlock) returns json|error {
    log:printInfo("🏗️ Syncing projects from blockchain...");
    
    // request payload removed - using aggregated endpoint
    
    // Update: at the start of syncProjectsFromBlockchain, replace the per-contract HTTP call with aggregated fetch
    // (the tool will insert this code where the function is defined)

    // Insert marker for syncProjectsFromBlockchain usage
    // Note: this snippet will be used by the runtime to obtain the 'projects' array
    // Ensure variable names don't conflict with existing ones in the function body

    // Fetch aggregated data and extract projects
    json|error _aggProjectsResp = fetchAllBlockchainData((toBlock - fromBlock) > 0 ? toBlock - fromBlock : 1);
    json[] projects = [];
    if _aggProjectsResp is json {
        json aggJson = _aggProjectsResp;
        if aggJson.projects is json {
            json|error projectsField = aggJson.projects;
            json projectsVal = check projectsField.ensureType();
            projects = <json[]>check projectsVal.ensureType();
        }
    } else {
        return error("Failed to fetch aggregated blockchain data: " + _aggProjectsResp.message());
    }

    int newCount = 0;
    int updatedCount = 0;
    int removedCount = 0;
    json[] errors = [];

    json|error dbResponse = projectsService.getAllProjects();
    json[] dbProjects = [];
    if dbResponse is json {
        dbProjects = <json[]>check dbResponse.data;
    }

    foreach json project in projects {
        int blockchainId = <int>check project.blockchain_project_id;

        json? existingProject = ();
        foreach json dbPr in dbProjects {
            if (dbPr.blockchain_project_id is json) {
                if (<int>check dbPr.blockchain_project_id) == blockchainId {
                    existingProject = dbPr;
                    break;
                }
            }
        }

        if existingProject is () {
            json|error _prTitle = project.title;
            string title = check _prTitle.ensureType(string);
            
            string description = "";
            if (project.description is json) {
                description = check project.description.ensureType(string);
            }
            
            decimal allocated = 0d;
            if (project.allocated_budget is json) {
                allocated = check project.allocated_budget.ensureType(decimal);
            }
            
            decimal spent = 0d;
            if (project.spent_budget is json) {
                spent = check project.spent_budget.ensureType(decimal);
            }
            
            string state = "";
            if (project.state is json) {
                state = check project.state.ensureType(string);
            }
            
            string province = "";
            if (project.province is json) {
                province = check project.province.ensureType(string);
            }
            
            string ministry = "";
            if (project.ministry is json) {
                ministry = check project.ministry.ensureType(string);
            }
            
            string status = "PLANNED";
            if (project.status is json) {
                status = check project.status.ensureType(string);
            }

            json|error createResult = projectsService.createProject(title, state, province, ministry, allocated, (), spent, description, status);
            if createResult is json {
                newCount += 1;
                log:printInfo(string `✅ Created project ${blockchainId}`);
            } else {
                errors.push({"type": "create", "id": blockchainId, "error": createResult.message()});
            }
        } else {
            // Compare and update if needed
            boolean needsUpdate = false;
            
            // Check if title changed
            if (<string>check existingProject.project_name) != (<string>check project.title) {
                needsUpdate = true;
            }
            
            // Check if allocated budget changed
            if (project.allocated_budget is json && existingProject.allocated_budget is json) {
                if (<decimal>check existingProject.allocated_budget) != (<decimal>check project.allocated_budget) {
                    needsUpdate = true;
                }
            }
            
            // Check if spent budget changed
            if (project.spent_budget is json && existingProject.spent_budget is json) {
                if (<decimal>check existingProject.spent_budget) != (<decimal>check project.spent_budget) {
                    needsUpdate = true;
                }
            }
            
            // Check if status changed
            if (project.status is json && existingProject.status is json) {
                if (<string>check existingProject.status) != (<string>check project.status) {
                    needsUpdate = true;
                }
            }
            
            // Check if description changed
            if (project.description is json && existingProject.view_details is json) {
                if (<string>check existingProject.view_details) != (<string>check project.description) {
                    needsUpdate = true;
                }
            }
            
            if needsUpdate {
                // Create update payload with proper field mapping
                map<json> updatePayload = {
                    "project_name": check project.title,
                    "blockchain_project_id": check project.blockchain_project_id
                };
                
                if (project.allocated_budget is json) {
                    updatePayload["allocated_budget"] = check project.allocated_budget;
                }
                
                if (project.spent_budget is json) {
                    updatePayload["spent_budget"] = check project.spent_budget;
                }
                
                if (project.status is json) {
                    updatePayload["status"] = check project.status;
                }
                
                if (project.description is json) {
                    updatePayload["view_details"] = check project.description;
                }
                
                if (project.state is json) {
                    updatePayload["state"] = check project.state;
                }
                
                if (project.province is json) {
                    updatePayload["province"] = check project.province;
                }
                
                if (project.ministry is json) {
                    updatePayload["ministry"] = check project.ministry;
                }
                
                json|error updateResult = projectsService.updateProject(<int>check existingProject.id, updatePayload);
                if updateResult is json {
                    updatedCount += 1;
                    log:printInfo(string `🔄 Updated project ${blockchainId}`);
                } else {
                    errors.push({"type": "update", "id": blockchainId, "error": updateResult.message()});
                }
            }
        }
    }

    foreach json dbPr in dbProjects {
        if (dbPr.blockchain_project_id is json) {
            int dbBlockchainId = <int>check dbPr.blockchain_project_id;
            boolean existsInBlockchain = false;
            foreach json project in projects {
                if (<int>check project.blockchain_project_id) == dbBlockchainId {
                    existsInBlockchain = true;
                    break;
                }
            }
            if !existsInBlockchain {
                json|error deleteResult = projectsService.deleteProject(<int>check dbPr.id);
                if deleteResult is json {
                    removedCount += 1;
                    log:printInfo(string `🗑️ Removed project ${dbBlockchainId}`);
                } else {
                    errors.push({"type": "delete", "id": dbBlockchainId, "error": deleteResult.message()});
                }
            }
        }
    }

    return {
        "status": "completed",
        "fromBlock": fromBlock,
        "toBlock": toBlock,
        "isFullSync": false,
        "results": {
            "new": newCount,
            "updated": updatedCount,
            "removed": removedCount,
            "errors": errors
        },
        "timestamp": time:utcNow()[0]
    };
}

# Application entry point
#
# + return - Error if application fails to start
public function main() returns error? {
    log:printInfo("🚀 Starting Transparent Governance Platform Backend v2.0...");

    // Initialize database connection at startup
    check initializeDatabase();

    log:printInfo("🌐 Server started on port " + port.toString());
    log:printInfo("📋 Available endpoints:");
    log:printInfo("  ➤ Health check: http://localhost:" + port.toString() + "/api/health");
    log:printInfo("  ➤ Server status: http://localhost:" + port.toString() + "/api/status");
    log:printInfo("  ➤ Database health: http://localhost:" + port.toString() + "/api/db/health");
    log:printInfo("  ➤ Server info: http://localhost:" + port.toString() + "/api/info");
    log:printInfo("  ➤ Categories CRUD: http://localhost:" + port.toString() + "/api/categories");
    log:printInfo("  ➤ Policies CRUD: http://localhost:" + port.toString() + "/api/policies");
    log:printInfo("  ➤ Projects CRUD: http://localhost:" + port.toString() + "/api/projects");
    log:printInfo("  ➤ Transactions CRUD: http://localhost:" + port.toString() + "/api/transactions");
    log:printInfo("  ➤ Proposals CRUD: http://localhost:" + port.toString() + "/api/proposals");
    log:printInfo("  ➤ Users CRUD: http://localhost:" + port.toString() + "/api/users");
    log:printInfo("  ➤ Reports CRUD: http://localhost:" + port.toString() + "/api/reports");
    log:printInfo("  ➤ Petitions CRUD: http://localhost:" + port.toString() + "/api/petitions");
    log:printInfo("  ➤ Petition Activities CRUD: http://localhost:" + port.toString() + "/api/petitionactivities");
    log:printInfo("  ➤ Policy Comments CRUD: http://localhost:" + port.toString() + "/api/policycomments");
    log:printInfo("  ➤ Chat endpoint: http://localhost:" + port.toString() + "/chat");
    log:printInfo("🎉 Server is ready to accept requests!");
    log:printInfo("💡 Note: Now using environment variables for configuration");

    return;
}