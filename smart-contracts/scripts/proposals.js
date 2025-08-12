const express = require("express");
const { ethers } = require("hardhat");
const router = express.Router();

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with real Proposals contract address
let proposals;
let signers;

async function init() {
  const Proposals = await ethers.getContractFactory("Proposals");
  proposals = await Proposals.attach(contractAddress);
  signers = await ethers.getSigners();
}
init();

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

router.post("/remove-vote", async (req, res) => {
  const { proposalId, signerIndex } = req.body;
  try {
    const tx = await proposals.connect(signers[signerIndex]).removeVote(proposalId);
    await tx.wait();
    res.json({ message: "Vote removed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/change-status", async (req, res) => {
  const { proposalId, newStatus, signerIndex } = req.body;
  try {
    const tx = await proposals.connect(signers[signerIndex]).changeProposalStatus(proposalId, newStatus);
    await tx.wait();
    res.json({ message: "Proposal status changed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/extend-deadline", async (req, res) => {
  const { proposalId, newExpiredDate, signerIndex } = req.body;
  try {
    const tx = await proposals.connect(signers[signerIndex]).extendProposalDeadline(proposalId, newExpiredDate);
    await tx.wait();
    res.json({ message: "Proposal deadline extended!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/expire-proposal", async (req, res) => {
  const { proposalId, signerIndex } = req.body;
  try {
    const tx = await proposals.connect(signers[signerIndex]).expireProposal(proposalId);
    await tx.wait();
    res.json({ message: "Proposal expired!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.get("/proposal-votes/:id", async (req, res) => {
  try {
    const votes = await proposals.getProposalVotes(req.params.id);
    
    // Convert BigInt values to strings for JSON serialization
    const serializedVotes = {
      yesVotes: votes[0].toString(),
      noVotes: votes[1].toString(),
      netVotes: votes[2].toString(),
      totalVotes: votes[3].toString(),
      yesPercentage: votes[4].toString()
    };
    
    res.json(serializedVotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/user-vote/:id/:address", async (req, res) => {
  try {
    const userVote = await proposals.getUserVote(req.params.id, req.params.address);
    res.json({ 
      hasVotedYes: userVote[0],
      hasVotedNo: userVote[1]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/proposals-by-user/:address", async (req, res) => {
  try {
    const proposalIds = await proposals.getProposalsByUser(req.params.address);
    
    // Convert BigInt array to string array
    const serializedIds = proposalIds.map(id => id.toString());
    res.json({ proposalIds: serializedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/proposals-by-category/:categoryId", async (req, res) => {
  try {
    const proposalIds = await proposals.getActiveProposalsByCategory(req.params.categoryId);
    
    // Convert BigInt array to string array
    const serializedIds = proposalIds.map(id => id.toString());
    res.json({ proposalIds: serializedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/expired-proposals", async (req, res) => {
  try {
    const proposalIds = await proposals.getExpiredProposals();
    
    // Convert BigInt array to string array
    const serializedIds = proposalIds.map(id => id.toString());
    res.json({ proposalIds: serializedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/is-expired/:id", async (req, res) => {
  try {
    const isExpired = await proposals.isProposalExpired(req.params.id);
    res.json({ isExpired });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all proposals with pagination
router.get("/proposals", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const proposalCount = await proposals.proposalCount();
    const totalProposals = parseInt(proposalCount.toString());
    
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + parseInt(limit), totalProposals);
    
    const proposalsData = [];
    
    for (let i = startIndex + 1; i <= endIndex; i++) {
      try {
        const proposal = await proposals.getProposal(i);
        const votes = await proposals.getProposalVotes(i);
        const isExpired = await proposals.isProposalExpired(i);
        
        proposalsData.push({
          id: i.toString(),
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
          updatedAt: proposal[10].toString(),
          netVotes: votes[2].toString(),
          totalVotes: votes[3].toString(),
          yesPercentage: votes[4].toString(),
          isExpired: isExpired
        });
      } catch (error) {
        // Skip if proposal doesn't exist
        continue;
      }
    }
    
    res.json({
      proposals: proposalsData,
      totalProposals,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProposals / limit),
      hasNextPage: endIndex < totalProposals,
      hasPrevPage: page > 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get proposals with filtering
router.get("/proposals/filter", async (req, res) => {
  try {
    const { 
      activeStatus, 
      categoryId, 
      creator, 
      expired, 
      sortBy = 'newest' 
    } = req.query;
    
    const proposalCount = await proposals.proposalCount();
    const totalProposals = parseInt(proposalCount.toString());
    
    const filteredProposals = [];
    
    for (let i = 1; i <= totalProposals; i++) {
      try {
        const proposal = await proposals.getProposal(i);
        const votes = await proposals.getProposalVotes(i);
        const isExpired = await proposals.isProposalExpired(i);
        
        // Apply filters
        if (activeStatus !== undefined && proposal[6] !== (activeStatus === 'true')) continue;
        if (categoryId && proposal[8].toString() !== categoryId) continue;
        if (creator && proposal[5].toLowerCase() !== creator.toLowerCase()) continue;
        if (expired !== undefined && isExpired !== (expired === 'true')) continue;
        
        filteredProposals.push({
          id: i.toString(),
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
          updatedAt: proposal[10].toString(),
          netVotes: votes[2].toString(),
          totalVotes: votes[3].toString(),
          yesPercentage: votes[4].toString(),
          isExpired: isExpired
        });
      } catch (error) {
        // Skip if proposal doesn't exist
        continue;
      }
    }
    
    // Sort results
    if (sortBy === 'newest') {
      filteredProposals.sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt));
    } else if (sortBy === 'oldest') {
      filteredProposals.sort((a, b) => parseInt(a.createdAt) - parseInt(b.createdAt));
    } else if (sortBy === 'most_yes_votes') {
      filteredProposals.sort((a, b) => parseInt(b.yesVotes) - parseInt(a.yesVotes));
    } else if (sortBy === 'most_total_votes') {
      filteredProposals.sort((a, b) => parseInt(b.totalVotes) - parseInt(a.totalVotes));
    } else if (sortBy === 'highest_yes_percentage') {
      filteredProposals.sort((a, b) => parseInt(b.yesPercentage) - parseInt(a.yesPercentage));
    } else if (sortBy === 'net_votes') {
      filteredProposals.sort((a, b) => parseInt(b.netVotes) - parseInt(a.netVotes));
    } else if (sortBy === 'expiring_soon') {
      // Filter out expired proposals and sort by expiration date
      const activeProposals = filteredProposals.filter(p => !p.isExpired);
      activeProposals.sort((a, b) => parseInt(a.expiredDate) - parseInt(b.expiredDate));
      return res.json({ proposals: activeProposals });
    }
    
    res.json({ proposals: filteredProposals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get proposal statistics
router.get("/statistics", async (req, res) => {
  try {
    const proposalCount = await proposals.proposalCount();
    const totalProposals = parseInt(proposalCount.toString());
    
    let activeProposals = 0;
    let expiredProposals = 0;
    let totalYesVotes = 0;
    let totalNoVotes = 0;
    let proposalsByCategory = {};
    
    for (let i = 1; i <= totalProposals; i++) {
      try {
        const proposal = await proposals.getProposal(i);
        const votes = await proposals.getProposalVotes(i);
        const isExpired = await proposals.isProposalExpired(i);
        
        if (proposal[6] && !isExpired) { // activeStatus && not expired
          activeProposals++;
        }
        
        if (isExpired) {
          expiredProposals++;
        }
        
        totalYesVotes += parseInt(votes[0].toString());
        totalNoVotes += parseInt(votes[1].toString());
        
        const categoryId = proposal[8].toString();
        proposalsByCategory[categoryId] = (proposalsByCategory[categoryId] || 0) + 1;
        
      } catch (error) {
        // Skip if proposal doesn't exist
        continue;
      }
    }
    
    res.json({
      totalProposals,
      activeProposals,
      expiredProposals,
      inactiveProposals: totalProposals - activeProposals - expiredProposals,
      totalYesVotes,
      totalNoVotes,
      totalVotes: totalYesVotes + totalNoVotes,
      proposalsByCategory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
