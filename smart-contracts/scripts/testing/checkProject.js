const { ethers } = require("hardhat");
const { getFromPinata } = require("../ipfs.js");
const fs = require('fs');
const path = require('path');

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  // From deployed-addresses.json
  sepolia: "0x6e5A642acF9Ad0FFD96C54149201b2F44579d759", // Will be updated after deployment
  // Add other networks as needed
};

function getContractAddress() {
  // Try to get from deployed-addresses.json first
  try {
    const deployedAddressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
    if (fs.existsSync(deployedAddressesPath)) {
      const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
      if (deployedAddresses.Project) {
        console.log("📍 Using Project contract from deployed-addresses.json");
        return deployedAddresses.Project;
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

async function checkProjectsData() {
  try {
    console.log("🏗️ Starting projects data check...");
    console.log("=" * 60);

    // Get the contract address
    const finalContractAddress = getContractAddress();
    if (!finalContractAddress || finalContractAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ Project contract not deployed");
      console.log("💡 Please deploy the Project contract first with:");
      console.log("   npx hardhat run --network sepolia scripts/deploy-project.js");
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
      console.log("💡 This script requires Sepolia network. Run with: npx hardhat run --network sepolia scripts/checkProject.js");
      return;
    } else {
      console.log(`❌ Connected to unexpected network: ${currentNetwork.name}`);
      console.log("💡 This script requires Sepolia network. Run with: npx hardhat run --network sepolia scripts/checkProject.js");
      return;
    }
    
    // Get contract factory and attach to deployed contract
    const Project = await ethers.getContractFactory("Project");
    const project = Project.attach(finalContractAddress);
    
    // Connect with provider explicitly for read-only operations
    const connectedContract = project.connect(ethers.provider);
    
    // Check if contract exists and is accessible
    console.log("🔗 Testing contract connection...");
    
    // Get project count
    let projectCount;
    try {
      projectCount = await connectedContract.projectCount();
      console.log(`📊 Total Projects: ${projectCount.toString()}`);
    } catch (error) {
      console.error("❌ Error getting project count:", error.message);
      console.log("💡 Possible issues:");
      console.log("   - Contract not deployed at this address on current network");
      console.log("   - Wrong network (make sure you're on Sepolia)");
      console.log("   - Contract ABI mismatch");
      console.log(`   - Current network: ${currentNetwork.name} (${currentNetwork.chainId})`);
      console.log("   - Try running with: npx hardhat run --network sepolia scripts/checkProject.js");
      
      // Try alternative approach using provider directly
      console.log("\n🔄 Trying alternative approach...");
      try {
        const code = await ethers.provider.getCode(finalContractAddress);
        if (code === '0x') {
          console.log("❌ No contract deployed at this address");
        } else {
          console.log("✅ Contract code exists at address");
          console.log("💡 This might be an ABI mismatch or method name issue");
        }
      } catch (codeError) {
        console.error("❌ Cannot access contract:", codeError.message);
      }
      return;
    }
    
    if (projectCount.toString() === "0") {
      console.log("📭 No projects found in the contract");
      console.log("💡 Try creating a project first using the frontend or API");
      return;
    }
    
    console.log("\n" + "=" * 60);
    console.log("🏗️ PROJECTS DETAILS:");
    console.log("=" * 60);
    
    // Loop through all projects and display their data
    for (let i = 1; i <= projectCount; i++) {
      try {
        console.log(`\n📋 PROJECT #${i}:`);
        console.log("-" * 40);
        
        const project = await connectedContract.getProject(i);
        
        console.log(`Project ID: ${project[0].toString()}`);
        console.log(`Project Name: ${project[1]}`);
        console.log(`Category Name: ${project[2]}`);
        console.log(`Allocated Budget: ${ethers.formatEther(project[3])} ETH (${project[3].toString()} wei)`);
        console.log(`Spent Budget: ${ethers.formatEther(project[4])} ETH (${project[4].toString()} wei)`);
        console.log(`State: ${project[5]}`);
        console.log(`Province: ${project[6]}`);
        console.log(`Ministry: ${project[7]}`);
        console.log(`View Details CID: ${project[8]}`);
        console.log(`Status: ${project[9]}`);
        console.log(`Creator: ${project[10]}`);
        console.log(`Created At: ${new Date(Number(project[11]) * 1000).toLocaleString()}`);
        console.log(`Updated At: ${new Date(Number(project[12]) * 1000).toLocaleString()}`);
        
        // Calculate budget metrics
        const allocatedBudget = Number(project[3]);
        const spentBudget = Number(project[4]);
        const remainingBudget = allocatedBudget - spentBudget;
        const budgetUtilization = allocatedBudget > 0 ? ((spentBudget / allocatedBudget) * 100).toFixed(2) : "0.00";
        
        console.log(`Remaining Budget: ${ethers.formatEther(remainingBudget)} ETH (${remainingBudget.toString()} wei)`);
        console.log(`Budget Utilization: ${budgetUtilization}%`);
        
        // Budget status indicators
        if (budgetUtilization >= 100) {
          console.log(`💰 Budget Status: ⚠️ FULLY UTILIZED`);
        } else if (budgetUtilization >= 75) {
          console.log(`💰 Budget Status: 🟡 HIGH UTILIZATION (${budgetUtilization}%)`);
        } else if (budgetUtilization >= 50) {
          console.log(`💰 Budget Status: 🟠 MEDIUM UTILIZATION (${budgetUtilization}%)`);
        } else {
          console.log(`💰 Budget Status: 🟢 LOW UTILIZATION (${budgetUtilization}%)`);
        }
        
        // Try to fetch view details from IPFS
        if (project[8] && project[8].length > 0) {
          try {
            console.log("\n📄 Fetching view details from IPFS...");
            const viewDetailsContent = await getFromPinata(project[8]);
            const parsedContent = JSON.parse(viewDetailsContent);
            console.log(`📄 View Details Type: ${parsedContent.type || 'Unknown'}`);
            console.log(`📄 View Details Content: ${parsedContent.content || 'No content'}`);
            console.log(`📄 IPFS Timestamp: ${new Date(parsedContent.timestamp || 0).toLocaleString()}`);
          } catch (ipfsError) {
            console.log(`⚠️ Could not fetch view details from IPFS: ${ipfsError.message}`);
          }
        } else {
          console.log("📄 No view details CID provided");
        }
        
      } catch (error) {
        console.error(`❌ Error getting project #${i}:`, error.message);
      }
    }
    
    // Get project statistics
    console.log("\n" + "=" * 60);
    console.log("📊 PROJECT STATISTICS:");
    console.log("=" * 60);
    
    try {
      // Calculate statistics by iterating through projects
      let totalAllocatedBudget = 0;
      let totalSpentBudget = 0;
      let statusCounts = {};
      let categoryCounts = {};
      let stateCounts = {};
      let ministryCounts = {};
      let creatorCounts = {};
      
      for (let i = 1; i <= projectCount; i++) {
        try {
          const project = await connectedContract.getProject(i);
          
          // Budget calculations
          totalAllocatedBudget += Number(project[3]);
          totalSpentBudget += Number(project[4]);
          
          // Count by status
          const status = project[9];
          statusCounts[status] = (statusCounts[status] || 0) + 1;
          
          // Count by category
          const category = project[2];
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          
          // Count by state
          const state = project[5];
          stateCounts[state] = (stateCounts[state] || 0) + 1;
          
          // Count by ministry
          const ministry = project[7];
          ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
          
          // Count by creator
          const creator = project[10];
          creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;
          
        } catch (error) {
          console.error(`Error processing project ${i} for statistics:`, error.message);
        }
      }
      
      console.log(`📈 Total Projects: ${projectCount.toString()}`);
      console.log(`💰 Total Allocated Budget: ${ethers.formatEther(totalAllocatedBudget)} ETH`);
      console.log(`💸 Total Spent Budget: ${ethers.formatEther(totalSpentBudget)} ETH`);
      console.log(`💵 Total Remaining Budget: ${ethers.formatEther(totalAllocatedBudget - totalSpentBudget)} ETH`);
      
      const overallUtilization = totalAllocatedBudget > 0 ? ((totalSpentBudget / totalAllocatedBudget) * 100).toFixed(2) : "0.00";
      console.log(`📊 Overall Budget Utilization: ${overallUtilization}%`);
      
      console.log(`\n📂 Projects by Status:`);
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} projects`);
      });
      
      console.log(`\n📋 Projects by Category:`);
      Object.entries(categoryCounts).forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} projects`);
      });
      
      console.log(`\n🗺️ Projects by State:`);
      Object.entries(stateCounts).forEach(([state, count]) => {
        console.log(`   - ${state}: ${count} projects`);
      });
      
      console.log(`\n🏛️ Projects by Ministry:`);
      Object.entries(ministryCounts).forEach(([ministry, count]) => {
        console.log(`   - ${ministry}: ${count} projects`);
      });
      
      console.log(`\n👤 Top Project Creators:`);
      const sortedCreators = Object.entries(creatorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      sortedCreators.forEach(([creator, count]) => {
        console.log(`   - ${creator}: ${count} projects`);
      });
      
    } catch (error) {
      console.error("❌ Error calculating statistics:", error.message);
    }
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`\n🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get current block
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`🧱 Current Block: ${blockNumber}`);
    
    console.log("\n✅ Projects data check completed!");
    
  } catch (error) {
    console.error("❌ Error during projects check:", error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure the contract is deployed to the current network");
    console.log("2. Check that the contract address is correct");
    console.log("3. Ensure you're connected to the right network (Sepolia, etc.)");
    console.log("4. Verify the contract ABI matches the deployed contract");
  }
}

// Additional function to check a specific project by ID
async function checkSpecificProject(projectId) {
  try {
    console.log(`🔍 Checking specific project #${projectId}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Project = await ethers.getContractFactory("Project");
    const project = await Project.attach(finalContractAddress);
    
    const projectData = await project.getProject(projectId);
    
    console.log(`\n📋 PROJECT #${projectId} DETAILS:`);
    console.log("-" * 40);
    console.log(`Project ID: ${projectData[0].toString()}`);
    console.log(`Project Name: ${projectData[1]}`);
    console.log(`Category Name: ${projectData[2]}`);
    console.log(`Allocated Budget: ${ethers.formatEther(projectData[3])} ETH`);
    console.log(`Spent Budget: ${ethers.formatEther(projectData[4])} ETH`);
    console.log(`State: ${projectData[5]}`);
    console.log(`Province: ${projectData[6]}`);
    console.log(`Ministry: ${projectData[7]}`);
    console.log(`View Details CID: ${projectData[8]}`);
    console.log(`Status: ${projectData[9]}`);
    console.log(`Creator: ${projectData[10]}`);
    console.log(`Created At: ${new Date(Number(projectData[11]) * 1000).toLocaleString()}`);
    console.log(`Updated At: ${new Date(Number(projectData[12]) * 1000).toLocaleString()}`);
    
    // Calculate budget metrics
    const allocatedBudget = Number(projectData[3]);
    const spentBudget = Number(projectData[4]);
    const remainingBudget = allocatedBudget - spentBudget;
    const budgetUtilization = allocatedBudget > 0 ? ((spentBudget / allocatedBudget) * 100).toFixed(2) : "0.00";
    
    console.log(`Remaining Budget: ${ethers.formatEther(remainingBudget)} ETH`);
    console.log(`Budget Utilization: ${budgetUtilization}%`);
    
    return projectData;
  } catch (error) {
    console.error(`❌ Error checking project #${projectId}:`, error.message);
    return null;
  }
}

// Function to check project budget details
async function checkProjectBudget(projectId) {
  try {
    console.log(`💰 Checking budget for project #${projectId}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Project = await ethers.getContractFactory("Project");
    const project = await Project.attach(finalContractAddress);
    
    const budgetData = await project.getProjectBudget(projectId);
    
    console.log(`\n💰 BUDGET DETAILS FOR PROJECT #${projectId}:`);
    console.log("-" * 50);
    console.log(`Allocated Budget: ${ethers.formatEther(budgetData[0])} ETH (${budgetData[0].toString()} wei)`);
    console.log(`Spent Budget: ${ethers.formatEther(budgetData[1])} ETH (${budgetData[1].toString()} wei)`);
    console.log(`Remaining Budget: ${ethers.formatEther(budgetData[2])} ETH (${budgetData[2].toString()} wei)`);
    console.log(`Budget Utilization: ${budgetData[3].toString()}%`);
    
    const utilizationPercent = Number(budgetData[3]);
    if (utilizationPercent >= 100) {
      console.log(`🚨 STATUS: BUDGET FULLY UTILIZED OR EXCEEDED`);
    } else if (utilizationPercent >= 75) {
      console.log(`⚠️ STATUS: HIGH BUDGET UTILIZATION`);
    } else if (utilizationPercent >= 50) {
      console.log(`🟡 STATUS: MEDIUM BUDGET UTILIZATION`);
    } else {
      console.log(`🟢 STATUS: LOW BUDGET UTILIZATION`);
    }
    
    return budgetData;
  } catch (error) {
    console.error(`❌ Error checking project budget for project #${projectId}:`, error.message);
    return null;
  }
}

// Function to check projects by category
async function checkProjectsByCategory(categoryName) {
  try {
    console.log(`🔍 Checking projects by category: ${categoryName}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Project = await ethers.getContractFactory("Project");
    const project = await Project.attach(finalContractAddress);
    
    const projectIds = await project.getProjectsByCategory(categoryName);
    
    console.log(`📂 Projects in category "${categoryName}":`);
    console.log(`📊 Total: ${projectIds.length}`);
    
    for (let i = 0; i < projectIds.length; i++) {
      console.log(`   - Project #${projectIds[i].toString()}`);
    }
    
    return projectIds.map(id => id.toString());
  } catch (error) {
    console.error(`❌ Error checking projects by category:`, error.message);
    return [];
  }
}

// Function to check projects by status
async function checkProjectsByStatus(status) {
  try {
    console.log(`🔍 Checking projects by status: ${status}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Project = await ethers.getContractFactory("Project");
    const project = await Project.attach(finalContractAddress);
    
    const projectIds = await project.getProjectsByStatus(status);
    
    console.log(`📋 Projects with status "${status}":`);
    console.log(`📊 Total: ${projectIds.length}`);
    
    for (let i = 0; i < projectIds.length; i++) {
      console.log(`   - Project #${projectIds[i].toString()}`);
    }
    
    return projectIds.map(id => id.toString());
  } catch (error) {
    console.error(`❌ Error checking projects by status:`, error.message);
    return [];
  }
}

// Function to check projects by state
async function checkProjectsByState(state) {
  try {
    console.log(`🔍 Checking projects by state: ${state}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Project = await ethers.getContractFactory("Project");
    const project = await Project.attach(finalContractAddress);
    
    const projectIds = await project.getProjectsByState(state);
    
    console.log(`🗺️ Projects in state "${state}":`);
    console.log(`📊 Total: ${projectIds.length}`);
    
    for (let i = 0; i < projectIds.length; i++) {
      console.log(`   - Project #${projectIds[i].toString()}`);
    }
    
    return projectIds.map(id => id.toString());
  } catch (error) {
    console.error(`❌ Error checking projects by state:`, error.message);
    return [];
  }
}

// Function to check projects by ministry
async function checkProjectsByMinistry(ministry) {
  try {
    console.log(`🔍 Checking projects by ministry: ${ministry}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Project = await ethers.getContractFactory("Project");
    const project = await Project.attach(finalContractAddress);
    
    const projectIds = await project.getProjectsByMinistry(ministry);
    
    console.log(`🏛️ Projects under ministry "${ministry}":`);
    console.log(`📊 Total: ${projectIds.length}`);
    
    for (let i = 0; i < projectIds.length; i++) {
      console.log(`   - Project #${projectIds[i].toString()}`);
    }
    
    return projectIds.map(id => id.toString());
  } catch (error) {
    console.error(`❌ Error checking projects by ministry:`, error.message);
    return [];
  }
}

// Function to check projects by user/creator
async function checkProjectsByUser(userAddress) {
  try {
    console.log(`🔍 Checking projects created by ${userAddress}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Project = await ethers.getContractFactory("Project");
    const project = await Project.attach(finalContractAddress);
    
    const projectIds = await project.getProjectsByUser(userAddress);
    
    console.log(`👤 Projects created by ${userAddress}:`);
    console.log(`📊 Total: ${projectIds.length}`);
    
    for (let i = 0; i < projectIds.length; i++) {
      console.log(`   - Project #${projectIds[i].toString()}`);
    }
    
    return projectIds.map(id => id.toString());
  } catch (error) {
    console.error(`❌ Error checking projects by user:`, error.message);
    return [];
  }
}

// Main execution
async function main() {
  console.log("🚀 Project Contract Data Checker");
  console.log("=" * 60);
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments - check all projects
    await checkProjectsData();
  } else if (args[0] === "project" && args[1]) {
    // Check specific project
    await checkSpecificProject(args[1]);
  } else if (args[0] === "budget" && args[1]) {
    // Check specific project budget
    await checkProjectBudget(args[1]);
  } else if (args[0] === "category" && args[1]) {
    // Check projects by category
    await checkProjectsByCategory(args[1]);
  } else if (args[0] === "status" && args[1]) {
    // Check projects by status
    await checkProjectsByStatus(args[1]);
  } else if (args[0] === "state" && args[1]) {
    // Check projects by state
    await checkProjectsByState(args[1]);
  } else if (args[0] === "ministry" && args[1]) {
    // Check projects by ministry
    await checkProjectsByMinistry(args[1]);
  } else if (args[0] === "user" && args[1]) {
    // Check projects by user
    await checkProjectsByUser(args[1]);
  } else {
    console.log("❓ Usage:");
    console.log("   node checkProject.js                    # Check all projects");
    console.log("   node checkProject.js project <id>       # Check specific project");
    console.log("   node checkProject.js budget <id>        # Check project budget");
    console.log("   node checkProject.js category <name>    # Check by category");
    console.log("   node checkProject.js status <status>    # Check by status");
    console.log("   node checkProject.js state <state>      # Check by state");
    console.log("   node checkProject.js ministry <ministry># Check by ministry");
    console.log("   node checkProject.js user <address>     # Check by user");
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
  checkProjectsData,
  checkSpecificProject,
  checkProjectBudget,
  checkProjectsByCategory,
  checkProjectsByStatus,
  checkProjectsByState,
  checkProjectsByMinistry,
  checkProjectsByUser
};
