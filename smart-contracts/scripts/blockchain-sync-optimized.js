const express = require("express");
const axios = require("axios");
require('dotenv').config();

// Environment variables
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
const LOCAL_RPC_URL = process.env.LOCAL_RPC_URL || 'http://localhost:8545';

// Database configuration
const DB_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  restEndpoint: "/rest/v1"
};

// Create database HTTP client
const dbClient = axios.create({
  baseURL: DB_CONFIG.supabaseUrl + DB_CONFIG.restEndpoint,
  headers: {
    'apikey': DB_CONFIG.serviceRoleKey,
    'Authorization': `Bearer ${DB_CONFIG.serviceRoleKey}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Provider setup
let ethers;
let provider;
try {
  const hh = require('hardhat');
  ethers = hh.ethers;
  provider = ethers.provider || hh.network.provider;
} catch (err) {
  const ethersLib = require('ethers');
  ethers = ethersLib;
  const rpc = process.env.ETH_RPC_URL || process.env.ETHEREUM_RPC;
  const networkName = process.env.ETH_NETWORK || 'sepolia';
  if (rpc) {
    provider = new ethers.JsonRpcProvider ? new ethers.JsonRpcProvider(rpc) : new ethers.providers.JsonRpcProvider(rpc);
    console.log('Using JSON-RPC provider ->', rpc);
  } else {
    const alchemyKey = process.env.ALCHEMY_API_KEY || process.env.ALCHEMY_KEY || process.env.ALCHEMY;
    const infuraKey = process.env.INFURA_API_KEY || process.env.INFURA_KEY || process.env.INFURA;
    const etherscanKey = process.env.ETHERSCAN_API_KEY || process.env.ETHERSCAN_KEY || process.env.ETHERSCAN;
    const providerOptions = {};
    if (alchemyKey) providerOptions.alchemy = alchemyKey;
    if (infuraKey) providerOptions.infura = infuraKey;
    if (etherscanKey) providerOptions.etherscan = etherscanKey;
    try {
      if (typeof ethers.getDefaultProvider === 'function') {
        provider = ethers.getDefaultProvider(networkName, providerOptions);
      } else {
        provider = new ethers.providers.getDefaultProvider(networkName, providerOptions);
      }
      console.log('Using default provider for network', networkName);
    } catch (e) {
      provider = new (ethers.JsonRpcProvider ? ethers.JsonRpcProvider : ethers.providers.JsonRpcProvider)(LOCAL_RPC_URL);
      console.warn('Falling back to local RPC', LOCAL_RPC_URL);
    }
  }
}

const { getFromPinata } = require("./ipfs.js");
const router = express.Router();

// Load contract addresses
const fs = require('fs');
const path = require('path');
let CONTRACT_ADDRESSES = {};
try {
  const deployedPath = path.join(__dirname, '..', 'deployed-addresses.json');
  if (fs.existsSync(deployedPath)) {
    CONTRACT_ADDRESSES = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
    console.log('Loaded contract addresses from deployed-addresses.json');
  }
} catch (e) {
  console.error('Error loading deployed-addresses.json:', e.message);
}

// ========================================
// ENTITY CONFIGURATIONS
// ========================================

const ENTITY_CONFIGS = {
  proposals: {
    contractName: 'Proposals',
    tableName: 'proposals',
    countMethod: 'proposalCount',
    getMethod: 'getProposal',
    ipfsFields: ['titleCid', 'shortDescriptionCid', 'descriptionInDetailsCid'],
    fieldMapping: (data, ipfsContent) => ({
      id: data.id,
      title: ipfsContent[0] || '',
      short_description: ipfsContent[1] || '',
      description_in_details: ipfsContent[2] || '',
      yes_votes: Number(data.yesVotes?.toString() || data[3]?.toString() || 0),
      no_votes: Number(data.noVotes?.toString() || data[4]?.toString() || 0),
      creator_address: data.creator || data[5],
      active_status: Boolean(data.activeStatus ?? data[6]),
      expired_date: new Date(Number((data.expiredDate || data[7])?.toString()) * 1000).toISOString(),
      category_id: Number((data.categoryId || data[8])?.toString()),
      created_by: 1,
      created_at: new Date(Number((data.createdAt || data[9])?.toString()) * 1000).toISOString(),
      updated_at: new Date(Number((data.updatedAt || data[10])?.toString()) * 1000).toISOString()
    }),
    compareFields: (dbRecord, bcRecord) => {
      const updateData = {};
      let hasChanges = false;
      if (dbRecord.title !== bcRecord.title) { updateData.title = bcRecord.title; hasChanges = true; }
      if (dbRecord.short_description !== bcRecord.short_description) { updateData.short_description = bcRecord.short_description; hasChanges = true; }
      if (dbRecord.description_in_details !== bcRecord.description_in_details) { updateData.description_in_details = bcRecord.description_in_details; hasChanges = true; }
      if (dbRecord.yes_votes !== bcRecord.yes_votes) { updateData.yes_votes = bcRecord.yes_votes; hasChanges = true; }
      if (dbRecord.no_votes !== bcRecord.no_votes) { updateData.no_votes = bcRecord.no_votes; hasChanges = true; }
      if (dbRecord.active_status !== bcRecord.active_status) { updateData.active_status = bcRecord.active_status; hasChanges = true; }
      return { hasChanges, updateData };
    }
  },
  petitions: {
    contractName: 'Petitions',
    tableName: 'petitions',
    countMethod: 'petitionCount',
    getMethod: 'getPetition',
    ipfsFields: ['titleCid', 'descriptionCid'],
    fieldMapping: (data, ipfsContent) => ({
      id: data.id,
      title: ipfsContent[0] || '',
      description: ipfsContent[1] || '',
      required_signature_count: Number(data[2]?.toString() || 0),
      signature_count: Number(data[3]?.toString() || 0),
      creator_address: data[4],
      completed: Boolean(data[5]),
      status: data[5] ? 'COMPLETED' : 'ACTIVE',
      creator: 1,
      created_at: new Date().toISOString()
    }),
    compareFields: (dbRecord, bcRecord) => {
      const updateData = {};
      let hasChanges = false;
      if (dbRecord.title !== bcRecord.title) { updateData.title = bcRecord.title; hasChanges = true; }
      if (dbRecord.description !== bcRecord.description) { updateData.description = bcRecord.description; hasChanges = true; }
      if (dbRecord.required_signature_count !== bcRecord.required_signature_count) { updateData.required_signature_count = bcRecord.required_signature_count; hasChanges = true; }
      if (dbRecord.signature_count !== bcRecord.signature_count) { updateData.signature_count = bcRecord.signature_count; hasChanges = true; }
      if (dbRecord.completed !== bcRecord.completed) { updateData.completed = bcRecord.completed; hasChanges = true; }
      return { hasChanges, updateData };
    }
  },
  reports: {
    contractName: 'Reports',
    tableName: 'reports',
    countMethod: 'reportCount',
    getMethod: 'getReport',
    ipfsFields: ['titleCid', 'descriptionCid'],
    fieldMapping: (data, ipfsContent) => ({
      id: data.id,
      title: ipfsContent[0] || '',
      description: ipfsContent[1] || '',
      priority: 'MEDIUM',
      upvotes: Number(data[2]?.toString() || 0),
      downvotes: Number(data[3]?.toString() || 0),
      creator_address: data[4] || '0x0000000000000000000000000000000000000000',
      resolved_status: Boolean(data[5]),
      assigned_to: '0x0000000000000000000000000000000000000000',
      creation_time: Date.now(),
      resolution_time: 0,
      creator: 1,
      created_time: new Date().toISOString()
    }),
    compareFields: (dbRecord, bcRecord) => {
      const updateData = {};
      let hasChanges = false;
      if (dbRecord.title !== bcRecord.title) { updateData.title = bcRecord.title; hasChanges = true; }
      if (dbRecord.description !== bcRecord.description) { updateData.description = bcRecord.description; hasChanges = true; }
      if (dbRecord.priority !== bcRecord.priority) { updateData.priority = bcRecord.priority; hasChanges = true; }
      if (dbRecord.upvotes !== bcRecord.upvotes) { updateData.upvotes = bcRecord.upvotes; hasChanges = true; }
      if (dbRecord.downvotes !== bcRecord.downvotes) { updateData.downvotes = bcRecord.downvotes; hasChanges = true; }
      if (Boolean(dbRecord.resolved_status) !== Boolean(bcRecord.resolved_status)) { updateData.resolved_status = Boolean(bcRecord.resolved_status); hasChanges = true; }
      return { hasChanges, updateData };
    }
  },
  policies: {
    contractName: 'Policies',
    tableName: 'policies',
    countMethod: 'policyCount',
    getMethod: 'getPolicy',
    ipfsFields: ['descriptionCid'],
    fieldMapping: (data, ipfsContent) => ({
      id: data.id,
      name: data.name || data[0] || '',
      description: ipfsContent[0] || data.description || data[1] || '',
      view_full_policy: data.viewFullPolicy || data[2] || '',
      ministry: data.ministry || data[3] || '',
      status: data.status || data[4] || '',
      creator: data.creator || data[5] || '',
      created_at: new Date(Number((data.createdAt || data[6])?.toString()) * 1000).toISOString(),
      effective_date: new Date(Number((data.effectiveDate || data[7])?.toString()) * 1000).toISOString(),
      updated_at: new Date(Number((data.lastUpdated || data[8])?.toString()) * 1000).toISOString(),
      supportCount: Number((data.supportCount || data[9])?.toString() || 0),
      removed: Boolean(data.removed ?? data[10]),
      isActive: Boolean(data.isActive ?? data[11])
    }),
    compareFields: (dbRecord, bcRecord) => {
      const updateData = {};
      let hasChanges = false;
      if ((dbRecord.name || '') !== (bcRecord.name || '')) { updateData.name = bcRecord.name || ''; hasChanges = true; }
      if ((dbRecord.description || '') !== (bcRecord.description || '')) { updateData.description = bcRecord.description || ''; hasChanges = true; }
      if ((dbRecord.view_full_policy || '') !== (bcRecord.view_full_policy || '')) { updateData.view_full_policy = bcRecord.view_full_policy || ''; hasChanges = true; }
      if ((dbRecord.ministry || '') !== (bcRecord.ministry || '')) { updateData.ministry = bcRecord.ministry || ''; hasChanges = true; }
      if ((dbRecord.status || '') !== (bcRecord.status || '')) { updateData.status = bcRecord.status || ''; hasChanges = true; }
      if ((Number(dbRecord.supportCount) || 0) !== bcRecord.supportCount) { updateData.supportCount = bcRecord.supportCount; hasChanges = true; }
      if ((dbRecord.isActive || false) !== bcRecord.isActive) { updateData.isActive = bcRecord.isActive; hasChanges = true; }
      if (Boolean(dbRecord.removed || false) !== Boolean(bcRecord.removed)) { updateData.removed = Boolean(bcRecord.removed); hasChanges = true; }
      return { hasChanges, updateData };
    }
  }
};

// ========================================
// GENERIC HELPER FUNCTIONS
// ========================================

// Middleware
router.use((req, res, next) => {
  req.setTimeout(900000);
  res.setTimeout(900000);
  res.header('Access-Control-Allow-Origin', FRONTEND_BASE_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Timeout promise wrapper
function timeoutPromise(promise, timeout, name) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${name} fetch timeout after ${timeout}ms`)), timeout)
    )
  ]);
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch IPFS content with retry
async function fetchIPFSContentWithRetry(cid, retries = 2, baseDelay = 150) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) await delay(baseDelay * Math.pow(2, attempt));
      return await fetchIPFSContent(cid);
    } catch (error) {
      if (attempt === retries - 1) throw error;
      if (error.message.includes('PINATA_RATE_LIMITED')) await delay(2000);
      else throw error;
    }
  }
}

