const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying Reports contract with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // You'll need to replace this with your deployed AuthRegistry address
  const AUTH_REGISTRY_ADDRESS = "YOUR_AUTH_REGISTRY_ADDRESS_HERE";
  
  if (AUTH_REGISTRY_ADDRESS === "YOUR_AUTH_REGISTRY_ADDRESS_HERE") {
    console.log("⚠️  Please update AUTH_REGISTRY_ADDRESS in the script with your deployed AuthRegistry address");
    console.log("   You can deploy AuthRegistry first using: npx hardhat run scripts/deploy-with-auth.js");
    return;
  }

  // Deploy Reports contract
  const Reports = await hre.ethers.getContractFactory("Reports");
  const reports = await Reports.deploy(AUTH_REGISTRY_ADDRESS);
  await reports.deployed();
  
  console.log("Reports contract deployed to:", reports.address);

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Reports:", reports.address);
  console.log("AuthRegistry:", AUTH_REGISTRY_ADDRESS);
  
  console.log("\nNext steps:");
  console.log("1. Update your frontend with the Reports contract address");
  console.log("2. Authorize users through the AuthRegistry contract");
  console.log("3. Test report creation, voting, and resolution functions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
