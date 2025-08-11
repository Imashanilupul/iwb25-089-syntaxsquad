# Humanode Integration Guide

## Overview

This project integrates with Humanode.io to provide biometric authentication and unique user verification. The integration ensures that each person can only register once, preventing multiple accounts from the same individual.

## Current Status

**⚠️ Development Mode**: The application is currently configured to use mock Humanode services because:
- The mainnet RPC endpoint (`mainnet-rpc.humanode.io`) is not accessible
- We don't have valid API keys yet
- This allows development to continue while setting up proper Humanode access

## Getting Humanode API Access

### Option 1: Developer API (Recommended)
1. Visit [Humanode Developer Portal](https://humanode.io)
2. Sign up for a developer account
3. Navigate to API Keys section
4. Generate new API key for your project
5. Get the correct RPC endpoint URL

### Option 2: Testnet Access
1. Use Humanode testnet for development
2. Get testnet API credentials
3. Test biometric functionality before mainnet

### Option 3: Alternative Endpoints
Try these alternative endpoints if available:
- `https://rpc.humanode.io`
- `https://api.humanode.io`
- `https://explorer-rpc-http.testnet.humanode.io` (current fallback)

## Configuration

### Environment Variables

Create a `.env.local` file with your Humanode credentials:

```env
# Humanode Configuration
NEXT_PUBLIC_HUMANODE_ENDPOINT=https://your-humanode-endpoint
NEXT_PUBLIC_HUMANODE_API_KEY=your_api_key_here

# Development settings
NODE_ENV=development
NEXT_PUBLIC_USE_REAL_HUMANODE=false  # Set to true when you have real credentials
```

### Mock Service vs Real Service

The application automatically detects the environment and switches between:

- **Development Mode**: Uses mock biometric verification
  - Simulates Humanode API responses
  - 90% chance of unique verification (for testing)
  - No real biometric scanning required

- **Production Mode**: Uses real Humanode services
  - Requires valid API credentials
  - Real biometric face scanning
  - Actual uniqueness verification

## Integration Features

### Biometric Verification
- **Face Scanning**: Uses FaceTec SDK through Humanode
- **Liveness Detection**: Ensures real person, not photo/video
- **Uniqueness Check**: Prevents duplicate registrations
- **Privacy Protection**: Biometric data stays with Humanode

### Smart Contract Integration
- Only verified unique users can create petitions
- Biometric verification linked to wallet addresses
- Authorization managed through `auth.sol` contract

## Files Modified for Humanode Integration

### Core Service
- `src/services/humanode-auth.ts` - Main Humanode integration service
- `src/hooks/use-biometric-auth.ts` - React hook for biometric operations

### UI Components
- `src/components/biometric-verification.tsx` - Biometric verification UI
- `src/components/signup.tsx` - User registration with biometric check

### Smart Contracts
- `contracts/auth/auth.sol` - Authorization registry contract
- `contracts/petition/petitions.sol` - Updated with auth requirements

## Error Handling

The application handles several error scenarios:

1. **Network Errors**: Falls back to mock service in development
2. **API Key Issues**: Uses demo credentials with warnings
3. **Service Unavailable**: Graceful degradation to mock mode
4. **Uniqueness Violations**: Clear error messages for duplicate users

## Testing

### Development Testing
```bash
# Run with mock services
npm run dev

# The biometric verification will:
# - Initialize immediately
# - Show "DEV MODE" indicator
# - Simulate 3-second face scan
# - Return 90% unique results
```

### Production Testing
```bash
# Set environment for real testing
NEXT_PUBLIC_USE_REAL_HUMANODE=true npm run dev

# Requires:
# - Valid Humanode API key
# - Working RPC endpoint
# - Real biometric scanning
```

## Next Steps

1. **Get Humanode Access**
   - Apply for developer account
   - Obtain API credentials
   - Test with testnet first

2. **Update Configuration**
   - Replace mock endpoints with real ones
   - Add production API keys
   - Test biometric flows

3. **Deploy Smart Contracts**
   - Deploy AuthRegistry contract
   - Deploy Petitions contract with auth
   - Authorize admin addresses

4. **Production Deployment**
   - Set production environment variables
   - Enable real Humanode services
   - Monitor biometric verification success rates

## Support

- **Humanode Documentation**: Check official docs for latest API changes
- **Community Support**: Join Humanode Discord/Telegram for help
- **Technical Issues**: Contact Humanode support for API access

## Security Considerations

- Never commit API keys to version control
- Use environment variables for sensitive data
- Implement proper error handling for production
- Monitor API usage and rate limits
- Keep Humanode SDK updated for security patches
