const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Load deployed addresses
function loadDeployedAddresses() {
  const addressPath = path.join(__dirname, '..', 'deployed-addresses.json');
  return JSON.parse(fs.readFileSync(addressPath, 'utf8'));
}

async function main() {
  const USER_ADDRESS = "0x83ab5cb493b09a8ba99c9ce31b21fe08b3da5799"; // Your wallet address
  
  console.log("🔐 Authorizing user in AuthRegistry...");
  console.log(`👤 User Address: ${USER_ADDRESS}`);
  
  try {
    const addresses = loadDeployedAddresses();
    const authRegistryAddress = addresses.AuthRegistry;
    
    console.log(`📋 AuthRegistry Address: ${authRegistryAddress}`);
    
    // Get signer (contract owner)
    const [owner] = await ethers.getSigners();
    console.log(`👑 Owner Address: ${await owner.getAddress()}`);
    
    // Connect to AuthRegistry contract
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = AuthRegistry.attach(authRegistryAddress);
    
    // Verify owner
    const contractOwner = await authRegistry.owner();
    const signerAddress = await owner.getAddress();
    
    if (signerAddress.toLowerCase() !== contractOwner.toLowerCase()) {
      console.log("❌ ERROR: Current signer is not the contract owner");
      console.log(`   Contract Owner: ${contractOwner}`);
      console.log(`   Current Signer: ${signerAddress}`);
      console.log("\n💡 Solution: Make sure you're using the owner's private key in your .env file");
      return;
    }
    
    // Check current authorization status
    const isCurrentlyAuthorized = await authRegistry.isAuthorized(USER_ADDRESS);
    const isCurrentlyAdmin = await authRegistry.isAdmin(USER_ADDRESS);
    
    console.log(`🔍 Current Authorization Status:`);
    console.log(`   isAuthorized: ${isCurrentlyAuthorized}`);
    console.log(`   isAdmin: ${isCurrentlyAdmin}`);
    
    if (isCurrentlyAuthorized) {
      console.log("✅ User is already authorized!");
      return;
    }
    
    // Authorize the user
    console.log("🔄 Authorizing user...");
    const tx = await authRegistry.authorizeUser(USER_ADDRESS);
    console.log(`📝 Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ User authorized successfully! Block: ${receipt.blockNumber}`);
    
    // Verify authorization
    const isNowAuthorized = await authRegistry.isAuthorized(USER_ADDRESS);
    console.log(`🔍 Verification: isAuthorized() = ${isNowAuthorized}`);
    
    if (isNowAuthorized) {
      console.log("🎉 SUCCESS: User is now authorized to vote!");
      console.log("\n🗳️ You can now vote on proposals with this wallet address.");
    } else {
      console.log("❌ FAILED: User authorization was not successful");
    }
    
  } catch (error) {
    console.error("❌ Authorization failed:", error.message);
    
    if (error.message.includes("Not contract owner")) {
      console.log("\n💡 This error means you're not using the owner's private key.");
      console.log("   Make sure the PRIVATE_KEY in your .env file belongs to the contract owner.");
    }
  }
}

main().catch(console.error);
