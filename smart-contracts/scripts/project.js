const express = require("express");
const { ethers } = require("hardhat");
const { uploadDescriptionToPinata, getFromPinata } = require("./ipfs.js");
const router = express.Router();

const contractAddress = "0x1770c50E6Bc8bbFB662c7ec45924aE986473b970"; // Replace with real Project contract address
let project;
let signers;

async function init() {
  const Project = await ethers.getContractFactory("Project");
  project = await Project.attach(contractAddress);
  signers = await ethers.getSigners();
}
init();

// Prepare project endpoint - uploads view details to IPFS and returns contract info
router.post("/prepare-project", async (req, res) => {
  try {
    const { 
      projectName,
      categoryName,
      allocatedBudget,
      state,
      province,
      ministry,
      viewDetails,
      status,
      walletAddress 
    } = req.body;

    // Validate required fields
    if (!projectName || !categoryName || !allocatedBudget || !state || !province || !ministry || !status || !walletAddress) {
      return res.status(400).json({ 
        error: "Missing required fields: projectName, categoryName, allocatedBudget, state, province, ministry, status, walletAddress" 
      });
    }

    // Upload view details to IPFS if provided
    let viewDetailsCid = "";
    if (viewDetails) {
      console.log("Uploading project view details to IPFS...");
      viewDetailsCid = await uploadDescriptionToPinata(JSON.stringify({
        type: "project_view_details",
        content: viewDetails,
        projectName: projectName,
        timestamp: Date.now()
      }), `project_details_${Date.now()}.json`);
    }

    // Get contract ABI
    const contractAbi = project.interface.formatJson();

    // Convert allocated budget to wei (assuming input is in ETH)
    const allocatedBudgetWei = ethers.parseEther(allocatedBudget.toString());

    // Return IPFS CID and contract information
    res.json({
      viewDetailsCid,
      contractAddress,
      contractAbi: JSON.parse(contractAbi),
      walletAddress,
      projectName,
      categoryName,
      allocatedBudget: allocatedBudgetWei.toString(),
      state,
      province,
      ministry,
      status
    });

  } catch (error) {
    console.error("Error preparing project:", error);
    res.status(500).json({ error: error.message || "Failed to prepare project" });
  }
});

