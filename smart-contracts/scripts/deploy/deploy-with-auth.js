const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy AuthRegistry first
  const AuthRegistry = await hre.ethers.getContractFactory("AuthRegistry");
  const authRegistry = await AuthRegistry.deploy();
  
  console.log("AuthRegistry deployed to:", authRegistry.address);

  // Deploy Petitions contract with AuthRegistry address
  const Petitions = await hre.ethers.getContractFactory("Petitions");
  const petitions = await Petitions.deploy(authRegistry.address);
  await petitions.deployed();
  
  console.log("Petitions deployed to:", petitions.address);

  // Authorize the deployer (or specific addresses) to interact with petitions
  console.log("Authorizing deployer address...");
  await authRegistry.authorizeUser(deployer.address);
  console.log("Deployer authorized successfully");

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("AuthRegistry:", authRegistry.address);
  console.log("Petitions:", petitions.address);
  console.log("Authorized Users:", [deployer.address]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
