const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '../.env') });

// Contract configuration
const contractAddress = "0x010Fa40999Fa27a1Ac4599b3eCecC3A716A2439b";
const abi = require("../artifacts/contracts/auth/auth.sol/AuthRegistry.json").abi;

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const privateKey = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY.slice(2) : process.env.PRIVATE_KEY;
const ownerWallet = new ethers.Wallet(privateKey, provider);
const authRegistry = new ethers.Contract(contractAddress, abi, ownerWallet);

// Add the admin addresses you want here
const ADMIN_ADDRESSES = [
  "0x06C57c762f88f806D9d1E254309F456A4e8C4970", // Replace with actual admin address
   // Replace with actual admin address
];

async function addAdmin() {
  console.log("Adding admins to AuthRegistry contract...");
  console.log(`Owner: ${ownerWallet.address}`);
  
  for (const adminAddress of ADMIN_ADDRESSES) {
    try {
      console.log(`\nAdding admin: ${adminAddress}`);
      
      // Check if already admin
      // const isAlreadyAdmin = await authRegistry.isAdmin(adminAddress);
      // if (isAlreadyAdmin) {
      //   console.log("Already an admin, skipping...");
      //   continue;
      // }
      
      // Add as admin
      const tx = await authRegistry.authorizeAdmin(adminAddress);
      console.log(`Transaction: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Success! Block: ${receipt.blockNumber}`);
      
    } catch (error) {
      console.error(`Failed to add admin ${adminAddress}:`, error.message);
    }
  }
  
  console.log("\nDone!");
}

addAdmin().catch(console.error);
