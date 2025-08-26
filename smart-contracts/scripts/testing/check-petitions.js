const { ethers } = require("hardhat");
const { getFromPinata } = require("../ipfs.js");
const fs = require('fs');
const path = require('path');

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
 // From deployed-addresses.json
  sepolia: "0x5475D9bE5bbfa84392D15DA0cCdfF5d64339bf16", // Update this with your actual Sepolia address
  // Add other networks as needed
};

function getContractAddress() {
  // Check what network we're on first
  const networkName = process.env.HARDHAT_NETWORK || 'localhost';
  
  // If we're on Sepolia, use the Sepolia address
  if (networkName === 'sepolia') {
    console.log("🌐 Using Sepolia contract address");
    return CONTRACT_ADDRESSES.sepolia;
  }
  
  // Try to load from deployed-addresses.json for localhost
  const addresses = loadDeployedAddresses();
  if (addresses && addresses.Petitions) {
    console.log("📋 Using address from deployed-addresses.json");
    return addresses.Petitions;
  }
  
  // Fallback to hardcoded addresses based on network
  console.log("⚠️  Using fallback address");
  return CONTRACT_ADDRESSES.sepolia;
}

function loadDeployedAddresses() {
  try {
    const p = path.join(__dirname, '..', 'deployed-addresses.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load deployed-addresses.json:', e.message);
  }
  return null;
}

async function checkPetitionsData() {
  try {
    console.log("🔍 Starting petition data check...");
    console.log("=" * 60);

    // Get the contract address
    const finalContractAddress = getContractAddress();
    console.log(`📍 Contract Address: ${finalContractAddress}`);
    
    // Get network info first
    const currentNetwork = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`);
    
    // Check network and suggest correct address if needed
    if (currentNetwork.chainId === 11155111n) {
      console.log("✅ Connected to Sepolia testnet");
    } else if (currentNetwork.chainId === 31337n) {
      console.log("⚠️  Connected to local Hardhat network");
      console.log("💡 Switch to Sepolia network using: npx hardhat run --network sepolia scripts/check-petitions.js");
    } else {
      console.log(`⚠️  Connected to unexpected network: ${currentNetwork.name}`);
    }
    
    // Get contract factory and attach to deployed contract
    const Petitions = await ethers.getContractFactory("Petitions");
    const petitions = Petitions.attach(finalContractAddress);
    
    // Connect with provider explicitly for read-only operations
    const connectedContract = petitions.connect(ethers.provider);
    
    // Check if contract exists and is accessible
    console.log("🔗 Testing contract connection...");
    
    // Get petition count
    let petitionCount;
    try {
      petitionCount = await connectedContract.petitionCount();
      console.log(`📊 Total Petitions: ${petitionCount.toString()}`);
    } catch (error) {
      console.error("❌ Error getting petition count:", error.message);
      console.log("💡 Possible issues:");
      console.log("   - Contract not deployed at this address on current network");
      console.log("   - Wrong network (make sure you're on Sepolia)");
      console.log("   - Contract ABI mismatch");
      console.log(`   - Current network: ${currentNetwork.name} (${currentNetwork.chainId})`);
      console.log("   - Try running with: npx hardhat run --network sepolia scripts/check-petitions.js");
      
      // Try alternative approach using provider directly
      console.log("\n🔄 Trying alternative approach...");
      try {
        const code = await ethers.provider.getCode(finalContractAddress);
        if (code === "0x") {
          console.log("❌ No contract found at this address");
        } else {
          console.log("✅ Contract code exists at this address");
          console.log(`📏 Contract bytecode length: ${code.length} characters`);
        }
      } catch (codeError) {
        console.error("❌ Could not check contract code:", codeError.message);
      }
      return;
    }
    
    if (petitionCount.toString() === "0") {
      console.log("📭 No petitions found in the contract");
      console.log("💡 Try creating a petition first using the frontend or API");
      return;
    }
    
    console.log("\n" + "=" * 60);
    console.log("📋 PETITION DETAILS:");
    console.log("=" * 60);
    
    // Loop through all petitions and display their data
    for (let i = 1; i <= petitionCount; i++) {
      try {
        console.log(`\n🗳️  PETITION #${i}`);
        console.log("-" * 40);
        
        // Get petition data from blockchain
        const petition = await connectedContract.getPetition(i);
        
        const titleCid = petition[0];
        const descriptionCid = petition[1];
        const signaturesRequired = petition[2];
        const signaturesCount = petition[3];
        const creator = petition[4];
        const completed = petition[5];
        
        console.log(`🆔 Petition ID: ${i}`);
        console.log(`👤 Creator: ${creator}`);
        console.log(`📝 Title CID: ${titleCid}`);
        console.log(`📄 Description CID: ${descriptionCid}`);
        console.log(`🎯 Required Signatures: ${signaturesRequired.toString()}`);
        console.log(`✍️  Current Signatures: ${signaturesCount.toString()}`);
        console.log(`✅ Completed: ${completed}`);
        
        // Calculate progress
        const progress = signaturesRequired > 0 ? 
          (Number(signaturesCount) / Number(signaturesRequired) * 100).toFixed(1) : 0;
        console.log(`📈 Progress: ${progress}%`);
        
        // Try to fetch actual title and description from IPFS
        console.log("\n🌐 Fetching content from IPFS...");
        
        try {
          const title = await getFromPinata(titleCid);
          console.log(`📋 Title: "${title}"`);
        } catch (ipfsError) {
          console.log(`❌ Could not fetch title from IPFS: ${ipfsError.message}`);
        }
        
        try {
          const description = await getFromPinata(descriptionCid);
          console.log(`📝 Description: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}"`);
        } catch (ipfsError) {
          console.log(`❌ Could not fetch description from IPFS: ${ipfsError.message}`);
        }
        
        // Check recent signers (if the contract has this function)
        try {
          // Some contracts might have a function to get signers
          console.log("\n👥 Checking for signers...");
          // This is optional - not all contracts have this function
          // const signers = await petitions.getPetitionSigners(i);
          // console.log(`🖋️  Signers: ${signers.join(', ')}`);
        } catch (signersError) {
          console.log("ℹ️  Signer list not available (function may not exist)");
        }
        
      } catch (error) {
        console.error(`❌ Error fetching petition #${i}:`, error.message);
      }
    }
    
    console.log("\n" + "=" * 60);
    console.log("📊 SUMMARY");
    console.log("=" * 60);
    console.log(`📈 Total Petitions: ${petitionCount.toString()}`);
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get current block
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`🧱 Current Block: ${blockNumber}`);
    
    console.log("\n✅ Petition data check completed!");
    
  } catch (error) {
    console.error("❌ Error during petition check:", error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure the contract is deployed to the current network");
    console.log("2. Check that the contract address is correct");
    console.log("3. Ensure you're connected to the right network (Sepolia, etc.)");
    console.log("4. Verify the contract ABI matches the deployed contract");
  }
}

