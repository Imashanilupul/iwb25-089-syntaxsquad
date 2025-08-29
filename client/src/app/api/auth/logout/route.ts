import { NextRequest, NextResponse } from 'next/server';

/**
 * Complete logout endpoint that handles both wallet disconnection and Asgardeo session invalidation
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Logout: Starting complete logout process...');
    
    // Step 1: Get the ID token for proper Asgardeo logout
    let idToken = null;
    try {
      const sessionCookie = request.cookies.get('asgardeo_session');
      if (sessionCookie) {
        const sessionData = JSON.parse(sessionCookie.value);
        idToken = sessionData.id_token;
        console.log('Logout: Found ID token for Asgardeo logout');
      }
    } catch (e) {
      console.log('Logout: No valid session data found');
    }
    
    // Step 2: Build Asgardeo logout URL
    const asgardeoLogoutUrl = idToken 
      ? `${process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL}/oidc/logout?` +
        `id_token_hint=${idToken}&` +
        `post_logout_redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/adminLogin?logout=complete`)}`
      : null;
    
    // Step 3: Clear all authentication cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout initiated',
      redirectUrl: asgardeoLogoutUrl || '/adminLogin?logout=local'
    });

    const cookiesToClear = [
      'asgardeo_session',
      'oauth_state', 
      'oauth_callback',
      'id_token',
      'access_token',
      'refresh_token',
      'auth_session',
      'session_state',
      'commonAuthId',
      'sessionDataKey',
      'opbs'
    ];

    // Clear cookies with multiple strategies to ensure complete removal
    cookiesToClear.forEach(cookieName => {
      // Strategy 1: Delete cookie
      response.cookies.delete(cookieName);
      
      // Strategy 2: Set expired cookie for current domain
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Strategy 3: Set expired cookie without httpOnly
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Strategy 4: Clear for localhost domain specifically
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        domain: 'localhost',
        secure: false,
        sameSite: 'lax'
      });
    });

    console.log('Logout: All authentication cookies cleared');
    return response;

  } catch (error) {
    console.error('Logout: Error during logout process:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

/**
 * GET method for direct logout redirect
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Logout: Direct logout redirect requested');
    
    // Get ID token from cookies
    let idToken = null;
    try {
      const sessionCookie = request.cookies.get('asgardeo_session');
      if (sessionCookie) {
        const sessionData = JSON.parse(sessionCookie.value);
        idToken = sessionData.id_token;
      }
    } catch (e) {
      console.log('Logout: No session data for direct logout');
    }
    
    // Clear cookies and redirect
    const redirectUrl = idToken 
      ? `${process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL}/oidc/logout?` +
        `id_token_hint=${idToken}&` +
        `post_logout_redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/adminLogin?logout=complete`)}`
      : '/adminLogin?logout=local';
    
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    
    // Clear all authentication cookies
    const cookiesToClear = [
      'asgardeo_session',
      'oauth_state', 
      'oauth_callback',
      'id_token',
      'access_token',
      'refresh_token',
      'auth_session',
      'session_state',
      'commonAuthId',
      'sessionDataKey',
      'opbs'
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName);
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return response;

  } catch (error) {
    console.error('Logout: Direct logout error:', error);
    return NextResponse.redirect(new URL('/adminLogin?error=logout_failed', request.url));
  }
}
