'use client'
import { useDisconnect, useAppKit, useAppKitNetwork  } from '@reown/appkit/react'
import { networks } from './config'

export const ActionButtonList = () => {
    const { disconnect } = useDisconnect();
    const { open } = useAppKit();
    const { switchNetwork } = useAppKitNetwork();

    const handleDisconnect = async () => {
      try {
        await disconnect();
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    }
  return (
    <div className="flex gap-2">
        <button 
          onClick={() => open()}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/90 transition-colors"
        >
          Open
        </button>
        <button 
          onClick={handleDisconnect}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/90 transition-colors"
        >
          Disconnect
        </button>
        <button 
          onClick={() => switchNetwork(networks[1])}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/90 transition-colors"
        >
          Switch
        </button>
    </div>
  )
}