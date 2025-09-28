"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Calendar,
  Loader2,
  X,
  MessageSquare,
  Users,
  TrendingUp,
  AlertCircle,
  Trash2,
} from "lucide-react"
import {
  petitionService,
  type Petition as PetitionType,
  type PetitionStatistics,
} from "@/services/petition"
import { useRef } from "react"
import { petitionActivityService } from "@/services/petition-activity"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"
import { useAppKitAccount } from "@reown/appkit/react"

export function PetitionManagement() {
  // Environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
  const BALLERINA_BASE_URL = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || "http://localhost:8080"

  const [petitions, setPetitions] = useState<PetitionType[]>([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<PetitionStatistics["data"] | null>(null)
  const { toast } = useToast()
  const { address, isConnected } = useAppKitAccount()
  const { verified } = useAuth()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState<"title" | "created_at" | "signature_count">("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [searchResults, setSearchResults] = useState<string>("")
  const [signatureCounts, setSignatureCounts] = useState<Record<number, number>>({})

  // For tracking which petition is being deleted
  const [deletingId, setDeletingId] = useState<number | null>(null)

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
        toast({
          title: "Account Access Required",
          description: "Please approve wallet connection in MetaMask",
        })
        accounts = await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      } catch (requestError: any) {
        if (requestError.code === -32002) {
          throw new Error(
            "MetaMask is already processing a connection request. Please check your MetaMask extension and try again."
          )
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
      throw new Error(
        `Account mismatch. Please switch to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} in MetaMask`
      )
    }
  }

  // Remove petition from blockchain and database
  const handleRemovePetition = async (petitionId: number) => {
    // Check wallet connection
    if (!isConnected) {
      toast({
        title: "🔗 Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!verified) {
      toast({
        title: "❌ Verification Required",
        description: "Please verify your wallet to remove petitions.",
        variant: "destructive",
      })
      return
    }

    setDeletingId(petitionId)

    try {
      await validateWallet(address!)

      // Get contract info for blockchain transaction
      const infoRes = await fetch(`${API_BASE_URL}/petition/contract-info`)
      if (!infoRes.ok) throw new Error("Failed to fetch contract info")
      const info = await infoRes.json()
      const { contractAddress, contractAbi } = info
      if (!contractAddress || !contractAbi) throw new Error("Contract info missing")

      toast({
        title: "🔐 Please confirm the transaction in your wallet",
      })

      // Send blockchain transaction
      const ethers = await import("ethers")
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      const tx = await contract.removePetition(petitionId)
      toast({ title: `📤 Transaction sent: ${tx.hash.slice(0, 10)}...` })

      const receipt = await tx.wait()
      toast({ title: `✅ Petition removed from blockchain in block ${receipt.blockNumber}` })

      // Update database after successful blockchain transaction
      try {
        const dbUpdateResp = await fetch(`${BALLERINA_BASE_URL}/petitions/${petitionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            removed: true,
          }),
        })

        if (!dbUpdateResp.ok) {
          console.error("Database update failed:", await dbUpdateResp.text())
          toast({
            title: "⚠️ Blockchain updated but database sync failed",
            description: "The petition was removed from blockchain but database sync failed",
            variant: "destructive",
          })
        } else {
          toast({ title: "✅ Petition removed from blockchain and database" })
        }
      } catch (dbError: any) {
        console.error("Database update error:", dbError)
        toast({
          title: "⚠️ Blockchain updated but database sync failed",
          description: "The petition was removed from blockchain but database sync failed",
          variant: "destructive",
        })
      }

      // Remove from UI and reload data
      setPetitions((prev) => prev.filter((p) => p.id !== petitionId))
      setTotalItems((prev) => prev - 1)
      setSignatureCounts((prev) => {
        const updated = { ...prev }
        delete updated[petitionId]
        return updated
      })
      await loadStatistics()
    } catch (error: any) {
      console.error("Petition removal failed:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorMessage?.includes("User rejected") || (error as any)?.code === 4001) {
        toast({ title: "Transaction cancelled by user.", variant: "destructive" })
      } else if (errorMessage?.includes("insufficient funds")) {
        toast({ title: "Insufficient funds to complete the transaction.", variant: "destructive" })
      } else {
        toast({ title: `❌ Failed to remove petition: ${errorMessage}`, variant: "destructive" })
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  const petitionStatuses = ["ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"]

  // Debounced search function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      handleSearch()
    }, 300),
    [searchTerm, filterStatus, sortBy, sortOrder]
  )

  // Load petitions and statistics
  useEffect(() => {
    loadPetitions()
    loadStatistics()
  }, [])

  // Load signature counts after petitions are loaded
  useEffect(() => {
    if (petitions.length > 0) {
      loadSignatureCounts()
    }
  }, [petitions])

  // Apply filters when search term or filters change
  useEffect(() => {
    debouncedSearch()
  }, [searchTerm, filterStatus, sortBy, sortOrder, debouncedSearch])

  const loadPetitions = async () => {
    try {
      setLoading(true)
      const response = await petitionService.getAllPetitions()
      // Filter out removed petitions
      const activePetitions = response.data.filter((petition) => !petition.removed)
      setPetitions(activePetitions)
      setTotalItems(activePetitions.length)
    } catch (error) {
      console.error("Failed to load petitions:", error)
      toast({
        title: "Error",
        description: "Failed to load petitions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await petitionService.getPetitionStatistics()
      setStatistics(response.data)
    } catch (error) {
      console.error("Failed to load statistics:", error)
    }
  }

  const loadSignatureCounts = async () => {
    try {
      const counts: Record<number, number> = {}
      // Load signature counts for all current petitions
      const currentPetitions = petitions
      if (currentPetitions.length === 0) return

      for (const petition of currentPetitions) {
        try {
          const response = await petitionActivityService.getActivitiesByPetitionId(petition.id)
          // Sum up signature counts from activities
          const totalSignatures = response.data
            .filter((activity) => activity.activity_type === "SIGNATURE")
            .reduce((sum, activity) => sum + activity.signature_count, 0)
          counts[petition.id] = totalSignatures
        } catch (error) {
          console.error(`Failed to load signatures for petition ${petition.id}:`, error)
          counts[petition.id] = petition.signature_count || 0
        }
      }
      setSignatureCounts(counts)
    } catch (error) {
      console.error("Failed to load signature counts:", error)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)

      // Use advanced search with filters - this will handle all cases including empty filters
      const response = await petitionService.searchPetitionsAdvanced({
        keyword: searchTerm || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        sortBy,
        sortOrder,
      })

      // Filter out removed petitions and set as main display data
      const activePetitions = response.data.filter((petition) => !petition.removed)
      setPetitions(activePetitions)
      setTotalItems(activePetitions.length)

      // Update search results indicator
      const activeFilters = []
      if (searchTerm) activeFilters.push(`keyword: "${searchTerm}"`)
      if (filterStatus !== "all") activeFilters.push(`status: ${filterStatus}`)

      if (activeFilters.length > 0) {
        setSearchResults(
          `Found ${response.data.length} petitions (filtered by ${activeFilters.join(", ")})`
        )
      } else {
        setSearchResults(`Showing all ${response.data.length} petitions`)
      }
    } catch (error) {
      console.error("Search failed:", error)
      toast({
        title: "Error",
        description: "Search failed. Please try again.",
        variant: "destructive",
      })
      // On error, clear results
      setPetitions([])
      setSearchResults("Search failed")
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilterStatus("all")
    setSortBy("created_at")
    setSortOrder("desc")
    setSearchResults("")
  }

  const getStatusColor = (status: string | undefined | null) => {
    if (!status || typeof status !== "string") {
      return "bg-gray-100 text-gray-800"
    }
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "EXPIRED":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (status: string | undefined | null) => {
    if (!status || typeof status !== "string") {
      return "Unknown"
    }
    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Get signature count for a petition from the loaded data
  const getSignatureCount = (petitionId: number) => {
    return signatureCounts[petitionId] || 0
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  // Get paginated data
  const getPaginatedPetitions = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return petitions.slice(startIndex, endIndex)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">National Petition Management</h2>
        <p className="text-slate-600">
          Manage Citizen Petitions Across All Provinces And Districts
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
          <Input
            placeholder="Search petitions by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 transform text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {petitionStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {formatStatus(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value: "title" | "created_at" | "signature_count") => setSortBy(value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="signature_count">Signatures</SelectItem>
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
        {(searchTerm || filterStatus !== "all") && (
          <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results indicator */}
      {searchResults && (
        <div className="rounded bg-slate-50 p-2 text-sm text-slate-600">{searchResults}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Petitions</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.total_petitions || petitions.length}
            </div>
            <p className="text-xs text-slate-500">All time</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Petitions</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.status_breakdown?.ACTIVE ||
                petitions.filter((p) => p.status?.toUpperCase() === "ACTIVE").length}
            </div>
            <p className="text-xs text-slate-500">Currently collecting signatures</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signatures</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(
                statistics?.total_signatures ||
                  Object.values(signatureCounts).reduce((sum, count) => sum + count, 0)
              )}
            </div>
            <p className="text-xs text-slate-500">Citizen participation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.completion_rate_percentage?.toFixed(0) ||
                Math.round(
                  (petitions.filter((p) => p.status === "COMPLETED").length /
                    Math.max(petitions.length, 1)) *
                    100
                )}
              %
            </div>
            <p className="text-xs text-slate-500">Completed petitions</p>
          </CardContent>
        </Card>
      </div>

      {/* Petitions Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>National Petitions ({petitions.length})</CardTitle>
          <CardDescription>
            Citizen petitions from across all provinces and districts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading petitions...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Petition Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedPetitions().map((petition) => {
                  const currentSignatures = getSignatureCount(petition.id)
                  const requiredSignatures = petition.required_signature_count
                  const progress = Math.min((currentSignatures / requiredSignatures) * 100, 100)

                  // Determine display status - show "completed" if progress is 100%
                  const displayStatus = progress >= 100 ? "COMPLETED" : petition.status

                  return (
                    <TableRow key={petition.id}>
                      <TableCell className="max-w-xs font-medium">
                        <div>
                          <p className="font-semibold">{petition.title}</p>
                          <p className="truncate text-sm text-slate-500">{petition.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(displayStatus)} variant="secondary">
                          {formatStatus(displayStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{formatNumber(currentSignatures)}</span>
                            <span>{formatNumber(requiredSignatures)}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-slate-500">{progress.toFixed(1)}% complete</p>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(petition.created_at).toLocaleDateString()}</TableCell>

                      {/* Remove Button */}
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemovePetition(petition.id)}
                            disabled={
                              deletingId === petition.id || loading || !isConnected || !verified
                            }
                            title={deletingId === petition.id ? "Removing..." : "Remove petition"}
                          >
                            {deletingId === petition.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {petitions.length > 0 && (
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
