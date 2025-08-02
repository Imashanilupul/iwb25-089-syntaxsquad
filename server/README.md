# Transparent Governance Platform - Server

A modern, modular Ballerina backend for the Transparent Governance Platform with proper environment-based configuration and clean architecture.

## 📁 Project Structure

```
server/
├── main.bal                   # Main application entry point
├── Config.toml               # Configuration file with environment variables
├── Ballerina.toml            # Project metadata and dependencies
├── Dependencies.toml         # Dependency lock file
│
├── config/                   # Configuration management
│   ├── config.bal           # Configuration types and loaders
│   ├── database.toml        # Database configuration
│   └── server.toml          # Server configuration
│
├── db/                      # Database layer
│   ├── database_client.bal  # Database client class
│   ├── db-client.bal        # Legacy database client
│   ├── schema.bal           # Database schema definitions
│   └── .env                 # Database environment variables
│
├── services/                # Business logic services
│   ├── categories_service.bal # Categories business logic
│   ├── api_service.bal      # API service (legacy)
│   ├── database_service.bal # Database service (legacy)
│   ├── http_api_service.bal # HTTP API service (legacy)
│   └── usr_services.bal     # User services
│
├── routes/                  # API route handlers
│   └── api_routes.bal       # API route definitions
│
├── controllers/             # Request controllers (legacy)
│   ├── categories-controller.bal
│   ├── main-controller.bal
│   └── usr-controller.bal
│
├── models/                  # Data models
│   └── usr-model.bal
│
├── utils/                   # Utility functions
│   └── helper.bal
│
├── tests/                   # Test files
│   └── testcase.bal
│
├── docs/                    # Documentation
│   ├── README.md
│   ├── SETUP.md
│   ├── DATABASE_SETUP_GUIDE.md
│   ├── CATEGORIES_API_README.md
│   ├── CATEGORIES_API_TEST_DATA.md
│   ├── CATEGORIES_POSTMAN_DATASET.md
│   ├── CATEGORIES_SERVICE_BUG_FIXES.md
│   ├── JAVA_COMPATIBILITY_GUIDE.md
│   ├── PROJECT_CLEANUP_SUMMARY.md
│   ├── REFACTORING_SUMMARY.md
│   ├── Categories_API_Postman_Collection.json
│   ├── categories_test_data.json
│   └── main_old.bal         # Backup of old monolithic main.bal
│
├── scripts/                 # Database and deployment scripts
│   ├── database.ps1
│   ├── database_migration.sql
│   ├── disable_rls.sql
│   ├── extract-sql.ps1
│   ├── migrate.ps1
│   ├── setup_database.ps1
│   └── setup_database_fixed.ps1
│
└── target/                  # Build artifacts
    ├── bin/
    ├── cache/
    └── resources/
```

## 🚀 Features

### ✅ Completed Improvements

1. **Modular Architecture**: Split monolithic `main.bal` into specialized modules
2. **Environment Configuration**: Proper use of `Config.toml` for environment variables
3. **Clean Project Structure**: Organized files into logical directories
4. **Security**: Removed hardcoded credentials from code
5. **Documentation**: Organized all documentation in dedicated `docs/` folder
6. **Scripts**: Moved all database scripts to `scripts/` folder

### 🔧 Technical Improvements

- **Environment Variables**: Configuration now uses Ballerina's configurable variables
- **HTTP Client**: Centralized Supabase HTTP client configuration
- **Error Handling**: Improved error handling and logging
- **API Endpoints**: Clean, RESTful API design
- **Database Layer**: Abstracted database operations

## 🛠️ Configuration

### Config.toml
```toml
# Server Configuration
port = 8080

# Supabase Configuration
supabaseUrl = "https://hhnxsixgjcdhvzuwbmzf.supabase.co"
supabaseServiceRoleKey = "your-service-role-key-here"
```

### Environment Variables
The application uses Ballerina's configurable variables system:

- `port`: Server port (default: 8080)
- `supabaseUrl`: Supabase project URL
- `supabaseServiceRoleKey`: Supabase service role key for API access

## 📡 API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/status` - Server status
- `GET /api/db/health` - Database health check
- `GET /api/info` - Server information

### Categories Management
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create a new category
- `GET /api/categories/{id}` - Get category by ID
- `PUT /api/categories/{id}` - Update category by ID
- `DELETE /api/categories/{id}` - Delete category by ID

## 🗄️ Database Integration

### Supabase HTTP API
The application uses Supabase's REST API for database operations:

- **URL**: Configured via environment variable
- **Authentication**: Service role key for backend operations
- **Operations**: Full CRUD operations via HTTP REST API
- **Response Format**: JSON responses with success/error status

### Database Tables
Expected database schema includes:
- `categories` - Budget categories with allocated and spent amounts
- `users` - User management
- `projects` - Project tracking
- `proposals` - Proposal management
- `policies` - Policy documentation
- `reports` - Report management
- `petitions` - Petition system

## 🚀 Getting Started

### Prerequisites
- Ballerina 2201.x.x or later
- Access to Supabase project
- Valid Supabase service role key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Configure environment**
   Update `Config.toml` with your Supabase credentials:
   ```toml
   supabaseUrl = "your-supabase-url"
   supabaseServiceRoleKey = "your-service-role-key"
   ```

3. **Install dependencies**
   ```bash
   bal deps
   ```

4. **Run the application**
   ```bash
   bal run
   ```

### Development

- **Build**: `bal build`
- **Test**: `bal test`
- **Clean**: `bal clean`

## 🔒 Security Considerations

1. **Environment Variables**: Sensitive data is now stored in `Config.toml`
2. **Service Role Key**: Used for backend database operations
3. **CORS**: Configured for development (update for production)
4. **Input Validation**: Comprehensive validation on all API endpoints

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:

- **Setup Guide**: `docs/SETUP.md`
- **Database Guide**: `docs/DATABASE_SETUP_GUIDE.md`
- **API Documentation**: `docs/CATEGORIES_API_README.md`
- **Migration Guide**: `docs/MIGRATION-SUMMARY.md`

## 🧪 Testing

Test the API endpoints:

1. **Health Check**
   ```bash
   curl http://localhost:8080/api/health
   ```

2. **Database Health**
   ```bash
   curl http://localhost:8080/api/db/health
   ```

3. **Server Info**
   ```bash
   curl http://localhost:8080/api/info
   ```

4. **Categories**
   ```bash
   # Get all categories
   curl http://localhost:8080/api/categories
   
   # Create a category
   curl -X POST http://localhost:8080/api/categories \
     -H "Content-Type: application/json" \
     -d '{"categoryName": "Infrastructure", "allocatedBudget": 1000000, "spentBudget": 0}'
   ```

## 🔄 Migration from Old Structure

The old monolithic `main.bal` has been:
1. **Backed up** to `docs/main_old.bal`
2. **Refactored** into modular components
3. **Improved** with proper configuration management
4. **Documented** with comprehensive API documentation

## 📋 Next Steps

1. **Add More Services**: Extend with user, project, and proposal services
2. **Authentication**: Implement JWT-based authentication
3. **Validation**: Add comprehensive input validation middleware
4. **Logging**: Implement structured logging
5. **Monitoring**: Add health monitoring and metrics
6. **Testing**: Create comprehensive test suite

## 🤝 Contributing

1. Follow the established directory structure
2. Use environment variables for configuration
3. Add comprehensive documentation
4. Include tests for new features
5. Follow Ballerina coding conventions

## 📞 Support

For issues and questions:
1. Check the documentation in `docs/`
2. Review the API endpoints with `/api/info`
3. Check database connectivity with `/api/db/health`
