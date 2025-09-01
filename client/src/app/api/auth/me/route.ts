import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('asgardeo_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ 
        user: null,
        isAuthenticated: false 
      });
    }
    
    const session = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      const response = NextResponse.json({ 
        user: null,
        isAuthenticated: false 
      });
      response.cookies.delete('asgardeo_session');
      return response;
    }
    
    return NextResponse.json({ 
      user: session.user,
      isAuthenticated: true,
      tokens: session.tokens
    });
    
  } catch (error) {
    console.error('Session read error:', error);
    return NextResponse.json({ 
      user: null,
      isAuthenticated: false 
    });
  }
}
