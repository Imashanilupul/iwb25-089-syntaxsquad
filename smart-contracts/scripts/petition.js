const express = require("express");
const { ethers } = require("hardhat");
const { uploadDescriptionToPinata, getFromPinata } = require("./ipfs.js");
const fs = require('fs');
const path = require('path');

const router = express.Router();

const contractAddress = "0x1577FD3B3E54cFA368F858d542920A0fefBaf807"; // Replace with real
let petitions;
let signers;

async function init() {
  const Petitions = await ethers.getContractFactory("Petitions");
  petitions = await Petitions.attach(contractAddress);
  signers = await ethers.getSigners();
}
init();

function loadDeployedAddresses() {
  try {
    const p = path.join(__dirname, '..', 'deployed-addresses.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load deployed-addresses.json', e.message);
  }
  return null;
}

function loadContractAbi() {
  try {
    // Path to compiled artifact produced by Hardhat
    const abiPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'petition', 'petitions.sol', 'Petitions.json');
    if (fs.existsSync(abiPath)) {
      const json = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
      return json.abi;
    }
  } catch (e) {
    console.warn('Could not load contract ABI:', e.message);
  }
  return null;
}

// New endpoint: prepare data for frontend-signed transaction
router.post('/prepare-petition', async (req, res) => {
  const { title, description, requiredSignatures, walletAddress, draftId } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Missing title or description' });
  }

  try {
    console.log('📤 Uploading title to IPFS...');
    const titleCid = await uploadDescriptionToPinata(title);
    console.log('✅ Uploaded title CID:', titleCid);

    console.log('📤 Uploading description to IPFS...');
    const descriptionCid = await uploadDescriptionToPinata(description);
    console.log('✅ Uploaded description CID:', descriptionCid);

    const addresses = loadDeployedAddresses();
    const deployedContractAddress = addresses && addresses.Petitions ? addresses.Petitions : contractAddress;
    const contractAbi = loadContractAbi();

    if (!deployedContractAddress) {
      console.warn('No deployed contract address found');
    }
    if (!contractAbi) {
      console.warn('No contract ABI found in artifacts');
    }

    return res.json({
      success: true,
      draftId: draftId || null,
      titleCid,
      descriptionCid,
      contractAddress: deployedContractAddress,
      contractAbi,
    });
  } catch (err) {
    console.error('❌ Error preparing petition:', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

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
    console.log(tx);

    let petitionId =  1;

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