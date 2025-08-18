"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Activity, Zap } from "lucide-react"

export function BlockchainVisualization() {
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 0,
    transactionsPerSecond: 0,
    networkHealth: 100,
    consensusNodes: 0,
    lastBlockTime: "",
  })

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        // Example using Etherscan API
        const res = await fetch(
          `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${Math.floor(
            Date.now() / 1000
          )}&closest=before&apikey=YOUR_API_KEY`
        )
        const data = await res.json()

        // Example values (you can extend this depending on API used)
        setNetworkStats({
          blockHeight: Number(data.result),
          transactionsPerSecond: Math.floor(Math.random() * 10) + 10, // Placeholder, TPS API differs
          networkHealth: 99.5, // Replace with your logic: uptime %, latency, etc.
          consensusNodes: 5000, // Some APIs provide validator/peer counts
          lastBlockTime: new Date().toLocaleTimeString(),
        })
      } catch (err) {
        console.error("Error fetching blockchain data:", err)
      }
    }

    fetchNetworkData()
    const interval = setInterval(fetchNetworkData, 15000)
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
