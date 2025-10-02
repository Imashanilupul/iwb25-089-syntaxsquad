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

  // OAuth callback handler
  const handleOAuthCallback = async (code: string, state: string) => {
    if (isProcessingOAuth) return
    try {
      setIsProcessingOAuth(true)
      const response = await fetch('/api/auth/token-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state, redirect_uri: `${window.location.origin}/admin` })
      })
      if (!response.ok) throw new Error('Token exchange failed')
      const result = await response.json()
      if (result.success) {
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, document.title, url.toString())
        localStorage.setItem('oauth_completed', Date.now().toString())
        toast({ title: "Authentication Successful! 🎉", description: "Welcome to the admin portal." })
      } else throw new Error(result.error || 'Authentication failed')
    } catch (error) {
      console.error(error)
      toast({ title: "Authentication Failed", description: "Please try logging in again.", variant: "destructive" })
      router.push('/adminLogin')
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
    if (code && state) handleOAuthCallback(code, state)
    if (error) { window.history.replaceState({}, document.title, window.location.pathname); router.push('/adminLogin') }
  }, [isHydrated])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isHydrated || isLoading) return
    const oauthCompleted = localStorage.getItem('oauth_completed')
    const isRecentlyAuthenticated = oauthCompleted && (Date.now() - parseInt(oauthCompleted) < 10000)
    if (!isFullyAuthenticated && !isRecentlyAuthenticated) setTimeout(() => { if (!isFullyAuthenticated) router.push('/adminLogin') }, 3000)
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
      <div className="container mx-auto p-4 sm:p-6">

        {/* Header */}

        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Portal</h1>
              <p className="text-lg text-slate-600">Sri Lanka Transparent Governance Platform - Administrative Control</p>
            </div>

            {/* Modern Right Corner User Info */}
            <div className="flex flex-col items-end gap-4">
              {asgardeoUser && (
                <div className="text-right">
                  <p className="text-sm text-slate-500">Welcome back,</p>
                  <p className="text-lg font-semibold text-slate-900">{asgardeoUser.given_name || 'Administrator'}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                {isConnected && address && (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-mono text-slate-700">{address.slice(0,6)}...{address.slice(-4)}</span>
                    </div>
                    <Badge variant={verified ? "default" : "secondary"} className={`text-xs ${verified ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                      {verified ? "✓ Verified" : "Unverified"}
                    </Badge>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleWalletDisconnect} 
                  className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-700 hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 hover:border-red-300 transition-all duration-200 rounded-xl px-4 py-2.5"
                >
                  <Wallet className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connect Alert */}
        {!isConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800 flex-1">Connect your wallet to access all admin features.</span>
            <ConnectButton />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-nowrap w-full gap-2 scrollbar-none py-2 px-1 lg:grid lg:grid-cols-9 lg:w-fit">
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
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 whitespace-nowrap px-3 py-2">
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
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
