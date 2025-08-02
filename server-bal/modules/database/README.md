# Database Module

This module handles all database operations for the Transparent Governance Platform.

## Features
- PostgreSQL connection management
- Table creation and schema management  
- Health checks and monitoring
- Error handling and logging

## Usage

```ballerina
import server_bal.database;

// Initialize database connection
database:Client dbClient = check database:initDatabase();

// Check database health
boolean isHealthy = check database:checkHealth(dbClient);

// Setup database tables
check database:setupTables(dbClient);
```

## Configuration
Configure database connection in `Config.toml`:

```toml
[database]
host = "localhost"
port = 5432
name = "governance_db"
user = "postgres"
password = "password"
```
