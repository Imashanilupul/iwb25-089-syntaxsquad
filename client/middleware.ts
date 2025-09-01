import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow auth callback and public routes without middleware
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/adminLogin') ||
    pathname.match(/\.(html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$/)
  ) {
    return NextResponse.next()
  }
  
  // For admin route, check if there's an auth success parameter (callback from Asgardeo)
  if (pathname === '/admin') {
    const authSuccess = request.nextUrl.searchParams.get('auth')
    
    // If this is a callback from Asgardeo (auth=success), allow it to proceed
    if (authSuccess === 'success') {
      return NextResponse.next()
    }
    
    // Otherwise, check for session
    const session = request.cookies.get('asgardeo_session')
    if (!session) {
      // No session, redirect to admin login
      return NextResponse.redirect(new URL('/adminLogin', request.url))
    }
    
    try {
      const sessionData = JSON.parse(session.value)
      // Check if session is still valid
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        // Session expired, redirect to admin login
        const response = NextResponse.redirect(new URL('/adminLogin', request.url))
        response.cookies.delete('asgardeo_session')
        return response
      }
      
      // Session is valid, proceed
      return NextResponse.next()
    } catch (error) {
      // Invalid session data, redirect to admin login
      const response = NextResponse.redirect(new URL('/adminLogin', request.url))
      response.cookies.delete('asgardeo_session')
      return response
    }
  }
  
  // For other protected routes (if any), you can add similar logic here
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
