import { NextRequest, NextResponse } from 'next/server';

/**
 * Enhanced logout endpoint that thoroughly clears Asgardeo session data
 */
export async function POST(request: NextRequest) {
  try {
    // Create response that clears all authentication-related cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Session cleared successfully' 
    });

    // Clear Asgardeo session cookie
    response.cookies.delete('asgardeo_session');
    
    // Clear OAuth state cookies
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_callback');
    
    // Clear any other authentication-related cookies
    const cookiesToClear = [
      'asgardeo_session',
      'oauth_state', 
      'oauth_callback',
      'id_token',
      'access_token',
      'refresh_token',
      'auth_session',
      'session_state'
    ];

    cookiesToClear.forEach(cookieName => {
      // Clear for current domain
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Also clear without httpOnly flag for client-accessible cookies
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return response;

  } catch (error) {
    console.error('Session clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}

/**
 * GET method for standard logout (maintaining backward compatibility)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirect') || '/adminLogin?cleared=true';
    
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
      'session_state'
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName);
      
      // Also set expired cookies to ensure cleanup
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
    console.error('Logout redirect error:', error);
    return NextResponse.redirect(new URL('/adminLogin?error=logout_failed', request.url));
  }
}
