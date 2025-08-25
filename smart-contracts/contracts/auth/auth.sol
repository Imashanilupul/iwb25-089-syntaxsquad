// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuthRegistry {
    address public owner;
    mapping(address => bool) public authorizedUsers;
    mapping(address => bool) public adminUsers;

    event UserAuthorized(address user);
    event UserRevoked(address user);
    event AdminAuthorized(address admin);
    event AdminRevoked(address admin);

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

    function authorizeAdmin(address admin) external onlyOwner {
        adminUsers[admin] = true;
        emit AdminAuthorized(admin);
    }

    function revokeAdmin(address admin) external onlyOwner {
        adminUsers[admin] = false;
        emit AdminRevoked(admin);
    }

    function isAuthorized(address user) external view returns (bool) {
        return authorizedUsers[user] || adminUsers[user];
    }

    function isAdmin(address user) external view returns (bool) {
        return adminUsers[user];
    }
}
