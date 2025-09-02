"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAppKitAccount } from "@reown/appkit/react"
import {
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react"

// Types
interface SyncResult {
  contractType: string
  totalItems: number
  newItems: number
  updatedItems: number
  errors: number
  removedItems: number
  lastBlockScanned: number
  status: "pending" | "completed" | "error"
}

interface DbStats {
  petitions: number
  proposals: number
  reports: number
  policies: number
  projects: number
}

interface BlockRange {
  from: number
  to: number
  total: number
  timeRange: string
}

export function DbSync() {
  const { toast } = useToast()
  const { isConnected, address } = useAppKitAccount()

  // Environment variables
  const BALLERINA_BASE_URL = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080';

  // State
  const [isFullSync, setIsFullSync] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [currentSyncStep, setCurrentSyncStep] = useState("")
  const [syncResults, setSyncResults] = useState<SyncResult[]>([])
  const [dbStats, setDbStats] = useState<DbStats>({
    petitions: 0,
    proposals: 0,
    reports: 0,
    policies: 0,
    projects: 0,
  })
  const [blockRange, setBlockRange] = useState<BlockRange | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<"idle" | "running" | "completed" | "error">("idle")
  const [syncError, setSyncError] = useState<string | null>(null)

  // Helper function to calculate time range for blocks
  const calculateTimeRange = (blockCount: number): string => {
    // Ethereum block time is ~12 seconds on average
    const totalSeconds = blockCount * 12
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days} day${days > 1 ? "s" : ""} ${remainingHours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`
    }
  }

  useEffect(() => {
    loadDbStats()
    loadLastSyncTime()
    loadSyncResults()
  }, [])

  const loadSyncResults = () => {
    // Load persisted sync results from localStorage
    const savedResults = localStorage.getItem("syncResults")
    const savedStatus = localStorage.getItem("syncStatus")
    const savedBlockRange = localStorage.getItem("blockRange")
    const savedError = localStorage.getItem("syncError")

    if (savedResults) {
      try {
        setSyncResults(JSON.parse(savedResults))
      } catch (error) {
        console.error("Failed to load sync results:", error)
      }
    }

    if (savedStatus) {
      setSyncStatus(savedStatus as any)
    }

    if (savedBlockRange) {
      try {
        setBlockRange(JSON.parse(savedBlockRange))
      } catch (error) {
        console.error("Failed to load block range:", error)
      }
    }

    if (savedError) {
      setSyncError(savedError)
    }
  }

  const saveSyncData = (
    results: SyncResult[],
    status: string,
    blockRangeData: BlockRange | null,
    error: string | null
  ) => {
    // Persist sync data to localStorage
    localStorage.setItem("syncResults", JSON.stringify(results))
    localStorage.setItem("syncStatus", status)
    if (blockRangeData) {
      localStorage.setItem("blockRange", JSON.stringify(blockRangeData))
    }
    if (error) {
      localStorage.setItem("syncError", error)
    } else {
      localStorage.removeItem("syncError")
    }
  }

  const loadDbStats = async () => {
    try {
      // Load current DB stats from each service
      const [petitionsRes, proposalsRes, reportsRes, policiesRes, projectsRes] = await Promise.all([
        fetch(`${BALLERINA_BASE_URL}/api/petitions`)
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
        fetch(`${BALLERINA_BASE_URL}/api/proposals`)
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
        fetch(`${BALLERINA_BASE_URL}/api/reports`)
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
        fetch(`${BALLERINA_BASE_URL}/api/policies`)
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
        fetch(`${BALLERINA_BASE_URL}/api/projects`)
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
      ])

      setDbStats({
        petitions: Array.isArray(petitionsRes.data) ? petitionsRes.data.length : 0,
        proposals: Array.isArray(proposalsRes.data) ? proposalsRes.data.length : 0,
        reports: Array.isArray(reportsRes.data) ? reportsRes.data.length : 0,
        policies: Array.isArray(policiesRes.data) ? policiesRes.data.length : 0,
        projects: Array.isArray(projectsRes.data) ? projectsRes.data.length : 0,
      })
    } catch (error) {
      console.error("Failed to load DB stats:", error)
    }
  }

  const loadLastSyncTime = () => {
    const lastSync = localStorage.getItem("lastDbSync")
    if (lastSync) {
      setLastSyncTime(new Date(lastSync))
    }
  }

  // ...existing code...
  const syncFromBlockchain = async (blocksToScan = 1000, isFullSync = false) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to perform blockchain sync.",
        variant: "destructive",
      })
      return
    }

    setIsFullSync(true)
    setSyncProgress(0)
    setSyncStatus("running")
    setSyncError(null)
    setCurrentSyncStep("Starting blockchain sync...")
    setSyncResults([])

    try {
      setCurrentSyncStep("Creating blockchain sync job...")
      setSyncProgress(10)

      // Start the comprehensive sync job on Node backend
      const syncJobResponse = await fetch(`${BALLERINA_BASE_URL}/api/blockchain/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocksBack: isFullSync ? 999999 : blocksToScan,
          isFullSync: isFullSync,
        }),
      })

      if (!syncJobResponse.ok) {
        throw new Error(`Failed to start sync job: ${syncJobResponse.statusText}`)
      }

      const jobData = await syncJobResponse.json()
      const jobId = jobData.jobId

      if (!jobId) {
        throw new Error("No job ID received from server")
      }

      setCurrentSyncStep(`Job started with ID: ${jobId}`)
      setSyncProgress(20)

      // Poll job status
      const pollJobStatus = async () => {
        try {
          const statusResponse = await fetch(
            `${BALLERINA_BASE_URL}/api/blockchain/sync/status/${jobId}`
          )
          if (!statusResponse.ok) {
            throw new Error(`Failed to get job status: ${statusResponse.statusText}`)
          }
          const statusData = await statusResponse.json()
          const job = statusData.job

          setSyncProgress(Math.max(20, job.progress || 0))
          setCurrentSyncStep(job.message || `Job ${job.status}...`)

          if (job.status === "completed") {
            setCurrentSyncStep("Job completed! Processing results...")
            setSyncProgress(95)

            const resultResponse = await fetch(
              `${BALLERINA_BASE_URL}/api/blockchain/sync/result/${jobId}`
            )
            if (!resultResponse.ok) {
              throw new Error(`Failed to get job result: ${resultResponse.statusText}`)
            }
            const resultData = await resultResponse.json()
            const blockchainData = resultData.result

            // Parse the new result format from blockchain-sync.js
            if (blockchainData && blockchainData.details) {
              const details = blockchainData.details
              const syncResults: SyncResult[] = details.map((entity: any) => {
                if (entity.result) {
                  // Special handling for users sync result
                  if (entity.type === "users") {
                    return {
                      contractType: "Users",
                      totalItems: 0,
                      newItems: 0,
                      updatedItems: 0,
                      errors: Array.isArray(entity.result.errors) ? entity.result.errors.length : 0,
                      removedItems: entity.result.removed || 0,
                      lastBlockScanned: blockchainData.toBlock || 0,
                      status: "completed",
                    }
                  }
                  return {
                    contractType: entity.type.charAt(0).toUpperCase() + entity.type.slice(1),
                    totalItems:
                      (entity.result.results.new || 0) + (entity.result.results.updated || 0),
                    newItems: entity.result.results.new || 0,
                    updatedItems: entity.result.results.updated || 0,
                    errors: Array.isArray(entity.result.results.errors)
                      ? entity.result.results.errors.length
                      : 0,
                    removedItems: entity.result.results.removed || 0,
                    lastBlockScanned: blockchainData.toBlock || 0,
                    status: "completed",
                  }
                } else {
                  return {
                    contractType: entity.type.charAt(0).toUpperCase() + entity.type.slice(1),
                    totalItems: 0,
                    newItems: 0,
                    updatedItems: 0,
                    errors: 1,
                    removedItems: 0,
                    lastBlockScanned: blockchainData.toBlock || 0,
                    status: "error",
                  }
                }
              })

              setSyncResults(syncResults)
              setSyncProgress(100)
              setSyncStatus("completed")
              setCurrentSyncStep("Blockchain sync completed successfully!")

              // Block range info
              let blockRangeData: BlockRange | null = null
              if (blockchainData.fromBlock && blockchainData.toBlock) {
                const totalBlocks = blockchainData.toBlock - blockchainData.fromBlock
                const timeRange = calculateTimeRange(totalBlocks)
                blockRangeData = {
                  from: blockchainData.fromBlock,
                  to: blockchainData.toBlock,
                  total: totalBlocks,
                  timeRange,
                }
                setBlockRange(blockRangeData)
              }

              saveSyncData(syncResults, "completed", blockRangeData, null)
              localStorage.setItem("lastDbSync", new Date().toISOString())
              setLastSyncTime(new Date())
              await loadDbStats()

              const totalNewItems = syncResults.reduce((sum, r) => sum + r.newItems, 0)
              const totalUpdatedItems = syncResults.reduce((sum, r) => sum + r.updatedItems, 0)
              const totalRemovedItems = syncResults.reduce((sum, r) => sum + r.removedItems, 0)

              toast({
                title: "Sync Completed",
                description: `Successfully synced blockchain data. ${totalNewItems} new, ${totalUpdatedItems} updated, ${totalRemovedItems} removed.`,
                variant: "default",
              })
            } else {
              setSyncStatus("error")
              setSyncError("Unexpected result format from sync job")
              saveSyncData([], "error", null, "Unexpected result format")
            }
            return
          } else if (job.status === "failed") {
            throw new Error(`Job failed: ${job.error || "Unknown error"}`)
          }

          if (job.status === "running" || job.status === "pending") {
            setTimeout(pollJobStatus, 2000)
          }
        } catch (error) {
          setSyncStatus("error")

          let errorMessage = "Unknown error"
          if (error instanceof Error) {
            errorMessage = error.message
          }

          setSyncError(errorMessage)
          saveSyncData([], "error", null, errorMessage)
          toast({
            title: "Sync Failed",
            description: `Blockchain sync failed: ${errorMessage}`,
            variant: "destructive",
          })
        }
      }

      setTimeout(pollJobStatus, 1000)
    } catch (error: any) {
      setSyncStatus("error")
      setSyncError(error.message || "Unknown error")
      setSyncResults((prev) =>
        prev.map((result) => ({ ...result, status: "error" as const, errors: 1 }))
      )
      saveSyncData([], "error", null, error.message || "Unknown error")
      toast({
        title: "Sync Failed",
        description: `Blockchain sync failed: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsFullSync(false)
      setSyncProgress(0)
      setCurrentSyncStep("")
    }
  }

  const clearSyncData = () => {
    setSyncResults([])
    setSyncStatus("idle")
    setSyncError(null)
    setBlockRange(null)
    localStorage.removeItem("syncResults")
    localStorage.removeItem("syncStatus")
    localStorage.removeItem("blockRange")
    localStorage.removeItem("syncError")
    toast({
      title: "Sync Data Cleared",
      description: "All sync results have been cleared.",
      variant: "default",
    })
  }

  const getTotalItems = () => {
    return Object.values(dbStats).reduce((sum, count) => sum + count, 0)
  }

  const getSyncStatusIcon = (status: SyncResult["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Blockchain Synchronization
          </CardTitle>
          <CardDescription>
            Sync your database with the latest blockchain data to ensure data integrity and
            consistency.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Database Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.petitions}</div>
                <div className="text-muted-foreground text-xs">Petitions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.proposals}</div>
                <div className="text-muted-foreground text-xs">Proposals</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.reports}</div>
                <div className="text-muted-foreground text-xs">Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.policies}</div>
                <div className="text-muted-foreground text-xs">Policies</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.projects}</div>
                <div className="text-muted-foreground text-xs">Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">{getTotalItems()}</div>
                <div className="text-muted-foreground text-xs">Total Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Blockchain Synchronization</span>
            {syncStatus === "completed" && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Last Sync Completed
              </Badge>
            )}
            {syncStatus === "error" && (
              <Badge variant="destructive">
                <XCircle className="mr-1 h-3 w-3" />
                Last Sync Failed
              </Badge>
            )}
            {syncStatus === "running" && (
              <Badge className="bg-blue-100 text-blue-800">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Sync in Progress
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sync your database with blockchain data. Choose partial sync for recent changes or full
            sync for complete synchronization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to perform blockchain sync operations.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => syncFromBlockchain(1000, false)}
                disabled={isFullSync || syncStatus === "running"}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isFullSync ? "animate-spin" : ""}`} />
                Partial Sync (Last 1000 blocks)
              </Button>
              <Button
                onClick={() => syncFromBlockchain(0, true)}
                disabled={isFullSync || syncStatus === "running"}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isFullSync ? "animate-spin" : ""}`} />
                Full Sync (All blocks)
              </Button>
              {(syncResults.length > 0 || syncStatus !== "idle") && (
                <Button
                  onClick={clearSyncData}
                  disabled={isFullSync || syncStatus === "running"}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Clear Results
                </Button>
              )}
            </div>
          )}

          {lastSyncTime && (
            <div className="text-muted-foreground text-sm">
              Last sync: {lastSyncTime.toLocaleString()}
            </div>
          )}

          {syncError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Sync error: {syncError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sync Progress */}
      {(isFullSync || syncStatus === "running") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Sync in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Progress</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="w-full" />
            </div>

            {currentSyncStep && (
              <div className="text-sm">
                <span className="font-medium">Status:</span> {currentSyncStep}
              </div>
            )}

            {blockRange && (
              <div className="text-muted-foreground text-sm">
                Scanning blocks {blockRange.from.toLocaleString()} to{" "}
                {blockRange.to.toLocaleString()}({blockRange.total.toLocaleString()} blocks, ~
                {blockRange.timeRange})
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {syncStatus === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
              {syncStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
              Sync Results
            </CardTitle>
            {blockRange && (
              <CardDescription>
                Scanned {blockRange.total.toLocaleString()} blocks (#
                {blockRange.from.toLocaleString()} to #{blockRange.to.toLocaleString()}) covering
                approximately {blockRange.timeRange}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-card flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {getSyncStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.contractType}</div>
                      <div className="text-muted-foreground text-sm">
                        Block #{result.lastBlockScanned.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.newItems > 0 && (
                      <Badge
                        variant="default"
                        className="border-green-200 bg-green-100 text-green-800"
                      >
                        +{result.newItems} new
                      </Badge>
                    )}
                    {result.updatedItems > 0 && (
                      <Badge
                        variant="default"
                        className="border-blue-200 bg-blue-100 text-blue-800"
                      >
                        {result.updatedItems} updated
                      </Badge>
                    )}
                    {result.removedItems > 0 && (
                      <Badge
                        variant="default"
                        className="border-orange-200 bg-orange-100 text-orange-800"
                      >
                        {result.removedItems} removed
                      </Badge>
                    )}
                    {result.errors > 0 && (
                      <Badge variant="destructive">{result.errors} errors</Badge>
                    )}
                    {result.newItems === 0 &&
                      result.updatedItems === 0 &&
                      result.removedItems === 0 &&
                      result.errors === 0 && <Badge variant="secondary">No changes</Badge>}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-muted mt-4 rounded-lg p-3">
              <div className="mb-2 text-sm font-medium">Summary</div>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <div className="font-semibold text-green-600">
                    {syncResults.reduce((sum, r) => sum + r.newItems, 0)}
                  </div>
                  <div className="text-muted-foreground">New Items</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600">
                    {syncResults.reduce((sum, r) => sum + r.updatedItems, 0)}
                  </div>
                  <div className="text-muted-foreground">Updated</div>
                </div>
                <div>
                  <div className="font-semibold text-orange-600">
                    {syncResults.reduce((sum, r) => sum + r.removedItems, 0)}
                  </div>
                  <div className="text-muted-foreground">Removed</div>
                </div>
                <div>
                  <div className="font-semibold text-red-600">
                    {syncResults.reduce((sum, r) => sum + r.errors, 0)}
                  </div>
                  <div className="text-muted-foreground">Errors</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
