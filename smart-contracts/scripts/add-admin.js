const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '../.env') });

// Contract configuration
const contractAddress = "0xAB5aDe4eF8Db80d09BF1dDf0461cff45f0D6706E";
const abi = require("../artifacts/contracts/auth/auth.sol/AuthRegistry.json").abi;

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const privateKey = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY.slice(2) : process.env.PRIVATE_KEY;
const ownerWallet = new ethers.Wallet(privateKey, provider);
const authRegistry = new ethers.Contract(contractAddress, abi, ownerWallet);

// Add the admin addresses you want here
const ADMIN_ADDRESSES = [
  "0x67e046683ec00e611c7F3C2a4e6497e6A6069874","0x36Afe89160F0F25D0485D812c2637A69f427dceb","0xE2B42646cf1158659490A865Ed475156E15CB676","0xf328A8351e62e5077D826644Df669e18a8820A53" // Replace with actual admin address
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