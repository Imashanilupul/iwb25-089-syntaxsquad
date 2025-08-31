const express = require("express");
const { ethers } = require("hardhat");
const { uploadDescriptionToPinata, getFromPinata } = require("./ipfs.js");
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const router = express.Router();

let reports;
let signers;
let contractAddress;
function loadDeployedAddresses() {
  try {
    const p = path.join(__dirname, '..', 'deployed-addresses.json');
    if (fs.existsSync(p)) {
      const addresses = JSON.parse(fs.readFileSync(p, 'utf8'));
      return addresses.Reports || null;
    }
  } catch (e) {
    console.warn('Could not load deployed-addresses.json', e.message);
  }
  return null;
}
async function init() {
  contractAddress = loadDeployedAddresses();
  if (!contractAddress) {
    throw new Error('Reports contract address not found in deployed-addresses.json');
  }
  const Reports = await ethers.getContractFactory("Reports");
  reports = await Reports.attach(contractAddress);
  signers = await ethers.getSigners();
}
init();



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
    // After on-chain confirmation, update the backend DB via Ballerina server
    try {
      const ballerinaUrl = process.env.BALLERINA_API_BASE || 'http://localhost:8080';
      const resp = await axios.post(`${ballerinaUrl}/api/reports/${reportId}/resolve`);
      return res.json({ message: "Report resolved on-chain and DB updated", db: resp.data });
    } catch (dbErr) {
      // If DB update fails, still return success for the on-chain tx but indicate DB error
      console.error('Failed to update DB after on-chain resolve:', dbErr.message || dbErr);
      return res.status(500).json({ message: 'On-chain resolve succeeded but DB update failed', error: dbErr.message || String(dbErr) });
    }
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

// Endpoint: after a client-side (wallet) transaction confirmed, notify this service
// so it can validate the tx and create the DB row via the Ballerina backend.
router.post('/notify-create-report', async (req, res) => {
  const {
    reportTitle,
    description,
    priority,
    walletAddress,
    txHash,
    blockNumber,
    blockchainReportId,
    titleCid,
    descriptionCid,
    evidenceHashCid
  } = req.body || {};

  if (!txHash) {
    return res.status(400).json({ success: false, error: 'txHash is required' });
  }

  try {
    // Attempt to verify the transaction receipt using the first signer/provider
    const provider = signers && signers[0] && signers[0].provider;
    let receipt = null;
    if (provider) {
      receipt = await provider.getTransactionReceipt(txHash);
    }

    if (!receipt) {
      // If no receipt found, respond with 202 Accepted so client can retry later
      return res.status(202).json({ success: false, message: 'Transaction not yet mined', txHash });
    }

    if (receipt.status !== 1) {
      return res.status(400).json({ success: false, message: 'Transaction failed on-chain', txHash, receipt });
    }

    // Build payload for Ballerina backend
    const ballerinaUrl = process.env.BALLERINA_API_BASE || 'http://localhost:8080';
    const payload = {
      report_title: reportTitle,
      description: description,
      priority: priority || 'MEDIUM',
      wallet_address: walletAddress,
      tx_hash: txHash,
      block_number: blockNumber || receipt.blockNumber,
      blockchain_report_id: blockchainReportId || null,
      title_cid: titleCid || null,
      description_cid: descriptionCid || null,
      evidence_hash_cid: evidenceHashCid || null
    };

    try {
      const resp = await axios.post(`${ballerinaUrl}/api/reports`, payload, { headers: { 'Content-Type': 'application/json' } });
      return res.json({ success: true, message: 'DB created', db: resp.data, txReceipt: receipt });
    } catch (dbErr) {
      console.error('Failed to create DB record:', dbErr.message || dbErr);
      return res.status(500).json({ success: false, message: 'On-chain succeeded but DB create failed', error: dbErr.message || String(dbErr), txReceipt: receipt });
    }
  } catch (err) {
    console.error('notify-create-report error', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
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
