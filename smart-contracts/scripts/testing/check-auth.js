const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  sepolia: "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9", // From your deployment
  // Add other networks as needed
};

function getContractAddress() {
  // Check what network we're on first
  const networkName = process.env.HARDHAT_NETWORK || 'localhost';
  
  // If we're on Sepolia, use the Sepolia address
  if (networkName === 'sepolia') {
    console.log("🌐 Using Sepolia contract address");
    return CONTRACT_ADDRESSES.sepolia;
  }
  
  // Try to load from deployed-addresses.json for localhost
  const addresses = loadDeployedAddresses();
  if (addresses && addresses.AuthRegistry) {
    console.log("📋 Using address from deployed-addresses.json");
    return addresses.AuthRegistry;
  }
  
  // Fallback to hardcoded addresses based on network
  console.log("⚠️  Using fallback address");
  return CONTRACT_ADDRESSES.sepolia;
}

function loadDeployedAddresses() {
  try {
    const p = path.join(__dirname, '..', 'deployed-addresses.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load deployed-addresses.json:', e.message);
  }
  return null;
}

async function checkAuthData() {
  try {
    console.log("🔍 Starting AuthRegistry contract check...");
    console.log("=" * 60);

    // Get the contract address
    const finalContractAddress = getContractAddress();
    console.log(`📍 Contract Address: ${finalContractAddress}`);
    
    // Get network info first
    const currentNetwork = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`);
    
    // Check network and suggest correct address if needed
    if (currentNetwork.chainId === 11155111n) {
      console.log("✅ Connected to Sepolia testnet");
    } else if (currentNetwork.chainId === 31337n) {
      console.log("⚠️  Connected to local Hardhat network");
      console.log("💡 Switch to Sepolia network using: npx hardhat run --network sepolia scripts/testing/check-auth.js");
    } else {
      console.log(`⚠️  Connected to unexpected network: ${currentNetwork.name}`);
    }
    
    // Get contract factory and attach to deployed contract
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = AuthRegistry.attach(finalContractAddress);
    
    // Connect with provider explicitly for read-only operations
    const connectedContract = authRegistry.connect(ethers.provider);
    
    // Check if contract exists and is accessible
    console.log("🔗 Testing contract connection...");
    
    // Get contract owner
    let owner;
    try {
      owner = await connectedContract.owner();
      console.log(`👑 Contract Owner: ${owner}`);
    } catch (error) {
      console.error("❌ Error getting contract owner:", error.message);
      console.log("💡 Possible issues:");
      console.log("   - Contract not deployed at this address on current network");
      console.log("   - Wrong network (make sure you're on Sepolia)");
      console.log("   - Contract ABI mismatch");
      console.log(`   - Current network: ${currentNetwork.name} (${currentNetwork.chainId})`);
      console.log("   - Try running with: npx hardhat run --network sepolia scripts/testing/check-auth.js");
      
      // Try alternative approach using provider directly
      console.log("\n🔄 Trying alternative approach...");
      try {
        const code = await ethers.provider.getCode(finalContractAddress);
        if (code === "0x") {
          console.log("❌ No contract found at this address");
        } else {
          console.log("✅ Contract code exists at this address");
          console.log(`📏 Contract bytecode length: ${code.length} characters`);
        }
      } catch (codeError) {
        console.error("❌ Could not check contract code:", codeError.message);
      }
      return;
    }
    
    console.log("\n" + "=" * 60);
    console.log("👤 USER AUTHORIZATION STATUS:");
    console.log("=" * 60);
    
    // Test addresses to check (including the owner and some sample addresses)
    const testAddresses = [
      owner, // Contract owner (should be admin)
      "0x88909D97aA7f55bdd70D74F21663d4FAaC09371d", // Your deployer address
      "0x1234567890123456789012345678901234567890", // Sample address
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", // Another sample
    ];
    
    for (const address of testAddresses) {
      try {
        console.log(`\n🔍 Checking address: ${address}`);
        console.log("-" * 50);
        
        // Check if user is authorized (regular user OR admin)
        const isAuthorized = await connectedContract.isAuthorized(address);
        console.log(`✅ Is Authorized: ${isAuthorized}`);
        
        // Check if user is admin
        const isAdmin = await connectedContract.isAdmin(address);
        console.log(`👑 Is Admin: ${isAdmin}`);
        
        // Check if user is regular authorized user (not admin)
        const isRegularUser = await connectedContract.authorizedUsers(address);
        console.log(`👤 Is Regular User: ${isRegularUser}`);
        
        // Check if user is specifically in admin mapping
        const isInAdminMapping = await connectedContract.adminUsers(address);
        console.log(`🔐 Is in Admin Mapping: ${isInAdminMapping}`);
        
        // Determine user type
        let userType = "❌ Not Authorized";
        if (isAdmin) {
          userType = "👑 Admin User";
        } else if (isRegularUser) {
          userType = "👤 Regular User";
        } else if (isAuthorized) {
          userType = "✅ Authorized (Unknown Type)";
        }
        
        console.log(`📊 User Type: ${userType}`);
        
        // Special note for owner
        if (address.toLowerCase() === owner.toLowerCase()) {
          console.log("🏛️  Note: This is the contract owner");
        }
        
      } catch (error) {
        console.error(`❌ Error checking address ${address}:`, error.message);
      }
    }
    
    console.log("\n" + "=" * 60);
    console.log("🔧 CONTRACT FUNCTIONS TEST:");
    console.log("=" * 60);
    
    // Test contract function availability
    console.log("\n📋 Available Functions:");
    const contractInterface = authRegistry.interface;
    const functions = contractInterface.fragments.filter(f => f.type === 'function');
    
    functions.forEach(func => {
      const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
      const outputs = func.outputs?.map(output => output.type).join(', ') || 'void';
      console.log(`   📌 ${func.name}(${inputs}) → ${outputs}`);
    });
    
    console.log("\n📋 Available Events:");
    const events = contractInterface.fragments.filter(f => f.type === 'event');
    
    events.forEach(event => {
      const inputs = event.inputs.map(input => `${input.type} ${input.name}`).join(', ');
      console.log(`   🎯 ${event.name}(${inputs})`);
    });
    
    console.log("\n" + "=" * 60);
    console.log("📊 SUMMARY");
    console.log("=" * 60);
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get current block
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`🧱 Current Block: ${blockNumber}`);
    
    console.log(`👑 Contract Owner: ${owner}`);
    console.log(`📍 Contract Address: ${finalContractAddress}`);
    
    // Test authorization logic
    console.log("\n🧪 Authorization Logic Test:");
    const sampleAddress = testAddresses[1]; // Use deployer address
    const authResult = await connectedContract.isAuthorized(sampleAddress);
    const adminResult = await connectedContract.isAdmin(sampleAddress);
    const regularResult = await connectedContract.authorizedUsers(sampleAddress);
    
    console.log(`   Address: ${sampleAddress}`);
    console.log(`   isAuthorized(): ${authResult} (should be true if admin OR regular user)`);
    console.log(`   isAdmin(): ${adminResult}`);
    console.log(`   authorizedUsers mapping: ${regularResult}`);
    console.log(`   Logic: isAuthorized = authorizedUsers[addr] || adminUsers[addr]`);
    
    console.log("\n✅ AuthRegistry contract check completed!");
    
  } catch (error) {
    console.error("❌ Error during auth check:", error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure the AuthRegistry contract is deployed to the current network");
    console.log("2. Check that the contract address is correct");
    console.log("3. Ensure you're connected to the right network (Sepolia, etc.)");
    console.log("4. Verify the contract ABI matches the deployed contract");
  }
}

// Function to check specific address authorization
async function checkSpecificAddress(address) {
  try {
    console.log(`🔍 Checking specific address: ${address}...`);
    
    const finalContractAddress = getContractAddress();
    
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = await AuthRegistry.attach(finalContractAddress);
    
    const isAuthorized = await authRegistry.isAuthorized(address);
    const isAdmin = await authRegistry.isAdmin(address);
    const isRegularUser = await authRegistry.authorizedUsers(address);
    const owner = await authRegistry.owner();
    
    console.log(`\n👤 ADDRESS DETAILS: ${address}`);
    console.log("-" * 50);
    console.log(`✅ Is Authorized: ${isAuthorized}`);
    console.log(`👑 Is Admin: ${isAdmin}`);
    console.log(`👤 Is Regular User: ${isRegularUser}`);
    console.log(`🏛️  Is Owner: ${address.toLowerCase() === owner.toLowerCase()}`);
    
    return {
      address,
      isAuthorized,
      isAdmin,
      isRegularUser,
      isOwner: address.toLowerCase() === owner.toLowerCase()
    };
  } catch (error) {
    console.error(`❌ Error checking address ${address}:`, error.message);
    return null;
  }
}

// Function to simulate authorization operations (read-only)
async function simulateAuthOperations() {
  try {
    console.log("🧪 Simulating Authorization Operations...");
    
    const finalContractAddress = getContractAddress();
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = await AuthRegistry.attach(finalContractAddress);
    
    const owner = await authRegistry.owner();
    console.log(`👑 Current Owner: ${owner}`);
    
    // Get current signer
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    
    console.log(`🖋️  Current Signer: ${signerAddress}`);
    console.log(`🔐 Can Perform Owner Operations: ${signerAddress.toLowerCase() === owner.toLowerCase()}`);
    
    if (signerAddress.toLowerCase() === owner.toLowerCase()) {
      console.log("✅ You are the owner and can perform all operations:");
      console.log("   - authorizeUser(address)");
      console.log("   - revokeUser(address)"); 
      console.log("   - authorizeAdmin(address)");
      console.log("   - revokeAdmin(address)");
    } else {
      console.log("❌ You are NOT the owner. Only read operations available.");
    }
    
  } catch (error) {
    console.error("❌ Error simulating operations:", error.message);
  }
}

// Function to get recent authorization events
async function getRecentEvents() {
  try {
    console.log("📡 Fetching recent authorization events...");
    
    const finalContractAddress = getContractAddress();
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = await AuthRegistry.attach(finalContractAddress);
    
    // Get current block
    const currentBlock = await ethers.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000); // Last 10k blocks
    
    console.log(`🔍 Searching blocks ${fromBlock} to ${currentBlock}...`);
    
    // Get all authorization events
    const userAuthorizedFilter = authRegistry.filters.UserAuthorized();
    const userRevokedFilter = authRegistry.filters.UserRevoked();
    const adminAuthorizedFilter = authRegistry.filters.AdminAuthorized();
    const adminRevokedFilter = authRegistry.filters.AdminRevoked();
    
    const [userAuthEvents, userRevEvents, adminAuthEvents, adminRevEvents] = await Promise.all([
      authRegistry.queryFilter(userAuthorizedFilter, fromBlock, currentBlock),
      authRegistry.queryFilter(userRevokedFilter, fromBlock, currentBlock),
      authRegistry.queryFilter(adminAuthorizedFilter, fromBlock, currentBlock),
      authRegistry.queryFilter(adminRevokedFilter, fromBlock, currentBlock)
    ]);
    
    console.log("\n📋 RECENT EVENTS:");
    console.log("-" * 40);
    
    const allEvents = [
      ...userAuthEvents.map(e => ({ ...e, type: 'UserAuthorized' })),
      ...userRevEvents.map(e => ({ ...e, type: 'UserRevoked' })),
      ...adminAuthEvents.map(e => ({ ...e, type: 'AdminAuthorized' })),
      ...adminRevEvents.map(e => ({ ...e, type: 'AdminRevoked' }))
    ];
    
    // Sort by block number
    allEvents.sort((a, b) => a.blockNumber - b.blockNumber);
    
    if (allEvents.length === 0) {
      console.log("📭 No authorization events found in recent blocks");
    } else {
      allEvents.forEach((event, index) => {
        console.log(`\n${index + 1}. 🎯 ${event.type}`);
        console.log(`   👤 User: ${event.args.user || event.args.admin}`);
        console.log(`   🧱 Block: ${event.blockNumber}`);
        console.log(`   📝 Tx Hash: ${event.transactionHash}`);
      });
    }
    
    console.log(`\n📊 Event Summary:`);
    console.log(`   👤 Users Authorized: ${userAuthEvents.length}`);
    console.log(`   👤 Users Revoked: ${userRevEvents.length}`);
    console.log(`   👑 Admins Authorized: ${adminAuthEvents.length}`);
    console.log(`   👑 Admins Revoked: ${adminRevEvents.length}`);
    
  } catch (error) {
    console.error("❌ Error getting events:", error.message);
  }
}

// Function to get all registered users from blockchain events
async function getAllRegisteredUsers() {
  try {
    console.log("👥 Fetching all registered users...");
    console.log("=" * 60);
    
    const finalContractAddress = getContractAddress();
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = await AuthRegistry.attach(finalContractAddress);
    
    // Get current block
    const currentBlock = await ethers.provider.getBlockNumber();
    const fromBlock = 0; // Search from genesis block to get all users
    
    console.log(`🔍 Searching entire blockchain from block ${fromBlock} to ${currentBlock}...`);
    
    // Get all authorization events from the beginning
    const userAuthorizedFilter = authRegistry.filters.UserAuthorized();
    const userRevokedFilter = authRegistry.filters.UserRevoked();
    const adminAuthorizedFilter = authRegistry.filters.AdminAuthorized();
    const adminRevokedFilter = authRegistry.filters.AdminRevoked();
    
    console.log("📡 Fetching events (this may take a moment)...");
    
    const [userAuthEvents, userRevEvents, adminAuthEvents, adminRevEvents] = await Promise.all([
      authRegistry.queryFilter(userAuthorizedFilter, fromBlock, currentBlock),
      authRegistry.queryFilter(userRevokedFilter, fromBlock, currentBlock),
      authRegistry.queryFilter(adminAuthorizedFilter, fromBlock, currentBlock),
      authRegistry.queryFilter(adminRevokedFilter, fromBlock, currentBlock)
    ]);
    
    // Track all users and their current status
    const userTracker = new Map();
    
    // Process regular user events
    userAuthEvents.forEach(event => {
      const address = event.args.user.toLowerCase();
      userTracker.set(address, {
        address: event.args.user, // Keep original case
        isRegularUser: true,
        isAdmin: userTracker.get(address)?.isAdmin || false,
        lastActivity: 'UserAuthorized',
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      });
    });
    
    userRevEvents.forEach(event => {
      const address = event.args.user.toLowerCase();
      if (userTracker.has(address)) {
        userTracker.get(address).isRegularUser = false;
        userTracker.get(address).lastActivity = 'UserRevoked';
        userTracker.get(address).blockNumber = event.blockNumber;
        userTracker.get(address).txHash = event.transactionHash;
      }
    });
    
    // Process admin user events
    adminAuthEvents.forEach(event => {
      const address = event.args.admin.toLowerCase();
      if (userTracker.has(address)) {
        userTracker.get(address).isAdmin = true;
        userTracker.get(address).lastActivity = 'AdminAuthorized';
        userTracker.get(address).blockNumber = event.blockNumber;
        userTracker.get(address).txHash = event.transactionHash;
      } else {
        userTracker.set(address, {
          address: event.args.admin,
          isRegularUser: false,
          isAdmin: true,
          lastActivity: 'AdminAuthorized',
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      }
    });
    
    adminRevEvents.forEach(event => {
      const address = event.args.admin.toLowerCase();
      if (userTracker.has(address)) {
        userTracker.get(address).isAdmin = false;
        userTracker.get(address).lastActivity = 'AdminRevoked';
        userTracker.get(address).blockNumber = event.blockNumber;
        userTracker.get(address).txHash = event.transactionHash;
      }
    });
    
    // Convert to array and sort by block number
    const allUsers = Array.from(userTracker.values());
    allUsers.sort((a, b) => a.blockNumber - b.blockNumber);
    
    // Separate active users by type
    const activeRegularUsers = allUsers.filter(u => u.isRegularUser && !u.isAdmin);
    const activeAdminUsers = allUsers.filter(u => u.isAdmin);
    const revokedUsers = allUsers.filter(u => !u.isRegularUser && !u.isAdmin);
    const activeAnyUsers = allUsers.filter(u => u.isRegularUser || u.isAdmin);
    
    console.log("\n👑 ADMIN USERS:");
    console.log("=" * 50);
    if (activeAdminUsers.length === 0) {
      console.log("📭 No admin users found");
    } else {
      activeAdminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. 👑 Admin User`);
        console.log(`   📍 Address: ${user.address}`);
        console.log(`   🎯 Last Action: ${user.lastActivity}`);
        console.log(`   🧱 Block: ${user.blockNumber}`);
        console.log(`   📝 Tx Hash: ${user.txHash}`);
        console.log(`   ✅ Can Create/Vote: YES`);
        console.log(`   🔐 Admin Privileges: YES`);
      });
    }
    
    console.log("\n👤 REGULAR USERS:");
    console.log("=" * 50);
    if (activeRegularUsers.length === 0) {
      console.log("📭 No regular users found");
    } else {
      activeRegularUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. 👤 Regular User`);
        console.log(`   📍 Address: ${user.address}`);
        console.log(`   🎯 Last Action: ${user.lastActivity}`);
        console.log(`   🧱 Block: ${user.blockNumber}`);
        console.log(`   📝 Tx Hash: ${user.txHash}`);
        console.log(`   ✅ Can Create/Vote: YES`);
        console.log(`   🔐 Admin Privileges: NO`);
      });
    }
    
    console.log("\n❌ REVOKED USERS:");
    console.log("=" * 50);
    if (revokedUsers.length === 0) {
      console.log("📭 No revoked users found");
    } else {
      revokedUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ❌ Revoked User`);
        console.log(`   📍 Address: ${user.address}`);
        console.log(`   🎯 Last Action: ${user.lastActivity}`);
        console.log(`   🧱 Block: ${user.blockNumber}`);
        console.log(`   📝 Tx Hash: ${user.txHash}`);
        console.log(`   ✅ Can Create/Vote: NO`);
        console.log(`   🔐 Admin Privileges: NO`);
      });
    }
    
    console.log("\n📊 USER SUMMARY:");
    console.log("=" * 50);
    console.log(`👑 Active Admin Users: ${activeAdminUsers.length}`);
    console.log(`👤 Active Regular Users: ${activeRegularUsers.length}`);
    console.log(`✅ Total Active Users: ${activeAnyUsers.length}`);
    console.log(`❌ Revoked Users: ${revokedUsers.length}`);
    console.log(`📋 Total Users Ever: ${allUsers.length}`);
    
    // Verify current status by checking contract state
    console.log("\n🔄 Verifying current status with contract...");
    let verificationErrors = 0;
    
    for (const user of activeAnyUsers.slice(0, 5)) { // Verify first 5 users
      try {
        const isAuthorized = await authRegistry.isAuthorized(user.address);
        const isAdmin = await authRegistry.isAdmin(user.address);
        
        if (isAuthorized !== (user.isRegularUser || user.isAdmin)) {
          console.log(`⚠️  Status mismatch for ${user.address}: expected authorized=${user.isRegularUser || user.isAdmin}, got ${isAuthorized}`);
          verificationErrors++;
        }
        
        if (isAdmin !== user.isAdmin) {
          console.log(`⚠️  Admin status mismatch for ${user.address}: expected admin=${user.isAdmin}, got ${isAdmin}`);
          verificationErrors++;
        }
      } catch (error) {
        console.log(`❌ Error verifying ${user.address}: ${error.message}`);
        verificationErrors++;
      }
    }
    
    if (verificationErrors === 0) {
      console.log("✅ Contract state verification passed!");
    } else {
      console.log(`⚠️  Found ${verificationErrors} verification issues`);
    }
    
    return {
      activeAdminUsers,
      activeRegularUsers,
      activeAnyUsers,
      revokedUsers,
      allUsers
    };
    
  } catch (error) {
    console.error("❌ Error getting all registered users:", error.message);
    console.log("💡 This may happen if there are too many events to process.");
    console.log("   Try using 'events' command for recent events only.");
    return null;
  }
}

// Main execution
async function main() {
  console.log("🚀 AuthRegistry Contract Checker");
  console.log("=" * 60);
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments - check all auth data
    await checkAuthData();
  } else if (args[0] === "address" && args[1]) {
    // Check specific address: node check-auth.js address 0x1234...
    await checkSpecificAddress(args[1]);
  } else if (args[0] === "simulate") {
    // Simulate operations: node check-auth.js simulate
    await simulateAuthOperations();
  } else if (args[0] === "events") {
    // Get recent events: node check-auth.js events
    await getRecentEvents();
  } else if (args[0] === "users" || args[0] === "all-users") {
    // Get all registered users: node check-auth.js users
    await getAllRegisteredUsers();
  } else {
    console.log("📖 Usage:");
    console.log("  node check-auth.js                    - Check all auth data");
    console.log("  node check-auth.js address <addr>     - Check specific address");
    console.log("  node check-auth.js simulate           - Simulate auth operations");
    console.log("  node check-auth.js events             - Get recent auth events");
    console.log("  node check-auth.js users              - Get all registered users");
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = {
  checkAuthData,
  checkSpecificAddress,
  simulateAuthOperations,
  getRecentEvents,
  getAllRegisteredUsers
};
