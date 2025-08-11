const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Policies contract...");

  // Get the AuthRegistry address (replace with actual deployed address)
  const authRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with actual AuthRegistry address
  
  const Policies = await ethers.getContractFactory("Policies");
  const policies = await Policies.deploy(authRegistryAddress);

  await policies.waitForDeployment();
  const contractAddress = await policies.getAddress();

  console.log("Policies contract deployed to:", contractAddress);
  console.log("Auth Registry address:", authRegistryAddress);

  // Verify the deployment
  const policyCount = await policies.policyCount();
  console.log("Initial policy count:", policyCount.toString());

  return {
    policies: contractAddress,
    authRegistry: authRegistryAddress
  };
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { main };