// Additional function to check a specific petition by ID
async function checkSpecificPetition(petitionId) {
  try {
    console.log(`🔍 Checking specific petition #${petitionId}...`);
    
    const finalContractAddress = getContractAddress();
    
    const Petitions = await ethers.getContractFactory("Petitions");
    const petitions = await Petitions.attach(finalContractAddress);
    
    const petition = await petitions.getPetition(petitionId);
    
    console.log(`\n🗳️  PETITION #${petitionId} DETAILS:`);
    console.log("-" * 40);
    console.log(`Title CID: ${petition[0]}`);
    console.log(`Description CID: ${petition[1]}`);
    console.log(`Required: ${petition[2].toString()}`);
    console.log(`Current: ${petition[3].toString()}`);
    console.log(`Creator: ${petition[4]}`);
    console.log(`Completed: ${petition[5]}`);
    
    return petition;
  } catch (error) {
    console.error(`❌ Error checking petition #${petitionId}:`, error.message);
    return null;
  }
}

// Function to check if an address has signed a specific petition
async function checkHasSigned(petitionId, address) {
  try {
    const finalContractAddress = getContractAddress();
    
    const Petitions = await ethers.getContractFactory("Petitions");
    const petitions = await Petitions.attach(finalContractAddress);
    
    const hasSigned = await petitions.hasSigned(petitionId, address);
    console.log(`🖋️  Address ${address} has ${hasSigned ? '' : 'NOT '}signed petition #${petitionId}`);
    
    return hasSigned;
  } catch (error) {
    console.error(`❌ Error checking signature:`, error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log("🚀 Petition Contract Data Checker");
  console.log("=" * 60);
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments - check all petitions
    await checkPetitionsData();
  } else if (args[0] === "petition" && args[1]) {
    // Check specific petition: node check-petitions.js petition 1
    await checkSpecificPetition(parseInt(args[1]));
  } else if (args[0] === "signed" && args[1] && args[2]) {
    // Check if address signed: node check-petitions.js signed 1 0x1234...
    await checkHasSigned(parseInt(args[1]), args[2]);
  } else {
    console.log("📖 Usage:");
    console.log("  node check-petitions.js                    - Check all petitions");
    console.log("  node check-petitions.js petition <id>      - Check specific petition");
    console.log("  node check-petitions.js signed <id> <addr> - Check if address signed petition");
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = {
  checkPetitionsData,
  checkSpecificPetition,
  checkHasSigned
};
