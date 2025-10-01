"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConnectButton } from "@/components/walletConnect/wallet-connect"
import { useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"
import { debugAuthenticationData, forceCleanupAuthData, getSessionStatus } from "@/utils/session-debug"
import { Wallet, Shield, CheckCircle, ArrowRight, Loader2, XCircle } from "lucide-react"
import Image from "next/image"

export function AdminWelcome() {
  const router = useRouter()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const { verified, asgardeoUser, isFullyAuthenticated } = useAuth()
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  // Handle verification success and redirect
  useEffect(() => {
    if (isConnected && verified && !asgardeoUser) {
      // Wallet is connected and verified, but no Asgardeo session
      setShowSuccessAnimation(true)
      
      // Show success notification
      toast({
        title: "🎉 Wallet Verified Successfully!",
        description: "You can now proceed to Asgardeo authentication.",
      })
    } else if (isFullyAuthenticated) {
      // Both wallet and Asgardeo authenticated - redirect to admin portal
      console.debug('AdminWelcome: User is fully authenticated, redirecting to admin portal');
      toast({
        title: "🚀 Authentication Complete!",
        description: "Redirecting to admin portal...",
      })
      
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    } else if (asgardeoUser && !isConnected) {
      // User has Asgardeo session but no wallet connected - sign out from Asgardeo
      console.debug('AdminWelcome: Asgardeo session found but no wallet connected, signing out');
      toast({
        title: "Session Cleared",
        description: "Please connect your wallet to continue.",
      })
      window.location.href = '/api/auth/signout'
    }
  }, [isConnected, verified, asgardeoUser, isFullyAuthenticated, router])

  // Handle wallet disconnection and clear Asgardeo session
  const handleDisconnectWallet = async () => {
    try {
      // Show loading state
      toast({
        title: "Disconnecting...",
        description: "Clearing wallet connection and session data...",
      })
      
      // Step 1: Clear saved authentication state
      localStorage.removeItem('adminAuthState')
      localStorage.removeItem('adminAuthStateTime')
      
      // Step 2: Clear Asgardeo session data first (including id_token, access_token)
      const sessionCleared = await clearAsgardeoSession()
      
      // Step 3: Disconnect wallet
      await disconnect()
      
      // Step 4: Show success message
      if (sessionCleared) {
        toast({
          title: "Session Cleared Successfully",
          description: "Wallet disconnected and all authentication data cleared.",
        })
      } else {
        toast({
          title: "Wallet Disconnected",
          description: "Wallet disconnected. Some session data may need manual clearing.",
          variant: "destructive"
        })
      }
      
      // Step 5: Redirect to admin login page after clearing session
      setTimeout(() => {
        window.location.href = '/adminLogin?cleared=true&timestamp=' + Date.now()
      }, 1500)
      
    } catch (error) {
                console.debug("Failed to disconnect wallet and clear session:", error)
      // Clear saved state even on error
      localStorage.removeItem('adminAuthState')
      localStorage.removeItem('adminAuthStateTime')
      
      toast({
        title: "Error",
        description: "Failed to disconnect wallet properly. Please refresh the page.",
        variant: "destructive"
      })
      
      // Fallback: try to redirect anyway after a delay
      setTimeout(() => {
        window.location.href = '/adminLogin?error=disconnect_failed'
      }, 2000)
    }
  }

  // Function to clear Asgardeo session data
  const clearAsgardeoSession = async () => {
    try {
      // Show debug info before clearing
  console.debug('🔍 Session data before clearing:', debugAuthenticationData())
      
      // Step 1: Call server-side session clearing endpoint
      const response = await fetch('/api/auth/clear-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.warn('Server session clear failed, proceeding with client-side cleanup')
      }
      
      // Step 2: Force cleanup all client-side authentication data
      forceCleanupAuthData()
      
      // Step 3: Verify the cleanup was successful
      const sessionStatus = getSessionStatus()
    console.debug('📊 Session status after clearing:', sessionStatus)
      
      if (sessionStatus.isCleared) {
    console.debug('✅ All Asgardeo session data and tokens cleared successfully')
        return true
      } else {
        console.warn(`⚠️ ${sessionStatus.remainingAuthItems} authentication items still found:`, sessionStatus.details)
        return false
      }
      
    } catch (error) {
      console.error('❌ Failed to clear Asgardeo session:', error)
      
      // Fallback: try force cleanup anyway
      try {
        forceCleanupAuthData()
        return true
      } catch (fallbackError) {
        console.error('❌ Fallback cleanup also failed:', fallbackError)
        return false
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="relative">
                <Image
                  src="/images/sri-lanka-emblem.png"
                  alt="Sri Lanka National Emblem"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Welcome to the
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mb-6">
              Sri Lanka Transparent Governance Platform
            </h2>
            <h3 className="text-2xl md:text-3xl font-semibold text-slate-700 mb-8">
              Admin Portal
            </h3>
            
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Secure administrative access to manage government projects, proposals, and policies. 
              Connect your verified wallet to access the administrative dashboard.
            </p>
          </div>

          {/* Main Content Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12">
              
              {/* Wallet Connection Status */}
              <div className="space-y-6">
                
                {/* Step 1: Wallet Connection */}
                <div className="flex items-start gap-4 p-6 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isConnected ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isConnected ? <CheckCircle className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Step 1: Connect Your Wallet
                    </h3>
                    
                    {!isConnected ? (
                      <div className="space-y-4">
                        <p className="text-slate-600">
                          Connect your wallet to begin the authentication process.
                        </p>
                        <div className="flex items-center gap-4">
                          <ConnectButton />
                          <Badge variant="outline" className="text-slate-500">
                            Wallet not connected
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-green-700 font-medium">
                          ✅ Wallet Connected Successfully
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Wallet Verification */}
                <div className={`flex items-start gap-4 p-6 rounded-lg border-2 transition-all duration-300 ${
                  isConnected 
                    ? verified 
                      ? 'border-green-200 bg-green-50/50' 
                      : 'border-red-200 bg-red-50/50'
                    : 'border-dashed border-slate-200 bg-slate-50/50'
                }`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    !isConnected 
                      ? 'bg-slate-100 text-slate-400' 
                      : verified 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                  }`}>
                    {!isConnected ? (
                      <Shield className="w-5 h-5" />
                    ) : verified ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Shield className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Step 2: Wallet Verification
                    </h3>
                    
                    {!isConnected ? (
                      <p className="text-slate-500">
                        Connect your wallet first to check verification status.
                      </p>
                    ) : verified ? (
                      <div className="space-y-2">
                        <p className="text-green-700 font-medium">
                          ✅ Wallet Verified for Admin Access
                        </p>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Authorized Administrator
                        </Badge>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-red-700 font-medium">
                          ❌ Wallet Not Authorized
                        </p>
                        <p className="text-sm text-red-600">
                          Your wallet address is not authorized for admin access. 
                          Please contact a system administrator for authorization.
                        </p>
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive">
                            Unauthorized Access
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleDisconnectWallet}
                            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Disconnect Wallet
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Registration/Authentication */}
                <div className={`flex items-start gap-4 p-6 rounded-lg border-2 transition-all duration-300 ${
                  isConnected && verified
                    ? asgardeoUser 
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-blue-200 bg-blue-50/50'
                    : 'border-dashed border-slate-200 bg-slate-50/50'
                }`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    !isConnected || !verified
                      ? 'bg-slate-100 text-slate-400' 
                      : asgardeoUser
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                  }`}>
                    {!isConnected || !verified ? (
                      <ArrowRight className="w-5 h-5" />
                    ) : asgardeoUser ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <ArrowRight className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Step 3: Complete Asgardeo Authentication
                    </h3>
                    
                    {!isConnected || !verified ? (
                      <p className="text-slate-500">
                        Complete wallet verification to proceed with Asgardeo authentication.
                      </p>
                    ) : asgardeoUser ? (
                      <div className="space-y-2">
                        <p className="text-green-700 font-medium">
                          ✅ Authentication Complete
                        </p>
                        <p className="text-sm text-green-600">
                          Welcome back, {asgardeoUser.given_name || 'Administrator'}!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-blue-700 font-medium">
                          🎉 Wallet verification successful!
                        </p>
                        <p className="text-sm text-blue-600">
                          Click the button below to proceed with Asgardeo authentication and access the admin portal.
                        </p>
                        <Button 
                          onClick={() => window.location.href = '/api/auth/signin'} 
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Continue to Asgardeo Authentication
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Success Animation */}
                {showSuccessAnimation && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 animate-bounce">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      Verification Successful! 🎉
                    </h3>
                    <p className="text-green-700">
                      Your wallet has been verified. Redirecting to complete authentication...
                    </p>
                  </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-12 text-sm text-slate-500">
            <p>
              Secure access to Sri Lanka's digital governance infrastructure. 
              For technical support, contact the system administrator.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
