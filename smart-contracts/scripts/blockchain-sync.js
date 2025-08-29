const express = require("express");
const axios = require("axios");
require('dotenv').config(); // Add this to load .env file

// Database configuration from .env file
const DB_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ,
  restEndpoint: "/rest/v1"
};

// Create database HTTP client with proper headers
const dbClient = axios.create({
  baseURL: DB_CONFIG.supabaseUrl + DB_CONFIG.restEndpoint,
  headers: {
    'apikey': DB_CONFIG.serviceRoleKey,
    'Authorization': `Bearer ${DB_CONFIG.serviceRoleKey}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

let ethers;
let provider;
try {
  // Prefer Hardhat runtime if this script is run via `npx hardhat run` or similar
  const hh = require('hardhat');
  ethers = hh.ethers;
  provider = ethers.provider || hh.network.provider;
  console.log('Using Hardhat ethers provider');
} catch (err) {
  // Fallback to plain ethers and construct a provider that targets Sepolia.
  const ethersLib = require('ethers');
  ethers = ethersLib;

  const rpc = process.env.ETH_RPC_URL || process.env.ETHEREUM_RPC;
  const networkName = process.env.ETH_NETWORK || 'sepolia';

  if (rpc) {
    // If user provided a JSON-RPC URL, use it directly.
    provider = new ethers.JsonRpcProvider ? new ethers.JsonRpcProvider(rpc) : new ethers.providers.JsonRpcProvider(rpc);
    console.log('Using JSON-RPC provider ->', rpc);
  } else {
    // No RPC provided — attempt to use Alchemy/Infura keys if available, otherwise fallback to default provider.
    const alchemyKey = process.env.ALCHEMY_API_KEY || process.env.ALCHEMY_KEY || process.env.ALCHEMY;
    const infuraKey = process.env.INFURA_API_KEY || process.env.INFURA_KEY || process.env.INFURA;
    const etherscanKey = process.env.ETHERSCAN_API_KEY || process.env.ETHERSCAN_KEY || process.env.ETHERSCAN;

    const providerOptions = {};
    if (alchemyKey) providerOptions.alchemy = alchemyKey;
    if (infuraKey) providerOptions.infura = infuraKey;
    if (etherscanKey) providerOptions.etherscan = etherscanKey;

    try {
      // Try top-level getDefaultProvider (works in ethers v6 and v5 interoperability)
      if (typeof ethers.getDefaultProvider === 'function') {
        provider = ethers.getDefaultProvider(networkName, providerOptions);
      } else if (ethers.providers && typeof ethers.providers.getDefaultProvider === 'function') {
        provider = ethers.providers.getDefaultProvider(networkName, providerOptions);
      } else {
        throw new Error('No getDefaultProvider available on ethers');
      }
      console.log('Using default provider for network', networkName, 'with options', Object.keys(providerOptions));
    } catch (e) {
      // Final fallback to localhost RPC — this keeps behavior but will fail if no local node.
      const localRpc = 'http://localhost:8545';
      provider = new (ethers.JsonRpcProvider ? ethers.JsonRpcProvider : ethers.providers.JsonRpcProvider)(localRpc);
      console.warn('Could not create default provider, falling back to local RPC', localRpc, 'error:', e.message);
    }
  }
}
const { getFromPinata } = require("./ipfs.js");
const router = express.Router();

// Add timeout middleware for all routes
router.use((req, res, next) => {
  // Set request timeout to 15 minutes
  req.setTimeout(900000);
  res.setTimeout(900000);
  
  // Add CORS headers for all requests
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Helper function to add timeout to promises
function timeoutPromise(promise, timeout, name) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${name} fetch timeout after ${timeout}ms`)), timeout)
    )
  ]);
}

// Contract addresses on Sepolia
const fs = require('fs');
const path = require('path');
let CONTRACT_ADDRESSES = {};
try {
  const deployedPath = path.join(__dirname, '..', 'deployed-addresses.json');
  if (fs.existsSync(deployedPath)) {
    CONTRACT_ADDRESSES = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
    console.log('Loaded contract addresses from deployed-addresses.json');
  } else {
    throw new Error('deployed-addresses.json not found');
  }
} catch (e) {
  console.error('Error loading deployed-addresses.json:', e.message);
  // fallback to hardcoded addresses if needed
  // CONTRACT_ADDRESSES = {
  //   AuthRegistry: "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9",
  //   Petitions: "0x1577FD3B3E54cFA368F858d542920A0fefBaf807", 
  //   Reports: "0xD8E110E021a9281b8ad7A6Cf93c2b14b3e3B2712",
  //   Policies: "0x6a957A0D571b3Ed50AFc02Ac62CC061C6c533138",
  //   Proposals: "0xff40F4C374c1038378c7044720B939a2a0219a2f",
  //   Project: "0x1770c50E6Bc8bbFB662c7ec45924aE986473b970"
  // };
}

// If a deployed-addresses.json exists, prefer it (useful after deployments)
try {
  const fs = require('fs');
  const path = require('path');
  const deployedPath = path.join(__dirname, '..', 'deployed-addresses.json');
  if (fs.existsSync(deployedPath)) {
    const deployed = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
    Object.keys(deployed).forEach(k => {
      // allow keys like Policy/Policies etc
      if (deployed[k]) {
        // try to map common names
        if (k.toLowerCase().includes('policy')) CONTRACT_ADDRESSES.Policies = deployed[k];
        else if (k.toLowerCase().includes('proposal')) CONTRACT_ADDRESSES.Proposals = deployed[k];
        else if (k.toLowerCase().includes('petition')) CONTRACT_ADDRESSES.Petitions = deployed[k];
        else if (k.toLowerCase().includes('report')) CONTRACT_ADDRESSES.Reports = deployed[k];
        else if (k.toLowerCase().includes('project')) CONTRACT_ADDRESSES.Project = deployed[k];
        else if (k.toLowerCase().includes('auth')) CONTRACT_ADDRESSES.AuthRegistry = deployed[k];
      }
    });
    console.log('Loaded deployed addresses from', deployedPath);
  }
} catch (e) {
  console.warn('No deployed-addresses.json loaded:', e.message);
}

