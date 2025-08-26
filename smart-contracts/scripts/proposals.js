const express = require("express");
const { ethers } = require("hardhat");
const { uploadDescriptionToPinata, getFromPinata } = require("./ipfs.js");
const router = express.Router();

const contractAddress = "0xff40F4C374c1038378c7044720B939a2a0219a2f"; // Replace with real Proposals contract address
let proposals;
let signers;

async function init() {
  const Proposals = await ethers.getContractFactory("Proposals");
  proposals = await Proposals.attach(contractAddress);
  signers = await ethers.getSigners();
}
init();

// Prepare proposal endpoint - uploads to IPFS and returns contract info
router.post("/prepare-proposal", async (req, res) => {
  try {
    const { 
      title, 
      shortDescription, 
      descriptionInDetails, 
      categoryId, 
      expiredDate, 
      walletAddress 
    } = req.body;

    // Validate required fields
    if (!title || !shortDescription || !descriptionInDetails || !categoryId || !expiredDate || !walletAddress) {
      return res.status(400).json({ 
        error: "Missing required fields: title, shortDescription, descriptionInDetails, categoryId, expiredDate, walletAddress" 
      });
    }

    // Upload content to IPFS using your actual functions
    console.log("Uploading proposal content to IPFS...");
    const [titleCid, shortDescriptionCid, descriptionInDetailsCid] = await Promise.all([
      uploadDescriptionToPinata(JSON.stringify({
        type: "proposal_title",
        content: title,
        timestamp: Date.now()
      }), `proposal_title_${Date.now()}.json`),
      uploadDescriptionToPinata(JSON.stringify({
        type: "proposal_short_description", 
        content: shortDescription,
        timestamp: Date.now()
      }), `proposal_short_desc_${Date.now()}.json`),
      uploadDescriptionToPinata(JSON.stringify({
        type: "proposal_description_details",
        content: descriptionInDetails, 
        timestamp: Date.now()
      }), `proposal_details_${Date.now()}.json`)
    ]);

    // Get contract ABI
    const contractAbi = proposals.interface.formatJson();

    // Return IPFS CIDs and contract information
    res.json({
      titleCid,
      shortDescriptionCid,
      descriptionInDetailsCid,
      contractAddress,
      contractAbi: JSON.parse(contractAbi),
      walletAddress,
      categoryId: parseInt(categoryId),
      expiredDate: parseInt(expiredDate)
    });

  } catch (error) {
    console.error("Error preparing proposal:", error);
    res.status(500).json({ error: error.message || "Failed to prepare proposal" });
  }
});

// Create proposal
router.post("/create-proposal", async (req, res) => {
  const { titleCid, shortDescriptionCid, descriptionInDetailsCid, categoryId, expiredDate, signerIndex } = req.body;
  try {
    const tx = await proposals.connect(signers[signerIndex]).createProposal(
      titleCid, 
      shortDescriptionCid, 
      descriptionInDetailsCid, 
      categoryId, 
      expiredDate
    );
    const receipt = await tx.wait();

    let proposalId = await proposals.proposalCount();
    res.json({ proposalId: proposalId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote YES on proposal
router.post("/vote-yes", async (req, res) => {
  const { proposalId, signerIndex } = req.body;
  try {
    const tx = await proposals.connect(signers[signerIndex]).voteYes(proposalId);
    await tx.wait();
    res.json({ message: "Voted YES on proposal!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote NO on proposal
router.post("/vote-no", async (req, res) => {
  const { proposalId, signerIndex } = req.body;
  try {
    const tx = await proposals.connect(signers[signerIndex]).voteNo(proposalId);
    await tx.wait();
    res.json({ message: "Voted NO on proposal!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit proposal status (activate/deactivate)
router.post("/edit-proposal", async (req, res) => {
  const { proposalId, newStatus, signerIndex } = req.body;
  try {
    const tx = await proposals.connect(signers[signerIndex]).changeProposalStatus(proposalId, newStatus);
    await tx.wait();
    res.json({ message: "Proposal status updated!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get proposal details
router.get("/proposal/:id", async (req, res) => {
  try {
    const proposal = await proposals.getProposal(req.params.id);
    
    // Convert BigInt values to strings for JSON serialization
    const serializedProposal = {
      titleCid: proposal[0],
      shortDescriptionCid: proposal[1],
      descriptionInDetailsCid: proposal[2],
      yesVotes: proposal[3].toString(),
      noVotes: proposal[4].toString(),
      creator: proposal[5],
      activeStatus: proposal[6],
      expiredDate: proposal[7].toString(),
      categoryId: proposal[8].toString(),
      createdAt: proposal[9].toString(),
      updatedAt: proposal[10].toString()
    };
    
    res.json(serializedProposal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
