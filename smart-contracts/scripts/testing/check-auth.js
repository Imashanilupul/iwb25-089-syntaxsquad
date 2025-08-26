const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9";

async function main() {
  console.log("📋 Listing Authorized Users and Admins");
  console.log("==================================================");
  
  const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
  const authRegistry = AuthRegistry.attach(CONTRACT_ADDRESS).connect(ethers.provider);
  
  // Get current block
  const currentBlock = await ethers.provider.getBlockNumber();
  const fromBlock = 0;
  
  console.log(`🔍 Scanning blocks ${fromBlock} to ${currentBlock}...`);
  
  // Get all events
  const userAuthEvents = await authRegistry.queryFilter(authRegistry.filters.UserAuthorized(), fromBlock, currentBlock);
  const userRevEvents = await authRegistry.queryFilter(authRegistry.filters.UserRevoked(), fromBlock, currentBlock);
  const adminAuthEvents = await authRegistry.queryFilter(authRegistry.filters.AdminAuthorized(), fromBlock, currentBlock);
  const adminRevEvents = await authRegistry.queryFilter(authRegistry.filters.AdminRevoked(), fromBlock, currentBlock);
  
  // Track users
  const users = new Set();
  const admins = new Set();
  
  // Add authorized users
  userAuthEvents.forEach(e => users.add(e.args.user));
  
  // Remove revoked users
  userRevEvents.forEach(e => users.delete(e.args.user));
  
  // Add authorized admins
  adminAuthEvents.forEach(e => {
    admins.add(e.args.admin);
    users.delete(e.args.admin); // Remove from regular users if present
  });
  
  // Remove revoked admins
  adminRevEvents.forEach(e => admins.delete(e.args.admin));
  
  console.log("\n👑 ADMIN ADDRESSES:");
  console.log("------------------------------");
  if (admins.size === 0) {
    console.log("None");
  } else {
    Array.from(admins).forEach((addr, i) => console.log(`${i + 1}. ${addr}`));
  }
  
  console.log("\n👤 AUTHORIZED USER ADDRESSES:");
  console.log("------------------------------");
  if (users.size === 0) {
    console.log("None");
  } else {
    Array.from(users).forEach((addr, i) => console.log(`${i + 1}. ${addr}`));
  }
  
  console.log(`\n📊 Total: ${admins.size} admins, ${users.size} users`);
}

main().catch(console.error);