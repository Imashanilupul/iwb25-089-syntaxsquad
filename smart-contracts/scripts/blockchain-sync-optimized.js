const express = require("express");
let ethers;
let provider;

// Initialize ethers and provider (same as blockchain-sync.js)
try {
  const hh = require('hardhat');
  ethers = hh.ethers;
  provider = ethers.provider || hh.network.provider;
  console.log('Using Hardhat ethers provider');
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
      } else if (ethers.providers && typeof ethers.providers.getDefaultProvider === 'function') {
        provider = ethers.providers.getDefaultProvider(networkName, providerOptions);
      } else {
        throw new Error('No getDefaultProvider available on ethers');
      }
      console.log('Using default provider for network', networkName, 'with options', Object.keys(providerOptions));
    } catch (e) {
      const localRpc = 'http://localhost:8545';
      provider = new (ethers.JsonRpcProvider ? ethers.JsonRpcProvider : ethers.providers.JsonRpcProvider)(localRpc);
      console.warn('Could not create default provider, falling back to local RPC', localRpc, 'error:', e.message);
    }
  }
}

const { getFromPinata } = require("./ipfs.js");

// Contract addresses
const CONTRACT_ADDRESSES = {
  AuthRegistry: "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9",
  Petitions: "0x1577FD3B3E54cFA368F858d542920A0fefBaf807", 
  Reports: "0xD8E110E021a9281b8ad7A6Cf93c2b14b3e3B2712",
  Policies: "0x6a957A0D571b3Ed50AFc02Ac62CC061C6c533138",
  Proposals: "0xff40F4C374c1038378c7044720B939a2a0219a2f",
  Project: "0x1770c50E6Bc8bbFB662c7ec45924aE986473b970"
};

// Helper function to get contract instance
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

  try {
    const path = require('path');
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${name}.sol`, `${name}.json`);
    const art = require(artifactPath);
    return new ethers.Contract(address, art.abi, provider);
  } catch (e) {
    console.warn(`Could not load artifact for ${name}:`, e.message);
  }

  return new ethers.Contract(address, [], provider);
}

// Helper function to fetch IPFS content with timeout
async function fetchIPFSContent(cid) {
  if (!cid || cid.trim() === '') return '';
  
  try {
    const content = await Promise.race([
      getFromPinata(cid),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`IPFS timeout for ${cid}`)), 10000)
      )
    ]);
    
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

// Optimized proposals fetch with progress callback
async function fetchProposalsOptimized(blocksBack, progressCallback = null) {
  console.log('🗳️ Starting optimized proposals fetch...');
  
  try {
    const connectedContract = await getContractInstance("Proposals", CONTRACT_ADDRESSES.Proposals);
    const proposalCount = await connectedContract.proposalCount();
    const totalProposals = Number(proposalCount.toString());
    
    console.log(`📊 Found ${totalProposals} proposals in blockchain`);
    
    if (progressCallback) {
      progressCallback(5, `Found ${totalProposals} proposals to process`);
    }
    
    const proposalsData = [];
    const batchSize = 3; // Smaller batches for better progress tracking
    let processed = 0;
    
    for (let i = 1; i <= totalProposals; i += batchSize) {
      const batch = [];
      const endIndex = Math.min(i + batchSize - 1, totalProposals);
      
      for (let j = i; j <= endIndex; j++) {
        batch.push(
          processProposal(connectedContract, j).catch(error => {
            console.error(`❌ Error processing proposal ${j}:`, error.message);
            return null;
          })
        );
      }
      
      const results = await Promise.all(batch);
      proposalsData.push(...results.filter(result => result !== null));
      
      processed += batch.length;
      const progressPercent = Math.floor((processed / totalProposals) * 100);
      
      if (progressCallback) {
        progressCallback(progressPercent, `Processed ${processed}/${totalProposals} proposals`);
      }
      
      console.log(`✅ Processed proposals batch ${i}-${endIndex} (${processed}/${totalProposals})`);
      
      // Small delay to prevent overwhelming the RPC
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Proposals fetch completed: ${proposalsData.length} proposals processed`);
    return proposalsData;
  } catch (error) {
    console.error("❌ Error in fetchProposalsOptimized:", error);
    throw error;
  }
}

