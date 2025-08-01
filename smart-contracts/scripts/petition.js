const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const Petitions = await ethers.getContractFactory("Petitions");
  const petitions = await Petitions.attach(contractAddress);

  //Add user to destructuring
  const [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, user11, user12] = await ethers.getSigners();

  try {
    // 1. Create petition
    const tx1 = await petitions.connect(user1).createPetition(
      "Petition To Get Lawsuit against SLT",
      "Less goooooo",
      2
    );
    
    const receipt1 = await tx1.wait();

    let petitionId;
    
    // Method 1: Check petition events
    if (receipt1.events && receipt1.events.length > 0) {
      for (const event of receipt1.events) {
        if (event.event === "PetitionCreated") {
          petitionId = event.args.petitionId;
          break;
        }
      }
    }
    
    if (!petitionId && receipt1.logs) {
      const iface = new ethers.Interface([
        "event PetitionCreated(uint256 indexed petitionId, address indexed creator, string titleCid, string desCid, uint256 signaturesRequired)"
      ]);
      
      for (const log of receipt1.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed.name === "PetitionCreated") {
            petitionId = parsed.args.petitionId;
            break;
          }
        } catch (e) {
        }
      }
    }

    // Method 3: Get from contract state
    if (!petitionId) {
      petitionId = await petitions.petitionCount();
    }

    console.log(`Petition created with ID: ${petitionId}`);

    // 2. Sign by user2
    const tx2 = await petitions.connect(user2).signPetition(petitionId);
    await tx2.wait();
    console.log(`User2 signed petition ${petitionId}`);

    // 3. Sign by owner
    const tx3 = await petitions.connect(owner).signPetition(petitionId);
    await tx3.wait();
    console.log(`Owner signed petition ${petitionId}`);

    // 4. Fetch petition details
    const petition = await petitions.getPetition(petitionId);
    console.log("Petition details:", petition);

    // 5. Check if user2 has signed
    const hasSigned = await petitions.hasSigned(petitionId, user2.address);
    console.log(`User2 has signed: ${hasSigned}`);

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});