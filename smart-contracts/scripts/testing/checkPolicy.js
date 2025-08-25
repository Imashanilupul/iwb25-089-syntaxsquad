const { ethers } = require("hardhat");
const { getFromPinata } = require("../ipfs.js");
const fs = require('fs');
const path = require('path');

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  // From deployed-addresses.json
  sepolia: "0xeB575D4DC4C239E04A0dc09630f4E0A45d405Ced", // Will be updated after deployment
  // Add other networks as needed
};

function getContractAddress() {
  // Try to get from deployed-addresses.json first
  try {
    const deployedAddressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
    if (fs.existsSync(deployedAddressesPath)) {
      const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
      if (deployedAddresses.Policy) {
        console.log("📍 Using Policy contract from deployed-addresses.json");
        return deployedAddresses.Policy;
      }
    }
  } catch (error) {
    console.warn("Could not load from deployed-addresses.json:", error.message);
  }

  // Force Sepolia network - this script should only run on Sepolia
  const networkName = 'sepolia';
  
  console.log("🌐 Forcing Sepolia network usage");
  console.log("📍 Using Sepolia contract address");
  return CONTRACT_ADDRESSES.sepolia;
}

async function checkPoliciesData() {
  try {
    console.log("🏛️ Starting policies data check...");
    console.log("=" * 60);

    // Get the contract address
    const finalContractAddress = getContractAddress();
    if (!finalContractAddress || finalContractAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ Policy contract not deployed");
      console.log("💡 Please deploy the Policy contract first with:");
      console.log("   npx hardhat run --network sepolia scripts/deploy-policy.js");
      return;
    }
    
    console.log(`📍 Contract Address: ${finalContractAddress}`);
    
    // Get network info first
    const currentNetwork = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`);
    
    // Check network and ensure we're on Sepolia
    if (currentNetwork.chainId === 11155111n) {
      console.log("✅ Connected to Sepolia testnet");
    } else if (currentNetwork.chainId === 31337n) {
      console.log("❌ Connected to local Hardhat network");
      console.log("💡 This script requires Sepolia network. Run with: npx hardhat run --network sepolia scripts/checkPolicy.js");
      return;
    } else {
      console.log(`❌ Connected to unexpected network: ${currentNetwork.name}`);
      console.log("💡 This script requires Sepolia network. Run with: npx hardhat run --network sepolia scripts/checkPolicy.js");
      return;
    }
    
    // Get contract factory and attach to deployed contract
    const Policies = await ethers.getContractFactory("Policies");
    const policies = Policies.attach(finalContractAddress);
    
    // Connect with provider explicitly for read-only operations
    const connectedContract = policies.connect(ethers.provider);
    
    // Check if contract exists and is accessible
    console.log("🔗 Testing contract connection...");
    
    // Get policy count
    let policyCount;
    try {
      policyCount = await connectedContract.policyCount();
      console.log(`📊 Total Policies: ${policyCount.toString()}`);
    } catch (error) {
      console.error("❌ Error getting policy count:", error.message);
      console.log("💡 Possible issues:");
      console.log("   - Contract not deployed at this address on current network");
      console.log("   - Wrong network (make sure you're on Sepolia)");
      console.log("   - Contract ABI mismatch");
      console.log(`   - Current network: ${currentNetwork.name} (${currentNetwork.chainId})`);
      console.log("   - Try running with: npx hardhat run --network sepolia scripts/checkPolicy.js");
      
      // Try alternative approach using provider directly
      console.log("\n🔄 Trying alternative approach...");
      try {
        const code = await ethers.provider.getCode(finalContractAddress);
        if (code === '0x') {
          console.log("❌ No contract deployed at this address");
        } else {
          console.log("✅ Contract code exists, but interface mismatch");
        }
      } catch (codeError) {
        console.error("❌ Cannot access contract:", codeError.message);
      }
      return;
    }
    
    if (policyCount.toString() === "0") {
      console.log("📭 No policies found in the contract");
      console.log("💡 Try creating a policy first using the frontend or API");
      return;
    }
    
    console.log("\n" + "=" * 60);
    console.log("📋 POLICIES DETAILS:");
    console.log("=" * 60);
    
    // Loop through all policies and display their data
    for (let i = 1; i <= policyCount; i++) {
      try {
        console.log(`\n🏛️ POLICY #${i}:`);
        console.log("-" * 40);
        
        const policy = await connectedContract.getPolicy(i);
        
        console.log(`Name: ${policy.name}`);
        console.log(`Description CID: ${policy.descriptionCid}`);
        console.log(`Full Policy URL: ${policy.viewFullPolicy}`);
        console.log(`Ministry: ${policy.ministry}`);
        console.log(`Status: ${policy.status}`);
        console.log(`Creator: ${policy.creator}`);
        console.log(`Created At: ${new Date(Number(policy.createdAt) * 1000).toLocaleString()}`);
        console.log(`Effective Date: ${new Date(Number(policy.effectiveDate) * 1000).toLocaleString()}`);
        console.log(`Last Updated: ${new Date(Number(policy.lastUpdated) * 1000).toLocaleString()}`);
        console.log(`Support Count: ${policy.supportCount.toString()}`);
        console.log(`Is Active: ${policy.isActive}`);
        
        // Try to fetch IPFS content (only for description)
        try {
          console.log("\n� IPFS Content:");
          
          // Fetch description content from IPFS
          if (policy.descriptionCid) {
            try {
              const descContent = await getFromPinata(policy.descriptionCid);
              const descData = JSON.parse(descContent);
              console.log(`📄 Description: ${descData.content || 'Could not parse description'}`);
            } catch (ipfsError) {
              console.log(`📄 Description CID: ${policy.descriptionCid} (Content fetch failed)`);
            }
          }
          
        } catch (ipfsError) {
          console.log("⚠️  Could not fetch IPFS content:", ipfsError.message);
        }
        
      } catch (error) {
        console.error(`❌ Error getting policy #${i}:`, error.message);
      }
    }
    
    // Get policy statistics
    console.log("\n" + "=" * 60);
    console.log("📊 POLICY STATISTICS:");
    console.log("=" * 60);
    
    try {
      const stats = await connectedContract.getPolicyStatistics();
      console.log(`📈 Total Policies: ${stats.totalPolicies.toString()}`);
      console.log(`✅ Active Policies: ${stats.activePolicies.toString()}`);
      console.log(`📝 Draft Policies: ${stats.draftPolicies.toString()}`);
      console.log(`📂 Archived Policies: ${stats.archivedPolicies.toString()}`);
    } catch (error) {
      console.error("❌ Error getting statistics:", error.message);
    }
    
    // Get active policies
    console.log("\n📋 ACTIVE POLICIES:");
    console.log("-" * 30);
    try {
      const activePolicyIds = await connectedContract.getActivePolicies();
      if (activePolicyIds.length === 0) {
        console.log("📭 No active policies found");
      } else {
        console.log(`🟢 Active Policy IDs: ${activePolicyIds.map(id => id.toString()).join(', ')}`);
      }
    } catch (error) {
      console.error("❌ Error getting active policies:", error.message);
    }
    
    console.log("\n" + "=" * 60);
    console.log("📊 SUMMARY");
    console.log("=" * 60);
    console.log(`📈 Total Policies: ${policyCount.toString()}`);
    
    // Calculate summary statistics by iterating through policies
    let statusCounts = {};
    let ministryCounts = {};
    let totalSupports = 0;
    let activePoliciesCount = 0;
    
    for (let i = 1; i <= policyCount; i++) {
      try {
        const policy = await connectedContract.getPolicy(i);
        
        // Count by status
        statusCounts[policy.status] = (statusCounts[policy.status] || 0) + 1;
        
        // Count by ministry
        ministryCounts[policy.ministry] = (ministryCounts[policy.ministry] || 0) + 1;
        
        // Sum supports
        totalSupports += Number(policy.supportCount);
        
        // Count active policies
        if (policy.isActive) {
          activePoliciesCount++;
        }
        
      } catch (error) {
        console.error(`Error processing policy #${i} for summary:`, error.message);
      }
    }
    
    console.log(`👍 Total Supports: ${totalSupports}`);
    console.log(`🟢 Active Policies: ${activePoliciesCount}`);
    console.log(`📊 Policies by Status:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    
    console.log(`🏢 Policies by Ministry:`);
    Object.entries(ministryCounts).forEach(([ministry, count]) => {
      console.log(`   - ${ministry}: ${count}`);
    });
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get current block
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`🧱 Current Block: ${blockNumber}`);
    
    console.log("\n✅ Policies data check completed!");
    
  } catch (error) {
    console.error("❌ Error during policies check:", error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure the contract is deployed to the current network");
    console.log("2. Check that the contract address is correct");
    console.log("3. Ensure you're connected to the right network (Sepolia, etc.)");
    console.log("4. Verify the contract ABI matches the deployed contract");
  }
}

// Additional function to check a specific policy by ID
async function checkSpecificPolicy(policyId) {
  try {
    console.log(`🔍 Checking specific policy #${policyId}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Policies = await ethers.getContractFactory("Policies");
    const policies = await Policies.attach(finalContractAddress);
    
    const policy = await policies.getPolicy(policyId);
    
    console.log(`\n🏛️ POLICY #${policyId} DETAILS:`);
    console.log("-" * 40);
    console.log(`Name: ${policy.name}`);
    console.log(`Description CID: ${policy.descriptionCid}`);
    console.log(`Full Policy URL: ${policy.viewFullPolicy}`);
    console.log(`Ministry: ${policy.ministry}`);
    console.log(`Status: ${policy.status}`);
    console.log(`Creator: ${policy.creator}`);
    console.log(`Created At: ${new Date(Number(policy.createdAt) * 1000).toLocaleString()}`);
    console.log(`Effective Date: ${new Date(Number(policy.effectiveDate) * 1000).toLocaleString()}`);
    console.log(`Support Count: ${policy.supportCount.toString()}`);
    console.log(`Is Active: ${policy.isActive}`);
    
    return policy;
  } catch (error) {
    console.error(`❌ Error checking policy #${policyId}:`, error.message);
    return null;
  }
}

