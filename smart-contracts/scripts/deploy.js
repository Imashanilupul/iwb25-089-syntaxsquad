const hre = require("hardhat");

async function main() {
  const Auth = await hre.ethers.getContractFactory("AuthRegistry");
  const auth = await Auth.deploy();
  await auth.deployed();
  console.log("AuthRegistry deployed to:", auth.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});