// Helper: obtain a contract instance connected to provider.
// Uses Hardhat's getContractFactory when available, otherwise tries to load ABI from artifacts.
async function getContractInstance(name, address) {
  if (!address) throw new Error('No address provided for ' + name);
  try {
    if (typeof ethers.getContractFactory === 'function') {
      const factory = await ethers.getContractFactory(name);
      const inst = factory.attach(address);
      return inst.connect(provider);
    }
  } catch (e) {
    // fall through to artifact approach
  }

  // Try to load artifact ABI from common Hardhat artifacts path
  try {
    const path = require('path');
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${name}.sol`, `${name}.json`);
    const art = require(artifactPath);
    return new ethers.Contract(address, art.abi, provider);
  } catch (e) {
    console.warn(`Could not load artifact for ${name}:`, e.message);
  }

  // As a last resort, create a contract with an empty ABI so callers can at least check code
  return new ethers.Contract(address, [], provider);
}

// Optimized data fetching functions
async function fetchProposalsOptimized(blocksBack) {
  console.log('🗳️ Starting optimized proposals fetch...');
  
  try {
    const connectedContract = await getContractInstance("Proposals", CONTRACT_ADDRESSES.Proposals);
    const proposalCount = await connectedContract.proposalCount();
    console.log(`📊 Found ${proposalCount.toString()} proposals in blockchain`);
    
    const proposalsData = [];
    const batchSize = 5; // Process in smaller batches to prevent timeouts
    
    for (let i = 1; i <= Number(proposalCount.toString()); i += batchSize) {
      const batch = [];
      const endIndex = Math.min(i + batchSize - 1, Number(proposalCount.toString()));
      
      for (let j = i; j <= endIndex; j++) {
        batch.push(
          timeoutPromise(
            processProposal(connectedContract, j),
            30000,
            `proposal-${j}`
          ).catch(error => {
            console.error(`❌ Error processing proposal ${j}:`, error.message);
            return null;
          })
        );
      }
      
      const results = await Promise.all(batch);
      proposalsData.push(...results.filter(result => result !== null));
      
      console.log(`✅ Processed proposals batch ${i}-${endIndex}`);
    }
    
    return proposalsData;
  } catch (error) {
    console.error("❌ Error in fetchProposalsOptimized:", error);
    throw error;
  }
}

async function processProposal(connectedContract, i) {
  const proposal = await connectedContract.getProposal(i);
  
  // Extract fields
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
  
  // Fetch IPFS content with timeout protection
  const [title, shortDescription, descriptionInDetails] = await Promise.all([
    timeoutPromise(fetchIPFSContent(titleCid), 10000, `title-${i}`),
    timeoutPromise(fetchIPFSContent(shortDescriptionCid), 10000, `short-desc-${i}`),
    timeoutPromise(fetchIPFSContent(descriptionInDetailsCid), 10000, `desc-${i}`)
  ]);
  
  return {
    id: i,
    title: title,
    short_description: shortDescription,
    description_in_details: descriptionInDetails,
    yes_votes: Number(yesVotes.toString()),
    no_votes: Number(noVotes.toString()),
    creator_address: creator,
    active_status: Boolean(activeStatus),
    expired_date: new Date(Number(expiredDate.toString()) * 1000).toISOString(),
    category_id: Number(categoryId.toString()),
    created_by: 1,
    created_at: new Date(Number(createdAt.toString()) * 1000).toISOString(),
    updated_at: new Date(Number(updatedAt.toString()) * 1000).toISOString()
  };
}

async function fetchPetitionsOptimized(blocksBack) {
  console.log('📝 Starting optimized petitions fetch...');
  
  try {
    const connectedContract = await getContractInstance("Petitions", CONTRACT_ADDRESSES.Petitions);
    const petitionCount = await connectedContract.petitionCount();
    console.log(`📊 Found ${petitionCount.toString()} petitions in blockchain`);
    
    const petitionsData = [];
    const batchSize = 5;
    
    for (let i = 1; i <= Number(petitionCount.toString()); i += batchSize) {
      const batch = [];
      const endIndex = Math.min(i + batchSize - 1, Number(petitionCount.toString()));
      
      for (let j = i; j <= endIndex; j++) {
        batch.push(
          timeoutPromise(
            processPetition(connectedContract, j),
            30000,
            `petition-${j}`
          ).catch(error => {
            console.error(`❌ Error processing petition ${j}:`, error.message);
            return null;
          })
        );
      }
      
      const results = await Promise.all(batch);
      petitionsData.push(...results.filter(result => result !== null));
      
      console.log(`✅ Processed petitions batch ${i}-${endIndex}`);
    }
    
    return petitionsData;
  } catch (error) {
    console.error("❌ Error in fetchPetitionsOptimized:", error);
    throw error;
  }
}

async function processPetition(connectedContract, i) {
  const petition = await connectedContract.getPetition(i);
  
  // Fetch IPFS content with timeout protection
  const [title, description] = await Promise.all([
    timeoutPromise(fetchIPFSContent(petition[0]), 10000, `petition-title-${i}`),
    timeoutPromise(fetchIPFSContent(petition[1]), 10000, `petition-desc-${i}`)
  ]);
  
  return {
    blockchain_petition_id: i,
    title: title,
    description: description,
    required_signature_count: Number(petition[2].toString()),
    signature_count: Number(petition[3].toString()),
    creator_address: petition[4],
    is_completed: petition[5],
    status: petition[5] ? 'COMPLETED' : 'ACTIVE',
    creator: 1,
    created_at: new Date().toISOString()
  };
}

async function fetchReportsOptimized(blocksBack) {
  console.log('📊 Starting optimized reports fetch...');
  
  try {
    const connectedContract = await getContractInstance("Reports", CONTRACT_ADDRESSES.Reports);
    const reportCount = await connectedContract.reportCount();
    console.log(`📊 Found ${reportCount.toString()} reports in blockchain`);
    
    const reportsData = [];
    const batchSize = 5;
    
    for (let i = 1; i <= Number(reportCount.toString()); i += batchSize) {
      const batch = [];
      const endIndex = Math.min(i + batchSize - 1, Number(reportCount.toString()));
      
      for (let j = i; j <= endIndex; j++) {
        batch.push(
          timeoutPromise(
            processReport(connectedContract, j),
            30000,
            `report-${j}`
          ).catch(error => {
            console.error(`❌ Error processing report ${j}:`, error.message);
            return null;
          })
        );
      }
      
      const results = await Promise.all(batch);
      reportsData.push(...results.filter(result => result !== null));
      
      console.log(`✅ Processed reports batch ${i}-${endIndex}`);
    }
    
    return reportsData;
  } catch (error) {
    console.error("❌ Error in fetchReportsOptimized:", error);
    throw error;
  }
}

async function processReport(connectedContract, i) {
  const report = await connectedContract.getReport(i);
  
  // Fetch IPFS content with timeout protection
  const [title, description] = await Promise.all([
    timeoutPromise(fetchIPFSContent(report[0]), 10000, `report-title-${i}`),
    timeoutPromise(fetchIPFSContent(report[1]), 10000, `report-desc-${i}`)
  ]);
  
  return {
    id: i,
    title: title,
    description: description,
    priority: 'MEDIUM',
    upvotes: Number(report[3].toString()),
    downvotes: Number(report[4].toString()),
    creator_address: report[5],
    resolved_status: report[6],
    assigned_to: report[7],
    creation_time: Number(report[8].toString()),
    resolution_time: Number(report[9].toString()),
    creator: 1,
    evidence_hash: `blockchain_${i}`,
    created_time: new Date().toISOString()
  };
}

async function fetchPoliciesOptimized(blocksBack) {
  console.log('📜 Starting optimized policies fetch...');
  
  try {
    const connectedContract = await getContractInstance('Policies', CONTRACT_ADDRESSES.Policies);
    if (typeof connectedContract.policyCount === 'function') {
      const policyCount = await connectedContract.policyCount();
      const policiesData = [];
      
      for (let i = 1; i <= Number(policyCount.toString()); i++) {
        try {
          const p = await timeoutPromise(
            connectedContract.getPolicy(i),
            15000,
            `policy-${i}`
          );
          policiesData.push({ id: i, raw: p });
        } catch (e) {
          console.warn(`Policy ${i} read error:`, e.message);
        }
      }
      
      return policiesData;
    }
    return [];
  } catch (error) {
    console.warn('Policies read skipped or failed:', error.message);
    return [];
  }
}

async function fetchProjectsOptimized(blocksBack) {
  console.log('🏗️ Starting optimized projects fetch...');
  
  try {
    const connectedContract = await getContractInstance('Project', CONTRACT_ADDRESSES.Project);
    if (typeof connectedContract.projectCount === 'function') {
      const projectCount = await connectedContract.projectCount();
      const projectsData = [];
      
      for (let i = 1; i <= Number(projectCount.toString()); i++) {
        try {
          const pj = await timeoutPromise(
            connectedContract.getProject(i),
            15000,
            `project-${i}`
          );
          projectsData.push({ id: i, raw: pj });
        } catch (e) {
          console.warn(`Project ${i} read error:`, e.message);
        }
      }
      
      return projectsData;
    }
    return [];
  } catch (error) {
    console.warn('Projects read skipped or failed:', error.message);
    return [];
  }
}

// Get blockchain data for proposals within block range (with timeout protection)
router.get("/proposals/blockchain-data", async (req, res) => {
  console.log('Proposals blockchain data request received');
  
  try {
    // Set response headers early
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true'
    });
    
    const { fromBlock, toBlock } = req.query;
    console.log(`🗳️ Getting proposals blockchain data from block ${fromBlock} to ${toBlock}`);
    
    // Add timeout protection
    const timeout = setTimeout(() => {
      console.log('Proposals request timeout protection triggered');
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }, 480000); // 8 minutes timeout
    
    const blocksBack = parseInt(req.query.blocksBack) || 10000;
    const proposalsData = await timeoutPromise(
      fetchProposalsOptimized(blocksBack),
      450000, // 7.5 minutes
      'proposals-fetch'
    );
    
    clearTimeout(timeout);
    
    const response = {
      success: true,
      fromBlock: parseInt(fromBlock),
      toBlock: parseInt(toBlock),
      proposals: proposalsData
    };
    
    if (!res.headersSent) {
      res.json(response);
    } else {
      res.end(JSON.stringify(response));
    }
    
  } catch (error) {
    console.error("❌ Error getting proposals blockchain data:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to get proposals blockchain data" 
      });
    }
  }
});

// Get blockchain data for petitions within block range (with timeout protection)
router.get("/petitions/blockchain-data", async (req, res) => {
  console.log('Petitions blockchain data request received');
  
  try {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true'
    });
    
    const { fromBlock, toBlock } = req.query;
    console.log(`📝 Getting petitions blockchain data from block ${fromBlock} to ${toBlock}`);
    
    const timeout = setTimeout(() => {
      console.log('Petitions request timeout protection triggered');
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }, 480000);
    
    const blocksBack = parseInt(req.query.blocksBack) || 10000;
    const petitionsData = await timeoutPromise(
      fetchPetitionsOptimized(blocksBack),
      450000,
      'petitions-fetch'
    );
    
    clearTimeout(timeout);
    
    const response = {
      success: true,
      fromBlock: parseInt(fromBlock),
      toBlock: parseInt(toBlock),
      petitions: petitionsData
    };
    
    if (!res.headersSent) {
      res.json(response);
    } else {
      res.end(JSON.stringify(response));
    }
    
  } catch (error) {
    console.error("❌ Error getting petitions blockchain data:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to get petitions blockchain data" 
      });
    }
  }
});

// Get blockchain data for reports within block range (with timeout protection)
router.get("/reports/blockchain-data", async (req, res) => {
  console.log('Reports blockchain data request received');
  
  try {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true'
    });
    
    const { fromBlock, toBlock } = req.query;
    console.log(`📊 Getting reports blockchain data from block ${fromBlock} to ${toBlock}`);
    
    const timeout = setTimeout(() => {
      console.log('Reports request timeout protection triggered');
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }, 480000);
    
    const blocksBack = parseInt(req.query.blocksBack) || 10000;
    const reportsData = await timeoutPromise(
      fetchReportsOptimized(blocksBack),
      450000,
      'reports-fetch'
    );
    
    clearTimeout(timeout);
    
    const response = {
      success: true,
      fromBlock: parseInt(fromBlock),
      toBlock: parseInt(toBlock),
      reports: reportsData
    };
    
    if (!res.headersSent) {
      res.json(response);
    } else {
      res.end(JSON.stringify(response));
    }
    
  } catch (error) {
    console.error("❌ Error getting reports blockchain data:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to get reports blockchain data" 
      });
    }
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

// ========================================
// DATABASE ACCESS FUNCTIONS
// ========================================

// Generic database query function
async function queryDatabase(table, options = {}) {
  try {
    let url = `/${table}`;
    const params = new URLSearchParams();
    
    if (options.select) params.append('select', options.select);
    if (options.filter) params.append(options.filter.column, `eq.${options.filter.value}`);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.order) params.append('order', options.order);
    
    if (params.toString()) url += '?' + params.toString();
    
    const response = await dbClient.get(url);
    return response.data;
  } catch (error) {
    console.error(`❌ Database query error for ${table}:`, error.response?.data || error.message);
    throw new Error(`Database query failed: ${error.response?.data?.message || error.message}`);
  }
}

// Create record in database
async function createRecord(table, data) {
  try {
    const response = await dbClient.post(`/${table}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Database create error for ${table}:`, error.response?.data || error.message);
    throw new Error(`Database create failed: ${error.response?.data?.message || error.message}`);
  }
}

// Update record in database
async function updateRecord(table, id, data, idColumn = 'id') {
  try {
    const response = await dbClient.patch(`/${table}?${idColumn}=eq.${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Database update error for ${table}:`, error.response?.data || error.message);
    throw new Error(`Database update failed: ${error.response?.data?.message || error.message}`);
  }
}

// Delete record from database
async function deleteRecord(table, id, idColumn = 'id') {
  try {
    const response = await dbClient.delete(`/${table}?${idColumn}=eq.${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Database delete error for ${table}:`, error.response?.data || error.message);
    throw new Error(`Database delete failed: ${error.response?.data?.message || error.message}`);
  }
}

// ========================================
// ENTITY-SPECIFIC DATABASE FUNCTIONS
// ========================================

// Proposals
async function getAllProposals() {
  return await queryDatabase('proposals', {
    select: 'id,title,short_description,description_in_details,yes_votes,no_votes,id,creator,expired_date,removed',
    order: 'id'
  });
}

async function createProposal(data) {
  const proposalData = {
    title: data.title?.content || data.title || '',
    short_description: data.short_description?.content || data.short_description || '',
    description_in_details: data.description_in_details?.content || data.description_in_details || '',
    yes_votes: data.yes_votes || 0,
    no_votes: data.no_votes || 0,
    id: data.id,
    creator: data.created_by || data.creator || null,
    expired_date: data.expired_date,
    active_status: data.active_status !== undefined ? data.active_status : true,
    category_id: data.category_id || null,
    removed: data.removed || false
  };
  return await createRecord('proposals', proposalData);
}

// Petitions
async function getAllPetitions() {
  return await queryDatabase('petitions', {
    select: 'id,title,description,required_signature_count,signature_count,creator,completed,removed',
    order: 'id'
  });
}

async function createPetition(data) {
  const petitionData = {
    title: data.title?.content || data.title || '',
    description: data.description?.content || data.description || '',
    required_signature_count: data.required_signature_count || 0,
    signature_count: data.signature_count || 0,
    blockchain_petition_id: data.blockchain_petition_id,
    creator: data.creator || null,
    deadline: data.deadline || null,
    completed: data.is_completed || false,
    removed: data.removed || false
  };
  
  return await createRecord('petitions', petitionData);
}

// Reports
async function getAllReports() {
  return await queryDatabase('reports', {
    select: 'id,title,description,priority,upvotes,downvotes,creator,resolved_status,evidence_hash,removed',
    order: 'id'
  });
}

async function createReport(data) {
  const reportData = {
    title: data.title?.content || data.title || '',
    description: data.description?.content || data.description || '',
    priority: data.priority || 'MEDIUM',
    upvotes: data.upvotes || 0,
    downvotes: data.downvotes || 0,
    id: data.id,
    creator: data.creator || null,
    resolved_status: data.resolved_status || false,
    evidence_hash: data.evidence_hash || `blockchain_${data.id}`,
    removed: data.removed || false
  };
  return await createRecord('reports', reportData);
}

async function createPolicy(data) {
  const policyData = {
    name: data.name || '',
    description: data.description || '',
    ministry: data.ministry || '',
    status: data.status || '',
    creator: data.creator || null,
    createdAt: data.createdAt || null,
    effectiveDate: data.effectiveDate || null,
    lastUpdated: data.lastUpdated || null,
    supportCount: data.supportCount || 0,
    isActive: data.isActive || false,
    removed: data.removed || false
  };
  return await createRecord('policies', policyData);
}

// Projects
async function getAllProjects() {
  return await queryDatabase('projects', {
    select: 'project_id,project_name,category_id,allocatedBudget,spentBudget,state,province,ministry,viewDetailsCid,status,createdAt,updatedAt,removed',
    order: 'project_id'
  });
}

async function createProject(data) {
  const projectData = {
    project_id: data.projectId || data.project_id,
    project_name: data.projectName || '',
    category_id: data.categoryId || '',
    allocatedBudget: data.allocatedBudget || 0,
    spentBudget: data.spentBudget || 0,
    state: data.state || '',
    province: data.province || '',
    ministry: data.ministry || '',
    viewDetailsCid: data.viewDetailsCid || '',
    status: data.status || '',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    removed: data.removed || false
  };
  return await createRecord('projects', projectData);
}
  

// ========================================
// FIELD COMPARISON FUNCTIONS  
function comparePolicyFields(dbPolicy, bcPolicy) {
  const updateData = {};
  let hasChanges = false;
  // Example field comparisons, adjust as needed for your schema
  if (dbPolicy.name !== bcPolicy.name) {
    updateData.name = bcPolicy.name;
    hasChanges = true;
  }
  if (dbPolicy.description !== bcPolicy.description) {
    updateData.description = bcPolicy.description;
    hasChanges = true;
  }
  if (dbPolicy.ministry !== bcPolicy.ministry) {
    updateData.ministry = bcPolicy.ministry;
    hasChanges = true;
  }
  if (dbPolicy.status !== bcPolicy.status) {
    updateData.status = bcPolicy.status;
    hasChanges = true;
  }
  if (dbPolicy.supportCount !== bcPolicy.supportCount) {
    updateData.supportCount = bcPolicy.supportCount;
    hasChanges = true;
  }
  if (dbPolicy.isActive !== bcPolicy.isActive) {
    updateData.isActive = bcPolicy.isActive;
    hasChanges = true;
  }
  if (dbPolicy.removed !== bcPolicy.removed) {
    updateData.removed = bcPolicy.removed;
    hasChanges = true;
  }
  return { hasChanges, updateData };
}

function compareProjectFields(dbProject, bcProject) {
  const updateData = {};
  let hasChanges = false;
  // Example field comparisons, adjust as needed for your schema
  if (dbProject.project_id !== bcProject.projectId) {
    updateData.project_id = bcProject.projectId;
    hasChanges = true;
  }
  if (dbProject.project_name !== bcProject.projectName) {
    updateData.project_name = bcProject.projectName;
    hasChanges = true;
  }
  if (dbProject.category_id !== bcProject.categoryId) {
    updateData.category_id = bcProject.categoryId;
    hasChanges = true;
  }
  if (dbProject.allocatedBudget !== bcProject.allocatedBudget) {
    updateData.allocatedBudget = bcProject.allocatedBudget;
    hasChanges = true;
  }
  if (dbProject.spentBudget !== bcProject.spentBudget) {
    updateData.spentBudget = bcProject.spentBudget;
    hasChanges = true;
  }
  if (dbProject.state !== bcProject.state) {
    updateData.state = bcProject.state;
    hasChanges = true;
  }
  if (dbProject.province !== bcProject.province) {
    updateData.province = bcProject.province;
    hasChanges = true;
  }
  if (dbProject.ministry !== bcProject.ministry) {
    updateData.ministry = bcProject.ministry;
    hasChanges = true;
  }
  if (dbProject.status !== bcProject.status) {
    updateData.status = bcProject.status;
    hasChanges = true;
  }
  if (dbProject.removed !== bcProject.removed) {
    updateData.removed = bcProject.removed;
    hasChanges = true;
  }
  return { hasChanges, updateData };
}
// ========================================

function compareProposalFields(dbProposal, bcProposal) {
  const updateData = {};
  let hasChanges = false;
  
  // Extract title content
  const bcTitle = bcProposal.title?.content || bcProposal.title || '';
  if (dbProposal.title !== bcTitle) {
    updateData.title = bcTitle;
    hasChanges = true;
  }
  
  // Extract description content
  const bcShortDesc = bcProposal.short_description?.content || bcProposal.short_description || '';
  if (dbProposal.short_description !== bcShortDesc) {
    updateData.short_description = bcShortDesc;
    hasChanges = true;
  }
  
  const bcDetails = bcProposal.description_in_details?.content || bcProposal.description_in_details || '';
  if (dbProposal.description_in_details !== bcDetails) {
    updateData.description_in_details = bcDetails;
    hasChanges = true;
  }
  
  // Vote counts
  if (dbProposal.yes_votes !== bcProposal.yes_votes) {
    updateData.yes_votes = bcProposal.yes_votes;
    hasChanges = true;
  }
  
  if (dbProposal.no_votes !== bcProposal.no_votes) {
    updateData.no_votes = bcProposal.no_votes;
    hasChanges = true;
  }
  
  // Active status
  if (dbProposal.active_status !== bcProposal.active_status) {
    updateData.active_status = bcProposal.active_status;
    hasChanges = true;
  }
  
  return { hasChanges, updateData };
}

function comparePetitionFields(dbPetition, bcPetition) {
  const updateData = {};
  let hasChanges = false;
  
  const bcTitle = bcPetition.title?.content || bcPetition.title || '';
  if (dbPetition.title !== bcTitle) {
    updateData.title = bcTitle;
    hasChanges = true;
  }
  
  const bcDesc = bcPetition.description?.content || bcPetition.description || '';
  if (dbPetition.description !== bcDesc) {
    updateData.description = bcDesc;
    hasChanges = true;
  }
  
  if (dbPetition.required_signature_count !== bcPetition.required_signature_count) {
    updateData.required_signature_count = bcPetition.required_signature_count;
    hasChanges = true;
  }
  
  if (dbPetition.signature_count !== bcPetition.signature_count) {
    updateData.signature_count = bcPetition.signature_count;
    hasChanges = true;
  }
  
  // Directly compare completed field
  if (dbPetition.completed !== bcPetition.is_completed) {
    updateData.completed = bcPetition.is_completed;
    hasChanges = true;
  }
  
  return { hasChanges, updateData };
}

function compareReportFields(dbReport, bcReport) {
  const updateData = {};
  let hasChanges = false;
  
  const bcTitle = bcReport.title?.content || bcReport.title || '';
  if (dbReport.title !== bcTitle) {
    updateData.title = bcTitle;
    hasChanges = true;
  }
  
  const bcDesc = bcReport.description?.content || bcReport.description || '';
  if (dbReport.description !== bcDesc) {
    updateData.description = bcDesc;
    hasChanges = true;
  }
  
  if (dbReport.priority !== bcReport.priority) {
    updateData.priority = bcReport.priority;
    hasChanges = true;
  }
  
  if (dbReport.upvotes !== bcReport.upvotes) {
    updateData.upvotes = bcReport.upvotes;
    hasChanges = true;
  }
  
  if (dbReport.downvotes !== bcReport.downvotes) {
    updateData.downvotes = bcReport.downvotes;
    hasChanges = true;
  }
  
  if (dbReport.resolved_status !== bcReport.resolved_status) {
    updateData.resolved_status = bcReport.resolved_status;
    hasChanges = true;
  }
  
  return { hasChanges, updateData };
}

// ========================================
// SYNC IMPLEMENTATION FUNCTIONS

// Two-phase sync for policies
async function syncPoliciesWithData(fromBlock, toBlock, blockchainPolicies) {
  console.log('📜 Starting policies sync with provided data...');
  let newCount = 0;
  let updatedCount = 0;
  let removedCount = 0;
  const errors = [];
  try {
    const dbPolicies = await getAllPolicies();
    console.log(`📜 Found ${blockchainPolicies.length} policies in blockchain and ${dbPolicies.length} in database`);
    const dbMap = new Map();
    const bcMap = new Map();
    dbPolicies.forEach(p => { if (p.id) dbMap.set(p.id, p); });
    blockchainPolicies.forEach(p => { if (p.id) bcMap.set(p.id, p); });
    // Phase 1: Check DB records
    for (const dbPolicy of dbPolicies) {
      if (!dbPolicy.id) continue;
      const bcId = dbPolicy.id;
      const bcPolicy = bcMap.get(bcId);
      if (!bcPolicy) {
        try {
          await deleteRecord('policies', dbPolicy.id);
          removedCount++;
          console.log(`🗑️ Removed policy ${bcId} (id: ${dbPolicy.id})`);
        } catch (error) {
          errors.push({ type: 'delete', id: bcId, error: error.message });
        }
        continue;
      }
      const needsUpdate = comparePolicyFields(dbPolicy, bcPolicy);
      if (needsUpdate.hasChanges) {
        try {
          await updateRecord('policies', dbPolicy.id, needsUpdate.updateData);
          updatedCount++;
          console.log(`🔄 Updated policy ${bcId} (id: ${dbPolicy.id})`);
        } catch (error) {
          errors.push({ type: 'update', id: bcId, error: error.message });
        }
      }
    }
    // Phase 2: Create new records
    for (const bcPolicy of blockchainPolicies) {
      const bcId = bcPolicy.id;
      if (!bcId || dbMap.has(bcId)) continue;
      try {
        await createPolicy(bcPolicy);
        newCount++;
        console.log(`✅ Created new policy ${bcId}`);
      } catch (error) {
        errors.push({ type: 'create', id: bcId, error: error.message });
      }
    }
  } catch (error) {
    console.error('❌ Error in policies sync:', error);
    errors.push({ type: 'general', error: error.message });
  }
  return {
    status: 'completed',
    fromBlock,
    toBlock,
    results: { new: newCount, updated: updatedCount, removed: removedCount, errors }
  };
}

// Two-phase sync for projects
async function syncProjectsWithData(fromBlock, toBlock, blockchainProjects) {
  console.log('🏗️ Starting projects sync with provided data...');
  let newCount = 0;
  let updatedCount = 0;
  let removedCount = 0;
  const errors = [];
  try {
    const dbProjects = await getAllProjects();
    console.log(`🏗️ Found ${blockchainProjects.length} projects in blockchain and ${dbProjects.length} in database`);
    const dbMap = new Map();
    const bcMap = new Map();
  dbProjects.forEach(p => { if (p.project_id) dbMap.set(p.project_id, p); });
  blockchainProjects.forEach(p => { if (p.projectId) bcMap.set(p.projectId, p); });
    // Phase 1: Check DB records
    for (const dbProject of dbProjects) {
      if (!dbProject.project_id) continue;
      const bcId = dbProject.project_id;
      const bcProject = bcMap.get(bcId);
      if (!bcProject) {
        try {
          await deleteRecord('projects', dbProject.project_id, 'project_id');
          removedCount++;
          console.log(`🗑️ Removed project ${bcId} (project_id: ${dbProject.project_id})`);
        } catch (error) {
          errors.push({ type: 'delete', id: bcId, error: error.message });
        }
        continue;
      }
      const needsUpdate = compareProjectFields(dbProject, bcProject);
      if (needsUpdate.hasChanges) {
        try {
          await updateRecord('projects', dbProject.project_id, needsUpdate.updateData, 'project_id');
          updatedCount++;
          console.log(`🔄 Updated project ${bcId} (project_id: ${dbProject.project_id})`);
        } catch (error) {
          errors.push({ type: 'update', id: bcId, error: error.message });
        }
      }
    }
    // Phase 2: Create new records
    for (const bcProject of blockchainProjects) {
      const bcId = bcProject.projectId;
      if (!bcId || dbMap.has(bcId)) continue;
      try {
        await createProject(bcProject);
        newCount++;
        console.log(`✅ Created new project ${bcId}`);
      } catch (error) {
        errors.push({ type: 'create', id: bcId, error: error.message });
      }
    }
  } catch (error) {
    console.error('❌ Error in projects sync:', error);
    errors.push({ type: 'general', error: error.message });
  }
  return {
    status: 'completed',
    fromBlock,
    toBlock,
    results: { new: newCount, updated: updatedCount, removed: removedCount, errors }
  };
}
// ========================================

// Two-phase sync for proposals
async function syncProposalsWithData(fromBlock, toBlock, blockchainProposals) {
  console.log('🗳️ Starting proposals sync with provided data...');
  
  let newCount = 0;
  let updatedCount = 0;
  let removedCount = 0;
  const errors = [];
  
  try {
    // Get existing DB data
    const dbProposals = await getAllProposals();
    console.log(`📊 Found ${blockchainProposals.length} proposals in blockchain and ${dbProposals.length} in database`);
    
    // Create lookup maps for O(1) access
    const dbMap = new Map();
    const bcMap = new Map();
    
    dbProposals.forEach(p => {
      if (p.id) {
        dbMap.set(p.id, p);
      }
    });
    
    blockchainProposals.forEach(p => {
      if (p.id) {
        bcMap.set(p.id, p);
      }
    });
    
    // Phase 1: Check DB records against blockchain
    for (const dbProposal of dbProposals) {
      if (!dbProposal.id) continue;
      
      const bcId = dbProposal.id;
      const bcProposal = bcMap.get(bcId);
      
      if (!bcProposal) {
        // Not found in blockchain - delete from DB
        try {
          await deleteRecord('proposals', dbProposal.id);
          removedCount++;
          console.log(`🗑️ Removed proposal ${bcId} (id: ${dbProposal.id}) - not found in blockchain`);
        } catch (error) {
          errors.push({ type: 'delete', id: bcId, error: error.message });
        }
        continue;
      }
      
      // Compare and update if needed
      const needsUpdate = compareProposalFields(dbProposal, bcProposal);
      
      if (needsUpdate.hasChanges) {
        try {
          await updateRecord('proposals', dbProposal.id, needsUpdate.updateData);
          updatedCount++;
          console.log(`🔄 Updated proposal ${bcId} (id: ${dbProposal.id})`);
        } catch (error) {
          errors.push({ type: 'update', id: bcId, error: error.message });
        }
      }
    }
    
    // Phase 2: Create new blockchain records not in DB
    for (const bcProposal of blockchainProposals) {
      const bcId = bcProposal.id;
      if (!bcId || dbMap.has(bcId)) continue;
      
      try {
        await createProposal(bcProposal);
        newCount++;
        console.log(`✅ Created new proposal ${bcId}`);
      } catch (error) {
        errors.push({ type: 'create', id: bcId, error: error.message });
      }
    }
    
  } catch (error) {
    console.error('❌ Error in proposals sync:', error);
    errors.push({ type: 'general', error: error.message });
  }
  
  return {
    status: 'completed',
    fromBlock,
    toBlock,
    results: { new: newCount, updated: updatedCount, removed: removedCount, errors }
  };
}

// Two-phase sync for petitions
async function syncPetitionsWithData(fromBlock, toBlock, blockchainPetitions) {
  console.log('📝 Starting petitions sync with provided data...');
  
  let newCount = 0;
  let updatedCount = 0;
  let removedCount = 0;
  const errors = [];
  
  try {
    const dbPetitions = await getAllPetitions();
    console.log(`📊 Found ${blockchainPetitions.length} petitions in blockchain and ${dbPetitions.length} in database`);
    
    const dbMap = new Map();
    const bcMap = new Map();
    
    dbPetitions.forEach(p => {
      if (p.blockchain_petition_id) {
        dbMap.set(p.blockchain_petition_id, p);
      }
    });
    
    blockchainPetitions.forEach(p => {
      if (p.blockchain_petition_id) {
        bcMap.set(p.blockchain_petition_id, p);
      }
    });
    
    // Phase 1: Check DB records
    for (const dbPetition of dbPetitions) {
      if (!dbPetition.blockchain_petition_id) continue;
      
      const bcId = dbPetition.blockchain_petition_id;
      const bcPetition = bcMap.get(bcId);
      
      if (!bcPetition) {
        try {
          await deleteRecord('petitions', dbPetition.id);
          removedCount++;
          console.log(`🗑️ Removed petition ${bcId} (id: ${dbPetition.id})`);
        } catch (error) {
          errors.push({ type: 'delete', id: bcId, error: error.message });
        }
        continue;
      }
      
      const needsUpdate = comparePetitionFields(dbPetition, bcPetition);
      
      if (needsUpdate.hasChanges) {
        try {
          await updateRecord('petitions', dbPetition.id, needsUpdate.updateData);
          updatedCount++;
          console.log(`🔄 Updated petition ${bcId} (id: ${dbPetition.id})`);
        } catch (error) {
          errors.push({ type: 'update', id: bcId, error: error.message });
        }
      }
    }
    
    // Phase 2: Create new records
    for (const bcPetition of blockchainPetitions) {
      const bcId = bcPetition.blockchain_petition_id;
      if (!bcId || dbMap.has(bcId)) continue;
      
      try {
        await createPetition(bcPetition);
        newCount++;
        console.log(`✅ Created new petition ${bcId}`);
      } catch (error) {
        errors.push({ type: 'create', id: bcId, error: error.message });
      }
    }
    
  } catch (error) {
    console.error('❌ Error in petitions sync:', error);
    errors.push({ type: 'general', error: error.message });
  }
  
  return {
    status: 'completed',
    fromBlock,
    toBlock,
    results: { new: newCount, updated: updatedCount, removed: removedCount, errors }
  };
}

// Two-phase sync for reports
async function syncReportsWithData(fromBlock, toBlock, blockchainReports) {
  console.log('📊 Starting reports sync with provided data...');
  
  let newCount = 0;
  let updatedCount = 0;
  let removedCount = 0;
  const errors = [];
  
  try {
    const dbReports = await getAllReports();
    console.log(`📊 Found ${blockchainReports.length} reports in blockchain and ${dbReports.length} in database`);
    
    const dbMap = new Map();
    const bcMap = new Map();
    
    dbReports.forEach(r => {
      if (r.id) {
        dbMap.set(r.id, r);
      }
    });
    
    blockchainReports.forEach(r => {
      if (r.id) {
        bcMap.set(r.id, r);
      }
    });
    
    // Phase 1: Check DB records
    for (const dbReport of dbReports) {
      if (!dbReport.id) continue;
      
      const bcId = dbReport.id;
      const bcReport = bcMap.get(bcId);
      
      if (!bcReport) {
        try {
          await deleteRecord('reports', dbReport.id, 'id');
          removedCount++;
          console.log(`🗑️ Removed report ${bcId} (id: ${dbReport.id})`);
        } catch (error) {
          errors.push({ type: 'delete', id: bcId, error: error.message });
        }
        continue;
      }
      
      const needsUpdate = compareReportFields(dbReport, bcReport);
      
      if (needsUpdate.hasChanges) {
        try {
          await updateRecord('reports', dbReport.id, needsUpdate.updateData, 'id');
          updatedCount++;
          console.log(`🔄 Updated report ${bcId} (id: ${dbReport.id})`);
        } catch (error) {
          errors.push({ type: 'update', id: bcId, error: error.message });
        }
      }
    }
    
    // Phase 2: Create new records
    for (const bcReport of blockchainReports) {
      const bcId = bcReport.id;
      if (!bcId || dbMap.has(bcId)) continue;
      
      try {
        await createReport(bcReport);
        newCount++;
        console.log(`✅ Created new report ${bcId}`);
      } catch (error) {
        errors.push({ type: 'create', id: bcId, error: error.message });
      }
    }
    
  } catch (error) {
    console.error('❌ Error in reports sync:', error);
    errors.push({ type: 'general', error: error.message });
  }
  
  return {
    status: 'completed',
    fromBlock,
    toBlock,
    results: { new: newCount, updated: updatedCount, removed: removedCount, errors }
  };
}

// ========================================
// COMPREHENSIVE SYNC ENDPOINT
// ========================================

// Main sync endpoint that implements the full two-phase sync procedure
router.post('/sync/execute', async (req, res) => {
  console.log('🚀 Starting comprehensive blockchain synchronization...');
  
  try {
    const { blocksBack = 1000, isFullSync = false } = req.body;
    
    // Calculate block range
    const latestBlock = await provider.getBlockNumber();
    const toBlock = Number(latestBlock);
    const fromBlock = Math.max(0, toBlock - blocksBack);
    
    console.log(`📊 Syncing blockchain data from block ${fromBlock} to ${toBlock}`);
    
    // Fetch all blockchain data once
    const [proposals, petitions, reports, policies, projects] = await Promise.all([
      fetchProposalsOptimized(blocksBack),
      fetchPetitionsOptimized(blocksBack),  
      fetchReportsOptimized(blocksBack),
      fetchPoliciesOptimized(blocksBack),
      fetchProjectsOptimized(blocksBack)
    ]);

    console.log('📋 Blockchain data fetched:', {
      proposals: proposals.length,
      petitions: petitions.length,
      reports: reports.length,
      policies: policies.length,
      projects: projects.length
    });

    // Execute all sync functions in parallel
    const syncResults = await Promise.allSettled([
      syncProposalsWithData(fromBlock, toBlock, proposals),
      syncPetitionsWithData(fromBlock, toBlock, petitions),
      syncReportsWithData(fromBlock, toBlock, reports),
      syncPoliciesWithData(fromBlock, toBlock, policies),
      syncProjectsWithData(fromBlock, toBlock, projects)
    ]);

    // Process results and calculate totals
    let totalNew = 0;
    let totalUpdated = 0;
    let totalRemoved = 0;
    let totalErrors = 0;
    const detailedResults = [];

    const entityNames = ['proposals', 'petitions', 'reports', 'policies', 'projects'];

    syncResults.forEach((result, index) => {
      const entityName = entityNames[index];

      if (result.status === 'fulfilled') {
        const res = result.value;
        totalNew += res.results.new;
        totalUpdated += res.results.updated;
        totalRemoved += res.results.removed;
        totalErrors += res.results.errors.length;

        detailedResults.push({
          type: entityName,
          result: res
        });

        console.log(`✅ ${entityName}: ${res.results.new} new, ${res.results.updated} updated, ${res.results.removed} removed`);
      } else {
        totalErrors++;
        detailedResults.push({
          type: entityName,
          error: result.reason.message
        });

        console.error(`❌ ${entityName} sync failed:`, result.reason.message);
      }
    });

    const finalResult = {
      status: 'completed',
      fromBlock,
      toBlock,
      isFullSync,
      summary: {
        totalNew,
        totalUpdated,
        totalRemoved,
        totalErrors
      },
      details: detailedResults,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Blockchain sync completed! New: ${totalNew}, Updated: ${totalUpdated}, Removed: ${totalRemoved}, Errors: ${totalErrors}`);

    res.json(finalResult);
    
  } catch (error) {
    console.error('❌ Error in comprehensive sync:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

// Aggregated endpoint: return all contract data in one response given how many blocks backwards
// Add this logging to the aggregated endpoint - around line 1360, after fetching each entity type

// Aggregated endpoint: return all contract data in one response given how many blocks backwards




