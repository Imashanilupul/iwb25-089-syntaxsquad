import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, state, redirect_uri } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'No authorization code provided' }, { status: 400 });
    }

    // Exchange authorization code for tokens
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
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
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return NextResponse.json({ success: false, error: 'Token exchange failed' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error('No access token received:', tokens);
      return NextResponse.json({ success: false, error: 'No access token received' }, { status: 400 });
    }

    // Get user info using the access token
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL}/oauth2/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User info request failed:', userResponse.status, errorText);
      return NextResponse.json({ success: false, error: 'User info request failed' }, { status: 400 });
    }

    const user = await userResponse.json();

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

    // Create response with session cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Authentication successful',
      user: user.sub || user.username,
      timestamp: new Date().toISOString()
    });
    
    response.cookies.set('asgardeo_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
      path: '/' // Ensure cookie is available site-wide
    });

    // Clean up temporary cookies
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_callback');

    return response;

  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
