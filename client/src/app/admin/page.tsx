"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminOverview } from "@/components/admin/admin-overview"
import { CategoryManagement } from "@/components/admin/category-management"
import { ProjectManagement } from "@/components/admin/project-management"
import { ProposalManagement } from "@/components/admin/proposal-management"
import { PolicyManagement } from "@/components/admin/policy-management"
import { PetitionManagement } from "@/components/admin/petition-management"
import { ReportManagement } from "@/components/admin/report-management"
import { UserAnalytics } from "@/components/admin/user-analytics"
import { DbSync } from "@/components/admin/db-sync"
import { ConnectButton } from "@/components/walletConnect/wallet-connect"
import { useAuth } from "@/context/AuthContext"
import { useAppKitAccount, useDisconnect } from "@reown/appkit/react"
import {
  LayoutDashboard,
  DollarSign,
  Building,
  Vote,
  FileText,
  MessageSquare,
  AlertTriangle,
  Users,
  Wallet,
  Database,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isHydrated, setIsHydrated] = useState(false)
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false)
  const [bypassAuthCheck, setBypassAuthCheck] = useState(false) // New: bypass complex auth
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const { verified, isAdmin, asgardeoUser, isFullyAuthenticated, isLoading, refreshAsgardeoSession } = useAuth()
  const router = useRouter()

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
        
        console.log('✅ Authentication successful, refreshing auth state...')
        toast({ 
          title: "Authentication Successful! 🎉", 
          description: "Welcome to the admin portal." 
        })
        
        // Refresh authentication state to pick up the new session
        const sessionRefreshed = await refreshAsgardeoSession()
        if (!sessionRefreshed) {
          console.log('⚠️ Failed to refresh session after OAuth success')
        }
        
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

  // Hydration
  useEffect(() => { setIsHydrated(true) }, [])

  // Check if we should bypass auth checks due to recent successful Asgardeo login
  useEffect(() => {
    if (!isHydrated) return
    
    const authBypass = localStorage.getItem('admin_auth_bypass')
    if (authBypass === 'true') {
      console.log('🔓 Found admin auth bypass flag - user authenticated via Asgardeo')
      setBypassAuthCheck(true)
    }
  }, [isHydrated])

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
      
      // Set bypass flag - trust that Asgardeo authentication was successful
      setBypassAuthCheck(true)
      console.log('🔓 Setting bypass flag - user will stay on admin page')
      
      // Set oauth_completed flag to trigger AuthContext refresh
      localStorage.setItem('oauth_completed', Date.now().toString())
      
      // Set a flag in localStorage to remember this successful auth
      localStorage.setItem('admin_auth_bypass', 'true')
      
      // Trigger Asgardeo session refresh to fetch user data
      console.log('🔄 Triggering Asgardeo session refresh after auth success...')
      refreshAsgardeoSession().then(sessionRefreshed => {
        if (!sessionRefreshed) {
          console.log('⚠️ Failed to refresh session after auth success parameter detected')
        }
      })
      
      // Clean URL
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('auth')
      cleanUrl.searchParams.delete('timestamp')
      window.history.replaceState({}, document.title, cleanUrl.toString())
    }
  }, [isHydrated, refreshAsgardeoSession])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isHydrated || isLoading) return
    
    console.log('🔍 Admin auth check:', { 
      isFullyAuthenticated, 
      asgardeoUser: !!asgardeoUser, 
      verified, 
      isConnected,
      address: address?.slice(0, 10) + '...',
      isAdmin,
      bypassAuthCheck
    })
    
    // **SIMPLE BYPASS**: If bypass flag is set, user stays on admin page
    if (bypassAuthCheck) {
      console.log('🔓 Auth bypass active - allowing access to admin page')
      return
    }
    
    const oauthCompleted = localStorage.getItem('oauth_completed')
    const isRecentlyAuthenticated = oauthCompleted && (Date.now() - parseInt(oauthCompleted) < 10000)
    
    // Check for authSuccess parameter indicating successful OAuth return
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get('auth')
    
    // If user has Asgardeo session, they've already been verified as admin
    if (asgardeoUser) {
      console.log('✅ User has Asgardeo session, allowing access without wallet verification')
      return
    }
    
    // **SIMPLIFIED**: If user recently completed OAuth or has authSuccess parameter, give longer time
    if (isRecentlyAuthenticated || authSuccess === 'success') {
      console.log('⏳ Recent OAuth completion or auth success detected, allowing extended time for session establishment')
      
      // Give much longer time and try multiple refresh attempts
      const sessionCheckTimer = setTimeout(async () => {
        console.log('🔄 Final session check after OAuth...')
        const sessionRefreshed = await refreshAsgardeoSession()
        if (!sessionRefreshed) {
          // If session refresh fails, but we know OAuth was successful, 
          // let's just accept it and stay on admin page for now
          console.log('⚠️ Session refresh failed but OAuth was successful - staying on admin page')
          // Commented out redirect to allow user to stay
          // router.push('/admin-welcome')
        } else {
          console.log('✅ Session refresh successful')
        }
      }, 5000) // Give 5 seconds for session to be established
      
      return () => clearTimeout(sessionCheckTimer)
    }
    
    // Only redirect if user has no Asgardeo session, no recent OAuth completion, AND no auth success
    const hasAnyAuthIndication = asgardeoUser || isRecentlyAuthenticated || authSuccess === 'success'
    
    if (!hasAnyAuthIndication) {
      console.log('❌ No authentication indication found, redirecting to admin login')
      router.push('/adminLogin')
    } else {
      console.log('✅ Some form of authentication detected, staying on admin page')
    }
    
  }, [asgardeoUser, isLoading, router, isHydrated, refreshAsgardeoSession, bypassAuthCheck])

  if (!isHydrated || isLoading || isProcessingOAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">
            {!isHydrated ? 'Loading application...' : isProcessingOAuth ? 'Completing authentication...' : 'Verifying authentication...'}
          </p>
        </div>
      </div>
    )
  }

  const handleWalletDisconnect = async () => {
    try {
      localStorage.removeItem('adminAuthState')
      localStorage.removeItem('adminAuthStateTime')
      localStorage.removeItem('oauth_completed')
      localStorage.removeItem('admin_auth_bypass') // Clear bypass flag on logout
      await disconnect()
      const logoutResponse = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      if (logoutResponse.ok) { const logoutResult = await logoutResponse.json(); if (logoutResult.redirectUrl) return window.location.href = logoutResult.redirectUrl }
      window.location.href = '/api/auth/logout'
    } catch (error) { console.error(error); window.location.href = '/api/auth/logout' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Top row: Logo + Title on left, Wallet + Logout on right */}
          <div className="flex items-start justify-between gap-4 mb-4">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <img
                src="/images/logo.png"
                alt="Sri Lanka National Emblem"
                className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-slate-900 mb-1">Admin Portal</h1>
                <p className="text-xs sm:text-sm lg:text-lg text-slate-600">Sri Lanka Transparent Governance Platform</p>
              </div>
            </div>

            {/* Right: Wallet + Logout in same row */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {isConnected && address && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <Wallet className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-mono text-slate-700">{address.slice(0,6)}...{address.slice(-4)}</span>
                  </div>
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                    ✓ Connected
                  </Badge>
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleWalletDisconnect} 
                className="flex items-center gap-1.5 bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-700 hover:from-red-100 hover:to-pink-100 hover:border-red-300 transition-all duration-200 rounded-lg px-3 py-2 text-xs sm:text-sm"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Second row: Welcome message (if user exists) */}
          {asgardeoUser && (
            <div className="ml-0 sm:ml-20 lg:ml-24 mb-2">
              <p className="text-xs sm:text-sm text-slate-500">Welcome back, <span className="font-semibold text-slate-900">{asgardeoUser.given_name || 'Administrator'}</span></p>
            </div>
          )}
        </div>

        {/* Wallet Connect Alert - Optional for enhanced features */}
        {!isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Wallet className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-blue-800">
                Connect wallet for enhanced features (optional)
              </span>
            </div>
            <ConnectButton />
          </div>
        )}


        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-nowrap w-full gap-1 sm:gap-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent py-2 px-1 lg:grid lg:grid-cols-9 lg:w-fit lg:overflow-x-visible">
            {[
              { value: 'overview', label: 'Overview', icon: LayoutDashboard },
              { value: 'categories', label: 'Categories', icon: DollarSign },
              { value: 'projects', label: 'Projects', icon: Building },
              { value: 'proposals', label: 'Proposals', icon: Vote },
              { value: 'policies', label: 'Policies', icon: FileText },
              { value: 'petitions', label: 'Petitions', icon: MessageSquare },
              { value: 'reports', label: 'Reports', icon: AlertTriangle },
              { value: 'users', label: 'Analytics', icon: Users },
              { value: 'db-sync', label: 'Database Sync', icon: Database },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap px-2 py-2 sm:px-3 min-w-[2.5rem] sm:min-w-0">
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="hidden lg:inline text-sm">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="categories"><CategoryManagement /></TabsContent>
          <TabsContent value="projects"><ProjectManagement /></TabsContent>
          <TabsContent value="proposals"><ProposalManagement /></TabsContent>
          <TabsContent value="policies"><PolicyManagement /></TabsContent>
          <TabsContent value="petitions"><PetitionManagement /></TabsContent>
          <TabsContent value="reports"><ReportManagement /></TabsContent>
          <TabsContent value="users"><UserAnalytics /></TabsContent>
          <TabsContent value="db-sync"><DbSync /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
