'use client'

import React, { useState, useEffect } from 'react'
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
  Zap
} from 'lucide-react'

// Types
interface SyncResult {
  contractType: string
  totalItems: number
  newItems: number
  updatedItems: number
  errors: number
  removedItems: number
  lastBlockScanned: number
  status: 'pending' | 'completed' | 'error'
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
  
  // State
  const [isFullSync, setIsFullSync] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [currentSyncStep, setCurrentSyncStep] = useState('')
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

  // Helper function to calculate time range for blocks
  const calculateTimeRange = (blockCount: number): string => {
    // Ethereum block time is ~12 seconds on average
    const totalSeconds = blockCount * 12
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days} day${days > 1 ? 's' : ''} ${remainingHours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`
    }
  }

  useEffect(() => {
    loadDbStats()
    loadLastSyncTime()
  }, [])

  const loadDbStats = async () => {
    try {
      // Load current DB stats from each service
      const [petitionsRes, proposalsRes, reportsRes, policiesRes, projectsRes] = await Promise.all([
        fetch('http://localhost:8080/api/petitions').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:8080/api/proposals').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:8080/api/reports').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:8080/api/policies').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:8080/api/projects').then(r => r.json()).catch(() => ({ data: [] }))
      ])

      setDbStats({
        petitions: Array.isArray(petitionsRes.data) ? petitionsRes.data.length : 0,
        proposals: Array.isArray(proposalsRes.data) ? proposalsRes.data.length : 0,
        reports: Array.isArray(reportsRes.data) ? reportsRes.data.length : 0,
        policies: Array.isArray(policiesRes.data) ? policiesRes.data.length : 0,
        projects: Array.isArray(projectsRes.data) ? projectsRes.data.length : 0,
      })
    } catch (error) {
      console.error('Failed to load DB stats:', error)
    }
  }

  const loadLastSyncTime = () => {
    const lastSync = localStorage.getItem('lastDbSync')
    if (lastSync) {
      setLastSyncTime(new Date(lastSync))
    }
  }

  const syncFromBlockchain = async (blocksToScan = 1000, isFullSync = false) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to perform blockchain sync.",
        variant: "destructive"
      })
      return
    }

    setIsFullSync(true)
    setSyncProgress(0)
    setCurrentSyncStep('Initializing blockchain sync...')
    
    try {
      // Initialize ethers and get current block
      const ethers = await import("ethers")
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      
      // Verify network connection
      const network = await provider.getNetwork()
      console.log(`🌐 Connected to: ${network.name} (chainId: ${network.chainId})`)
      
      // Check if we're on the right network (Sepolia = chainId 11155111)
      if (Number(network.chainId) !== 11155111) {
        console.log(`❌ Wrong network detected: ${network.name} (chainId: ${network.chainId})`);
        
        // Check if MetaMask is available
        if (!window.ethereum || !(window.ethereum as any).request) {
          throw new Error(`Please switch to Sepolia testnet manually. Currently connected to ${network.name} (chainId: ${network.chainId}).`);
        }
        
        // Try to automatically switch to Sepolia
        try {
          console.log('🔄 Attempting to switch to Sepolia testnet...');
          
          // Request network switch to Sepolia
          await (window.ethereum as any).request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
          });
          
          // Wait a bit for network switch to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify the switch worked
          const newNetwork = await provider.getNetwork();
          if (Number(newNetwork.chainId) !== 11155111) {
            throw new Error('Network switch failed');
          }
          
          console.log('✅ Successfully switched to Sepolia testnet');
          
          toast({
            title: "Network Switched",
            description: "Successfully switched to Sepolia testnet",
            variant: "default"
          });
          
        } catch (switchError: any) {
          console.error('❌ Failed to switch network:', switchError);
          
          // If switch fails, try to add Sepolia network
          try {
            console.log('🔄 Attempting to add Sepolia testnet...');
            
            await (window.ethereum as any).request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7', // 11155111 in hex
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia Ether',
                  symbol: 'SEP',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              }],
            });
            
            console.log('✅ Successfully added Sepolia testnet');
            
            toast({
              title: "Network Added",
              description: "Sepolia testnet added to wallet. Please try sync again.",
              variant: "default"
            });
            
          } catch (addError: any) {
            console.error('❌ Failed to add network:', addError);
            
            toast({
              title: "Network Switch Required",
              description: "Please manually switch to Sepolia testnet in your wallet and try again. Current network: " + network.name,
              variant: "destructive"
            });
          }
          
          throw new Error(`Please switch to Sepolia testnet. Currently connected to ${network.name} (chainId: ${network.chainId}). Click 'Add Network' in MetaMask if Sepolia is not available.`);
        }
      }
      
      const currentBlock = await provider.getBlockNumber()
      console.log(`📊 Current block: ${currentBlock}`)
      
      const fromBlock = isFullSync ? 0 : Math.max(0, currentBlock - blocksToScan)
      
      const timeRange = calculateTimeRange(isFullSync ? currentBlock : blocksToScan)
      setBlockRange({
        from: fromBlock,
        to: currentBlock,
        total: isFullSync ? currentBlock : blocksToScan,
        timeRange
      })

      // Initialize sync results
      const initialResults: SyncResult[] = [
        { contractType: 'Petitions', totalItems: 0, newItems: 0, updatedItems: 0, errors: 0, removedItems: 0, lastBlockScanned: fromBlock, status: 'pending' },
        { contractType: 'Proposals', totalItems: 0, newItems: 0, updatedItems: 0, errors: 0, removedItems: 0, lastBlockScanned: fromBlock, status: 'pending' },
        { contractType: 'Reports', totalItems: 0, newItems: 0, updatedItems: 0, errors: 0, removedItems: 0, lastBlockScanned: fromBlock, status: 'pending' },
        { contractType: 'Policies', totalItems: 0, newItems: 0, updatedItems: 0, errors: 0, removedItems: 0, lastBlockScanned: fromBlock, status: 'pending' },
        { contractType: 'Projects', totalItems: 0, newItems: 0, updatedItems: 0, errors: 0, removedItems: 0, lastBlockScanned: fromBlock, status: 'pending' }
      ]
      setSyncResults(initialResults)

      setCurrentSyncStep('Calling Ballerina backend for blockchain sync...')
      setSyncProgress(30)

      // Call Ballerina backend to handle the sync
      const syncResponse = await fetch('http://localhost:8080/api/blockchain/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromBlock,
          toBlock: currentBlock,
          isFullSync
        })
      })

      if (!syncResponse.ok) {
        throw new Error(`Sync failed: ${syncResponse.statusText}`)
      }

      const syncData = await syncResponse.json()
      console.log('🎉 Sync completed:', syncData)

      // Update results based on Ballerina response
      const finalResults: SyncResult[] = [
        { 
          contractType: 'Proposals', 
          totalItems: syncData.results?.proposals?.total || 0, 
          newItems: syncData.results?.proposals?.new || 0, 
          updatedItems: syncData.results?.proposals?.updated || 0, 
          errors: syncData.results?.proposals?.errors?.length || 0, 
          removedItems: syncData.results?.proposals?.removed || 0, 
          lastBlockScanned: currentBlock, 
          status: 'completed' 
        },
        { 
          contractType: 'Petitions', 
          totalItems: syncData.results?.petitions?.total || 0, 
          newItems: syncData.results?.petitions?.new || 0, 
          updatedItems: syncData.results?.petitions?.updated || 0, 
          errors: syncData.results?.petitions?.errors?.length || 0, 
          removedItems: syncData.results?.petitions?.removed || 0, 
          lastBlockScanned: currentBlock, 
          status: 'completed' 
        },
        { 
          contractType: 'Reports', 
          totalItems: syncData.results?.reports?.total || 0, 
          newItems: syncData.results?.reports?.new || 0, 
          updatedItems: syncData.results?.reports?.updated || 0, 
          errors: syncData.results?.reports?.errors?.length || 0, 
          removedItems: syncData.results?.reports?.removed || 0, 
          lastBlockScanned: currentBlock, 
          status: 'completed' 
        },
        { 
          contractType: 'Policies', 
          totalItems: syncData.results?.policies?.total || 0, 
          newItems: syncData.results?.policies?.new || 0, 
          updatedItems: syncData.results?.policies?.updated || 0, 
          errors: syncData.results?.policies?.errors?.length || 0, 
          removedItems: syncData.results?.policies?.removed || 0, 
          lastBlockScanned: currentBlock, 
          status: 'completed' 
        },
        { 
          contractType: 'Projects', 
          totalItems: syncData.results?.projects?.total || 0, 
          newItems: syncData.results?.projects?.new || 0, 
          updatedItems: syncData.results?.projects?.updated || 0, 
          errors: syncData.results?.projects?.errors?.length || 0, 
          removedItems: syncData.results?.projects?.removed || 0, 
          lastBlockScanned: currentBlock, 
          status: 'completed' 
        }
      ]

      setSyncResults(finalResults)
      setSyncProgress(100)
      setCurrentSyncStep('Blockchain sync completed successfully!')

      // Save last sync time
      localStorage.setItem('lastDbSync', new Date().toISOString())
      setLastSyncTime(new Date())

      // Reload stats
      await loadDbStats()

      const totalNewItems = finalResults.reduce((sum, r) => sum + r.newItems, 0)
      const totalUpdatedItems = finalResults.reduce((sum, r) => sum + r.updatedItems, 0)

      toast({
        title: "Sync Completed",
        description: `Successfully synced blockchain data. ${totalNewItems} new items added, ${totalUpdatedItems} items updated.`,
        variant: "default"
      })

    } catch (error: any) {
      console.error('❌ Sync failed:', error)
      
      setSyncResults(prev => prev.map(result => ({
        ...result,
        status: 'error' as const,
        errors: 1
      })))
      
      toast({
        title: "Sync Failed",
        description: `Blockchain sync failed: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setIsFullSync(false)
      setSyncProgress(0)
      setCurrentSyncStep('')
    }
  }

  const getTotalItems = () => {
    return Object.values(dbStats).reduce((sum, count) => sum + count, 0)
  }

  const getSyncStatusIcon = (status: SyncResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Blockchain Synchronization
          </CardTitle>
          <CardDescription>
            Sync your database with the latest blockchain data to ensure data integrity and consistency.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Database Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.petitions}</div>
                <div className="text-xs text-muted-foreground">Petitions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.proposals}</div>
                <div className="text-xs text-muted-foreground">Proposals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.reports}</div>
                <div className="text-xs text-muted-foreground">Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.policies}</div>
                <div className="text-xs text-muted-foreground">Policies</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <div>
                <div className="text-2xl font-bold">{dbStats.projects}</div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">{getTotalItems()}</div>
                <div className="text-xs text-muted-foreground">Total Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Synchronization</CardTitle>
          <CardDescription>
            Sync your database with blockchain data. Choose partial sync for recent changes or full sync for complete synchronization.
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
            <div className="flex gap-4">
              <Button 
                onClick={() => syncFromBlockchain(1000, false)}
                disabled={isFullSync}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isFullSync ? 'animate-spin' : ''}`} />
                Partial Sync (Last 1000 blocks)
              </Button>
              <Button 
                onClick={() => syncFromBlockchain(0, true)}
                disabled={isFullSync}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isFullSync ? 'animate-spin' : ''}`} />
                Full Sync (All blocks)
              </Button>
            </div>
          )}
          
          {lastSyncTime && (
            <div className="text-sm text-muted-foreground">
              Last sync: {lastSyncTime.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Progress */}
      {isFullSync && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Progress value={syncProgress} className="w-full" />
              <div className="text-sm text-muted-foreground mt-2">
                {syncProgress}% complete
              </div>
            </div>
            
            {currentSyncStep && (
              <div className="text-sm">
                Status: {currentSyncStep}
              </div>
            )}
            
            {blockRange && (
              <div className="text-sm text-muted-foreground">
                Scanning blocks {blockRange.from.toLocaleString()} to {blockRange.to.toLocaleString()} 
                ({blockRange.total.toLocaleString()} blocks, ~{blockRange.timeRange})
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getSyncStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.contractType}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.totalItems} total items
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {result.newItems > 0 && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        +{result.newItems} new
                      </Badge>
                    )}
                    {result.updatedItems > 0 && (
                      <Badge variant="secondary">
                        {result.updatedItems} updated
                      </Badge>
                    )}
                    {result.errors > 0 && (
                      <Badge variant="destructive">
                        {result.errors} errors
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
