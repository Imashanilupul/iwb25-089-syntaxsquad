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
        string categoryId;
        uint256 allocatedBudget;
        uint256 spentBudget;
        string state;
        string province;
        string ministry;
        string viewDetailsCid; 
        string status;
        uint256 createdAt;
        uint256 updatedAt;
        bool removed;
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
        require(authRegistry.isAdmin(msg.sender), "No Permission");
        _;
    }



    // Check if project exists
    modifier projectExists(uint256 projectId) {
        require(projectId > 0 && projectId <= projectCount, "Project does not exist");
        _;
    }


    function createProject(
        string calldata projectName,
        string calldata categoryId,
        uint256 allocatedBudget,
        string calldata state,
        string calldata province,
        string calldata ministry,
        string calldata viewDetailsCid,
        string calldata status
    ) external onlyAuthorized returns (uint256) {
        require(bytes(projectName).length > 0, "Project name cannot be empty");
        require(bytes(categoryId).length > 0, "Category id cannot be empty");
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
        p.categoryId = categoryId;
        p.allocatedBudget = allocatedBudget;
        p.spentBudget = 0;
        p.state = state;
        p.province = province;
        p.ministry = ministry;
        p.viewDetailsCid = viewDetailsCid;
        p.status = status;
        p.createdAt = block.timestamp;
        p.updatedAt = block.timestamp;

        lastCreatedAt[msg.sender] = block.timestamp;

        emit ProjectCreated(
            projectId,
            msg.sender,
            projectName,
            categoryId,
            allocatedBudget,
            state,
            province,
            ministry,
            status
        );

        return projectId;
    }


    function updateProject(
        uint256 projectId,
        string calldata projectName,
        string calldata categoryId,
        string calldata state,
        string calldata province,
        string calldata ministry,
        string calldata viewDetailsCid,
        string calldata status
    ) external onlyAuthorized projectExists(projectId)  {
        require(bytes(projectName).length > 0, "Project name cannot be empty");
        require(bytes(categoryId).length > 0, "Category id cannot be empty");
        require(bytes(state).length > 0, "State cannot be empty");
        require(bytes(province).length > 0, "Province cannot be empty");
        require(bytes(ministry).length > 0, "Ministry cannot be empty");
        require(bytes(status).length > 0, "Status cannot be empty");

        ProjectData storage p = projects[projectId];
        string memory oldStatus = p.status;
        
        p.projectName = projectName;
        p.categoryId = categoryId;
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


    function addSpentBudget(uint256 projectId, uint256 amount) external onlyAuthorized projectExists(projectId)  {
        require(amount > 0, "Amount must be greater than 0");
        
        ProjectData storage p = projects[projectId];
        require(p.spentBudget + amount <= p.allocatedBudget, "Cannot exceed allocated budget");
        
        p.spentBudget += amount;
        p.updatedAt = block.timestamp;

        emit BudgetSpent(projectId, msg.sender, amount, p.spentBudget);
    }


    function deductSpentBudget(uint256 projectId, uint256 amount) external onlyAuthorized projectExists(projectId)  {
        require(amount > 0, "Amount must be greater than 0");
        
        ProjectData storage p = projects[projectId];
        require(p.spentBudget >= amount, "Cannot deduct more than spent budget");
        
        p.spentBudget -= amount;
        p.updatedAt = block.timestamp;

        emit BudgetDeducted(projectId, msg.sender, amount, p.spentBudget);
    }

function removeProject(uint256 projectId) external onlyAuthorized projectExists(projectId) {
    ProjectData storage p = projects[projectId];
    require(p.projectId == projectId, "Project ID mismatch");
    require(!p.removed, "Project already removed");
    p.removed = true;
    emit ProjectStatusChanged(projectId, p.status, "REMOVED");
}

    function updateAllocatedBudget(uint256 projectId, uint256 newAllocatedBudget) external onlyAuthorized projectExists(projectId) {
        require(newAllocatedBudget > 0, "Allocated budget must be greater than 0");
        
        ProjectData storage p = projects[projectId];
        require(newAllocatedBudget >= p.spentBudget, "Allocated budget cannot be less than spent budget");
        
        p.allocatedBudget = newAllocatedBudget;
        p.updatedAt = block.timestamp;
    }

    function getProject(uint256 projectId) external view projectExists(projectId) returns (
        uint256 id,
        string memory projectName,
        string memory categoryId,
        uint256 allocatedBudget,
        uint256 spentBudget,
        string memory state,
        string memory province,
        string memory ministry,
        string memory viewDetailsCid,
        string memory status,
        uint256 createdAt,
        uint256 updatedAt,
        bool removed
    ) {
        ProjectData storage p = projects[projectId];
        
        return (
            p.projectId,
            p.projectName,
            p.categoryId,
            p.allocatedBudget,
            p.spentBudget,
            p.state,
            p.province,
            p.ministry,
            p.viewDetailsCid,
            p.status,
            p.createdAt,
            p.updatedAt,
            p.removed
        );
    }













}
