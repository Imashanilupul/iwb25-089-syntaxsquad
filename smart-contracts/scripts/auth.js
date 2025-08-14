const express = require("express");
const { ethers } = require("ethers");
const path = require("path");
const router = express.Router();
require("dotenv").config({ path: path.join(__dirname, '../.env') });

const contractAddress = "0x6869062fA4b81C0cA4fBF52E49E136A37AdC28Fd"; // Sepolia contract address
const abi = require("../artifacts/contracts/auth/auth.sol/AuthRegistry.json").abi;

// Use Sepolia RPC and your wallet private key from .env
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Check if PRIVATE_KEY exists
if (!process.env.PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY not found in environment variables");
  process.exit(1);
}

// Remove 0x prefix if present
const privateKey = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY.slice(2) : process.env.PRIVATE_KEY;
const ownerWallet = new ethers.Wallet(privateKey, provider);
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