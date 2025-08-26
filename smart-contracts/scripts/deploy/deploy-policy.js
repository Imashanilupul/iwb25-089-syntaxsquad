const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting Policy contract deployment...");

  // Check network connection first
  try {
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Ensure we're on Sepolia
    if (network.chainId !== 11155111n) {
      console.error(`❌ Wrong network! Expected Sepolia (11155111), got ${network.chainId}`);
      console.log("💡 Make sure to run with: npx hardhat run scripts/deploy-policy.js --network sepolia");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Network connection failed:", error.message);
    process.exit(1);
  }

  // Get the deployer account
  let deployer;
  try {
    const signers = await ethers.getSigners();
    if (!signers || signers.length === 0) {
      throw new Error("No signers available. Check your hardhat config and private key.");
    }
    deployer = signers[0];
    console.log("📋 Deploying contracts with account:", deployer.address);
  } catch (error) {
    console.error("❌ Failed to get deployer account:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("1. Check your .env file has PRIVATE_KEY set");
    console.log("2. Verify your hardhat.config.js sepolia network configuration");
    console.log("3. Make sure your private key is valid (64 characters, no 0x prefix)");
    process.exit(1);
  }

  // Get account balance
  try {
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceETH = ethers.formatEther(balance);
    console.log("💰 Account balance:", balanceETH, "ETH");
    
    // Check if we have enough balance (at least 0.01 ETH for deployment)
    if (parseFloat(balanceETH) < 0.01) {
      console.warn("⚠️  Low balance! You might need more ETH for deployment.");
      console.log("💡 Get Sepolia ETH from: https://sepoliafaucet.com/");
    }
  } catch (error) {
    console.error("❌ Failed to get balance:", error.message);
    process.exit(1);
  }

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

  // Set AuthRegistry address - use hardcoded Sepolia address
  let authRegistryAddress = "0x6869062fA4b81C0cA4fBF52E49E136A37AdC28Fd";
  
  // Only use deployed address if it's not a localhost address
  if (deployedAddresses.AuthRegistry && !deployedAddresses.AuthRegistry.startsWith("0x5FbDB")) {
    authRegistryAddress = deployedAddresses.AuthRegistry;
    console.log("📋 Using AuthRegistry from deployed addresses:", authRegistryAddress);
  } else {
    console.log("📋 Using hardcoded Sepolia AuthRegistry address:", authRegistryAddress);
  }

  try {
    // Verify AuthRegistry exists and is accessible
    console.log("🔍 Verifying AuthRegistry connection...");
    
    // Check if there's code at the address
    const code = await ethers.provider.getCode(authRegistryAddress);
    if (code === "0x") {
      throw new Error(`No contract found at AuthRegistry address: ${authRegistryAddress}`);
    }
    console.log("✅ AuthRegistry contract code found");

    // Try to connect to AuthRegistry
    try {
      const authRegistryFactory = await ethers.getContractFactory("AuthRegistry");
      const authRegistry = authRegistryFactory.attach(authRegistryAddress);
      
      // Test basic function call
      const isAuthorized = await authRegistry.isAuthorized(deployer.address);
      console.log(`✅ AuthRegistry connection verified. Deployer authorized: ${isAuthorized}`);
      
      if (!isAuthorized) {
        console.warn("⚠️  Warning: Deployer is not authorized in AuthRegistry");
        console.log("💡 You may need to register this address first");
      }
    } catch (error) {
      console.warn("⚠️  Could not verify AuthRegistry authorization:", error.message);
      console.log("⏳ Continuing with deployment anyway...");
    }

    // Deploy Policy contract
    console.log("\n📄 Deploying Policy contract...");
    console.log("🔗 Using AuthRegistry:", authRegistryAddress);
    
    const PolicyFactory = await ethers.getContractFactory("Policies");
    
    console.log("⏳ Sending deployment transaction...");
    const policy = await PolicyFactory.deploy(authRegistryAddress, {
      gasLimit: 3000000 // Set explicit gas limit
    });
    
    console.log("⏳ Waiting for deployment confirmation...");
    console.log("📋 Deployment transaction hash:", policy.deploymentTransaction().hash);
    
    await policy.waitForDeployment();
    
    const policyAddress = await policy.getAddress();
    console.log("✅ Policy deployed to:", policyAddress);

    // Update deployed addresses
    deployedAddresses.Policies = policyAddress; // Use 'Policies' to match contract name
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
        console.log(`Expected: ${authRegistryAddress}`);
        console.log(`Got: ${authRegistryFromContract}`);
      }
    } catch (error) {
      console.error("❌ Deployment verification failed:", error.message);
      console.log("⏳ Contract might still be deploying, this is usually not critical");
    }

    // Get final deployment info
    const receipt = await ethers.provider.getTransactionReceipt(policy.deploymentTransaction().hash);
    if (receipt) {
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
      console.log("🧱 Deployed in block:", receipt.blockNumber);
    }

    // Show summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 POLICY CONTRACT DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`📄 Policy Contract Address: ${policyAddress}`);
    console.log(`🔗 AuthRegistry Address: ${authRegistryAddress}`);
    console.log(`🌐 Network: Sepolia (11155111)`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`🧱 Block Number: ${await ethers.provider.getBlockNumber()}`);
    console.log("=".repeat(60));
    
    console.log("\n💡 Next steps:");
    console.log("1. Update your policy.js script contract address");
    console.log("2. Test policy creation with: npx hardhat run scripts/test-policy.js --network sepolia");
    console.log("3. Check policies with: npx hardhat run scripts/checkPolicy.js --network sepolia");
    console.log(`4. Update frontend to use new address: ${policyAddress}`);

    return policyAddress;

  } catch (error) {
    console.error("💥 Deployment failed:", error);
    
    // Enhanced error handling
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log("\n💡 Insufficient Funds - Troubleshooting:");
      console.log("- Get test ETH from Sepolia faucet: https://sepoliafaucet.com/");
      console.log(`- Current balance: ${await ethers.provider.getBalance(deployer.address)} wei`);
      console.log("- Need at least 0.01 ETH for deployment");
    } else if (error.message.includes('nonce')) {
      console.log("\n💡 Nonce Issues - Troubleshooting:");
      console.log("- Reset your MetaMask account (Settings > Advanced > Reset Account)");
      console.log("- Or wait a few minutes and try again");
      console.log("- Check if you have pending transactions");
    } else if (error.message.includes('gas')) {
      console.log("\n💡 Gas Issues - Troubleshooting:");
      console.log("- Network might be congested, try again later");
      console.log("- Gas limit might be too low");
    } else if (error.message.includes('revert')) {
      console.log("\n💡 Contract Revert - Troubleshooting:");
      console.log("- Check if AuthRegistry address is correct");
      console.log("- Verify constructor parameters");
    }
    
    throw error;
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = { main };