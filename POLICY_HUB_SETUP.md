# Policy Hub Database Integration Setup

This guide will help you set up the Policy Hub component with real database integration.

## 🚀 Quick Start

### Prerequisites

1. **Ballerina** - Download from [ballerina.io](https://ballerina.io/downloads/)
2. **Node.js** (v18 or higher) - Download from [nodejs.org](https://nodejs.org/)
3. **pnpm** - Install with `npm install -g pnpm`

### Database Setup

The application uses Supabase as the backend database. The configuration is already set up:

- **Database URL**: `https://hhnxsixgjcdhvzuwbmzf.supabase.co`
- **Tables**: `policies`, `policy_comments`, `users`

#### Add Sample Data

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/hhnxsixgjcdhvzuwbmzf)
2. Navigate to SQL Editor
3. Run the SQL script from `server/scripts/sample_policy_data.sql`

### Starting the Application

#### Option 1: Using PowerShell Scripts (Recommended)

1. **Start the Backend Server:**
   ```powershell
   cd server
   .\start-server.ps1
   ```

2. **Start the Frontend Client:**
   ```powershell
   cd client
   .\start-client.ps1
   ```

#### Option 2: Manual Commands

1. **Backend Server:**
   ```bash
   cd server
   bal run
   ```

2. **Frontend Client:**
   ```bash
   cd client
   pnpm install
   pnpm dev
   ```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Policy Hub**: http://localhost:3000 (navigate to Policy Hub section)

## 📊 Features Implemented

### Real Database Integration

✅ **Policy Management**
- Fetch policies from Supabase database
- Display real policy data (name, description, ministry, status)
- View full policy documents
- Real-time policy statistics

✅ **Policy Comments System**
- Post comments on policies
- View comments from other users
- Like/unlike comments
- Reply to comments
- Real-time comment counts

✅ **Dynamic UI Updates**
- Loading states for all data operations
- Error handling with toast notifications
- Real-time data refresh
- Responsive design for all screen sizes

### API Endpoints Used

- `GET /api/policies` - Fetch all policies
- `GET /api/policies/statistics` - Get policy statistics
- `GET /api/policycomments` - Fetch all comments
- `GET /api/policycomments/policy/{id}` - Get comments for specific policy
- `POST /api/policycomments` - Create new comment
- `GET /api/policycomments/statistics` - Get comment statistics

## 🗄️ Database Schema

### Policies Table
```sql
CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  view_full_policy TEXT NOT NULL,
  ministry VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'DRAFT',
  effective_date TIMESTAMP,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Policy Comments Table
```sql
CREATE TABLE policy_comments (
  comment_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  policy_id INTEGER REFERENCES policies(id),
  comment TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  reply_id INTEGER REFERENCES policy_comments(comment_id),
  reply_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration Files

### Backend Configuration
- `server/Config.toml` - Database and server configuration
- `server/main.bal` - Main server application
- `server/modules/policy/` - Policy management module
- `server/modules/policy_comments/` - Comments management module

### Frontend Configuration
- `client/.env.local` - API endpoint configuration
- `client/src/services/policy.ts` - Policy API service
- `client/src/services/policy-comment.ts` - Comments API service
- `client/src/components/policy-hub.tsx` - Main Policy Hub component

## 🧪 Testing the Integration

1. **Start both servers** (backend and frontend)
2. **Navigate to Policy Hub** in the frontend
3. **Verify data loading:**
   - Policies should load from database
   - Statistics should show real numbers
   - Comments should load when selecting a policy
4. **Test commenting:**
   - Select a policy
   - Add a new comment
   - Verify it appears in the list
5. **Test responsiveness:**
   - Resize browser window
   - Test on mobile view

## 🚨 Troubleshooting

### Backend Issues
- **Server won't start**: Check if Ballerina is installed and Config.toml exists
- **Database connection failed**: Verify Supabase configuration
- **Port conflicts**: Ensure port 8080 is available

### Frontend Issues
- **API calls failing**: Check if backend server is running on port 8080
- **Module not found**: Run `pnpm install` in client directory
- **Environment variables**: Verify `.env.local` has correct API URL

### Common Solutions
1. **Clear browser cache** if seeing old data
2. **Restart both servers** if experiencing connection issues
3. **Check browser console** for JavaScript errors
4. **Verify database connection** using `/api/health` endpoint

## 📈 Next Steps

### Enhancements You Can Add
1. **User Authentication** - Add login/logout functionality
2. **Real-time Updates** - Implement WebSocket connections
3. **Advanced Filtering** - Add ministry, status, and date filters
4. **Sentiment Analysis** - Analyze comment sentiment
5. **Notifications** - Email/SMS notifications for policy updates
6. **File Uploads** - Allow policy document attachments

### Database Optimizations
1. **Indexing** - Add indexes for frequently queried fields
2. **Caching** - Implement Redis caching for better performance
3. **Pagination** - Add proper pagination for large datasets
4. **Search** - Implement full-text search capabilities

## 📝 Additional Notes

- The application currently uses a demo user ID (1) for commenting
- In production, implement proper user authentication
- All API calls include proper error handling
- The UI is fully responsive and accessible
- Sample data includes realistic Sri Lankan policy examples

For more information, check the individual module documentation in the `server/modules/` directory.
