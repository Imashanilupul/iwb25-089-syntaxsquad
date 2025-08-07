const express = require("express");
const { ethers } = require("hardhat");
const router = express.Router();

const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Replace with deployed address
let authRegistry;
let signers;

async function init() {
  const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
  authRegistry = await AuthRegistry.attach(contractAddress);
  signers = await ethers.getSigners();
}
init();

// Authorize a user (only owner)
router.post("/authorize", async (req, res) => {
  const { userAddress, ownerIndex } = req.body;
  try {
    const tx = await authRegistry.connect(signers[ownerIndex]).authorizeUser(userAddress);
    await tx.wait();
    res.json({ message: "User authorized!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke a user (only owner)
router.post("/revoke", async (req, res) => {
  const { userAddress, ownerIndex } = req.body;
  try {
    const tx = await authRegistry.connect(signers[ownerIndex]).revokeUser(userAddress);
    await tx.wait();
    res.json({ message: "User revoked!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if a user is authorized
router.get("/is-authorized/:address", async (req, res) => {
  try {
    const result = await authRegistry.isAuthorized(req.params.address);
    res.json({ isAuthorized: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;