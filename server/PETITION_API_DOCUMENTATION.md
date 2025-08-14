# Petition Creation Flow Documentation

## Overview
The petition creation system integrates the frontend Next.js application with the Ballerina backend to process petition data and store it in the Supabase database.

## API Endpoints

### Create Petition
- **Endpoint**: `POST http://localhost:8080/api/petitions`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "title": "string (required)",
  "description": "string (required)", 
  "required_signature_count": "number (required)",
  "creator_id": "number (optional)",
  "deadline": "string (optional, ISO date format)",
  "blockchain_petition_id": "string (optional)",
  "title_cid": "string (optional)",
  "description_cid": "string (optional)", 
  "wallet_address": "string (optional)",
  "signature": "string (optional)"
}
```

#### Response
```json
{
  "success": true,
  "message": "Petition created successfully",
  "data": {
    "id": 3,
    "title": "Test Petition",
    "description": "This is a test petition",
    "required_signature_count": 100,
    "signature_count": 0,
    "creator_id": null,
    "status": "ACTIVE",
    "created_at": "2025-08-14T15:16:06.011112",
    "updated_at": "2025-08-14T15:16:06.011112",
    "deadline": null
  },
  "timestamp": 1755184774
}
```

### Get All Petitions
- **Endpoint**: `GET http://localhost:8080/api/petitions`

#### Response
```json
{
  "success": true,
  "message": "Petitions retrieved successfully",
  "data": [
    {
      "id": 3,
      "title": "Test Petition",
      "description": "This is a test petition",
      "required_signature_count": 100,
      "signature_count": 0,
      "creator_id": null,
      "status": "ACTIVE",
      "created_at": "2025-08-14T15:16:06.011112",
      "updated_at": "2025-08-14T15:16:06.011112",
      "deadline": null
    }
  ],
  "count": 1,
  "timestamp": 1755184774
}
```

## Frontend Integration

### Current Implementation
The frontend form in `whistleblowing-system.tsx` handles:

1. **Form Validation**: Ensures title, description, and wallet connection
2. **Wallet Signature**: Requests user signature for blockchain verification
3. **Smart Contract Integration**: Calls the smart contract API (if running)
4. **Database Storage**: Saves petition data to Ballerina backend
5. **Error Handling**: Provides user feedback for success/failure states

### Form Fields
- **title**: Petition title (required)
- **description**: Detailed petition description (required)
- **targetSignatures**: Required signature count (dropdown selection)
- **walletAddress**: Connected wallet address (automatic)

### Success Flow
1. User fills out the petition form
2. Frontend validates required fields
3. User signs the petition message with their wallet
4. Frontend calls smart contract API (optional)
5. Frontend sends petition data to Ballerina backend
6. Backend saves to Supabase database
7. User receives success confirmation

### Error Handling
- Missing form fields
- Wallet not connected
- Signature cancelled by user
- Network errors
- Backend validation errors
- Database errors

## Backend Architecture

### Services Used
- **PetitionsService**: Main petition CRUD operations
- **Supabase Client**: Database connectivity
- **HTTP Service**: REST API endpoints

### Database Schema
The petitions table includes:
- `id`: Auto-incrementing primary key
- `title`: Petition title
- `description`: Petition description
- `required_signature_count`: Target signatures needed
- `signature_count`: Current signatures (default: 0)
- `creator_id`: Optional user ID
- `status`: Petition status (default: "ACTIVE")
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `deadline`: Optional deadline date
- `blockchain_petition_id`: Optional blockchain reference
- `title_cid`: Optional IPFS content ID
- `description_cid`: Optional IPFS content ID
- `wallet_address`: Optional wallet address
- `signature`: Optional signature proof

## Testing

### Manual Testing
1. Start the Ballerina server: `bal run` in the `/server` directory
2. Open the test HTML file: `/server/test_petition_api.html`
3. Fill out the form and submit
4. Check the response for success/error

### API Testing with PowerShell
```powershell
# Create petition
$body = @{
    title = "Test Petition"
    description = "This is a test petition"
    required_signature_count = 100
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/petitions" -Method POST -Body $body -ContentType "application/json"

# Get all petitions
Invoke-RestMethod -Uri "http://localhost:8080/api/petitions" -Method GET
```

## Configuration

### Required Environment Variables (Config.toml)
```toml
port = 8080
petitionPort = 8000
supabaseUrl = "https://your-supabase-url.supabase.co"
supabaseServiceRoleKey = "your-service-role-key"
```

### CORS Configuration
The backend is configured to accept requests from:
- `http://localhost:3000` (Next.js development server)

## Additional Petition Operations

The backend also supports:
- `GET /api/petitions/{id}` - Get specific petition
- `PUT /api/petitions/{id}` - Update petition
- `DELETE /api/petitions/{id}` - Delete petition
- `GET /api/petitions/creator/{creatorId}` - Get petitions by creator
- `GET /api/petitions/status/{status}` - Get petitions by status
- `GET /api/petitions/search/{keyword}` - Search petitions
- `GET /api/petitions/statistics` - Get petition statistics
- `GET /api/petitions/active` - Get active petitions
- `POST /api/petitions/{id}/sign` - Sign a petition

## Notes
- The system properly validates input data
- Database transactions are handled automatically
- Error responses include detailed messages for debugging
- The API follows RESTful conventions
- All timestamps are in UTC format
