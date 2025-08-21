const express = require("express");
const { ethers } = require("hardhat");
const { uploadDescriptionToPinata, getFromPinata } = require("./ipfs.js");
const fs = require('fs');
const path = require('path');

const router = express.Router();

const contractAddress = "0xD8E110E021a9281b8ad7A6Cf93c2b14b3e3B2712"; // Replace with real Reports contract address
let reports;
let signers;

async function init() {
  const Reports = await ethers.getContractFactory("Reports");
  reports = await Reports.attach(contractAddress);
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
    const abiPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'report', 'reports.sol', 'Reports.json');
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
router.post('/prepare-report', async (req, res) => {
  const { title, description, evidenceHash, draftId } = req.body || {};
  if (!title || !description || !evidenceHash) {
    return res.status(400).json({ success: false, error: 'Missing title, description, or evidence hash' });
  }

  try {
    console.log('📤 Uploading report data to IPFS...');
    const titleCid = await uploadDescriptionToPinata(title);
    console.log('✅ Uploaded title CID:', titleCid);

    const descriptionCid = await uploadDescriptionToPinata(description);
    console.log('✅ Uploaded description CID:', descriptionCid);

    // Upload evidence hash to IPFS as well for additional security
    const evidenceHashCid = await uploadDescriptionToPinata(evidenceHash);
    console.log('✅ Uploaded evidence hash CID:', evidenceHashCid);

    const addresses = loadDeployedAddresses();
    const deployedContractAddress = addresses && addresses.Reports ? addresses.Reports : contractAddress;
    const contractAbi = loadContractAbi();

    if (!deployedContractAddress) {
      console.warn('No deployed Reports contract address found');
    }
    if (!contractAbi) {
      console.warn('No Reports contract ABI found in artifacts');
    }

    return res.json({
      success: true,
      draftId: draftId || null,
      titleCid,
      descriptionCid,
      evidenceHashCid,
      contractAddress: deployedContractAddress,
      contractAbi,
    });
  } catch (err) {
    console.error('❌ Error preparing report:', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

router.post("/create-report", async (req, res) => {
  const { titleCid, descriptionCid, evidenceHashCid, signerIndex } = req.body;
  try {
    const tx = await reports.connect(signers[signerIndex]).createReport(titleCid, descriptionCid, evidenceHashCid);
    const receipt = await tx.wait();

    let reportId = await reports.reportCount();
    res.json({ reportId: reportId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/upvote-report", async (req, res) => {
  const { reportId, signerIndex } = req.body;
  try {
    const tx = await reports.connect(signers[signerIndex]).upvoteReport(reportId);
    await tx.wait();
    res.json({ message: "Report upvoted!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/downvote-report", async (req, res) => {
  const { reportId, signerIndex } = req.body;
  try {
    const tx = await reports.connect(signers[signerIndex]).downvoteReport(reportId);
    await tx.wait();
    res.json({ message: "Report downvoted!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/remove-vote", async (req, res) => {
  const { reportId, signerIndex } = req.body;
  try {
    const tx = await reports.connect(signers[signerIndex]).removeVote(reportId);
    await tx.wait();
    res.json({ message: "Vote removed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/assign-report", async (req, res) => {
  const { reportId, assignTo, signerIndex } = req.body;
  try {
    const tx = await reports.connect(signers[signerIndex]).assignReport(reportId, assignTo);
    await tx.wait();
    res.json({ message: "Report assigned!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/resolve-report", async (req, res) => {
  const { reportId, signerIndex } = req.body;
  try {
    const tx = await reports.connect(signers[signerIndex]).resolveReport(reportId);
    await tx.wait();
    res.json({ message: "Report resolved!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/reopen-report", async (req, res) => {
  const { reportId, signerIndex } = req.body;
  try {
    const tx = await reports.connect(signers[signerIndex]).reopenReport(reportId);
    await tx.wait();
    res.json({ message: "Report reopened!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/report/:id", async (req, res) => {
  try {
    const report = await reports.getReport(req.params.id);
    
    // Convert BigInt values to strings for JSON serialization
    const serializedReport = {
      titleCid: report[0],
      descriptionCid: report[1],
      evidenceHashCid: report[2],
      upvotes: report[3].toString(),
      downvotes: report[4].toString(),
      creator: report[5],
      resolved: report[6],
      assignedTo: report[7],
      createdAt: report[8].toString(),
      resolvedAt: report[9].toString()
    };
    
    res.json(serializedReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/report-votes/:id", async (req, res) => {
  try {
    const votes = await reports.getReportVotes(req.params.id);
    
    // Convert BigInt values to strings for JSON serialization
    const serializedVotes = {
      upvotes: votes[0].toString(),
      downvotes: votes[1].toString(),
      netVotes: votes[2].toString(),
      totalVotes: votes[3].toString()
    };
    
    res.json(serializedVotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/user-vote/:id/:address", async (req, res) => {
  try {
    const userVote = await reports.getUserVote(req.params.id, req.params.address);
    res.json({ 
      hasUpvoted: userVote[0],
      hasDownvoted: userVote[1]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/reports-by-user/:address", async (req, res) => {
  try {
    const reportIds = await reports.getReportsByUser(req.params.address);
    
    // Convert BigInt array to string array
    const serializedIds = reportIds.map(id => id.toString());
    res.json({ reportIds: serializedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/reports-assigned-to/:address", async (req, res) => {
  try {
    const reportIds = await reports.getReportsAssignedTo(req.params.address);
    
    // Convert BigInt array to string array
    const serializedIds = reportIds.map(id => id.toString());
    res.json({ reportIds: serializedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all reports with pagination
router.get("/reports", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reportCount = await reports.reportCount();
    const totalReports = parseInt(reportCount.toString());
    
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + parseInt(limit), totalReports);
    
    const reportsData = [];
    
    for (let i = startIndex + 1; i <= endIndex; i++) {
      try {
        const report = await reports.getReport(i);
        const votes = await reports.getReportVotes(i);
        
        reportsData.push({
          id: i.toString(),
          titleCid: report[0],
          descriptionCid: report[1],
          evidenceHashCid: report[2],
          upvotes: report[3].toString(),
          downvotes: report[4].toString(),
          creator: report[5],
          resolved: report[6],
          assignedTo: report[7],
          createdAt: report[8].toString(),
          resolvedAt: report[9].toString(),
          netVotes: votes[2].toString(),
          totalVotes: votes[3].toString()
        });
      } catch (error) {
        // Skip if report doesn't exist
        continue;
      }
    }
    
    res.json({
      reports: reportsData,
      totalReports,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReports / limit),
      hasNextPage: endIndex < totalReports,
      hasPrevPage: page > 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reports with filtering
router.get("/reports/filter", async (req, res) => {
  try {
    const { resolved, assignedTo, creator, sortBy = 'newest' } = req.query;
    const reportCount = await reports.reportCount();
    const totalReports = parseInt(reportCount.toString());
    
    const filteredReports = [];
    
    for (let i = 1; i <= totalReports; i++) {
      try {
        const report = await reports.getReport(i);
        const votes = await reports.getReportVotes(i);
        
        // Apply filters
        if (resolved !== undefined && report[6] !== (resolved === 'true')) continue;
        if (assignedTo && report[7].toLowerCase() !== assignedTo.toLowerCase()) continue;
        if (creator && report[5].toLowerCase() !== creator.toLowerCase()) continue;
        
        filteredReports.push({
          id: i.toString(),
          titleCid: report[0],
          descriptionCid: report[1],
          evidenceHashCid: report[2],
          upvotes: report[3].toString(),
          downvotes: report[4].toString(),
          creator: report[5],
          resolved: report[6],
          assignedTo: report[7],
          createdAt: report[8].toString(),
          resolvedAt: report[9].toString(),
          netVotes: votes[2].toString(),
          totalVotes: votes[3].toString()
        });
      } catch (error) {
        // Skip if report doesn't exist
        continue;
      }
    }
    
    // Sort results
    if (sortBy === 'newest') {
      filteredReports.sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt));
    } else if (sortBy === 'oldest') {
      filteredReports.sort((a, b) => parseInt(a.createdAt) - parseInt(b.createdAt));
    } else if (sortBy === 'most_upvoted') {
      filteredReports.sort((a, b) => parseInt(b.upvotes) - parseInt(a.upvotes));
    } else if (sortBy === 'most_controversial') {
      filteredReports.sort((a, b) => parseInt(b.totalVotes) - parseInt(a.totalVotes));
    } else if (sortBy === 'net_votes') {
      filteredReports.sort((a, b) => parseInt(b.netVotes) - parseInt(a.netVotes));
    }
    
    res.json({ reports: filteredReports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
