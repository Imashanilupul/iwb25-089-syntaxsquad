const hre = require("hardhat");
//Deploy contract to local blockchain
async function main() {
  const Petitions = await hre.ethers.getContractFactory("Petitions");
  const petitions = await Petitions.deploy();
  console.log("Petitions deployed to:", petitions.target);
  const Auth = await hre.ethers.getContractFactory("AuthRegistry");
  const auth = await Auth.deploy();
  console.log("AuthReg deployed to:", auth.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});