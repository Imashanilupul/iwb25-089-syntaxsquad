"use client"

import { AdminWelcome } from "@/components/admin/admin-welcome"
import { useEffect, Suspense } from "react"
import { toast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

function AdminLoginContent() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Check if user was redirected after session clearing
    const cleared = searchParams?.get('cleared')
    const error = searchParams?.get('error')
    const logout = searchParams?.get('logout')
    const source = searchParams?.get('source')
    
    if (logout === 'complete' && source === 'asgardeo') {
      toast({
        title: "✅ Successfully Signed Out",
        description: "You have been signed out from Asgardeo. Please re-authenticate to continue.",
      })
    } else if (logout === 'complete') {
      toast({
        title: "✅ Complete Logout Successful",
        description: "All sessions terminated. You must re-authenticate completely with username, password, and wallet.",
      })
    } else if (logout === 'partial') {
      toast({
        title: "⚠️ Partial Logout",
        description: "Local session cleared. If you still see saved login, please clear browser data.",
        variant: "destructive"
      })
    } else if (logout === 'local') {
      toast({
        title: "🔄 Local Session Cleared",
        description: "Local authentication data cleared. Please reconnect your wallet.",
      })
    } else if (cleared === 'true') {
      toast({
        title: "Session Cleared Successfully",
        description: "All authentication data has been cleared. You can now connect a different wallet.",
      })
    } else if (error === 'disconnect_failed') {
      toast({
        title: "Disconnect Warning",
        description: "There was an issue disconnecting properly. Please ensure all data is cleared.",
        variant: "destructive"
      })
    } else if (error === 'logout_failed') {
      toast({
        title: "Logout Error",
        description: "There was an issue during logout. Please clear your browser data if needed.",
        variant: "destructive"
      })
    } else if (logout === 'true') {
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      })
    }
  }, [searchParams])

  return <AdminWelcome />
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}
