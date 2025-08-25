const express = require("express");
const { ethers } = require("hardhat");
const { uploadDescriptionToPinata, getFromPinata } = require("./ipfs.js");
const fs = require('fs');
const path = require('path');
const router = express.Router();

const contractAddress = "0x6a957A0D571b3Ed50AFc02Ac62CC061C6c533138"; // Your specified contract address
let policies;
let signers;

async function init() {
  const Policies = await ethers.getContractFactory("Policies");
  policies = await Policies.attach(contractAddress);
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
    const abiPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'policy', 'policy.sol', 'Policies.json');
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
router.post('/prepare-policy', async (req, res) => {
  const { name, description, viewFullPolicy, ministry, effectiveDate, walletAddress, draftId } = req.body || {};
  if (!name || !description || !viewFullPolicy || !ministry) {
    return res.status(400).json({ success: false, error: 'Missing required fields: name, description, viewFullPolicy, or ministry' });
  }

  try {
    console.log('📤 Uploading description to IPFS...');
    const descriptionCid = await uploadDescriptionToPinata(JSON.stringify({
      type: "policy_description", 
      content: description,
      timestamp: Date.now()
    }), `policy_description_${Date.now()}.json`);
    console.log('✅ Uploaded description CID:', descriptionCid);

    const addresses = loadDeployedAddresses();
    const deployedContractAddress = addresses && addresses.Policies ? addresses.Policies : contractAddress;
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
      descriptionCid,
      contractAddress: deployedContractAddress,
      contractAbi,
    });
  } catch (err) {
    console.error('❌ Error preparing policy:', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// Change this route from /create to /create-policy
router.post("/create-policy", async (req, res) => {
  const { name, description, viewFullPolicy, ministry, effectiveDate, signerIndex } = req.body;
  try {
    // Upload description to IPFS via Pinata
    console.log("📤 Uploading description to IPFS...");
    const descriptionCid = await uploadDescriptionToPinata(JSON.stringify({
      type: "policy_description", 
      content: description,
      timestamp: Date.now()
    }), `policy_description_${Date.now()}.json`);

    // Convert effectiveDate to timestamp if needed
    let effectiveTimestamp = effectiveDate || Math.floor(Date.now() / 1000);
    if (typeof effectiveDate === 'string' && effectiveDate) {
      effectiveTimestamp = Math.floor(new Date(effectiveDate).getTime() / 1000);
    }

    // Store data on blockchain
    console.log("🔗 Storing policy on blockchain...");
    const tx = await policies.connect(signers[signerIndex]).createPolicy(
      name,
      descriptionCid,
      viewFullPolicy,
      ministry,
      effectiveTimestamp
    );
    
    await tx.wait(); // Wait for transaction confirmation
    console.log("✅ Transaction confirmed:", tx.hash);

    res.json({ 
      success: true,
      descriptionCid,
      transactionHash: tx.hash,
      message: "Policy created successfully with IPFS storage"
    });
  } catch (err) {
    console.error("❌ Error creating policy:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Change this route from /update-status to /update-policy-status
router.post("/update-policy-status", async (req, res) => {
  const { policyId, newStatus, newEffectiveDate, signerIndex } = req.body;
  try {
    let effectiveTimestamp = newEffectiveDate || 0;
    if (typeof newEffectiveDate === 'string' && newEffectiveDate) {
      effectiveTimestamp = Math.floor(new Date(newEffectiveDate).getTime() / 1000);
    }

    const tx = await policies.connect(signers[signerIndex]).updatePolicyStatus(policyId, newStatus, effectiveTimestamp);
    await tx.wait();
    
    res.json({ 
      success: true,
      message: "Policy status updated successfully!",
      transactionHash: tx.hash
    });
  } catch (err) {
    console.error("❌ Error updating policy status:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    console.log(`� Getting policy ${req.params.id} from blockchain...`);
    const policy = await policies.getPolicy(req.params.id);
    
    // Get the description CID from blockchain
    const descriptionCid = policy[1]; // descriptionCid is at index 1
    
    console.log("📥 Retrieving description from IPFS using CID:", descriptionCid);
    
    // Retrieve actual description from IPFS using CID
    let actualDescription = "Description unavailable";
    try {
      const ipfsData = await getFromPinata(descriptionCid);
      if (ipfsData && typeof ipfsData === 'object') {
        actualDescription = ipfsData.content || ipfsData.description || "Description unavailable";
      } else if (typeof ipfsData === 'string') {
        try {
          const parsedData = JSON.parse(ipfsData);
          actualDescription = parsedData.content || parsedData.description || ipfsData;
        } catch {
          actualDescription = ipfsData;
        }
      }
    } catch (ipfsError) {
      console.warn("⚠️ Failed to fetch description from IPFS:", ipfsError.message);
    }
    
    // Convert BigInt values to strings for JSON serialization
    // Based on Solidity contract getPolicy function return order:
    const serializedPolicy = {
      id: req.params.id,
      name: policy[0],                    // string
      description: actualDescription,      // from IPFS
      descriptionCid: policy[1],          // string
      viewFullPolicy: policy[2],          // string
      ministry: policy[3],                // string
      status: policy[4],                  // string (no need to convert)
      creator: policy[5],                 // address (string)
      createdAt: policy[6].toString(),    // uint256 -> string
      effectiveDate: policy[7].toString(), // uint256 -> string
      lastUpdated: policy[8].toString(),  // uint256 -> string
      supportCount: policy[9].toString(), // uint256 -> string
      isActive: policy[10]                // bool
    };
    
    res.json(serializedPolicy);
  } catch (err) {
    console.error("❌ Error retrieving policy:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
