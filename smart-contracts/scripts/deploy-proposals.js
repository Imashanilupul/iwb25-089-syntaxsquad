const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Proposals contract...");

  // Get the contract factory
  const Proposals = await ethers.getContractFactory("Proposals");

  // You'll need to replace this with the actual AuthRegistry address
  // For testing, you can use a mock address or deploy AuthRegistry first
  const authRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with actual AuthRegistry address

  // Deploy the contract
  const proposals = await Proposals.deploy(authRegistryAddress);
  await proposals.waitForDeployment();

  const proposalsAddress = await proposals.getAddress();
  console.log("Proposals contract deployed to:", proposalsAddress);

  // Verify the deployment
  console.log("Verifying deployment...");
  const proposalCount = await proposals.proposalCount();
  console.log("Initial proposal count:", proposalCount.toString());

  const authRegistry = await proposals.authRegistry();
  console.log("Auth registry address:", authRegistry);

  return proposalsAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((address) => {
    console.log("Deployment completed successfully!");
    console.log("Contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
