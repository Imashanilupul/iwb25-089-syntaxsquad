const hre = require("hardhat");

async function main() {
  const Petitions = await hre.ethers.getContractFactory("Petitions");
  const petitions = await Petitions.deploy();
  console.log("Petitions deployed to:", petitions.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});