// Fetch IPFS content
async function fetchIPFSContent(cid) {
  if (!cid || typeof cid !== 'string' || cid.trim() === '') return '';
  try {
    const content = await getFromPinata(cid);
    if (content && typeof content === 'object') {
      if (content.content !== undefined && content.content !== null) return String(content.content);
      try { return JSON.stringify(content); } catch (e) { return String(content); }
    }
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.content !== undefined && parsed.content !== null) return String(parsed.content);
          return trimmed;
        } catch (e) { return trimmed; }
      }
    }
    return content || `[IPFS: ${cid}]`;
  } catch (error) {
    if (error.message.includes('PINATA_RATE_LIMITED') || error.message.includes('429')) {
      console.warn(`⚠️ Rate limited for CID ${cid}`);
      return `[Rate Limited: ${cid}]`;
    }
    console.warn(`⚠️ IPFS fetch failed for CID ${cid}:`, error.message);
    return `[IPFS Error: ${cid}]`;
  }
}

// Get contract instance
async function getContractInstance(name, address) {
  if (!address) throw new Error('No address provided for ' + name);
  try {
    if (typeof ethers.getContractFactory === 'function') {
      const factory = await ethers.getContractFactory(name);
      return factory.attach(address).connect(provider);
    }
  } catch (e) {}
  try {
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${name}.sol`, `${name}.json`);
    const art = require(artifactPath);
    return new ethers.Contract(address, art.abi, provider);
  } catch (e) {
    console.warn(`Could not load artifact for ${name}:`, e.message);
  }
  return new ethers.Contract(address, [], provider);
}

// ========================================
// GENERIC FETCH FUNCTION
// ========================================

async function fetchEntitiesOptimized(entityName, blocksBack) {
  const config = ENTITY_CONFIGS[entityName];
  if (!config) throw new Error(`Unknown entity: ${entityName}`);
  
  console.log(`🔄 Starting optimized ${entityName} fetch...`);
  
  try {
    const contractAddress = CONTRACT_ADDRESSES[config.contractName];
    if (!contractAddress) {
      console.warn(`⚠️ No contract address for ${config.contractName}`);
      return [];
    }
    
    const contract = await getContractInstance(config.contractName, contractAddress);
    
    // Check if contract has count method
    if (typeof contract[config.countMethod] !== 'function') {
      console.warn(`⚠️ Contract ${config.contractName} doesn't have ${config.countMethod} method`);
      return [];
    }
    
    const count = await contract[config.countMethod]();
    const totalCount = Number(count.toString());
    
    console.log(`📊 Found ${totalCount} ${entityName} on blockchain`);
    
    if (totalCount === 0) return [];
    
    const entitiesData = [];
    const batchSize = 5;
    
    for (let i = 1; i <= totalCount; i += batchSize) {
      const batch = [];
      const endIndex = Math.min(i + batchSize - 1, totalCount);
      
      for (let j = i; j <= endIndex; j++) {
        batch.push(
          processEntity(contract, j, config)
            .catch(error => {
              console.error(`❌ Error processing ${entityName} ${j}:`, error.message);
              return null;
            })
        );
      }
      
      const results = await Promise.all(batch);
      entitiesData.push(...results.filter(result => result !== null));
      
      console.log(`✅ Processed ${entityName} batch ${i}-${endIndex}`);
      
      if (i + batchSize <= totalCount) await delay(500);
    }
    
    return entitiesData;
  } catch (error) {
    console.error(`❌ Error in fetch${entityName}Optimized:`, error);
    throw error;
  }
}

