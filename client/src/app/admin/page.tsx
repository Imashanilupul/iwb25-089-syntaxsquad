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
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const { verified, isAdmin, asgardeoUser, isFullyAuthenticated, isLoading } = useAuth()
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isHydrated || isLoading) return
    
    console.log('🔍 Admin auth check:', { 
      isFullyAuthenticated, 
      asgardeoUser: !!asgardeoUser, 
      verified, 
      isConnected,
      address: address?.slice(0, 10) + '...'
    })
    
    const oauthCompleted = localStorage.getItem('oauth_completed')
    const isRecentlyAuthenticated = oauthCompleted && (Date.now() - parseInt(oauthCompleted) < 10000)
    
    if (!isFullyAuthenticated && !isRecentlyAuthenticated) {
      console.log('⚠️ User not fully authenticated, redirecting to login in 3 seconds...')
      setTimeout(() => { 
        if (!isFullyAuthenticated) {
          console.log('🔄 Redirecting to admin login...')
          router.push('/adminLogin')
        }
      }, 3000)
    }
  }, [isFullyAuthenticated, isLoading, router, isHydrated])

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

  // Don't render the admin portal if user is not admin
  if (isConnected && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">Redirecting to admin login...</p>
          </div>
        </div>
      </div>
    )
  }

  const handleWalletDisconnect = async () => {
    try {
      localStorage.removeItem('adminAuthState')
      localStorage.removeItem('adminAuthStateTime')
      localStorage.removeItem('oauth_completed')
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
                  <Badge variant={isAdmin ? "default" : "secondary"} className={`text-xs ${isAdmin ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                    {isAdmin ? "✓ Admin" : "Not Admin"}
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

        {/* Wallet Connect Alert */}
        {!isConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Wallet className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-amber-800">Connect wallet to access admin features</span>
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
