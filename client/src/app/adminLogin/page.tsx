"use client"

import { AdminWelcome } from "@/components/admin/admin-welcome"
import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function AdminLoginPage() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Check if user was redirected after session clearing
    const cleared = searchParams?.get('cleared')
    const error = searchParams?.get('error')
    const logout = searchParams?.get('logout')
    
    if (cleared === 'true') {
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
