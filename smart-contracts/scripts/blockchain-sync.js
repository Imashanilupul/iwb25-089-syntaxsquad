const express = require("express");
const axios = require("axios");
require('dotenv').config(); // Add this to load .env file

// Environment variables
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
const LOCAL_RPC_URL = process.env.LOCAL_RPC_URL || 'http://localhost:8545';

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
      const localRpc = LOCAL_RPC_URL;
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
  res.header('Access-Control-Allow-Origin', FRONTEND_BASE_URL);
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

// Helper function to add delay between IPFS calls to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Improved IPFS content fetching with retry logic
async function fetchIPFSContentWithRetry(cid, retries = 2, baseDelay = 150) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        const delayMs = baseDelay * attempt; // Linear backoff for speed
        await delay(delayMs);
      }
      
      return await fetchIPFSContent(cid);
    } catch (error) {
      if (attempt === retries - 1) throw error; // Last attempt, throw the error
      
      if (error.message.includes('PINATA_RATE_LIMITED')) {
        continue; // Quick retry for rate limits
      }
      
      throw error; // For non-rate-limit errors, fail immediately
    }
  }
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

}

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
      
      // Add delay between batches to avoid rate limits
      if (i + batchSize <= Number(proposalCount.toString())) {
        console.log('⏳ Waiting 2s before next batch to avoid rate limits...');
        await delay(2000);
      }
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
  const removed = proposal.removed !== undefined ? proposal.removed : proposal[11];
  
  // Fetch IPFS content with retry logic and staggered requests
  let title, shortDescription, descriptionInDetails;
  
  try {
    // Stagger requests to avoid rate limits
    title = await timeoutPromise(fetchIPFSContentWithRetry(titleCid), 15000, `title-${i}`);
    await delay(300);
    shortDescription = await timeoutPromise(fetchIPFSContentWithRetry(shortDescriptionCid), 15000, `short-desc-${i}`);
    await delay(300);
    descriptionInDetails = await timeoutPromise(fetchIPFSContentWithRetry(descriptionInDetailsCid), 15000, `desc-${i}`);
  } catch (error) {
    console.warn(`⚠️ IPFS fetch failed for proposal ${i}, using fallback content`);
    title = `[Proposal ${i} Title - IPFS Unavailable]`;
    shortDescription = `[Proposal ${i} Short Desc - IPFS Unavailable]`;
    descriptionInDetails = `[Proposal ${i} Details - IPFS Unavailable]`;
  }
  
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
    updated_at: new Date(Number(updatedAt.toString()) * 1000).toISOString(),
    removed: Boolean(removed ?? false)
  };
}

async function fetchPetitionsOptimized(blocksBack) {
  
  try {
    const connectedContract = await getContractInstance("Petitions", CONTRACT_ADDRESSES.Petitions);
    const petitionCount = await connectedContract.petitionCount();

    
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
      
      // Add delay between batches to avoid rate limits
      if (i + batchSize <= Number(petitionCount.toString())) {
        console.log('⏳ Waiting 2s before next batch to avoid rate limits...');
        await delay(2000);
      }
    }
    
    return petitionsData;
  } catch (error) {
    console.error("❌ Error in fetchPetitionsOptimized:", error);
    throw error;
  }
}

async function processPetition(connectedContract, i) {
  const petition = await connectedContract.getPetition(i);
  // Fetch IPFS content with retry logic and staggered requests
  let title, description;
  
  try {
    title = await timeoutPromise(fetchIPFSContentWithRetry(petition[0]), 15000, `petition-title-${i}`);
    await delay(500);
    description = await timeoutPromise(fetchIPFSContentWithRetry(petition[1]), 15000, `petition-desc-${i}`);
  } catch (error) {
    console.warn(`⚠️ IPFS fetch failed for petition ${i}, using fallback content`);
    title = `[Petition ${i} Title - IPFS Unavailable]`;
    description = `[Petition ${i} Description - IPFS Unavailable]`;
  }
  return {
    id: i,
    title: title,
    description: description,
    required_signature_count: Number(petition[2].toString()),
    signature_count: Number(petition[3].toString()),
    creator_address: petition[4],
    is_completed: petition[5],
    removed: Boolean(petition[6] ?? false),
    status: petition[5] ? 'COMPLETED' : 'ACTIVE',
    creator: 1,
    created_at: new Date().toISOString()
  };
}

async function fetchReportsOptimized(blocksBack) {
  
  try {
    const connectedContract = await getContractInstance("Reports", CONTRACT_ADDRESSES.Reports);
    
    const reportCount = await connectedContract.reportCount();
    
    if (Number(reportCount.toString()) === 0) {
      return [];
    }
    
    const reportsData = [];
    const batchSize = 3; // Reduced from 5 to 3 to be more conservative with rate limits
    
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
      
      console.log(`✅ Processed reports batch ${i}-${endIndex}, batch size: ${results.filter(r => r !== null).length}`);
      
      // Add delay between batches to avoid overwhelming Pinata API
      if (i + batchSize <= Number(reportCount.toString())) {
        console.log('⏳ Waiting 2s before next batch to avoid rate limits...');
        await delay(2000);
      }
    }
    

    return reportsData;
  } catch (error) {
    console.error("❌ Error in fetchReportsOptimized:", error);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
}

