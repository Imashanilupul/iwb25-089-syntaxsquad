const { ethers } = require("hardhat");
const { getFromPinata } = require("../ipfs.js");
const fs = require('fs');
const path = require('path');

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  // From deployed-addresses.json
  sepolia: "0x99FEe085aAC7cF2291f137Eb6f7aE25D6979c470", // Update this with your actual Sepolia address
  // Add other networks as needed
};

function getContractAddress() {
  // Force Sepolia network - this script should only run on Sepolia
  const networkName = 'sepolia';
  
  console.log("🌐 Forcing Sepolia network usage");
  console.log("� Using Sepolia contract address");
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

async function checkReportsData() {
  try {
    console.log("🔍 Starting reports data check...");
    console.log("=" * 60);

    // Get the contract address
    const finalContractAddress = getContractAddress();
    console.log(`📍 Contract Address: ${finalContractAddress}`);
    
    // Get network info first
    const currentNetwork = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`);
    
    // Check network and ensure we're on Sepolia
    if (currentNetwork.chainId === 11155111n) {
      console.log("✅ Connected to Sepolia testnet");
    } else if (currentNetwork.chainId === 31337n) {
      console.log("❌ Connected to local Hardhat network");
      console.log("💡 This script requires Sepolia network. Run with: npx hardhat run --network sepolia scripts/checkReport.js");
      return;
    } else {
      console.log(`❌ Connected to unexpected network: ${currentNetwork.name}`);
      console.log("💡 This script requires Sepolia network. Run with: npx hardhat run --network sepolia scripts/checkReport.js");
      return;
    }
    
    // Get contract factory and attach to deployed contract
    const Reports = await ethers.getContractFactory("Reports");
    const reports = Reports.attach(finalContractAddress);
    
    // Connect with provider explicitly for read-only operations
    const connectedContract = reports.connect(ethers.provider);
    
    // Check if contract exists and is accessible
    console.log("🔗 Testing contract connection...");
    
    // Get report count
    let reportCount;
    try {
      reportCount = await connectedContract.reportCount();
      console.log(`📊 Total Reports: ${reportCount.toString()}`);
    } catch (error) {
      console.error("❌ Error getting report count:", error.message);
      console.log("💡 Possible issues:");
      console.log("   - Contract not deployed at this address on current network");
      console.log("   - Wrong network (make sure you're on Sepolia)");
      console.log("   - Contract ABI mismatch");
      console.log(`   - Current network: ${currentNetwork.name} (${currentNetwork.chainId})`);
      console.log("   - Try running with: npx hardhat run --network sepolia scripts/check-reports.js");
      
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
    
    if (reportCount.toString() === "0") {
      console.log("📭 No reports found in the contract");
      console.log("💡 Try creating a report first using the frontend or API");
      return;
    }
    
    console.log("\n" + "=" * 60);
    console.log("📋 REPORTS DETAILS:");
    console.log("=" * 60);
    
    // Loop through all reports and display their data
    for (let i = 1; i <= reportCount; i++) {
      try {
        console.log(`\n🚨 REPORT #${i}`);
        console.log("-" * 40);
        
        // Get report data from blockchain
        const report = await connectedContract.getReport(i);
        const votes = await connectedContract.getReportVotes(i);
        
        const titleCid = report[0];
        const descriptionCid = report[1];
        const evidenceHashCid = report[2];
        const upvotes = report[3];
        const downvotes = report[4];
        const creator = report[5];
        const resolved = report[6];
        const assignedTo = report[7];
        const createdAt = report[8];
        const resolvedAt = report[9];
        
        // Votes data
        const netVotes = votes[2];
        const totalVotes = votes[3];
        
        console.log(`🆔 Report ID: ${i}`);
        console.log(`👤 Creator: ${creator}`);
        console.log(`📝 Title CID: ${titleCid}`);
        console.log(`📄 Description CID: ${descriptionCid}`);
        console.log(`🔍 Evidence Hash CID: ${evidenceHashCid}`);
        console.log(`👍 Upvotes: ${upvotes.toString()}`);
        console.log(`👎 Downvotes: ${downvotes.toString()}`);
        console.log(`📊 Net Votes: ${netVotes.toString()}`);
        console.log(`🗳️  Total Votes: ${totalVotes.toString()}`);
        console.log(`✅ Resolved: ${resolved}`);
        console.log(`👷 Assigned To: ${assignedTo === ethers.ZeroAddress ? 'Not assigned' : assignedTo}`);
        
        // Format timestamps
        if (createdAt > 0) {
          const createdDate = new Date(Number(createdAt) * 1000);
          console.log(`📅 Created: ${createdDate.toLocaleString()}`);
        }
        
        if (resolved && resolvedAt > 0) {
          const resolvedDate = new Date(Number(resolvedAt) * 1000);
          console.log(`🔒 Resolved: ${resolvedDate.toLocaleString()}`);
        }
        
        // Calculate vote percentage
        if (totalVotes > 0) {
          const upvotePercentage = (Number(upvotes) / Number(totalVotes) * 100).toFixed(1);
          console.log(`📈 Upvote Percentage: ${upvotePercentage}%`);
        }
        
        // Try to fetch actual content from IPFS
        console.log("\n🌐 Fetching content from IPFS...");
        
        try {
          const title = await getFromPinata(titleCid);
          console.log(`📋 Title: "${title}"`);
        } catch (ipfsError) {
          console.log(`❌ Could not fetch title from IPFS: ${ipfsError.message}`);
        }
        
        try {
          const description = await getFromPinata(descriptionCid);
          console.log(`📝 Description: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}"`);
        } catch (ipfsError) {
          console.log(`❌ Could not fetch description from IPFS: ${ipfsError.message}`);
        }
        
        try {
          const evidenceHash = await getFromPinata(evidenceHashCid);
          console.log(`🔍 Evidence Hash: "${evidenceHash.substring(0, 50)}${evidenceHash.length > 50 ? '...' : ''}"`);
        } catch (ipfsError) {
          console.log(`❌ Could not fetch evidence hash from IPFS: ${ipfsError.message}`);
        }
        
      } catch (error) {
        console.error(`❌ Error fetching report #${i}:`, error.message);
      }
    }
    
    console.log("\n" + "=" * 60);
    console.log("📊 SUMMARY");
    console.log("=" * 60);
    console.log(`📈 Total Reports: ${reportCount.toString()}`);
    
    // Calculate summary statistics
    let totalUpvotes = 0;
    let totalDownvotes = 0;
    let resolvedCount = 0;
    let assignedCount = 0;
    
    for (let i = 1; i <= reportCount; i++) {
      try {
        const report = await connectedContract.getReport(i);
        totalUpvotes += Number(report[3]);
        totalDownvotes += Number(report[4]);
        if (report[6]) resolvedCount++;
        if (report[7] !== ethers.ZeroAddress) assignedCount++;
      } catch (error) {
        // Skip if report doesn't exist
      }
    }
    
    console.log(`👍 Total Upvotes: ${totalUpvotes}`);
    console.log(`👎 Total Downvotes: ${totalDownvotes}`);
    console.log(`✅ Resolved Reports: ${resolvedCount}`);
    console.log(`👷 Assigned Reports: ${assignedCount}`);
    console.log(`📋 Unresolved Reports: ${reportCount.toString() - resolvedCount}`);
    console.log(`🆓 Unassigned Reports: ${reportCount.toString() - assignedCount}`);
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get current block
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`🧱 Current Block: ${blockNumber}`);
    
    console.log("\n✅ Reports data check completed!");
    
  } catch (error) {
    console.error("❌ Error during reports check:", error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure the contract is deployed to the current network");
    console.log("2. Check that the contract address is correct");
    console.log("3. Ensure you're connected to the right network (Sepolia, etc.)");
    console.log("4. Verify the contract ABI matches the deployed contract");
  }
}

