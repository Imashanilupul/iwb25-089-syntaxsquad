# Reports Smart Contract

## Overview

The Reports contract enables users to create, vote on, and manage reports in the governance platform. It integrates with the AuthRegistry for access control and supports upvoting/downvoting instead of priority levels.

## Features

### ✅ **Report Management**
- **Create Reports**: Submit reports with title, description, and evidence (all stored as IPFS CIDs)
- **Upvote/Downvote**: Community voting system instead of priority levels
- **Assignment**: Assign reports to specific users for resolution
- **Resolution**: Mark reports as resolved with timestamps
- **Reopen**: Creators can reopen resolved reports if needed

### ✅ **Access Control**
- **Authorization Required**: Only authorized users can interact with reports
- **Spam Prevention**: One report per day per user
- **Creator/Assignee Rights**: Only creators or assigned users can resolve reports

### ✅ **Voting System**
- **Upvotes/Downvotes**: Community can vote on report importance
- **Vote Management**: Users can change or remove their votes
- **Vote Prevention**: Cannot vote on own reports or resolved reports
- **Vote Statistics**: Track net votes, total votes, and individual vote status

## Contract Structure

### Main Data Structure
```solidity
struct Report {
    string titleCid;           // IPFS CID for report title
    string descriptionCid;     // IPFS CID for report description  
    string evidenceHashCid;    // IPFS CID for evidence hash
    uint256 upvotes;           // Number of upvotes
    uint256 downvotes;         // Number of downvotes
    address creator;           // Report creator address
    bool resolved;             // Resolution status
    address assignedTo;        // Assigned resolver address
    uint256 createdAt;         // Creation timestamp
    uint256 resolvedAt;        // Resolution timestamp
    // ... voting mappings
}
```

## Key Functions

### Report Creation
```solidity
function createReport(
    string calldata titleCid,
    string calldata descriptionCid, 
    string calldata evidenceHashCid
) external onlyAuthorized onlyOncePerDay returns (uint256)
```

### Voting Functions
```solidity
function upvoteReport(uint256 reportId) external onlyAuthorized
function downvoteReport(uint256 reportId) external onlyAuthorized
function removeVote(uint256 reportId) external onlyAuthorized
```

### Management Functions
```solidity
function assignReport(uint256 reportId, address assignTo) external onlyAuthorized
function resolveReport(uint256 reportId) external onlyAuthorized onlyCreatorOrAssigned
function reopenReport(uint256 reportId) external onlyAuthorized
```

### Query Functions
```solidity
function getReport(uint256 reportId) external view returns (...)
function getReportVotes(uint256 reportId) external view returns (...)
function getUserVote(uint256 reportId, address user) external view returns (...)
function getReportsByUser(address user) external view returns (uint256[] memory)
function getReportsAssignedTo(address user) external view returns (uint256[] memory)
```

## Events

```solidity
event ReportCreated(uint256 indexed reportId, address indexed creator, ...);
event ReportUpvoted(uint256 indexed reportId, address indexed voter);
event ReportDownvoted(uint256 indexed reportId, address indexed voter);
event ReportResolved(uint256 indexed reportId, address indexed resolver, uint256 resolvedAt);
event ReportAssigned(uint256 indexed reportId, address indexed assignedTo);
```

## Deployment

### Deploy All Contracts
```bash
npx hardhat run scripts/deploy-all-contracts.js --network localhost
```

### Deploy Reports Only
```bash
npx hardhat run scripts/deploy-reports.js --network localhost
```

### Test Integration
```bash
npx hardhat run scripts/test-reports-integration.js --network localhost
```

## Usage Examples

### Frontend Integration
```javascript
// Create a report
const tx = await reportsContract.createReport(
  "QmTitleCID...",
  "QmDescriptionCID...", 
  "QmEvidenceCID..."
);

// Upvote a report
await reportsContract.upvoteReport(reportId);

// Get report details
const report = await reportsContract.getReport(reportId);

// Check voting stats
const votes = await reportsContract.getReportVotes(reportId);
console.log(`Net score: ${votes.netVotes}`);

// Assign for resolution
await reportsContract.assignReport(reportId, resolverAddress);

// Resolve report
await reportsContract.resolveReport(reportId);
```

### IPFS Integration
Store report data in IPFS and use CIDs in the contract:

```javascript
// Upload to IPFS
const titleCid = await ipfs.add(JSON.stringify({ title: "Report Title" }));
const descCid = await ipfs.add(JSON.stringify({ description: "Detailed description..." }));
const evidenceCid = await ipfs.add(JSON.stringify({ evidenceHash: "0x123...", files: [...] }));

// Create report with CIDs
await reportsContract.createReport(titleCid, descCid, evidenceCid);
```

## Security Features

### Access Control
- **AuthRegistry Integration**: Only authorized users can interact
- **Rate Limiting**: One report per day per user
- **Permission Checks**: Proper authorization for all actions

### Vote Integrity
- **No Self-Voting**: Cannot vote on own reports
- **No Double Voting**: Prevents multiple votes from same user
- **Vote Switching**: Can change vote but not duplicate
- **Resolved Report Protection**: Cannot vote on resolved reports

### Data Integrity
- **IPFS CIDs**: All data stored off-chain with content addressing
- **Immutable Records**: Report core data cannot be changed after creation
- **Timestamp Tracking**: Accurate creation and resolution timestamps

## Differences from Petitions

| Feature | Petitions | Reports |
|---------|-----------|---------|
| **Interaction** | Signatures | Upvotes/Downvotes |
| **Goal** | Reach signature threshold | Community prioritization |
| **Resolution** | Auto-complete when threshold met | Manual resolution by assigned user |
| **Assignment** | No assignment system | Can assign to specific users |
| **Reopening** | Cannot reopen completed | Creators can reopen resolved |
| **Rate Limiting** | Once per week | Once per day |
| **Voting** | Single action (sign) | Up/down voting with changes allowed |

## Gas Optimization

- **Packed Structs**: Efficient storage layout
- **Minimal Loops**: O(1) operations where possible  
- **Event Indexing**: Proper event indexing for filtering
- **View Functions**: Gas-free data retrieval

## Integration with Database

The contract works alongside the Ballerina backend database schema:

```sql
-- Database table mirrors contract data
CREATE TABLE IF NOT EXISTS reports (
    report_id SERIAL PRIMARY KEY,
    report_title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_hash VARCHAR(255) NOT NULL,
    resolved_status BOOLEAN DEFAULT false,
    user_id INTEGER REFERENCES users(id),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Additional fields for off-chain data
);
```

The contract provides the authoritative source for:
- Vote counts and user voting history
- Resolution status and timestamps  
- Assignment and authorization
- Immutable audit trail

While the database can store:
- Expanded metadata and search indexes
- User-friendly display data
- Analytics and reporting data
- Cached contract state for performance
