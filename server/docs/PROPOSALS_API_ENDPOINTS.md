# Proposals Module - API Endpoints

The `proposals.bal` module has been successfully created and integrated into the main server. Below are all the available endpoints for the proposals CRUD operations:

## Basic CRUD Operations

### Get All Proposals
- **GET** `/api/proposals`
- Returns a list of all proposals with their voting data

### Get Proposal by ID
- **GET** `/api/proposals/{proposalId}`
- Returns a specific proposal by its ID

### Create New Proposal
- **POST** `/api/proposals`
- Request body example:
```json
{
  "title": "Provincial Council Powers Amendment",
  "shortDescription": "Proposal to devolve more administrative powers to Provincial Councils",
  "descriptionInDetails": "This amendment seeks to strengthen the devolution of power...",
  "expiredDate": "2024-02-15T23:59:59",
  "categoryId": 1,
  "createdBy": 123,
  "activeStatus": true,
  "yesVotes": 0,
  "noVotes": 0
}
```

### Update Proposal
- **PUT** `/api/proposals/{proposalId}`
- Updates an existing proposal with the provided data

### Delete Proposal
- **DELETE** `/api/proposals/{proposalId}`
- Deletes a proposal by ID

## Filtering & Search Operations

### Get Proposals by Category
- **GET** `/api/proposals/category/{categoryId}`
- Returns all proposals belonging to a specific category

### Get Proposals by Status
- **GET** `/api/proposals/status/{activeStatus}`
- Returns proposals filtered by active status (true/false)

### Get Proposals by Creator
- **GET** `/api/proposals/creator/{createdBy}`
- Returns all proposals created by a specific user

### Search Proposals
- **GET** `/api/proposals/search/{keyword}`
- Searches proposals by keyword in title or descriptions

## Special Operations

### Get Active Proposals
- **GET** `/api/proposals/active`
- Returns only active and non-expired proposals

### Get Expired Proposals
- **GET** `/api/proposals/expired`
- Returns proposals that have passed their expiry date

### Get Proposal Statistics
- **GET** `/api/proposals/statistics`
- Returns comprehensive statistics about all proposals including:
  - Total proposals count
  - Active vs inactive count
  - Total votes (yes/no)
  - Average participation
  - Category distribution

### Vote on Proposal
- **POST** `/api/proposals/{proposalId}/vote/{voteType}`
- Cast a vote on a proposal
- `voteType` can be "yes" or "no"
- Automatically increments the vote count

## Database Schema

The proposals table includes the following fields:
- `id` - Primary key
- `title` - Proposal title
- `short_description` - Brief summary
- `description_in_details` - Full description
- `active_status` - Whether the proposal is active for voting
- `expired_date` - When voting closes
- `yes_votes` - Number of yes votes
- `no_votes` - Number of no votes  
- `category_id` - Foreign key to categories table (optional)
- `created_by` - Foreign key to users table (optional)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Service Features

The `ProposalsService` class includes:
- ✅ Complete CRUD operations
- ✅ Data validation
- ✅ Error handling
- ✅ Search and filtering capabilities
- ✅ Vote management
- ✅ Statistics generation
- ✅ Status-based queries
- ✅ Comprehensive logging

All endpoints follow the same response pattern as other modules and include proper error handling, input validation, and consistent JSON responses.