async function processReport(connectedContract, i) {
  try {
    const report = await connectedContract.getReport(i);
    
    // Fetch IPFS content with retry logic and staggered requests to avoid rate limits
    let title, description;
    
    try {
      // Parallel IPFS fetching for speed - let the IPFS module handle rate limiting
      const [titleResult, descriptionResult] = await Promise.all([
        timeoutPromise(fetchIPFSContentWithRetry(report[0]), 10000, `report-title-${i}`),
        timeoutPromise(fetchIPFSContentWithRetry(report[1]), 10000, `report-desc-${i}`)
      ]);
      title = titleResult;
      description = descriptionResult;
    } catch (error) {
      console.warn(`⚠️ IPFS fetch failed for report ${i}, using fallback content`);
      title = `[Report ${i} Title - IPFS Unavailable]`;
      description = `[Report ${i} Description - IPFS Unavailable]`;
    }
    
    return {
      id: i,
      title: title,
      description: description,
      priority: 'MEDIUM',
      upvotes: report[2] ? Number(report[2].toString()) : 0, // upvotes at index 2
      downvotes: report[3] ? Number(report[3].toString()) : 0, // downvotes at index 3
      creator_address: report[4] || '0x0000000000000000000000000000000000000000', // creator address at index 4
      resolved_status: report[5] || false, // resolved status at index 5
      removed: Boolean(report[8] ?? false), // removed status at index 8
      assigned_to: '0x0000000000000000000000000000000000000000',
      creation_time: Date.now(),
      resolution_time: 0,
      creator: 1,
      created_time: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Critical error processing report ${i}:`, error.message);
    // Return a basic report structure even if blockchain call fails
    return {
      id: i,
      title: `[Report ${i} - Blockchain Read Failed]`,
      description: `[Report ${i} - Could not read from blockchain: ${error.message}]`,
      priority: 'MEDIUM',
      upvotes: 0,
      downvotes: 0,
      creator_address: '0x0000000000000000000000000000000000000000',
      resolved_status: false,
      removed: false,
      assigned_to: '0x0000000000000000000000000000000000000000',
      creation_time: 0,
      resolution_time: 0,
      creator: 1,
      created_time: new Date().toISOString()
    };
  }
}

async function fetchPoliciesOptimized(blocksBack) {
  console.log('📜 Starting optimized policies fetch...');
  
  try {
    const connectedContract = await getContractInstance('Policies', CONTRACT_ADDRESSES.Policies);
    if (typeof connectedContract.policyCount === 'function') {
      const policyCount = await connectedContract.policyCount();
      console.log(`📜 Found ${policyCount} policies on blockchain`);
      
      const policiesData = [];
      const batchSize = 5;
      
      for (let i = 1; i <= Number(policyCount.toString()); i += batchSize) {
        const batch = [];
        const endIndex = Math.min(i + batchSize - 1, Number(policyCount.toString()));
        
        for (let j = i; j <= endIndex; j++) {
          batch.push(processPolicy(connectedContract, j));
        }
        
        const results = await Promise.all(batch);
        policiesData.push(...results.filter(result => result !== null));
        
        console.log(`✅ Processed policies batch ${i}-${endIndex}`);
        
        // Add delay between batches to avoid rate limits
        if (i + batchSize <= Number(policyCount.toString())) {
          await delay(1000);
        }
      }
      
      return policiesData;
    }
    return [];
  } catch (error) {
    console.error('❌ Error in fetchPoliciesOptimized:', error);
    throw error;
  }
}

async function processPolicy(connectedContract, i) {
  try {
    const policy = await connectedContract.getPolicy(i);
    
    // Extract fields from the policy structure
    const name = policy.name || policy[0] || '';
    const descriptionCid = policy.description || policy[1] || '';
    const viewFullPolicy = policy.viewFullPolicy || policy[2] || '';
    const ministry = policy.ministry || policy[3] || '';
    const status = policy.status || policy[4] || '';
    const creator = policy.creator || policy[5] || '';
    const createdAt = policy.createdAt || policy[6] || 0;
    const effectiveDate = policy.effectiveDate || policy[7] || 0;
    const lastUpdated = policy.lastUpdated || policy[8] || 0;
    const supportCount = policy.supportCount || policy[9] || 0;
    const isActive = policy.isActive !== undefined ? policy.isActive : (policy[10] !== undefined ? policy[10] : false);
    const removed = policy.removed !== undefined ? policy.removed : (policy[11] !== undefined ? policy[11] : false);
    
    // Fetch IPFS content for description if it's a CID
    let description = descriptionCid;
    try {
      if (typeof descriptionCid === 'string' && (descriptionCid.startsWith('Qm') || descriptionCid.startsWith('bafy'))) {
        description = await timeoutPromise(fetchIPFSContentWithRetry(descriptionCid), 15000, `policy-desc-${i}`);
        await delay(300);
      }
    } catch (error) {
      console.warn(`⚠️ IPFS fetch failed for policy ${i} description, using fallback content`);
      description = `[Policy ${i} Description - IPFS Unavailable]`;
    }
    
    return {
      id: i,
      name: name,
      description: description,
      view_full_policy: viewFullPolicy,
      ministry: ministry,
      status: status,
      creator: creator,
      createdAt: new Date(Number(createdAt.toString()) * 1000).toISOString(),
      effectiveDate: new Date(Number(effectiveDate.toString()) * 1000).toISOString(),
      lastUpdated: new Date(Number(lastUpdated.toString()) * 1000).toISOString(),
      supportCount: Number(supportCount.toString()),
      removed: Boolean(removed),
      isActive: Boolean(isActive),
      raw: policy // Keep raw data for debugging
    };
  } catch (error) {
    console.error(`❌ Error processing policy ${i}:`, error.message);
    return null;
  }
}

async function fetchProjectsOptimized(blocksBack) {
  
  try {
    const connectedContract = await getContractInstance('Project', CONTRACT_ADDRESSES.Project);
    if (typeof connectedContract.projectCount === 'function') {
            const projectCount = await connectedContract.projectCount(); // Fetch the total number of projects
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

  
  try {
    // Set response headers early
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': FRONTEND_BASE_URL,
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

  
  try {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': FRONTEND_BASE_URL,
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

  
  try {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': FRONTEND_BASE_URL,
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

    // If the helper already returned an object, prefer its `content` field
    if (content && typeof content === 'object') {
      if (content.content !== undefined && content.content !== null) return content.content;
      // fallback to stringifying the object
      try {
        return JSON.stringify(content);
      } catch (e) {
        return String(content);
      }
    }

    // If content is a JSON string, parse and extract `content` if present
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            if (parsed.content !== undefined && parsed.content !== null) return parsed.content;
            return JSON.stringify(parsed);
          }
        } catch (e) {
          // not JSON, fall through
        }
      }
    }

    return content || `[IPFS: ${cid}]`;
  } catch (error) {
    // Handle rate limiting specifically
    if (error.message.includes('PINATA_RATE_LIMITED')) {
      console.warn(`⚠️ Rate limited - using placeholder for CID ${cid}`);
      return `[Rate Limited: ${cid}]`;
    }
    
    // Handle other HTTP errors
    if (error.message.includes('IPFS_HTTP_ERROR')) {
      console.warn(`⚠️ HTTP error - using placeholder for CID ${cid}`);
      return `[HTTP Error: ${cid}]`;
    }
    
    // Check for status code 429 directly
    if (error.message.includes('Request failed with status code 429')) {
      console.warn(`⚠️ Pinata rate limit detected - using placeholder for CID ${cid}`);
      return `[Rate Limited: ${cid}]`;
    }
    
    console.warn(`⚠️ IPFS fetch failed for CID ${cid} - using placeholder:`, error.message);
    return `[IPFS Error: ${cid}]`;
  }
}

// Helper that extracts the inner `content` field from objects/JSON strings used in view_details
function extractViewContent(view) {
  if (view === undefined || view === null) return '';
  try {
    // If object with content
    if (typeof view === 'object') {
      if (view.content !== undefined && view.content !== null) return String(view.content);
      return JSON.stringify(view);
    }

    // If string, try to parse JSON and extract
    if (typeof view === 'string') {
      const trimmed = view.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object' && parsed.content !== undefined && parsed.content !== null) return String(parsed.content);
          return JSON.stringify(parsed);
        } catch (e) {
          // not JSON - return raw string
          return view;
        }
      }
      return view;
    }

    return String(view);
  } catch (e) {
    return String(view);
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
    id: data.id,
    title: data.title?.content || data.title || '',
    description: data.description?.content || data.description || '',
    required_signature_count: data.required_signature_count || 0,
    signature_count: data.signature_count || 0,
    creator: data.creator || null,
    completed: data.is_completed || false,
    removed: data.removed || false
  };
  return await createRecord('petitions', petitionData);
}

// Reports
async function getAllReports() {
  return await queryDatabase('reports', {
    select: 'id,title,description,priority,upvotes,downvotes,creator,resolved_status,removed',
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
  // evidence_hash removed from DB schema - omit from sync
    removed: data.removed || false
  };
  return await createRecord('reports', reportData);
}

// Policies
async function getAllPolicies() {
  return await queryDatabase('policies', {
    select: 'id,name,description,view_full_policy,ministry,status,creator,created_at,effective_date,updated_at,supportCount,isActive,removed',
    order: 'id'
  });
}

async function createPolicy(data) {
  const policyData = {
    id: data.id || null,
    name: data.name || '',
    description: data.description || '',
    view_full_policy: data.view_full_policy || data.viewFullPolicy || '',
    ministry: data.ministry || '',
    status: data.status || '',
    creator: data.creator || null,
    created_at: data.createdAt || null,
    effective_date: data.effectiveDate || null,
    updated_at: data.lastUpdated || null,
    supportCount: data.supportCount || 0,
    isActive: data.isActive || false,
    removed: data.removed || false
  };
  return await createRecord('policies', policyData);
}

// Projects
async function getAllProjects() {
  return await queryDatabase('projects', {
    select: 'project_id,project_name,category_id,allocated_budget,spent_budget,state,province,ministry,view_details,status,createdAt,updatedAt,removed',
    order: 'project_id'
  });
}

  // Users
  async function getAllUsers() {
    return await queryDatabase('users', {
      select: 'id,evm,revoked',
      order: 'id'
    });
  }

  async function revokeUser(id) {
    return await updateRecord('users', id, { revoked: true });
  }

  async function removeUser(id) { 
    return await deleteRecord('users', id);
  }

  // User sync: verify users in DB against blockchain
  async function syncUsersWithBlockchain() {
    console.log('🔑 Starting user sync with blockchain...');
    const errors = [];
    let revokedCount = 0;
    let removedCount = 0;
    try {
      // Get all users from DB
      const dbUsers = await getAllUsers();

      // Get verified users from blockchain (not admins)
      // Use AuthRegistry contract
      let verifiedAddresses = [];
      try {
        const contractAddress = CONTRACT_ADDRESSES.AuthRegistry;
        const abi = require(path.join(__dirname, '..', 'artifacts', 'contracts', 'auth', 'auth.sol', 'AuthRegistry.json')).abi;
        const authRegistry = new ethers.Contract(contractAddress, abi, provider);

        // Get all events for UserAuthorized and UserRevoked
        const filterAuth = authRegistry.filters.UserAuthorized();
        const filterRevoke = authRegistry.filters.UserRevoked();
        const authEvents = await authRegistry.queryFilter(filterAuth, 0, 'latest');
        const revokeEvents = await authRegistry.queryFilter(filterRevoke, 0, 'latest');

        // Build address status map
        const addressStatus = {};
        authEvents.forEach(e => {
          addressStatus[e.args.user.toLowerCase()] = true;
        });
        revokeEvents.forEach(e => {
          addressStatus[e.args.user.toLowerCase()] = false;
        });

        // Only include addresses that are authorized and not revoked
        verifiedAddresses = Object.keys(addressStatus).filter(addr => addressStatus[addr]);

        // Remove admin addresses
        // Get AdminAuthorized events
        const filterAdmin = authRegistry.filters.AdminAuthorized();
        const adminEvents = await authRegistry.queryFilter(filterAdmin, 0, 'latest');
        const adminAddresses = adminEvents.map(e => e.args.admin.toLowerCase());
        verifiedAddresses = verifiedAddresses.filter(addr => !adminAddresses.includes(addr));
      } catch (err) {
        errors.push({ type: 'blockchain', error: err.message });
        console.error('Error fetching verified users from blockchain:', err);
      }

      // Build DB user map by evm
      const dbUserMap = new Map();
      dbUsers.forEach(u => {
        if (u.evm) dbUserMap.set(u.evm.toLowerCase(), u);
      });

      // 1. Remove/revoke users in DB not in blockchain
      for (const user of dbUsers) {
        const evmAddr = user.evm ? user.evm.toLowerCase() : null;
        if (!evmAddr) continue;
        const isVerified = verifiedAddresses.includes(evmAddr);
        if (!isVerified) {
          // Remove user record if not verified in blockchain
          try {
            await deleteRecord('users', user.id);
            removedCount++;
            console.log(`🗑️ Removed user with id ${user.id} evm ${evmAddr} (not verified in blockchain)`);
          } catch (err) {
            errors.push({ type: 'remove', id: user.id, evm: evmAddr, error: err.message });
          }
        } else if (user.revoked === true) {
          // If user is verified but marked revoked in DB, un-revoke
          try {
            await updateRecord('users', user.id, { revoked: false });
            console.log(`✅ Un-revoked user with id ${user.id} evm ${evmAddr} (verified in blockchain)`);
          } catch (err) {
            errors.push({ type: 'unrevoke', id: user.id, evm: evmAddr, error: err.message });
          }
        }
      }

      // 2. Add users from blockchain if not in DB
      for (const bcAddr of verifiedAddresses) {
        if (!dbUserMap.has(bcAddr)) {
          try {
            // Create minimal user record with evm and revoked=false
            await createRecord('users', { evm: bcAddr, revoked: false });
            console.log(`➕ Added user with evm ${bcAddr} from blockchain`);
          } catch (err) {
            errors.push({ type: 'add', evm: bcAddr, error: err.message });
          }
        }
      }
    } catch (err) {
      errors.push({ type: 'general', error: err.message });
      console.error('Error in user sync:', err);
    }
    return {
      status: 'completed',
      revoked: revokedCount,
      removed: removedCount,
      errors
    };
  }

async function createProject(data) {
  const viewContent = extractViewContent(data.view_details);
  const projectData = {
    project_id: data.project_id,
    project_name: data.project_name || '',
    category_id: data.category_id || '',
    allocated_budget: data.allocated_budget || 0,
    spent_budget: data.spent_budget || 0,
    state: data.state || '',
    province: data.province || '',
    ministry: data.ministry || '',
    view_details: viewContent,
    status: data.status || '',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    removed: data.removed || false
  };
  return await createRecord('projects', projectData);
}
  

// ========================================
// FIELD COMPARISON FUNCTIONS  
async function comparePolicyFields(dbPolicy, bcPolicy) {
  const updateData = {};
  let hasChanges = false;

  // Helper to detect likely CIDs (basic heuristics)
  function isPossiblyCid(s) {
    if (!s || typeof s !== 'string') return false;
    const trimmed = s.trim();
    if (trimmed.startsWith('Qm') || trimmed.startsWith('bafy') || trimmed.startsWith('ipfs://')) return true;
    // common base58/46-ish check (loose)
    if (/^[A-Za-z0-9_-]{20,100}$/.test(trimmed) && !/\s/.test(trimmed)) return true;
    return false;
  }

  // Extract processed blockchain data (now that we process policies properly)
  const bcName = bcPolicy.name || '';
  const bcDescription = bcPolicy.description || '';
  const bcView = bcPolicy.view_full_policy || '';
  const bcMinistry = bcPolicy.ministry || '';
  const bcStatus = bcPolicy.status || '';
  const bcSupportCount = bcPolicy.supportCount || 0;
  const bcIsActive = bcPolicy.isActive || false;
  const bcRemoved = bcPolicy.removed || false;

  // Debug logging for removed field
  if (dbPolicy && (dbPolicy.id || dbPolicy.name)) {
    console.log(`🔍 Policy ${dbPolicy.id || dbPolicy.name} removed comparison:`, {
      dbRemoved: Boolean(dbPolicy.removed || false),
      bcRemoved: Boolean(bcRemoved),
      bcPolicyData: {
        name: bcPolicy.name,
        removed: bcPolicy.removed,
        status: bcPolicy.status
      }
    });
  }

  // Compare fields and add to updateData when changed
  if ((dbPolicy.name || '') !== (bcName || '')) {
    updateData.name = bcName || '';
    hasChanges = true;
  }

  if ((dbPolicy.description || '') !== (bcDescription || '')) {
    updateData.description = bcDescription || '';
    hasChanges = true;
  }

  if ((dbPolicy.view_full_policy || '') !== (bcView || '')) {
    updateData.view_full_policy = bcView || '';
    hasChanges = true;
  }

  if ((dbPolicy.ministry || '') !== (bcMinistry || '')) {
    updateData.ministry = bcMinistry || '';
    hasChanges = true;
  }

  if ((dbPolicy.status || '') !== (bcStatus || '')) {
    updateData.status = bcStatus || '';
    hasChanges = true;
  }

  if ((Number(dbPolicy.supportCount) || 0) !== bcSupportCount) {
    updateData.supportCount = bcSupportCount;
    hasChanges = true;
  }

  if ((dbPolicy.isActive || false) !== bcIsActive) {
    updateData.isActive = bcIsActive;
    hasChanges = true;
  }

  if (Boolean(dbPolicy.removed || false) !== Boolean(bcRemoved)) {
    updateData.removed = Boolean(bcRemoved);
    hasChanges = true;
    console.log(`🔄 Policy ${dbPolicy.id || dbPolicy.name} removed status change: ${Boolean(dbPolicy.removed || false)} → ${Boolean(bcRemoved)}`);
  }

  // Dates mapping if provided in bcPolicy
  if (bcPolicy.createdAt && String(dbPolicy.created_at || dbPolicy.createdAt || '') !== String(bcPolicy.createdAt)) {
    updateData.created_at = bcPolicy.createdAt;
    hasChanges = true;
  }
  if (bcPolicy.updatedAt && String(dbPolicy.updated_at || dbPolicy.updatedAt || '') !== String(bcPolicy.updatedAt)) {
    updateData.updated_at = bcPolicy.updatedAt;
    hasChanges = true;
  }
  if (bcPolicy.effectiveDate && String(dbPolicy.effective_date || dbPolicy.effectiveDate || '') !== String(bcPolicy.effectiveDate)) {
    updateData.effective_date = bcPolicy.effectiveDate;
    hasChanges = true;
  }

  return { hasChanges, updateData };
}

function compareProjectFields(dbProject, bcProject) {
  const updateData = {};
  let hasChanges = false;

  // Normalize DB vs BC keys for numeric fields
  const dbAllocated = dbProject.allocated_budget !== undefined ? Number(dbProject.allocated_budget) : (dbProject.allocatedBudget !== undefined ? Number(dbProject.allocatedBudget) : 0);
  const dbSpent = dbProject.spent_budget !== undefined ? Number(dbProject.spent_budget) : (dbProject.spentBudget !== undefined ? Number(dbProject.spentBudget) : 0);
  const bcAllocated = bcProject.allocated_budget !== undefined ? Number(bcProject.allocated_budget) : (bcProject.allocatedBudget !== undefined ? Number(bcProject.allocatedBudget) : 0);
  const bcSpent = bcProject.spent_budget !== undefined ? Number(bcProject.spent_budget) : (bcProject.spentBudget !== undefined ? Number(bcProject.spentBudget) : 0);

  // Compare simple string fields (map BC names to DB names)
  if ((dbProject.project_name || '') !== (bcProject.project_name || bcProject.projectName || '')) {
    updateData.project_name = bcProject.project_name || bcProject.projectName || '';
    hasChanges = true;
  }

  // category_id should be numeric or null
  if ((dbProject.category_id || null) !== (bcProject.category_id !== undefined ? bcProject.category_id : bcProject.categoryId)) {
    updateData.category_id = bcProject.category_id !== undefined ? bcProject.category_id : bcProject.categoryId || null;
    hasChanges = true;
  }

  if (dbAllocated !== bcAllocated) {
    updateData.allocated_budget = bcAllocated;
    hasChanges = true;
  }

  if (dbSpent !== bcSpent) {
    updateData.spent_budget = bcSpent;
    hasChanges = true;
  }

  if ((dbProject.state || '') !== (bcProject.state || '')) {
    updateData.state = bcProject.state || '';
    hasChanges = true;
  }

  if ((dbProject.province || '') !== (bcProject.province || '')) {
    updateData.province = bcProject.province || '';
    hasChanges = true;
  }

  if ((dbProject.ministry || '') !== (bcProject.ministry || '')) {
    updateData.ministry = bcProject.ministry || '';
    hasChanges = true;
  }

  // Compare view_details content (bcProject.view_details should be resolved content)
  try {
    const dbView = extractViewContent(dbProject.view_details || '');
    const bcView = extractViewContent(bcProject.view_details || bcProject.viewDetails || '');
    if (dbView !== bcView) {
      updateData.view_details = bcView;
      hasChanges = true;
    }
  } catch (e) {
    // fallback to raw comparison on error
    if ((dbProject.view_details || '') !== (bcProject.view_details || bcProject.viewDetails || '')) {
      updateData.view_details = bcProject.view_details || bcProject.viewDetails || '';
      hasChanges = true;
    }
  }

  if ((dbProject.status || '') !== (bcProject.status || '')) {
    updateData.status = bcProject.status || '';
    hasChanges = true;
  }

  if ((dbProject.removed || false) !== (bcProject.removed || false)) {
    updateData.removed = Boolean(bcProject.removed || false);
    hasChanges = true;
  }

  // createdAt / updatedAt mapping (if available)
  if (bcProject.createdAt && (dbProject.createdAt || dbProject.created_at) !== bcProject.createdAt) {
    updateData.createdAt = bcProject.createdAt;
    hasChanges = true;
  }
  if (bcProject.updatedAt && (dbProject.updatedAt || dbProject.updated_at) !== bcProject.updatedAt) {
    updateData.updatedAt = bcProject.updatedAt;
    hasChanges = true;
  }

  return { hasChanges, updateData };
}

// Normalize a blockchain project raw object into a consistent shape and resolve IPFS CIDs
async function normalizeBcProject(bcProject) {
  if (!bcProject) return null;
  const raw = bcProject.raw || [];

  // helpers to extract values safely
  function val(idx, alt) {
    return raw[idx] !== undefined && raw[idx] !== null ? raw[idx] : (alt !== undefined ? alt : undefined);
  }

  // allocated / spent may be big numbers; coerce to Number then scale
  const allocatedRaw = val(3, (bcProject.allocated_budget || bcProject.allocatedBudget || 0));
  const spentRaw = val(4, (bcProject.spent_budget || bcProject.spentBudget || 0));
  const allocNum = Number(allocatedRaw && allocatedRaw.toString ? allocatedRaw.toString() : allocatedRaw) || 0;
  const spentNum = Number(spentRaw && spentRaw.toString ? spentRaw.toString() : spentRaw) || 0;

  // category
  let categoryRaw = val(2, (bcProject.category_id !== undefined ? bcProject.category_id : bcProject.categoryId));
  let categoryInt = null;
  if (categoryRaw !== undefined && categoryRaw !== null && categoryRaw !== '') {
    const parsed = Number(categoryRaw.toString ? categoryRaw.toString() : categoryRaw);
    if (!isNaN(parsed)) categoryInt = parseInt(parsed);
  }

  // view details CID or inline
  const viewCid = val(8, (bcProject.view_details || bcProject.viewDetailsCid || bcProject.viewDetails || '')) || '';
  const view_details = viewCid ? await fetchIPFSContent(String(viewCid)) : (bcProject.view_details || bcProject.viewDetails || '');

  // Dates
  function toDate(val) {
    if (val === undefined || val === null || val === '') return null;
    const num = Number(val && val.toString ? val.toString() : val);
    if (isNaN(num) || num < 1000000000) return null;
    return new Date(num * 1000).toISOString();
  }

  return {
    id: bcProject.id,
    projectId: bcProject.id,
    project_name: val(1, (bcProject.project_name || bcProject.projectName || '')) || (bcProject.project_name || bcProject.projectName || ''),
    category_id: categoryInt,
    allocated_budget: Math.floor(allocNum / 1e12),
    spent_budget: Math.floor(spentNum / 1e12),
    state: val(5, bcProject.state) || bcProject.state || '',
    province: val(6, bcProject.province) || bcProject.province || '',
    ministry: val(7, bcProject.ministry) || bcProject.ministry || '',
    view_details,
    status: val(9, bcProject.status) || bcProject.status || '',
    createdAt: toDate(val(10, bcProject.createdAt)),
    updatedAt: toDate(val(11, bcProject.updatedAt)),
    removed: val(12, bcProject.removed) !== undefined ? Boolean(val(12, bcProject.removed)) : (bcProject.removed || false)
  };
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
  
  // Removed status
  if (dbProposal.removed !== bcProposal.removed) {
    updateData.removed = bcProposal.removed;
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
  
  // Compare removed field
  if (Boolean(dbPetition.removed) !== Boolean(bcPetition.removed)) {
    updateData.removed = Boolean(bcPetition.removed);
    hasChanges = true;
  }
  
  return { hasChanges, updateData };
}

function compareReportFields(dbReport, bcReport) {
  const updateData = {};
  let hasChanges = false;
  
  // Debug logging
  console.log(`🔍 Comparing report ${bcReport.id}:`);
  console.log(`  DB resolved_status: ${dbReport.resolved_status} (type: ${typeof dbReport.resolved_status})`);
  console.log(`  BC resolved_status: ${bcReport.resolved_status} (type: ${typeof bcReport.resolved_status})`);
  
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
  
  // Ensure both values are properly compared as booleans
  const dbResolved = Boolean(dbReport.resolved_status);
  const bcResolved = Boolean(bcReport.resolved_status);
  
  if (dbResolved !== bcResolved) {
    updateData.resolved_status = bcResolved;
    hasChanges = true;
    console.log(`  🔄 Resolved status change detected: ${dbResolved} → ${bcResolved}`);
  }
  
  // Removed status
  if (dbReport.removed !== bcReport.removed) {
    updateData.removed = bcReport.removed;
    hasChanges = true;
  }
  
  console.log(`  Has changes: ${hasChanges}`);
  if (hasChanges) {
    console.log(`  Update data:`, updateData);
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
    // Build lookup maps by id
    const dbMap = new Map();
    dbPolicies.forEach(p => { if (p.id) dbMap.set(p.id, p); });
    const bcMap = new Map();
    blockchainPolicies.forEach(p => { if (p.id) bcMap.set(p.id, p); });

    // 1. Remove DB records not in blockchain
    for (const dbPolicy of dbPolicies) {
      if (!dbPolicy.id) continue;
      if (!bcMap.has(dbPolicy.id)) {
        try {
          await deleteRecord('policies', dbPolicy.id);
          removedCount++;
          console.log(`🗑️ Removed policy ${dbPolicy.id} (not found in blockchain)`);
        } catch (error) {
          errors.push({ type: 'delete', id: dbPolicy.id, error: error.message });
        }
      }
    }

    // 2. Update DB records if changed
    for (const dbPolicy of dbPolicies) {
      if (!dbPolicy.id) continue;
      const bcPolicy = bcMap.get(dbPolicy.id);
      if (!bcPolicy) continue;

      // comparePolicyFields is async and will resolve CIDs when present
      try {
        const needsUpdate = await comparePolicyFields(dbPolicy, bcPolicy);
        if (needsUpdate.hasChanges) {
          console.log(`🔍 Policy ${dbPolicy.id} changes detected:`, needsUpdate.updateData);
          await updateRecord('policies', dbPolicy.id, needsUpdate.updateData);
          updatedCount++;
          console.log(`🔄 Updated policy ${dbPolicy.id}: ${Object.keys(needsUpdate.updateData).join(', ')}`);
          
          // Log removed status changes specifically
          if (needsUpdate.updateData.removed !== undefined) {
            console.log(`🗑️ Policy ${dbPolicy.id} removed status updated to: ${needsUpdate.updateData.removed}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error updating policy ${dbPolicy.id}:`, error);
        errors.push({ type: 'update', id: dbPolicy.id, error: error.message });
      }
    }

    // 3. Add blockchain records not in DB
    function isLikelyCid(s) {
      if (!s || typeof s !== 'string') return false;
      const t = s.trim();
      return t.startsWith('Qm') || t.startsWith('bafy') || t.startsWith('ipfs://') || (/^[A-Za-z0-9_-]{20,100}$/.test(t) && !/\s/.test(t));
    }

    for (const bcPolicy of blockchainPolicies) {
      if (!bcPolicy.id || dbMap.has(bcPolicy.id)) continue;
      try {
        // Map raw array to proper DB columns
        const raw = bcPolicy.raw || [];
        function toDate(val) {
          if (val === undefined || val === null || val === '') return null;
          const num = Number(val);
          if (isNaN(num) || num < 1000000000) return null;
          return new Date(num * 1000).toISOString();
        }

        // Resolve description and view from CID when needed
        const descRaw = raw[1] !== undefined && raw[1] !== null ? raw[1] : (bcPolicy.description || '');
        const viewRaw = raw[2] !== undefined && raw[2] !== null ? raw[2] : (bcPolicy.view_full_policy || '');

        let resolvedDescription = descRaw;
        let resolvedView = viewRaw;
        try {
          if (typeof descRaw === 'string' && isLikelyCid(descRaw)) {
            resolvedDescription = await fetchIPFSContent(String(descRaw));
          }
        } catch (e) {
          console.warn('Failed to resolve policy description CID for create:', e.message);
        }
        try {
          if (typeof viewRaw === 'string' && isLikelyCid(viewRaw)) {
            resolvedView = await fetchIPFSContent(String(viewRaw));
          }
        } catch (e) {
          console.warn('Failed to resolve policy view CID for create:', e.message);
        }

        const dbPolicyData = {
          id: bcPolicy.id,
          name: raw[0] || bcPolicy.name || '',
          description: resolvedDescription || '',
          view_full_policy: resolvedView || '',
          ministry: raw[3] || bcPolicy.ministry || '',
          status: raw[4] || bcPolicy.status || '',
          creator: raw[5] || bcPolicy.creator || '',
          created_at: toDate(raw[6] || bcPolicy.created_at),
          updated_at: toDate(raw[7] || bcPolicy.updated_at),
          effective_date: toDate(raw[8] || bcPolicy.effective_date),
          supportCount: raw[9] !== undefined ? parseInt(raw[9]) : (bcPolicy.supportCount || 0),
          removed: raw[10] !== undefined ? Boolean(raw[10]) : (bcPolicy.removed || false),
          isActive: raw[11] !== undefined ? Boolean(raw[11]) : (bcPolicy.isActive || false)
        };
        console.log('📝 Creating policy in DB:', JSON.stringify({ id: dbPolicyData.id, name: dbPolicyData.name }));
        await createPolicy(dbPolicyData);
        newCount++;
        console.log(`✅ Created policy ${bcPolicy.id}`);
      } catch (error) {
        errors.push({ type: 'create', id: bcPolicy.id, error: error.message });
      }
    }
  } catch (error) {
    console.error('❌ Error in policies sync:', error);
    errors.push({ type: 'general', error: error.message });
  }
  if (errors.length > 0) {
    console.error('❌ Policy sync errors:', JSON.stringify(errors, null, 2));
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

    // Build DB map by both project_id and fallback id for resilience
    dbProjects.forEach(p => {
      const keyByProjectId = p.project_id !== undefined && p.project_id !== null ? String(p.project_id) : null;
      const keyById = p.id !== undefined && p.id !== null ? String(p.id) : null;
      if (keyByProjectId) dbMap.set(keyByProjectId, p);
      if (keyById) dbMap.set(keyById, p);
    });

    // Normalize all blockchain projects (resolve IPFS CIDs) before comparison
    for (const p of blockchainProjects) {
      if (!p || (p.id === undefined || p.id === null)) continue;
      try {
        const normalized = await normalizeBcProject(p);
        const key = String(normalized.id !== undefined && normalized.id !== null ? normalized.id : normalized.projectId);
        bcMap.set(key, normalized);
      } catch (e) {
        console.warn(`Could not normalize blockchain project ${p.id}:`, e.message || e);
      }
    }

    // Phase 1: For each DB record, always compare with blockchain data when available
    for (const dbProject of dbProjects) {
      const dbKey = dbProject.project_id !== undefined && dbProject.project_id !== null ? String(dbProject.project_id) : (dbProject.id !== undefined && dbProject.id !== null ? String(dbProject.id) : null);
      // If we can't determine a key for this DB row, skip it
      if (!dbKey) continue;

      const bcProject = bcMap.get(dbKey);

      if (!bcProject) {
        // DB has a record not present on-chain -> remove it from DB
        try {
          const idColumn = dbProject.project_id !== undefined && dbProject.project_id !== null ? 'project_id' : 'id';
          await deleteRecord('projects', dbKey, idColumn);
          removedCount++;
          console.log(`🗑️ Removed project ${dbKey} (idColumn: ${idColumn}) not present on-chain`);
        } catch (err) {
          console.error(`❌ Failed to remove DB project ${dbKey}:`, err.message || err);
          errors.push({ type: 'delete', id: dbKey, error: err.message || String(err) });
        }
        continue;
      }

      // Compare every column and update when blockchain differs
      try {
        const { hasChanges, updateData } = compareProjectFields(dbProject, bcProject);
        if (hasChanges) {
          const idColumn = dbProject.project_id !== undefined && dbProject.project_id !== null ? 'project_id' : 'id';
          await updateRecord('projects', dbKey, updateData, idColumn);
          updatedCount++;
          console.log(`� Updated DB project ${dbKey} with blockchain changes`);
        }
      } catch (err) {
        console.error(`❌ Failed to compare/update project ${dbKey}:`, err.message || err);
        errors.push({ type: 'update', id: dbKey, error: err.message || String(err) });
      }
    }

    // Phase 2: Create new blockchain records that don't exist in DB
    for (const [bcId, normalized] of bcMap.entries()) {
      if (!bcId) {
        console.log('⚠️ Skipping project with missing id in normalized set');
        continue;
      }
      if (dbMap.has(bcId)) {
        // Already handled in phase 1 (we compared and updated existing DB rows)
        continue;
      }
      try {
        // Build DB-shaped object from normalized bc project (view_details already resolved)
        const dbProjectData = {
          project_id: Number(normalized.id || normalized.projectId),
          project_name: normalized.project_name || '',
          category_id: normalized.category_id !== undefined ? normalized.category_id : null,
          allocated_budget: normalized.allocated_budget !== undefined ? normalized.allocated_budget : null,
          spent_budget: normalized.spent_budget !== undefined ? normalized.spent_budget : null,
          state: normalized.state || '',
          province: normalized.province || '',
          ministry: normalized.ministry || '',
          view_details: normalized.view_details || '',
          status: normalized.status || '',
          createdAt: normalized.createdAt || null,
          updatedAt: normalized.updatedAt || null,
          removed: Boolean(normalized.removed || false)
        };

        // Ensure no empty string for integer or date fields
        ['allocated_budget','spent_budget','createdAt','updatedAt'].forEach(f => {
          if (dbProjectData[f] === undefined || dbProjectData[f] === '') dbProjectData[f] = null;
        });

        console.log('📝 Creating normalized project in DB:', JSON.stringify({ project_id: dbProjectData.project_id, project_name: dbProjectData.project_name }));
        await createProject(dbProjectData);
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
      if (p.id) {
        dbMap.set(p.id, p);
      }
    });
    blockchainPetitions.forEach(p => {
      if (p.id) {
        bcMap.set(p.id, p);
      }
    });

    // Remove DB records not in blockchain
    for (const dbPetition of dbPetitions) {
      if (!dbPetition.id) continue;
      const bcId = dbPetition.id;
      const bcPetition = bcMap.get(bcId);
      if (!bcPetition) {
        try {
          await deleteRecord('petitions', dbPetition.id);
          removedCount++;
          console.log(`🗑️ Removed petition ${bcId} (id: ${dbPetition.id}) - not found in blockchain`);
        } catch (error) {
          errors.push({ type: 'delete', id: bcId, error: error.message });
        }
        continue;
      }
      // If present in blockchain, check for updates
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

    // Add blockchain petitions not in DB
    for (const bcPetition of blockchainPetitions) {
      const bcId = bcPetition.id;
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
        }CONTRACT_ADDRESSES.Reports
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
  console.log('🔗 Contract addresses:', JSON.stringify(CONTRACT_ADDRESSES, null, 2));
  
  try {
    const { blocksBack = 1000, isFullSync = false } = req.body;
    
    // Calculate block range
    const latestBlock = await provider.getBlockNumber();
    const toBlock = Number(latestBlock);
    const fromBlock = Math.max(0, toBlock - blocksBack);
    
    console.log(`📊 Syncing blockchain data from block ${fromBlock} to ${toBlock}`);
    
    // Fetch all blockchain data once
    console.log('🚀 Starting parallel fetch of all blockchain data...');
    
    const [proposals, petitions, reports, policies, projects] = await Promise.all([
      fetchProposalsOptimized(blocksBack).catch(e => { console.error('❌ fetchProposalsOptimized failed:', e.message); return []; }),
      fetchPetitionsOptimized(blocksBack).catch(e => { console.error('❌ fetchPetitionsOptimized failed:', e.message); return []; }),  
      fetchReportsOptimized(blocksBack).catch(e => { console.error('❌ fetchReportsOptimized failed:', e.message); return []; }),
      fetchPoliciesOptimized(blocksBack).catch(e => { console.error('❌ fetchPoliciesOptimized failed:', e.message); return []; }),
      fetchProjectsOptimized(blocksBack).catch(e => { console.error('❌ fetchProjectsOptimized failed:', e.message); return []; })
    ]);
    
    console.log('🚀 Parallel fetch completed');

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
      syncProjectsWithData(fromBlock, toBlock, projects),
      syncUsersWithBlockchain()
    ]);

    // Process results and calculate totals
    let totalNew = 0;
    let totalUpdated = 0;
    let totalRemoved = 0;
    let totalErrors = 0;
    const detailedResults = [];

  const entityNames = ['proposals', 'petitions', 'reports', 'policies', 'projects', 'users'];

    function normalizeSyncResult(res) {
      if (!res || typeof res !== 'object') {
        return { results: { new: 0, updated: 0, removed: 0, errors: [] } };
      }
      if (res.results && typeof res.results === 'object') {
        return {
          results: {
            new: res.results.new || 0,
            updated: res.results.updated || 0,
            removed: res.results.removed || 0,
            errors: Array.isArray(res.results.errors) ? res.results.errors : []
          }
        };
      }
      // fallback for user sync or other
      return {
        results: {
          new: res.new || 0,
          updated: res.updated || 0,
          removed: res.removed || 0,
          errors: Array.isArray(res.errors) ? res.errors : []
        }
      };
    }

    syncResults.forEach((result, index) => {
      const entityName = entityNames[index];

      if (result.status === 'fulfilled') {
        const res = normalizeSyncResult(result.value);
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
          error: result.reason && result.reason.message ? result.reason.message : String(result.reason)
        });

        console.error(`❌ ${entityName} sync failed:`, result.reason && result.reason.message ? result.reason.message : String(result.reason));
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



