import { NextRequest, NextResponse } from 'next/server';

/**
 * Complete logout endpoint that handles both wallet disconnection and Asgardeo session invalidation
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Logout: Starting logout process...');
    
    // **SIMPLIFIED APPROACH**: Just clear cookies and redirect locally
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout completed',
      redirectUrl: '/adminLogin?logout=success', // Local redirect instead of Asgardeo
      localLogout: true
    });

    // Comprehensive list of cookies to clear
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
      'samlssoTokenId',
      'admin_auth_bypass'
    ];

    // Clear cookies with multiple strategies
    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName);
      
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    console.log('✅ Logout: Local logout completed successfully');
    return response;

  } catch (error) {
    console.error('❌ Logout: Error during logout process:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed', details: error instanceof Error ? error.message : 'Unknown error' },
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
      ? `https://api.asgardeo.io/t/razzallworks/oidc/logout?` +
        `id_token_hint=${idToken}&` +
        `post_logout_redirect_uri=${encodeURIComponent(logoutCallbackUrl)}`
      : `https://api.asgardeo.io/t/razzallworks/oidc/logout?` +
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