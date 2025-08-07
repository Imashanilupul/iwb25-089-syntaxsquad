const express = require("express");
const { ethers } = require("hardhat");
const router = express.Router();

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with real
let petitions;
let signers;

async function init() {
  const Petitions = await ethers.getContractFactory("Petitions");
  petitions = await Petitions.attach(contractAddress);
  signers = await ethers.getSigners();
}
init();

router.post("/create-petition", async (req, res) => {
  const { title, description, requiredSignatures, signerIndex } = req.body;
  try {
    const tx = await petitions.connect(signers[signerIndex]).createPetition(title, description, requiredSignatures);
    const receipt = await tx.wait();

    let petitionId = await petitions.petitionCount();
    res.json({ petitionId: petitionId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sign-petition", async (req, res) => {
  const { petitionId, signerIndex } = req.body;
  try {
    const tx = await petitions.connect(signers[signerIndex]).signPetition(petitionId);
    await tx.wait();
    res.json({ message: "Signed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/petition/:id", async (req, res) => {
  try {
    const petition = await petitions.getPetition(req.params.id);
    
    // Convert BigInt values to strings for JSON serialization
    const serializedPetition = {
      titleCid: petition[0],
      desCid: petition[1],
      signaturesRequired: petition[2].toString(),
      signaturesCount: petition[3].toString(),
      creator: petition[4],
      completed: petition[5]
    };
    
    res.json(serializedPetition);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/has-signed/:id/:address", async (req, res) => {
  try {
    const result = await petitions.hasSigned(req.params.id, req.params.address);
    res.json({ hasSigned: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;