async function processProposal(connectedContract, i) {
  const proposal = await connectedContract.getProposal(i);
  
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
  
  const [title, shortDescription, descriptionInDetails] = await Promise.all([
    fetchIPFSContent(titleCid),
    fetchIPFSContent(shortDescriptionCid),
    fetchIPFSContent(descriptionInDetailsCid)
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

// Optimized petitions fetch with progress callback
async function fetchPetitionsOptimized(blocksBack, progressCallback = null) {
  console.log('📝 Starting optimized petitions fetch...');
  
  try {
    const connectedContract = await getContractInstance("Petitions", CONTRACT_ADDRESSES.Petitions);
    const petitionCount = await connectedContract.petitionCount();
    const totalPetitions = Number(petitionCount.toString());
    
    console.log(`📊 Found ${totalPetitions} petitions in blockchain`);
    
    if (progressCallback) {
      progressCallback(5, `Found ${totalPetitions} petitions to process`);
    }
    
    const petitionsData = [];
    const batchSize = 3;
    let processed = 0;
    
    for (let i = 1; i <= totalPetitions; i += batchSize) {
      const batch = [];
      const endIndex = Math.min(i + batchSize - 1, totalPetitions);
      
      for (let j = i; j <= endIndex; j++) {
        batch.push(
          processPetition(connectedContract, j).catch(error => {
            console.error(`❌ Error processing petition ${j}:`, error.message);
            return null;
          })
        );
      }
      
      const results = await Promise.all(batch);
      petitionsData.push(...results.filter(result => result !== null));
      
      processed += batch.length;
      const progressPercent = Math.floor((processed / totalPetitions) * 100);
      
      if (progressCallback) {
        progressCallback(progressPercent, `Processed ${processed}/${totalPetitions} petitions`);
      }
      
      console.log(`✅ Processed petitions batch ${i}-${endIndex} (${processed}/${totalPetitions})`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Petitions fetch completed: ${petitionsData.length} petitions processed`);
    return petitionsData;
  } catch (error) {
    console.error("❌ Error in fetchPetitionsOptimized:", error);
    throw error;
  }
}

async function processPetition(connectedContract, i) {
  const petition = await connectedContract.getPetition(i);
  
  const [title, description] = await Promise.all([
    fetchIPFSContent(petition[0]),
    fetchIPFSContent(petition[1])
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

// Optimized reports fetch with progress callback
async function fetchReportsOptimized(blocksBack, progressCallback = null) {
  console.log('📊 Starting optimized reports fetch...');
  
  try {
    const connectedContract = await getContractInstance("Reports", CONTRACT_ADDRESSES.Reports);
    const reportCount = await connectedContract.reportCount();
    const totalReports = Number(reportCount.toString());
    
    console.log(`📊 Found ${totalReports} reports in blockchain`);
    
    if (progressCallback) {
      progressCallback(5, `Found ${totalReports} reports to process`);
    }
    
    const reportsData = [];
    const batchSize = 3;
    let processed = 0;
    
    for (let i = 1; i <= totalReports; i += batchSize) {
      const batch = [];
      const endIndex = Math.min(i + batchSize - 1, totalReports);
      
      for (let j = i; j <= endIndex; j++) {
        batch.push(
          processReport(connectedContract, j).catch(error => {
            console.error(`❌ Error processing report ${j}:`, error.message);
            return null;
          })
        );
      }
      
      const results = await Promise.all(batch);
      reportsData.push(...results.filter(result => result !== null));
      
      processed += batch.length;
      const progressPercent = Math.floor((processed / totalReports) * 100);
      
      if (progressCallback) {
        progressCallback(progressPercent, `Processed ${processed}/${totalReports} reports`);
      }
      
      console.log(`✅ Processed reports batch ${i}-${endIndex} (${processed}/${totalReports})`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Reports fetch completed: ${reportsData.length} reports processed`);
    return reportsData;
  } catch (error) {
    console.error("❌ Error in fetchReportsOptimized:", error);
    throw error;
  }
}

async function processReport(connectedContract, i) {
  const report = await connectedContract.getReport(i);
  
  const [title, description] = await Promise.all([
    fetchIPFSContent(report[0]),
    fetchIPFSContent(report[1])
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

// Optimized all blockchain data fetch with progress callback
async function fetchAllBlockchainDataOptimized(blocksBack, progressCallback = null) {
  console.log('🔗 Starting optimized full blockchain data fetch...');
  
  const startTime = Date.now();
  
  try {
    const latestBlock = await provider.getBlockNumber();
    const toBlock = Number(latestBlock);
    const fromBlock = Math.max(0, toBlock - blocksBack);

    if (progressCallback) {
      progressCallback(5, `Scanning blocks ${fromBlock} to ${toBlock}`);
    }

    console.log(`📊 Aggregated blockchain data request — blocks ${fromBlock}..${toBlock} (back ${blocksBack})`);

    const result = {
      success: true,
      fromBlock,
      toBlock,
      authRegistry: [],
      petitions: [],
      proposals: [],
      reports: [],
      policies: [],
      projects: [],
      processingTime: 0
    };

    // Create progress tracking for each contract type
    const totalSteps = 5; // proposals, petitions, reports, policies, projects
    let currentStep = 0;

    // Proposals (20% of progress: 10-30%)
    if (progressCallback) {
      progressCallback(10, 'Starting proposals sync...');
    }
    
    try {
      result.proposals = await fetchProposalsOptimized(blocksBack, (progress, message) => {
        if (progressCallback) {
          const overallProgress = 10 + (progress * 0.2); // Map to 10-30%
          progressCallback(overallProgress, `Proposals: ${message}`);
        }
      });
      currentStep++;
    } catch (e) {
      console.warn('Proposals fetch failed:', e.message);
      result.proposals = [];
    }

    // Petitions (20% of progress: 30-50%)
    if (progressCallback) {
      progressCallback(30, 'Starting petitions sync...');
    }
    
    try {
      result.petitions = await fetchPetitionsOptimized(blocksBack, (progress, message) => {
        if (progressCallback) {
          const overallProgress = 30 + (progress * 0.2); // Map to 30-50%
          progressCallback(overallProgress, `Petitions: ${message}`);
        }
      });
      currentStep++;
    } catch (e) {
      console.warn('Petitions fetch failed:', e.message);
      result.petitions = [];
    }

    // Reports (20% of progress: 50-70%)
    if (progressCallback) {
      progressCallback(50, 'Starting reports sync...');
    }
    
    try {
      result.reports = await fetchReportsOptimized(blocksBack, (progress, message) => {
        if (progressCallback) {
          const overallProgress = 50 + (progress * 0.2); // Map to 50-70%
          progressCallback(overallProgress, `Reports: ${message}`);
        }
      });
      currentStep++;
    } catch (e) {
      console.warn('Reports fetch failed:', e.message);
      result.reports = [];
    }

    // Policies (15% of progress: 70-85%)
    if (progressCallback) {
      progressCallback(70, 'Starting policies sync...');
    }
    
    try {
      const connectedContract = await getContractInstance('Policies', CONTRACT_ADDRESSES.Policies);
      if (typeof connectedContract.policyCount === 'function') {
        const policyCount = await connectedContract.policyCount();
        result.policies = [];
        
        for (let i = 1; i <= Number(policyCount.toString()); i++) {
          try {
            const p = await connectedContract.getPolicy(i);
            // Convert BigInt values to strings/numbers
            const processedPolicy = {
              id: i,
              name: p[0] || '',
              description: p[1] || '',
              viewFullPolicy: p[2] || '',
              ministry: p[3] || '',
              status: p[4] || '',
              effectiveDate: p[5] ? Number(p[5].toString()) : 0,
              createdAt: p[6] ? Number(p[6].toString()) : 0,
              updatedAt: p[7] ? Number(p[7].toString()) : 0
            };
            result.policies.push(processedPolicy);
          } catch (e) {
            console.warn(`Policy ${i} read error:`, e.message);
          }
        }
      }
      currentStep++;
    } catch (e) {
      console.warn('Policies fetch failed:', e.message);
      result.policies = [];
    }

    // Projects (15% of progress: 85-100%)
    if (progressCallback) {
      progressCallback(85, 'Starting projects sync...');
    }
    
    try {
      const connectedContract = await getContractInstance('Project', CONTRACT_ADDRESSES.Project);
      if (typeof connectedContract.projectCount === 'function') {
        const projectCount = await connectedContract.projectCount();
        result.projects = [];
        
        for (let i = 1; i <= Number(projectCount.toString()); i++) {
          try {
            const pj = await connectedContract.getProject(i);
            // Convert BigInt values to strings/numbers
            const processedProject = {
              id: i,
              projectName: pj[0] || '',
              state: pj[1] || '',
              province: pj[2] || '',
              ministry: pj[3] || '',
              allocatedBudget: pj[4] ? Number(pj[4].toString()) : 0,
              categoryId: pj[5] ? Number(pj[5].toString()) : 0,
              spentBudget: pj[6] ? Number(pj[6].toString()) : 0,
              viewDetails: pj[7] || '',
              status: pj[8] || '',
              createdAt: pj[9] ? Number(pj[9].toString()) : 0,
              updatedAt: pj[10] ? Number(pj[10].toString()) : 0
            };
            result.projects.push(processedProject);
          } catch (e) {
            console.warn(`Project ${i} read error:`, e.message);
          }
        }
      }
      currentStep++;
    } catch (e) {
      console.warn('Projects fetch failed:', e.message);
      result.projects = [];
    }

    result.processingTime = Date.now() - startTime;
    
    if (progressCallback) {
      progressCallback(100, `Completed! Processed ${result.proposals.length} proposals, ${result.petitions.length} petitions, ${result.reports.length} reports`);
    }
    
    console.log(`🎉 Full blockchain data fetch completed in ${result.processingTime}ms`);
    return result;
    
  } catch (error) {
    console.error('❌ Optimized fetch failed:', error);
    throw error;
  }
}

module.exports = {
  fetchProposalsOptimized,
  fetchPetitionsOptimized,
  fetchReportsOptimized,
  fetchAllBlockchainDataOptimized
};
