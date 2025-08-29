// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuthRegistry {
  function isAuthorized(address user) external view returns (bool);
  function isAdmin(address user) external view returns (bool);
}

contract Policies {
  struct Policy {
    string name;
    string descriptionCid;
    string viewFullPolicy;
    string ministry;
    string status;
    address creator;
    uint256 createdAt;
    uint256 effectiveDate;
    uint256 lastUpdated;
    mapping(address => bool) supporters;
    uint256 supportCount;
    bool isActive;
    bool removed;
  }

  IAuthRegistry public authRegistry;
  uint256 public policyCount;
  mapping(uint256 => Policy) private policies;
  mapping(address => uint256) public lastCreatedAt;
  mapping(string => uint256[]) public policiesByMinistry;
  mapping(string => uint256[]) public policiesByStatus;

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

  event PolicyRemoved(uint256 indexed policyId, address indexed remover);

  constructor(address _authRegistry) {
    require(_authRegistry != address(0), "Auth registry address cannot be zero");
    authRegistry = IAuthRegistry(_authRegistry);
  }

  modifier onlyAuthorized() {
    require(authRegistry.isAdmin(msg.sender), "No Permission");
    _;
  }

  modifier onlyUser() {
    require(authRegistry.isAuthorized(msg.sender), "User not authorized");
    _;
  }

  modifier policyExists(uint256 policyId) {
    require(policyId > 0 && policyId <= policyCount, "Policy does not exist");
    require(policies[policyId].creator != address(0), "Policy does not exist");
    require(!policies[policyId].removed, "Policy has been removed");
    _;
  }

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
    p.status = "DRAFT";
    p.creator = msg.sender;
    p.createdAt = block.timestamp;
    p.effectiveDate = effectiveDate;
    p.lastUpdated = block.timestamp;
    p.isActive = false;
    p.removed = false;

    policiesByMinistry[ministry].push(policyId);
    policiesByStatus["DRAFT"].push(policyId);

    lastCreatedAt[msg.sender] = block.timestamp;

    emit PolicyCreated(policyId, msg.sender, name, descriptionCid, ministry, "DRAFT");
    return policyId;
  }

  function removePolicy(uint256 policyId) external onlyAuthorized policyExists(policyId) {
    Policy storage p = policies[policyId];
    p.removed = true;
    emit PolicyRemoved(policyId, msg.sender);
  }

  function updatePolicyStatus(
    uint256 policyId,
    string calldata newStatus,
    uint256 newEffectiveDate
  ) external onlyAuthorized policyExists(policyId) {
    Policy storage p = policies[policyId];
    string memory oldStatus = p.status;

    _removeFromStatusMapping(oldStatus, policyId);

    p.status = newStatus;
    p.lastUpdated = block.timestamp;

    if (newEffectiveDate > 0) {
      p.effectiveDate = newEffectiveDate;
    }

    policiesByStatus[newStatus].push(policyId);

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
      bool isActive,
      bool removed
    )
  {
    require(policyId > 0 && policyId <= policyCount, "Policy does not exist");
    Policy storage p = policies[policyId];
    require(p.creator != address(0), "Policy does not exist");

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
      p.isActive,
      p.removed
    );
  }
  event PolicySupported(uint256 indexed policyId, address indexed supporter);
  event PolicyUnsupported(uint256 indexed policyId, address indexed supporter);

  function supportPolicy(uint256 policyId) external onlyUser policyExists(policyId) {
    Policy storage p = policies[policyId];
    require(!p.supporters[msg.sender], "You have already supported this policy");

    p.supporters[msg.sender] = true;
    p.supportCount++;

    emit PolicySupported(policyId, msg.sender);
  }

  function unsupportPolicy(uint256 policyId) external onlyUser policyExists(policyId) {
    Policy storage p = policies[policyId];
    require(p.supporters[msg.sender], "You have not supported this policy");

    p.supporters[msg.sender] = false;
    p.supportCount--;

    emit PolicyUnsupported(policyId, msg.sender);
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
