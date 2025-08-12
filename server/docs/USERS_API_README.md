# Users Module Documentation

## Overview
The Users module provides comprehensive CRUD operations for managing users in the Transparent Governance Platform. It follows the same pattern as other modules (categories, policies, etc.) and integrates seamlessly with the main API service.

## Module Structure
```
server/modules/users/
└── users.bal          # Main users service implementation
```

## Database Schema
The users table has the following structure:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nic VARCHAR(20) UNIQUE NOT NULL,
    mobile_no VARCHAR(15) NOT NULL,
    evm VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Get All Users
- **Method**: `GET`
- **Endpoint**: `/api/users`
- **Description**: Retrieve all users with pagination support
- **Response**: List of users with metadata

### 2. Get User by ID
- **Method**: `GET`
- **Endpoint**: `/api/users/{id}`
- **Description**: Retrieve a specific user by their ID
- **Parameters**: 
  - `id` (path): User ID (integer)

### 3. Create New User
- **Method**: `POST`
- **Endpoint**: `/api/users`
- **Description**: Create a new user
- **Request Body**:
```json
{
    "user_name": "John Doe",
    "email": "john.doe@example.com",
    "nic": "199512345678",
    "mobile_no": "+94771234567",
    "evm": "0x1234567890abcdef1234567890abcdef12345678"
}
```
- **Required Fields**: `user_name`, `email`, `nic`, `mobile_no`
- **Optional Fields**: `evm`

### 4. Update User
- **Method**: `PUT`
- **Endpoint**: `/api/users/{id}`
- **Description**: Update an existing user
- **Parameters**: 
  - `id` (path): User ID (integer)
- **Request Body**: Same as create, but all fields are optional

### 5. Delete User
- **Method**: `DELETE`
- **Endpoint**: `/api/users/{id}`
- **Description**: Delete a user by ID
- **Parameters**: 
  - `id` (path): User ID (integer)

### 6. Get User by Email
- **Method**: `GET`
- **Endpoint**: `/api/users/email/{email}`
- **Description**: Retrieve a user by their email address
- **Parameters**: 
  - `email` (path): User email address

### 7. Get User by NIC
- **Method**: `GET`
- **Endpoint**: `/api/users/nic/{nic}`
- **Description**: Retrieve a user by their NIC number
- **Parameters**: 
  - `nic` (path): National Identity Card number

### 8. Search Users
- **Method**: `GET`
- **Endpoint**: `/api/users/search/{keyword}`
- **Description**: Search users by keyword in name or email
- **Parameters**: 
  - `keyword` (path): Search keyword

### 9. Get User Statistics
- **Method**: `GET`
- **Endpoint**: `/api/users/statistics`
- **Description**: Get user statistics including EVM adoption rate
- **Response**:
```json
{
    "success": true,
    "message": "User statistics retrieved successfully",
    "data": {
        "total_users": 100,
        "users_with_evm": 75,
        "users_without_evm": 25,
        "evm_adoption_percentage": 75
    }
}
```

### 10. Get Recent Users
- **Method**: `GET`
- **Endpoint**: `/api/users/recent`
- **Description**: Get users created in the last 30 days

## Testing

### Test Data Files
- `server/test_data/create_user.json` - Sample data for creating a user
- `server/test_data/update_user.json` - Sample data for updating a user

### Example Usage

#### Creating a User
```bash
curl -X POST http://localhost:9090/api/users \
  -H "Content-Type: application/json" \
  -d @test_data/create_user.json
```

#### Getting All Users
```bash
curl -X GET http://localhost:9090/api/users
```

#### Getting User by ID
```bash
curl -X GET http://localhost:9090/api/users/1
```

#### Updating a User
```bash
curl -X PUT http://localhost:9090/api/users/1 \
  -H "Content-Type: application/json" \
  -d @test_data/update_user.json
```

#### Deleting a User
```bash
curl -X DELETE http://localhost:9090/api/users/1
```

## Features

### Data Validation
- Required field validation
- Email format validation
- Unique constraints for email and NIC
- Input sanitization and trimming

### Error Handling
- Comprehensive error messages
- HTTP status code mapping
- Graceful failure handling

### Security
- Input validation and sanitization
- Prepared statements through Supabase REST API
- Authentication headers for database access

### Performance
- Efficient database queries
- Pagination support
- Indexed searches
- Connection pooling through HTTP client

## Integration

The Users module is fully integrated into the main application:

1. **Import**: Added to `main.bal` imports
2. **Service Initialization**: UsersService is initialized with database client
3. **Endpoints**: All user endpoints are registered in the main API service
4. **Logging**: Comprehensive logging for all operations
5. **Documentation**: Endpoints listed in the `/api/info` endpoint

## Dependencies

- `ballerina/http` - HTTP client and server functionality
- `ballerina/log` - Logging support
- `ballerina/time` - Timestamp operations
- Supabase PostgreSQL database via REST API

## Error Responses

All endpoints return consistent error responses:
```json
{
    "success": false,
    "error": "Error message description",
    "timestamp": 1234567890
}
```

## Success Responses

All successful operations return:
```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": { /* result data */ },
    "timestamp": 1234567890
}
```

For list operations, additional metadata is included:
```json
{
    "success": true,
    "message": "Users retrieved successfully",
    "data": [ /* array of users */ ],
    "count": 10,
    "timestamp": 1234567890
}
```
