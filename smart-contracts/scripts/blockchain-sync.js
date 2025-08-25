const express = require("express");
const { ethers } = require("hardhat");
const { getFromPinata } = require("./ipfs.js");
const router = express.Router();

// Contract addresses on Sepolia
const CONTRACT_ADDRESSES = {
  AuthRegistry: "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9",
  Petitions: "0x1577FD3B3E54cFA368F858d542920A0fefBaf807", 
  Reports: "0xD8E110E021a9281b8ad7A6Cf93c2b14b3e3B2712",
  Policies: "0x6a957A0D571b3Ed50AFc02Ac62CC061C6c533138",
  Proposals: "0xff40F4C374c1038378c7044720B939a2a0219a2f",
  Project: "0x1770c50E6Bc8bbFB662c7ec45924aE986473b970"
};

// Get blockchain data for proposals within block range
router.get("/proposals/blockchain-data", async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.query;
    
    console.log(`🗳️ Getting proposals blockchain data from block ${fromBlock} to ${toBlock}`);
    
    // Get contract instance
    const Proposals = await ethers.getContractFactory("Proposals");
    const proposals = Proposals.attach(CONTRACT_ADDRESSES.Proposals);
    const connectedContract = proposals.connect(ethers.provider);
    
    // Get proposal count
    const proposalCount = await connectedContract.proposalCount();
    console.log(`📊 Found ${proposalCount.toString()} proposals in blockchain`);
    
    const proposalsData = [];
    
    // Get all proposals and fetch IPFS content
    for (let i = 1; i <= Number(proposalCount.toString()); i++) {
      try {
        const proposal = await connectedContract.getProposal(i);
        
        // Extract fields like your checkProposal.js
        const titleCid = proposal.titleCid || proposal[0];
        const shortDescriptionCid = proposal.shortDescriptionCid || proposal[1];
        const descriptionInDetailsCid = proposal.descriptionInDetailsCid || proposal[2];
        const yesVotes = proposal.yesVotes || proposal[3];
        const noVotes = proposal.noVotes || proposal[4];
        const creator = proposal.creator || proposal[5];
        const activeStatus = proposal.activeStatus !== undefined ? proposal.activeStatus : proposal[6];
        const expiredDate = proposal.expiredDate || proposal[7];
        const categoryId = proposal.categoryId || proposal[8];
        const createdAt = proposal.createdAt || proposal[9];
        const updatedAt = proposal.updatedAt || proposal[10];
        
        // Fetch actual content from IPFS using your Pinata setup
        console.log(`📥 Fetching IPFS content for proposal ${i}`);
        const title = await fetchIPFSContent(titleCid);
        const shortDescription = await fetchIPFSContent(shortDescriptionCid);
        const descriptionInDetails = await fetchIPFSContent(descriptionInDetailsCid);
        
        const proposalData = {
          blockchain_proposal_id: i,
          title: title,
          short_description: shortDescription,
          description_in_details: descriptionInDetails,
          yes_votes: Number(yesVotes.toString()),
          no_votes: Number(noVotes.toString()),
          creator_address: creator,
          active_status: Boolean(activeStatus),
          expired_date: new Date(Number(expiredDate.toString()) * 1000).toISOString(),
          category_id: Number(categoryId.toString()),
          created_by: 1, // Default system user
          created_at: new Date(Number(createdAt.toString()) * 1000).toISOString(),
          updated_at: new Date(Number(updatedAt.toString()) * 1000).toISOString()
        };
        
        proposalsData.push(proposalData);
        console.log(`✅ Processed proposal ${i}: ${title.substring(0, 50)}...`);
        
      } catch (error) {
        console.error(`❌ Error processing proposal ${i}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      fromBlock: parseInt(fromBlock),
      toBlock: parseInt(toBlock),
      proposals: proposalsData
    });
    
  } catch (error) {
    console.error("❌ Error getting proposals blockchain data:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to get proposals blockchain data" 
    });
  }
});

// Get blockchain data for petitions within block range
router.get("/petitions/blockchain-data", async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.query;
    
    console.log(`📝 Getting petitions blockchain data from block ${fromBlock} to ${toBlock}`);
    
    const Petitions = await ethers.getContractFactory("Petitions");
    const petitions = Petitions.attach(CONTRACT_ADDRESSES.Petitions);
    const connectedContract = petitions.connect(ethers.provider);
    
    const petitionCount = await connectedContract.petitionCount();
    console.log(`📊 Found ${petitionCount.toString()} petitions in blockchain`);
    
    const petitionsData = [];
    
    for (let i = 1; i <= Number(petitionCount.toString()); i++) {
      try {
        const petition = await connectedContract.getPetition(i);
        
        // Fetch IPFS content
        const title = await fetchIPFSContent(petition[0]);
        const description = await fetchIPFSContent(petition[1]);
        
        const petitionData = {
          blockchain_petition_id: i,
          title: title,
          description: description,
          required_signature_count: Number(petition[2].toString()),
          signature_count: Number(petition[3].toString()),
          creator_address: petition[4],
          is_completed: petition[5],
          status: petition[5] ? 'COMPLETED' : 'ACTIVE',
          creator_id: 1, // Default system user
          created_at: new Date().toISOString()
        };
        
        petitionsData.push(petitionData);
        console.log(`✅ Processed petition ${i}: ${title.substring(0, 50)}...`);
        
      } catch (error) {
        console.error(`❌ Error processing petition ${i}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      fromBlock: parseInt(fromBlock),
      toBlock: parseInt(toBlock),
      petitions: petitionsData
    });
    
  } catch (error) {
    console.error("❌ Error getting petitions blockchain data:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to get petitions blockchain data" 
    });
  }
});

