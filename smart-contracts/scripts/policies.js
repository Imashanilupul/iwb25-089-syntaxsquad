const express = require("express");
const { ethers } = require("hardhat");
const router = express.Router();

const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Replace with real Policies contract address
let policies;
let signers;

// Policy Status enum mapping
const PolicyStatus = {
  DRAFT: 0,
  REVIEW: 1,
  APPROVED: 2,
  ACTIVE: 3,
  SUSPENDED: 4,
  EXPIRED: 5
};

const StatusNames = {
  0: "DRAFT",
  1: "REVIEW", 
  2: "APPROVED",
  3: "ACTIVE",
  4: "SUSPENDED",
  5: "EXPIRED"
};

async function init() {
  const Policies = await ethers.getContractFactory("Policies");
  policies = await Policies.attach(contractAddress);
  signers = await ethers.getSigners();
}
init();

router.post("/create-policy", async (req, res) => {
  const { name, descriptionCid, fullPolicyCid, ministry, effectiveDate, signerIndex } = req.body;
  try {
    const tx = await policies.connect(signers[signerIndex]).createPolicy(
      name, 
      descriptionCid, 
      fullPolicyCid, 
      ministry, 
      effectiveDate
    );
    const receipt = await tx.wait();

    let policyId = await policies.policyCount();
    res.json({ policyId: policyId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/update-policy-status", async (req, res) => {
  const { policyId, newStatus, signerIndex } = req.body;
  try {
    const statusValue = typeof newStatus === 'string' ? PolicyStatus[newStatus.toUpperCase()] : newStatus;
    const tx = await policies.connect(signers[signerIndex]).updatePolicyStatus(policyId, statusValue);
    await tx.wait();
    res.json({ message: "Policy status updated!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/update-policy-content", async (req, res) => {
  const { policyId, descriptionCid, fullPolicyCid, ministry, effectiveDate, signerIndex } = req.body;
  try {
    const tx = await policies.connect(signers[signerIndex]).updatePolicyContent(
      policyId,
      descriptionCid,
      fullPolicyCid,
      ministry || "",
      effectiveDate
    );
    await tx.wait();
    res.json({ message: "Policy content updated!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/endorse-policy", async (req, res) => {
  const { policyId, signerIndex } = req.body;
  try {
    const tx = await policies.connect(signers[signerIndex]).endorsePolicy(policyId);
    await tx.wait();
    res.json({ message: "Policy endorsed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/remove-endorsement", async (req, res) => {
  const { policyId, signerIndex } = req.body;
  try {
    const tx = await policies.connect(signers[signerIndex]).removeEndorsement(policyId);
    await tx.wait();
    res.json({ message: "Endorsement removed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/policy/:id", async (req, res) => {
  try {
    const policy = await policies.getPolicy(req.params.id);
    
    // Convert BigInt values to strings for JSON serialization
    const serializedPolicy = {
      name: policy[0],
      descriptionCid: policy[1],
      fullPolicyCid: policy[2],
      ministry: policy[3],
      status: StatusNames[policy[4]], // Convert enum to string
      statusValue: policy[4].toString(),
      effectiveDate: policy[5].toString(),
      creator: policy[6],
      createdTime: policy[7].toString(),
      updatedAt: policy[8].toString(),
      endorsementCount: policy[9].toString()
    };
    
    res.json(serializedPolicy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/user-endorsed/:id/:address", async (req, res) => {
  try {
    const hasEndorsed = await policies.hasUserEndorsed(req.params.id, req.params.address);
    res.json({ hasEndorsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/policies-by-user/:address", async (req, res) => {
  try {
    const policyIds = await policies.getPoliciesByUser(req.params.address);
    
    // Convert BigInt array to string array
    const serializedIds = policyIds.map(id => id.toString());
    res.json({ policyIds: serializedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/policies-by-status/:status", async (req, res) => {
  try {
    const statusValue = PolicyStatus[req.params.status.toUpperCase()];
    if (statusValue === undefined) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const policyIds = await policies.getPoliciesByStatus(statusValue);
    
    // Convert BigInt array to string array
    const serializedIds = policyIds.map(id => id.toString());
    res.json({ policyIds: serializedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/policies-by-ministry/:ministry", async (req, res) => {
  try {
    const policyIds = await policies.getPoliciesByMinistry(req.params.ministry);
    
    // Convert BigInt array to string array
    const serializedIds = policyIds.map(id => id.toString());
    res.json({ policyIds: serializedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/policy-name-exists/:name", async (req, res) => {
  try {
    const exists = await policies.policyNameExists(req.params.name);
    res.json({ exists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all policies with pagination
router.get("/policies", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const policyCount = await policies.policyCount();
    const totalPolicies = parseInt(policyCount.toString());
    
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + parseInt(limit), totalPolicies);
    
    const policiesData = [];
    
    for (let i = startIndex + 1; i <= endIndex; i++) {
      try {
        const policy = await policies.getPolicy(i);
        
        policiesData.push({
          id: i.toString(),
          name: policy[0],
          descriptionCid: policy[1],
          fullPolicyCid: policy[2],
          ministry: policy[3],
          status: StatusNames[policy[4]],
          statusValue: policy[4].toString(),
          effectiveDate: policy[5].toString(),
          creator: policy[6],
          createdTime: policy[7].toString(),
          updatedAt: policy[8].toString(),
          endorsementCount: policy[9].toString()
        });
      } catch (error) {
        // Skip if policy doesn't exist
        continue;
      }
    }
    
    res.json({
      policies: policiesData,
      totalPolicies,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPolicies / limit),
      hasNextPage: endIndex < totalPolicies,
      hasPrevPage: page > 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get policies with filtering and sorting
router.get("/policies/filter", async (req, res) => {
  try {
    const { 
      status, 
      ministry, 
      creator, 
      sortBy = 'newest',
      isActive = null // Filter for policies that are currently effective
    } = req.query;
    
    const policyCount = await policies.policyCount();
    const totalPolicies = parseInt(policyCount.toString());
    
    const filteredPolicies = [];
    const currentTime = Math.floor(Date.now() / 1000); // Current timestamp
    
    for (let i = 1; i <= totalPolicies; i++) {
      try {
        const policy = await policies.getPolicy(i);
        
        // Apply filters
        if (status && StatusNames[policy[4]] !== status.toUpperCase()) continue;
        if (ministry && policy[3].toLowerCase() !== ministry.toLowerCase()) continue;
        if (creator && policy[6].toLowerCase() !== creator.toLowerCase()) continue;
        
        // Filter for currently active policies
        if (isActive === 'true') {
          const effectiveDate = parseInt(policy[5].toString());
          if (StatusNames[policy[4]] !== 'ACTIVE' || effectiveDate > currentTime) continue;
        }
        
        filteredPolicies.push({
          id: i.toString(),
          name: policy[0],
          descriptionCid: policy[1],
          fullPolicyCid: policy[2],
          ministry: policy[3],
          status: StatusNames[policy[4]],
          statusValue: policy[4].toString(),
          effectiveDate: policy[5].toString(),
          creator: policy[6],
          createdTime: policy[7].toString(),
          updatedAt: policy[8].toString(),
          endorsementCount: policy[9].toString()
        });
      } catch (error) {
        // Skip if policy doesn't exist
        continue;
      }
    }
    
    // Sort results
    if (sortBy === 'newest') {
      filteredPolicies.sort((a, b) => parseInt(b.createdTime) - parseInt(a.createdTime));
    } else if (sortBy === 'oldest') {
      filteredPolicies.sort((a, b) => parseInt(a.createdTime) - parseInt(b.createdTime));
    } else if (sortBy === 'most_endorsed') {
      filteredPolicies.sort((a, b) => parseInt(b.endorsementCount) - parseInt(a.endorsementCount));
    } else if (sortBy === 'effective_date') {
      filteredPolicies.sort((a, b) => parseInt(a.effectiveDate) - parseInt(b.effectiveDate));
    } else if (sortBy === 'name') {
      filteredPolicies.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'ministry') {
      filteredPolicies.sort((a, b) => a.ministry.localeCompare(b.ministry));
    } else if (sortBy === 'updated') {
      filteredPolicies.sort((a, b) => parseInt(b.updatedAt) - parseInt(a.updatedAt));
    }
    
    res.json({ policies: filteredPolicies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get policy statistics
router.get("/policies/stats", async (req, res) => {
  try {
    const policyCount = await policies.policyCount();
    const totalPolicies = parseInt(policyCount.toString());
    
    const stats = {
      total: totalPolicies,
      byStatus: {},
      byMinistry: {},
      totalEndorsements: 0
    };
    
    // Initialize status counts
    Object.values(StatusNames).forEach(status => {
      stats.byStatus[status] = 0;
    });
    
    for (let i = 1; i <= totalPolicies; i++) {
      try {
        const policy = await policies.getPolicy(i);
        
        // Count by status
        const statusName = StatusNames[policy[4]];
        stats.byStatus[statusName]++;
        
        // Count by ministry
        const ministry = policy[3];
        stats.byMinistry[ministry] = (stats.byMinistry[ministry] || 0) + 1;
        
        // Total endorsements
        stats.totalEndorsements += parseInt(policy[9].toString());
        
      } catch (error) {
        // Skip if policy doesn't exist
        continue;
      }
    }
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available policy statuses
router.get("/policy-statuses", (req, res) => {
  res.json({
    statuses: Object.keys(PolicyStatus),
    statusDescriptions: {
      DRAFT: "Initial draft state - can be edited",
      REVIEW: "Under review - can be endorsed",
      APPROVED: "Approved for activation",
      ACTIVE: "Currently in effect",
      SUSPENDED: "Temporarily suspended",
      EXPIRED: "No longer in effect"
    }
  });
});

module.exports = router;
