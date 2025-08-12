const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying all governance contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy AuthRegistry first
  console.log("\n1. Deploying AuthRegistry...");
  const AuthRegistry = await hre.ethers.getContractFactory("AuthRegistry");
  const authRegistry = await AuthRegistry.deploy();
  console.log("✅ AuthRegistry deployed to:", authRegistry.address);

  // Deploy Petitions contract
  console.log("\n2. Deploying Petitions...");
  const Petitions = await hre.ethers.getContractFactory("Petitions");
  const petitions = await Petitions.deploy(authRegistry.address);
  console.log("✅ Petitions deployed to:", petitions.address);

  // Deploy Reports contract
  console.log("\n3. Deploying Reports...");
  const Reports = await hre.ethers.getContractFactory("Reports");
  const reports = await Reports.deploy(authRegistry.address);
  console.log("✅ Reports deployed to:", reports.address);

  // Deploy Policies contract
  console.log("\n4. Deploying Policies...");
  const Policies = await hre.ethers.getContractFactory("Policies");
  const policies = await Policies.deploy(authRegistry.address);
  console.log("✅ Policies deployed to:", policies.address);

  // Deploy Proposals contract
  console.log("\n5. Deploying Proposals...");
  const Proposals = await hre.ethers.getContractFactory("Proposals");
  const proposals = await Proposals.deploy(authRegistry.address);
  console.log("✅ Proposals deployed to:", proposals.address);

  // Authorize the deployer
  console.log("\n6. Authorizing deployer address...");
  await authRegistry.authorizeUser(deployer.address);
  console.log("✅ Deployer authorized successfully");

  console.log("\n🎉 Complete Deployment Summary:");
  console.log("================================");
  console.log("AuthRegistry:  ", authRegistry.address);
  console.log("Petitions:     ", petitions.address);
  console.log("Reports:       ", reports.address);
  console.log("Policies:      ", policies.address);
  console.log("Proposals:     ", proposals.address);
  console.log("Authorized:    ", [deployer.address]);


  console.log("npx hardhat run scripts/test-reports-integration.js --network localhost");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