// ========================================
// GENERIC PROCESS FUNCTION
// ========================================

async function processEntity(contract, id, config) {
  try {
    const data = await contract[config.getMethod](id);
    
    // Fetch IPFS content for specified fields
    const ipfsContent = [];
    for (let i = 0; i < config.ipfsFields.length; i++) {
      const cidIndex = i;
      let cid = data[cidIndex];
      
      // Ensure cid is a string
      if (cid === undefined || cid === null) {
        cid = '';
      } else if (typeof cid !== 'string') {
        cid = String(cid);
      }
      
      try {
        if (cid && cid.length > 0 && (cid.startsWith('Qm') || cid.startsWith('bafy'))) {
          const content = await timeoutPromise(
            fetchIPFSContentWithRetry(cid),
            15000,
            `${config.tableName}-${config.ipfsFields[i]}-${id}`
          );
          ipfsContent.push(content);
        } else {
          ipfsContent.push(cid || '');
        }
        await delay(300);
      } catch (error) {
        console.warn(`⚠️ IPFS fetch failed for ${config.tableName} ${id} field ${config.ipfsFields[i]}`);
        ipfsContent.push(`[${config.tableName} ${id} ${config.ipfsFields[i]} - IPFS Unavailable]`);
      }
    }
    
    // Map fields using config's fieldMapping function
    return config.fieldMapping({ ...data, id }, ipfsContent);
  } catch (error) {
    console.error(`❌ Error processing ${config.tableName} ${id}:`, error.message);
    return null;
  }
}

