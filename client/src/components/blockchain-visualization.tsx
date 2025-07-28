"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Activity, Zap, Shield } from "lucide-react"

export function BlockchainVisualization() {
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 1247856,
    transactionsPerSecond: 847,
    networkHealth: 98.7,
    consensusNodes: 156,
    lastBlockTime: "12 seconds ago",
  })

  const [recentBlocks, setRecentBlocks] = useState([
    {
      height: 1247856,
      hash: "0x1a2b3c4d...",
      transactions: 234,
      timestamp: "12s ago",
      validator: "Node-47",
      status: "confirmed",
    },
    {
      height: 1247855,
      hash: "0x5e6f7g8h...",
      transactions: 189,
      timestamp: "24s ago",
      validator: "Node-23",
      status: "confirmed",
    },
    {
      height: 1247854,
      hash: "0x9i0j1k2l...",
      transactions: 267,
      timestamp: "36s ago",
      validator: "Node-91",
      status: "confirmed",
    },
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStats((prev) => ({
        ...prev,
        blockHeight: prev.blockHeight + 1,
        transactionsPerSecond: Math.floor(Math.random() * 200) + 750,
        networkHealth: Math.random() * 2 + 97,
      }))
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      {/* Network Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Network Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-600">Online</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">TPS</span>
          </div>
          <div className="text-lg font-bold">{networkStats.transactionsPerSecond}</div>
        </div>
      </div>

      {/* Health Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Network Health</span>
          <span className="text-sm font-bold">{networkStats.networkHealth.toFixed(1)}%</span>
        </div>
        <Progress value={networkStats.networkHealth} className="h-2" />
      </div>

  

      {/* Consensus Info */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{networkStats.consensusNodes} consensus nodes</span>
        <span>Last block: {networkStats.lastBlockTime}</span>
      </div>
    </div>
  )
}
