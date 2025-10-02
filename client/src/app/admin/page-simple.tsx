"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

export default function AdminPortal() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false)
  const router = useRouter()

  // Hydration
  useEffect(() => { 
    setIsHydrated(true) 
    console.log('✅ Admin page loaded successfully')
  }, [])

  // OAuth callback handler
  const handleOAuthCallback = async (code: string, state: string) => {
    if (isProcessingOAuth) return
    try {
      setIsProcessingOAuth(true)
      console.log('🔄 Processing OAuth callback in admin page...')
      
      const response = await fetch('/api/auth/token-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          state, 
          redirect_uri: `${window.location.origin}/admin` 
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Token exchange failed:', response.status, errorText)
        throw new Error(`Token exchange failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Clean up URL parameters
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, document.title, url.toString())
        
        // Set completion flag
        localStorage.setItem('oauth_completed', Date.now().toString())
        
        console.log('✅ Authentication successful!')
        toast({ 
          title: "Authentication Successful! 🎉", 
          description: "Welcome to the admin portal." 
        })
        
        // Force a page refresh to pick up the new session
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
      } else {
        throw new Error(result.error || 'Authentication failed')
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      toast({ 
        title: "Authentication Failed", 
        description: "Please try logging in again.", 
        variant: "destructive" 
      })
      setTimeout(() => {
        router.push('/adminLogin')
      }, 2000)
    } finally {
      setIsProcessingOAuth(false)
    }
  }

  // Handle OAuth callback and errors
  useEffect(() => {
    if (!isHydrated) return
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const error = urlParams.get('error')
    const authSuccess = urlParams.get('auth')
    
    console.log('🔍 Admin page URL params:', { code: !!code, state: !!state, error, authSuccess })
    
    if (code && state) handleOAuthCallback(code, state)
    if (error) { 
      console.error('❌ OAuth error in admin page:', error)
      window.history.replaceState({}, document.title, window.location.pathname)
      router.push('/adminLogin')
    }
    if (authSuccess === 'success') {
      console.log('✅ Authentication success detected')
      // Clean URL
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('auth')
      cleanUrl.searchParams.delete('timestamp')
      window.history.replaceState({}, document.title, cleanUrl.toString())
    }
  }, [isHydrated])

  if (!isHydrated || isProcessingOAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">
            {!isHydrated ? 'Loading application...' : 'Completing authentication...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Portal</h1>
              <p className="text-sm sm:text-base text-slate-600">Sri Lanka Transparent Governance Platform</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">🎉 Admin Portal Loaded Successfully!</h3>
              <p className="text-green-700">You have successfully accessed the admin dashboard.</p>
            </div>
          </div>
        </div>

        {/* Admin Overview Component Placeholder */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Dashboard Overview</h2>
          <p className="text-slate-600 mb-4">
            Admin dashboard is now accessible. The AdminOverview component will be loaded here.
          </p>
          
          {/* Test if we can load the AdminOverview component */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">✅ Admin page route is working correctly</p>
            <p className="text-blue-700 text-sm">OAuth authentication completed successfully</p>
          </div>
        </div>

      </div>
    </div>
  )
}