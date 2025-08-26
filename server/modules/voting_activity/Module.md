# Voting Activity Module

This module provides functionality to retrieve and analyze voting activity data from the proposal_votes table.

## Features

- Retrieves hourly voting activity data
- Processes timestamps from the updated_at column
- Groups votes by hour for daily analytics
- Returns structured data for frontend charts

## Classes

### VotingActivityService

Main service class for handling voting activity operations.

#### Methods

- `init(http:Client, string)` - Initialize the service with database client
- `getVotingActivity()` - Get hourly voting activity for today
- `getHeaders()` - Get HTTP headers for database requests
