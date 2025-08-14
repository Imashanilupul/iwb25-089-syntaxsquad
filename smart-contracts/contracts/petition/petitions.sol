// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuthRegistry {
    function isAuthorized(address user) external view returns (bool);
}

contract Petitions {
    struct Petition {
        string titleCid; 
        string desCid; 
        uint256 signaturesRequired;
        uint256 signaturesCount;
        address creator;
        bool completed;
        mapping(address => bool) signers;
    }

    IAuthRegistry public authRegistry;
    uint256 public petitionCount;
    mapping(uint256 => Petition) private petitions;
    mapping(address => uint256) public lastCreatedAt;


    event PetitionCreated(uint256 indexed petitionId, address indexed creator, string titleCid, string desCid, uint256 signaturesRequired);
    event PetitionSigned(uint256 indexed petitionId, address indexed signer);
    event PetitionCompleted(uint256 indexed petitionId);

    constructor(address _authRegistry) {
        require(_authRegistry != address(0), "Auth registry address cannot be zero");
        authRegistry = IAuthRegistry(_authRegistry);
    }

    // Only authorized users can perform write operations
    modifier onlyAuthorized() {
        require(authRegistry.isAuthorized(msg.sender), "User not authorized");
        _;
    }

    //User can only make petition once a week
    modifier onlyOncePerWeek() {
        require(
            block.timestamp >= lastCreatedAt[msg.sender] + 1 weeks,
            "You can only create one petition per week"
        );
        _;
    }


    //Create function
    function createPetition(string calldata titleCid,string calldata desCid, uint256 signaturesRequired) external onlyAuthorized onlyOncePerWeek returns (uint256) {
        require(signaturesRequired > 0, "Signatures required must be greater than zero");
        petitionCount++;
        uint256 petitionId = petitionCount;

        Petition storage p = petitions[petitionId];
        p.titleCid = titleCid;
        p.desCid = desCid;
        p.signaturesRequired = signaturesRequired;
        p.creator = msg.sender;
        p.completed = false;
        p.signaturesCount = 0;

        lastCreatedAt[msg.sender] = block.timestamp;

        emit PetitionCreated(petitionId, msg.sender, titleCid, desCid, signaturesRequired);
        return petitionId;
    }


    //sign petition function
    function signPetition(uint256 petitionId) external onlyAuthorized {
        Petition storage p = petitions[petitionId];
        require(!p.completed, "Petition already completed");
        require(p.creator != address(0), "Petition does not exist");
        require(!p.signers[msg.sender], "You have already signed this petition");

        p.signers[msg.sender] = true;
        p.signaturesCount++;

        emit PetitionSigned(petitionId, msg.sender);

        if (p.signaturesCount >= p.signaturesRequired) {
            p.completed = true;
            emit PetitionCompleted(petitionId);
        }
    }


    //function to get petition details
    function getPetition(uint256 petitionId) external view returns (
        string memory titleCid,
        string memory desCid,
        uint256 signaturesRequired,
        uint256 signaturesCount,
        address creator,
        bool completed
    ) {
        Petition storage p = petitions[petitionId];
        require(p.creator != address(0), "Petition does not exist");
        return (p.titleCid,p.desCid, p.signaturesRequired, p.signaturesCount, p.creator, p.completed);
    }


    //Check if a user has signed a petition
    function hasSigned(uint256 petitionId, address user) external view returns (bool) {
        Petition storage p = petitions[petitionId];
        require(p.creator != address(0), "Petition does not exist");
        return p.signers[user];
    }}