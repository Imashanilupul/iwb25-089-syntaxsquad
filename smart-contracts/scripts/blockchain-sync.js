const express = require("express");
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
const CONTRACT_ADDRESSES = {
  AuthRegistry: "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9",
  Petitions: "0x1577FD3B3E54cFA368F858d542920A0fefBaf807", 
  Reports: "0xD8E110E021a9281b8ad7A6Cf93c2b14b3e3B2712",
  Policies: "0x6a957A0D571b3Ed50AFc02Ac62CC061C6c533138",
  Proposals: "0xff40F4C374c1038378c7044720B939a2a0219a2f",
  Project: "0x1770c50E6Bc8bbFB662c7ec45924aE986473b970"
};

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
    creator_id: 1,
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
    user_id: 1,
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

module.exports = router;

// Aggregated endpoint: return all contract data in one response given how many blocks backwards
router.get('/all/blockchain-data', async (req, res) => {
  try {
    const { blocksBack } = req.query;
    const back = Number(blocksBack) || 10000; // default lookback if not provided

  const latestBlock = await provider.getBlockNumber();
  const toBlock = Number(latestBlock);
    const fromBlock = Math.max(0, toBlock - back);

    console.log(`🔗 Aggregated blockchain data request — blocks ${fromBlock}..${toBlock} (back ${back})`);

    const result = {
      success: true,
      fromBlock,
      toBlock,
      authRegistry: [],
      proposals: [],
      petitions: [],
      reports: [],
      policies: [],
      projects: []
    };

    // Attempt to read AuthRegistry if contract exposes count/getters — graceful fallback
    try {
  const connectedAuth = await getContractInstance('AuthRegistry', CONTRACT_ADDRESSES.AuthRegistry);
      if (typeof connectedAuth.userCount === 'function') {
        const userCount = await connectedAuth.userCount();
        for (let i = 1; i <= Number(userCount.toString()); i++) {
          try {
            if (typeof connectedAuth.getUser === 'function') {
              const u = await connectedAuth.getUser(i);
              result.authRegistry.push({ id: i, raw: u });
            } else {
              // Unknown API, push index only
              result.authRegistry.push({ id: i });
            }
          } catch (e) {
            console.warn('Auth user read error', e.message);
          }
        }
      }
    } catch (e) {
      console.warn('AuthRegistry contract read skipped or failed:', e.message);
    }

    // Proposals
    try {
  const connectedContract = await getContractInstance('Proposals', CONTRACT_ADDRESSES.Proposals);
      const proposalCount = await connectedContract.proposalCount();
      for (let i = 1; i <= Number(proposalCount.toString()); i++) {
        try {
          const proposal = await connectedContract.getProposal(i);
          const titleCid = proposal.titleCid || proposal[0];
          const shortDescriptionCid = proposal.shortDescriptionCid || proposal[1];
          const descriptionInDetailsCid = proposal.descriptionInDetailsCid || proposal[2];
          const title = await fetchIPFSContent(titleCid);
          const shortDescription = await fetchIPFSContent(shortDescriptionCid);
          const descriptionInDetails = await fetchIPFSContent(descriptionInDetailsCid);
          const yesVotes = proposal.yesVotes || proposal[3];
          const noVotes = proposal.noVotes || proposal[4];
          const creator = proposal.creator || proposal[5];
          const activeStatus = proposal.activeStatus !== undefined ? proposal.activeStatus : proposal[6];
          const expiredDate = proposal.expiredDate || proposal[7];
          const categoryId = proposal.categoryId || proposal[8];
          const createdAt = proposal.createdAt || proposal[9];
          const updatedAt = proposal.updatedAt || proposal[10];

          result.proposals.push({
            blockchain_proposal_id: i,
            title,
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
          });
        } catch (e) {
          console.warn('Proposal read error', e.message);
        }
      }
    } catch (e) {
      console.warn('Proposals read failed:', e.message);
    }

    // Petitions
    try {
  const connectedContract = await getContractInstance('Petitions', CONTRACT_ADDRESSES.Petitions);
      const petitionCount = await connectedContract.petitionCount();
      for (let i = 1; i <= Number(petitionCount.toString()); i++) {
        try {
          const petition = await connectedContract.getPetition(i);
          const title = await fetchIPFSContent(petition[0]);
          const description = await fetchIPFSContent(petition[1]);
          result.petitions.push({
            blockchain_petition_id: i,
            title,
            description,
            required_signature_count: Number(petition[2].toString()),
            signature_count: Number(petition[3].toString()),
            creator_address: petition[4],
            is_completed: petition[5],
            status: petition[5] ? 'COMPLETED' : 'ACTIVE',
            creator_id: 1,
            created_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Petition read error', e.message);
        }
      }
    } catch (e) {
      console.warn('Petitions read failed:', e.message);
    }

    // Reports
    try {
  const connectedContract = await getContractInstance('Reports', CONTRACT_ADDRESSES.Reports);
      const reportCount = await connectedContract.reportCount();
      for (let i = 1; i <= Number(reportCount.toString()); i++) {
        try {
          const report = await connectedContract.getReport(i);
          const title = await fetchIPFSContent(report[0]);
          const description = await fetchIPFSContent(report[1]);
          result.reports.push({
            blockchain_report_id: i,
            report_title: title,
            description,
            priority: 'MEDIUM',
            upvotes: Number(report[3].toString()),
            downvotes: Number(report[4].toString()),
            creator_address: report[5],
            resolved_status: report[6],
            assigned_to: report[7],
            creation_time: Number(report[8].toString()),
            resolution_time: Number(report[9].toString()),
            user_id: 1,
            evidence_hash: `blockchain_${i}`,
            created_time: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Report read error', e.message);
        }
      }
    } catch (e) {
      console.warn('Reports read failed:', e.message);
    }

    // Policies (placeholder - contract-specific implementation may be needed)
    try {
      // Attempt to read if a Policies contract exists with expected API
  const connectedContract = await getContractInstance('Policies', CONTRACT_ADDRESSES.Policies);
      if (typeof connectedContract.policyCount === 'function') {
        const policyCount = await connectedContract.policyCount();
        for (let i = 1; i <= Number(policyCount.toString()); i++) {
          try {
            const p = await connectedContract.getPolicy(i);
            // Minimal mapping — real project should expand fields
            result.policies.push({ id: i, raw: p });
          } catch (e) {
            console.warn('Policy read error', e.message);
          }
        }
      }
    } catch (e) {
      console.warn('Policies read skipped or failed:', e.message);
    }

    // Projects (placeholder)
    try {
  const connectedContract = await getContractInstance('Project', CONTRACT_ADDRESSES.Project);
      if (typeof connectedContract.projectCount === 'function') {
        const projectCount = await connectedContract.projectCount();
        for (let i = 1; i <= Number(projectCount.toString()); i++) {
          try {
            const pj = await connectedContract.getProject(i);
            result.projects.push({ id: i, raw: pj });
          } catch (e) {
            console.warn('Project read error', e.message);
          }
        }
      }
    } catch (e) {
      console.warn('Projects read skipped or failed:', e.message);
    }

    return res.json(result);
  } catch (error) {
    console.error('❌ Error in aggregated /all/blockchain-data:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to get aggregated blockchain data' });
  }
});
