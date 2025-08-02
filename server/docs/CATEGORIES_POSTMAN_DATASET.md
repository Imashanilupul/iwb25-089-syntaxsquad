# Categories API Test Dataset for Postman

## Government Budget Categories Dataset

### 1. Healthcare & Medical Services
```json
{
    "categoryName": "Healthcare & Medical Services",
    "allocatedBudget": 2500000000.00,
    "spentBudget": 875000000.00
}
```

### 2. Education & Research
```json
{
    "categoryName": "Education & Research",
    "allocatedBudget": 1800000000.00,
    "spentBudget": 450000000.00
}
```

### 3. Infrastructure Development
```json
{
    "categoryName": "Infrastructure Development",
    "allocatedBudget": 4500000000.00,
    "spentBudget": 1250000000.00
}
```

### 4. National Defense & Security
```json
{
    "categoryName": "National Defense & Security",
    "allocatedBudget": 3200000000.00,
    "spentBudget": 980000000.00
}
```

### 5. Agriculture & Rural Development
```json
{
    "categoryName": "Agriculture & Rural Development",
    "allocatedBudget": 1200000000.00,
    "spentBudget": 350000000.00
}
```

### 6. Technology & Innovation
```json
{
    "categoryName": "Technology & Innovation",
    "allocatedBudget": 850000000.00,
    "spentBudget": 120000000.00
}
```

### 7. Environment & Climate Action
```json
{
    "categoryName": "Environment & Climate Action",
    "allocatedBudget": 950000000.00,
    "spentBudget": 220000000.00
}
```

### 8. Social Welfare & Protection
```json
{
    "categoryName": "Social Welfare & Protection",
    "allocatedBudget": 2000000000.00,
    "spentBudget": 850000000.00
}
```

### 9. Transportation & Logistics
```json
{
    "categoryName": "Transportation & Logistics",
    "allocatedBudget": 3000000000.00,
    "spentBudget": 1650000000.00
}
```

### 10. Energy & Power Generation
```json
{
    "categoryName": "Energy & Power Generation",
    "allocatedBudget": 2800000000.00,
    "spentBudget": 1100000000.00
}
```

### 11. Tourism & Culture
```json
{
    "categoryName": "Tourism & Culture",
    "allocatedBudget": 650000000.00,
    "spentBudget": 95000000.00
}
```

### 12. Housing & Urban Development
```json
{
    "categoryName": "Housing & Urban Development",
    "allocatedBudget": 1500000000.00,
    "spentBudget": 425000000.00
}
```

### 13. Justice & Legal Affairs
```json
{
    "categoryName": "Justice & Legal Affairs",
    "allocatedBudget": 450000000.00,
    "spentBudget": 275000000.00
}
```

### 14. Foreign Affairs & Diplomacy
```json
{
    "categoryName": "Foreign Affairs & Diplomacy",
    "allocatedBudget": 380000000.00,
    "spentBudget": 190000000.00
}
```

### 15. Public Administration
```json
{
    "categoryName": "Public Administration",
    "allocatedBudget": 750000000.00,
    "spentBudget": 520000000.00
}
```

### 16. Sports & Youth Development
```json
{
    "categoryName": "Sports & Youth Development",
    "allocatedBudget": 320000000.00,
    "spentBudget": 145000000.00
}
```

### 17. Water Resources Management
```json
{
    "categoryName": "Water Resources Management",
    "allocatedBudget": 1100000000.00,
    "spentBudget": 485000000.00
}
```

### 18. Telecommunications & IT
```json
{
    "categoryName": "Telecommunications & IT",
    "allocatedBudget": 680000000.00,
    "spentBudget": 125000000.00
}
```

### 19. Emergency Response & Disaster Management
```json
{
    "categoryName": "Emergency Response & Disaster Management",
    "allocatedBudget": 550000000.00,
    "spentBudget": 310000000.00
}
```

### 20. Trade & Commerce
```json
{
    "categoryName": "Trade & Commerce",
    "allocatedBudget": 420000000.00,
    "spentBudget": 185000000.00
}
```

## Testing Scenarios with Postman

### Scenario 1: Create Multiple Categories (Sequential Testing)
Use the above datasets one by one to create 20 different categories with realistic budget allocations.

### Scenario 2: Validation Testing

#### Test Empty Category Name
```json
{
    "categoryName": "",
    "allocatedBudget": 100000000.00,
    "spentBudget": 0.00
}
```

