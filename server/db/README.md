# Database Layer - Transparent Governance Platform

This folder contains the database-related files organized in a clean, maintainable structure.

## Files Overview

### `schema.sql`
- **Purpose**: Raw SQL schema file for manual database setup
- **Usage**: Run this in Supabase SQL Editor or any PostgreSQL client
- **Contains**: All table definitions, indexes, and sample data

### `schema.bal`
- **Purpose**: Ballerina functions for programmatic table creation
- **Usage**: Import and call `setupTables(dbClient)` to create all tables
- **Contains**: Individual table creation functions with proper dependencies

### `db-client.bal`
- **Purpose**: Database connection management
- **Usage**: Import and call `getDbClient()` to get a database connection
- **Contains**: Connection configuration, lazy initialization, and connection testing

## Database Setup Options

### Option 1: Manual Setup (Recommended for Production)
```sql
-- Copy the contents of schema.sql and run in Supabase SQL Editor
-- This is the preferred method for production databases
```

### Option 2: Programmatic Setup (Development)
```ballerina
import . from "./db/db-client.bal";
import . from "./db/schema.bal";

public function main() returns error? {
    postgresql:Client client = check getDbClient();
    check setupTables(client);
}
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

1. **schema.sql** → Standalone (no dependencies)
2. **db-client.bal** → Uses `Config.toml` for configuration
3. **schema.bal** → Requires `db-client.bal` for database connections

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
