# Categories API Documentation

## Overview
The Categories API provides CRUD (Create, Read, Update, Delete) operations for managing budget categories in the Transparent Governance Platform. Each category represents a government spending area with allocated and spent budget tracking.

## Base URL
```
http://localhost:8080/api
```

## Endpoints

### 1. Get All Categories
- **Method:** GET
- **Endpoint:** `/categories`
- **Description:** Retrieve all categories with budget information
- **Response:** List of categories ordered by creation date (newest first)

### 2. Get Category by ID
- **Method:** GET
- **Endpoint:** `/categories/{id}`
- **Description:** Retrieve a specific category by its ID
- **Parameters:** 
  - `id` (path parameter): Category ID (integer)

### 3. Create New Category
- **Method:** POST
- **Endpoint:** `/categories`
- **Description:** Create a new budget category
- **Request Body:**
```json
{
    "categoryName": "string (required)",
    "allocatedBudget": "decimal (required)",
    "spentBudget": "decimal (optional, defaults to 0)"
}
```

### 4. Update Category
- **Method:** PUT
- **Endpoint:** `/categories/{id}`
- **Description:** Update an existing category
- **Parameters:** 
  - `id` (path parameter): Category ID (integer)
- **Request Body:** (all fields optional)
```json
{
    "categoryName": "string (optional)",
    "allocatedBudget": "decimal (optional)",
    "spentBudget": "decimal (optional)"
}
```

### 5. Delete Category
- **Method:** DELETE
- **Endpoint:** `/categories/{id}`
- **Description:** Delete a category by ID
- **Parameters:** 
  - `id` (path parameter): Category ID (integer)

## Data Model

### Category Object
```json
{
    "category_id": "integer (auto-generated)",
    "category_name": "string (unique)",
    "allocated_budget": "decimal (>= 0)",
    "spent_budget": "decimal (>= 0, <= allocated_budget)",
    "created_at": "timestamp",
    "updated_at": "timestamp"
}
```

## Validation Rules
- Category name cannot be empty
- Allocated budget must be >= 0
- Spent budget must be >= 0
- Spent budget cannot exceed allocated budget
- Category names must be unique

## Response Format

### Success Response
```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": {}, // Category object or array
    "timestamp": 1722682800
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description",
    "timestamp": 1722682800
}
```

## HTTP Status Codes
- `200` - OK (successful GET, PUT)
- `201` - Created (successful POST)
- `204` - No Content (successful DELETE)
- `400` - Bad Request (validation errors)
- `404` - Not Found (category doesn't exist)
- `500` - Internal Server Error

## Testing with Postman

### Import Collection
1. Import the provided `Categories_API_Postman_Collection.json` file
2. Set up environment variables:
   - `baseURL`: http://localhost:8080/api
   - `categoryId`: 1 (for testing specific operations)

### Test Data
Use the sample data provided in `CATEGORIES_API_TEST_DATA.md` for testing various scenarios including:
- Healthcare: $250M allocated, $87.5M spent
- Education: $180M allocated, $45M spent
- Infrastructure: $450M allocated, $125M spent
- Defense: $320M allocated, $98M spent
- Agriculture: $120M allocated, $35M spent

## Database Schema
The API works with a PostgreSQL table with the following structure:

```sql
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    allocated_budget DECIMAL(15,2) NOT NULL CHECK (allocated_budget >= 0),
    spent_budget DECIMAL(15,2) DEFAULT 0 CHECK (spent_budget >= 0 AND spent_budget <= allocated_budget),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Details
- Built with Ballerina language
- Uses Supabase PostgreSQL database via REST API
- HTTP-based database operations for cloud compatibility
- Comprehensive error handling and validation
- Structured JSON responses for consistency

## Example Usage

### Creating a Healthcare Category
```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "categoryName": "Healthcare",
    "allocatedBudget": 250000000.00,
    "spentBudget": 87500000.00
  }'
```

### Getting All Categories
```bash
curl -X GET http://localhost:8080/api/categories \
  -H "Accept: application/json"
```

### Updating a Category
```bash
curl -X PUT http://localhost:8080/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{
    "spentBudget": 95000000.00
  }'
```

This API forms the foundation for budget tracking and financial transparency in the governance platform.
