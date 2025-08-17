const { ethers } = require("hardhat");
const { storeOnPinata } = require("./ipfs.js");
const fs = require('fs');
const path = require('path');

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  sepolia: "0x0000000000000000000000000000000000000000", // Will be updated after deployment
  localhost: "0x0000000000000000000000000000000000000000",
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

/**
 * Create a new policy on the blockchain
 */
async function createPolicy({
  name,
  description,
  viewFullPolicy,
  ministry,
  effectiveDate = 0 // Default to 0 if not specified
}) {
  try {
    console.log("🏛️ Creating new policy on blockchain...");
    console.log("📋 Policy details:", { name, ministry, effectiveDate });

    const contractAddress = getContractAddress();
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("Policy contract not deployed. Please deploy first with: npx hardhat run scripts/deploy-policy.js --network sepolia");
    }

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("👤 Using account:", signer.address);

    // Store description on IPFS (only description)
    console.log("📦 Storing description on IPFS...");
    
    const descriptionCid = await storeOnPinata(JSON.stringify({
      type: "policy_description", 
      content: description,
      timestamp: Date.now()
    }), `policy_description_${Date.now()}.json`);
    console.log("📄 Description CID:", descriptionCid);

    // Connect to contract
    const Policy = await ethers.getContractFactory("Policies");
    const policy = Policy.attach(contractAddress);

    // Convert effectiveDate to timestamp if it's a date string
    let effectiveTimestamp = effectiveDate;
    if (typeof effectiveDate === 'string' && effectiveDate) {
      effectiveTimestamp = Math.floor(new Date(effectiveDate).getTime() / 1000);
    } else if (effectiveDate === 0) {
      effectiveTimestamp = Math.floor(Date.now() / 1000); // Default to now
    }

    console.log("⏳ Submitting policy to blockchain...");
    const tx = await policy.createPolicy(
      name,                    // name (stored directly as string)
      descriptionCid,          // descriptionCid (IPFS CID)
      viewFullPolicy,          // viewFullPolicy (stored directly as string)
      ministry,                // ministry (stored directly as string)
      effectiveTimestamp
    );

    console.log("📝 Transaction submitted:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Extract policy ID from events
    const policyCreatedEvent = receipt.logs.find(
      log => {
        try {
          const decoded = policy.interface.parseLog(log);
          return decoded && decoded.name === 'PolicyCreated';
        } catch {
          return false;
        }
      }
    );

    let policyId;
    if (policyCreatedEvent) {
      const decoded = policy.interface.parseLog(policyCreatedEvent);
      policyId = decoded.args.policyId.toString();
      console.log("🆔 Policy ID:", policyId);
    } else {
      // Fallback: get current policy count
      policyId = await policy.policyCount();
      console.log("🆔 Policy ID (from count):", policyId.toString());
    }

    return {
      success: true,
      policyId: policyId.toString(),
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      contractAddress,
      ipfs: {
        descriptionCid
      }
    };

  } catch (error) {
    console.error("❌ Failed to create policy:", error.message);
    throw error;
  }
}

/**
 * Get policy details from blockchain
 */
async function getPolicy(policyId) {
  try {
    console.log(`🔍 Fetching policy #${policyId}...`);

    const contractAddress = getContractAddress();
    const Policy = await ethers.getContractFactory("Policies");
    const policy = Policy.attach(contractAddress);

    const policyData = await policy.getPolicy(policyId);
    
    console.log(`📋 Policy #${policyId} details:`);
    console.log("- Name:", policyData.name);
    console.log("- Description CID:", policyData.descriptionCid);
    console.log("- Full Policy URL:", policyData.viewFullPolicy);
    console.log("- Ministry:", policyData.ministry);
    console.log("- Status:", policyData.status);
    console.log("- Creator:", policyData.creator);
    console.log("- Created At:", new Date(Number(policyData.createdAt) * 1000).toLocaleString());
    console.log("- Effective Date:", new Date(Number(policyData.effectiveDate) * 1000).toLocaleString());
    console.log("- Support Count:", policyData.supportCount.toString());
    console.log("- Is Active:", policyData.isActive);

    return {
      id: policyId,
      name: policyData.name,
      descriptionCid: policyData.descriptionCid,
      viewFullPolicy: policyData.viewFullPolicy,
      ministry: policyData.ministry,
      status: policyData.status,
      creator: policyData.creator,
      createdAt: Number(policyData.createdAt),
      effectiveDate: Number(policyData.effectiveDate),
      lastUpdated: Number(policyData.lastUpdated),
      supportCount: Number(policyData.supportCount),
      isActive: policyData.isActive
    };

  } catch (error) {
    console.error(`❌ Failed to get policy #${policyId}:`, error.message);
    throw error;
  }
}

/**
 * Support a policy
 */
async function supportPolicy(policyId) {
  try {
    console.log(`👍 Supporting policy #${policyId}...`);

    const contractAddress = getContractAddress();
    const [signer] = await ethers.getSigners();
    
    const Policy = await ethers.getContractFactory("Policies");
    const policy = Policy.attach(contractAddress);

    console.log("⏳ Submitting support transaction...");
    const tx = await policy.supportPolicy(policyId);
    
    console.log("📝 Transaction submitted:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Support recorded in block:", receipt.blockNumber);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };

  } catch (error) {
    console.error(`❌ Failed to support policy #${policyId}:`, error.message);
    throw error;
  }
}

