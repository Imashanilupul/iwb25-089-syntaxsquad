// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IAuthRegistry {
    function isAuthorized(address user) external view returns (bool);
}

contract Reports {
    struct Report {
        string titleCid;
        string descriptionCid;
        string evidenceHashCid;
        uint256 upvotes;
        uint256 downvotes;
        address creator;
        bool resolved;
        address assignedTo;
        uint256 createdAt;
        uint256 resolvedAt;
        mapping(address => bool) hasUpvoted;
        mapping(address => bool) hasDownvoted;
    }

    IAuthRegistry public authRegistry;
    uint256 public reportCount;
    mapping(uint256 => Report) private reports;
    mapping(address => uint256) public lastCreatedAt;

    // Events
    event ReportCreated(
        uint256 indexed reportId, 
        address indexed creator, 
        string titleCid, 
        string descriptionCid, 
        string evidenceHashCid
    );
    event ReportUpvoted(uint256 indexed reportId, address indexed voter);
    event ReportDownvoted(uint256 indexed reportId, address indexed voter);
    event ReportResolved(uint256 indexed reportId, address indexed resolver, uint256 resolvedAt);
    event ReportAssigned(uint256 indexed reportId, address indexed assignedTo);

    constructor(address _authRegistry) {
        require(_authRegistry != address(0), "Auth registry address cannot be zero");
        authRegistry = IAuthRegistry(_authRegistry);
    }

    // Only authorized users can perform write operations
    modifier onlyAuthorized() {
        require(authRegistry.isAuthorized(msg.sender), "User not authorized");
        _;
    }

    // User can only create one report per day to prevent spam
    modifier onlyOncePerDay() {
        require(
            block.timestamp >= lastCreatedAt[msg.sender] + 1 days,
            "You can only create one report per day"
        );
        _;
    }

    // Only report creator or assigned person can resolve
    modifier onlyCreatorOrAssigned(uint256 reportId) {
        Report storage r = reports[reportId];
        require(
            msg.sender == r.creator || msg.sender == r.assignedTo,
            "Only creator or assigned person can resolve"
        );
        _;
    }

    /**
     * Create a new report
     * @param titleCid IPFS CID for report title
     * @param descriptionCid IPFS CID for report description
     * @param evidenceHashCid IPFS CID for evidence hash
     * @return reportId The ID of the created report
     */
    function createReport(
        string calldata titleCid,
        string calldata descriptionCid,
        string calldata evidenceHashCid
    ) external onlyAuthorized onlyOncePerDay returns (uint256) {
        require(bytes(titleCid).length > 0, "Title CID cannot be empty");
        require(bytes(descriptionCid).length > 0, "Description CID cannot be empty");
        require(bytes(evidenceHashCid).length > 0, "Evidence hash CID cannot be empty");

        reportCount++;
        uint256 reportId = reportCount;

        Report storage r = reports[reportId];
        r.titleCid = titleCid;
        r.descriptionCid = descriptionCid;
        r.evidenceHashCid = evidenceHashCid;
        r.creator = msg.sender;
        r.resolved = false;
        r.upvotes = 0;
        r.downvotes = 0;
        r.createdAt = block.timestamp;
        r.resolvedAt = 0;

        lastCreatedAt[msg.sender] = block.timestamp;

        emit ReportCreated(reportId, msg.sender, titleCid, descriptionCid, evidenceHashCid);
        return reportId;
    }

    /**
     * Upvote a report
     * @param reportId The ID of the report to upvote
     */
    function upvoteReport(uint256 reportId) external onlyAuthorized {
        Report storage r = reports[reportId];
        require(r.creator != address(0), "Report does not exist");
        require(!r.resolved, "Cannot vote on resolved report");
        require(!r.hasUpvoted[msg.sender], "You have already upvoted this report");
        require(r.creator != msg.sender, "Cannot vote on your own report");

        // Remove downvote if exists
        if (r.hasDownvoted[msg.sender]) {
            r.hasDownvoted[msg.sender] = false;
            r.downvotes--;
        }

        r.hasUpvoted[msg.sender] = true;
        r.upvotes++;

        emit ReportUpvoted(reportId, msg.sender);
    }

    /**
     * Downvote a report
     * @param reportId The ID of the report to downvote
     */
    function downvoteReport(uint256 reportId) external onlyAuthorized {
        Report storage r = reports[reportId];
        require(r.creator != address(0), "Report does not exist");
        require(!r.resolved, "Cannot vote on resolved report");
        require(!r.hasDownvoted[msg.sender], "You have already downvoted this report");
        require(r.creator != msg.sender, "Cannot vote on your own report");

        // Remove upvote if exists
        if (r.hasUpvoted[msg.sender]) {
            r.hasUpvoted[msg.sender] = false;
            r.upvotes--;
        }

        r.hasDownvoted[msg.sender] = true;
        r.downvotes++;

        emit ReportDownvoted(reportId, msg.sender);
    }

    /**
     * Remove vote from a report
     * @param reportId The ID of the report to remove vote from
     */
    function removeVote(uint256 reportId) external onlyAuthorized {
        Report storage r = reports[reportId];
        require(r.creator != address(0), "Report does not exist");
        require(!r.resolved, "Cannot change vote on resolved report");

        bool hadVote = false;

        if (r.hasUpvoted[msg.sender]) {
            r.hasUpvoted[msg.sender] = false;
            r.upvotes--;
            hadVote = true;
        }

        if (r.hasDownvoted[msg.sender]) {
            r.hasDownvoted[msg.sender] = false;
            r.downvotes--;
            hadVote = true;
        }

        require(hadVote, "You have not voted on this report");
    }

    /**
     * Assign report to someone for resolution
     * @param reportId The ID of the report to assign
     * @param assignTo Address to assign the report to
     */
    function assignReport(uint256 reportId, address assignTo) external onlyAuthorized {
        Report storage r = reports[reportId];
        require(r.creator != address(0), "Report does not exist");
        require(!r.resolved, "Cannot assign resolved report");
        require(assignTo != address(0), "Cannot assign to zero address");
        require(authRegistry.isAuthorized(assignTo), "Assigned person must be authorized");

        r.assignedTo = assignTo;

        emit ReportAssigned(reportId, assignTo);
    }

    /**
     * Mark report as resolved
     * @param reportId The ID of the report to resolve
     */
    function resolveReport(uint256 reportId) external onlyAuthorized onlyCreatorOrAssigned(reportId) {
        Report storage r = reports[reportId];
        require(r.creator != address(0), "Report does not exist");
        require(!r.resolved, "Report already resolved");

        r.resolved = true;
        r.resolvedAt = block.timestamp;

        emit ReportResolved(reportId, msg.sender, block.timestamp);
    }

    /**
     * Reopen a resolved report (only by creator)
     * @param reportId The ID of the report to reopen
     */
    function reopenReport(uint256 reportId) external onlyAuthorized {
        Report storage r = reports[reportId];
        require(r.creator != address(0), "Report does not exist");
        require(r.resolved, "Report is not resolved");
        require(msg.sender == r.creator, "Only creator can reopen report");

        r.resolved = false;
        r.resolvedAt = 0;
    }

    /**
     * Get report details
     * @param reportId The ID of the report
     * @return titleCid IPFS CID for title
     * @return descriptionCid IPFS CID for description
     * @return evidenceHashCid IPFS CID for evidence hash
     * @return upvotes Number of upvotes
     * @return downvotes Number of downvotes
     * @return creator Address of the creator
     * @return resolved Whether the report is resolved
     * @return assignedTo Address assigned to resolve the report
     * @return createdAt Timestamp when created
     * @return resolvedAt Timestamp when resolved (0 if not resolved)
     */
    function getReport(uint256 reportId) external view returns (
        string memory titleCid,
        string memory descriptionCid,
        string memory evidenceHashCid,
        uint256 upvotes,
        uint256 downvotes,
        address creator,
        bool resolved,
        address assignedTo,
        uint256 createdAt,
        uint256 resolvedAt
    ) {
        Report storage r = reports[reportId];
        require(r.creator != address(0), "Report does not exist");
        
        return (
            r.titleCid,
            r.descriptionCid,
            r.evidenceHashCid,
            r.upvotes,
            r.downvotes,
            r.creator,
            r.resolved,
            r.assignedTo,
            r.createdAt,
            r.resolvedAt
        );
    }

    /**
     * Check if user has voted on a report
     * @param reportId The ID of the report
     * @param user Address of the user
     * @return hasUpvoted Whether user has upvoted
     * @return hasDownvoted Whether user has downvoted
     */
    function getUserVote(uint256 reportId, address user) external view returns (
        bool hasUpvoted,
        bool hasDownvoted
    ) {
        Report storage r = reports[reportId];
        require(r.creator != address(0), "Report does not exist");
        
        return (r.hasUpvoted[user], r.hasDownvoted[user]);
    }

    /**
     * Get report voting statistics
     * @param reportId The ID of the report
     * @return upvotes Number of upvotes
     * @return downvotes Number of downvotes
     * @return netVotes Net votes (upvotes - downvotes)
     * @return totalVotes Total votes (upvotes + downvotes)
     */
    function getReportVotes(uint256 reportId) external view returns (
        uint256 upvotes,
        uint256 downvotes,
        int256 netVotes,
        uint256 totalVotes
    ) {
        Report storage r = reports[reportId];
        require(r.creator != address(0), "Report does not exist");
        
        upvotes = r.upvotes;
        downvotes = r.downvotes;
        netVotes = int256(upvotes) - int256(downvotes);
        totalVotes = upvotes + downvotes;
        
        return (upvotes, downvotes, netVotes, totalVotes);
    }

    /**
     * Get all reports created by a user
     * @param user Address of the user
     * @return reportIds Array of report IDs created by the user
     */
    function getReportsByUser(address user) external view returns (uint256[] memory reportIds) {
        uint256[] memory tempIds = new uint256[](reportCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= reportCount; i++) {
            if (reports[i].creator == user) {
                tempIds[count] = i;
                count++;
            }
        }
        
        reportIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            reportIds[i] = tempIds[i];
        }
        
        return reportIds;
    }

    /**
     * Get reports assigned to a user
     * @param user Address of the user
     * @return reportIds Array of report IDs assigned to the user
     */
    function getReportsAssignedTo(address user) external view returns (uint256[] memory reportIds) {
        uint256[] memory tempIds = new uint256[](reportCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= reportCount; i++) {
            if (reports[i].assignedTo == user && !reports[i].resolved) {
                tempIds[count] = i;
                count++;
            }
        }
        
        reportIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            reportIds[i] = tempIds[i];
        }
        
        return reportIds;
    }
}
