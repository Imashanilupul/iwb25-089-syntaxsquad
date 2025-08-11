import server_bal.categories;
import server_bal.policy;
import server_bal.projects;
import server_bal.transactions;
import server_bal.proposals;

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
http:Client web3Service = check new ("http://localhost:3001");

# Global HTTP client for Supabase API
http:Client supabaseClient = check new (supabaseUrl);

categories:CategoriesService categoriesService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
policy:PoliciesService policiesService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
projects:ProjectsService projectsService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
transactions:TransactionsService transactionsService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);
proposals:ProposalsService proposalsService = new (supabaseClient, port, supabaseUrl, supabaseServiceRoleKey);

# Main API service
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
                "GET /api/transactions/recent - Get recent transactions"
            ],
            "features": [
                "Environment-based configuration",
                "Modular architecture",
                "Category management",
                "Policy management",
                "Project management",
                "Transaction management",
                "Database health monitoring"
            ],
            "timestamp": currentTime[0]
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

    # Get all policies
    #
    # + return - Policies list or error
    resource function get policies() returns json|error {
        log:printInfo("Get all policies endpoint called");
        return policiesService.getAllPolicies();
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

service /auth on newListener {
    resource function post authorize(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload();
        json response = check web3Service->post("/auth/authorize", payload);
        check caller->respond(response);
    }

    resource function post revoke(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload();
        json response = check web3Service->post("/auth/revoke", payload);
        check caller->respond(response);
    }

    resource function get isauthorized/[string address](http:Caller caller, http:Request req) returns error? {
        json response = check web3Service->get("/auth/is-authorized/" + address);
        map<anydata> respMap = check response.cloneWithType();
        boolean isVerified = respMap["isAuthorized"] is boolean ? <boolean>respMap["isAuthorized"] : false;

        if isVerified {
            // For now, return a simple token structure
            // In production, you would use proper JWT encoding
            string simpleToken = "jwt_" + address + "_" + time:utcNow()[0].toString();
            
            check caller->respond({
                address: address,
                verified: true,
                token: simpleToken
            });
        } else {
            check caller->respond({
                address: address,
                verified: false,
                token: ()
            });
        }
    }

    resource function get health() returns string {
        return "Auth service is running!";
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
    log:printInfo("🎉 Server is ready to accept requests!");
    log:printInfo("💡 Note: Now using environment variables for configuration");

    return;
}
