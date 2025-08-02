# Categories API Test Dataset for Postman

## Base URL
```
http://localhost:8080/api
```

## Test Data for Categories

### 1. CREATE Category (POST /api/categories)

**Request Body (JSON):**

#### Healthcare Category
```json
{
    "categoryName": "Healthcare",
    "allocatedBudget": 250000000.00,
    "spentBudget": 87500000.00
}
```

#### Education Category
```json
{
    "categoryName": "Education",
    "allocatedBudget": 180000000.00,
    "spentBudget": 45000000.00
}
```

#### Infrastructure Category
```json
{
    "categoryName": "Infrastructure",
    "allocatedBudget": 450000000.00,
    "spentBudget": 125000000.00
}
```

#### Defense Category
```json
{
    "categoryName": "Defense",
    "allocatedBudget": 320000000.00,
    "spentBudget": 98000000.00
}
```

#### Agriculture Category
```json
{
    "categoryName": "Agriculture",
    "allocatedBudget": 120000000.00,
    "spentBudget": 35000000.00
}
```

#### Technology Category
```json
{
    "categoryName": "Technology & Innovation",
    "allocatedBudget": 85000000.00,
    "spentBudget": 12000000.00
}
```

#### Environment Category
```json
{
    "categoryName": "Environment & Climate",
    "allocatedBudget": 95000000.00,
    "spentBudget": 22000000.00
}
```

#### Social Welfare Category
```json
{
    "categoryName": "Social Welfare",
    "allocatedBudget": 200000000.00,
    "spentBudget": 85000000.00
}
```

#### Transportation Category
```json
{
    "categoryName": "Transportation",
    "allocatedBudget": 300000000.00,
    "spentBudget": 165000000.00
}
```

#### Energy Category
```json
{
    "categoryName": "Energy & Power",
    "allocatedBudget": 280000000.00,
    "spentBudget": 110000000.00
}
```

### 2. GET All Categories (GET /api/categories)

**Expected Response:**
```json
{
    "success": true,
    "message": "Categories retrieved successfully",
    "data": [
        {
            "category_id": 1,
            "category_name": "Healthcare",
            "allocated_budget": 250000000.00,
            "spent_budget": 87500000.00,
            "created_at": "2025-08-03T10:00:00Z",
            "updated_at": "2025-08-03T10:00:00Z"
        }
        // ... more categories
    ],
    "count": 10,
    "timestamp": 1722682800
}
```

### 3. GET Category by ID (GET /api/categories/{id})

**Example:** GET /api/categories/1

**Expected Response:**
```json
{
    "success": true,
    "message": "Category retrieved successfully",
    "data": {
        "category_id": 1,
        "category_name": "Healthcare",
        "allocated_budget": 250000000.00,
        "spent_budget": 87500000.00,
        "created_at": "2025-08-03T10:00:00Z",
        "updated_at": "2025-08-03T10:00:00Z"
    },
    "timestamp": 1722682800
}
```

### 4. UPDATE Category (PUT /api/categories/{id})

**Example:** PUT /api/categories/1

**Request Body (Update Healthcare spent budget):**
```json
{
    "spentBudget": 95000000.00
}
```

**Request Body (Update multiple fields):**
```json
{
    "categoryName": "Healthcare & Medical Services",
    "allocatedBudget": 275000000.00,
    "spentBudget": 95000000.00
}
```

### 5. DELETE Category (DELETE /api/categories/{id})

**Example:** DELETE /api/categories/1

**Expected Response:**
```json
{
    "success": true,
    "message": "Category deleted successfully",
    "timestamp": 1722682800
}
```

## Postman Collection Setup

### Environment Variables
Create a Postman environment with:
- `baseURL`: http://localhost:8080/api
- `categoryId`: 1 (for testing specific category operations)

### Headers for All Requests
```
Content-Type: application/json
Accept: application/json
```

## Test Scenarios

### Scenario 1: Complete CRUD Operations
1. **Create** a new category using POST
2. **Read** all categories using GET
3. **Read** the specific category by ID using GET
4. **Update** the category using PUT
5. **Delete** the category using DELETE

### Scenario 2: Validation Testing
1. **Test empty category name:**
```json
{
    "categoryName": "",
    "allocatedBudget": 100000.00
}
```

2. **Test negative budget:**
```json
{
    "categoryName": "Test Category",
    "allocatedBudget": -50000.00
}
```

3. **Test missing required fields:**
```json
{
    "categoryName": "Test Category"
}
```

### Scenario 3: Budget Analysis
After creating several categories, you can analyze:
- Total allocated vs spent budgets
- Budget utilization percentages
- Categories with highest/lowest spending

## Expected Database Schema

The categories table should have the following structure:
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

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/categories | Get all categories |
| GET | /api/categories/{id} | Get category by ID |
| POST | /api/categories | Create new category |
| PUT | /api/categories/{id} | Update category |
| DELETE | /api/categories/{id} | Delete category |

## Error Responses

### 400 Bad Request
```json
{
    "success": false,
    "message": "Category name cannot be empty",
    "timestamp": 1722682800
}
```

### 404 Not Found
```json
{
    "success": false,
    "message": "Category not found",
    "timestamp": 1722682800
}
```

### 500 Internal Server Error
```json
{
    "success": false,
    "message": "Failed to create category: Database connection error",
    "timestamp": 1722682800
}
```