// Create project
router.post("/create-project", async (req, res) => {
  const { 
    projectName,
    categoryName,
    allocatedBudget,
    state,
    province,
    ministry,
    viewDetailsCid,
    status,
    signerIndex 
  } = req.body;
  
  try {
    // Validate inputs
    if (!projectName || !categoryName || !allocatedBudget || !state || !province || !ministry || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tx = await project.connect(signers[signerIndex || 0]).createProject(
      projectName,
      categoryName,
      allocatedBudget,
      state,
      province,
      ministry,
      viewDetailsCid || "",
      status
    );
    const receipt = await tx.wait();

    let projectId = await project.projectCount();
    res.json({ 
      projectId: projectId.toString(),
      transactionHash: receipt.hash,
      gasUsed: receipt.gasUsed.toString()
    });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update project
router.put("/update-project/:id", async (req, res) => {
  const projectId = req.params.id;
  const {
    projectName,
    categoryName,
    state,
    province,
    ministry,
    viewDetailsCid,
    status,
    signerIndex
  } = req.body;

  try {
    // Validate inputs
    if (!projectName || !categoryName || !state || !province || !ministry || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tx = await project.connect(signers[signerIndex || 0]).updateProject(
      projectId,
      projectName,
      categoryName,
      state,
      province,
      ministry,
      viewDetailsCid || "",
      status
    );
    await tx.wait();
    
    res.json({ 
      message: "Project updated successfully!",
      projectId: projectId
    });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add spent budget
router.post("/add-spent-budget", async (req, res) => {
  const { projectId, amount, signerIndex } = req.body;
  
  try {
    if (!projectId || !amount) {
      return res.status(400).json({ error: "Missing required fields: projectId, amount" });
    }

    // Convert amount to wei if it's in ETH
    const amountWei = ethers.parseEther(amount.toString());
    
    const tx = await project.connect(signers[signerIndex || 0]).addSpentBudget(projectId, amountWei);
    await tx.wait();
    
    res.json({ 
      message: "Spent budget added successfully!",
      projectId: projectId,
      amount: amountWei.toString()
    });
  } catch (err) {
    console.error("Error adding spent budget:", err);
    res.status(500).json({ error: err.message });
  }
});

// Deduct spent budget
router.post("/deduct-spent-budget", async (req, res) => {
  const { projectId, amount, signerIndex } = req.body;
  
  try {
    if (!projectId || !amount) {
      return res.status(400).json({ error: "Missing required fields: projectId, amount" });
    }

    // Convert amount to wei if it's in ETH
    const amountWei = ethers.parseEther(amount.toString());
    
    const tx = await project.connect(signers[signerIndex || 0]).deductSpentBudget(projectId, amountWei);
    await tx.wait();
    
    res.json({ 
      message: "Spent budget deducted successfully!",
      projectId: projectId,
      amount: amountWei.toString()
    });
  } catch (err) {
    console.error("Error deducting spent budget:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update allocated budget
router.put("/update-allocated-budget/:id", async (req, res) => {
  const projectId = req.params.id;
  const { newAllocatedBudget, signerIndex } = req.body;

  try {
    if (!newAllocatedBudget) {
      return res.status(400).json({ error: "Missing required field: newAllocatedBudget" });
    }

    // Convert amount to wei if it's in ETH
    const budgetWei = ethers.parseEther(newAllocatedBudget.toString());

    const tx = await project.connect(signers[signerIndex || 0]).updateAllocatedBudget(projectId, budgetWei);
    await tx.wait();
    
    res.json({ 
      message: "Allocated budget updated successfully!",
      projectId: projectId,
      newAllocatedBudget: budgetWei.toString()
    });
  } catch (err) {
    console.error("Error updating allocated budget:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get project details
router.get("/project/:id", async (req, res) => {
  try {
    const projectData = await project.getProject(req.params.id);
    
    // Convert BigInt values to strings for JSON serialization and Wei to ETH
    const serializedProject = {
      projectId: projectData[0].toString(),
      projectName: projectData[1],
      categoryName: projectData[2],
      allocatedBudget: ethers.formatEther(projectData[3]),
      allocatedBudgetWei: projectData[3].toString(),
      spentBudget: ethers.formatEther(projectData[4]),
      spentBudgetWei: projectData[4].toString(),
      state: projectData[5],
      province: projectData[6],
      ministry: projectData[7],
      viewDetailsCid: projectData[8],
      status: projectData[9],
      creator: projectData[10],
      createdAt: projectData[11].toString(),
      updatedAt: projectData[12].toString(),
      createdAtDate: new Date(Number(projectData[11]) * 1000).toLocaleString(),
      updatedAtDate: new Date(Number(projectData[12]) * 1000).toLocaleString()
    };
    
    // Calculate additional metrics
    const remainingBudget = projectData[3] - projectData[4];
    serializedProject.remainingBudget = ethers.formatEther(remainingBudget);
    serializedProject.remainingBudgetWei = remainingBudget.toString();
    
    const budgetUtilization = projectData[3] > 0 ? (Number(projectData[4]) * 100) / Number(projectData[3]) : 0;
    serializedProject.budgetUtilization = budgetUtilization.toFixed(2);
    
    // Try to fetch view details from IPFS if CID exists
    if (serializedProject.viewDetailsCid && serializedProject.viewDetailsCid.length > 0) {
      try {
        const viewDetails = await getFromPinata(serializedProject.viewDetailsCid);
        serializedProject.viewDetails = JSON.parse(viewDetails);
      } catch (ipfsError) {
        console.warn("Could not fetch view details from IPFS:", ipfsError.message);
        serializedProject.viewDetails = null;
      }
    }
    
    res.json(serializedProject);
  } catch (err) {
    console.error("Error getting project:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get project budget information
router.get("/project/:id/budget", async (req, res) => {
  try {
    const budgetData = await project.getProjectBudget(req.params.id);
    
    const serializedBudget = {
      allocatedBudget: ethers.formatEther(budgetData[0]),
      allocatedBudgetWei: budgetData[0].toString(),
      spentBudget: ethers.formatEther(budgetData[1]),
      spentBudgetWei: budgetData[1].toString(),
      remainingBudget: ethers.formatEther(budgetData[2]),
      remainingBudgetWei: budgetData[2].toString(),
      budgetUtilization: budgetData[3].toString() + "%"
    };
    
    res.json(serializedBudget);
  } catch (err) {
    console.error("Error getting project budget:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get projects by user
router.get("/projects/user/:address", async (req, res) => {
  try {
    const projectIds = await project.getProjectsByUser(req.params.address);
    const projectIdsString = projectIds.map(id => id.toString());
    
    res.json({
      userAddress: req.params.address,
      projectIds: projectIdsString,
      totalProjects: projectIdsString.length
    });
  } catch (err) {
    console.error("Error getting projects by user:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get projects by category
router.get("/projects/category/:categoryName", async (req, res) => {
  try {
    const projectIds = await project.getProjectsByCategory(req.params.categoryName);
    const projectIdsString = projectIds.map(id => id.toString());
    
    res.json({
      categoryName: req.params.categoryName,
      projectIds: projectIdsString,
      totalProjects: projectIdsString.length
    });
  } catch (err) {
    console.error("Error getting projects by category:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get projects by status
router.get("/projects/status/:status", async (req, res) => {
  try {
    const projectIds = await project.getProjectsByStatus(req.params.status);
    const projectIdsString = projectIds.map(id => id.toString());
    
    res.json({
      status: req.params.status,
      projectIds: projectIdsString,
      totalProjects: projectIdsString.length
    });
  } catch (err) {
    console.error("Error getting projects by status:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get projects by state
router.get("/projects/state/:state", async (req, res) => {
  try {
    const projectIds = await project.getProjectsByState(req.params.state);
    const projectIdsString = projectIds.map(id => id.toString());
    
    res.json({
      state: req.params.state,
      projectIds: projectIdsString,
      totalProjects: projectIdsString.length
    });
  } catch (err) {
    console.error("Error getting projects by state:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get projects by ministry
router.get("/projects/ministry/:ministry", async (req, res) => {
  try {
    const projectIds = await project.getProjectsByMinistry(req.params.ministry);
    const projectIdsString = projectIds.map(id => id.toString());
    
    res.json({
      ministry: req.params.ministry,
      projectIds: projectIdsString,
      totalProjects: projectIdsString.length
    });
  } catch (err) {
    console.error("Error getting projects by ministry:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all projects (with pagination)
router.get("/projects", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startId = (page - 1) * limit + 1;
    const endId = Math.min(startId + limit - 1, await project.projectCount());

    const projects = [];
    
    for (let i = startId; i <= endId; i++) {
      try {
        const projectData = await project.getProject(i);
        projects.push({
          projectId: projectData[0].toString(),
          projectName: projectData[1],
          categoryName: projectData[2],
          allocatedBudget: ethers.formatEther(projectData[3]),
          spentBudget: ethers.formatEther(projectData[4]),
          state: projectData[5],
          province: projectData[6],
          ministry: projectData[7],
          status: projectData[9],
          creator: projectData[10],
          createdAt: new Date(Number(projectData[11]) * 1000).toLocaleString()
        });
      } catch (error) {
        console.warn(`Error loading project ${i}:`, error.message);
      }
    }

    const totalProjects = await project.projectCount();
    
    res.json({
      projects,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(Number(totalProjects) / limit),
        totalProjects: totalProjects.toString(),
        projectsPerPage: limit,
        hasNextPage: endId < Number(totalProjects),
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error("Error getting all projects:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
