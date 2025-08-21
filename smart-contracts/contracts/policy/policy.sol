// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuthRegistry {
  function isAuthorized(address user) external view returns (bool);
  function isAdmin(address user) external view returns (bool);
}

contract Policies {
  struct Policy {
    string name; // Policy name (stored directly as string)
    string descriptionCid; // IPFS CID for policy description
    string viewFullPolicy; // Full policy document URL (stored directly as string)
    string ministry; // Ministry name (stored directly as string)
    string status; // Policy status (DRAFT, UNDER_REVIEW, etc.)
    address creator; // Address of policy creator
    uint256 createdAt; // Creation timestamp
    uint256 effectiveDate; // When policy becomes effective
    uint256 lastUpdated; // Last update timestamp
    mapping(address => bool) supporters; // Address => has supported
    uint256 supportCount; // Number of supporters
    bool isActive; // Whether policy is currently active
  }

  IAuthRegistry public authRegistry;
  uint256 public policyCount;
  mapping(uint256 => Policy) private policies;
  mapping(address => uint256) public lastCreatedAt;
  mapping(string => uint256[]) public policiesByMinistry; // Ministry => Policy IDs
  mapping(string => uint256[]) public policiesByStatus; // Status => Policy IDs

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

  event PolicyStatusChanged(
    uint256 indexed policyId,
    string oldStatus,
    string newStatus,
    address indexed changer
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
  ) external onlyAuthorized returns (uint256) {
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
  ) external onlyAuthorized policyExists(policyId) {
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
    if (
      keccak256(bytes(newStatus)) == keccak256(bytes("ACTIVE")) &&
      p.effectiveDate <= block.timestamp
    ) {
      p.isActive = true;
    } else if (
      keccak256(bytes(newStatus)) == keccak256(bytes("INACTIVE")) ||
      keccak256(bytes(newStatus)) == keccak256(bytes("ARCHIVED"))
    ) {
      p.isActive = false;
    }

    emit PolicyStatusChanged(policyId, oldStatus, newStatus, msg.sender);
    emit PolicyUpdated(policyId, msg.sender, newStatus, p.effectiveDate);
  }

  function getPolicy(
    uint256 policyId
  )
    external
    view
    policyExists(policyId)
    returns (
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
    )
  {
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
