const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Project contract...");

  // Get the deployer account
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Make sure PRIVATE_KEY is set in .env file");
  }
  
  const deployer = signers[0];
  console.log("Deploying with account:", deployer.address);

  // Get the contract factory
  const Project = await ethers.getContractFactory("Project");

  // You'll need to replace this with the actual AuthRegistry address
  // For testing, you can use a mock address or deploy AuthRegistry first
  const authRegistryAddress = "0x6869062fA4b81C0cA4fBF52E49E136A37AdC28Fd"; // Replace with actual AuthRegistry address

  // Deploy the contract
  const project = await Project.deploy(authRegistryAddress);
  await project.waitForDeployment();

  const projectAddress = await project.getAddress();
  console.log("Project contract deployed to:", projectAddress);

  // Verify the deployment
  console.log("Verifying deployment...");
  const projectCount = await project.projectCount();
  console.log("Initial project count:", projectCount.toString());

  const authRegistry = await project.authRegistry();
  console.log("Auth registry address:", authRegistry);

  return projectAddress;
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