// Additional function to check a specific report by ID
async function checkSpecificReport(reportId) {
  try {
    console.log(`🔍 Checking specific report #${reportId}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Reports = await ethers.getContractFactory("Reports");
    const reports = await Reports.attach(finalContractAddress);
    
    const report = await reports.getReport(reportId);
    const votes = await reports.getReportVotes(reportId);
    
    console.log(`\n🚨 REPORT #${reportId} DETAILS:`);
    console.log("-" * 40);
    console.log(`Title CID: ${report[0]}`);
    console.log(`Description CID: ${report[1]}`);
    console.log(`Evidence Hash CID: ${report[2]}`);
    console.log(`Upvotes: ${report[3].toString()}`);
    console.log(`Downvotes: ${report[4].toString()}`);
    console.log(`Creator: ${report[5]}`);
    console.log(`Resolved: ${report[6]}`);
    console.log(`Assigned To: ${report[7]}`);
    console.log(`Created At: ${report[8].toString()}`);
    console.log(`Resolved At: ${report[9].toString()}`);
    console.log(`Net Votes: ${votes[2].toString()}`);
    console.log(`Total Votes: ${votes[3].toString()}`);
    
    return report;
  } catch (error) {
    console.error(`❌ Error checking report #${reportId}:`, error.message);
    return null;
  }
}

// Function to check if an address has voted on a specific report
async function checkUserVote(reportId, address) {
  try {
    const finalContractAddress = getContractAddress();
    
    const Reports = await ethers.getContractFactory("Reports");
    const reports = await Reports.attach(finalContractAddress);
    
    const userVote = await reports.getUserVote(reportId, address);
    const hasUpvoted = userVote[0];
    const hasDownvoted = userVote[1];
    
    console.log(`🗳️  Address ${address} voting status for report #${reportId}:`);
    console.log(`👍 Has Upvoted: ${hasUpvoted}`);
    console.log(`👎 Has Downvoted: ${hasDownvoted}`);
    
    return { hasUpvoted, hasDownvoted };
  } catch (error) {
    console.error(`❌ Error checking user vote:`, error.message);
    return { hasUpvoted: false, hasDownvoted: false };
  }
}

// Function to check reports by user
async function checkReportsByUser(userAddress) {
  try {
    console.log(`🔍 Checking reports created by ${userAddress}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Reports = await ethers.getContractFactory("Reports");
    const reports = await Reports.attach(finalContractAddress);
    
    const reportIds = await reports.getReportsByUser(userAddress);
    
    console.log(`📋 Reports created by ${userAddress}:`);
    console.log(`📊 Total: ${reportIds.length}`);
    
    for (let i = 0; i < reportIds.length; i++) {
      const reportId = reportIds[i].toString();
      console.log(`  - Report #${reportId}`);
    }
    
    return reportIds.map(id => id.toString());
  } catch (error) {
    console.error(`❌ Error checking reports by user:`, error.message);
    return [];
  }
}

// Function to check reports assigned to user
async function checkReportsAssignedTo(userAddress) {
  try {
    console.log(`🔍 Checking reports assigned to ${userAddress}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Reports = await ethers.getContractFactory("Reports");
    const reports = await Reports.attach(finalContractAddress);
    
    const reportIds = await reports.getReportsAssignedTo(userAddress);
    
    console.log(`👷 Reports assigned to ${userAddress}:`);
    console.log(`📊 Total: ${reportIds.length}`);
    
    for (let i = 0; i < reportIds.length; i++) {
      const reportId = reportIds[i].toString();
      console.log(`  - Report #${reportId}`);
    }
    
    return reportIds.map(id => id.toString());
  } catch (error) {
    console.error(`❌ Error checking assigned reports:`, error.message);
    return [];
  }
}

// Main execution
async function main() {
  console.log("🚀 Reports Contract Data Checker");
  console.log("=" * 60);
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments - check all reports
    await checkReportsData();
  } else if (args[0] === "report" && args[1]) {
    // Check specific report: node check-reports.js report 1
    await checkSpecificReport(parseInt(args[1]));
  } else if (args[0] === "vote" && args[1] && args[2]) {
    // Check user vote: node check-reports.js vote 1 0x1234...
    await checkUserVote(parseInt(args[1]), args[2]);
  } else if (args[0] === "created-by" && args[1]) {
    // Check reports by user: node check-reports.js created-by 0x1234...
    await checkReportsByUser(args[1]);
  } else if (args[0] === "assigned-to" && args[1]) {
    // Check reports assigned to user: node check-reports.js assigned-to 0x1234...
    await checkReportsAssignedTo(args[1]);
  } else {
    console.log("📖 Usage:");
    console.log("  node check-reports.js                           - Check all reports");
    console.log("  node check-reports.js report <id>               - Check specific report");
    console.log("  node check-reports.js vote <id> <addr>          - Check if address voted on report");
    console.log("  node check-reports.js created-by <addr>         - Check reports created by address");
    console.log("  node check-reports.js assigned-to <addr>        - Check reports assigned to address");
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
  checkReportsData,
  checkSpecificReport,
  checkUserVote,
  checkReportsByUser,
  checkReportsAssignedTo
};