# Transparent Governance Platform - Pure Ballerina Backend Setup

This guide will help you set up the complete backend using pure Ballerina without any Node.js dependencies.

## Prerequisites

- **Ballerina 2201.12.7 or later**
- **PostgreSQL database** (Supabase recommended)
- **Java 11 or later**

## Quick Start

### 1. Build the Project
```bash
cd server-bal
bal build
```

### 2. Configure Database
Edit `Config.toml` with your database credentials:
```toml
# Database Configuration - Supabase
dbHost = "your-supabase-host"
dbPort = 6543
dbName = "postgres"
dbUser = "your-username"
dbPassword = "your-password"

# Server Configuration
port = 8080
```

### 3. Run the Server
```bash
bal run
```

### 4. Test Health Check
```bash
curl http://localhost:8080/api/health
```

## Database Setup

### Option 1: Automatic Setup (Recommended)
The application will automatically:
1. Connect to your database
2. Check if tables exist
3. Create tables if they don't exist
4. Set up proper indexes

### Option 2: Manual Setup
If you prefer to set up tables manually:

1. **Connect to your PostgreSQL database**
2. **Use the Ballerina schema functions**:
   ```ballerina
   // Import and use the functions from db/schema.bal
   // Call setupTables(dbClient) to create all necessary tables and indexes
   ```

## Project Structure

```
server-bal/
├── main.bal                 # Main application entry point
├── Config.toml             # Configuration file
├── Ballerina.toml          # Ballerina project configuration
├── Dependencies.toml       # Dependency management
├── db/
│   ├── db-client.bal       # Database connection and client
│   ├── schema.bal          # Database schema definition and setup functions
├── models/
│   └── usr-model.bal       # Data models and types
├── services/
│   └── usr_services.bal    # Business logic and database operations
├── controllers/
│   ├── main-controller.bal # HTTP controllers and endpoints
│   └── usr-controller.bal  # Additional controllers
├── utils/
│   └── helper.bal          # Utility functions and helpers
└── tests/
    └── testcase.bal        # Test cases
```

## Database Schema

The application uses the following tables:

- **users** - User accounts with NIC, email, mobile
- **categories** - Budget categories for government spending
- **projects** - Government projects with budget tracking
- **transactions** - Financial transactions by category
- **proposals** - Policy proposals with voting
- **policies** - Government policies
- **policy_comments** - Policy discussions and comments
- **reports** - Whistleblowing reports
- **petitions** - Public petitions with signature tracking
- **petition_activities** - Petition activity tracking

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

## Configuration

### Environment Variables
The application uses `Config.toml` for configuration:

```toml
# Database Configuration
dbHost = "your-database-host"
dbPort = 6543
dbName = "postgres"
dbUser = "your-username"
dbPassword = "your-password"

# Server Configuration
port = 8080

# Database Pool Configuration
maxOpenConnections = 10
maxConnectionLifeTime = 3600
```

## Testing

### Run Tests
```bash
bal test
```

### Manual Testing
Use tools like Postman or curl to test endpoints:

```bash
# Health check
curl http://localhost:8080/api/health

# Create user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "John Doe",
    "email": "john@example.com",
    "nic": "123456789",
    "mobileNo": "0712345678"
  }'

# Get users
curl http://localhost:8080/api/users
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your `Config.toml` credentials
   - Ensure your database is running
   - Verify network connectivity

2. **Tables Not Created**
   - Check database permissions
   - Review logs for SQL errors
   - Run schema manually if needed

3. **Build Errors**
   - Ensure Ballerina version is 2201.12.7+
   - Check Java version (11+)
   - Clear target directory: `rm -rf target/`

### Logs
The application provides detailed logging:
- Database connection status
- Table creation progress
- API request/response logs
- Error details

## Development

### Adding New Endpoints
1. Add models in `models/usr-model.bal`
2. Add services in `services/usr_services.bal`
3. Add controllers in `controllers/main-controller.bal`

### Database Changes
1. Update `db/schema.bal`
2. Update models in `models/usr-model.bal`
3. Update services as needed

## Production Deployment

### Environment Setup
1. Set up PostgreSQL database
2. Configure `Config.toml` with production credentials
3. Set appropriate connection pool settings

### Security Considerations
- Use environment variables for sensitive data
- Enable SSL for database connections
- Implement proper authentication/authorization
- Regular security updates

## Support

For issues and questions:
- Check the logs for error details
- Review the Ballerina documentation
- Create an issue in the repository 