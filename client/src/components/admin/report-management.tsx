"use client"

import type React from "react"
import { useState, useEffect } from "react"

// Web3 wallet integration
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { AlertTriangle, Shield, Clock, CheckCircle, Search, Loader2, X, RotateCcw, User, UserCheck, Trash2, Wallet, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { reportService, type Report, type ReportStatistics } from "@/services/report"
import { useAuth } from "@/context/AuthContext"
import { useAppKitAccount } from "@reown/appkit/react"

export function ReportManagement() {
  // Environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const BALLERINA_BASE_URL = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080';

  const [reports, setReports] = useState<Report[]>([])
  const [statistics, setStatistics] = useState<ReportStatistics['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const { address, isConnected } = useAppKitAccount()
  const { verified } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState<"created_time" | "priority" | "report_title">("created_time")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [searchResults, setSearchResults] = useState<string>("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  // Assignment state
  const [assignmentInputs, setAssignmentInputs] = useState<{ [reportId: number]: string }>({})
  const [assigningReports, setAssigningReports] = useState<{ [reportId: number]: boolean }>({})
  
  // Resolve/unresolve loading state
  const [resolvingReports, setResolvingReports] = useState<{ [reportId: number]: boolean }>({})
  
  // For tracking which report is being deleted
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  // Get paginated data
  const getPaginatedReports = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return reports.slice(startIndex, endIndex)
  }

  const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load reports on component mount and when search/filters change
  useEffect(() => {
    loadReports()
  }, [])

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch()
    } else {
      loadAndFilterReports()
    }
  }, [debouncedSearchTerm, filterPriority, filterStatus])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterPriority, filterStatus, debouncedSearchTerm])

  // Load all reports from backend
  const loadReports = async () => {
    try {
      setLoading(true)
      const reportsData = await reportService.getAllReports()
      // Filter out removed reports
      const activeReports = reportsData.filter((report) => !report.removed)
      const sortedReports = sortReports(activeReports)
      setReports(sortedReports)
      setTotalItems(sortedReports.length)
      setSearchResults("")
      
      // Initialize assignment inputs with current assignments
      const initialAssignments: { [reportId: number]: string } = {}
      sortedReports.forEach(report => {
        initialAssignments[report.report_id] = report.assigned_to || ''
      })
      setAssignmentInputs(initialAssignments)
      
      // Load statistics
      const statsData = await reportService.getReportStatistics()
      setStatistics(statsData)
    } catch (error) {
      console.error('Failed to load reports:', error)
      toast.error('Failed to load reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

      // Load and filter reports when no search term is provided
  const loadAndFilterReports = async () => {
    try {
      setLoading(true)
      const reportsData = await reportService.getAllReports()
      
      // Filter out removed reports first
      const activeReports = reportsData.filter((report) => !report.removed)
      
      // Apply filters
      let filteredReports = activeReports
      
      // Apply priority filter
      if (filterPriority !== "all") {
        filteredReports = filteredReports.filter(report => report.priority === filterPriority)
      }
      
      // Apply status filter
      if (filterStatus !== "all") {
        const isResolved = filterStatus === "resolved"
        filteredReports = filteredReports.filter(report => report.resolved_status === isResolved)
      }
      
      const sortedReports = sortReports(filteredReports)
      setReports(sortedReports)
      setTotalItems(sortedReports.length)
      
      // Set filter results message
      if (filterPriority !== "all" || filterStatus !== "all") {
        let filterMessage = `Filtered ${filteredReports.length} report(s)`
        const appliedFilters: string[] = []
        if (filterPriority !== "all") appliedFilters.push(`Priority: ${formatPriority(filterPriority)}`)
        if (filterStatus !== "all") appliedFilters.push(`Status: ${filterStatus === "resolved" ? "Resolved" : "Pending"}`)
        if (appliedFilters.length > 0) {
          filterMessage += ` (${appliedFilters.join(", ")})`
        }
        setSearchResults(filterMessage)
      } else {
        setSearchResults("")
      }
      
      // Initialize assignment inputs with current assignments
      const initialAssignments: { [reportId: number]: string } = {}
      sortedReports.forEach(report => {
        initialAssignments[report.report_id] = report.assigned_to || ''
      })
      setAssignmentInputs(initialAssignments)
      
      // Load statistics (use original data for accurate stats)
      const statsData = await reportService.getReportStatistics()
      setStatistics(statsData)
    } catch (error) {
      console.error('Failed to load reports:', error)
      toast.error('Failed to load reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Perform search with backend API
  const performSearch = async () => {
    try {
      setLoading(true)
      const searchData = await reportService.searchReportsAdvanced({
        keyword: debouncedSearchTerm,
        priority: filterPriority !== "all" ? filterPriority : undefined,
        resolved: filterStatus !== "all" ? filterStatus === "resolved" : undefined
      })
      const sortedReports = sortReports(searchData)
      setReports(sortedReports)
      setTotalItems(sortedReports.length)
      setSearchResults(`Found ${searchData.length} report(s) matching "${debouncedSearchTerm}"`)
    } catch (error) {
      console.error('Failed to search reports:', error)
      toast.error('Failed to search reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Sort reports based on sortBy and sortOrder
  const sortReports = (reportsToSort: Report[]) => {
    return [...reportsToSort].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "created_time":
          comparison = new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
          break
        case "report_title":
          comparison = a.report_title.localeCompare(b.report_title)
          break
        case "priority":
          const priorityOrder = { "CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 }
          comparison = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
          break
        default:
          comparison = 0
      }
      
      return sortOrder === "desc" ? -comparison : comparison
    })
  }

  // Handle sorting change
  useEffect(() => {
    const sortedReports = sortReports(reports)
    setReports(sortedReports)
  }, [sortBy, sortOrder])

  // Handle resolve/unresolve report toggle with admin wallet
  const handleToggleResolve = async (reportId: number, currentStatus: boolean) => {
    try {
      setResolvingReports(prev => ({ ...prev, [reportId]: true }))
      
      // Check if Web3 wallet is available
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask or another Web3 wallet to perform admin actions.')
      }

      // Request wallet connection
      const ethereum = window.ethereum as any
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      if (!accounts || accounts.length === 0) {
        throw new Error('Please connect your admin wallet to perform this action.')
      }

      const adminAddress = accounts[0]
      
      if (currentStatus) {
        // If currently resolved, reopen it (unresolve) - requires admin wallet signature
        const response = await fetch(`${process.env.NEXT_PUBLIC_WEB3_API_BASE_URL || 'http://localhost:3001/web3'}/report/reopen-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportId: reportId,
            adminAddress: adminAddress, // Send admin address for verification
            requiresWalletSigning: true
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to reopen report on blockchain')
        }
        
        const result = await response.json()
        
        // If the backend requires client-side signing, handle it
        if (result.requiresClientSigning && result.contractAddress && result.contractAbi) {
          // Import ethers for client-side transaction
          const { ethers } = await import('ethers')
          const provider = new ethers.BrowserProvider(window.ethereum as any)
          const signer = await provider.getSigner()
          
          // Create contract instance
          const contract = new ethers.Contract(result.contractAddress, result.contractAbi, signer)
          
          // Call reopenReport function
          const tx = await contract.reopenReport(reportId)
          toast.info('Transaction submitted. Waiting for confirmation...')
          
          // Wait for transaction confirmation
          const receipt = await tx.wait()
          
          if (receipt.status !== 1) {
            throw new Error('Transaction failed on blockchain')
          }
          
          // Update database after successful blockchain transaction
          await reportService.unresolveReport(reportId)
        }
        
        // Update local state
        setReports(reports.map(report => 
          report.report_id === reportId 
            ? { ...report, resolved_status: false, resolved_time: undefined }
            : report
        ))
        toast.success('Report marked as pending successfully!')
      } else {
        // If currently pending, mark as resolved - requires admin wallet signature
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/report/resolve-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportId: reportId,
            adminAddress: adminAddress, // Send admin address for verification
            requiresWalletSigning: true
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to resolve report on blockchain')
        }
        
        const result = await response.json()
        
        // If the backend requires client-side signing, handle it
        if (result.requiresClientSigning && result.contractAddress && result.contractAbi) {
          // Import ethers for client-side transaction
          const { ethers } = await import('ethers')
          const provider = new ethers.BrowserProvider(window.ethereum as any)
          const signer = await provider.getSigner()
          
          // Create contract instance
          const contract = new ethers.Contract(result.contractAddress, result.contractAbi, signer)
          
          // Call resolveReport function
          const tx = await contract.resolveReport(reportId)
          toast.info('Transaction submitted. Waiting for confirmation...')
          
          // Wait for transaction confirmation
          const receipt = await tx.wait()
          
          if (receipt.status !== 1) {
            throw new Error('Transaction failed on blockchain')
          }
          
          // Update database after successful blockchain transaction
          await reportService.resolveReport(reportId)
        }
        
        // Update local state
        setReports(reports.map(report => 
          report.report_id === reportId 
            ? { ...report, resolved_status: true, resolved_time: new Date().toISOString() }
            : report
        ))
        toast.success('Report marked as resolved successfully!')
      }
      
      // Refresh statistics
      const statsData = await reportService.getReportStatistics()
      setStatistics(statsData)
    } catch (error) {
      console.error('Failed to toggle report status:', error)
      
      // Handle specific wallet errors
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorCode = (error as any)?.code
      
      if (errorMessage?.includes('User rejected') || errorCode === 4001) {
        toast.error('Transaction cancelled by user.')
      } else if (errorMessage?.includes('insufficient funds')) {
        toast.error('Insufficient funds to complete the transaction.')
      } else if (errorMessage?.includes('MetaMask') || errorMessage?.includes('wallet')) {
        toast.error(errorMessage)
      } else {
        toast.error(`Failed to ${currentStatus ? 'unresolve' : 'resolve'} report. Please try again.`)
      }
    } finally {
      setResolvingReports(prev => ({ ...prev, [reportId]: false }))
    }
  }

  // Handle assignment input change
  const handleAssignmentInputChange = (reportId: number, value: string) => {
    setAssignmentInputs(prev => ({
      ...prev,
      [reportId]: value
    }))
  }

  // Handle assign/unassign report
  const handleAssignReport = async (reportId: number) => {
    const assignedTo = assignmentInputs[reportId]?.trim()
    
    try {
      setAssigningReports(prev => ({ ...prev, [reportId]: true }))
      
      let updatedReport: Report
      if (assignedTo && assignedTo.length > 0) {
        // Assign to someone
        updatedReport = await reportService.assignReport(reportId, assignedTo)
        toast.success(`Report assigned to ${assignedTo} successfully!`)
      } else {
        // Unassign (empty input)
        updatedReport = await reportService.unassignReport(reportId)
        toast.success('Report unassigned successfully!')
      }
      
      // Update reports list
      setReports(reports.map(report => 
        report.report_id === reportId ? updatedReport : report
      ))
      
      // Update assignment input to reflect the actual assignment
      setAssignmentInputs(prev => ({
        ...prev,
        [reportId]: updatedReport.assigned_to || ''
      }))
      
    } catch (error) {
      console.error('Failed to assign/unassign report:', error)
      toast.error('Failed to update assignment. Please try again.')
    } finally {
      setAssigningReports(prev => ({ ...prev, [reportId]: false }))
    }
  }

  // Wallet validation helper
  const validateWallet = async (walletAddress: string) => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }

    let accounts
    try {
      accounts = await (window.ethereum as any).request({ method: "eth_accounts" })
    } catch (accountError: any) {
      console.error("Failed to get accounts:", accountError)
      throw new Error("Failed to get wallet accounts. Please try again.")
    }

    if (accounts.length === 0) {
      try {
        toast.info("Account Access Required", {
          description: "Please approve wallet connection in MetaMask"
        })
        accounts = await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      } catch (requestError: any) {
        if (requestError.code === -32002) {
          throw new Error("MetaMask is already processing a connection request. Please check your MetaMask extension and try again.")
        } else if (requestError.code === 4001) {
          throw new Error("User rejected wallet connection request")
        }
        throw new Error(`Failed to connect wallet: ${requestError.message || requestError}`)
      }
    }

    const currentAccount = accounts[0]?.toLowerCase()
    if (!currentAccount) {
      throw new Error("No wallet account found. Please connect your wallet first.")
    }

    if (currentAccount !== walletAddress.toLowerCase()) {
      throw new Error(`Account mismatch. Please switch to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} in MetaMask`)
    }
  }

  // Remove report from blockchain and database
  const handleRemoveReport = async (reportId: number) => {
    // Check wallet connection
    if (!isConnected) {
      toast.error("🔗 Please connect your wallet first")
      return
    }

    if (!verified) {
      toast.error("❌ Verification Required", {
        description: "Please verify your wallet to remove reports."
      })
      return
    }

    setDeletingId(reportId)

    try {
      await validateWallet(address!)

      // Get contract info for blockchain transaction
      const infoRes = await fetch(`${process.env.NEXT_PUBLIC_WEB3_API_BASE_URL || 'http://localhost:3001/web3'}/report/contract-info`)
      if (!infoRes.ok) throw new Error("Failed to fetch contract info")
      const info = await infoRes.json()
      const { contractAddress, contractAbi } = info
      if (!contractAddress || !contractAbi) throw new Error("Contract info missing")

      toast.info("🔐 Please confirm the transaction in your wallet")

      // Send blockchain transaction
      const ethers = await import("ethers")
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      const tx = await contract.removeReport(reportId)
      toast.info(`📤 Transaction sent: ${tx.hash.slice(0, 10)}...`)

      const receipt = await tx.wait()
      toast.success(`✅ Report removed from blockchain in block ${receipt.blockNumber}`)

      // Update database after successful blockchain transaction
      try {
        const dbUpdateResp = await fetch(`${BALLERINA_BASE_URL}/reports/${reportId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            removed: true,
          }),
        })

        if (!dbUpdateResp.ok) {
          console.error("Database update failed:", await dbUpdateResp.text())
          toast.error("⚠️ Blockchain updated but database sync failed", {
            description: "The report was removed from blockchain but database sync failed"
          })
        } else {
          toast.success("✅ Report removed from blockchain and database")
        }
      } catch (dbError: any) {
        console.error("Database update error:", dbError)
        toast.error("⚠️ Blockchain updated but database sync failed", {
          description: "The report was removed from blockchain but database sync failed"
        })
      }

      // Remove from UI and reload data
      setReports((prev) => prev.filter((r) => r.report_id !== reportId))
      setTotalItems((prev) => prev - 1)
      await loadReports()
    } catch (error: any) {
      console.error("Report removal failed:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorMessage?.includes("User rejected") || (error as any)?.code === 4001) {
        toast.error("Transaction cancelled by user.")
      } else if (errorMessage?.includes("insufficient funds")) {
        toast.error("Insufficient funds to complete the transaction.")
      } else {
        toast.error(`❌ Failed to remove report: ${errorMessage}`)
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setFilterPriority("all")
    setFilterStatus("all")
    setCurrentPage(1) // Reset to first page when clearing filters
    loadReports()
  }

  // Utility functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (resolved: boolean) => {
    return resolved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">National Report Management</h2>
          <p className="text-slate-600">Manage Reports Submitted By Citizens Across Sri Lanka</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search reports by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {formatPriority(priority)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: "created_time" | "priority" | "report_title") => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_time">Date</SelectItem>
            <SelectItem value="report_title">Title</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest</SelectItem>
            <SelectItem value="asc">Oldest</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || filterPriority !== "all" || filterStatus !== "all") && (
          <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results indicator */}
      {searchResults && (
        <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
          {searchResults}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.length}
            </div>
            <p className="text-xs text-slate-500">Active reports </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => !r.resolved_status).length}
            </div>
            <p className="text-xs text-slate-500">Under investigation (active reports)</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.resolved_status).length}
            </div>
            <p className="text-xs text-slate-500">
              {Math.round((reports.filter((r) => r.resolved_status).length / Math.max(reports.length, 1)) * 100)}% resolution rate (active reports)
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.priority_breakdown?.HIGH || 
               reports.filter((r) => r.priority === "HIGH" || r.priority === "CRITICAL").length}
            </div>
            <p className="text-xs text-slate-500">Urgent investigations</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>National Reports ({reports.length})</CardTitle>
          <CardDescription>Whistleblowing reports submitted by citizens across Sri Lanka</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading reports...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedReports().map((report) => (
                  <TableRow key={report.report_id}>
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <p className="font-semibold">{report.report_title}</p>
                        {report.description && (
                          <p className="text-sm text-slate-500 truncate">{report.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(report.priority)} variant="secondary">
                        {formatPriority(report.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.resolved_status)} variant="secondary">
                        {report.resolved_status ? "Resolved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Assign to..."
                            value={assignmentInputs[report.report_id] || ''}
                            onChange={(e) => handleAssignmentInputChange(report.report_id, e.target.value)}
                            className="text-sm"
                            disabled={assigningReports[report.report_id]}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignReport(report.report_id)}
                          disabled={assigningReports[report.report_id] || 
                            assignmentInputs[report.report_id] === (report.assigned_to || '')}
                          className="whitespace-nowrap"
                        >
                          {assigningReports[report.report_id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : assignmentInputs[report.report_id]?.trim() ? (
                            <UserCheck className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {report.assigned_to && (
                        <p className="text-xs text-slate-500 mt-1">
                          Currently: {report.assigned_to}
                        </p>
                      )}
                    </TableCell>
  
                    <TableCell>{formatDate(report.created_time)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleResolve(report.report_id, report.resolved_status)}
                          disabled={resolvingReports[report.report_id]}
                          className={report.resolved_status 
                            ? "text-orange-600 hover:text-orange-700" 
                            : "text-green-600 hover:text-green-700"
                          }
                        >
                          {resolvingReports[report.report_id] ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : report.resolved_status ? (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {resolvingReports[report.report_id] 
                            ? "Processing..." 
                            : report.resolved_status 
                              ? "Mark as Pending" 
                              : "Mark as Resolved"
                          }
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveReport(report.report_id)}
                          disabled={
                            deletingId === report.report_id || loading || !isConnected || !verified
                          }
                          title={deletingId === report.report_id ? "Removing..." : "Remove report"}
                        >
                          {deletingId === report.report_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                        {report.resolved_status && report.resolved_time && (
                          <div className="text-xs text-slate-500 self-center">
                            Resolved on {formatDate(report.resolved_time)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      No reports found. {searchTerm || filterPriority !== "all" || filterStatus !== "all" 
                        ? "Try adjusting your search criteria." 
                        : "Reports will appear here when submitted by citizens."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {reports.length > 0 && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / pageSize)}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
