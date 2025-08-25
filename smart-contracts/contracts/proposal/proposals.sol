// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAuthRegistry {
    function isAuthorized(address user) external view returns (bool);
    function isAdmin(address user) external view returns (bool);

}

contract Proposals {
    struct Proposal {
        string titleCid;
        string shortDescriptionCid;
        string descriptionInDetailsCid;
        uint256 yesVotes;
        uint256 noVotes;
        address creator;
        bool activeStatus;
        uint256 expiredDate;
        uint256 categoryId;
        uint256 createdAt;
        uint256 updatedAt;
        mapping(address => bool) hasVotedYes;
        mapping(address => bool) hasVotedNo;
    }

    IAuthRegistry public authRegistry;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) private proposals;
    mapping(address => uint256) public lastCreatedAt;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId, 
        address indexed creator, 
        string titleCid, 
        string shortDescriptionCid, 
        string descriptionInDetailsCid,
        uint256 categoryId,
        uint256 expiredDate
    );
    event ProposalVotedYes(uint256 indexed proposalId, address indexed voter);
    event ProposalVotedNo(uint256 indexed proposalId, address indexed voter);
    event ProposalStatusChanged(uint256 indexed proposalId, bool activeStatus);
    event ProposalExpired(uint256 indexed proposalId, uint256 expiredAt);

    constructor(address _authRegistry) {
        require(_authRegistry != address(0), "Auth registry address cannot be zero");
        authRegistry = IAuthRegistry(_authRegistry);
    }

    // Only authorized users can perform write operations
    modifier onlyAuthorized() {
        require(authRegistry.isAuthorized(msg.sender), "User not authorized");
        _;
    }

        modifier onlyAdmin() {
        require(authRegistry.isAdmin(msg.sender), "User not authorized");
        _;
    }


    // Only proposal creator can modify

    // Check if proposal is active and not expired
    modifier onlyActiveProposal(uint256 proposalId) {
        Proposal storage p = proposals[proposalId];
        require(p.activeStatus, "Proposal is not active");
        require(block.timestamp < p.expiredDate, "Proposal has expired");
        _;
    }

    /**
     * Create a new proposal
     * @param titleCid IPFS CID for proposal title
     * @param shortDescriptionCid IPFS CID for short description
     * @param descriptionInDetailsCid IPFS CID for detailed description
     * @param categoryId Category ID for the proposal
     * @param expiredDate Timestamp when proposal expires
     * @return proposalId The ID of the created proposal
     */
    function createProposal(
        string calldata titleCid,
        string calldata shortDescriptionCid,
        string calldata descriptionInDetailsCid,
        uint256 categoryId,
        uint256 expiredDate
    ) external onlyAdmin returns (uint256) {
        require(bytes(titleCid).length > 0, "Title CID cannot be empty");
        require(bytes(shortDescriptionCid).length > 0, "Short description CID cannot be empty");
        require(bytes(descriptionInDetailsCid).length > 0, "Detailed description CID cannot be empty");
        require(expiredDate > block.timestamp, "Expired date must be in the future");
        require(categoryId > 0, "Category ID must be valid");

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage p = proposals[proposalId];
        p.titleCid = titleCid;
        p.shortDescriptionCid = shortDescriptionCid;
        p.descriptionInDetailsCid = descriptionInDetailsCid;
        p.creator = msg.sender;
        p.activeStatus = true;
        p.yesVotes = 0;
        p.noVotes = 0;
        p.categoryId = categoryId;
        p.expiredDate = expiredDate;
        p.createdAt = block.timestamp;
        p.updatedAt = block.timestamp;

        lastCreatedAt[msg.sender] = block.timestamp;

        emit ProposalCreated(
            proposalId, 
            msg.sender, 
            titleCid, 
            shortDescriptionCid, 
            descriptionInDetailsCid,
            categoryId,
            expiredDate
        );
        return proposalId;
    }

    /**
     * Vote YES on a proposal
     * @param proposalId The ID of the proposal to vote on
     */
    function voteYes(uint256 proposalId) external onlyAuthorized onlyActiveProposal(proposalId) {
        Proposal storage p = proposals[proposalId];
        require(p.creator != address(0), "Proposal does not exist");
        require(!p.hasVotedYes[msg.sender], "You have already voted YES on this proposal");
        require(p.creator != msg.sender, "Cannot vote on your own proposal");

        // Remove NO vote if exists
        if (p.hasVotedNo[msg.sender]) {
            p.hasVotedNo[msg.sender] = false;
            p.noVotes--;
        }

        p.hasVotedYes[msg.sender] = true;
        p.yesVotes++;
        p.updatedAt = block.timestamp;

        emit ProposalVotedYes(proposalId, msg.sender);
    }

    /**
     * Vote NO on a proposal
     * @param proposalId The ID of the proposal to vote on
     */
    function voteNo(uint256 proposalId) external onlyAuthorized onlyActiveProposal(proposalId) {
        Proposal storage p = proposals[proposalId];
        require(p.creator != address(0), "Proposal does not exist");
        require(!p.hasVotedNo[msg.sender], "You have already voted NO on this proposal");
        require(p.creator != msg.sender, "Cannot vote on your own proposal");

        // Remove YES vote if exists
        if (p.hasVotedYes[msg.sender]) {
            p.hasVotedYes[msg.sender] = false;
            p.yesVotes--;
        }

        p.hasVotedNo[msg.sender] = true;
        p.noVotes++;
        p.updatedAt = block.timestamp;

        emit ProposalVotedNo(proposalId, msg.sender);
    }

    /**
     * Remove vote from a proposal
     * @param proposalId The ID of the proposal to remove vote from
     */
    function removeVote(uint256 proposalId) external onlyAuthorized onlyActiveProposal(proposalId) {
        Proposal storage p = proposals[proposalId];
        require(p.creator != address(0), "Proposal does not exist");

        bool hadVote = false;

        if (p.hasVotedYes[msg.sender]) {
            p.hasVotedYes[msg.sender] = false;
            p.yesVotes--;
            hadVote = true;
        }

        if (p.hasVotedNo[msg.sender]) {
            p.hasVotedNo[msg.sender] = false;
            p.noVotes--;
            hadVote = true;
        }

        require(hadVote, "You have not voted on this proposal");
        p.updatedAt = block.timestamp;
    }

    /**
     * Change proposal status (activate/deactivate)
     * @param proposalId The ID of the proposal
     * @param newStatus New active status
     */
    function changeProposalStatus(uint256 proposalId, bool newStatus) external onlyAdmin {
        Proposal storage p = proposals[proposalId];
        require(p.creator != address(0), "Proposal does not exist");
        require(msg.sender == p.creator || authRegistry.isAdmin(msg.sender), "Only creator or admin can change status");
        require(p.activeStatus != newStatus, "Status is already set to this value");

        p.activeStatus = newStatus;
        p.updatedAt = block.timestamp;

        emit ProposalStatusChanged(proposalId, newStatus);
    }

    /**
     * Update proposal expiration date (only extend, not reduce)
     * @param proposalId The ID of the proposal
     * @param newExpiredDate New expiration timestamp
     */
    function extendProposalDeadline(uint256 proposalId, uint256 newExpiredDate) external onlyAdmin {
        Proposal storage p = proposals[proposalId];
        require(p.creator != address(0), "Proposal does not exist");
        require(msg.sender == p.creator || authRegistry.isAdmin(msg.sender), "Only creator or admin can extend deadline");
        require(newExpiredDate > p.expiredDate, "Can only extend deadline, not reduce it");
        require(newExpiredDate > block.timestamp, "New deadline must be in the future");

        p.expiredDate = newExpiredDate;
        p.updatedAt = block.timestamp;
    }

    /**
     * Manually expire a proposal (only by creator)
     * @param proposalId The ID of the proposal to expire
     */
    function expireProposal(uint256 proposalId) external onlyAdmin {
        Proposal storage p = proposals[proposalId];
        require(p.creator != address(0), "Proposal does not exist");
        require(msg.sender == p.creator || authRegistry.isAdmin(msg.sender), "Only creator or admin can expire proposal");
        require(p.activeStatus, "Proposal is already inactive");

        p.activeStatus = false;
        p.updatedAt = block.timestamp;

        emit ProposalExpired(proposalId, block.timestamp);
    }

    /**
     * Get proposal details
     * @param proposalId The ID of the proposal
     * @return titleCid IPFS CID for title
     * @return shortDescriptionCid IPFS CID for short description
     * @return descriptionInDetailsCid IPFS CID for detailed description
     * @return yesVotes Number of YES votes
     * @return noVotes Number of NO votes
     * @return creator Address of the creator
     * @return activeStatus Whether the proposal is active
     * @return expiredDate Expiration timestamp
     * @return categoryId Category ID
     * @return createdAt Timestamp when created
     * @return updatedAt Timestamp when last updated
     */
    function getProposal(uint256 proposalId) external view returns (
        string memory titleCid,
        string memory shortDescriptionCid,
        string memory descriptionInDetailsCid,
        uint256 yesVotes,
        uint256 noVotes,
        address creator,
        bool activeStatus,
        uint256 expiredDate,
        uint256 categoryId,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        Proposal storage p = proposals[proposalId];
        require(p.creator != address(0), "Proposal does not exist");
        
        return (
            p.titleCid,
            p.shortDescriptionCid,
            p.descriptionInDetailsCid,
            p.yesVotes,
            p.noVotes,
            p.creator,
            p.activeStatus,
            p.expiredDate,
            p.categoryId,
            p.createdAt,
            p.updatedAt
        );
    }

    /**
     * Check if user has voted on a proposal
     * @param proposalId The ID of the proposal
     * @param user Address of the user
     * @return hasVotedYes Whether user has voted YES
     * @return hasVotedNo Whether user has voted NO
     */
    function getUserVote(uint256 proposalId, address user) external view returns (
        bool hasVotedYes,
        bool hasVotedNo
    ) {
        Proposal storage p = proposals[proposalId];
        require(p.creator != address(0), "Proposal does not exist");
        
        return (p.hasVotedYes[user], p.hasVotedNo[user]);
    }

    /**
     * Get proposal voting statistics
     * @param proposalId The ID of the proposal
     * @return yesVotes Number of YES votes
     * @return noVotes Number of NO votes
     * @return netVotes Net votes (yesVotes - noVotes)
     * @return totalVotes Total votes (yesVotes + noVotes)
     * @return yesPercentage Percentage of YES votes
     */
    function getProposalVotes(uint256 proposalId) external view returns (
        uint256 yesVotes,
        uint256 noVotes,
        int256 netVotes,
        uint256 totalVotes,
        uint256 yesPercentage
    ) {
        Proposal storage p = proposals[proposalId];
        require(p.creator != address(0), "Proposal does not exist");
        
        yesVotes = p.yesVotes;
        noVotes = p.noVotes;
        netVotes = int256(yesVotes) - int256(noVotes);
        totalVotes = yesVotes + noVotes;
        yesPercentage = totalVotes > 0 ? (yesVotes * 100) / totalVotes : 0;
        
        return (yesVotes, noVotes, netVotes, totalVotes, yesPercentage);
    }



}
