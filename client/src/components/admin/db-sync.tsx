"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Vote,
  AlertCircle,
  Loader2,
  Activity,
  Link,
  Zap,
  BarChart3,
  ExternalLink,
  Search,
  Download
} from "lucide-react"
import { useAppKitAccount } from "@reown/appkit/react"

interface SyncResult {
  contractType: string
  totalItems: number
  newItems: number
  updatedItems: number
  errors: number
  removedItems: number
  lastBlockScanned: number
  status: 'pending' | 'syncing' | 'completed' | 'error'
}

interface ConflictItem {
  type: string
  id: number
  field: string
  dbValue: string
  blockchainValue: string
}

interface RemovedItem {
  type: string
  id: number
  title?: string
  reason: string
}

interface BlockchainData {
  petitions: any[]
  proposals: any[]
  reports: any[]
  policies: any[]
  projects: any[]
}

export function DbSync() {
  const { address, isConnected } = useAppKitAccount()
  const [syncResults, setSyncResults] = useState<SyncResult[]>([])
  const [isFullSync, setIsFullSync] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [currentSyncStep, setCurrentSyncStep] = useState('')
  const [blockRange, setBlockRange] = useState({ from: 0, to: 0, total: 100, timeRange: '' })
  const [blockchainData, setBlockchainData] = useState<BlockchainData>({
    petitions: [],
    proposals: [],
    reports: [],
    policies: [],
    projects: []
  })
  const [dbStats, setDbStats] = useState({
    petitions: 0,
    proposals: 0,
    reports: 0,
    policies: 0,
    projects: 0
  })
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [conflictItems, setConflictItems] = useState<any[]>([])
  const [removedItems, setRemovedItems] = useState<RemovedItem[]>([])

  // Contract addresses on Sepolia
  const CONTRACT_ADDRESSES = {
    AuthRegistry: "0xBCc9a1598d13488CbF10a6CD88e67249A3c459C9",
    Petitions: "0x1577FD3B3E54cFA368F858d542920A0fefBaf807",
    Reports: "0xD8E110E021a9281b8ad7A6Cf93c2b14b3e3B2712",
    Policies: "0x6a957A0D571b3Ed50AFc02Ac62CC061C6c533138",
    Proposals: "0xff40F4C374c1038378c7044720B939a2a0219a2f",
    Project: "0x1770c50E6Bc8bbFB662c7ec45924aE986473b970"
  }

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
    setCurrentSyncStep('Initializing blockchain connection...')
    setConflictItems([])
    setRemovedItems([])
    
    try {
      // Initialize ethers and get current block
      const ethers = await import("ethers")
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      
      const currentBlock = await provider.getBlockNumber()
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

      // Sync each contract type
      await syncPetitions(provider, fromBlock, currentBlock)
      await syncProposals(provider, fromBlock, currentBlock)
      await syncReports(provider, fromBlock, currentBlock)
      await syncPolicies(provider, fromBlock, currentBlock)
      await syncProjects(provider, fromBlock, currentBlock)

      setSyncProgress(100)
      setCurrentSyncStep('Sync completed successfully!')
      
      // Update last sync time
      const now = new Date()
      setLastSyncTime(now)
      localStorage.setItem('lastDbSync', now.toISOString())

      // Reload DB stats
      await loadDbStats()

      toast({
        title: "Sync Completed",
        description: `Successfully synced data from blocks ${fromBlock} to ${currentBlock}`,
      })

    } catch (error: any) {
      console.error('Blockchain sync failed:', error)
      setCurrentSyncStep(`Sync failed: ${error.message}`)
      toast({
        title: "Sync Failed",
        description: error.message || "An error occurred during blockchain sync",
        variant: "destructive"
      })
    } finally {
      setTimeout(() => setIsFullSync(false), 2000)
    }
  }

  const syncPetitions = async (provider: any, fromBlock: number, toBlock: number) => {
    setCurrentSyncStep('Syncing petitions from blockchain...')
    setSyncProgress(20)

    try {
      const ethers = await import("ethers")
      const Petitions = new ethers.Contract(
        CONTRACT_ADDRESSES.Petitions,
        [
          "function petitionCount() external view returns (uint256)",
          "function getPetition(uint256 petitionId) external view returns (string, string, uint256, uint256, address, bool)",
        ],
        provider
      )

      // Get total petition count from blockchain
      const petitionCount = await Petitions.petitionCount()
      console.log(`Found ${petitionCount} petitions in blockchain`)
      const blockchainPetitionIds = new Set<number>()
      
      const newPetitions = []
      const conflicts: ConflictItem[] = []
      const removed: RemovedItem[] = []
      
      // Get all petitions from blockchain
      for (let i = 1; i <= Number(petitionCount); i++) {
        blockchainPetitionIds.add(i)
        try {
          const petition = await Petitions.getPetition(i)
          const petitionData = {
            blockchain_petition_id: i,
            title_cid: petition[0],
            description_cid: petition[1],
            required_signature_count: Number(petition[2]),
            signature_count: Number(petition[3]),
            creator_address: petition[4],
            completed: petition[5],
            status: petition[5] ? 'COMPLETED' : 'ACTIVE'
          }

          // Check if exists in DB by blockchain_petition_id
          try {
            const allDbPetitionsRes = await fetch('http://localhost:8080/api/petitions')
            let existingDbPetition = null
            
            if (allDbPetitionsRes.ok) {
              const allDbPetitions = await allDbPetitionsRes.json()
              if (Array.isArray(allDbPetitions.data)) {
                existingDbPetition = allDbPetitions.data.find((p: any) => p.blockchain_petition_id === i)
              }
            }

            if (!existingDbPetition) {
              // New petition, add to DB
              const createResponse = await fetch('http://localhost:8080/api/petitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(petitionData)
              })
              
              if (createResponse.ok) {
                newPetitions.push(petitionData)
                console.log(`✅ Created petition ${i} in database`)
              } else {
                console.error(`❌ Failed to create petition ${i}:`, await createResponse.text())
              }
            } else {
              // Check for conflicts and update if needed
              if (existingDbPetition.signature_count !== petitionData.signature_count ||
                  existingDbPetition.completed !== petitionData.completed) {
                
                const updateResponse = await fetch(`http://localhost:8080/api/petitions/${existingDbPetition.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({...petitionData, id: existingDbPetition.id})
                })
                
                if (updateResponse.ok) {
                  conflicts.push({
                    type: 'petition',
                    id: i,
                    field: 'signature_count/completed',
                    dbValue: `${existingDbPetition.signature_count}/${existingDbPetition.completed}`,
                    blockchainValue: `${petitionData.signature_count}/${petitionData.completed}`
                  })
                  console.log(`🔄 Updated petition ${i} in database`)
                } else {
                  console.error(`❌ Failed to update petition ${i}:`, await updateResponse.text())
                }
              }
            }
          } catch (dbError) {
            console.error(`Error syncing petition ${i}:`, dbError)
          }
        } catch (contractError) {
          console.error(`Error reading petition ${i} from contract:`, contractError)
        }
      }

      // Remove petitions from DB that don't exist in blockchain
      try {
        const allDbPetitionsRes = await fetch('http://localhost:8080/api/petitions')
        if (allDbPetitionsRes.ok) {
          const allDbPetitions = await allDbPetitionsRes.json()
          if (Array.isArray(allDbPetitions.data)) {
            for (const dbPetition of allDbPetitions.data) {
              // Only remove items that have blockchain_petition_id set but don't exist in blockchain
              if (dbPetition.blockchain_petition_id && !blockchainPetitionIds.has(dbPetition.blockchain_petition_id)) {
                const deleteResponse = await fetch(`http://localhost:8080/api/petitions/${dbPetition.id}`, {
                  method: 'DELETE'
                })
                
                if (deleteResponse.ok) {
                  removed.push({
                    type: 'petition',
                    id: dbPetition.blockchain_petition_id,
                    title: dbPetition.title || dbPetition.title_cid || 'Unknown',
                    reason: 'Not found in blockchain'
                  })
                  console.log(`🗑️ Removed petition ${dbPetition.blockchain_petition_id} from database`)
                }
              }
            }
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up petitions:', cleanupError)
      }

      // Update sync results
      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Petitions' 
          ? { 
              ...result, 
              totalItems: Number(petitionCount), 
              newItems: newPetitions.length,
              updatedItems: conflicts.length,
              removedItems: removed.length,
              status: 'completed' as const,
              lastBlockScanned: toBlock
            }
          : result
      ))

      setConflictItems(prev => [...prev, ...conflicts])
      setRemovedItems(prev => [...prev, ...removed])

    } catch (error: any) {
      console.error('Error syncing petitions:', error)
      
      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Petitions' 
          ? { ...result, status: 'error' as const, errors: 1 }
          : result
      ))
      
      toast({
        title: "Petitions Sync Error",
        description: `Failed to sync petitions: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const syncProposals = async (provider: any, fromBlock: number, toBlock: number) => {
    setCurrentSyncStep('Syncing proposals from blockchain...')
    setSyncProgress(40)

    try {
      const ethers = await import("ethers")
      const Proposals = new ethers.Contract(
        CONTRACT_ADDRESSES.Proposals,
        [
          "function proposalCount() external view returns (uint256)",
          "function getProposal(uint256 proposalId) external view returns (string, string, string, uint256, uint256, address, bool, uint256, uint256, uint256, uint256)",
        ],
        provider
      )

      // Get total proposal count from blockchain
      const proposalCount = await Proposals.proposalCount()
      console.log(`Found ${proposalCount} proposals in blockchain`)
      const blockchainProposalIds = new Set<number>()
      
      const newProposals = []
      const conflicts: ConflictItem[] = []
      const removed: RemovedItem[] = []
      
      // Get all proposals from blockchain
      for (let i = 1; i <= Number(proposalCount); i++) {
        blockchainProposalIds.add(i)
        try {
          const proposal = await Proposals.getProposal(i)
          const proposalData = {
            blockchain_proposal_id: i,
            title_cid: proposal[0],
            description_cid: proposal[1],
            category_cid: proposal[2],
            upvotes: Number(proposal[3]),
            downvotes: Number(proposal[4]),
            creator_address: proposal[5],
            executed: proposal[6],
            assigned_authority: proposal[7],
            deadline: Number(proposal[8]),
            creation_time: Number(proposal[9]),
            execution_time: Number(proposal[10]),
            status: proposal[6] ? 'EXECUTED' : 'PENDING'
          }

          // Check if exists in DB by blockchain_proposal_id
          try {
            const allDbProposalsRes = await fetch('http://localhost:8080/api/proposals')
            let existingDbProposal = null
            
            if (allDbProposalsRes.ok) {
              const allDbProposals = await allDbProposalsRes.json()
              if (Array.isArray(allDbProposals.data)) {
                existingDbProposal = allDbProposals.data.find((p: any) => p.blockchain_proposal_id === i)
              }
            }

            if (!existingDbProposal) {
              // New proposal, add to DB
              const createResponse = await fetch('http://localhost:8080/api/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proposalData)
              })
              
              if (createResponse.ok) {
                newProposals.push(proposalData)
                console.log(`✅ Created proposal ${i} in database`)
              } else {
                console.error(`❌ Failed to create proposal ${i}:`, await createResponse.text())
              }
            } else {
              // Check for conflicts and update if needed
              if (existingDbProposal.upvotes !== proposalData.upvotes ||
                  existingDbProposal.downvotes !== proposalData.downvotes ||
                  existingDbProposal.executed !== proposalData.executed) {
                
                const updateResponse = await fetch(`http://localhost:8080/api/proposals/${existingDbProposal.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({...proposalData, id: existingDbProposal.id})
                })
                
                if (updateResponse.ok) {
                  conflicts.push({
                    type: 'proposal',
                    id: i,
                    field: 'votes/execution',
                    dbValue: `${existingDbProposal.upvotes}/${existingDbProposal.downvotes}/${existingDbProposal.executed}`,
                    blockchainValue: `${proposalData.upvotes}/${proposalData.downvotes}/${proposalData.executed}`
                  })
                  console.log(`🔄 Updated proposal ${i} in database`)
                } else {
                  console.error(`❌ Failed to update proposal ${i}:`, await updateResponse.text())
                }
              }
            }
          } catch (dbError) {
            console.error(`Error syncing proposal ${i}:`, dbError)
          }
        } catch (contractError) {
          console.error(`Error reading proposal ${i} from contract:`, contractError)
        }
      }

      // Remove proposals from DB that don't exist in blockchain
      try {
        const allDbProposalsRes = await fetch('http://localhost:8080/api/proposals')
        if (allDbProposalsRes.ok) {
          const allDbProposals = await allDbProposalsRes.json()
          if (Array.isArray(allDbProposals.data)) {
            for (const dbProposal of allDbProposals.data) {
              // Only remove items that have blockchain_proposal_id set but don't exist in blockchain
              if (dbProposal.blockchain_proposal_id && !blockchainProposalIds.has(dbProposal.blockchain_proposal_id)) {
                const deleteResponse = await fetch(`http://localhost:8080/api/proposals/${dbProposal.id}`, {
                  method: 'DELETE'
                })
                
                if (deleteResponse.ok) {
                  removed.push({
                    type: 'proposal',
                    id: dbProposal.blockchain_proposal_id,
                    title: dbProposal.title || dbProposal.title_cid || 'Unknown',
                    reason: 'Not found in blockchain'
                  })
                  console.log(`🗑️ Removed proposal ${dbProposal.blockchain_proposal_id} from database`)
                }
              }
            }
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up proposals:', cleanupError)
      }

      // Update sync results
      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Proposals' 
          ? { 
              ...result, 
              totalItems: Number(proposalCount), 
              newItems: newProposals.length,
              updatedItems: conflicts.length,
              removedItems: removed.length,
              status: 'completed' as const,
              lastBlockScanned: toBlock
            }
          : result
      ))

      setConflictItems(prev => [...prev, ...conflicts])
      setRemovedItems(prev => [...prev, ...removed])

    } catch (error: any) {
      console.error('Error syncing proposals:', error)
      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Proposals' 
          ? { ...result, status: 'error' as const, errors: 1 }
          : result
      ))
      
      toast({
        title: "Proposals Sync Error", 
        description: `Failed to sync proposals: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const syncReports = async (provider: any, fromBlock: number, toBlock: number) => {
    setCurrentSyncStep('Syncing reports from blockchain...')
    setSyncProgress(60)

    try {
      const ethers = await import("ethers")
      const Reports = new ethers.Contract(
        CONTRACT_ADDRESSES.Reports,
        [
          "function reportCount() external view returns (uint256)",
          "function getReport(uint256 reportId) external view returns (string, string, string, uint256, uint256, address, bool, address, uint256, uint256)"
        ],
        provider
      )

      // Get total report count from blockchain
      const reportCount = await Reports.reportCount()
      console.log(`Found ${reportCount} reports in blockchain`)
      const blockchainReportIds = new Set<number>()
      
      const newReports = []
      const conflicts: ConflictItem[] = []
      const removed: RemovedItem[] = []
      
      // Get all reports from blockchain
      for (let i = 1; i <= Number(reportCount); i++) {
        blockchainReportIds.add(i)
        try {
          const report = await Reports.getReport(i)
          const reportData = {
            blockchain_report_id: i,
            title_cid: report[0],
            description_cid: report[1],
            category_cid: report[2],
            upvotes: Number(report[3]),
            downvotes: Number(report[4]),
            creator_address: report[5],
            resolved: report[6],
            assigned_authority: report[7],
            creation_time: Number(report[8]),
            resolution_time: Number(report[9]),
            status: report[6] ? 'RESOLVED' : 'PENDING'
          }

          // Check if exists in DB by blockchain_report_id
          try {
            const allDbReportsRes = await fetch('http://localhost:8080/api/reports')
            let existingDbReport = null
            
            if (allDbReportsRes.ok) {
              const allDbReports = await allDbReportsRes.json()
              if (Array.isArray(allDbReports.data)) {
                existingDbReport = allDbReports.data.find((r: any) => r.blockchain_report_id === i)
              }
            }

            if (!existingDbReport) {
              // New report, add to DB
              const createResponse = await fetch('http://localhost:8080/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData)
              })
              
              if (createResponse.ok) {
                newReports.push(reportData)
                console.log(`✅ Created report ${i} in database`)
              } else {
                console.error(`❌ Failed to create report ${i}:`, await createResponse.text())
              }
            } else {
              // Check for conflicts and update if needed
              if (existingDbReport.upvotes !== reportData.upvotes ||
                  existingDbReport.downvotes !== reportData.downvotes ||
                  existingDbReport.resolved !== reportData.resolved) {
                
                const updateResponse = await fetch(`http://localhost:8080/api/reports/${existingDbReport.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({...reportData, id: existingDbReport.id})
                })
                
                if (updateResponse.ok) {
                  conflicts.push({
                    type: 'report',
                    id: i,
                    field: 'votes/resolution',
                    dbValue: `${existingDbReport.upvotes}/${existingDbReport.downvotes}/${existingDbReport.resolved}`,
                    blockchainValue: `${reportData.upvotes}/${reportData.downvotes}/${reportData.resolved}`
                  })
                  console.log(`🔄 Updated report ${i} in database`)
                } else {
                  console.error(`❌ Failed to update report ${i}:`, await updateResponse.text())
                }
              }
            }
          } catch (dbError) {
            console.error(`Error syncing report ${i}:`, dbError)
          }
        } catch (contractError) {
          console.error(`Error reading report ${i} from contract:`, contractError)
        }
      }

      // Remove reports from DB that don't exist in blockchain
      try {
        const allDbReportsRes = await fetch('http://localhost:8080/api/reports')
        if (allDbReportsRes.ok) {
          const allDbReports = await allDbReportsRes.json()
          if (Array.isArray(allDbReports.data)) {
            for (const dbReport of allDbReports.data) {
              // Only remove items that have blockchain_report_id set but don't exist in blockchain
              if (dbReport.blockchain_report_id && !blockchainReportIds.has(dbReport.blockchain_report_id)) {
                const deleteResponse = await fetch(`http://localhost:8080/api/reports/${dbReport.id}`, {
                  method: 'DELETE'
                })
                
                if (deleteResponse.ok) {
                  removed.push({
                    type: 'report',
                    id: dbReport.blockchain_report_id,
                    title: dbReport.title || dbReport.title_cid || 'Unknown',
                    reason: 'Not found in blockchain'
                  })
                  console.log(`🗑️ Removed report ${dbReport.blockchain_report_id} from database`)
                }
              }
            }
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up reports:', cleanupError)
      }

      // Update sync results
      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Reports' 
          ? { 
              ...result, 
              totalItems: Number(reportCount), 
              newItems: newReports.length,
              updatedItems: conflicts.length,
              removedItems: removed.length,
              status: 'completed' as const,
              lastBlockScanned: toBlock
            }
          : result
      ))

      setConflictItems(prev => [...prev, ...conflicts])
      setRemovedItems(prev => [...prev, ...removed])

    } catch (error: any) {
      console.error('Error syncing reports:', error)
      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Reports' 
          ? { ...result, status: 'error' as const, errors: 1 }
          : result
      ))
      
      toast({
        title: "Reports Sync Error",
        description: `Failed to sync reports: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const syncPolicies = async (provider: any, fromBlock: number, toBlock: number) => {
    setCurrentSyncStep('Syncing policies from blockchain...')
    setSyncProgress(80)

    try {
      // Note: Add Policies contract sync when available
      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Policies' 
          ? { ...result, status: 'completed' as const, lastBlockScanned: toBlock }
          : result
      ))
    } catch (error) {
      console.error('Error syncing policies:', error)
      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Policies' 
          ? { ...result, status: 'error' as const, errors: 1 }
          : result
      ))
    }
  }

  const syncProjects = async (provider: any, fromBlock: number, toBlock: number) => {
    setCurrentSyncStep('Syncing projects from blockchain...')
    setSyncProgress(90)

    try {
      const ethers = await import("ethers")
      const Project = new ethers.Contract(
        CONTRACT_ADDRESSES.Project,
        [
          "function projectCount() external view returns (uint256)",
          "function getProject(uint256 projectId) external view returns (uint256, string, string, uint256, uint256, string, string, string, string, string, address, uint256, uint256)"
        ],
        provider
      )

      const projectCount = await Project.projectCount()
      const blockchainProjectIds = new Set<number>()
      const newProjects = []
      const conflicts: ConflictItem[] = []
      const removed: RemovedItem[] = []

      for (let i = 1; i <= Number(projectCount); i++) {
        blockchainProjectIds.add(i)
        try {
          const project = await Project.getProject(i)
          const projectData = {
            blockchain_project_id: Number(project[0]),
            project_name: project[1],
            category_name: project[2],
            allocated_budget: project[3].toString(),
            spent_budget: project[4].toString(),
            state: project[5],
            province: project[6],
            ministry: project[7],
            view_details_cid: project[8],
            status: project[9],
            creator_address: project[10],
            created_at: new Date(Number(project[11]) * 1000).toISOString(),
            updated_at: new Date(Number(project[12]) * 1000).toISOString()
          }

          try {
            const dbResponse = await fetch(`http://localhost:8080/api/projects/${i}`)
            if (!dbResponse.ok) {
              await fetch('http://localhost:8080/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
              })
              newProjects.push(projectData)
            } else {
              const dbProject = await dbResponse.json()
              if (dbProject.data.spent_budget !== projectData.spent_budget ||
                  dbProject.data.status !== projectData.status) {
                await fetch(`http://localhost:8080/api/projects/${i}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(projectData)
                })
                conflicts.push({
                  type: 'project',
                  id: i,
                  field: 'budget/status',
                  dbValue: `${dbProject.data.spent_budget}/${dbProject.data.status}`,
                  blockchainValue: `${projectData.spent_budget}/${projectData.status}`
                })
              }
            }
          } catch (dbError) {
            console.error(`Error syncing project ${i}:`, dbError)
          }
        } catch (contractError) {
          console.error(`Error reading project ${i}:`, contractError)
        }
      }

      // Clean up projects not in blockchain
      try {
        const allDbProjectsRes = await fetch('http://localhost:8080/api/projects')
        if (allDbProjectsRes.ok) {
          const allDbProjects = await allDbProjectsRes.json()
          if (Array.isArray(allDbProjects.data)) {
            for (const dbProject of allDbProjects.data) {
              if (!blockchainProjectIds.has(dbProject.blockchain_project_id)) {
                await fetch(`http://localhost:8080/api/projects/${dbProject.blockchain_project_id}`, {
                  method: 'DELETE'
                })
                removed.push({
                  type: 'project',
                  id: dbProject.blockchain_project_id,
                  title: dbProject.project_name,
                  reason: 'Not found in blockchain'
                })
              }
            }
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up projects:', cleanupError)
      }

      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Projects' 
          ? { 
              ...result, 
              totalItems: Number(projectCount), 
              newItems: newProjects.length,
              updatedItems: conflicts.length,
              removedItems: removed.length,
              status: 'completed' as const,
              lastBlockScanned: toBlock
            }
          : result
      ))

      setConflictItems(prev => [...prev, ...conflicts])
      setRemovedItems(prev => [...prev, ...removed])

    } catch (error) {
      console.error('Error syncing projects:', error)
      setSyncResults(prev => prev.map(result => 
        result.contractType === 'Projects' 
          ? { ...result, status: 'error' as const, errors: 1 }
          : result
      ))
    }
  }

  const getSyncStatusIcon = (status: SyncResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getSyncStatusColor = (status: SyncResult['status']) => {
    switch (status) {
      case 'pending':
        return "bg-gray-100 text-gray-800"
      case 'syncing':
        return "bg-blue-100 text-blue-800"
      case 'completed':
        return "bg-green-100 text-green-800"
      case 'error':
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Database Synchronization
          </h2>
          <p className="text-slate-600">Sync and reconcile blockchain data with local database</p>
        </div>
        <div className="flex items-center gap-4">
          {lastSyncTime && (
            <div className="text-sm text-slate-500">
              Last sync: {lastSyncTime.toLocaleString()}
            </div>
          )}
          <Button
            onClick={() => syncFromBlockchain(100, false)}
            disabled={!isConnected || isFullSync}
            variant="outline"
            size="sm"
          >
            {isFullSync ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Quick (100)
              </>
            )}
          </Button>
          <Button
            onClick={() => syncFromBlockchain(1000, false)}
            disabled={!isConnected || isFullSync}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isFullSync ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync (1000)
              </>
            )}
          </Button>
          <Button
            onClick={() => syncFromBlockchain(0, true)}
            disabled={!isConnected || isFullSync}
            variant="destructive"
          >
            {isFullSync ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Full Syncing...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Full Sync
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Wallet Connection Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet to perform blockchain synchronization operations.
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Progress */}
      {isFullSync && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Sync in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentSyncStep}</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} />
            </div>
            <div className="text-sm text-slate-600">
              Scanning blocks {blockRange.from.toLocaleString()} to {blockRange.to.toLocaleString()} 
              ({blockRange.total.toLocaleString()} blocks • ~{blockRange.timeRange})
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database vs Blockchain Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { name: 'Petitions', count: dbStats.petitions, icon: MessageSquare, color: 'text-blue-600' },
          { name: 'Proposals', count: dbStats.proposals, icon: Vote, color: 'text-green-600' },
          { name: 'Reports', count: dbStats.reports, icon: AlertTriangle, color: 'text-orange-600' },
          { name: 'Policies', count: dbStats.policies, icon: FileText, color: 'text-purple-600' },
          { name: 'Projects', count: dbStats.projects, icon: BarChart3, color: 'text-indigo-600' }
        ].map(({ name, count, icon: Icon, color }) => (
          <Card key={name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{name}</p>
                  <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                </div>
                <Icon className={`h-8 w-8 ${color}`} />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                In local database
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Sync Results
            </CardTitle>
            <CardDescription>
              Latest synchronization results from blockchain to database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncResults.map((result) => (
                <div key={result.contractType} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getSyncStatusIcon(result.status)}
                      <span className="font-medium">{result.contractType}</span>
                      <Badge className={getSyncStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-500">
                      Block: {result.lastBlockScanned.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Total Items:</span>
                      <div className="font-semibold">{result.totalItems}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">New Items:</span>
                      <div className="font-semibold text-green-600">{result.newItems}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Updated:</span>
                      <div className="font-semibold text-blue-600">{result.updatedItems}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Removed:</span>
                      <div className="font-semibold text-red-600">{result.removedItems}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Errors:</span>
                      <div className="font-semibold text-red-600">{result.errors}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Removed Items */}
      {removedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Items Removed from Database
            </CardTitle>
            <CardDescription>
              The following items existed in the database but were not found in the blockchain. 
              They have been removed to maintain data integrity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {removedItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize text-red-600 border-red-300">
                        {item.type}
                      </Badge>
                      <span className="text-sm font-medium">ID: {item.id}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Reason: {item.reason}
                    </div>
                  </div>
                  {item.title && (
                    <div className="text-sm">
                      <span className="text-slate-500">Title/Name:</span>
                      <div className="font-mono bg-red-100 p-1 rounded text-red-800 mt-1">
                        {item.title}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflict Resolution */}
      {conflictItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Data Conflicts Resolved
            </CardTitle>
            <CardDescription>
              The following items had different values between database and blockchain. 
              Database has been updated to match blockchain (source of truth).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflictItems.map((conflict, index) => (
                <div key={index} className="border rounded-lg p-3 bg-amber-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {conflict.type}
                      </Badge>
                      <span className="text-sm font-medium">ID: {conflict.id}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Field: {conflict.field}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Database Value:</span>
                      <div className="font-mono bg-red-100 p-1 rounded text-red-800">
                        {conflict.dbValue}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Blockchain Value (Updated To):</span>
                      <div className="font-mono bg-green-100 p-1 rounded text-green-800">
                        {conflict.blockchainValue}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-slate-600" />
            Contract Addresses (Sepolia)
          </CardTitle>
          <CardDescription>
            Smart contract addresses being monitored for synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(CONTRACT_ADDRESSES).map(([name, address]) => (
              <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-slate-500 font-mono">{address}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          onClick={() => syncFromBlockchain(100, false)}
          disabled={!isConnected || isFullSync}
          className="h-12"
        >
          <Search className="h-4 w-4 mr-2" />
          Quick Sync (~20min)
        </Button>
        <Button
          variant="outline"
          onClick={() => syncFromBlockchain(1000, false)}
          disabled={!isConnected || isFullSync}
          className="h-12"
        >
          <Download className="h-4 w-4 mr-2" />
          Standard Sync (~3.3h)
        </Button>
        <Button
          variant="outline"
          onClick={() => syncFromBlockchain(5000, false)}
          disabled={!isConnected || isFullSync}
          className="h-12"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Deep Sync (~17h)
        </Button>
        <Button
          variant="outline"
          onClick={loadDbStats}
          disabled={isFullSync}
          className="h-12"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Stats
        </Button>
      </div>
    </div>
  )
}
