import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth callback handler for Asgardeo authentication
 * This endpoint processes the authorization code and redirects to the admin portal
 */
export async function GET(request: NextRequest) {
  console.log('🔄 Callback route accessed:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('🔄 OAuth Callback received:', { 
      code: !!code, 
      state: !!state, 
      error,
      url: request.url 
    });

    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error:', error, errorDescription);
      const errorRedirect = new URL('/adminLogin', request.url);
      errorRedirect.searchParams.set('error', error);
      errorRedirect.searchParams.set('error_description', errorDescription || 'Authentication failed');
      return NextResponse.redirect(errorRedirect);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('❌ Missing required OAuth parameters');
      const errorRedirect = new URL('/adminLogin', request.url);
      errorRedirect.searchParams.set('error', 'invalid_request');
      errorRedirect.searchParams.set('error_description', 'Missing authorization code or state');
      return NextResponse.redirect(errorRedirect);
    }

    // Verify state parameter (basic CSRF protection)
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('❌ State parameter mismatch', { stored: storedState, received: state });
      const errorRedirect = new URL('/adminLogin', request.url);
      errorRedirect.searchParams.set('error', 'invalid_state');
      errorRedirect.searchParams.set('error_description', 'Invalid or missing state parameter');
      return NextResponse.redirect(errorRedirect);
    }

    // Exchange authorization code for tokens
    console.log('🔄 Exchanging authorization code for tokens...');
    
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/callback`,
      client_id: process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID!,
      client_secret: process.env.ASGARDEO_CLIENT_SECRET!
    });

    const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenRequestBody
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
      const errorRedirect = new URL('/adminLogin', request.url);
      errorRedirect.searchParams.set('error', 'token_exchange_failed');
      errorRedirect.searchParams.set('error_description', `Failed to exchange authorization code: ${tokenResponse.status}`);
      return NextResponse.redirect(errorRedirect);
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Tokens received:', { access_token: !!tokens.access_token, id_token: !!tokens.id_token });
    
    if (!tokens.access_token) {
      console.error('❌ No access token received:', tokens);
      const errorRedirect = new URL('/adminLogin', request.url);
      errorRedirect.searchParams.set('error', 'authentication_failed');
      errorRedirect.searchParams.set('error_description', 'No access token received');
      return NextResponse.redirect(errorRedirect);
    }

    // Get user info using the access token
    console.log('🔄 Fetching user info...');
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL}/oauth2/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ User info request failed:', userResponse.status, errorText);
      const errorRedirect = new URL('/adminLogin', request.url);
      errorRedirect.searchParams.set('error', 'userinfo_failed');
      errorRedirect.searchParams.set('error_description', `Failed to get user information: ${userResponse.status}`);
      return NextResponse.redirect(errorRedirect);
    }

    const user = await userResponse.json();
    console.log('✅ User info received:', { sub: user.sub, username: user.username });

    // Create session with user info and tokens
    const sessionData = {
      user,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token
      },
      expiresAt: Date.now() + ((tokens.expires_in || 3600) * 1000)
    };

    // Success! Create session and redirect to admin portal
    console.log('✅ Authentication successful, creating session and redirecting to admin portal');
    const successRedirect = new URL('/admin', request.url);
    successRedirect.searchParams.set('auth', 'success');
    successRedirect.searchParams.set('timestamp', Date.now().toString());
    
    // Create response with redirect
    const response = NextResponse.redirect(successRedirect);
    
    // Clean up state cookie
    response.cookies.delete('oauth_state');
    
    // Set session cookie
    response.cookies.set('asgardeo_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
      path: '/'
    });
    
    console.log('🚀 Redirecting to admin portal with session cookie set');
    return response;

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    const errorRedirect = new URL('/adminLogin', request.url);
    errorRedirect.searchParams.set('error', 'internal_error');
    errorRedirect.searchParams.set('error_description', 'Internal server error during authentication');
    return NextResponse.redirect(errorRedirect);
  }
}

// Also handle POST requests (some OAuth flows use POST)
export async function POST(request: NextRequest) {
  return GET(request);
}