// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuthRegistry {
    function isAuthorized(address user) external view returns (bool);
}

contract Policies {
    struct Policy {
        string name;              // Policy name (stored directly as string)
        string descriptionCid;    // IPFS CID for policy description 
        string viewFullPolicy;    // Full policy document URL (stored directly as string)
        string ministry;          // Ministry name (stored directly as string)
        string status;            // Policy status (DRAFT, UNDER_REVIEW, etc.)
        address creator;          // Address of policy creator
        uint256 createdAt;        // Creation timestamp
        uint256 effectiveDate;    // When policy becomes effective
        uint256 lastUpdated;      // Last update timestamp
        mapping(address => bool) supporters; // Address => has supported
        uint256 supportCount;     // Number of supporters
        bool isActive;            // Whether policy is currently active
    }

    IAuthRegistry public authRegistry;
    uint256 public policyCount;
    mapping(uint256 => Policy) private policies;
    mapping(address => uint256) public lastCreatedAt;
    mapping(string => uint256[]) public policiesByMinistry; // Ministry => Policy IDs
    mapping(string => uint256[]) public policiesByStatus;   // Status => Policy IDs

    // Events
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed creator,
        string name,
        string descriptionCid,
        string ministry,
        string status
    );
    
    event PolicyUpdated(
        uint256 indexed policyId,
        address indexed updater,
        string status,
        uint256 effectiveDate
    );
    
    event PolicySupported(
        uint256 indexed policyId,
        address indexed supporter
    );
    
    event PolicyStatusChanged(
        uint256 indexed policyId,
        string oldStatus,
        string newStatus,
        address indexed changer
    );
    
    event PolicyActivated(
        uint256 indexed policyId,
        address indexed activator,
        uint256 effectiveDate
    );
    
    event PolicyDeactivated(
        uint256 indexed policyId,
        address indexed deactivator
    );

    constructor(address _authRegistry) {
        require(_authRegistry != address(0), "Auth registry address cannot be zero");
        authRegistry = IAuthRegistry(_authRegistry);
    }

    // Only authorized users can perform write operations
    modifier onlyAuthorized() {
        require(authRegistry.isAuthorized(msg.sender), "User not authorized");
        _;
    }

    // Prevent spam - one policy per day per user
    modifier onlyOncePerDay() {
        require(
            block.timestamp >= lastCreatedAt[msg.sender] + 1 days,
            "You can only create one policy per day"
        );
        _;
    }

    // Only policy creator can update
    modifier onlyCreator(uint256 policyId) {
        require(policies[policyId].creator == msg.sender, "Only creator can update policy");
        _;
    }

    // Check if policy exists
    modifier policyExists(uint256 policyId) {
        require(policyId > 0 && policyId <= policyCount, "Policy does not exist");
        require(policies[policyId].creator != address(0), "Policy does not exist");
        _;
    }

    /**
     * Create a new policy
     * @param name Policy name (stored directly)
     * @param descriptionCid IPFS CID for policy description
     * @param viewFullPolicy Full policy document URL (stored directly)
     * @param ministry Ministry responsible for the policy
     * @param effectiveDate When the policy becomes effective (timestamp)
     * @return policyId The ID of the created policy
     */
    function createPolicy(
        string calldata name,
        string calldata descriptionCid,
        string calldata viewFullPolicy,
        string calldata ministry,
        uint256 effectiveDate
    ) external onlyAuthorized onlyOncePerDay returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(descriptionCid).length > 0, "Description CID cannot be empty");
        require(bytes(viewFullPolicy).length > 0, "Full policy URL cannot be empty");
        require(bytes(ministry).length > 0, "Ministry cannot be empty");
        
        policyCount++;
        uint256 policyId = policyCount;

        Policy storage p = policies[policyId];
        p.name = name;
        p.descriptionCid = descriptionCid;
        p.viewFullPolicy = viewFullPolicy;
        p.ministry = ministry;
        p.status = "DRAFT"; // Default status
        p.creator = msg.sender;
        p.createdAt = block.timestamp;
        p.effectiveDate = effectiveDate;
        p.lastUpdated = block.timestamp;
        p.supportCount = 0;
        p.isActive = false;

        // Add to ministry and status mappings
        policiesByMinistry[ministry].push(policyId);
        policiesByStatus["DRAFT"].push(policyId);

        lastCreatedAt[msg.sender] = block.timestamp;

        emit PolicyCreated(policyId, msg.sender, name, descriptionCid, ministry, "DRAFT");
        return policyId;
    }

    /**
     * Update policy status and details
     * @param policyId The policy to update
     * @param newStatus New status for the policy
     * @param newEffectiveDate New effective date (0 to keep current)
     */
    function updatePolicyStatus(
        uint256 policyId,
        string calldata newStatus,
        uint256 newEffectiveDate
    ) external onlyAuthorized onlyCreator(policyId) policyExists(policyId) {
        Policy storage p = policies[policyId];
        string memory oldStatus = p.status;
        
        // Remove from old status mapping
        _removeFromStatusMapping(oldStatus, policyId);
        
        // Update status
        p.status = newStatus;
        p.lastUpdated = block.timestamp;
        
        if (newEffectiveDate > 0) {
            p.effectiveDate = newEffectiveDate;
        }

        // Add to new status mapping
        policiesByStatus[newStatus].push(policyId);

        // Auto-activate if status is ACTIVE and effective date has passed
        if (keccak256(bytes(newStatus)) == keccak256(bytes("ACTIVE")) && 
            p.effectiveDate <= block.timestamp) {
            p.isActive = true;
            emit PolicyActivated(policyId, msg.sender, p.effectiveDate);
        } else if (keccak256(bytes(newStatus)) == keccak256(bytes("INACTIVE")) || 
                   keccak256(bytes(newStatus)) == keccak256(bytes("ARCHIVED"))) {
            p.isActive = false;
            emit PolicyDeactivated(policyId, msg.sender);
        }

        emit PolicyStatusChanged(policyId, oldStatus, newStatus, msg.sender);
        emit PolicyUpdated(policyId, msg.sender, newStatus, p.effectiveDate);
    }

    /**
     * Support a policy
     * @param policyId The policy to support
     */
    function supportPolicy(uint256 policyId) external onlyAuthorized policyExists(policyId) {
        Policy storage p = policies[policyId];
        require(!p.supporters[msg.sender], "You have already supported this policy");
        require(p.creator != msg.sender, "Cannot support your own policy");

        p.supporters[msg.sender] = true;
        p.supportCount++;

        emit PolicySupported(policyId, msg.sender);
    }

    /**
     * Get policy details
     */
    function getPolicy(uint256 policyId) external view policyExists(policyId) returns (
        string memory name,
        string memory descriptionCid,
        string memory viewFullPolicy,
        string memory ministry,
        string memory status,
        address creator,
        uint256 createdAt,
        uint256 effectiveDate,
        uint256 lastUpdated,
        uint256 supportCount,
        bool isActive
    ) {
        Policy storage p = policies[policyId];
        return (
            p.name,
            p.descriptionCid,
            p.viewFullPolicy,
            p.ministry,
            p.status,
            p.creator,
            p.createdAt,
            p.effectiveDate,
            p.lastUpdated,
            p.supportCount,
            p.isActive
        );
    }

    /**
     * Check if user has supported a policy
     */
    function hasSupported(uint256 policyId, address user) external view policyExists(policyId) returns (bool) {
        return policies[policyId].supporters[user];
    }

    /**
     * Get policies by ministry
     */
    function getPoliciesByMinistry(string calldata ministry) external view returns (uint256[] memory) {
        return policiesByMinistry[ministry];
    }

    /**
     * Get policies by status
     */
    function getPoliciesByStatus(string calldata status) external view returns (uint256[] memory) {
        return policiesByStatus[status];
    }

    /**
     * Get policies created by a user
     */
    function getPoliciesByUser(address user) external view returns (uint256[] memory) {
        uint256[] memory userPolicies = new uint256[](policyCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= policyCount; i++) {
            if (policies[i].creator == user) {
                userPolicies[count] = i;
                count++;
            }
        }

        // Create array with exact size
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userPolicies[i];
        }

        return result;
    }

    /**
     * Get active policies
     */
    function getActivePolicies() external view returns (uint256[] memory) {
        uint256[] memory activePolicies = new uint256[](policyCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= policyCount; i++) {
            if (policies[i].isActive && policies[i].creator != address(0)) {
                activePolicies[count] = i;
                count++;
            }
        }

        // Create array with exact size
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activePolicies[i];
        }

        return result;
    }

    /**
     * Check if policy is effective (active and past effective date)
     */
    function isPolicyEffective(uint256 policyId) external view policyExists(policyId) returns (bool) {
        Policy storage p = policies[policyId];
        return p.isActive && p.effectiveDate <= block.timestamp;
    }

    /**
     * Get policy statistics
     */
    function getPolicyStatistics() external view returns (
        uint256 totalPolicies,
        uint256 activePolicies,
        uint256 draftPolicies,
        uint256 archivedPolicies
    ) {
        totalPolicies = policyCount;
        activePolicies = policiesByStatus["ACTIVE"].length;
        draftPolicies = policiesByStatus["DRAFT"].length;
        archivedPolicies = policiesByStatus["ARCHIVED"].length;
    }

    /**
     * Internal function to remove policy from status mapping
     */
    function _removeFromStatusMapping(string memory status, uint256 policyId) internal {
        uint256[] storage statusPolicies = policiesByStatus[status];
        for (uint256 i = 0; i < statusPolicies.length; i++) {
            if (statusPolicies[i] == policyId) {
                statusPolicies[i] = statusPolicies[statusPolicies.length - 1];
                statusPolicies.pop();
                break;
            }
        }
    }
}
