'use client'

import { useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

export const ConnectButton = () => {
  return (
    <div >
        <appkit-button />
    </div>
  )
}

export const DisconnectButton = ({ 
  variant = "outline", 
  size = "default",
  className = "",
  children 
}: {
  variant?: "outline" | "destructive" | "secondary" | "ghost" | "link" | "default"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}) => {
  const { disconnect } = useDisconnect()
  const { isConnected } = useAppKitAccount()

  if (!isConnected) return null

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleDisconnect}
      className={className}
    >
      {children || (
        <>
          <XCircle className="w-4 h-4 mr-2" />
          Disconnect Wallet
        </>
      )}
    </Button>
  )
}