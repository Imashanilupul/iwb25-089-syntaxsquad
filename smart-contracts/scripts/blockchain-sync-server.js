const express = require('express');
const { ethers } = require('hardhat');

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Contract addresses on Sepolia
const CONTRACT_ADDRESSES = {
  AuthRegistry: "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9",
  Petitions: "0x1577FD3B3E54cFA368F858d542920A0fefBaf807", 
  Reports: "0xD8E110E021a9281b8ad7A6Cf93c2b14b3e3B2712",
  Policies: "0x6a957A0D571b3Ed50AFc02Ac62CC061C6c533138",
  Proposals: "0xff40F4C374c1038378c7044720B939a2a0219a2f",
  Project: "0x1770c50E6Bc8bbFB662c7ec45924aE986473b970"
};

// Initialize provider for Sepolia
let provider;
(async () => {
  try {
    // Use public Sepolia RPC endpoints
    provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
    const network = await provider.getNetwork();
    console.log(`🌐 Connected to: ${network.name} (chainId: ${network.chainId})`);
  } catch (error) {
    console.error("❌ Failed to connect to Sepolia:", error.message);
    // Fallback to another public endpoint
    try {
      provider = new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
      const network = await provider.getNetwork();
      console.log(`🌐 Connected to fallback: ${network.name} (chainId: ${network.chainId})`);
    } catch (fallbackError) {
      console.error("❌ All RPC endpoints failed:", fallbackError.message);
      provider = ethers.getDefaultProvider('sepolia');
    }
  }
})();

