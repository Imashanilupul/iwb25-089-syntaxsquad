// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuthRegistry {
    address public owner;
    mapping(address => bool) public authorizedUsers;

    event UserAuthorized(address user);
    event UserRevoked(address user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function authorizeUser(address user) external onlyOwner {
        authorizedUsers[user] = true;
        emit UserAuthorized(user);
    }

    function revokeUser(address user) external onlyOwner {
        authorizedUsers[user] = false;
        emit UserRevoked(user);
    }

    function isAuthorized(address user) external view returns (bool) {
        return authorizedUsers[user];
    }
}
