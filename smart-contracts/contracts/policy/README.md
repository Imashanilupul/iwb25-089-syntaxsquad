# Policies Smart Contract System

## Overview

The Policies smart contract system enables the creation, management, and endorsement of government policies on the blockchain. It includes status management, endorsement tracking, and comprehensive filtering capabilities.

## Contract Features

### Policy Lifecycle
- **DRAFT**: Initial creation state - content can be edited
- **REVIEW**: Under review - can receive endorsements
- **APPROVED**: Approved for activation
- **ACTIVE**: Currently in effect
- **SUSPENDED**: Temporarily suspended
- **EXPIRED**: No longer in effect

### Key Functionalities
1. **Policy Creation**: Create policies with IPFS CID references
2. **Status Management**: Controlled status transitions
3. **Endorsement System**: Community endorsement tracking
4. **Content Updates**: Edit content in DRAFT state
5. **Filtering**: Query by user, status, ministry
6. **Authorization**: Integrated with AuthRegistry

## Smart Contract Interface

### Main Functions

```solidity
// Create a new policy
function createPolicy(
    string calldata name,
    string calldata descriptionCid,
    string calldata fullPolicyCid,
    string calldata ministry,
    uint256 effectiveDate
) external returns (uint256)

// Update policy status
function updatePolicyStatus(uint256 policyId, PolicyStatus newStatus) external

// Endorse a policy
function endorsePolicy(uint256 policyId) external

// Get policy details
function getPolicy(uint256 policyId) external view returns (...)
```

## API Endpoints

### Core Operations
- `POST /create-policy` - Create new policy
- `POST /update-policy-status` - Update policy status
- `POST /update-policy-content` - Update policy content (DRAFT only)
- `POST /endorse-policy` - Endorse a policy
- `POST /remove-endorsement` - Remove endorsement

### Query Operations
- `GET /policy/:id` - Get policy details
- `GET /user-endorsed/:id/:address` - Check user endorsement
- `GET /policies-by-user/:address` - Get user's policies
- `GET /policies-by-status/:status` - Get policies by status
- `GET /policies-by-ministry/:ministry` - Get ministry policies
- `GET /policy-name-exists/:name` - Check name availability

### Advanced Features
- `GET /policies` - Paginated policy list
- `GET /policies/filter` - Advanced filtering
- `GET /policies/stats` - Policy statistics
- `GET /policy-statuses` - Available statuses

## Deployment

### Prerequisites
1. Deploy AuthRegistry contract first
2. Update contract addresses in deployment scripts

### Deploy Policies Contract
```bash
npx hardhat run scripts/deploy-policies.js --network localhost
```

### Deploy All Contracts
```bash
npx hardhat run scripts/deploy-all-contracts.js --network localhost
```

## Testing

### Run Integration Tests
```bash
npx hardhat run scripts/test-policies-integration.js --network localhost
```

### Test Data Files
- `test_data/create_policy.json` - Policy creation example
- `test_data/update_policy_status.json` - Status update example
- `test_data/update_policy_content.json` - Content update example

## Usage Examples

### 1. Creating a Policy

**Request:**
```json
POST /create-policy
{
  "name": "Digital Privacy Protection Act",
  "descriptionCid": "QmPolicyDesc1",
  "fullPolicyCid": "QmPolicyFull1",
  "ministry": "Ministry of Technology",
  "effectiveDate": 1691924400,
  "signerIndex": 0
}
```

**Response:**
```json
{
  "policyId": "1"
}
```

### 2. Updating Policy Status

**Request:**
```json
POST /update-policy-status
{
  "policyId": 1,
  "newStatus": "REVIEW",
  "signerIndex": 0
}
```

**Response:**
```json
{
  "message": "Policy status updated!"
}
```

### 3. Endorsing a Policy

**Request:**
```json
POST /endorse-policy
{
  "policyId": 1,
  "signerIndex": 1
}
```

**Response:**
```json
{
  "message": "Policy endorsed!"
}
```

### 4. Getting Policy Details

**Request:**
```
GET /policy/1
```

**Response:**
```json
{
  "name": "Digital Privacy Protection Act",
  "descriptionCid": "QmPolicyDesc1",
  "fullPolicyCid": "QmPolicyFull1",
  "ministry": "Ministry of Technology",
  "status": "REVIEW",
  "statusValue": "1",
  "effectiveDate": "1691924400",
  "creator": "0x...",
  "createdTime": "1691838000",
  "updatedAt": "1691838000",
  "endorsementCount": "3"
}
```

### 5. Filtering Policies

**Request:**
```
GET /policies/filter?status=ACTIVE&ministry=Ministry%20of%20Technology&sortBy=most_endorsed
```

**Response:**
```json
{
  "policies": [
    {
      "id": "1",
      "name": "Digital Privacy Protection Act",
      "status": "ACTIVE",
      "ministry": "Ministry of Technology",
      "endorsementCount": "15",
      ...
    }
  ]
}
```

## Status Transition Rules

```
DRAFT → REVIEW
REVIEW → APPROVED | DRAFT
APPROVED → ACTIVE | REVIEW
ACTIVE → SUSPENDED | EXPIRED
SUSPENDED → ACTIVE | EXPIRED
EXPIRED → (final state)
```

## Security Features

1. **Authorization**: Only authorized users can create/modify policies
2. **Rate Limiting**: One policy per user per day
3. **Creator Control**: Only creators can update their policies
4. **Status Validation**: Enforced status transition rules
5. **Unique Names**: Policy names must be unique
6. **Future Dates**: Effective dates must be in the future

## Integration with Other Contracts

- **AuthRegistry**: User authorization management
- **Reports**: Policy-related issue reporting
- **Petitions**: Policy change requests

## Environment Variables

Update your `.env` file:
```env
NEXT_PUBLIC_POLICIES_ADDRESS=0x...
NEXT_PUBLIC_AUTH_REGISTRY_ADDRESS=0x...
```

## Events

The contract emits the following events:
- `PolicyCreated` - New policy created
- `PolicyUpdated` - Policy modified
- `PolicyEndorsed` - Policy endorsed by user
- `PolicyEndorsementRemoved` - Endorsement removed
- `PolicyStatusChanged` - Status transition

## Error Handling

Common errors and solutions:
- "User not authorized" → Ensure user is authorized in AuthRegistry
- "Policy name already exists" → Use a unique policy name
- "Can only update content for DRAFT policies" → Status must be DRAFT for content updates
- "Invalid status transition" → Follow allowed status transition rules
- "Effective date must be in the future" → Set date after current timestamp

## Best Practices

1. Store actual policy content in IPFS and use CIDs
2. Use descriptive, unique policy names
3. Set realistic effective dates
4. Follow proper status progression
5. Encourage community endorsements before activation
6. Monitor policy statistics and engagement
