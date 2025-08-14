const express = require("express");
const { ethers } = require("hardhat");
const { uploadDescriptionToPinata, getFromPinata } = require("./ipfs.js");

const router = express.Router();

const contractAddress = "0x5475D9bE5bbfa84392D15DA0cCdfF5d64339bf16"; // Replace with real
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
    // Upload title and description to IPFS via Pinata
    console.log("📤 Uploading title to IPFS...");
    const titleCid = await uploadDescriptionToPinata(title);
    
    console.log("📤 Uploading description to IPFS...");
    const descriptionCid = await uploadDescriptionToPinata(description);

    // Store CIDs on blockchain instead of actual text
    console.log("🔗 Storing CIDs on blockchain...");
    const tx = await petitions.connect(signers[signerIndex]).createPetition(titleCid, descriptionCid, requiredSignatures);
    const receipt = await tx.wait();

    let petitionId = await petitions.petitionCount();
    
    res.json({ 
      petitionId: petitionId.toString(),
      titleCid,
      descriptionCid,
      message: "Petition created successfully with IPFS storage"
    });
  } catch (err) {
    console.error("❌ Error creating petition:", err);
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
    console.log(`📖 Getting petition ${req.params.id} from blockchain...`);
    const petition = await petitions.getPetition(req.params.id);
    
    // Get the CIDs from blockchain
    const titleCid = petition[0];
    const descriptionCid = petition[1];
    
    console.log("📥 Retrieving title from IPFS using CID:", titleCid);
    console.log("📥 Retrieving description from IPFS using CID:", descriptionCid);
    
    // Retrieve actual data from IPFS using CIDs
    const title = await getFromPinata(titleCid);
    const description = await getFromPinata(descriptionCid);
    
    // Convert BigInt values to strings for JSON serialization
    const serializedPetition = {
      title: title,
      description: description,
      titleCid: titleCid,
      descriptionCid: descriptionCid,
      signaturesRequired: petition[2].toString(),
      signaturesCount: petition[3].toString(),
      creator: petition[4],
      completed: petition[5]
    };
    
    res.json(serializedPetition);
  } catch (err) {
    console.error("❌ Error retrieving petition:", err);
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