import { NextRequest, NextResponse } from 'next/server';

/**
 * Logout callback endpoint to handle redirects after Asgardeo logout
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Logout callback: Processing Asgardeo logout callback');
    
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Clear any remaining authentication cookies and redirect to login
    const response = NextResponse.redirect(
      new URL('/adminLogin?logout=complete&source=asgardeo&timestamp=' + Date.now(), request.url)
    );
    
    // Comprehensive cookie cleanup
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

    if (error) {
      console.error('Logout callback: Error from Asgardeo:', error);
      return NextResponse.redirect(
        new URL('/adminLogin?logout=error&message=' + encodeURIComponent(error), request.url)
      );
    }

    console.log('Logout callback: Successful logout, redirecting to login');
    return response;

  } catch (error) {
    console.error('Logout callback: Error processing callback:', error);
    return NextResponse.redirect(
      new URL('/adminLogin?logout=error&message=callback_failed', request.url)
    );
  }
}
