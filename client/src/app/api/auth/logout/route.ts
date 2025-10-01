import { NextRequest, NextResponse } from 'next/server';

/**
 * Complete logout endpoint that handles both wallet disconnection and Asgardeo session invalidation
 */
export async function POST(request: NextRequest) {
  try {
  console.debug('Logout: Starting complete logout process...');
    
    // Step 1: Get the ID token for proper Asgardeo logout
    let idToken = null;
    let sessionData = null;
    
    try {
      const sessionCookie = request.cookies.get('asgardeo_session');
        if (sessionCookie && sessionCookie.value) {
        sessionData = JSON.parse(sessionCookie.value);
        idToken = sessionData.tokens?.id_token || sessionData.id_token;
        console.debug('Logout: Found session data, ID token available:', !!idToken);
      } else {
        console.debug('Logout: No session cookie found');
      }
    } catch (e) {
      console.debug('Logout: Error parsing session data:', e);
    }
    
    // Step 2: Build Asgardeo logout URL that shows logout confirmation page
    let asgardeoLogoutUrl = null;
    const logoutCallbackUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/logout-callback`;
    
    if (idToken) {
      // Use the specific Asgardeo logout API endpoint with ID token hint
      asgardeoLogoutUrl = `https://api.asgardeo.io/t/orge3m8p/oidc/logout?` +
        `id_token_hint=${idToken}&` +
        `post_logout_redirect_uri=${encodeURIComponent(logoutCallbackUrl)}&` +
        `prompt=logout`;
  console.debug('Logout: Built Asgardeo logout confirmation page URL with ID token');
    } else {
      // Fallback: Use specific Asgardeo logout endpoint without ID token
      asgardeoLogoutUrl = `https://api.asgardeo.io/t/orge3m8p/oidc/logout?` +
        `post_logout_redirect_uri=${encodeURIComponent(logoutCallbackUrl)}&` +
        `client_id=${encodeURIComponent(process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID!)}`;
  console.debug('Logout: Built Asgardeo logout confirmation page URL (no ID token)');
    }
    
    // Step 3: Return the Asgardeo logout URL for direct redirect
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout initiated',
      redirectUrl: asgardeoLogoutUrl,
      hasIdToken: !!idToken,
      sessionFound: !!sessionData
    });

    // Comprehensive list of cookies to clear (including Asgardeo specific ones)
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
      'sessionDataKeyConsent',
      'opbs',
      'JSESSIONID',
      'samlssoTokenId'
    ];

    // Clear cookies with multiple strategies to ensure complete removal
    cookiesToClear.forEach(cookieName => {
      // Strategy 1: Delete cookie
      response.cookies.delete(cookieName);
      
      // Strategy 2: Set expired cookie for current domain with all variations
      const expiredDate = new Date(0);
      
      // Clear with httpOnly
      response.cookies.set(cookieName, '', {
        expires: expiredDate,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Clear without httpOnly for client-accessible cookies
      response.cookies.set(cookieName, '', {
        expires: expiredDate,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Clear for root path specifically
      response.cookies.set(cookieName, '', {
        expires: expiredDate,
        path: '/',
        secure: false,
        sameSite: 'lax'
      });
    });

  console.debug('Logout: All authentication cookies cleared');
    return response;

  } catch (error) {
  console.error('Logout: Error during logout process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Logout failed', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET method for direct logout redirect
 */
export async function GET(request: NextRequest) {
  try {
  console.debug('Logout: Direct logout redirect requested');
    
    // Get ID token from cookies
    let idToken = null;
    const logoutCallbackUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/logout-callback`;
    
    try {
      const sessionCookie = request.cookies.get('asgardeo_session');
      if (sessionCookie) {
        const sessionData = JSON.parse(sessionCookie.value);
        idToken = sessionData.tokens?.id_token || sessionData.id_token;
      }
    } catch (e) {
      console.debug('Logout: No session data for direct logout');
    }
    
    // Redirect directly to Asgardeo logout page
    const redirectUrl = idToken 
      ? `https://api.asgardeo.io/t/orge3m8p/oidc/logout?` +
        `id_token_hint=${idToken}&` +
        `post_logout_redirect_uri=${encodeURIComponent(logoutCallbackUrl)}`
      : `https://api.asgardeo.io/t/orge3m8p/oidc/logout?` +
        `post_logout_redirect_uri=${encodeURIComponent(logoutCallbackUrl)}&` +
        `client_id=${encodeURIComponent(process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID!)}`;
    
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
