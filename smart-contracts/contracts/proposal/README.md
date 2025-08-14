# Proposals Smart Contract

This directory contains the Proposals smart contract and related files for the Transparent Governance Platform.

## Contract Overview

The Proposals smart contract allows authorized users to create governance proposals that other users can vote on. It includes features for:

- Creating proposals with title, descriptions, category, and expiration date
- Voting YES or NO on proposals
- Changing votes or removing votes
- Managing proposal status and extending deadlines
- Filtering proposals by category, status, and expiration
- Retrieving voting statistics and user voting history

## Files

### Smart Contract
- `proposals.sol` - Main Proposals smart contract

### JavaScript API
- `../scripts/proposals.js` - Express.js REST API for interacting with the contract

### Deployment & Testing
- `../scripts/deploy-proposals.js` - Deployment script for the contract
- `../scripts/test-proposals-integration.js` - Integration tests for the contract

### Test Data
- `../test_data/create_proposal.json` - Sample data for creating a proposal
- `../test_data/vote_yes_proposal.json` - Sample data for voting YES
- `../test_data/vote_no_proposal.json` - Sample data for voting NO
- `../test_data/change_proposal_status.json` - Sample data for changing proposal status
- `../test_data/extend_proposal_deadline.json` - Sample data for extending deadline

## Contract Features

### Core Functions

1. **createProposal()** - Create a new proposal
   - Requires title, short description, detailed description, category ID, and expiration date
   - Users can only create one proposal per day to prevent spam
   - Automatically sets proposal as active

2. **voteYes()** / **voteNo()** - Vote on proposals
   - Only authorized users can vote
   - Users cannot vote on their own proposals
   - Users cannot vote on expired or inactive proposals
   - Changing vote automatically removes previous vote

3. **removeVote()** - Remove a user's vote from a proposal

4. **changeProposalStatus()** - Activate/deactivate a proposal (creator only)

5. **extendProposalDeadline()** - Extend the proposal deadline (creator only, can only extend, not reduce)

6. **expireProposal()** - Manually expire a proposal (creator only)

### Query Functions

1. **getProposal()** - Get full proposal details
2. **getProposalVotes()** - Get voting statistics including YES percentage
3. **getUserVote()** - Check if a user has voted and how they voted
4. **getProposalsByUser()** - Get all proposals created by a user
5. **getActiveProposalsByCategory()** - Get active proposals in a category
6. **getExpiredProposals()** - Get all expired proposals
7. **isProposalExpired()** - Check if a specific proposal is expired

## API Endpoints

The JavaScript API provides REST endpoints for all contract functions:

### Proposal Management
- `POST /create-proposal` - Create a new proposal
- `POST /change-status` - Change proposal active status
- `POST /extend-deadline` - Extend proposal deadline
- `POST /expire-proposal` - Manually expire a proposal

### Voting
- `POST /vote-yes` - Vote YES on a proposal
- `POST /vote-no` - Vote NO on a proposal
- `POST /remove-vote` - Remove vote from a proposal

### Queries
- `GET /proposal/:id` - Get proposal details
- `GET /proposal-votes/:id` - Get voting statistics
- `GET /user-vote/:id/:address` - Get user's vote on proposal
- `GET /proposals-by-user/:address` - Get proposals by user
- `GET /proposals-by-category/:categoryId` - Get proposals by category
- `GET /expired-proposals` - Get expired proposals
- `GET /is-expired/:id` - Check if proposal is expired
- `GET /proposals` - Get paginated list of all proposals
- `GET /proposals/filter` - Get filtered proposals with sorting
- `GET /statistics` - Get proposal statistics

## Data Structure

Each proposal contains:
- `titleCid` - IPFS CID for the proposal title
- `shortDescriptionCid` - IPFS CID for short description
- `descriptionInDetailsCid` - IPFS CID for detailed description
- `yesVotes` - Number of YES votes
- `noVotes` - Number of NO votes
- `creator` - Address of the proposal creator
- `activeStatus` - Whether the proposal is active
- `expiredDate` - Timestamp when proposal expires
- `categoryId` - Category ID for the proposal
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- Vote mappings for tracking individual user votes

## Security Features

- **Authorization**: Only registered users can create proposals and vote
- **Anti-spam**: Users can only create one proposal per day
- **Vote integrity**: Users cannot vote on their own proposals
- **Vote changing**: Users can change their vote, previous vote is automatically removed
- **Expiration**: Proposals have expiration dates, expired proposals cannot be voted on
- **Creator control**: Only creators can modify their proposals

## Events

The contract emits events for:
- `ProposalCreated` - When a new proposal is created
- `ProposalVotedYes` - When someone votes YES
- `ProposalVotedNo` - When someone votes NO
- `ProposalStatusChanged` - When proposal status changes
- `ProposalExpired` - When a proposal is manually expired

## Integration with Database

This smart contract is designed to work alongside the Ballerina backend database schema. The database table structure matches the smart contract fields for seamless integration:

```sql
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    description_in_details TEXT NOT NULL,
    active_status BOOLEAN DEFAULT true,
    expired_date TIMESTAMP NOT NULL CHECK (expired_date > CURRENT_TIMESTAMP),
    yes_votes INTEGER DEFAULT 0 CHECK (yes_votes >= 0),
    no_votes INTEGER DEFAULT 0 CHECK (no_votes >= 0),
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Example

```javascript
// Create a proposal
const response = await fetch('/create-proposal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    titleCid: 'QmTitleCID',
    shortDescriptionCid: 'QmShortDescCID',
    descriptionInDetailsCid: 'QmDetailsCID',
    categoryId: 1,
    expiredDate: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    signerIndex: 0
  })
});

// Vote on a proposal
await fetch('/vote-yes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    proposalId: 1,
    signerIndex: 1
  })
});

// Get proposal details
const proposal = await fetch('/proposal/1').then(r => r.json());
```

## Testing

Run the integration tests with:
```bash
npx hardhat run scripts/test-proposals-integration.js --network localhost
```

## Deployment

Deploy the contract with:
```bash
npx hardhat run scripts/deploy-proposals.js --network localhost
```

Note: Make sure to update the AuthRegistry address in the deployment script before deploying to a real network.
