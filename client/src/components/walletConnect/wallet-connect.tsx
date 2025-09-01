"use client"

import { useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export const ConnectButton = () => {
  const { address, isConnected } = useAppKitAccount()
  const { isRegisteredUser } = useAuth()

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null

  return (
    <div className="flex flex-col items-end">
      <div>
        <appkit-button />
      </div>

      {isConnected && address && (
        <div className="mt-1 text-right">
          {/* <div className="text-sm text-slate-700">{shortAddr}</div> */}
          {!isRegisteredUser && (
            <div className="text-xs text-red-600">Unregistered wallet</div>
          )}
        </div>
      )}
    </div>
  )
}

export const DisconnectButton = ({ 
  variant = "default", 
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
      className={`bg-black text-white hover:bg-black/90 ${className}`}
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