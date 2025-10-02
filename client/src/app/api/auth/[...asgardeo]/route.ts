import { NextRequest, NextResponse } from 'next/server';

// Asgardeo auth handlers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pathname = request.nextUrl.pathname;
  
  // Handle different auth routes
  if (pathname.includes('/signin')) {
    // Generate state for security
    const state = crypto.randomUUID();
    
    // Clear any existing session to force fresh authentication
    const response = NextResponse.redirect('about:blank');
    response.cookies.delete('asgardeo_session');
    
    // Construct the proper redirect URI - use /admin directly since it's configured in Asgardeo
    const redirectUri = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin`;
    
    // Redirect to Asgardeo for authentication
    const asgardeoLoginUrl = `${process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL}/oauth2/authorize?` + 
      `response_type=code&` +
      `client_id=${process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID}&` +
      `scope=${encodeURIComponent(process.env.NEXT_PUBLIC_ASGARDEO_SCOPES || 'openid profile')}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `prompt=login`; // Force login prompt
    
    console.log('🔐 Redirecting to Asgardeo:', asgardeoLoginUrl);
    
    const finalResponse = NextResponse.redirect(asgardeoLoginUrl);
    
    // Store state for verification
    finalResponse.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    });
    
    return finalResponse;
  }
  
  if (pathname.includes('/signout')) {
    // Handle sign out - check referer to determine redirect
    const referer = request.headers.get('referer') || '';
    const isAdminLogout = referer.includes('/admin');
    
    const redirectUrl = isAdminLogout 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/adminLogin?logout=true`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth-test`;
    
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('asgardeo_session');
    response.cookies.delete('oauth_state');
    return response;
  }
  
  return NextResponse.json({ message: 'Auth endpoint' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Auth POST endpoint" });
}