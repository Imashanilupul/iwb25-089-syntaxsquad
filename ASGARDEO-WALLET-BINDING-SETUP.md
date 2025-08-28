# Asgardeo Wallet Address Binding Setup

## Overview
This document outlines how to configure Asgardeo to store wallet addresses as custom user attributes and enforce wallet-user binding during authentication.

## Step 1: Configure Asgardeo Custom Attributes

### 1.1 Add Custom Attribute in Asgardeo Console
1. Login to your Asgardeo Console: `https://console.asgardeo.io`
2. Navigate to **User Stores** → **Attributes**
3. Click **Add Attribute**
4. Add the following custom attribute:
   - **Attribute Name**: `wallet_address`
   - **Description**: `Ethereum wallet address linked to this user`
   - **Data Type**: `String`
   - **Required**: `true` (for your platform users)
   - **Unique**: `true` (ensure one wallet per user)

### 1.2 Configure Application Claims
1. Go to **Applications** → Your Application → **Attributes**
2. Add `wallet_address` to the **Requested Claims**
3. Ensure it's included in ID token and user info responses

## Step 2: Update User Registration Flow

### 2.1 Modified Registration Process
```typescript
// New registration flow
const registrationFlow = {
  step1: "User connects and verifies wallet",
  step2: "User provides registration details (name, email, etc.)",
  step3: "System creates Asgardeo user with wallet_address as custom attribute",
  step4: "User receives account credentials via email",
  step5: "System authorizes wallet on blockchain"
}
```

### 2.2 Asgardeo User Creation API
```javascript
// Example API call to create user with wallet address
const createAsgardeoUser = async (userData) => {
  const payload = {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    userName: userData.username,
    password: userData.password,
    emails: [{
      primary: true,
      value: userData.email
    }],
    name: {
      familyName: userData.lastName,
      givenName: userData.firstName
    },
    // Custom attribute for wallet address
    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
      wallet_address: userData.walletAddress
    }
  };
  
  // Make SCIM API call to create user
  return await fetch(`${ASGARDEO_BASE_URL}/scim2/Users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/scim+json'
    },
    body: JSON.stringify(payload)
  });
};
```

## Step 3: Implement Wallet-User Validation

### 3.1 Authentication Middleware
```typescript
// Middleware to validate wallet-user binding
const validateWalletBinding = async (connectedWallet: string, asgardeoUser: any) => {
  const userWalletAddress = asgardeoUser.wallet_address;
  
  if (!userWalletAddress) {
    throw new Error('User account not linked to any wallet');
  }
  
  if (userWalletAddress.toLowerCase() !== connectedWallet.toLowerCase()) {
    throw new Error('Connected wallet does not match registered wallet address');
  }
  
  return true;
};
```

### 3.2 Authentication Flow
```typescript
const authenticateUser = async (connectedWallet: string, asgardeoToken: string) => {
  // 1. Get user info from Asgardeo
  const userInfo = await getAsgardeoUserInfo(asgardeoToken);
  
  // 2. Validate wallet binding
  await validateWalletBinding(connectedWallet, userInfo);
  
  // 3. Check wallet authorization on blockchain
  const isWalletAuthorized = await checkBlockchainAuth(connectedWallet);
  
  if (!isWalletAuthorized) {
    throw new Error('Wallet not authorized on blockchain');
  }
  
  // 4. Grant access
  return {
    authenticated: true,
    user: userInfo,
    wallet: connectedWallet
  };
};
```

## Step 4: Update Client-Side Logic

### 4.1 Registration Component Updates
```typescript
// Modified registration that creates Asgardeo user
const handleRegistration = async (formData) => {
  try {
    // 1. Create Asgardeo user with wallet address
    const asgardeoUser = await createAsgardeoUserWithWallet({
      ...formData,
      walletAddress: connectedWallet
    });
    
    // 2. Authorize wallet on blockchain
    await authorizeWalletOnBlockchain(connectedWallet);
    
    // 3. Notify user of successful registration
    showSuccessMessage('Registration complete! Please check your email for login credentials.');
    
  } catch (error) {
    handleRegistrationError(error);
  }
};
```

### 4.2 Authentication Guard
```typescript
// Guard component that enforces wallet-user binding
const AuthGuard = ({ children }) => {
  const { connectedWallet } = useWallet();
  const { asgardeoUser } = useAsgardeo();
  
  useEffect(() => {
    if (connectedWallet && asgardeoUser) {
      validateWalletUserBinding(connectedWallet, asgardeoUser)
        .catch(() => {
          // Redirect to error page or force logout
          signOutAndRedirect('Wallet mismatch detected');
        });
    }
  }, [connectedWallet, asgardeoUser]);
  
  return children;
};
```

## Step 5: Error Handling and Redirects

### 5.1 Wallet Mismatch Handling
```typescript
const handleWalletMismatch = (connectedWallet: string, registeredWallet: string) => {
  // Log security event
  logSecurityEvent('WALLET_MISMATCH', {
    connectedWallet,
    registeredWallet,
    timestamp: new Date().toISOString()
  });
  
  // Clear Asgardeo session
  signOutFromAsgardeo();
  
  // Show error message
  showError({
    title: 'Wallet Mismatch',
    message: `Connected wallet (${connectedWallet.slice(0,8)}...) does not match your registered wallet (${registeredWallet.slice(0,8)}...). Please connect the correct wallet or contact support.`,
    actions: [
      { label: 'Connect Different Wallet', action: () => openWalletSelector() },
      { label: 'Go to Login', action: () => redirectToLogin() }
    ]
  });
};
```

## Benefits of This Approach

1. **Unique Binding**: Each Asgardeo user can only be linked to one wallet address
2. **Prevents Account Sharing**: Users cannot login with others' credentials and use their own wallet
3. **Audit Trail**: All wallet-user relationships are tracked in Asgardeo
4. **Scalable**: Works with Asgardeo's user management features
5. **Secure**: Enforces the binding at both database and application levels

## Migration Strategy

For existing users:
1. Add a migration flow to capture wallet addresses for existing Asgardeo users
2. Temporarily allow login without wallet binding (with warnings)
3. Gradually enforce the binding requirement
4. Provide admin tools to manually link wallets to existing accounts if needed

## Security Considerations

1. **Wallet Address Validation**: Always validate wallet addresses format and checksum
2. **Case Sensitivity**: Store wallet addresses in lowercase for consistent comparison
3. **Session Security**: Implement session invalidation on wallet disconnection
4. **Monitoring**: Log all authentication attempts and wallet binding events
5. **Recovery**: Provide secure process for users to update their linked wallet address