// ========================================
// GENERIC DATABASE FUNCTIONS
// ========================================

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

async function createRecord(table, data) {
  try {
    const response = await dbClient.post(`/${table}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Database create error for ${table}:`, error.response?.data || error.message);
    throw new Error(`Database create failed: ${error.response?.data?.message || error.message}`);
  }
}

async function updateRecord(table, id, data, idColumn = 'id') {
  try {
    const response = await dbClient.patch(`/${table}?${idColumn}=eq.${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Database update error for ${table}:`, error.response?.data || error.message);
    throw new Error(`Database update failed: ${error.response?.data?.message || error.message}`);
  }
}

async function deleteRecord(table, id, idColumn = 'id') {
  try {
    const response = await dbClient.delete(`/${table}?${idColumn}=eq.${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Database delete error for ${table}:`, error.response?.data || error.message);
    throw new Error(`Database delete failed: ${error.response?.data?.message || error.message}`);
  }
}

async function getAllRecords(entityName) {
  const config = ENTITY_CONFIGS[entityName];
  if (!config) throw new Error(`Unknown entity: ${entityName}`);
  return await queryDatabase(config.tableName, { order: 'id' });
}

// ========================================
// GENERIC SYNC FUNCTION
// ========================================

async function syncEntitiesWithData(entityName, fromBlock, toBlock, blockchainData) {
  const config = ENTITY_CONFIGS[entityName];
  if (!config) throw new Error(`Unknown entity: ${entityName}`);
  
  console.log(`🔄 Starting ${entityName} sync with provided data...`);
  
  let newCount = 0;
  let updatedCount = 0;
  let removedCount = 0;
  const errors = [];
  
  try {
    const dbRecords = await getAllRecords(entityName);
    console.log(`📊 Found ${blockchainData.length} ${entityName} in blockchain and ${dbRecords.length} in database`);
    
    const dbMap = new Map();
    const bcMap = new Map();
    
    dbRecords.forEach(record => dbMap.set(record.id, record));
    blockchainData.forEach(record => bcMap.set(record.id, record));
    
    // Phase 1: Check DB records against blockchain
    for (const dbRecord of dbRecords) {
      const bcRecord = bcMap.get(dbRecord.id);
      
      if (!bcRecord) {
        // Record exists in DB but not in blockchain - mark as removed
        try {
          await updateRecord(config.tableName, dbRecord.id, { removed: true });
          removedCount++;
          console.log(`🗑️ Marked ${entityName} ${dbRecord.id} as removed`);
        } catch (error) {
          errors.push({ type: 'remove', id: dbRecord.id, error: error.message });
        }
      } else {
        // Record exists in both - check for updates
        const { hasChanges, updateData } = config.compareFields(dbRecord, bcRecord);
        
        if (hasChanges) {
          try {
            await updateRecord(config.tableName, dbRecord.id, updateData);
            updatedCount++;
            console.log(`✏️ Updated ${entityName} ${dbRecord.id}`);
          } catch (error) {
            errors.push({ type: 'update', id: dbRecord.id, error: error.message });
          }
        }
      }
    }
    
    // Phase 2: Add blockchain records not in DB
    for (const bcRecord of blockchainData) {
      if (!dbMap.has(bcRecord.id)) {
        try {
          await createRecord(config.tableName, bcRecord);
          newCount++;
          console.log(`➕ Created new ${entityName} ${bcRecord.id}`);
        } catch (error) {
          errors.push({ type: 'create', id: bcRecord.id, error: error.message });
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error in ${entityName} sync:`, error);
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
// GENERIC ROUTE HANDLERS
// ========================================

// Create blockchain data routes for all entities
Object.keys(ENTITY_CONFIGS).forEach(entityName => {
  router.get(`/${entityName}/blockchain-data`, async (req, res) => {
    try {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': FRONTEND_BASE_URL,
        'Access-Control-Allow-Credentials': 'true'
      });
      
      const { fromBlock, toBlock } = req.query;
      console.log(`📊 Getting ${entityName} blockchain data from block ${fromBlock} to ${toBlock}`);
      
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(408).json({ success: false, error: 'Request timeout' });
        }
      }, 480000);
      
      const blocksBack = parseInt(req.query.blocksBack) || 10000;
      const data = await timeoutPromise(
        fetchEntitiesOptimized(entityName, blocksBack),
        450000,
        `${entityName}-fetch`
      );
      
      clearTimeout(timeout);
      
      const response = {
        success: true,
        fromBlock: parseInt(fromBlock),
        toBlock: parseInt(toBlock),
        [entityName]: data
      };
      
      if (!res.headersSent) {
        res.json(response);
      } else {
        res.end(JSON.stringify(response));
      }
      
    } catch (error) {
      console.error(`❌ Error getting ${entityName} blockchain data:`, error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false,
          error: error.message || `Failed to get ${entityName} blockchain data` 
        });
      }
    }
  });
});

// ========================================
// USER SYNC (Special case)
// ========================================

async function syncUsersWithBlockchain() {
  console.log('🔑 Starting user sync with blockchain...');
  const errors = [];
  let revokedCount = 0;
  let removedCount = 0;
  
  try {
    const dbUsers = await queryDatabase('users', { select: 'id,evm,revoked', order: 'id' });
    
    let verifiedAddresses = [];
    try {
      const contractAddress = CONTRACT_ADDRESSES.AuthRegistry;
      if (contractAddress) {
        const authContract = await getContractInstance('AuthRegistry', contractAddress);
        if (typeof authContract.getVerifiedUsers === 'function') {
          const bcUsers = await authContract.getVerifiedUsers();
          verifiedAddresses = bcUsers.map(u => u.toLowerCase());
        }
      }
    } catch (err) {
      console.warn('Could not fetch verified users from blockchain:', err.message);
    }
    
    const dbUserMap = new Map();
    dbUsers.forEach(u => dbUserMap.set(u.evm.toLowerCase(), u));
    
    // Remove/revoke users in DB not in blockchain
    for (const user of dbUsers) {
      const addr = user.evm.toLowerCase();
      if (!verifiedAddresses.includes(addr)) {
        try {
          if (!user.revoked) {
            await updateRecord('users', user.id, { revoked: true });
            revokedCount++;
          }
        } catch (error) {
          errors.push({ type: 'revoke', id: user.id, error: error.message });
        }
      }
    }
    
    // Add users from blockchain if not in DB
    for (const bcAddr of verifiedAddresses) {
      if (!dbUserMap.has(bcAddr)) {
        try {
          await createRecord('users', { evm: bcAddr, revoked: false });
        } catch (error) {
          errors.push({ type: 'create', address: bcAddr, error: error.message });
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

router.post('/sync/execute', async (req, res) => {
  console.log('🚀 Starting comprehensive blockchain synchronization...');
  
  try {
    const { blocksBack = 1000, isFullSync = false } = req.body;
    
    const latestBlock = await provider.getBlockNumber();
    const toBlock = Number(latestBlock);
    const fromBlock = Math.max(0, toBlock - blocksBack);
    
    console.log(`📊 Syncing blockchain data from block ${fromBlock} to ${toBlock}`);
    
    // Fetch all blockchain data in parallel
    console.log('🚀 Starting parallel fetch of all blockchain data...');
    
    const entityNames = Object.keys(ENTITY_CONFIGS);
    const fetchPromises = entityNames.map(entityName => 
      fetchEntitiesOptimized(entityName, blocksBack).catch(e => {
        console.error(`Error fetching ${entityName}:`, e.message);
        return [];
      })
    );
    
    const allData = await Promise.all(fetchPromises);
    const dataMap = {};
    entityNames.forEach((name, index) => {
      dataMap[name] = allData[index];
      console.log(`📋 ${name}: ${allData[index].length} items`);
    });
    
    // Execute all sync functions in parallel
    const syncPromises = [
      ...entityNames.map(entityName => 
        syncEntitiesWithData(entityName, fromBlock, toBlock, dataMap[entityName])
      ),
      syncUsersWithBlockchain()
    ];
    
    const syncResults = await Promise.allSettled(syncPromises);
    
    // Process results
    let totalNew = 0;
    let totalUpdated = 0;
    let totalRemoved = 0;
    let totalErrors = 0;
    const detailedResults = [];
    
    const allEntityNames = [...entityNames, 'users'];
    
    syncResults.forEach((result, index) => {
      const entityName = allEntityNames[index];
      
      if (result.status === 'fulfilled') {
        const data = result.value.results || result.value;
        totalNew += data.new || 0;
        totalUpdated += data.updated || 0;
        totalRemoved += data.removed || data.revoked || 0;
        totalErrors += data.errors?.length || 0;
        
        detailedResults.push({
          type: entityName,
          result: {
            results: {
              new: data.new || 0,
              updated: data.updated || 0,
              removed: data.removed || data.revoked || 0,
              errors: data.errors || []
            }
          }
        });
      } else {
        totalErrors++;
        detailedResults.push({
          type: entityName,
          result: null,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });
    
    const finalResult = {
      status: 'completed',
      fromBlock,
      toBlock,
      isFullSync,
      summary: { totalNew, totalUpdated, totalRemoved, totalErrors },
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
