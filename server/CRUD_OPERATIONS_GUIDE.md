# CRUD Operations Test Guide
# Transparent Governance Platform - Categories & Policies API

## Server Status
✅ Server running on: http://localhost:8080
✅ Database: Supabase PostgreSQL connected
✅ All CRUD operations implemented

---

## 📊 CATEGORIES API

### 1. CREATE Category (POST)
**Endpoint:** `POST /api/categories`
**Content-Type:** `application/json`

**Request Body:**
```json
{
    "categoryName": "Healthcare",
    "allocatedBudget": 1000000.00,
    "spentBudget": 250000.00
}
```

**Response:**
```json
{
    "success": true,
    "message": "Category created successfully",
    "data": {
        "category_id": 1,
        "category_name": "Healthcare",
        "allocated_budget": 1000000.00,
        "spent_budget": 250000.00,
        "created_at": "2025-08-10T14:00:00Z",
        "updated_at": "2025-08-10T14:00:00Z"
    },
    "timestamp": 1691678400
}
```

### 2. READ Categories

#### Get All Categories (GET)
**Endpoint:** `GET /api/categories`

**Response:**
```json
{
    "success": true,
    "message": "Categories retrieved successfully",
    "data": [
        {
            "category_id": 1,
            "category_name": "Healthcare",
            "allocated_budget": 1000000.00,
            "spent_budget": 250000.00,
            "created_at": "2025-08-10T14:00:00Z",
            "updated_at": "2025-08-10T14:00:00Z"
        }
    ],
    "count": 1,
    "timestamp": 1691678400
}
```

#### Get Category by ID (GET)
**Endpoint:** `GET /api/categories/{id}`
**Example:** `GET /api/categories/1`

### 3. UPDATE Category (PUT)
**Endpoint:** `PUT /api/categories/{id}`
**Content-Type:** `application/json`

**Request Body (partial update allowed):**
```json
{
    "categoryName": "Healthcare Services",
    "allocatedBudget": 1200000.00,
    "spentBudget": 300000.00
}
```

**Response:**
```json
{
    "success": true,
    "message": "Category updated successfully",
    "data": {
        "category_id": 1,
        "category_name": "Healthcare Services",
        "allocated_budget": 1200000.00,
        "spent_budget": 300000.00,
        "updated_at": "2025-08-10T14:30:00Z"
    },
    "timestamp": 1691680200
}
```

### 4. DELETE Category (DELETE)
**Endpoint:** `DELETE /api/categories/{id}`
**Example:** `DELETE /api/categories/1`

**Response:**
```json
{
    "success": true,
    "message": "Category deleted successfully",
    "timestamp": 1691681000
}
```

---

## 📋 POLICIES API

### 1. CREATE Policy (POST)
**Endpoint:** `POST /api/policies`
**Content-Type:** `application/json`

**Request Body:**
```json
{
    "name": "National Healthcare Reform Policy",
    "description": "Comprehensive policy to reform the national healthcare system",
    "view_full_policy": "This policy aims to establish universal healthcare coverage...",
    "ministry": "Ministry of Health",
    "status": "DRAFT",
    "effective_date": "2025-12-01T00:00:00Z"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Policy created successfully",
    "data": {
        "id": 1,
        "name": "National Healthcare Reform Policy",
        "description": "Comprehensive policy to reform the national healthcare system",
        "view_full_policy": "This policy aims to establish universal healthcare coverage...",
        "ministry": "Ministry of Health",
        "status": "DRAFT",
        "effective_date": "2025-12-01T00:00:00Z",
        "created_time": "2025-08-10T14:00:00Z",
        "updated_at": "2025-08-10T14:00:00Z"
    },
    "timestamp": 1691678400
}
```

### 2. READ Policies

#### Get All Policies (GET)
**Endpoint:** `GET /api/policies`

#### Get Policy by ID (GET)
**Endpoint:** `GET /api/policies/{id}`
**Example:** `GET /api/policies/1`

#### Get Policies by Status (GET)
**Endpoint:** `GET /api/policies/status/{status}`
**Example:** `GET /api/policies/status/ACTIVE`
**Valid statuses:** DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED

#### Get Policies by Ministry (GET)
**Endpoint:** `GET /api/policies/ministry/{ministry}`
**Example:** `GET /api/policies/ministry/Ministry%20of%20Health`

### 3. UPDATE Policy (PUT)
**Endpoint:** `PUT /api/policies/{id}`
**Content-Type:** `application/json`

**Request Body (partial update allowed):**
```json
{
    "name": "Updated Healthcare Reform Policy",
    "status": "UNDER_REVIEW",
    "effective_date": "2026-01-01T00:00:00Z"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Policy updated successfully",
    "data": {
        "id": 1,
        "name": "Updated Healthcare Reform Policy",
        "status": "UNDER_REVIEW",
        "effective_date": "2026-01-01T00:00:00Z",
        "updated_at": "2025-08-10T14:30:00Z"
    },
    "timestamp": 1691680200
}
```

### 4. DELETE Policy (DELETE)
**Endpoint:** `DELETE /api/policies/{id}`
**Example:** `DELETE /api/policies/1`

**Response:**
```json
{
    "success": true,
    "message": "Policy deleted successfully",
    "timestamp": 1691681000
}
```

---

## 🧪 Testing with curl

### Categories
```bash
# Create Category
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{"categoryName": "Education", "allocatedBudget": 800000.00, "spentBudget": 0.00}'

# Get All Categories
curl -X GET http://localhost:8080/api/categories

# Get Category by ID
curl -X GET http://localhost:8080/api/categories/1

# Update Category
curl -X PUT http://localhost:8080/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"categoryName": "Educational Services", "spentBudget": 50000.00}'

# Delete Category
curl -X DELETE http://localhost:8080/api/categories/1
```

### Policies
```bash
# Create Policy
curl -X POST http://localhost:8080/api/policies \
  -H "Content-Type: application/json" \
  -d '{"name": "Digital Education Policy", "description": "Policy for digital transformation in education", "view_full_policy": "Complete policy document...", "ministry": "Ministry of Education", "status": "DRAFT"}'

# Get All Policies
curl -X GET http://localhost:8080/api/policies

# Get Policy by ID
curl -X GET http://localhost:8080/api/policies/1

# Update Policy
curl -X PUT http://localhost:8080/api/policies/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "UNDER_REVIEW"}'

# Delete Policy
curl -X DELETE http://localhost:8080/api/policies/1
```

---

## 🔍 Validation Rules

### Categories
- **categoryName**: Required, non-empty string, must be unique
- **allocatedBudget**: Required, non-negative decimal
- **spentBudget**: Optional, non-negative decimal, cannot exceed allocatedBudget

### Policies
- **name**: Required, non-empty string
- **description**: Required, non-empty string
- **view_full_policy**: Required, non-empty string
- **ministry**: Required, non-empty string
- **status**: Optional, valid values: DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, INACTIVE, ARCHIVED
- **effective_date**: Optional, ISO 8601 datetime format

---

## 🎯 All CRUD Operations Status: ✅ COMPLETE

Both Categories and Policies APIs now support full CRUD operations with:
- ✅ Proper Supabase REST API integration
- ✅ Comprehensive validation
- ✅ Error handling
- ✅ Consistent response formats
- ✅ HTTP status codes
- ✅ Logging for all operations
