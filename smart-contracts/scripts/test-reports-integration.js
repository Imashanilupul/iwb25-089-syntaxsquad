const hre = require("hardhat");

async function main() {
  // Replace these with your deployed contract addresses
  const AUTH_REGISTRY_ADDRESS = "YOUR_AUTH_REGISTRY_ADDRESS_HERE";
  const REPORTS_ADDRESS = "YOUR_REPORTS_ADDRESS_HERE";

  if (AUTH_REGISTRY_ADDRESS === "YOUR_AUTH_REGISTRY_ADDRESS_HERE" || 
      REPORTS_ADDRESS === "YOUR_REPORTS_ADDRESS_HERE") {
    console.log("⚠️  Please update contract addresses in the script");
    console.log("   Run 'npx hardhat run scripts/deploy-all-contracts.js' first");
    return;
  }

  const [owner, user1, user2, user3] = await hre.ethers.getSigners();

  // Get contract instances
  const AuthRegistry = await hre.ethers.getContractFactory("AuthRegistry");
  const authRegistry = AuthRegistry.attach(AUTH_REGISTRY_ADDRESS);

  const Reports = await hre.ethers.getContractFactory("Reports");
  const reports = Reports.attach(REPORTS_ADDRESS);

  console.log("Testing Reports Contract Integration");
  console.log("===================================");

  // Authorize users
  console.log("\n1. Authorizing users...");
  await authRegistry.connect(owner).authorizeUser(user1.address);
  await authRegistry.connect(owner).authorizeUser(user2.address);
  await authRegistry.connect(owner).authorizeUser(user3.address);
  console.log("✅ Users authorized");

  // Test 1: Create a report
  console.log("\n2. Creating a report...");
  try {
    const tx = await reports.connect(user1).createReport(
      "QmTitleCID123", 
      "QmDescriptionCID456", 
      "QmEvidenceCID789"
    );
    const receipt = await tx.wait();
    console.log("✅ Report created successfully");
    console.log("Transaction hash:", receipt.transactionHash);
    
    // Get the report ID from events
    const event = receipt.events?.find(e => e.event === 'ReportCreated');
    const reportId = event?.args?.reportId?.toString();
    console.log("Report ID:", reportId);
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 2: Get report details
  console.log("\n3. Getting report details...");
  try {
    const reportDetails = await reports.getReport(1);
    console.log("✅ Report Details:");
    console.log("  Title CID:", reportDetails.titleCid);
    console.log("  Description CID:", reportDetails.descriptionCid);
    console.log("  Evidence CID:", reportDetails.evidenceHashCid);
    console.log("  Creator:", reportDetails.creator);
    console.log("  Upvotes:", reportDetails.upvotes.toString());
    console.log("  Downvotes:", reportDetails.downvotes.toString());
    console.log("  Resolved:", reportDetails.resolved);
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 3: Upvote the report
  console.log("\n4. Upvoting report...");
  try {
    await reports.connect(user2).upvoteReport(1);
    console.log("✅ Report upvoted by user2");
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 4: Downvote the report
  console.log("\n5. Downvoting report...");
  try {
    await reports.connect(user3).downvoteReport(1);
    console.log("✅ Report downvoted by user3");
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 5: Check voting results
  console.log("\n6. Checking voting results...");
  try {
    const votes = await reports.getReportVotes(1);
    console.log("✅ Voting Results:");
    console.log("  Upvotes:", votes.upvotes.toString());
    console.log("  Downvotes:", votes.downvotes.toString());
    console.log("  Net Votes:", votes.netVotes.toString());
    console.log("  Total Votes:", votes.totalVotes.toString());
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 6: Assign report
  console.log("\n7. Assigning report...");
  try {
    await reports.connect(owner).assignReport(1, user2.address);
    console.log("✅ Report assigned to user2");
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 7: Resolve report
  console.log("\n8. Resolving report...");
  try {
    await reports.connect(user2).resolveReport(1);
    console.log("✅ Report resolved by assigned user");
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 8: Check final report status
  console.log("\n9. Final report status...");
  try {
    const finalReport = await reports.getReport(1);
    console.log("✅ Final Report Status:");
    console.log("  Resolved:", finalReport.resolved);
    console.log("  Assigned To:", finalReport.assignedTo);
    console.log("  Resolved At:", new Date(finalReport.resolvedAt * 1000).toISOString());
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 9: Try to vote on resolved report (should fail)
  console.log("\n10. Testing vote on resolved report (should fail)...");
  try {
    await reports.connect(user1).upvoteReport(1);
    console.log("❌ ERROR: Should not be able to vote on resolved report");
  } catch (error) {
    console.log("✅ SUCCESS: Cannot vote on resolved report:", error.reason);
  }

  console.log("\n===================================");
  console.log("Reports integration test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
