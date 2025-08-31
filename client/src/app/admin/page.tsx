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
  const { verified, asgardeoUser, isFullyAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Handle OAuth callback without page reload
  const handleOAuthCallback = async (code: string, state: string) => {
    if (isProcessingOAuth) return // Prevent multiple simultaneous calls
    
    try {
      setIsProcessingOAuth(true)
      console.log('OAuth Callback: Starting token exchange...')
      
      // Call our server-side API to handle token exchange securely
      const response = await fetch('/api/auth/token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
          redirect_uri: `${window.location.origin}/admin`
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OAuth Callback: Token exchange failed:', response.status, errorText)
        throw new Error('Token exchange failed')
      }

      const result = await response.json()
      console.log('OAuth Callback: Token exchange successful:', result)

      if (result.success) {
        // Clean up URL parameters
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, document.title, url.toString())
        
        // Set a flag to indicate OAuth completion
        localStorage.setItem('oauth_completed', Date.now().toString())
        
        // Instead of reloading, trigger auth context refresh
        // The auth context will detect the new session cookie and update accordingly
        console.log('OAuth callback successful, auth context should update automatically')
        
        // Show success message
        toast({
          title: "Authentication Successful! 🎉",
          description: "Welcome to the admin portal. Setting up your session...",
        })
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
      router.push('/adminLogin')
    } finally {
      setIsProcessingOAuth(false)
    }
  }

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Handle OAuth callback and URL cleanup
  useEffect(() => {
    if (!isHydrated) return
    
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const error = urlParams.get('error')
    
    // Handle OAuth callback
    if (code && state) {
      console.log('Admin page: Detected OAuth callback with code and state')
      handleOAuthCallback(code, state)
      return
    }
    
    // Handle OAuth errors
    if (error) {
      console.error('Admin page: OAuth error detected:', error)
      // Clean up URL and redirect to login
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, document.title, url.toString())
      router.push('/adminLogin')
      return
    }
  }, [isHydrated])

  // Redirect to adminLogin if not fully authenticated (but be patient after OAuth)
  useEffect(() => {
    if (!isHydrated || isLoading) return
    
    // Check if we just completed OAuth
    const oauthCompleted = localStorage.getItem('oauth_completed')
    const isRecentlyAuthenticated = oauthCompleted && (Date.now() - parseInt(oauthCompleted) < 10000) // 10 seconds
    
    if (!isFullyAuthenticated && !isRecentlyAuthenticated) {
      // Give auth context time to update after OAuth
      const checkAuthAfterDelay = setTimeout(() => {
        if (!isFullyAuthenticated) {
          console.log('Admin page: Not authenticated, redirecting to adminLogin')
          router.push('/adminLogin')
        }
      }, 3000) // Wait 3 seconds for auth context to update
      
      return () => clearTimeout(checkAuthAfterDelay)
    }
  }, [isFullyAuthenticated, isLoading, router, isHydrated])

  // Additional redirect effect for immediate unauthenticated state
  useEffect(() => {
    if (!isHydrated || isLoading || isFullyAuthenticated) return
    
    const oauthCompleted = localStorage.getItem('oauth_completed')
    const isRecentlyAuthenticated = oauthCompleted && (Date.now() - parseInt(oauthCompleted) < 10000)
    
    if (!isRecentlyAuthenticated) {
      // Immediate redirect for clearly unauthenticated users
      const redirectTimer = setTimeout(() => {
        console.log('Admin page: Not authenticated, redirecting to adminLogin')
        router.push('/adminLogin')
      }, 1000) // Short delay to avoid race conditions
      
      return () => clearTimeout(redirectTimer)
    }
  }, [isFullyAuthenticated, isLoading, router, isHydrated])

  // Show loading screen during authentication check or OAuth processing
  if (!isHydrated || isLoading || isProcessingOAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">
            {!isHydrated ? 'Loading application...' : 
             isProcessingOAuth ? 'Completing authentication...' : 
             'Verifying authentication...'}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {isProcessingOAuth ? 
              'Please wait while we finalize your login' : 
              'Please wait while we validate your credentials'}
          </p>
        </div>
      </div>
    )
  }

  // Show loading if not authenticated but recently completed OAuth
  if (!isFullyAuthenticated) {
    const oauthCompleted = localStorage.getItem('oauth_completed')
    const isRecentlyAuthenticated = oauthCompleted && (Date.now() - parseInt(oauthCompleted) < 10000)
    
    if (isRecentlyAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Finalizing authentication...</p>
            <p className="text-sm text-slate-500 mt-2">
              Almost there! Setting up your session
            </p>
          </div>
        </div>
      )
    }
    
    // Show loading while redirecting
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const handleWalletDisconnect = async () => {
    try {
      console.log('Admin: Starting complete logout process...')
      
      // Clear saved authentication state immediately
      localStorage.removeItem('adminAuthState')
      localStorage.removeItem('adminAuthStateTime')
      localStorage.removeItem('oauth_completed')
      
      // First disconnect the wallet to avoid any conflicts
      try {
        await disconnect()
        console.log('Admin: Wallet disconnected successfully')
      } catch (error) {
        console.warn('Admin: Wallet disconnect failed, but continuing logout:', error)
      }
      
      // Call our comprehensive logout endpoint
      console.log('Admin: Calling logout API endpoint...')
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (logoutResponse.ok) {
        const logoutResult = await logoutResponse.json()
        console.log('Admin: Logout endpoint response:', logoutResult)
        
        if (logoutResult.redirectUrl) {
          console.log('Admin: Redirecting to Asgardeo logout:', logoutResult.redirectUrl)
          // Add a small delay to ensure local cleanup is complete
          setTimeout(() => {
            window.location.href = logoutResult.redirectUrl
          }, 100)
          return
        } else {
          console.log('Admin: No redirect URL provided, using fallback')
        }
      } else {
        const errorText = await logoutResponse.text()
        console.warn('Admin: Logout endpoint failed:', logoutResponse.status, errorText)
      }
      
      // Fallback: direct redirect to logout route
      console.log('Admin: Using fallback logout redirect')
      window.location.href = '/api/auth/logout'
      
    } catch (error) {
      console.error("Admin: Complete logout failed:", error)
      
      // Emergency cleanup and redirect
      localStorage.removeItem('adminAuthState')
      localStorage.removeItem('adminAuthStateTime')
      localStorage.removeItem('oauth_completed')
      
      // Try emergency wallet disconnect
      try {
        await disconnect()
      } catch (e) {
        console.error("Admin: Emergency wallet disconnect failed:", e)
      }
      
      // Force redirect to logout route as last resort
      window.location.href = '/api/auth/logout'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img
                src="/images/sri-lanka-emblem.png"
                alt="Sri Lanka National Emblem"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Admin Portal</h1>
                <p className="text-slate-600">Sri Lanka Transparent Governance Platform - Administrative Control</p>
              </div>
            </div>
            
            {/* User Info & Controls */}
            <div className="flex items-center gap-4">
              {/* Welcome Message */}
              {asgardeoUser && (
                <div className="text-right">
                  <p className="text-sm text-slate-600">Welcome back,</p>
                  <p className="font-semibold text-slate-900">
                    {asgardeoUser.given_name || 'Administrator'}
                  </p>
                </div>
              )}

              {/* Wallet Connection Section */}
              {isConnected && address && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border shadow-sm">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <Badge variant={verified ? "default" : "secondary"} className="text-xs">
                      {verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleWalletDisconnect}
                className="flex items-center gap-2 bg-black text-white hover:bg-black/90 rounded-full"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Connection Status Alert */}
          {!isConnected && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  Connect your wallet to access all admin features and blockchain interactions.
                </span>
                <div className="ml-auto">
                  <ConnectButton />
                </div>
              </div>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="proposals" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Proposals
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="petitions" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Petitions
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="db-sync" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Sync
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectManagement />
          </TabsContent>

          <TabsContent value="proposals">
            <ProposalManagement />
          </TabsContent>

          <TabsContent value="policies">
            <PolicyManagement />
          </TabsContent>

          <TabsContent value="petitions">
            <PetitionManagement />
          </TabsContent>

          <TabsContent value="reports">
            <ReportManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserAnalytics />
          </TabsContent>

          <TabsContent value="db-sync">
            <DbSync />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
