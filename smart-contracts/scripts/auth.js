const express = require("express");
const { ethers } = require("ethers");
const router = express.Router();
require("dotenv").config();

const contractAddress = "0x543C8a002CB1E415361535Bc62DEc2ae93810770"; // Sepolia contract address
const abi = require("../artifacts/contracts/auth/auth.sol/AuthRegistry.json").abi;

// Use Sepolia RPC and your wallet private key from .env
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const ownerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const authRegistry = new ethers.Contract(contractAddress, abi, ownerWallet);

// Authorize a user (only owner)
router.post("/authorize", async (req, res) => {
  const { userAddress } = req.body;
  try {
    const tx = await authRegistry.authorizeUser(userAddress);
    await tx.wait();
    res.json({ message: "User authorized!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke a user (only owner)
router.post("/revoke", async (req, res) => {
  const { userAddress } = req.body;
  try {
    const tx = await authRegistry.revokeUser(userAddress);
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