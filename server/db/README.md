# Database Layer - Transparent Governance Platform

This folder contains the database-related files organized in a clean, maintainable structure.

## Files Overview

# Database Layer - Transparent Governance Platform

This folder contains the database-related files organized in a clean, maintainable structure.

## Files Overview

### `schema.bal`
- **Purpose**: Ballerina functions for programmatic table creation
- **Usage**: Import and call `setupTables(dbClient)` to create all tables
- **Contains**: Individual table creation functions with proper dependencies and comprehensive schema

### `db-client.bal`
- **Purpose**: Database connection management
- **Usage**: Import and call `getDbClient()` to get a database connection
- **Contains**: Connection configuration, lazy initialization, and connection testing

## Database Setup Options

### Option 1: Programmatic Setup (Recommended)
```ballerina
// Use the Ballerina schema functions for automatic setup
import . from "./db/schema.bal";

postgresql:Client client = check getDbClient();
check setupTables(client);
```

### Option 2: Manual Setup (Alternative)
```sql
-- Extract the SQL from schema.bal functions
-- Run manually in Supabase SQL Editor
```

### Option 3: HTTP-based (Current Implementation)
- The main application uses Supabase REST API
- No direct PostgreSQL connection needed
- Tables must be created manually via Supabase dashboard

## Connection Configuration

Database credentials are configured in `Config.toml`:
```toml
dbHost = "db.hhnxsixgjcdhvzuwbmzf.supabase.co"
dbName = "postgres"
dbUser = "postgres"
dbPassword = "your-password"
dbPort = 5432
```

## File Dependencies

1. **schema.bal** → Complete schema with all functions (no dependencies)
2. **db-client.bal** → Uses `Config.toml` for configuration

## Usage in Main Application

The main application (`main.bal`) currently uses HTTP REST API for database operations to avoid PostgreSQL driver compatibility issues. The files in this folder are available for:

- Manual database setup
- Future migration to direct PostgreSQL connections
- Development and testing with local PostgreSQL instances

## Table Structure

The database includes these tables:
- `users` - User accounts with NIC, email, mobile
- `categories` - Budget categories for government spending
- `projects` - Government projects with budget tracking
- `transactions` - Financial transactions by category
- `proposals` - Policy proposals with voting
- `policies` - Government policies
- `policy_comments` - Policy discussions and comments
- `reports` - Whistleblowing reports
- `petitions` - Public petitions with signature tracking
- `petition_activities` - Petition activity tracking

## Notes

- All functions use proper error handling
- Connection pooling is configured for optimal performance
- SSL is required for Supabase connections
- Indexes are created for optimal query performance
