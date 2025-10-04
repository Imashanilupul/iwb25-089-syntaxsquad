const express = require("express");
const { ethers } = require("ethers");
const path = require("path");
const router = express.Router();
require("dotenv").config({ path: path.join(__dirname, '../.env') });

const contractAddress = "0xAB5aDe4eF8Db80d09BF1dDf0461cff45f0D6706E"; // Sepolia contract address
const abi = require("../artifacts/contracts/auth/auth.sol/AuthRegistry.json").abi;

// Use Sepolia RPC and your wallet private key from .env
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Check if PRIVATE_KEY exists
if (!process.env.PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY not found in environment variables");
  process.exit(1);
}

// Remove 0x prefix if present and create owner wallet from env
const rawKey = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : '0x' + process.env.PRIVATE_KEY;
const ownerWallet = new ethers.Wallet(rawKey, provider);
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

// Register a new user (authorize wallet address using owner wallet)
router.post("/register", async (req, res) => {
  const { userAddress, userData } = req.body;
  
  if (!userAddress) {
    return res.status(400).json({ error: "User wallet address is required" });
  }

  try {
    // Validate address format
    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: `Invalid Ethereum address: ${userAddress}` });
    }

    // Verify configured owner wallet is the contract owner
    let contractOwner
    try {
      contractOwner = await authRegistry.owner()
    } catch (err) {
      console.error('Failed to read contract owner:', err && err.message ? err.message : err)
      return res.status(500).json({ error: 'Failed to read contract owner for debug. Check provider and contract address.' })
    }

    if (contractOwner.toLowerCase() !== ownerWallet.address.toLowerCase()) {
      console.error(`Owner mismatch: configured owner ${ownerWallet.address} != contract owner ${contractOwner}`)
      return res.status(400).json({ error: `Configured owner address (${ownerWallet.address}) does not match contract owner (${contractOwner}). Registration must be performed by the contract owner.` })
    }

    console.log(`Registering user with address: ${userAddress}`);
    console.log(`User data:`, userData);
    
    // Authorize the user's wallet address using the owner wallet
    const tx = await authRegistry.authorizeUser(userAddress);
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
    
    res.json({ 
      message: "User registered and authorized successfully!", 
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      userData: userData
    });
  } catch (err) {
    console.error("Registration error:", err);
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

// Check if a user is admin
router.get("/is-admin/:address", async (req, res) => {
  try {
    const result = await authRegistry.isAdmin(req.params.address);
    res.json({ isAdmin: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;