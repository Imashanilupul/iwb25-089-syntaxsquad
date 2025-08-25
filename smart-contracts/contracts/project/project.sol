// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAuthRegistry {
    function isAuthorized(address user) external view returns (bool);
    function isAdmin(address user) external view returns (bool);

}

contract Project {
    struct ProjectData {
        uint256 projectId;
        string projectName;
        string categoryName;
        uint256 allocatedBudget;
        uint256 spentBudget;
        string state;
        string province;
        string ministry;
        string viewDetailsCid; // IPFS CID for detailed view
        string status;
        address creator;
        uint256 createdAt;
        uint256 updatedAt;
    }

    IAuthRegistry public authRegistry;
    uint256 public projectCount;
    mapping(uint256 => ProjectData) private projects;
    mapping(address => uint256) public lastCreatedAt;

    // Events
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        string projectName,
        string categoryName,
        uint256 allocatedBudget,
        string state,
        string province,
        string ministry,
        string status
    );
    event ProjectUpdated(
        uint256 indexed projectId,
        address indexed updater,
        string projectName,
        string status
    );
    event BudgetSpent(
        uint256 indexed projectId,
        address indexed spender,
        uint256 amount,
        uint256 totalSpent
    );
    event BudgetDeducted(
        uint256 indexed projectId,
        address indexed deductor,
        uint256 amount,
        uint256 totalSpent
    );
    event ProjectStatusChanged(
        uint256 indexed projectId,
        string oldStatus,
        string newStatus
    );

    constructor(address _authRegistry) {
        require(_authRegistry != address(0), "Auth registry address cannot be zero");
        authRegistry = IAuthRegistry(_authRegistry);
    }

    // Only authorized users can perform write operations
    modifier onlyAuthorized() {
        require(authRegistry.isAdmin(msg.sender), "User not authorized");
        _;
    }

    // Only project creator can modify
    modifier onlyCreator(uint256 projectId) {
        ProjectData storage p = projects[projectId];
        require(msg.sender == p.creator, "Only creator can modify project");
        _;
    }

    // Check if project exists
    modifier projectExists(uint256 projectId) {
        require(projectId > 0 && projectId <= projectCount, "Project does not exist");
        require(projects[projectId].creator != address(0), "Project does not exist");
        _;
    }

    /**
     * Create a new project
     * @param projectName Name of the project
     * @param categoryName Category name for the project
     * @param allocatedBudget Total allocated budget in wei
     * @param state State where project is located
     * @param province Province where project is located
     * @param ministry Ministry responsible for the project
     * @param viewDetailsCid IPFS CID for detailed project information
     * @param status Initial status of the project
     * @return projectId The ID of the created project
     */
    function createProject(
        string calldata projectName,
        string calldata categoryName,
        uint256 allocatedBudget,
        string calldata state,
        string calldata province,
        string calldata ministry,
        string calldata viewDetailsCid,
        string calldata status
    ) external onlyAuthorized returns (uint256) {
        require(bytes(projectName).length > 0, "Project name cannot be empty");
        require(bytes(categoryName).length > 0, "Category name cannot be empty");
        require(allocatedBudget > 0, "Allocated budget must be greater than 0");
        require(bytes(state).length > 0, "State cannot be empty");
        require(bytes(province).length > 0, "Province cannot be empty");
        require(bytes(ministry).length > 0, "Ministry cannot be empty");
        require(bytes(status).length > 0, "Status cannot be empty");

        projectCount++;
        uint256 projectId = projectCount;

        ProjectData storage p = projects[projectId];
        p.projectId = projectId;
        p.projectName = projectName;
        p.categoryName = categoryName;
        p.allocatedBudget = allocatedBudget;
        p.spentBudget = 0;
        p.state = state;
        p.province = province;
        p.ministry = ministry;
        p.viewDetailsCid = viewDetailsCid;
        p.status = status;
        p.creator = msg.sender;
        p.createdAt = block.timestamp;
        p.updatedAt = block.timestamp;

        lastCreatedAt[msg.sender] = block.timestamp;

        emit ProjectCreated(
            projectId,
            msg.sender,
            projectName,
            categoryName,
            allocatedBudget,
            state,
            province,
            ministry,
            status
        );

        return projectId;
    }

    /**
     * Update project details
     * @param projectId The ID of the project to update
     * @param projectName New project name
     * @param categoryName New category name
     * @param state New state
     * @param province New province
     * @param ministry New ministry
     * @param viewDetailsCid New IPFS CID for detailed information
     * @param status New status
     */
    function updateProject(
        uint256 projectId,
        string calldata projectName,
        string calldata categoryName,
        string calldata state,
        string calldata province,
        string calldata ministry,
        string calldata viewDetailsCid,
        string calldata status
    ) external onlyAuthorized projectExists(projectId) onlyCreator(projectId) {
        require(bytes(projectName).length > 0, "Project name cannot be empty");
        require(bytes(categoryName).length > 0, "Category name cannot be empty");
        require(bytes(state).length > 0, "State cannot be empty");
        require(bytes(province).length > 0, "Province cannot be empty");
        require(bytes(ministry).length > 0, "Ministry cannot be empty");
        require(bytes(status).length > 0, "Status cannot be empty");

        ProjectData storage p = projects[projectId];
        string memory oldStatus = p.status;
        
        p.projectName = projectName;
        p.categoryName = categoryName;
        p.state = state;
        p.province = province;
        p.ministry = ministry;
        p.viewDetailsCid = viewDetailsCid;
        p.status = status;
        p.updatedAt = block.timestamp;

        emit ProjectUpdated(projectId, msg.sender, projectName, status);
        
        if (keccak256(bytes(oldStatus)) != keccak256(bytes(status))) {
            emit ProjectStatusChanged(projectId, oldStatus, status);
        }
    }

    /**
     * Add to spent budget
     * @param projectId The ID of the project
     * @param amount Amount to add to spent budget
     */
    function addSpentBudget(uint256 projectId, uint256 amount) external onlyAuthorized projectExists(projectId) onlyCreator(projectId) {
        require(amount > 0, "Amount must be greater than 0");
        
        ProjectData storage p = projects[projectId];
        require(p.spentBudget + amount <= p.allocatedBudget, "Cannot exceed allocated budget");
        
        p.spentBudget += amount;
        p.updatedAt = block.timestamp;

        emit BudgetSpent(projectId, msg.sender, amount, p.spentBudget);
    }

    /**
     * Deduct from spent budget
     * @param projectId The ID of the project
     * @param amount Amount to deduct from spent budget
     */
    function deductSpentBudget(uint256 projectId, uint256 amount) external onlyAuthorized projectExists(projectId) onlyCreator(projectId) {
        require(amount > 0, "Amount must be greater than 0");
        
        ProjectData storage p = projects[projectId];
        require(p.spentBudget >= amount, "Cannot deduct more than spent budget");
        
        p.spentBudget -= amount;
        p.updatedAt = block.timestamp;

        emit BudgetDeducted(projectId, msg.sender, amount, p.spentBudget);
    }

    /**
     * Update allocated budget
     * @param projectId The ID of the project
     * @param newAllocatedBudget New allocated budget amount
     */
    function updateAllocatedBudget(uint256 projectId, uint256 newAllocatedBudget) external onlyAuthorized projectExists(projectId) onlyCreator(projectId) {
        require(newAllocatedBudget > 0, "Allocated budget must be greater than 0");
        
        ProjectData storage p = projects[projectId];
        require(newAllocatedBudget >= p.spentBudget, "Allocated budget cannot be less than spent budget");
        
        p.allocatedBudget = newAllocatedBudget;
        p.updatedAt = block.timestamp;
    }

    function getProject(uint256 projectId) external view projectExists(projectId) returns (
        uint256 id,
        string memory projectName,
        string memory categoryName,
        uint256 allocatedBudget,
        uint256 spentBudget,
        string memory state,
        string memory province,
        string memory ministry,
        string memory viewDetailsCid,
        string memory status,
        address creator,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        ProjectData storage p = projects[projectId];
        
        return (
            p.projectId,
            p.projectName,
            p.categoryName,
            p.allocatedBudget,
            p.spentBudget,
            p.state,
            p.province,
            p.ministry,
            p.viewDetailsCid,
            p.status,
            p.creator,
            p.createdAt,
            p.updatedAt
        );
    }

    /**
     * Get project budget information
     * @param projectId The ID of the project
     * @return allocatedBudget Total allocated budget
     * @return spentBudget Total spent budget
     * @return remainingBudget Remaining budget
     * @return budgetUtilization Percentage of budget utilized
     */
    function getProjectBudget(uint256 projectId) external view projectExists(projectId) returns (
        uint256 allocatedBudget,
        uint256 spentBudget,
        uint256 remainingBudget,
        uint256 budgetUtilization
    ) {
        ProjectData storage p = projects[projectId];
        
        allocatedBudget = p.allocatedBudget;
        spentBudget = p.spentBudget;
        remainingBudget = allocatedBudget - spentBudget;
        budgetUtilization = allocatedBudget > 0 ? (spentBudget * 100) / allocatedBudget : 0;
        
        return (allocatedBudget, spentBudget, remainingBudget, budgetUtilization);
    }

    /**
     * Get all projects created by a user
     * @param user Address of the user
     * @return projectIds Array of project IDs created by the user
     */
    function getProjectsByUser(address user) external view returns (uint256[] memory projectIds) {
        uint256[] memory tempIds = new uint256[](projectCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= projectCount; i++) {
            if (projects[i].creator == user) {
                tempIds[count] = i;
                count++;
            }
        }
        
        projectIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            projectIds[i] = tempIds[i];
        }
        
        return projectIds;
    }

    /**
     * Get projects by category
     * @param categoryName Name of the category
     * @return projectIds Array of project IDs in the category
     */
    function getProjectsByCategory(string calldata categoryName) external view returns (uint256[] memory projectIds) {
        uint256[] memory tempIds = new uint256[](projectCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= projectCount; i++) {
            if (keccak256(bytes(projects[i].categoryName)) == keccak256(bytes(categoryName))) {
                tempIds[count] = i;
                count++;
            }
        }
        
        projectIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            projectIds[i] = tempIds[i];
        }
        
        return projectIds;
    }

    /**
     * Get projects by status
     * @param status Status to filter by
     * @return projectIds Array of project IDs with the specified status
     */
    function getProjectsByStatus(string calldata status) external view returns (uint256[] memory projectIds) {
        uint256[] memory tempIds = new uint256[](projectCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= projectCount; i++) {
            if (keccak256(bytes(projects[i].status)) == keccak256(bytes(status))) {
                tempIds[count] = i;
                count++;
            }
        }
        
        projectIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            projectIds[i] = tempIds[i];
        }
        
        return projectIds;
    }

    /**
     * Get projects by state
     * @param state State to filter by
     * @return projectIds Array of project IDs in the specified state
     */
    function getProjectsByState(string calldata state) external view returns (uint256[] memory projectIds) {
        uint256[] memory tempIds = new uint256[](projectCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= projectCount; i++) {
            if (keccak256(bytes(projects[i].state)) == keccak256(bytes(state))) {
                tempIds[count] = i;
                count++;
            }
        }
        
        projectIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            projectIds[i] = tempIds[i];
        }
        
        return projectIds;
    }

    /**
     * Get projects by ministry
     * @param ministry Ministry to filter by
     * @return projectIds Array of project IDs under the specified ministry
     */
    function getProjectsByMinistry(string calldata ministry) external view returns (uint256[] memory projectIds) {
        uint256[] memory tempIds = new uint256[](projectCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= projectCount; i++) {
            if (keccak256(bytes(projects[i].ministry)) == keccak256(bytes(ministry))) {
                tempIds[count] = i;
                count++;
            }
        }
        
        projectIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            projectIds[i] = tempIds[i];
        }
        
        return projectIds;
    }
}
