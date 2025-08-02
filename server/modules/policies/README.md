# Policies Module

This module provides a complete backend implementation for managing government policies in the Transparent Governance Platform. The policies functionality has been integrated directly into the main server running on port **8080**.

## Table Schema

The policies module works with the following database table structure:

```sql
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    view_full_policy TEXT NOT NULL,
    ministry VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    effective_date TIMESTAMP,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## API Endpoints

The policies endpoints are integrated into the main server on port **8080** and provide the following REST API endpoints:

### Base URL: `http://localhost:8080/api/policies`

### 1. Create a New Policy
- **Method:** `POST`
- **Endpoint:** `/api/policies`
- **Request Body:**
```json
{
    "name": "Policy Name",
    "description": "Policy description",
    "view_full_policy": "Full policy document content",
    "ministry": "Ministry Name",
    "status": "DRAFT",
    "effective_date": "2025-12-31T00:00:00Z"
}
```
- **Response:** `201 Created` on success

### 2. Get All Policies
- **Method:** `GET`
- **Endpoint:** `/api/policies`
- **Response:** `200 OK` with policies list

### 3. Get Policy by ID
- **Method:** `GET`
- **Endpoint:** `/api/policies/{id}`
- **Response:** `200 OK` with policy data or `404 Not Found`

### 4. Update Policy
- **Method:** `PUT`
- **Endpoint:** `/api/policies/{id}`
- **Request Body:** (any combination of updatable fields)
```json
{
    "name": "Updated Policy Name",
    "description": "Updated description",
    "status": "ACTIVE"
}
```
- **Response:** `200 OK` on success or `404 Not Found`

### 5. Delete Policy
- **Method:** `DELETE`
- **Endpoint:** `/api/policies/{id}`
- **Response:** `200 OK` on success or `404 Not Found`

### 6. Get Policies by Status
- **Method:** `GET`
- **Endpoint:** `/api/policies/status/{status}`
- **Valid Status Values:** `DRAFT`, `UNDER_REVIEW`, `APPROVED`, `ACTIVE`, `INACTIVE`, `ARCHIVED`
- **Response:** `200 OK` with filtered policies list

### 7. Get Policies by Ministry
- **Method:** `GET`
- **Endpoint:** `/api/policies/ministry/{ministry}`
- **Response:** `200 OK` with filtered policies list

## Policy Status Values

The system supports the following policy statuses:

- **DRAFT** - Policy is in draft stage
- **UNDER_REVIEW** - Policy is under review
- **APPROVED** - Policy has been approved
- **ACTIVE** - Policy is currently active
- **INACTIVE** - Policy is temporarily inactive
- **ARCHIVED** - Policy has been archived

## Service Layer

The `PoliciesService` class provides the following methods:

### Core CRUD Operations
- `getAllPolicies()` - Retrieve all policies
- `getPolicyById(int policyId)` - Get a specific policy
- `createPolicy(...)` - Create a new policy
- `updatePolicy(int policyId, json updateData)` - Update a policy
- `deletePolicy(int policyId)` - Delete a policy

### Filtering and Search
- `getPoliciesByStatus(string status)` - Filter by status
- `getPoliciesByMinistry(string ministry)` - Filter by ministry
- `searchPolicies(string keyword)` - Search in name and description
- `getActivePolicies()` - Get only active policies
- `getDraftPolicies()` - Get only draft policies
- `getFutureEffectivePolicies()` - Get policies with future effective dates

### Utility Functions
- `validatePolicyData(json policyData)` - Validate policy data
- `getPolicyStatistics()` - Get statistics about policies

## Example Usage

### Creating a Policy
```bash
curl -X POST http://localhost:8080/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Digital Governance Policy",
    "description": "A comprehensive policy for digital governance",
    "view_full_policy": "Full policy document content here...",
    "ministry": "Ministry of Technology",
    "status": "DRAFT"
  }'
```

### Getting All Policies
```bash
curl http://localhost:8080/api/policies
```

### Getting Policies by Status
```bash
curl http://localhost:8080/api/policies/status/ACTIVE
```

### Getting Policies by Ministry
```bash
curl http://localhost:8080/api/policies/ministry/Ministry%20of%20Technology
```

## Error Handling

All endpoints return standardized JSON responses:

### Success Response
```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": {...},
    "timestamp": 1736012345
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description",
    "timestamp": 1736012345
}
```

## Validation Rules

### Required Fields (for creation)
- `name` - Cannot be empty
- `description` - Cannot be empty
- `view_full_policy` - Cannot be empty
- `ministry` - Cannot be empty

### Optional Fields
- `status` - Defaults to "DRAFT" if not provided
- `effective_date` - Can be null

### Field Constraints
- `status` - Must be one of the valid status values
- All string fields are trimmed and checked for emptiness

## Database Configuration

The module uses Supabase as the database backend with the following configuration:

- **URL:** `https://hhnxsixgjcdhvzuwbmzf.supabase.co`
- **Authentication:** Uses both anonymous and service role keys
- **Table:** `policies` in the public schema

## Integration

The policies module has been integrated into the main server application:

1. ✅ **Endpoints Added** - All policies endpoints are now available on port 8080
2. ✅ **Database Integration** - Uses the same Supabase configuration as other modules
3. ✅ **Error Handling** - Follows the same patterns as the categories module
4. ✅ **Validation** - Comprehensive input validation and status management
5. ✅ **Documentation** - Updated server info endpoint to include policies endpoints

The policies functionality is now part of the main `/api` service and can be accessed at:
- `http://localhost:8080/api/policies` (main endpoints)
- `http://localhost:8080/api/info` (to see all available endpoints)

## Future Enhancements

Potential improvements for this module:

1. **Pagination** - Add pagination support for large policy lists
2. **Advanced Search** - Implement full-text search capabilities
3. **Policy Versioning** - Track policy versions and changes
4. **Approval Workflow** - Implement multi-stage approval process
5. **File Attachments** - Support for policy document attachments
6. **Comments System** - Integration with policy comments module
7. **Audit Trail** - Track all changes and access to policies
8. **Notifications** - Alert system for policy updates
9. **Policy Templates** - Pre-defined policy templates
10. **Export Features** - Export policies in various formats (PDF, Word, etc.)
