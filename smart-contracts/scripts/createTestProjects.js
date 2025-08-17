const { ethers } = require("hardhat");
const { uploadDescriptionToPinata } = require("./ipfs.js");
const fs = require('fs');
const path = require('path');

// Load test data
const testDataPath = path.join(__dirname, '..', 'test_data', 'test_project_data.json');
const testProjects = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

function getContractAddress() {
  try {
    const deployedAddressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
    if (fs.existsSync(deployedAddressesPath)) {
      const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
      if (deployedAddresses.Project) {
        return deployedAddresses.Project;
      }
    }
  } catch (error) {
    console.warn("Could not load from deployed-addresses.json:", error.message);
  }
  
  // Fallback address (update this after deployment)
  return "0x0000000000000000000000000000000000000000";
}

async function createTestProjects() {
  try {
    console.log("🏗️ Creating test projects...");
    console.log("=" * 60);

    // Get the contract address
    const contractAddress = getContractAddress();
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ Project contract not deployed");
      console.log("💡 Please deploy the Project contract first with:");
      console.log("   npx hardhat run --network sepolia scripts/deploy-project.js");
      return;
    }
    
    console.log(`📍 Using Project contract at: ${contractAddress}`);
    
    // Get network info
    const currentNetwork = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`);
    
    // Get signers
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    console.log(`👤 Using account: ${deployer.address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther("0.1")) {
      console.log("⚠️ Low balance warning - make sure you have enough ETH for gas fees");
    }
    
    // Get contract factory and attach to deployed contract
    const Project = await ethers.getContractFactory("Project");
    const project = Project.attach(contractAddress);
    
    console.log(`\n📊 Current project count: ${await project.projectCount()}`);
    
    console.log("\n🚀 Creating test projects...");
    console.log("-" * 60);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < testProjects.length; i++) {
      const projectData = testProjects[i];
      
      try {
        console.log(`\n📋 Creating project ${i + 1}/${testProjects.length}: "${projectData.projectName}"`);
        
        // Upload view details to IPFS
        let viewDetailsCid = "";
        if (projectData.viewDetails) {
          console.log("📤 Uploading view details to IPFS...");
          viewDetailsCid = await uploadDescriptionToPinata(JSON.stringify({
            type: "project_view_details",
            content: projectData.viewDetails,
            projectName: projectData.projectName,
            category: projectData.categoryName,
            timestamp: Date.now()
          }), `project_details_${Date.now()}_${i}.json`);
          console.log(`📄 IPFS CID: ${viewDetailsCid}`);
        }
        
        // Convert allocated budget to wei
        const allocatedBudgetWei = ethers.parseEther(projectData.allocatedBudget);
        
        console.log(`💰 Budget: ${projectData.allocatedBudget} ETH (${allocatedBudgetWei.toString()} wei)`);
        console.log(`📍 Location: ${projectData.state}, ${projectData.province}`);
        console.log(`🏛️ Ministry: ${projectData.ministry}`);
        console.log(`📂 Category: ${projectData.categoryName}`);
        console.log(`📊 Status: ${projectData.status}`);
        
        // Create the project
        console.log("🔄 Submitting transaction...");
        const tx = await project.connect(deployer).createProject(
          projectData.projectName,
          projectData.categoryName,
          allocatedBudgetWei,
          projectData.state,
          projectData.province,
          projectData.ministry,
          viewDetailsCid,
          projectData.status
        );
        
        console.log(`📝 Transaction hash: ${tx.hash}`);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log(`✅ Project created successfully! Gas used: ${receipt.gasUsed.toString()}`);
        
        // Get the new project ID
        const newProjectCount = await project.projectCount();
        console.log(`🆔 Project ID: ${newProjectCount.toString()}`);
        
        successCount++;
        
        // Add a small delay to avoid overwhelming the network
        if (i < testProjects.length - 1) {
          console.log("⏸️ Waiting 2 seconds before next transaction...");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Failed to create project "${projectData.projectName}":`, error.message);
        failCount++;
        
        if (error.message.includes("insufficient funds")) {
          console.log("💡 Insufficient funds - stopping creation process");
          break;
        }
      }
    }
    
    console.log("\n" + "=" * 60);
    console.log("📊 PROJECT CREATION SUMMARY:");
    console.log("=" * 60);
    console.log(`✅ Successfully created: ${successCount} projects`);
    console.log(`❌ Failed to create: ${failCount} projects`);
    console.log(`📈 Total projects in contract: ${await project.projectCount()}`);
    
    if (successCount > 0) {
      console.log("\n🎉 Test projects created successfully!");
      console.log("💡 You can now test the contract with:");
      console.log("   npx hardhat run --network sepolia scripts/checkProject.js");
      console.log("\n📝 Available test commands:");
      console.log("   node checkProject.js                    # Check all projects");
      console.log("   node checkProject.js project 1          # Check specific project");
      console.log("   node checkProject.js budget 1           # Check project budget");
      console.log("   node checkProject.js category Infrastructure # Check by category");
      console.log("   node checkProject.js status PLANNED     # Check by status");
      console.log("   node checkProject.js state Western Province # Check by state");
    }
    
  } catch (error) {
    console.error("❌ Error during test project creation:", error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure the Project contract is deployed");
    console.log("2. Check that you have sufficient ETH for gas fees");
    console.log("3. Ensure you're connected to the correct network");
    console.log("4. Verify the contract address is correct");
  }
}

// Function to create a single test project
async function createSingleTestProject(index) {
  if (index < 0 || index >= testProjects.length) {
    console.log(`❌ Invalid project index. Available range: 0-${testProjects.length - 1}`);
    return;
  }
  
  const projectData = testProjects[index];
  console.log(`🏗️ Creating single test project: "${projectData.projectName}"`);
  
  try {
    const contractAddress = getContractAddress();
    const Project = await ethers.getContractFactory("Project");
    const project = Project.attach(contractAddress);
    const [deployer] = await ethers.getSigners();
    
    // Upload view details to IPFS
    let viewDetailsCid = "";
    if (projectData.viewDetails) {
      viewDetailsCid = await uploadDescriptionToPinata(JSON.stringify({
        type: "project_view_details",
        content: projectData.viewDetails,
        projectName: projectData.projectName,
        timestamp: Date.now()
      }), `single_project_details_${Date.now()}.json`);
    }
    
    const allocatedBudgetWei = ethers.parseEther(projectData.allocatedBudget);
    
    const tx = await project.connect(deployer).createProject(
      projectData.projectName,
      projectData.categoryName,
      allocatedBudgetWei,
      projectData.state,
      projectData.province,
      projectData.ministry,
      viewDetailsCid,
      projectData.status
    );
    
    await tx.wait();
    const projectId = await project.projectCount();
    
    console.log(`✅ Project created successfully with ID: ${projectId.toString()}`);
    
  } catch (error) {
    console.error(`❌ Failed to create project:`, error.message);
  }
}

// Function to simulate budget spending on existing projects
async function simulateBudgetSpending() {
  try {
    console.log("💸 Simulating budget spending on existing projects...");
    
    const contractAddress = getContractAddress();
    const Project = await ethers.getContractFactory("Project");
    const project = Project.attach(contractAddress);
    const [deployer] = await ethers.getSigners();
    
    const projectCount = await project.projectCount();
    
    if (projectCount.toString() === "0") {
      console.log("❌ No projects found. Create some projects first.");
      return;
    }
    
    console.log(`📊 Found ${projectCount.toString()} projects. Simulating spending...`);
    
    // Simulate spending on random projects
    const numberOfProjects = Math.min(Number(projectCount), 5); // Limit to 5 projects
    
    for (let i = 1; i <= numberOfProjects; i++) {
      try {
        // Get project details first
        const projectData = await project.getProject(i);
        const allocatedBudget = projectData[3];
        const currentSpentBudget = projectData[4];
        
        // Calculate a random spending amount (10-30% of allocated budget)
        const spendingPercentage = 10 + Math.random() * 20; // 10-30%
        const spendingAmount = (allocatedBudget * BigInt(Math.floor(spendingPercentage))) / 100n;
        
        console.log(`\n💰 Project ${i}: "${projectData[1]}"`);
        console.log(`   Allocated: ${ethers.formatEther(allocatedBudget)} ETH`);
        console.log(`   Current Spent: ${ethers.formatEther(currentSpentBudget)} ETH`);
        console.log(`   Adding Spent: ${ethers.formatEther(spendingAmount)} ETH`);
        
        // Add to spent budget
        const tx = await project.connect(deployer).addSpentBudget(i, spendingAmount);
        await tx.wait();
        
        console.log(`   ✅ Spending recorded successfully`);
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error simulating spending for project ${i}:`, error.message);
      }
    }
    
    console.log("\n✅ Budget spending simulation completed!");
    
  } catch (error) {
    console.error("❌ Error during budget spending simulation:", error.message);
  }
}

// Main execution
async function main() {
  console.log("🚀 Project Test Data Creator");
  console.log("=" * 60);
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments - create all test projects
    await createTestProjects();
  } else if (args[0] === "single" && args[1]) {
    // Create single project by index
    await createSingleTestProject(parseInt(args[1]));
  } else if (args[0] === "spending") {
    // Simulate budget spending
    await simulateBudgetSpending();
  } else {
    console.log("❓ Usage:");
    console.log("   node createTestProjects.js              # Create all test projects");
    console.log("   node createTestProjects.js single <index> # Create single project by index (0-9)");
    console.log("   node createTestProjects.js spending     # Simulate budget spending");
    console.log("\n📋 Available test projects:");
    testProjects.forEach((project, index) => {
      console.log(`   ${index}: ${project.projectName} (${project.categoryName})`);
    });
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
  createTestProjects,
  createSingleTestProject,
  simulateBudgetSpending
};
