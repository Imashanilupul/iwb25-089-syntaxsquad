require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

// Load contract ABI
const abi = JSON.parse(fs.readFileSync("artifacts/contracts/auth/auth.sol/AuthRegistry.json")).abi;

// Config
const contractAddress = "0x543C8a002CB1E415361535Bc62DEc2ae93810770"; // Replace with your deployed address
const userAddress = "0xF12367Bc27781eD423a96acA59E3Bfe94EE2963C"; // Replace with the address you want to authorize

// Sepolia RPC and owner private key from .env
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const ownerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
      const contract = new ethers.Contract(contractAddress, abi, provider);
  const isVerified = await contract.isAuthorized(userAddress);
  console.log(`Is user verified: ${isVerified}`);
//   const contract = new ethers.Contract(contractAddress, abi, ownerWallet);
//   const tx = await contract.authorizeUser(userAddress);
//   await tx.wait();
//   console.log(`Authorized user: ${userAddress}`);
}

main().catch(console.error);