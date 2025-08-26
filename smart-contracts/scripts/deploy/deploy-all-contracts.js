const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying all governance contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy AuthRegistry first
  console.log("\n1. Deploying AuthRegistry...");
  const AuthRegistry = await hre.ethers.getContractFactory("AuthRegistry");
  const authRegistry = await AuthRegistry.deploy();
  await authRegistry.waitForDeployment();
  const authRegistryAddress = await authRegistry.getAddress();
  console.log("✅ AuthRegistry deployed to:", authRegistryAddress);

  // // Deploy Petitions contract
  console.log("\n2. Deploying Petitions...");
  const Petitions = await hre.ethers.getContractFactory("Petitions");
  const petitions = await Petitions.deploy(authRegistryAddress);
  await petitions.waitForDeployment();
  const petitionsAddress = await petitions.getAddress();
  console.log("✅ Petitions deployed to:", petitionsAddress);

  // // Deploy Reports contract
  console.log("\n3. Deploying Reports...");
  const Reports = await hre.ethers.getContractFactory("Reports");
  const reports = await Reports.deploy(authRegistryAddress);
  await reports.waitForDeployment();
  const reportsAddress = await reports.getAddress();
  console.log("✅ Reports deployed to:", reportsAddress);

  // Deploy Policies contract
  console.log("\n4. Deploying Policies...");
  const Policies = await hre.ethers.getContractFactory("Policies");
  const policies = await Policies.deploy(authRegistryAddress);
  await policies.waitForDeployment();
  const policiesAddress = await policies.getAddress();
  console.log("✅ Policies deployed to:", policiesAddress);

  // Deploy Proposals contract
  console.log("\n5. Deploying Proposals...");
  const Proposals = await hre.ethers.getContractFactory("Proposals");
  const proposals = await Proposals.deploy(authRegistryAddress);
  await proposals.waitForDeployment();
  const proposalsAddress = await proposals.getAddress();
  console.log("✅ Proposals deployed to:", proposalsAddress);

  // Deploy Project contract
  console.log("\n6. Deploying Project...");
  const Project = await hre.ethers.getContractFactory("Project");
  const project = await Project.deploy(authRegistryAddress);
  await project.waitForDeployment();
  const projectAddress = await project.getAddress();
  console.log("✅ Project deployed to:", projectAddress);

  // Authorize the deployer as admin
  console.log("\n7. Authorizing deployer address as admin...");
  await authRegistry.authorizeAdmin(deployer.address);
  console.log("✅ Deployer authorized as admin successfully");

  console.log("\n🎉 Complete Deployment Summary:");
  console.log("================================");
  console.log("AuthRegistry:  ", authRegistryAddress);
  console.log("Petitions:     ", petitionsAddress);
  console.log("Reports:       ", reportsAddress);
  console.log("Policies:      ", policiesAddress);
  console.log("Proposals:     ", proposalsAddress);
  console.log("Project:       ", projectAddress);
  console.log("Admin User:    ", [deployer.address]);

  console.log("\nTo test the integration, run:");
  console.log("npx hardhat run scripts/test-reports-integration.js --network localhost");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });