# Policies API Testing Commands

This file contains example curl commands to test the Policies API endpoints.

## Base URL
```
http://localhost:8080/api/policies
```

## 1. Create a New Policy
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

## 2. Get All Policies
```bash
curl http://localhost:8080/api/policies
```

## 3. Get Policy by ID
```bash
curl http://localhost:8080/api/policies/1
```

## 4. Update Policy
```bash
curl -X PUT http://localhost:8080/api/policies/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACTIVE",
    "effective_date": "2025-06-01T00:00:00Z"
  }'
```

## 5. Delete Policy
```bash
curl -X DELETE http://localhost:8080/api/policies/1
```

## 6. Get Policies by Status
```bash
curl http://localhost:8080/api/policies/status/ACTIVE
curl http://localhost:8080/api/policies/status/DRAFT
curl http://localhost:8080/api/policies/status/UNDER_REVIEW
```

## 7. Get Policies by Ministry
```bash
curl "http://localhost:8080/api/policies/ministry/Ministry%20of%20Technology"
```

## Additional Test Cases

### Create Multiple Policies for Testing
```bash
# Policy 1
curl -X POST http://localhost:8080/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Education Reform Policy",
    "description": "Policy for reforming the education system",
    "view_full_policy": "Detailed education reform guidelines...",
    "ministry": "Ministry of Education",
    "status": "DRAFT"
  }'

# Policy 2
curl -X POST http://localhost:8080/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Healthcare Improvement Policy",
    "description": "Policy for improving healthcare services",
    "view_full_policy": "Comprehensive healthcare improvement plan...",
    "ministry": "Ministry of Health",
    "status": "UNDER_REVIEW",
    "effective_date": "2025-07-01T00:00:00Z"
  }'

# Policy 3
curl -X POST http://localhost:8080/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Environmental Protection Policy",
    "description": "Policy for environmental conservation",
    "view_full_policy": "Environmental protection regulations and guidelines...",
    "ministry": "Ministry of Environment",
    "status": "ACTIVE",
    "effective_date": "2025-01-01T00:00:00Z"
  }'
```

### Test Status Updates
```bash
# Update policy status from DRAFT to UNDER_REVIEW
curl -X PUT http://localhost:8080/api/policies/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "UNDER_REVIEW"
  }'

# Update policy status from UNDER_REVIEW to APPROVED
curl -X PUT http://localhost:8080/api/policies/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED"
  }'

# Activate a policy
curl -X PUT http://localhost:8080/api/policies/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACTIVE",
    "effective_date": "2025-06-01T00:00:00Z"
  }'
```

### Error Testing
```bash
# Test invalid status
curl -X POST http://localhost:8080/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Policy",
    "description": "Test description",
    "view_full_policy": "Test content",
    "ministry": "Test Ministry",
    "status": "INVALID_STATUS"
  }'

# Test missing required fields
curl -X POST http://localhost:8080/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "description": "Test description"
  }'

# Test getting non-existent policy
curl http://localhost:8080/api/policies/9999
```
