const { ethers } = require("hardhat");

const ADDRESSES = {
  AuthRegistry: "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9",
  Proposals: "0xff40F4C374c1038378c7044720B939a2a0219a2f",
  Petitions: "0x1577FD3B3E54cFA368F858d542920A0fefBaf807",
  Reports: "0xD8E110E021a9281b8ad7A6Cf93c2b14b3e3B2712"
};

const TEST_ADDRESS = "0x1723E0428D3b4d48157dFaa74BBfBE512880047B";

async function debugVotingAuth() {
  console.log("🔍 DEBUGGING VOTING AUTHORIZATION ISSUE");
  console.log("=" * 60);
  
  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    if (network.chainId !== 11155111n) {
      console.log("❌ NOT ON SEPOLIA! Make sure you're connected to Sepolia testnet");
      return;
    }
    
    // Connect to contracts
    console.log("\n📋 Connecting to contracts...");
    
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = AuthRegistry.attach(ADDRESSES.AuthRegistry);
    
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = Proposals.attach(ADDRESSES.Proposals);
    
    const Petitions = await ethers.getContractFactory("Petitions");
    const petitions = Petitions.attach(ADDRESSES.Petitions);
    
    console.log("✅ All contracts connected");
    
    // Test the specific address that's having issues
    console.log(`\n🔍 TESTING ADDRESS: ${TEST_ADDRESS}`);
    console.log("=" * 60);
    
    // Check AuthRegistry directly
    console.log("\n1️⃣ AuthRegistry Contract Tests:");
    const isAuthorized = await authRegistry.isAuthorized(TEST_ADDRESS);
    const isAdmin = await authRegistry.isAdmin(TEST_ADDRESS);
    const inUserMapping = await authRegistry.authorizedUsers(TEST_ADDRESS);
    const inAdminMapping = await authRegistry.adminUsers(TEST_ADDRESS);
    
    console.log(`   ✅ isAuthorized(): ${isAuthorized}`);
    console.log(`   👑 isAdmin(): ${isAdmin}`);
    console.log(`   👤 authorizedUsers[]: ${inUserMapping}`);
    console.log(`   🔐 adminUsers[]: ${inAdminMapping}`);
    console.log(`   🧮 Logic Check: ${inUserMapping} || ${inAdminMapping} = ${inUserMapping || inAdminMapping}`);
    
    if (!isAuthorized) {
      console.log("❌ PROBLEM FOUND: User is NOT authorized in AuthRegistry!");
      console.log("   This means the address is not in either mapping.");
      return;
    }
    
    // Test Proposals contract authorization check
    console.log("\n2️⃣ Proposals Contract Tests:");
    try {
      // Check if Proposals contract can see the AuthRegistry
      const proposalsAuthRegistryAddr = await proposals.authRegistry();
      console.log(`   📍 Proposals.authRegistry: ${proposalsAuthRegistryAddr}`);
      console.log(`   📍 Expected AuthRegistry: ${ADDRESSES.AuthRegistry}`);
      
      if (proposalsAuthRegistryAddr.toLowerCase() !== ADDRESSES.AuthRegistry.toLowerCase()) {
        console.log("❌ PROBLEM FOUND: Proposals contract is pointing to wrong AuthRegistry!");
        console.log("   This means the Proposals contract can't check authorization correctly.");
        return;
      }
      
      // Test if we can call the auth check through Proposals contract
      console.log("   🧪 Testing authorization through Proposals contract...");
      // We can't directly call the internal auth check, but we can simulate
      
    } catch (error) {
      console.log(`   ❌ Error checking Proposals contract: ${error.message}`);
    }
    
    // Test Petitions contract authorization check
    console.log("\n3️⃣ Petitions Contract Tests:");
    try {
      const petitionsAuthRegistryAddr = await petitions.authRegistry();
      console.log(`   📍 Petitions.authRegistry: ${petitionsAuthRegistryAddr}`);
      
      if (petitionsAuthRegistryAddr.toLowerCase() !== ADDRESSES.AuthRegistry.toLowerCase()) {
        console.log("❌ PROBLEM FOUND: Petitions contract is pointing to wrong AuthRegistry!");
        return;
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking Petitions contract: ${error.message}`);
    }
    
    // Test with different case variations of the address
    console.log("\n4️⃣ Address Case Sensitivity Tests:");
    const addressVariations = [
      TEST_ADDRESS,
      TEST_ADDRESS.toLowerCase(),
      TEST_ADDRESS.toUpperCase(),
      ethers.getAddress(TEST_ADDRESS) // Checksum version
    ];
    
    for (const addr of addressVariations) {
      try {
        const result = await authRegistry.isAuthorized(addr);
        console.log(`   ${addr}: ${result}`);
      } catch (error) {
        console.log(`   ${addr}: ERROR - ${error.message}`);
      }
    }
    
    // Test creating a simple proposal (if user is owner)
    console.log("\n5️⃣ Transaction Simulation:");
    try {
      const [signer] = await ethers.getSigners();
      const signerAddress = await signer.getAddress();
      console.log(`   🖋️  Current Signer: ${signerAddress}`);
      
      if (signerAddress.toLowerCase() === TEST_ADDRESS.toLowerCase()) {
        console.log("   ✅ Signer matches test address - can test transactions");
        
        // Try to estimate gas for a proposal creation (without actually sending)
        try {
          const gasEstimate = await proposals.createProposal.estimateGas(
            "QmTest",
            "QmTest", 
            "QmTest",
            1,
            Math.floor(Date.now() / 1000) + 86400 // 1 day from now
          );
          console.log(`   ⛽ Gas Estimate: ${gasEstimate.toString()} (transaction would work)`);
        } catch (gasError) {
          console.log(`   ❌ Gas Estimation Failed: ${gasError.reason || gasError.message}`);
          
          // Parse the error to see if it's an auth issue
          if (gasError.message.includes("User not authorized")) {
            console.log("   🎯 CONFIRMED: This is the authorization error you're seeing!");
          }
        }
      } else {
        console.log("   ℹ️  Different signer - cannot test transactions with this address");
      }
      
    } catch (error) {
      console.log(`   ❌ Transaction simulation error: ${error.message}`);
    }
    
    // Final diagnosis
    console.log("\n📊 DIAGNOSIS:");
    console.log("=" * 40);
    
    if (isAuthorized) {
      console.log("✅ AuthRegistry.isAuthorized() returns TRUE");
      console.log("🤔 The issue might be:");
      console.log("   1. Wrong contract addresses in your frontend/app");
      console.log("   2. Frontend calling wrong network");
      console.log("   3. Address case sensitivity in your app");
      console.log("   4. Transaction sent from different address than expected");
      console.log("   5. Contract interaction through wrong interface");
      
      console.log("\n💡 NEXT STEPS:");
      console.log("   1. Check your frontend wallet connection");
      console.log("   2. Verify you're on Sepolia network in MetaMask");
      console.log("   3. Check contract addresses in your app config");
      console.log("   4. Make sure the wallet address matches exactly");
    } else {
      console.log("❌ AuthRegistry.isAuthorized() returns FALSE");
      console.log("🔧 The user needs to be authorized first!");
    }
    
  } catch (error) {
    console.error("💥 Debug script failed:", error);
  }
}

// Function to re-authorize user if needed
async function reAuthorizeUser() {
  try {
    console.log(`\n🔄 Re-authorizing user: ${TEST_ADDRESS}`);
    
    const [signer] = await ethers.getSigners();
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = AuthRegistry.attach(ADDRESSES.AuthRegistry);
    
    // Check if current signer is owner
    const owner = await authRegistry.owner();
    const signerAddress = await signer.getAddress();
    
    if (signerAddress.toLowerCase() !== owner.toLowerCase()) {
      console.log("❌ Current signer is not the contract owner");
      console.log(`   Owner: ${owner}`);
      console.log(`   Signer: ${signerAddress}`);
      return;
    }
    
    console.log("👑 You are the owner, re-authorizing user...");
    
    const tx = await authRegistry.authorizeUser(TEST_ADDRESS);
    console.log(`📝 Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ User re-authorized! Block: ${receipt.blockNumber}`);
    
    // Verify
    const isNowAuthorized = await authRegistry.isAuthorized(TEST_ADDRESS);
    console.log(`🔍 Verification: isAuthorized() = ${isNowAuthorized}`);
    
  } catch (error) {
    console.error("❌ Re-authorization failed:", error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === "reauth") {
    await reAuthorizeUser();
  } else {
    await debugVotingAuth();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
