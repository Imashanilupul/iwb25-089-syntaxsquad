const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Proposals contract integration...");

  try {
    // Get signers
    const [deployer, user1, user2, user3] = await ethers.getSigners();
    console.log("Testing with accounts:");
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    console.log("User3:", user3.address);

    // Deploy a mock AuthRegistry for testing
    console.log("\n1. Deploying mock AuthRegistry...");
    const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = await AuthRegistry.deploy();
    await authRegistry.waitForDeployment();
    console.log("AuthRegistry deployed to:", await authRegistry.getAddress());

    // Register test users as authorized
    await authRegistry.connect(deployer).registerUser(deployer.address);
    await authRegistry.connect(deployer).registerUser(user1.address);
    await authRegistry.connect(deployer).registerUser(user2.address);
    console.log("Users registered as authorized");

    // Deploy Proposals contract
    console.log("\n2. Deploying Proposals contract...");
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = await Proposals.deploy(await authRegistry.getAddress());
    await proposals.waitForDeployment();
    console.log("Proposals deployed to:", await proposals.getAddress());

    // Test 1: Create a proposal
    console.log("\n3. Testing proposal creation...");
    const currentTime = Math.floor(Date.now() / 1000);
    const expiredDate = currentTime + (7 * 24 * 60 * 60); // 7 days from now
    
    const createTx = await proposals.connect(user1).createProposal(
      "QmTestTitleCID123",
      "QmTestShortDescCID456", 
      "QmTestDetailedDescCID789",
      1, // categoryId
      expiredDate
    );
    await createTx.wait();
    
    const proposalCount = await proposals.proposalCount();
    console.log("Proposal created! Total proposals:", proposalCount.toString());

    // Test 2: Get proposal details
    console.log("\n4. Testing proposal retrieval...");
    const proposal = await proposals.getProposal(1);
    console.log("Proposal details:");
    console.log("- Title CID:", proposal[0]);
    console.log("- Short Description CID:", proposal[1]);
    console.log("- Detailed Description CID:", proposal[2]);
    console.log("- YES Votes:", proposal[3].toString());
    console.log("- NO Votes:", proposal[4].toString());
    console.log("- Creator:", proposal[5]);
    console.log("- Active Status:", proposal[6]);
    console.log("- Category ID:", proposal[8].toString());

    // Test 3: Vote YES on proposal
    console.log("\n5. Testing YES voting...");
    const voteYesTx = await proposals.connect(user2).voteYes(1);
    await voteYesTx.wait();
    console.log("User2 voted YES");

    // Test 4: Vote NO on proposal  
    console.log("\n6. Testing NO voting...");
    const voteNoTx = await proposals.connect(deployer).voteNo(1);
    await voteNoTx.wait();
    console.log("Deployer voted NO");

    // Test 5: Get voting statistics
    console.log("\n7. Testing vote statistics...");
    const votes = await proposals.getProposalVotes(1);
    console.log("Voting statistics:");
    console.log("- YES Votes:", votes[0].toString());
    console.log("- NO Votes:", votes[1].toString());
    console.log("- Net Votes:", votes[2].toString());
    console.log("- Total Votes:", votes[3].toString());
    console.log("- YES Percentage:", votes[4].toString() + "%");

    // Test 6: Check user votes
    console.log("\n8. Testing user vote checking...");
    const user2Vote = await proposals.getUserVote(1, user2.address);
    console.log("User2 votes - YES:", user2Vote[0], "NO:", user2Vote[1]);
    
    const deployerVote = await proposals.getUserVote(1, deployer.address);
    console.log("Deployer votes - YES:", deployerVote[0], "NO:", deployerVote[1]);

    // Test 7: Test vote changing
    console.log("\n9. Testing vote changing...");
    const changeVoteTx = await proposals.connect(user2).voteNo(1);
    await changeVoteTx.wait();
    console.log("User2 changed vote from YES to NO");

    const votesAfterChange = await proposals.getProposalVotes(1);
    console.log("Updated voting statistics:");
    console.log("- YES Votes:", votesAfterChange[0].toString());
    console.log("- NO Votes:", votesAfterChange[1].toString());
    console.log("- YES Percentage:", votesAfterChange[4].toString() + "%");

    // Test 8: Test remove vote
    console.log("\n10. Testing vote removal...");
    const removeVoteTx = await proposals.connect(user2).removeVote(1);
    await removeVoteTx.wait();
    console.log("User2 removed their vote");

    const votesAfterRemoval = await proposals.getProposalVotes(1);
    console.log("Voting statistics after removal:");
    console.log("- YES Votes:", votesAfterRemoval[0].toString());
    console.log("- NO Votes:", votesAfterRemoval[1].toString());
    console.log("- Total Votes:", votesAfterRemoval[3].toString());

    // Test 9: Test proposals by user
    console.log("\n11. Testing proposals by user...");
    const user1Proposals = await proposals.getProposalsByUser(user1.address);
    console.log("Proposals created by User1:", user1Proposals.map(id => id.toString()));

    // Test 10: Test category filtering
    console.log("\n12. Testing category filtering...");
    const categoryProposals = await proposals.getActiveProposalsByCategory(1);
    console.log("Active proposals in category 1:", categoryProposals.map(id => id.toString()));

    // Test 11: Test proposal expiration
    console.log("\n13. Testing proposal expiration...");
    const isExpired = await proposals.isProposalExpired(1);
    console.log("Is proposal 1 expired?", isExpired);

    // Test 12: Test status change (only creator can do this)
    console.log("\n14. Testing status change...");
    const statusChangeTx = await proposals.connect(user1).changeProposalStatus(1, false);
    await statusChangeTx.wait();
    console.log("Proposal status changed to inactive");

    const updatedProposal = await proposals.getProposal(1);
    console.log("Updated active status:", updatedProposal[6]);

    // Test 13: Create another proposal to test multiple proposals
    console.log("\n15. Creating second proposal...");
    // Wait 1 day to avoid rate limiting (in real scenario)
    // For testing, we'll use a different user
    const createTx2 = await proposals.connect(user2).createProposal(
      "QmSecondProposalTitle",
      "QmSecondShortDesc",
      "QmSecondDetailedDesc",
      2, // different categoryId
      expiredDate
    );
    await createTx2.wait();

    const finalProposalCount = await proposals.proposalCount();
    console.log("Total proposals after second creation:", finalProposalCount.toString());

    // Test 14: Test expired proposals
    console.log("\n16. Testing expired proposals retrieval...");
    const expiredProposals = await proposals.getExpiredProposals();
    console.log("Expired proposals:", expiredProposals.map(id => id.toString()));

    console.log("\n✅ All tests completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
