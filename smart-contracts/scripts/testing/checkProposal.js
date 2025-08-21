const { ethers } = require("hardhat");
const { getFromPinata } = require("../ipfs.js");
const fs = require('fs');
const path = require('path');

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  // From deployed-addresses.json
  sepolia: "0xff40F4C374c1038378c7044720B939a2a0219a2f", // Will be updated after deployment
  // Add other networks as needed
};

function getContractAddress() {
  // Try to get from deployed-addresses.json first
  try {
    const deployedAddressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
    if (fs.existsSync(deployedAddressesPath)) {
      const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
      if (deployedAddresses.Proposals) {
        console.log("📍 Using Proposals contract from deployed-addresses.json");
        return deployedAddresses.Proposals;
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

async function checkProposalsData() {
  try {
    console.log("🗳️ Starting proposals data check...");
    console.log("=" * 60);

    // Get the contract address
    const finalContractAddress = getContractAddress();
    if (!finalContractAddress || finalContractAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ Proposals contract not deployed");
      console.log("💡 Please deploy the Proposals contract first with:");
      console.log("   npx hardhat run --network sepolia scripts/deploy-proposals.js");
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
      console.log("💡 This script requires Sepolia network. Run with: npx hardhat run --network sepolia scripts/checkProposal.js");
      return;
    } else {
      console.log(`❌ Connected to unexpected network: ${currentNetwork.name}`);
      console.log("💡 This script requires Sepolia network. Run with: npx hardhat run --network sepolia scripts/checkProposal.js");
      return;
    }
    
    // Get contract factory and attach to deployed contract
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = Proposals.attach(finalContractAddress);
    
    // Connect with provider explicitly for read-only operations
    const connectedContract = proposals.connect(ethers.provider);
    
    // Check if contract exists and is accessible
    console.log("🔗 Testing contract connection...");
    
    // Get proposal count
    let proposalCount;
    try {
      proposalCount = await connectedContract.proposalCount();
      console.log(`📊 Total Proposals: ${proposalCount.toString()}`);
    } catch (error) {
      console.error("❌ Error getting proposal count:", error.message);
      console.log("💡 Possible issues:");
      console.log("   - Contract not deployed at this address on current network");
      console.log("   - Wrong network (make sure you're on Sepolia)");
      console.log("   - Contract ABI mismatch");
      console.log(`   - Current network: ${currentNetwork.name} (${currentNetwork.chainId})`);
      console.log("   - Try running with: npx hardhat run --network sepolia scripts/checkProposal.js");
      
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
    
    if (proposalCount.toString() === "0") {
      console.log("📭 No proposals found in the contract");
      console.log("💡 Try creating a proposal first using the frontend or API");
      return;
    }
    
    console.log("\n" + "=" * 60);
    console.log("🗳️ PROPOSALS DETAILS:");
    console.log("=" * 60);
    
    // Loop through all proposals and display their data
    for (let i = 1; i <= proposalCount; i++) {
      try {
        console.log(`\n📝 PROPOSAL #${i}:`);
        console.log("-" * 40);
        
        const proposal = await connectedContract.getProposal(i);
        
        console.log(`Title CID: ${proposal.titleCid}`);
        console.log(`Short Description CID: ${proposal.shortDescriptionCid}`);
        console.log(`Description Details CID: ${proposal.descriptionInDetailsCid}`);
        console.log(`Yes Votes: ${proposal.yesVotes.toString()}`);
        console.log(`No Votes: ${proposal.noVotes.toString()}`);
        console.log(`Creator: ${proposal.creator}`);
        console.log(`Active Status: ${proposal.activeStatus}`);
        console.log(`Expired Date: ${new Date(Number(proposal.expiredDate) * 1000).toLocaleString()}`);
        console.log(`Category ID: ${proposal.categoryId.toString()}`);
        console.log(`Created At: ${new Date(Number(proposal.createdAt) * 1000).toLocaleString()}`);
        console.log(`Updated At: ${new Date(Number(proposal.updatedAt) * 1000).toLocaleString()}`);
        
        // Calculate total votes and percentages
        const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
        const yesPercentage = totalVotes > 0 ? ((Number(proposal.yesVotes) / totalVotes) * 100).toFixed(2) : "0.00";
        const noPercentage = totalVotes > 0 ? ((Number(proposal.noVotes) / totalVotes) * 100).toFixed(2) : "0.00";
        
        console.log(`Total Votes: ${totalVotes}`);
        console.log(`Yes Percentage: ${yesPercentage}%`);
        console.log(`No Percentage: ${noPercentage}%`);
        
        // Check if expired with detailed debugging
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const expiredTimestamp = Number(proposal.expiredDate);
        const isExpired = currentTimestamp >= expiredTimestamp;
        const timeUntilExpiry = expiredTimestamp - currentTimestamp;
        
        console.log(`Current Timestamp: ${currentTimestamp} (${new Date(currentTimestamp * 1000).toLocaleString()})`);
        console.log(`Expired Timestamp: ${expiredTimestamp} (${new Date(expiredTimestamp * 1000).toLocaleString()})`);
        console.log(`Time Until Expiry: ${timeUntilExpiry} seconds (${Math.round(timeUntilExpiry / 3600 * 100) / 100} hours)`);
        console.log(`Is Expired: ${isExpired}`);
        console.log(`Can Vote (Active && Not Expired): ${proposal.activeStatus && !isExpired}`);
        
        // Additional blockchain timestamp check
        try {
          const currentBlock = await ethers.provider.getBlock('latest');
          const blockTimestamp = currentBlock.timestamp;
          const blockExpiredCheck = blockTimestamp >= expiredTimestamp;
          console.log(`Blockchain Timestamp: ${blockTimestamp} (${new Date(blockTimestamp * 1000).toLocaleString()})`);
          console.log(`Blockchain Says Expired: ${blockExpiredCheck}`);
          console.log(`Time Diff (Blockchain vs Local): ${blockTimestamp - currentTimestamp} seconds`);
        } catch (blockError) {
          console.log("Could not get current block timestamp:", blockError.message);
        }
        
        // Try to fetch IPFS content
        try {
          console.log("\n📄 IPFS Content:");
          
          // Fetch title content from IPFS
          if (proposal.titleCid) {
            try {
              const titleContent = await getFromPinata(proposal.titleCid);
              console.log(`📋 Title: ${titleContent}`);
            } catch (ipfsError) {
              console.log(`📋 Title CID: ${proposal.titleCid} (Content fetch failed)`);
            }
          }
          
          // Fetch short description content from IPFS
          if (proposal.shortDescriptionCid) {
            try {
              const shortDescContent = await getFromPinata(proposal.shortDescriptionCid);
              console.log(`📄 Short Description: ${shortDescContent}`);
            } catch (ipfsError) {
              console.log(`📄 Short Description CID: ${proposal.shortDescriptionCid} (Content fetch failed)`);
            }
          }
          
          // Fetch detailed description content from IPFS (truncated for readability)
          if (proposal.descriptionInDetailsCid) {
            try {
              const detailsContent = await getFromPinata(proposal.descriptionInDetailsCid);
              const truncatedDetails = detailsContent.length > 200 
                ? detailsContent.substring(0, 200) + "..." 
                : detailsContent;
              console.log(`📝 Detailed Description: ${truncatedDetails}`);
            } catch (ipfsError) {
              console.log(`📝 Details CID: ${proposal.descriptionInDetailsCid} (Content fetch failed)`);
            }
          }
          
        } catch (ipfsError) {
          console.log("⚠️  Could not fetch IPFS content:", ipfsError.message);
        }
        
      } catch (error) {
        console.error(`❌ Error getting proposal #${i}:`, error.message);
      }
    }
    
    // Get proposal statistics
    console.log("\n" + "=" * 60);
    console.log("📊 PROPOSAL STATISTICS:");
    console.log("=" * 60);
    
    try {
      // Calculate statistics by iterating through proposals
      let activeCount = 0;
      let expiredCount = 0;
      let totalYesVotes = 0;
      let totalNoVotes = 0;
      let categoryCounts = {};
      let creatorCounts = {};
      
      for (let i = 1; i <= proposalCount; i++) {
        try {
          const proposal = await connectedContract.getProposal(i);
          
          // Count active vs expired
          if (proposal.activeStatus && Date.now() / 1000 <= Number(proposal.expiredDate)) {
            activeCount++;
          } else {
            expiredCount++;
          }
          
          // Sum votes
          totalYesVotes += Number(proposal.yesVotes);
          totalNoVotes += Number(proposal.noVotes);
          
          // Count by category
          const categoryId = proposal.categoryId.toString();
          categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
          
          // Count by creator
          creatorCounts[proposal.creator] = (creatorCounts[proposal.creator] || 0) + 1;
          
        } catch (error) {
          console.error(`Error processing proposal #${i} for statistics:`, error.message);
        }
      }
      
      console.log(`📈 Total Proposals: ${proposalCount.toString()}`);
      console.log(`✅ Active Proposals: ${activeCount}`);
      console.log(`⏰ Expired/Inactive Proposals: ${expiredCount}`);
      console.log(`👍 Total Yes Votes: ${totalYesVotes}`);
      console.log(`👎 Total No Votes: ${totalNoVotes}`);
      console.log(`🗳️ Total Votes Cast: ${totalYesVotes + totalNoVotes}`);
      
      const totalVotes = totalYesVotes + totalNoVotes;
      if (totalVotes > 0) {
        const overallYesPercentage = ((totalYesVotes / totalVotes) * 100).toFixed(2);
        const overallNoPercentage = ((totalNoVotes / totalVotes) * 100).toFixed(2);
        console.log(`📊 Overall Yes Percentage: ${overallYesPercentage}%`);
        console.log(`📊 Overall No Percentage: ${overallNoPercentage}%`);
      }
      
      console.log(`📂 Proposals by Category:`);
      Object.entries(categoryCounts).forEach(([categoryId, count]) => {
        console.log(`   - Category ${categoryId}: ${count}`);
      });
      
      console.log(`👤 Top Proposal Creators:`);
      const sortedCreators = Object.entries(creatorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      sortedCreators.forEach(([creator, count]) => {
        console.log(`   - ${creator}: ${count} proposals`);
      });
      
    } catch (error) {
      console.error("❌ Error calculating statistics:", error.message);
    }
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get current block
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`🧱 Current Block: ${blockNumber}`);
    
    console.log("\n✅ Proposals data check completed!");
    
  } catch (error) {
    console.error("❌ Error during proposals check:", error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure the contract is deployed to the current network");
    console.log("2. Check that the contract address is correct");
    console.log("3. Ensure you're connected to the right network (Sepolia, etc.)");
    console.log("4. Verify the contract ABI matches the deployed contract");
  }
}

// Additional function to check a specific proposal by ID
async function checkSpecificProposal(proposalId) {
  try {
    console.log(`🔍 Checking specific proposal #${proposalId}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = await Proposals.attach(finalContractAddress);
    
    const proposal = await proposals.getProposal(proposalId);
    
    console.log(`\n📝 PROPOSAL #${proposalId} DETAILS:`);
    console.log("-" * 40);
    console.log(`Title CID: ${proposal.titleCid}`);
    console.log(`Short Description CID: ${proposal.shortDescriptionCid}`);
    console.log(`Description Details CID: ${proposal.descriptionInDetailsCid}`);
    console.log(`Yes Votes: ${proposal.yesVotes.toString()}`);
    console.log(`No Votes: ${proposal.noVotes.toString()}`);
    console.log(`Creator: ${proposal.creator}`);
    console.log(`Active Status: ${proposal.activeStatus}`);
    console.log(`Expired Date: ${new Date(Number(proposal.expiredDate) * 1000).toLocaleString()}`);
    console.log(`Category ID: ${proposal.categoryId.toString()}`);
    console.log(`Created At: ${new Date(Number(proposal.createdAt) * 1000).toLocaleString()}`);
    console.log(`Updated At: ${new Date(Number(proposal.updatedAt) * 1000).toLocaleString()}`);
    
    // Calculate voting statistics
    const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
    const yesPercentage = totalVotes > 0 ? ((Number(proposal.yesVotes) / totalVotes) * 100).toFixed(2) : "0.00";
    const noPercentage = totalVotes > 0 ? ((Number(proposal.noVotes) / totalVotes) * 100).toFixed(2) : "0.00";
    
    console.log(`Total Votes: ${totalVotes}`);
    console.log(`Yes Percentage: ${yesPercentage}%`);
    console.log(`No Percentage: ${noPercentage}%`);
    
    // Check if expired
    const isExpired = Date.now() / 1000 > Number(proposal.expiredDate);
    console.log(`Is Expired: ${isExpired}`);
    
    return proposal;
  } catch (error) {
    console.error(`❌ Error checking proposal #${proposalId}:`, error.message);
    return null;
  }
}

// Function to check voting eligibility for a proposal
async function checkVotingEligibility(proposalId) {
  try {
    console.log(`🔍 Checking voting eligibility for proposal #${proposalId}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = await Proposals.attach(finalContractAddress);
    
    const proposal = await proposals.getProposal(proposalId);
    
    // Get current blockchain timestamp
    const currentBlock = await ethers.provider.getBlock('latest');
    const blockTimestamp = currentBlock.timestamp;
    
    // Check conditions
    const isActive = proposal.activeStatus;
    const isNotExpired = blockTimestamp < Number(proposal.expiredDate);
    const canVote = isActive && isNotExpired;
    
    console.log(`\n🗳️ VOTING ELIGIBILITY CHECK FOR PROPOSAL #${proposalId}:`);
    console.log("-" * 50);
    console.log(`Active Status: ${isActive}`);
    console.log(`Current Blockchain Time: ${blockTimestamp} (${new Date(blockTimestamp * 1000).toLocaleString()})`);
    console.log(`Proposal Expiry Time: ${proposal.expiredDate} (${new Date(Number(proposal.expiredDate) * 1000).toLocaleString()})`);
    console.log(`Is Not Expired: ${isNotExpired}`);
    console.log(`Time Remaining: ${Number(proposal.expiredDate) - blockTimestamp} seconds`);
    console.log(`🎯 CAN VOTE: ${canVote ? '✅ YES' : '❌ NO'}`);
    
    if (!canVote) {
      console.log(`\n❌ Voting not allowed because:`);
      if (!isActive) console.log(`   - Proposal is not active`);
      if (!isNotExpired) console.log(`   - Proposal has expired`);
    }
    
    return {
      canVote,
      isActive,
      isNotExpired,
      blockTimestamp,
      expiryTimestamp: Number(proposal.expiredDate),
      timeRemaining: Number(proposal.expiredDate) - blockTimestamp
    };
  } catch (error) {
    console.error(`❌ Error checking voting eligibility for proposal #${proposalId}:`, error.message);
    return null;
  }
}

// Function to check if an address has voted on a specific proposal
async function checkUserVote(proposalId, address) {
  try {
    const finalContractAddress = getContractAddress();
    
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = await Proposals.attach(finalContractAddress);
    
    // Note: This assumes your contract has a getUserVote function
    // You may need to adjust based on your actual contract interface
    try {
      const userVote = await proposals.getUserVote(proposalId, address);
      
      console.log(`🗳️ Address ${address} vote status for proposal #${proposalId}:`);
      console.log(`   Has Voted: ${userVote.hasVoted}`);
      console.log(`   Vote Type: ${userVote.hasVoted ? (userVote.voteType ? 'YES' : 'NO') : 'Not voted'}`);
      
      return userVote;
    } catch (error) {
      console.log(`⚠️ getUserVote function not available or address hasn't voted on proposal #${proposalId}`);
      return { hasVoted: false, voteType: false };
    }
  } catch (error) {
    console.error(`❌ Error checking user vote:`, error.message);
    return { hasVoted: false, voteType: false };
  }
}

// Function to check proposals by category
async function checkProposalsByCategory(categoryId) {
  try {
    console.log(`🔍 Checking proposals by category: ${categoryId}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = await Proposals.attach(finalContractAddress);
    
    const proposalCount = await proposals.proposalCount();
    const categoryProposals = [];
    
    // Loop through all proposals and filter by category
    for (let i = 1; i <= proposalCount; i++) {
      try {
        const proposal = await proposals.getProposal(i);
        if (proposal.categoryId.toString() === categoryId.toString()) {
          categoryProposals.push(i);
        }
      } catch (error) {
        console.error(`Error checking proposal #${i}:`, error.message);
      }
    }
    
    console.log(`📂 Proposals in category ${categoryId}:`);
    console.log(`📊 Total: ${categoryProposals.length}`);
    
    for (let i = 0; i < categoryProposals.length; i++) {
      console.log(`   - Proposal #${categoryProposals[i]}`);
    }
    
    return categoryProposals;
  } catch (error) {
    console.error(`❌ Error checking proposals by category:`, error.message);
    return [];
  }
}

// Function to check proposals by creator
async function checkProposalsByUser(userAddress) {
  try {
    console.log(`🔍 Checking proposals created by ${userAddress}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = await Proposals.attach(finalContractAddress);
    
    const proposalCount = await proposals.proposalCount();
    const userProposals = [];
    
    // Loop through all proposals and filter by creator
    for (let i = 1; i <= proposalCount; i++) {
      try {
        const proposal = await proposals.getProposal(i);
        if (proposal.creator.toLowerCase() === userAddress.toLowerCase()) {
          userProposals.push(i);
        }
      } catch (error) {
        console.error(`Error checking proposal #${i}:`, error.message);
      }
    }
    
    console.log(`📋 Proposals created by ${userAddress}:`);
    console.log(`📊 Total: ${userProposals.length}`);
    
    for (let i = 0; i < userProposals.length; i++) {
      console.log(`   - Proposal #${userProposals[i]}`);
    }
    
    return userProposals;
  } catch (error) {
    console.error(`❌ Error checking proposals by user:`, error.message);
    return [];
  }
}

// Function to check active proposals
async function checkActiveProposals() {
  try {
    console.log("🔍 Checking active proposals...");
    
    const finalContractAddress = getContractAddress();
    
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = await Proposals.attach(finalContractAddress);
    
    const proposalCount = await proposals.proposalCount();
    const activeProposals = [];
    const currentTime = Date.now() / 1000;
    
    // Loop through all proposals and filter active ones
    for (let i = 1; i <= proposalCount; i++) {
      try {
        const proposal = await proposals.getProposal(i);
        if (proposal.activeStatus && Number(proposal.expiredDate) > currentTime) {
          activeProposals.push(i);
        }
      } catch (error) {
        console.error(`Error checking proposal #${i}:`, error.message);
      }
    }
    
    console.log(`✅ Active Proposals:`);
    console.log(`📊 Total: ${activeProposals.length}`);
    
    for (let i = 0; i < activeProposals.length; i++) {
      console.log(`   - Proposal #${activeProposals[i]}`);
    }
    
    return activeProposals;
  } catch (error) {
    console.error(`❌ Error checking active proposals:`, error.message);
    return [];
  }
}

// Main execution
async function main() {
  console.log("🚀 Proposal Contract Data Checker");
  console.log("=" * 60);
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments - check all proposals
    await checkProposalsData();
  } else if (args[0] === "proposal" && args[1]) {
    // Check specific proposal
    await checkSpecificProposal(args[1]);
  } else if (args[0] === "category" && args[1]) {
    // Check proposals by category
    await checkProposalsByCategory(args[1]);
  } else if (args[0] === "user" && args[1]) {
    // Check proposals by user
    await checkProposalsByUser(args[1]);
  } else if (args[0] === "vote" && args[1] && args[2]) {
    // Check user vote for proposal
    await checkUserVote(args[1], args[2]);
  } else if (args[0] === "active") {
    // Check active proposals
    await checkActiveProposals();
  } else if (args[0] === "eligibility" && args[1]) {
    // Check voting eligibility for a specific proposal
    await checkVotingEligibility(args[1]);
  } else {
    console.log("📖 Usage:");
    console.log("  npx hardhat run --network sepolia scripts/checkProposal.js                         # Check all proposals");
    console.log("  npx hardhat run --network sepolia scripts/checkProposal.js proposal <id>          # Check specific proposal");
    console.log("  npx hardhat run --network sepolia scripts/checkProposal.js category <id>          # Check proposals by category");
    console.log("  npx hardhat run --network sepolia scripts/checkProposal.js user <address>         # Check proposals by user");
    console.log("  npx hardhat run --network sepolia scripts/checkProposal.js vote <id> <address>    # Check user vote");
    console.log("  npx hardhat run --network sepolia scripts/checkProposal.js active                 # Check active proposals");
    console.log("  npx hardhat run --network sepolia scripts/checkProposal.js eligibility <id>       # Check voting eligibility");
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
  checkProposalsData,
  checkSpecificProposal,
  checkUserVote,
  checkProposalsByCategory,
  checkProposalsByUser,
  checkActiveProposals,
  checkVotingEligibility
};
