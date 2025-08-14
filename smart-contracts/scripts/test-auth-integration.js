const hre = require("hardhat");

async function main() {
  // Replace these with your deployed contract addresses
  const AUTH_REGISTRY_ADDRESS = "YOUR_AUTH_REGISTRY_ADDRESS_HERE";
  const PETITIONS_ADDRESS = "YOUR_PETITIONS_ADDRESS_HERE";

  const [owner, user1, user2] = await hre.ethers.getSigners();

  // Get contract instances
  const AuthRegistry = await hre.ethers.getContractFactory("AuthRegistry");
  const authRegistry = AuthRegistry.attach(AUTH_REGISTRY_ADDRESS);

  const Petitions = await hre.ethers.getContractFactory("Petitions");
  const petitions = Petitions.attach(PETITIONS_ADDRESS);

  console.log("Testing Authentication Integration");
  console.log("=================================");

  // Test 1: Try to create petition without authorization (should fail)
  console.log("\n1. Testing unauthorized access...");
  try {
    await petitions.connect(user1).createPetition("Title CID", "Description CID", 100);
    console.log("❌ ERROR: Unauthorized user was able to create petition!");
  } catch (error) {
    console.log("✅ SUCCESS: Unauthorized user blocked:", error.reason);
  }

  // Test 2: Authorize user1 and try again
  console.log("\n2. Authorizing user1...");
  await authRegistry.connect(owner).authorizeUser(user1.address);
  console.log("✅ User1 authorized");

  // Test 3: Create petition with authorized user
  console.log("\n3. Creating petition with authorized user...");
  try {
    const tx = await petitions.connect(user1).createPetition("Title CID", "Description CID", 100);
    const receipt = await tx.wait();
    console.log("✅ SUCCESS: Petition created by authorized user");
    console.log("Transaction hash:", receipt.transactionHash);
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 4: Try to sign petition without authorization (should fail)
  console.log("\n4. Testing petition signing without authorization...");
  try {
    await petitions.connect(user2).signPetition(1);
    console.log("❌ ERROR: Unauthorized user was able to sign petition!");
  } catch (error) {
    console.log("✅ SUCCESS: Unauthorized user blocked from signing:", error.reason);
  }

  // Test 5: Authorize user2 and sign petition
  console.log("\n5. Authorizing user2 and signing petition...");
  await authRegistry.connect(owner).authorizeUser(user2.address);
  console.log("✅ User2 authorized");
  
  try {
    const tx = await petitions.connect(user2).signPetition(1);
    await tx.wait();
    console.log("✅ SUCCESS: Authorized user signed petition");
  } catch (error) {
    console.log("❌ ERROR:", error.reason);
  }

  // Test 6: Revoke authorization and try to interact
  console.log("\n6. Testing authorization revocation...");
  await authRegistry.connect(owner).revokeUser(user2.address);
  console.log("✅ User2 authorization revoked");

  try {
    await petitions.connect(user2).signPetition(1);
    console.log("❌ ERROR: Revoked user was able to sign petition!");
  } catch (error) {
    console.log("✅ SUCCESS: Revoked user blocked:", error.reason);
  }

  console.log("\n=================================");
  console.log("Authentication integration test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