// IPFS content fetcher using Pinata (your setup)
const fetchFromIPFS = async (cid) => {
  if (!cid || cid.trim() === '') return '';
  
  try {
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain, application/json, */*'
      }
    });
    
    if (response.ok) {
      const content = await response.text();
      console.log(`✅ Retrieved IPFS content for CID ${cid}:`, content.substring(0, 100) + '...');
      return content.trim();
    } else {
      console.error(`❌ Failed to fetch CID ${cid}: ${response.status} ${response.statusText}`);
      return `[IPFS Error: ${cid}]`;
    }
  } catch (error) {
    console.error(`❌ Error fetching IPFS content for CID ${cid}:`, error);
    return `[IPFS Error: ${cid}]`;
  }
};

// Proposals endpoint
app.post('/proposals/blockchain-data', async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.body;
    console.log(`💡 Fetching proposals from blocks ${fromBlock} to ${toBlock}`);

    const Proposals = new ethers.Contract(
      CONTRACT_ADDRESSES.Proposals,
      [
        "function proposalCount() external view returns (uint256)",
        "function getProposal(uint256 proposalId) external view returns (string, string, address, uint256, uint256, bool)"
      ],
      provider
    );

    const proposalCount = await Proposals.proposalCount();
    console.log(`💡 Found ${proposalCount} proposals in blockchain`);

    const proposals = [];
    for (let i = 1; i <= Number(proposalCount); i++) {
      try {
        const proposal = await Proposals.getProposal(i);
        
        const title = await fetchFromIPFS(proposal[0]);
        const description = await fetchFromIPFS(proposal[1]);
        
        proposals.push({
          blockchain_proposal_id: i,
          title: title,
          description: description,
          proposer_address: proposal[2],
          votes_for: Number(proposal[3]),
          votes_against: Number(proposal[4]),
          is_executed: proposal[5],
          status: proposal[5] ? 'EXECUTED' : 'ACTIVE',
          creator_id: 1,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Error fetching proposal ${i}:`, error.message);
        proposals.push({
          blockchain_proposal_id: i,
          title: `[Error fetching proposal ${i}]`,
          description: `Error: ${error.message}`,
          proposer_address: "0x0000000000000000000000000000000000000000",
          votes_for: 0,
          votes_against: 0,
          is_executed: false,
          status: 'ERROR',
          creator_id: 1,
          created_at: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      contractType: 'proposals',
      count: proposals.length,
      data: proposals
    });

  } catch (error) {
    console.error('❌ Proposals sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      contractType: 'proposals'
    });
  }
});

// Petitions endpoint
app.post('/petitions/blockchain-data', async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.body;
    console.log(`📜 Fetching petitions from blocks ${fromBlock} to ${toBlock}`);

    const Petitions = new ethers.Contract(
      CONTRACT_ADDRESSES.Petitions,
      [
        "function petitionCount() external view returns (uint256)",
        "function getPetition(uint256 petitionId) external view returns (string, string, uint256, uint256, address, bool)"
      ],
      provider
    );

    const petitionCount = await Petitions.petitionCount();
    console.log(`📜 Found ${petitionCount} petitions in blockchain`);

    const petitions = [];
    for (let i = 1; i <= Number(petitionCount); i++) {
      try {
        const petition = await Petitions.getPetition(i);
        
        const title = await fetchFromIPFS(petition[0]);
        const description = await fetchFromIPFS(petition[1]);
        
        petitions.push({
          blockchain_petition_id: i,
          title: title,
          description: description,
          required_signature_count: Number(petition[2]),
          signature_count: Number(petition[3]),
          creator_address: petition[4],
          is_completed: petition[5],
          status: petition[5] ? 'COMPLETED' : 'ACTIVE',
          creator_id: 1,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Error fetching petition ${i}:`, error.message);
        petitions.push({
          blockchain_petition_id: i,
          title: `[Error fetching petition ${i}]`,
          description: `Error: ${error.message}`,
          required_signature_count: 0,
          signature_count: 0,
          creator_address: "0x0000000000000000000000000000000000000000",
          is_completed: false,
          status: 'ERROR',
          creator_id: 1,
          created_at: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      contractType: 'petitions',
      count: petitions.length,
      data: petitions
    });

  } catch (error) {
    console.error('❌ Petitions sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      contractType: 'petitions'
    });
  }
});

// Reports endpoint
app.post('/reports/blockchain-data', async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.body;
    console.log(`📋 Fetching reports from blocks ${fromBlock} to ${toBlock}`);

    const Reports = new ethers.Contract(
      CONTRACT_ADDRESSES.Reports,
      [
        "function reportCount() external view returns (uint256)",
        "function getReport(uint256 reportId) external view returns (string, string, address, uint256, uint256)"
      ],
      provider
    );

    const reportCount = await Reports.reportCount();
    console.log(`📋 Found ${reportCount} reports in blockchain`);

    const reports = [];
    for (let i = 1; i <= Number(reportCount); i++) {
      try {
        const report = await Reports.getReport(i);
        
        const title = await fetchFromIPFS(report[0]);
        const description = await fetchFromIPFS(report[1]);
        
        reports.push({
          blockchain_report_id: i,
          title: title,
          description: description,
          reporter_address: report[2],
          target_type: Number(report[3]),
          target_id: Number(report[4]),
          status: 'PENDING',
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Error fetching report ${i}:`, error.message);
        reports.push({
          blockchain_report_id: i,
          title: `[Error fetching report ${i}]`,
          description: `Error: ${error.message}`,
          reporter_address: "0x0000000000000000000000000000000000000000",
          target_type: 0,
          target_id: 0,
          status: 'ERROR',
          created_at: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      contractType: 'reports',
      count: reports.length,
      data: reports
    });

  } catch (error) {
    console.error('❌ Reports sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      contractType: 'reports'
    });
  }
});

// Policies endpoint
app.post('/policies/blockchain-data', async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.body;
    console.log(`📜 Fetching policies from blocks ${fromBlock} to ${toBlock}`);

    const Policies = new ethers.Contract(
      CONTRACT_ADDRESSES.Policies,
      [
        "function policyCount() external view returns (uint256)",
        "function getPolicy(uint256 policyId) external view returns (string, string, address, uint256, bool)"
      ],
      provider
    );

    const policyCount = await Policies.policyCount();
    console.log(`📜 Found ${policyCount} policies in blockchain`);

    const policies = [];
    for (let i = 1; i <= Number(policyCount); i++) {
      try {
        const policy = await Policies.getPolicy(i);
        
        const title = await fetchFromIPFS(policy[0]);
        const content = await fetchFromIPFS(policy[1]);
        
        policies.push({
          blockchain_policy_id: i,
          title: title,
          content: content,
          author_address: policy[2],
          category_id: Number(policy[3]),
          is_active: policy[4],
          status: policy[4] ? 'ACTIVE' : 'INACTIVE',
          author_id: 1,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Error fetching policy ${i}:`, error.message);
        policies.push({
          blockchain_policy_id: i,
          title: `[Error fetching policy ${i}]`,
          content: `Error: ${error.message}`,
          author_address: "0x0000000000000000000000000000000000000000",
          category_id: 1,
          is_active: false,
          status: 'ERROR',
          author_id: 1,
          created_at: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      contractType: 'policies',
      count: policies.length,
      data: policies
    });

  } catch (error) {
    console.error('❌ Policies sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      contractType: 'policies'
    });
  }
});

// Projects endpoint
app.post('/projects/blockchain-data', async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.body;
    console.log(`🏗️ Fetching projects from blocks ${fromBlock} to ${toBlock}`);

    const Projects = new ethers.Contract(
      CONTRACT_ADDRESSES.Project,
      [
        "function projectCount() external view returns (uint256)",
        "function getProject(uint256 projectId) external view returns (string, string, address, uint256, uint256, bool)"
      ],
      provider
    );

    const projectCount = await Projects.projectCount();
    console.log(`🏗️ Found ${projectCount} projects in blockchain`);

    const projects = [];
    for (let i = 1; i <= Number(projectCount); i++) {
      try {
        const project = await Projects.getProject(i);
        
        const title = await fetchFromIPFS(project[0]);
        const description = await fetchFromIPFS(project[1]);
        
        projects.push({
          blockchain_project_id: i,
          title: title,
          description: description,
          creator_address: project[2],
          budget: Number(project[3]),
          deadline: Number(project[4]),
          is_completed: project[5],
          status: project[5] ? 'COMPLETED' : 'ACTIVE',
          creator_id: 1,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Error fetching project ${i}:`, error.message);
        projects.push({
          blockchain_project_id: i,
          title: `[Error fetching project ${i}]`,
          description: `Error: ${error.message}`,
          creator_address: "0x0000000000000000000000000000000000000000",
          budget: 0,
          deadline: 0,
          is_completed: false,
          status: 'ERROR',
          creator_id: 1,
          created_at: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      contractType: 'projects',
      count: projects.length,
      data: projects
    });

  } catch (error) {
    console.error('❌ Projects sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      contractType: 'projects'
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Blockchain sync service running on port ${PORT}`);
  console.log(`📊 Endpoints available:`);
  console.log(`   POST /proposals/blockchain-data`);
  console.log(`   POST /petitions/blockchain-data`);
  console.log(`   POST /reports/blockchain-data`);
  console.log(`   POST /policies/blockchain-data`);  
  console.log(`   POST /projects/blockchain-data`);
});