/**
 * Update policy status (only creator)
 */
async function updatePolicyStatus(policyId, newStatus, newEffectiveDate = 0) {
  try {
    console.log(`📝 Updating policy #${policyId} status to: ${newStatus}`);

    const contractAddress = getContractAddress();
    const [signer] = await ethers.getSigners();
    
    const Policy = await ethers.getContractFactory("Policies");
    const policy = Policy.attach(contractAddress);

    let effectiveTimestamp = newEffectiveDate;
    if (typeof newEffectiveDate === 'string' && newEffectiveDate) {
      effectiveTimestamp = Math.floor(new Date(newEffectiveDate).getTime() / 1000);
    }

    console.log("⏳ Submitting status update...");
    const tx = await policy.updatePolicyStatus(policyId, newStatus, effectiveTimestamp);
    
    console.log("📝 Transaction submitted:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Status updated in block:", receipt.blockNumber);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };

  } catch (error) {
    console.error(`❌ Failed to update policy #${policyId}:`, error.message);
    throw error;
  }
}

/**
 * Get policies by ministry
 */
async function getPoliciesByMinistry(ministry) {
  try {
    console.log(`🔍 Fetching policies for ministry: ${ministry}`);

    const contractAddress = getContractAddress();
    const Policy = await ethers.getContractFactory("Policies");
    const policy = Policy.attach(contractAddress);

    const policyIds = await policy.getPoliciesByMinistry(ministry);
    console.log(`📋 Found ${policyIds.length} policies for ${ministry}`);

    return policyIds.map(id => id.toString());

  } catch (error) {
    console.error(`❌ Failed to get policies for ministry ${ministry}:`, error.message);
    throw error;
  }
}

/**
 * Get policies by status
 */
async function getPoliciesByStatus(status) {
  try {
    console.log(`🔍 Fetching policies with status: ${status}`);

    const contractAddress = getContractAddress();
    const Policy = await ethers.getContractFactory("Policies");
    const policy = Policy.attach(contractAddress);

    const policyIds = await policy.getPoliciesByStatus(status);
    console.log(`📋 Found ${policyIds.length} policies with status ${status}`);

    return policyIds.map(id => id.toString());

  } catch (error) {
    console.error(`❌ Failed to get policies with status ${status}:`, error.message);
    throw error;
  }
}

/**
 * Get policies created by user
 */
async function getPoliciesByUser(userAddress) {
  try {
    console.log(`🔍 Fetching policies created by: ${userAddress}`);

    const contractAddress = getContractAddress();
    const Policy = await ethers.getContractFactory("Policies");
    const policy = Policy.attach(contractAddress);

    const policyIds = await policy.getPoliciesByUser(userAddress);
    console.log(`📋 Found ${policyIds.length} policies created by ${userAddress}`);

    return policyIds.map(id => id.toString());

  } catch (error) {
    console.error(`❌ Failed to get policies for user ${userAddress}:`, error.message);
    throw error;
  }
}

/**
 * Get active policies
 */
async function getActivePolicies() {
  try {
    console.log("🔍 Fetching active policies...");

    const contractAddress = getContractAddress();
    const Policy = await ethers.getContractFactory("Policies");
    const policy = Policy.attach(contractAddress);

    const policyIds = await policy.getActivePolicies();
    console.log(`📋 Found ${policyIds.length} active policies`);

    return policyIds.map(id => id.toString());

  } catch (error) {
    console.error("❌ Failed to get active policies:", error.message);
    throw error;
  }
}

/**
 * Get policy statistics
 */
async function getPolicyStatistics() {
  try {
    console.log("📊 Fetching policy statistics...");

    const contractAddress = getContractAddress();
    const Policy = await ethers.getContractFactory("Policies");
    const policy = Policy.attach(contractAddress);

    const stats = await policy.getPolicyStatistics();
    
    const statistics = {
      totalPolicies: Number(stats.totalPolicies),
      activePolicies: Number(stats.activePolicies),
      draftPolicies: Number(stats.draftPolicies),
      archivedPolicies: Number(stats.archivedPolicies)
    };

    console.log("📊 Policy Statistics:");
    console.log(`- Total Policies: ${statistics.totalPolicies}`);
    console.log(`- Active Policies: ${statistics.activePolicies}`);
    console.log(`- Draft Policies: ${statistics.draftPolicies}`);
    console.log(`- Archived Policies: ${statistics.archivedPolicies}`);

    return statistics;

  } catch (error) {
    console.error("❌ Failed to get policy statistics:", error.message);
    throw error;
  }
}

// Export functions
module.exports = {
  createPolicy,
  getPolicy,
  supportPolicy,
  updatePolicyStatus,
  getPoliciesByMinistry,
  getPoliciesByStatus,
  getPoliciesByUser,
  getActivePolicies,
  getPolicyStatistics,
  getContractAddress
};