#### Test Whitespace-Only Category Name
```json
{
    "categoryName": "   ",
    "allocatedBudget": 100000000.00,
    "spentBudget": 0.00
}
```

#### Test Negative Allocated Budget
```json
{
    "categoryName": "Test Category",
    "allocatedBudget": -50000000.00,
    "spentBudget": 0.00
}
```

#### Test Negative Spent Budget
```json
{
    "categoryName": "Test Category",
    "allocatedBudget": 100000000.00,
    "spentBudget": -10000000.00
}
```

#### Test Spent Budget Exceeding Allocated Budget
```json
{
    "categoryName": "Test Category",
    "allocatedBudget": 100000000.00,
    "spentBudget": 150000000.00
}
```

#### Test Missing Required Fields
```json
{
    "categoryName": "Test Category"
}
```

#### Test Missing Category Name
```json
{
    "allocatedBudget": 100000000.00,
    "spentBudget": 0.00
}
```

### Scenario 3: Edge Cases

#### Test Very Large Budget
```json
{
    "categoryName": "Mega Infrastructure Project",
    "allocatedBudget": 999999999999.99,
    "spentBudget": 123456789012.34
}
```

#### Test Zero Budget
```json
{
    "categoryName": "Zero Budget Category",
    "allocatedBudget": 0.00,
    "spentBudget": 0.00
}
```

#### Test Special Characters in Name
```json
{
    "categoryName": "Health & Wellness (2024-2025) - Phase I",
    "allocatedBudget": 500000000.00,
    "spentBudget": 75000000.00
}
```

#### Test Unicode Characters
```json
{
    "categoryName": "සෞඛ්‍ය හා වෛද්‍ය සේවා (Health Services)",
    "allocatedBudget": 300000000.00,
    "spentBudget": 50000000.00
}
```

### Scenario 4: Update Testing

#### Update Only Spent Budget
```json
{
    "spentBudget": 950000000.00
}
```

#### Update Only Allocated Budget
```json
{
    "allocatedBudget": 2750000000.00
}
```

#### Update Only Category Name
```json
{
    "categoryName": "Healthcare & Medical Services (Updated)"
}
```

#### Update Multiple Fields
```json
{
    "categoryName": "Comprehensive Healthcare Services",
    "allocatedBudget": 2750000000.00,
    "spentBudget": 950000000.00
}
```

## Postman Collection Setup

### Environment Variables
Create environment variables in Postman:
- `baseURL`: `http://localhost:8080/api`
- `categoryId`: `1` (update this for specific category operations)

### Pre-request Script for Auto ID Generation
Add this to your Postman collection pre-request scripts:
```javascript
// Auto-generate category ID for testing
pm.environment.set("categoryId", Math.floor(Math.random() * 20) + 1);
```

### Test Scripts for Validation
Add these test scripts to your Postman requests:

#### For POST requests (Create Category):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response contains category data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData.data).to.have.property('category_id');
    pm.expect(jsonData.data).to.have.property('category_name');
});

// Store the created category ID for later use
pm.test("Store category ID", function () {
    var jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.category_id) {
        pm.environment.set("lastCreatedCategoryId", jsonData.data.category_id);
    }
});
```

#### For GET requests (Retrieve Categories):
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is successful", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response contains categories array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});
```

## API Endpoints for Testing

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/categories` | Create new category |
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/{id}` | Get category by ID |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |

## Expected Response Format

### Success Response
```json
{
    "success": true,
    "message": "Category created successfully",
    "data": {
        "category_id": 1,
        "category_name": "Healthcare & Medical Services",
        "allocated_budget": 2500000000.00,
        "spent_budget": 875000000.00,
        "created_at": "2025-08-03T10:00:00Z",
        "updated_at": "2025-08-03T10:00:00Z"
    },
    "timestamp": 1722682800
}
```

### Error Response
```json
{
    "success": false,
    "message": "Category name cannot be empty",
    "timestamp": 1722682800
}
```

## Testing Workflow

1. **Start with valid data**: Create 5-10 categories with the provided valid datasets
2. **Test edge cases**: Try the validation scenarios to ensure error handling works
3. **Test retrieval**: Get all categories and individual categories by ID
4. **Test updates**: Update various fields using the update scenarios
5. **Test deletion**: Delete some test categories
6. **Performance testing**: Create multiple categories in sequence

This comprehensive dataset will help you thoroughly test all aspects of your categories API!
