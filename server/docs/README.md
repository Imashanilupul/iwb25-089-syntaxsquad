# Transparent Governance Platform - Ballerina Backend

This is the backend service for the Transparent Governance Platform built with Ballerina. It provides RESTful APIs for managing users, petitions, categories, projects, policies, and reports.

## Features

- **User Management**: CRUD operations for user accounts
- **Petition System**: Create and manage petitions with signature tracking
- **Category Management**: Budget allocation and tracking by categories
- **Project Management**: Track government projects and spending
- **Policy Hub**: Policy management with commenting system
- **Reporting System**: Whistleblowing and reporting functionality
- **Database Integration**: PostgreSQL with Supabase
- **RESTful APIs**: Standard HTTP endpoints with JSON responses
- **Validation**: Input validation and error handling
- **Testing**: Comprehensive test suite

## Prerequisites

- Ballerina 2201.12.7 or later
- PostgreSQL database (Supabase recommended)
- Java 11 or later

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd server-bal
   ```

2. **Install Ballerina dependencies**:
   ```bash
   bal build
   ```

3. **Configure database**:
   Update the `Config.toml` file with your database credentials:
   ```toml
   dbHost = "your-database-host"
   dbPort = 5432
   dbName = "your-database-name"
   dbUser = "your-username"
   dbPassword = "your-password"
   ```

## Database Setup

The application uses PostgreSQL with pure Ballerina SQL connectivity. The database schema is defined in `db/schema.bal` and automatically created on first run.

### Tables:
- `users` - User accounts
- `petitions` - Petition management
- `categories` - Budget categories
- `projects` - Government projects
- `transactions` - Financial transactions
- `proposals` - Policy proposals
- `policies` - Government policies
- `policy_comments` - Policy discussions
- `reports` - Whistleblowing reports
- `petition_activities` - Petition activity tracking

### Automatic Setup:
The application automatically:
1. Connects to the database using credentials from `Config.toml`
2. Checks if tables exist
3. Creates tables if they don't exist
4. Sets up proper indexes for performance

## Running the Application

1. **Start the server**:
   ```bash
   bal run
   ```

2. **Health check**:
   ```bash
   curl http://localhost:8080/api/health
   ```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Users
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Petitions
- `POST /api/petitions` - Create a new petition
- `GET /api/petitions` - Get all petitions (with pagination)

### Categories
- `POST /api/categories` - Create a new category
- `GET /api/categories` - Get all categories

## Request/Response Format

### Create User Request
```json
{
  "userName": "John Doe",
  "email": "john@example.com",
  "nic": "123456789",
  "mobileNo": "0712345678",
  "evm": "optional-evm"
}
```

### API Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Operation failed",
  "error": "Detailed error message"
}
```

## Pagination

For endpoints that support pagination, use query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

Example:
```
GET /api/users?page=2&limit=20
```

## Validation

The application includes validation for:
- Email format
- NIC (Sri Lankan National Identity Card) format
- Mobile number format
- Required fields
- Data types

## Testing

Run the test suite:
```bash
bal test
```

### Test Categories:
- Unit tests for validation functions
- Unit tests for utility functions
- Integration tests for API endpoints (disabled by default)

## Project Structure

```
server-bal/
├── main.bal                 # Main application entry point
├── Config.toml             # Configuration file
├── Ballerina.toml          # Ballerina project configuration
├── Dependencies.toml       # Dependency management
├── db/
│   ├── db-client.bal       # Database connection and client
│   └── schema.bal          # Database schema definition and setup functions
├── models/
│   └── usr-model.bal       # Data models and types
├── services/
│   └── usr_services.bal    # Business logic and database operations
├── controllers/
│   └── usr-controller.bal  # HTTP controllers and endpoints
├── utils/
│   └── helper.bal          # Utility functions and helpers
└── tests/
    └── testcase.bal        # Test cases
```

## Configuration

### Environment Variables
The application uses `Config.toml` for configuration:

```toml
# Database Configuration
dbHost = "aws-0-ap-south-1.pooler.supabase.com"
dbPort = 6543
dbName = "postgres"
dbUser = "postgres.hhnxsixgjcdhvzuwbmzf"
dbPassword = "Anjana12345."

# Server Configuration
port = 8080

# Database Pool Configuration
maxOpenConnections = 10
maxConnectionLifeTime = 3600
```

## Error Handling

The application provides comprehensive error handling:
- Database connection errors
- Validation errors
- HTTP request/response errors
- Business logic errors

All errors are logged and returned in a consistent format.

## Logging

The application uses Ballerina's built-in logging:
- Info logs for successful operations
- Error logs for failures
- Debug logs for detailed information

## Security Considerations

- Input validation for all endpoints
- SQL injection prevention using parameterized queries
- Error message sanitization
- Database connection pooling

## Performance

- Database connection pooling
- Efficient SQL queries
- Pagination for large datasets
- Optimized data structures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### Version 1.0.0
- Initial release
- Basic CRUD operations for users, petitions, and categories
- Database integration with PostgreSQL
- RESTful API endpoints
- Comprehensive test suite 