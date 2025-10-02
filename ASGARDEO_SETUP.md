# Asgardeo Configuration Setup Guide

This guide explains how to configure Asgardeo to work with the Transparent Governance Platform.

## Required Asgardeo Configuration

When setting up your application in the Asgardeo Console, use these exact URLs:

### Protocol Configuration

1. **Authorized Redirect URLs:**
   ```
   http://localhost:3000/api/auth/callback
   ```

2. **Allowed Origins:**
   ```
   http://localhost:3000
   ```

3. **Access URL (optional):**
   ```
   http://localhost:3000
   ```

### Additional Settings

- **Grant Types:** Authorization Code, Refresh Token
- **PKCE:** Enable (recommended for security)
- **Public Client:** Enable if this is a frontend application
- **Access Token Type:** JWT (recommended)

## Environment Variables Setup

1. Copy `client/.env.local.template` to `client/.env.local`
2. Fill in your Asgardeo credentials:
   - `NEXT_PUBLIC_ASGARDEO_BASE_URL`: Your organization's base URL (e.g., `https://api.asgardeo.io/t/your-org-name`)
   - `NEXT_PUBLIC_ASGARDEO_CLIENT_ID`: Your application's client ID
   - `ASGARDEO_CLIENT_SECRET`: Your application's client secret

## Authentication Flow

The authentication flow works as follows:

1. User clicks "Sign in with Asgardeo"
2. Redirected to: `ASGARDEO_BASE_URL/oauth2/authorize`
3. After authentication, Asgardeo redirects to: `http://localhost:3000/api/auth/callback`
4. Callback handler exchanges authorization code for tokens
5. User is redirected to the admin portal with session established

## Files Updated

The following files have been updated to match the localhost:3000 configuration:

- `client/env.example` - Updated API base URL and added configuration comments
- `client/src/app/api/auth/[...asgardeo]/route.ts` - Updated redirect URI
- `client/src/app/api/auth/token-exchange/route.ts` - Updated fallback redirect URI
- `README.md` - Updated documentation with correct URLs
- `client/.env.local.template` - Created template file

## Testing the Configuration

1. Start the client application on port 3000:
   ```bash
   cd client
   npm run dev
   ```

2. Navigate to the authentication test page:
   ```
   http://localhost:3000/auth-test
   ```

3. Test the Asgardeo integration by clicking "Sign in with Asgardeo"

## Troubleshooting

If you encounter issues:

1. **Redirect URI Mismatch**: Ensure the redirect URI in Asgardeo exactly matches `http://localhost:3000/api/auth/callback`
2. **CORS Errors**: Ensure `http://localhost:3000` is added to Allowed Origins in Asgardeo
3. **Environment Variables**: Double-check that all required environment variables are set in `.env.local`

## Port Configuration

The application uses the following port structure:
- **Client (Next.js)**: `localhost:3000` - Main frontend application
- **Smart Contracts API**: `localhost:3001` - Web3 and blockchain operations
- **Auth Service**: `localhost:3002` - Additional authentication services
- **Ballerina Backend**: `localhost:8080` - Main API server
- **Chatbot**: `localhost:8001` - AI chatbot service

Only the client application (port 3000) needs to be configured in Asgardeo, as it handles the OAuth flow.