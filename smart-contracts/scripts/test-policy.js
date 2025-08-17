const { ethers } = require("hardhat");
const {
  createPolicy,
  getPolicy,
  supportPolicy,
  updatePolicyStatus,
  getPoliciesByMinistry,
  getPolicyStatistics
} = require("./policy.js");

async function main() {
  console.log("🧪 Policy Contract Test Suite");
  console.log("=" * 60);

  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Get signer info
    const [signer] = await ethers.getSigners();
    console.log(`👤 Test account: ${signer.address}`);
    
    const balance = await ethers.provider.getBalance(signer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    console.log("\n📋 Test 1: Creating a test policy...");
    console.log("-" * 40);

    // Test policy creation
    const testPolicyData = {
      name: "Digital Sri Lanka Strategy 2030",
      description: "A comprehensive policy framework for digital transformation of Sri Lanka, focusing on e-governance, digital literacy, and technological innovation across all sectors including healthcare, education, agriculture, and financial services.",
      viewFullPolicy: "https://digital.gov.lk/policy/digital-sri-lanka-2030.pdf",
      ministry: "Ministry of Technology",
      effectiveDate: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
    };

    const createResult = await createPolicy(testPolicyData);
    console.log("✅ Policy created successfully!");
    console.log("🆔 Policy ID:", createResult.policyId);
    console.log("📝 Transaction:", createResult.transactionHash);

    const policyId = createResult.policyId;

    console.log("\n📋 Test 2: Retrieving policy details...");
    console.log("-" * 40);

    const policyDetails = await getPolicy(policyId);
    console.log("✅ Policy details retrieved successfully!");

    console.log("\n📋 Test 3: Getting policy statistics...");
    console.log("-" * 40);

    const statistics = await getPolicyStatistics();
    console.log("✅ Statistics retrieved successfully!");

    console.log("\n📋 Test 4: Getting policies by ministry...");
    console.log("-" * 40);

    const ministryPolicies = await getPoliciesByMinistry("Ministry of Technology");
    console.log("✅ Ministry policies retrieved successfully!");
    console.log(`📊 Found ${ministryPolicies.length} policies for Ministry of Technology`);

    console.log("\n📋 Test 5: Supporting the policy...");
    console.log("-" * 40);

    try {
      const supportResult = await supportPolicy(policyId);
      console.log("✅ Policy support recorded successfully!");
      console.log("📝 Transaction:", supportResult.transactionHash);
    } catch (error) {
      if (error.message.includes("Cannot support your own policy")) {
        console.log("⚠️  Cannot support own policy (expected behavior)");
      } else if (error.message.includes("already supported")) {
        console.log("⚠️  Policy already supported (expected if run multiple times)");
      } else {
        console.log("❌ Support failed:", error.message);
      }
    }

    console.log("\n📋 Test 6: Updating policy status...");
    console.log("-" * 40);

    try {
      const updateResult = await updatePolicyStatus(policyId, "UNDER_REVIEW", 0);
      console.log("✅ Policy status updated successfully!");
      console.log("📝 Transaction:", updateResult.transactionHash);
    } catch (error) {
      console.log("❌ Status update failed:", error.message);
    }

    console.log("\n📋 Test 7: Final policy check...");
    console.log("-" * 40);

    const finalPolicyDetails = await getPolicy(policyId);
    console.log("✅ Final policy state retrieved!");

    // Summary
    console.log("\n" + "=" * 60);
    console.log("🎉 TEST SUITE COMPLETED!");
    console.log("=" * 60);
    console.log(`📄 Policy ID: ${policyId}`);
    console.log(`🏢 Ministry: ${finalPolicyDetails.ministry}`);
    console.log(`📊 Status: ${finalPolicyDetails.status}`);
    console.log(`👍 Support Count: ${finalPolicyDetails.supportCount}`);
    console.log(`🟢 Is Active: ${finalPolicyDetails.isActive}`);
    console.log(`🌐 Network: ${network.name}`);
    console.log("=" * 60);

    console.log("\n💡 Next steps:");
    console.log("1. Check all policies: npx hardhat run --network sepolia scripts/checkPolicy.js");
    console.log("2. View specific policy: npx hardhat run --network sepolia scripts/checkPolicy.js policy " + policyId);
    console.log("3. Integration with frontend for user interactions");

  } catch (error) {
    console.error("💥 Test suite failed:", error);
    
    if (error.message.includes('insufficient funds')) {
      console.log("\n💡 Troubleshooting:");
      console.log("- Get test ETH from Sepolia faucet");
      console.log("- Check your wallet balance");
    } else if (error.message.includes('User not authorized')) {
      console.log("\n💡 Troubleshooting:");
      console.log("- Make sure your address is authorized in the AuthRegistry");
      console.log("- Register your wallet first");
    } else if (error.message.includes('You can only create one policy per day')) {
      console.log("\n💡 Troubleshooting:");
      console.log("- This address has already created a policy today");
      console.log("- Try again tomorrow or use a different address");
    }
    
    throw error;
  }
}

// Handle direct script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 Script execution failed:", error);
      process.exit(1);
    });
}

module.exports = { main };
