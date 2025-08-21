const { ethers } = require("hardhat");

async function debugIsAuthorized() {
  try {
    console.log("🔍 Debugging isAuthorized function...");
    
    // Connect to Sepolia
    const contractAddress = "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9";
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = AuthRegistry.attach(contractAddress);
    
    // Test addresses from our previous results
    const testAddresses = [
      "0x88909D97aA7f55bdd70D74F21663d4FAaC09371d", // Admin user
      "0x1723E0428D3b4d48157dFaa74BBfBE512880047B", // Regular user
    ];
    
    console.log("📍 Contract Address:", contractAddress);
    console.log("🌐 Network:", (await ethers.provider.getNetwork()).name);
    
    for (const address of testAddresses) {
      console.log(`\n🔍 Testing address: ${address}`);
      console.log("=" * 50);
      
      try {
        // Call each function individually
        const isAuthorized = await authRegistry.isAuthorized(address);
        const isAdmin = await authRegistry.isAdmin(address);
        const isRegularUser = await authRegistry.authorizedUsers(address);
        const isInAdminMapping = await authRegistry.adminUsers(address);
        
        console.log(`📞 isAuthorized(${address}): ${isAuthorized}`);
        console.log(`👑 isAdmin(${address}): ${isAdmin}`);
        console.log(`👤 authorizedUsers[${address}]: ${isRegularUser}`);
        console.log(`🔐 adminUsers[${address}]: ${isInAdminMapping}`);
        
        // Manual logic check
        const expectedAuthorized = isRegularUser || isInAdminMapping;
        console.log(`🧮 Expected (authorizedUsers[addr] || adminUsers[addr]): ${expectedAuthorized}`);
        
        if (isAuthorized === expectedAuthorized) {
          console.log("✅ Function working correctly");
        } else {
          console.log("❌ FUNCTION NOT WORKING - MISMATCH!");
          console.log(`   Expected: ${expectedAuthorized}`);
          console.log(`   Got: ${isAuthorized}`);
        }
        
        // Check if there might be a revert
        console.log("🔄 Testing with different call methods...");
        
        // Try with staticCall
        try {
          const staticResult = await authRegistry.isAuthorized.staticCall(address);
          console.log(`📞 staticCall result: ${staticResult}`);
        } catch (staticError) {
          console.log(`❌ staticCall failed: ${staticError.message}`);
        }
        
        // Try calling the contract directly with low-level call
        try {
          const iface = authRegistry.interface;
          const data = iface.encodeFunctionData("isAuthorized", [address]);
          const result = await ethers.provider.call({
            to: contractAddress,
            data: data
          });
          const decoded = iface.decodeFunctionResult("isAuthorized", result);
          console.log(`🔧 Low-level call result: ${decoded[0]}`);
        } catch (lowLevelError) {
          console.log(`❌ Low-level call failed: ${lowLevelError.message}`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing ${address}:`, error.message);
        
        // Check if it's a revert
        if (error.message.includes("revert")) {
          console.log("🚨 Function is reverting - check contract logic");
        }
      }
    }
    
    // Test contract owner
    try {
      const owner = await authRegistry.owner();
      console.log(`\n👑 Contract Owner: ${owner}`);
      console.log(`🔍 Testing owner authorization:`);
      
      const ownerIsAuthorized = await authRegistry.isAuthorized(owner);
      const ownerIsAdmin = await authRegistry.isAdmin(owner);
      const ownerIsRegular = await authRegistry.authorizedUsers(owner);
      const ownerIsInAdminMapping = await authRegistry.adminUsers(owner);
      
      console.log(`   isAuthorized: ${ownerIsAuthorized}`);
      console.log(`   isAdmin: ${ownerIsAdmin}`);
      console.log(`   authorizedUsers: ${ownerIsRegular}`);
      console.log(`   adminUsers: ${ownerIsInAdminMapping}`);
      
    } catch (ownerError) {
      console.error("❌ Error testing owner:", ownerError.message);
    }
    
    console.log("\n🔧 CONTRACT STATE CHECK:");
    console.log("=" * 50);
    
    // Check if contract has any issues
    const code = await ethers.provider.getCode(contractAddress);
    console.log(`📏 Contract bytecode length: ${code.length}`);
    console.log(`✅ Contract deployed: ${code !== "0x"}`);
    
    // Check network
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (${network.chainId})`);
    
    // Check current block
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`🧱 Current block: ${blockNumber}`);
    
  } catch (error) {
    console.error("💥 Debug script failed:", error);
  }
}

debugIsAuthorized()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
