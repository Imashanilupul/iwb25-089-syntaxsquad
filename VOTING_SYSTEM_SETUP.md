# 🗳️ Report Voting System Setup Guide

This guide explains how to set up and use the new report voting system that automatically adjusts report priorities based on community votes.

## 🚀 Features

- **User Vote Tracking**: Prevents duplicate votes and tracks user voting history
- **Dynamic Priority System**: Report priorities automatically adjust based on net votes
- **Database Integration**: All votes are stored in the database with proper constraints
- **Real-time Updates**: Priority changes are reflected immediately in the UI
- **Vote Change Support**: Users can change their votes (upvote ↔ downvote)

## 📊 Priority Calculation

Report priorities are automatically calculated based on net votes (likes - dislikes):

| Net Votes | Priority | Description |
|-----------|----------|-------------|
| ≥ 50      | CRITICAL | Highest priority - immediate attention required |
| ≥ 20      | HIGH     | High priority - significant community concern |
| ≥ 5       | MEDIUM   | Medium priority - moderate community interest |
| ≥ 0       | MEDIUM   | Medium priority - neutral or slightly positive |
| ≥ -20     | LOW      | Low priority - community concerns |
| < -20     | LOW      | Low priority - significant community disapproval |

## 🗄️ Database Changes

### New Fields Added to `reports` Table

```sql
ALTER TABLE reports 
ADD COLUMN likes INTEGER DEFAULT 0,
ADD COLUMN dislikes INTEGER DEFAULT 0;

-- Add constraints
ALTER TABLE reports 
ADD CONSTRAINT check_likes_positive CHECK (likes >= 0),
ADD CONSTRAINT check_dislikes_positive CHECK (dislikes >= 0);
```

### New `user_votes` Table

```sql
CREATE TABLE user_votes (
    vote_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, wallet_address)
);
```

## 🔧 Setup Instructions

### 1. Run Database Migration

```bash
# Navigate to server/scripts directory
cd server/scripts

# Run the migration script
./run_voting_migration.ps1
```

### 2. Restart Backend Service

After running the migration, restart your Ballerina backend service:

```bash
# Stop the current service
# Then restart
cd server
bal run
```

### 3. Frontend Updates

The frontend has been updated to:
- Send wallet addresses with vote requests
- Handle vote change scenarios
- Display real-time priority updates
- Show user voting history

## 📡 API Endpoints

### Like a Report
```http
POST /api/reports/{reportId}/like
Content-Type: application/json

{
  "wallet_address": "0x1234..."
}
```

### Dislike a Report
```http
POST /api/reports/{reportId}/dislike
Content-Type: application/json

{
  "wallet_address": "0x1234..."
}
```

### Check User Vote
```http
GET /api/reports/{reportId}/vote/{walletAddress}
```

## 🎯 How It Works

### 1. User Votes
- User clicks upvote/downvote button
- Frontend sends request with wallet address
- Backend checks if user already voted
- If new vote: records vote and updates counts
- If vote change: updates existing vote and adjusts counts

### 2. Priority Calculation
- Backend calculates net votes (likes - dislikes)
- Applies priority thresholds automatically
- Updates report priority in database
- Returns updated report data

### 3. Real-time Updates
- Frontend receives updated report data
- Updates local state immediately
- Shows priority change indicators
- Refreshes statistics

## 🛡️ Security Features

- **Duplicate Vote Prevention**: Users can only vote once per report
- **Vote Change Tracking**: All vote changes are logged with timestamps
- **Wallet Address Validation**: Ensures valid Ethereum addresses
- **Database Constraints**: Prevents negative vote counts

## 🔍 Monitoring & Analytics

### Database Queries

```sql
-- Get voting statistics
SELECT 
    priority,
    COUNT(*) as report_count,
    AVG(likes) as avg_likes,
    AVG(dislikes) as avg_dislikes
FROM reports 
GROUP BY priority;

-- Get user voting activity
SELECT 
    wallet_address,
    COUNT(*) as total_votes,
    COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
    COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes
FROM user_votes 
GROUP BY wallet_address;
```

### Priority Distribution
The system automatically maintains a balanced priority distribution based on community sentiment, ensuring that the most important issues receive appropriate attention.

## 🚨 Troubleshooting

### Common Issues

1. **Migration Fails**: Ensure PostgreSQL is running and credentials are correct
2. **Vote Not Recorded**: Check if user already voted on the report
3. **Priority Not Updated**: Verify database constraints are properly applied
4. **Frontend Errors**: Ensure backend service is running and accessible

### Debug Commands

```bash
# Check if tables exist
psql -d governance_platform -c "\dt"

# Verify voting fields
psql -d governance_platform -c "SELECT report_id, likes, dislikes, priority FROM reports LIMIT 5;"

# Check user votes
psql -d governance_platform -c "SELECT * FROM user_votes LIMIT 5;"
```

## 🔮 Future Enhancements

- **Vote Weighting**: Different user types could have different vote weights
- **Vote History**: Detailed voting timeline and change tracking
- **Priority Alerts**: Notifications when reports reach critical priority
- **Analytics Dashboard**: Advanced voting statistics and trends
- **Batch Operations**: Bulk priority updates for multiple reports

## 📝 Notes

- The system automatically handles vote changes (upvote ↔ downvote)
- Priority updates are immediate and irreversible
- All voting activity is logged with timestamps
- The system is designed to be scalable and performant
- Database constraints ensure data integrity

## 🤝 Support

If you encounter any issues or have questions about the voting system:

1. Check the troubleshooting section above
2. Review the database migration logs
3. Verify API endpoint responses
4. Check browser console for frontend errors

---

**Happy Voting! 🗳️✨**
