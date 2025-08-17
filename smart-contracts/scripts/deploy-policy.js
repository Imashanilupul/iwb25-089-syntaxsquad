const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting Policy contract deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Check if AuthRegistry is deployed
  const deployedAddressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
  let deployedAddresses = {};
  
  if (fs.existsSync(deployedAddressesPath)) {
    try {
      deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
      console.log("📂 Loaded existing deployed addresses");
    } catch (error) {
      console.warn("⚠️  Could not parse deployed addresses:", error.message);
    }
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

  let authRegistryAddress;
  
  // Try to get AuthRegistry address
  if (deployedAddresses.AuthRegistry) {
    authRegistryAddress = deployedAddresses.AuthRegistry;
    console.log("🔗 Using existing AuthRegistry at:", authRegistryAddress);
  } else {
    console.log("❌ AuthRegistry not found in deployed addresses");
    console.log("💡 Please deploy AuthRegistry first using: npx hardhat run scripts/deploy-auth.js --network sepolia");
    return;
  }

  try {
    // Verify AuthRegistry exists and is working
    const authRegistryFactory = await ethers.getContractFactory("AuthRegistry");
    const authRegistry = authRegistryFactory.attach(authRegistryAddress);
    
    // Test the connection
    try {
      const testResult = await authRegistry.isAuthorized(deployer.address);
      console.log(`✅ AuthRegistry connection verified. Deployer authorized: ${testResult}`);
    } catch (error) {
      console.warn("⚠️  Could not verify AuthRegistry connection:", error.message);
      console.log("⏳ Continuing with deployment...");
    }

    // Deploy Policy contract
    console.log("\n📄 Deploying Policy contract...");
    
    const Policy = await ethers.getContractFactory("Policies");
    const policy = await Policy.deploy(authRegistryAddress);
    
    console.log("⏳ Waiting for Policy deployment...");
    await policy.waitForDeployment();
    
    const policyAddress = await policy.getAddress();
    console.log("✅ Policy deployed to:", policyAddress);

    // Update deployed addresses
    deployedAddresses.Policy = policyAddress;
    deployedAddresses.PolicyDeploymentBlock = await ethers.provider.getBlockNumber();
    deployedAddresses.PolicyDeploymentTimestamp = Math.floor(Date.now() / 1000);

    // Save deployed addresses
    fs.writeFileSync(deployedAddressesPath, JSON.stringify(deployedAddresses, null, 2));
    console.log("💾 Updated deployed-addresses.json");

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    
    try {
      const policyCount = await policy.policyCount();
      console.log("📊 Initial policy count:", policyCount.toString());
      
      const authRegistryFromContract = await policy.authRegistry();
      console.log("🔗 AuthRegistry address in contract:", authRegistryFromContract);
      
      if (authRegistryFromContract.toLowerCase() === authRegistryAddress.toLowerCase()) {
        console.log("✅ AuthRegistry address verification successful");
      } else {
        console.log("❌ AuthRegistry address mismatch");
      }
    } catch (error) {
      console.error("❌ Deployment verification failed:", error.message);
    }

    // Get deployment transaction info
    const deploymentTx = policy.deploymentTransaction();
    if (deploymentTx) {
      console.log("📋 Deployment transaction hash:", deploymentTx.hash);
      console.log("⛽ Gas used:", deploymentTx.gasLimit ? deploymentTx.gasLimit.toString() : "Unknown");
    }

    // Show summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 POLICY CONTRACT DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`📄 Policy Contract Address: ${policyAddress}`);
    console.log(`🔗 AuthRegistry Address: ${authRegistryAddress}`);
    console.log(`🌐 Network: ${network.name} (${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`🧱 Block Number: ${await ethers.provider.getBlockNumber()}`);
    console.log("=".repeat(60));
    
    console.log("\n💡 Next steps:");
    console.log("1. Update your frontend to use the new contract address");
    console.log("2. Test policy creation with: npx hardhat run scripts/test-policy.js --network sepolia");
    console.log("3. Check policies with: npx hardhat run scripts/checkPolicy.js --network sepolia");

  } catch (error) {
    console.error("💥 Deployment failed:", error);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log("\n💡 Troubleshooting:");
      console.log("- Get test ETH from Sepolia faucet");
      console.log("- Check your wallet balance");
    } else if (error.message.includes('nonce')) {
      console.log("\n💡 Troubleshooting:");
      console.log("- Reset your MetaMask account (Settings > Advanced > Reset Account)");
      console.log("- Or wait a few minutes and try again");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
