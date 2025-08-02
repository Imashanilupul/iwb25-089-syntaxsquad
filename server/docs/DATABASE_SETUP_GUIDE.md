# Database Migration Guide for Ballerina + Supabase

This guide provides Prisma-equivalent commands for managing your Ballerina database with Supabase.

## Quick Reference - Prisma vs Ballerina

| Prisma Command | Ballerina Equivalent | Description |
|---------------|---------------------|-------------|
| `npx prisma migrate dev` | `.\database.ps1 setup` | Create and apply migrations |
| `npx prisma db push` | `bal run` | Push schema changes to database |
| `npx prisma generate` | `.\database.ps1 generate` | Generate client types |
| `npx prisma migrate reset` | `.\database.ps1 reset` | Reset database |
| `npx prisma db pull` | Manual process | Pull schema from database |

## Commands for Database Migration

### 1. **Setup Database Tables** (Like `npx prisma migrate dev`)
```powershell
# Option A: Using PowerShell script
.\database.ps1 setup

# Option B: Direct Ballerina command
bal run
```

### 2. **Check Database Status** (Like `npx prisma migrate status`)
```powershell
# Check if all tables exist
.\database.ps1 check

# Or via API
curl http://localhost:8080/api/db/tables
```

### 3. **Generate Types** (Like `npx prisma generate`)
```powershell
# Show information about type generation
.\database.ps1 generate
```
**Note:** In Ballerina, types are manually defined in `models/usr-model.bal` and `db/schema.bal`

### 4. **Reset Database** (Like `npx prisma migrate reset`)
```powershell
# Get reset instructions
.\database.ps1 reset
```

### 5. **Development Workflow**
```powershell
# 1. Make changes to schema.bal
# 2. Build and run to apply changes
bal build
bal run

# 3. Check if tables were created
.\database.ps1 check
```

## Database Setup Options

### Option 1: Automatic Setup (Recommended)
```powershell
cd server
bal run
```
The application will:
- Check if tables exist using `tablesExist()` function
- Create missing tables using `setupTables()` function
- Log the progress to console

### Option 2: Manual Setup via Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to project: `hhnxsixgjcdhvzuwbmzf`
3. Open **SQL Editor**
4. **Copy the entire content from `database_migration.sql`** (not `schema.bal`)
5. Paste and execute in SQL Editor

**Important:** Use `database_migration.sql` file which contains pure SQL, not the Ballerina `schema.bal` file.

```powershell
# Generate fresh SQL from schema.bal (if needed)
.\extract-sql.ps1
```

### Option 3: PowerShell Scripts
```powershell
# Make scripts executable
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run database setup
.\database.ps1 setup

# Check database status
.\database.ps1 check
```

## Schema Management

### Adding New Tables
1. **Edit `db/schema.bal`**:
   ```ballerina
   # Add new table creation function
   function createNewTable(postgresql:Client dbClient) returns error? {
       _ = check dbClient->execute(`
           CREATE TABLE IF NOT EXISTS new_table (
               id SERIAL PRIMARY KEY,
               name VARCHAR(255) NOT NULL
           )
       `);
       log:printInfo("New table ready");
   }
   ```

2. **Update `setupTables()` function**:
   ```ballerina
   public function setupTables(postgresql:Client dbClient) returns error? {
       // ... existing tables
       check createNewTable(dbClient);
       // ...
   }
   ```

3. **Apply changes**:
   ```powershell
   bal run
   ```

### Modifying Existing Tables
1. **Add migration function in `schema.bal`**:
   ```ballerina
   function migrateUsersTable(postgresql:Client dbClient) returns error? {
       _ = check dbClient->execute(`
           ALTER TABLE users ADD COLUMN new_field VARCHAR(255)
       `);
       log:printInfo("Users table migrated");
   }
   ```

2. **Run migration**:
   ```powershell
   bal run
   ```

## Environment Configuration

### Development Setup
Edit `Config.toml`:
```toml
# Database Configuration - Supabase
dbHost = "db.hhnxsixgjcdhvzuwbmzf.supabase.co"
dbPort = 5432
dbName = "postgres"
dbUser = "postgres"
dbPassword = "your-password"

# Server Configuration
port = 8080
```

### Production Setup
Use environment variables or secure config:
```toml
dbHost = "${DB_HOST}"
dbPassword = "${DB_PASSWORD}"
```

## API Endpoints for Database Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/db/health` | GET | Check database connection |
| `/api/db/tables` | GET | Check if tables exist |
| `/api/db/setup` | POST | Get setup instructions |

### Examples:
```powershell
# Check database health
curl http://localhost:8080/api/db/health

# Check if tables exist
curl http://localhost:8080/api/db/tables

# Get setup instructions
curl -X POST http://localhost:8080/api/db/setup
```

## Troubleshooting

### Common Issues

1. **Tables not created automatically**
   ```powershell
   # Check logs for errors
   bal run
   
   # Manual setup via Supabase dashboard
   # Copy SQL from schema.bal functions
   ```

2. **Connection errors**
   ```powershell
   # Verify Config.toml settings
   # Check Supabase project status
   # Test connection: curl http://localhost:8080/api/db/health
   ```

3. **Build errors**
   ```powershell
   # Clean build
   Remove-Item -Recurse -Force target
   bal build
   ```

## Migration Best Practices

1. **Always backup before migrations**
2. **Test migrations in development first**
3. **Use transactions for complex migrations**
4. **Keep migration functions idempotent** (use `IF NOT EXISTS`)
5. **Log migration progress** (use `log:printInfo()`)

## Files Overview

- `db/schema.bal` - Database schema and table creation functions
- `db/db-client.bal` - Database connection management
- `models/usr-model.bal` - Type definitions
- `Config.toml` - Database configuration
- `database.ps1` - Migration utility script
- `migrate.ps1` - Development migration script