// Function to check if an address has supported a specific policy
async function checkUserSupport(policyId, address) {
  try {
    const finalContractAddress = getContractAddress();
    
    const Policies = await ethers.getContractFactory("Policies");
    const policies = await Policies.attach(finalContractAddress);
    
    const hasSupported = await policies.hasSupported(policyId, address);
    
    console.log(`👍 Address ${address} support status for policy #${policyId}: ${hasSupported}`);
    
    return hasSupported;
  } catch (error) {
    console.error(`❌ Error checking user support:`, error.message);
    return false;
  }
}

// Function to check policies by ministry
async function checkPoliciesByMinistry(ministry) {
  try {
    console.log(`🔍 Checking policies by ministry: ${ministry}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Policies = await ethers.getContractFactory("Policies");
    const policies = await Policies.attach(finalContractAddress);
    
    const policyIds = await policies.getPoliciesByMinistry(ministry);
    
    console.log(`🏢 Policies by ${ministry}:`);
    console.log(`📊 Total: ${policyIds.length}`);
    
    for (let i = 0; i < policyIds.length; i++) {
      console.log(`   - Policy #${policyIds[i].toString()}`);
    }
    
    return policyIds.map(id => id.toString());
  } catch (error) {
    console.error(`❌ Error checking policies by ministry:`, error.message);
    return [];
  }
}

