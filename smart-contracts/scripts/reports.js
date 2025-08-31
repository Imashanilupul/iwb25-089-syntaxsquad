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
  try {
    contractAddress = loadDeployedAddresses();
    if (!contractAddress) {
      throw new Error('Reports contract address not found in deployed-addresses.json');
    }
    const Reports = await ethers.getContractFactory("Reports");
    reports = await Reports.attach(contractAddress);
    signers = await ethers.getSigners();
    console.log('Reports contract attached at', contractAddress);
  } catch (e) {
    console.warn('Could not initialize on-chain Reports contract:', e.message || e);
    // rethrow so failures are visible during startup (consistent with petitions.js)
    throw e;
  }
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
  const { title, description, draftId } = req.body || {};
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Missing title or description' });
  }

  try {
    console.log('📤 Uploading report data to IPFS...');
    const titleCid = await uploadDescriptionToPinata(title);
    console.log('✅ Uploaded title CID:', titleCid);

    const descriptionCid = await uploadDescriptionToPinata(description);
    console.log('✅ Uploaded description CID:', descriptionCid);

  // evidence handling removed - contract and DB no longer store evidence


  // prefer a fresh read from deployed-addresses.json, fall back to the cached value
  const deployedContractAddress = loadDeployedAddresses() || contractAddress || null;
    const contractAbi = loadContractAbi();

    if (!deployedContractAddress) {
      console.error('No deployed Reports contract address found. Check deployed-addresses.json or contract deployment.');
      return res.status(500).json({ success: false, error: 'Reports contract address not found on server' });
    }
    if (!contractAbi) {
      console.error('No Reports contract ABI found in artifacts. Ensure contracts were compiled.');
      return res.status(500).json({ success: false, error: 'Reports contract ABI not available on server' });
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
    console.error('❌ Error preparing report:', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// Create a report: perform on-chain tx, wait for mining, then create DB record
router.post("/create-report", async (req, res) => {
  const {
    reportTitle,
    description,
    titleCid: providedTitleCid,
    descriptionCid: providedDescriptionCid,
    signerIndex = 0,
    walletAddress,
    priority = 'MEDIUM',
    assignedTo,
    userId,
  } = req.body || {};

  let titleCid = providedTitleCid;
  let descriptionCid = providedDescriptionCid;

  try {
  // If client provided a txHash, verify the on-chain receipt first and then create DB
    if (req.body && req.body.txHash) {
      const txHash = req.body.txHash;
      const provider = signers && signers[0] && signers[0].provider;
      let receipt = null;
      if (provider) {
        receipt = await provider.getTransactionReceipt(txHash);
      } else {
        // Try using default ethers provider if available
        try {
          const { ethers } = require('ethers');
          const defaultProvider = ethers.getDefaultProvider();
          receipt = await defaultProvider.getTransactionReceipt(txHash);
        } catch (e) {
          // ignore
        }
      }

      if (!receipt) {
        return res.status(202).json({ success: false, message: 'Transaction not yet mined', txHash });
      }

      if (receipt.status !== 1) {
        return res.status(400).json({ success: false, message: 'Transaction failed on-chain', txHash, receipt });
      }

      // Build payload for Ballerina backend using client-provided fields
      const ballerinaUrl = process.env.BALLERINA_API_BASE || 'http://localhost:8080';
      const payload = {
        report_title: reportTitle || req.body.reportTitle || null,
        description: description || req.body.description || null,
        priority: priority || req.body.priority || 'MEDIUM',
        assigned_to: assignedTo || req.body.assignedTo || null,
        user_id: userId || req.body.userId || null,
        wallet_address: walletAddress || req.body.walletAddress || null,
        tx_hash: txHash,
        block_number: req.body.blockNumber || receipt.blockNumber,
        blockchain_report_id: req.body.blockchainReportId || null,
        title_cid: titleCid || req.body.titleCid || null,
        description_cid: descriptionCid || req.body.descriptionCid || null,
      };

      try {
        const resp = await axios.post(`${ballerinaUrl}/api/reports`, payload, { headers: { 'Content-Type': 'application/json' } });
        return res.json({ success: true, message: 'On-chain verified and DB create succeeded', db: resp.data, txReceipt: receipt });
      } catch (dbErr) {
        console.error('Failed to create DB record after client on-chain tx:', dbErr.message || dbErr);
        return res.status(502).json({ success: false, message: 'On-chain succeeded but DB create failed', error: dbErr.message || String(dbErr), txReceipt: receipt });
      }
    }

    // Fallback: if no txHash provided, server will perform the on-chain tx and then create DB
    const signer = signers[signerIndex] || signers[0];
    if (!signer) return res.status(500).json({ success: false, error: 'No signer available' });

    // If CIDs weren't provided by client, upload text to IPFS like petitions flow
    if (!titleCid && reportTitle) {
      console.log('📤 Uploading report title to IPFS (server-side)...');
      titleCid = await uploadDescriptionToPinata(reportTitle);
      console.log('✅ Uploaded title CID:', titleCid);
    }
    if (!descriptionCid && description) {
      console.log('📤 Uploading report description to IPFS (server-side)...');
      descriptionCid = await uploadDescriptionToPinata(description);
      console.log('✅ Uploaded description CID:', descriptionCid);
    }

    // Ensure required CIDs exist
    if (!titleCid || !descriptionCid) {
      return res.status(400).json({ success: false, error: 'Missing titleCid or descriptionCid; provide text or CIDs' });
    }

  // Call the contract (two-argument createReport: titleCid, descriptionCid)
  const tx = await reports.connect(signer).createReport(titleCid, descriptionCid);
  const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      return res.status(400).json({ success: false, message: 'On-chain transaction failed', txHash: tx.hash, receipt });
    }

    // Build payload for Ballerina backend (match server expected keys)
    const ballerinaUrl = process.env.BALLERINA_API_BASE || 'http://localhost:8080';
    const payload = {
      report_title: reportTitle || null,
      description: description || null,
      priority: priority || 'MEDIUM',
      assigned_to: assignedTo || null,
      user_id: userId || null,
      wallet_address: walletAddress || (signer.address ? signer.address : null),
      tx_hash: tx.hash,
      block_number: receipt.blockNumber,
      blockchain_report_id: null,
      title_cid: titleCid,
      description_cid: descriptionCid,
    };

    try {
      const resp = await axios.post(`${ballerinaUrl}/api/reports`, payload, { headers: { 'Content-Type': 'application/json' } });
      return res.json({ success: true, message: 'On-chain and DB create succeeded', db: resp.data, txReceipt: receipt });
    } catch (dbErr) {
      console.error('Failed to create DB record after on-chain tx:', dbErr.message || dbErr);
      return res.status(502).json({ success: false, message: 'On-chain succeeded but DB create failed', error: dbErr.message || String(dbErr), txReceipt: receipt });
    }
  } catch (err) {
    console.error('create-report error', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
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

// NOTE: legacy notify endpoint removed to keep a single clear flow: on-chain tx then DB create

router.get("/report/:id", async (req, res) => {
  try {
    const report = await reports.getReport(req.params.id);
    
    // Convert BigInt values to strings for JSON serialization
      // Contract getReport returns: titleCid, descriptionCid, upvotes, downvotes, creator, resolved, createdAt, resolvedAt, removed
      const serializedReport = {
        titleCid: report[0],
        descriptionCid: report[1],
        upvotes: report[2].toString(),
        downvotes: report[3].toString(),
        creator: report[4],
        resolved: report[5],
        createdAt: report[6].toString(),
        resolvedAt: report[7].toString(),
        removed: report[8]
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

        // Contract getReport returns: titleCid, descriptionCid, upvotes, downvotes, creator, resolved, createdAt, resolvedAt, removed
        reportsData.push({
          id: i.toString(),
          titleCid: report[0],
          descriptionCid: report[1],
          upvotes: report[2].toString(),
          downvotes: report[3].toString(),
          creator: report[4],
          resolved: report[5],
          createdAt: report[6].toString(),
          resolvedAt: report[7].toString(),
          removed: report[8],
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
          upvotes: report[2].toString(),
          downvotes: report[3].toString(),
          creator: report[4],
          resolved: report[5],
          assignedTo: report[6],
          createdAt: report[7].toString(),
          resolvedAt: report[8].toString(),
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
