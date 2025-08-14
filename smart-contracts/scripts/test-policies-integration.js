const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Policies Integration...");

  // Contract addresses (replace with actual deployed addresses)
  const authRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const policiesAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Get contract instances
  const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
  const authRegistry = AuthRegistry.attach(authRegistryAddress);

  const Policies = await ethers.getContractFactory("Policies");
  const policies = Policies.attach(policiesAddress);

  // Get signers
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  console.log("User3:", user3.address);

  try {
    // Authorize users
    console.log("\n=== Authorizing Users ===");
    await authRegistry.authorizeUser(user1.address);
    await authRegistry.authorizeUser(user2.address);
    await authRegistry.authorizeUser(user3.address);
    console.log("✅ All users authorized");

    // Test policy creation
    console.log("\n=== Creating Policies ===");
    const futureDate1 = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
    const futureDate2 = Math.floor(Date.now() / 1000) + 172800; // 2 days from now

    // User1 creates a policy
    const policy1Tx = await policies.connect(user1).createPolicy(
      "Digital Privacy Protection Act",
      "QmPolicyDesc1", // Mock IPFS CID
      "QmPolicyFull1", // Mock IPFS CID
      "Ministry of Technology",
      futureDate1
    );
    await policy1Tx.wait();
    console.log("✅ Policy 1 created by User1");

    // User2 creates a policy
    const policy2Tx = await policies.connect(user2).createPolicy(
      "Environmental Protection Standards",
      "QmPolicyDesc2",
      "QmPolicyFull2",
      "Ministry of Environment",
      futureDate2
    );
    await policy2Tx.wait();
    console.log("✅ Policy 2 created by User2");

    // Check policy count
    const policyCount = await policies.policyCount();
    console.log("Total policies created:", policyCount.toString());

    // Test policy retrieval
    console.log("\n=== Testing Policy Retrieval ===");
    const policy1 = await policies.getPolicy(1);
    console.log("Policy 1 details:");
    console.log("  Name:", policy1[0]);
    console.log("  Ministry:", policy1[3]);
    console.log("  Status:", policy1[4]); // Should be 0 (DRAFT)
    console.log("  Creator:", policy1[6]);
    console.log("  Endorsements:", policy1[9].toString());

    // Test status update
    console.log("\n=== Testing Status Updates ===");
    // User1 updates their policy to REVIEW status
    await policies.connect(user1).updatePolicyStatus(1, 1); // 1 = REVIEW
    console.log("✅ Policy 1 status updated to REVIEW");

    // Update to APPROVED
    await policies.connect(user1).updatePolicyStatus(1, 2); // 2 = APPROVED
    console.log("✅ Policy 1 status updated to APPROVED");

    // Test endorsements
    console.log("\n=== Testing Endorsements ===");
    // User2 endorses Policy 1
    await policies.connect(user2).endorsePolicy(1);
    console.log("✅ User2 endorsed Policy 1");

    // User3 endorses Policy 1
    await policies.connect(user3).endorsePolicy(1);
    console.log("✅ User3 endorsed Policy 1");

    // Check endorsement count
    const updatedPolicy1 = await policies.getPolicy(1);
    console.log("Policy 1 endorsements:", updatedPolicy1[9].toString());

    // Test endorsement check
    const user2Endorsed = await policies.hasUserEndorsed(1, user2.address);
    console.log("User2 has endorsed Policy 1:", user2Endorsed);

    // Test content update (should fail for non-DRAFT status)
    console.log("\n=== Testing Content Update Restrictions ===");
    try {
      await policies.connect(user1).updatePolicyContent(
        1,
        "QmNewDesc",
        "QmNewFull",
        "New Ministry",
        futureDate1 + 1000
      );
      console.log("❌ Content update should have failed for non-DRAFT policy");
    } catch (error) {
      console.log("✅ Content update correctly blocked for non-DRAFT policy");
    }

    // Test filtering functions
    console.log("\n=== Testing Filter Functions ===");
    
    // Get policies by user
    const user1Policies = await policies.getPoliciesByUser(user1.address);
    console.log("User1 policies:", user1Policies.map(id => id.toString()));

    // Get policies by status
    const approvedPolicies = await policies.getPoliciesByStatus(2); // APPROVED
    console.log("Approved policies:", approvedPolicies.map(id => id.toString()));

    // Get policies by ministry
    const techPolicies = await policies.getPoliciesByMinistry("Ministry of Technology");
    console.log("Ministry of Technology policies:", techPolicies.map(id => id.toString()));

    // Test name existence check
    const nameExists = await policies.policyNameExists("Digital Privacy Protection Act");
    console.log("Policy name exists:", nameExists);

    // Test removing endorsement
    console.log("\n=== Testing Endorsement Removal ===");
    await policies.connect(user2).removeEndorsement(1);
    console.log("✅ User2 removed endorsement from Policy 1");

    const finalPolicy1 = await policies.getPolicy(1);
    console.log("Final Policy 1 endorsements:", finalPolicy1[9].toString());

    // Test activating policy
    console.log("\n=== Testing Policy Activation ===");
    await policies.connect(user1).updatePolicyStatus(1, 3); // 3 = ACTIVE
    console.log("✅ Policy 1 activated");

    // Test trying to endorse active policy (should still work)
    await policies.connect(user2).endorsePolicy(1);
    console.log("✅ User2 endorsed active policy");

    console.log("\n🎉 All Policies tests passed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { main };
