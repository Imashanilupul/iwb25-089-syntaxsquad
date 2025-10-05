# Admin Authorization Guide

## Overview
The platform now distinguishes between two types of users:
1. **Authorized Users** - Can access the main platform (whistleblowing, voting, petitions)
2. **Admin Users** - Can access the admin portal to manage the platform

## How It Works

### Smart Contract (`auth.sol`)
The `AuthRegistry` contract has two separate mappings:
- `authorizedUsers` - For regular platform users
- `adminUsers` - For admin portal users

Only admin users can access the admin portal at `/adminLogin` and `/admin`.

### API Endpoints

#### Check if address is authorized (regular user)
```
GET http://localhost:3001/auth/is-authorized/:address
```

#### Check if address is admin
```
GET http://localhost:3001/auth/is-admin/:address
```

### How to Authorize an Admin User

#### Option 1: Using the API (Recommended)
You can call the `/auth/authorize-admin` endpoint (you'll need to create this) or use the existing endpoints.

#### Option 2: Using Hardhat Console (Direct Blockchain Interaction)

1. **Navigate to smart-contracts directory:**
   ```bash
   cd smart-contracts
   ```

2. **Open Hardhat console connected to Sepolia:**
   ```bash
   npx hardhat console --network sepolia
   ```

3. **Get the contract instance:**
   ```javascript
   const AuthRegistry = await ethers.getContractFactory("AuthRegistry");
   const auth = await AuthRegistry.attach("0xAB5aDe4eF8Db80d09BF1dDf0461cff45f0D6706E");
   ```

4. **Authorize a wallet as admin:**
   ```javascript
   // Replace with the actual wallet address
   const adminAddress = "0xYourAdminWalletAddress";
   const tx = await auth.authorizeAdmin(adminAddress);
   await tx.wait();
   console.log("Admin authorized!");
   ```

5. **Verify admin status:**
   ```javascript
   const isAdmin = await auth.isAdmin(adminAddress);
   console.log("Is admin:", isAdmin);
   ```

6. **To revoke admin access:**
   ```javascript
   const tx = await auth.revokeAdmin(adminAddress);
   await tx.wait();
   console.log("Admin revoked!");
   ```

#### Option 3: Create API Endpoint (Future Enhancement)

Add to `smart-contracts/scripts/auth.js`:

```javascript
// Authorize an admin (only owner)
router.post("/authorize-admin", async (req, res) => {
  const { adminAddress } = req.body;
  try {
    const tx = await authRegistry.authorizeAdmin(adminAddress);
    await tx.wait();
    res.json({ message: "Admin authorized!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke an admin (only owner)
router.post("/revoke-admin", async (req, res) => {
  const { adminAddress } = req.body;
  try {
    const tx = await authRegistry.revokeAdmin(adminAddress);
    await tx.wait();
    res.json({ message: "Admin revoked!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

Then call it via curl:
```bash
curl -X POST http://localhost:3001/auth/authorize-admin \
  -H "Content-Type: application/json" \
  -d '{"adminAddress": "0xYourAdminWalletAddress"}'
```

## Testing the Changes

### 1. Start the backend API server
```bash
cd smart-contracts
npm start
```

### 2. Test with a non-admin wallet
- Connect a regular wallet to `/adminLogin`
- You should see "❌ Wallet Not Authorized as Admin"

### 3. Authorize an admin
Use one of the methods above to authorize your wallet address

### 4. Test with admin wallet
- Disconnect and reconnect the admin wallet
- You should see "✅ Wallet Verified as Admin"
- You can proceed to Asgardeo authentication

### 5. Check admin status via API
```bash
curl http://localhost:3001/auth/is-admin/0xYourWalletAddress
```

## Important Notes

1. **Only the contract owner** (the wallet that deployed the contract) can authorize/revoke admins
2. **Regular authorized users** cannot access the admin portal
3. **Admin users** automatically get access to the main platform as well
4. Make sure to have the correct `PRIVATE_KEY` in your `.env` file (the owner's private key)

## Contract Owner Information

Current contract owner wallet: Check by calling:
```javascript
const owner = await auth.owner();
console.log("Contract owner:", owner);
```

## Troubleshooting

### "Not contract owner" error
- Make sure the `PRIVATE_KEY` in `.env` matches the contract deployer's private key
- Verify owner address: `await authRegistry.owner()`

### Admin check returns false after authorization
- Wait a few seconds for blockchain confirmation
- Check transaction was successful: `await tx.wait()`
- Verify on Sepolia Etherscan

### Frontend still shows "Not Admin"
- Refresh the page or disconnect/reconnect wallet
- Check browser console for AuthContext logs
- Verify API endpoint is accessible: `http://localhost:3001/auth/is-admin/:address`

## Security Best Practices

1. Keep the contract owner's private key secure
2. Regularly audit admin addresses
3. Use multi-sig wallet for contract ownership (future enhancement)
4. Log all admin authorization/revocation events
5. Implement admin activity monitoring

## Future Enhancements

1. Add admin management UI in the admin portal
2. Implement role-based access control (RBAC)
3. Add audit logs for admin actions
4. Multi-signature admin authorization
5. Time-limited admin access
