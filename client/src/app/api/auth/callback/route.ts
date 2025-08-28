import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    // Handle OAuth callback
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-test?error=${error}`);
    }
    
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-test?error=no_code`);
    }
    
    // Verify state parameter (if you're using it)
    // const storedState = request.cookies.get('oauth_state')?.value;
    // if (state !== storedState) {
    //   return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-test?error=invalid_state`);
    // }
    
    // Exchange authorization code for tokens
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-test?error=token_failed`);
    }
    
    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      console.error('No access token received:', tokens);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-test?error=no_token`);
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-test?error=userinfo_failed`);
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
    
    // Determine redirect URL based on state or session
    let redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth-test?success=true`;
    
    // Check if this is an admin login (you can enhance this with better state management)
    const referer = request.headers.get('referer') || '';
    const isAdminLogin = referer.includes('/adminLogin') || referer.includes('/admin') || state?.includes('admin');
    
    if (isAdminLogin) {
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin?auth=success`;
    }
    
    // Redirect with session cookie
    const response = NextResponse.redirect(redirectUrl);
    
    response.cookies.set('asgardeo_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600
    });
    
    // Clean up temporary cookies
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_nonce');
    
    return response;
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-test?error=callback_error`);
  }
}