// Get blockchain data for reports within block range
router.get("/reports/blockchain-data", async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.query;
    
    console.log(`📊 Getting reports blockchain data from block ${fromBlock} to ${toBlock}`);
    
    const Reports = await ethers.getContractFactory("Reports");
    const reports = Reports.attach(CONTRACT_ADDRESSES.Reports);
    const connectedContract = reports.connect(ethers.provider);
    
    const reportCount = await connectedContract.reportCount();
    console.log(`📊 Found ${reportCount.toString()} reports in blockchain`);
    
    const reportsData = [];
    
    for (let i = 1; i <= Number(reportCount.toString()); i++) {
      try {
        const report = await connectedContract.getReport(i);
        
        // Fetch IPFS content
        const title = await fetchIPFSContent(report[0]);
        const description = await fetchIPFSContent(report[1]);
        
        const reportData = {
          blockchain_report_id: i,
          report_title: title,
          description: description,
          priority: 'MEDIUM',
          upvotes: Number(report[3].toString()),
          downvotes: Number(report[4].toString()),
          creator_address: report[5],
          resolved_status: report[6],
          assigned_to: report[7],
          creation_time: Number(report[8].toString()),
          resolution_time: Number(report[9].toString()),
          user_id: 1, // Default system user
          evidence_hash: `blockchain_${i}`,
          created_time: new Date().toISOString()
        };
        
        reportsData.push(reportData);
        console.log(`✅ Processed report ${i}: ${title.substring(0, 50)}...`);
        
      } catch (error) {
        console.error(`❌ Error processing report ${i}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      fromBlock: parseInt(fromBlock),
      toBlock: parseInt(toBlock),
      reports: reportsData
    });
    
  } catch (error) {
    console.error("❌ Error getting reports blockchain data:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to get reports blockchain data" 
    });
  }
});

// Get blockchain data for policies within block range  
router.get("/policies/blockchain-data", async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.query;
    
    console.log(`📜 Getting policies blockchain data from block ${fromBlock} to ${toBlock}`);
    
    // Placeholder for now - you'll need to implement based on your Policy contract
    res.json({
      success: true,
      fromBlock: parseInt(fromBlock),
      toBlock: parseInt(toBlock),
      policies: []
    });
    
  } catch (error) {
    console.error("❌ Error getting policies blockchain data:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to get policies blockchain data" 
    });
  }
});

// Get blockchain data for projects within block range
router.get("/projects/blockchain-data", async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.query;
    
    console.log(`🏗️ Getting projects blockchain data from block ${fromBlock} to ${toBlock}`);
    
    // Placeholder for now - you'll need to implement based on your Project contract
    res.json({
      success: true,
      fromBlock: parseInt(fromBlock),
      toBlock: parseInt(toBlock),
      projects: []
    });
    
  } catch (error) {
    console.error("❌ Error getting projects blockchain data:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to get projects blockchain data" 
    });
  }
});

// Helper function to fetch IPFS content using your Pinata setup
async function fetchIPFSContent(cid) {
  if (!cid || cid.trim() === '') return '';
  
  try {
    const content = await getFromPinata(cid);
    
    // If content is JSON, extract the actual content
    if (typeof content === 'string' && content.startsWith('{')) {
      try {
        const parsedContent = JSON.parse(content);
        return parsedContent.content || content;
      } catch {
        return content;
      }
    }
    
    return content || `[IPFS: ${cid}]`;
  } catch (error) {
    console.error(`❌ Error fetching IPFS content for CID ${cid}:`, error.message);
    return `[IPFS Error: ${cid}]`;
  }
}

module.exports = router;