// Function to check policies by user
async function checkPoliciesByUser(userAddress) {
  try {
    console.log(`🔍 Checking policies created by ${userAddress}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Policies = await ethers.getContractFactory("Policies");
    const policies = await Policies.attach(finalContractAddress);
    
    const policyIds = await policies.getPoliciesByUser(userAddress);
    
    console.log(`📋 Policies created by ${userAddress}:`);
    console.log(`📊 Total: ${policyIds.length}`);
    
    for (let i = 0; i < policyIds.length; i++) {
      console.log(`   - Policy #${policyIds[i].toString()}`);
    }
    
    return policyIds.map(id => id.toString());
  } catch (error) {
    console.error(`❌ Error checking policies by user:`, error.message);
    return [];
  }
}

// Main execution
async function main() {
  console.log("🚀 Policy Contract Data Checker");
  console.log("=" * 60);
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments - check all policies
    await checkPoliciesData();
  } else if (args[0] === "policy" && args[1]) {
    // Check specific policy
    await checkSpecificPolicy(args[1]);
  } else if (args[0] === "ministry" && args[1]) {
    // Check policies by ministry
    await checkPoliciesByMinistry(args[1]);
  } else if (args[0] === "user" && args[1]) {
    // Check policies by user
    await checkPoliciesByUser(args[1]);
  } else if (args[0] === "support" && args[1] && args[2]) {
    // Check user support for policy
    await checkUserSupport(args[1], args[2]);
  } else {
    console.log("📖 Usage:");
    console.log("  npx hardhat run --network sepolia scripts/checkPolicy.js                    # Check all policies");
    console.log("  npx hardhat run --network sepolia scripts/checkPolicy.js policy <id>       # Check specific policy");
    console.log("  npx hardhat run --network sepolia scripts/checkPolicy.js ministry <name>   # Check policies by ministry");
    console.log("  npx hardhat run --network sepolia scripts/checkPolicy.js user <address>    # Check policies by user");
    console.log("  npx hardhat run --network sepolia scripts/checkPolicy.js support <id> <addr> # Check user support");
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
  checkPoliciesData,
  checkSpecificPolicy,
  checkUserSupport,
  checkPoliciesByMinistry,
  checkPoliciesByUser
};
