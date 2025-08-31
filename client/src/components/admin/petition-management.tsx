"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Progress } from "@/components/ui/progress"
import { Search, Calendar, Loader2, X, MessageSquare, Users, TrendingUp } from "lucide-react"
import { petitionService, type Petition as PetitionType, type PetitionStatistics } from "@/services/petition"
import { useRef } from "react"
import { petitionActivityService } from "@/services/petition-activity"
import { useToast } from "@/hooks/use-toast"

export function PetitionManagement() {
  const [petitions, setPetitions] = useState<PetitionType[]>([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<PetitionStatistics["data"] | null>(null)
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState<"title" | "created_at" | "signature_count">("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [searchResults, setSearchResults] = useState<string>("")
  const [signatureCounts, setSignatureCounts] = useState<Record<number, number>>({})

  // For tracking which petition is being deleted
  const [deletingId, setDeletingId] = useState<number | null>(null)
  // Remove petition from database and update UI
  const handleRemovePetition = async (petitionId: number) => {
    if (!window.confirm("Are you sure you want to delete this petition? This action cannot be undone.")) return;
    setDeletingId(petitionId);
    try {
      setLoading(true);
      await petitionService.deletePetition(petitionId);
      setPetitions((prev) => prev.filter((p) => p.id !== petitionId));
      setTotalItems((prev) => prev - 1);
      setSignatureCounts((prev) => {
        const updated = { ...prev };
        delete updated[petitionId];
        return updated;
      });
      await loadStatistics();
      toast({
        title: "Success",
        description: "Petition has been removed successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to remove petition:", error);
      toast({
        title: "Error",
        description: "Failed to remove petition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeletingId(null);
    }
  };

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
      setPetitions(response.data)
      setTotalItems(response.data.length)
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
            .filter(activity => activity.activity_type === 'SIGNATURE')
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
      
      // Set the filtered petitions as the main display data
      setPetitions(response.data)
      setTotalItems(response.data.length)
      
      // Update search results indicator
      const activeFilters = []
      if (searchTerm) activeFilters.push(`keyword: "${searchTerm}"`)
      if (filterStatus !== "all") activeFilters.push(`status: ${filterStatus}`)
      
      if (activeFilters.length > 0) {
        setSearchResults(`Found ${response.data.length} petitions (filtered by ${activeFilters.join(', ')})`)
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
      return "bg-gray-100 text-gray-800";
    }
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "EXPIRED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  const formatStatus = (status: string | undefined | null) => {
    if (!status || typeof status !== "string") {
      return "Unknown";
    }
    return status.replace(/_/g, " ").split(" ").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(" ");
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
        <p className="text-slate-600">Manage citizen petitions across all provinces and districts</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search petitions by title or description..."
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
        <Select value={sortBy} onValueChange={(value: "title" | "created_at" | "signature_count") => setSortBy(value)}>
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
        <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
          {searchResults}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Petitions</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total_petitions || petitions.length}</div>
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
               petitions.filter((p) => (p.status?.toUpperCase() === "ACTIVE")).length}
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
              {formatNumber(statistics?.total_signatures || 
                Object.values(signatureCounts).reduce((sum, count) => sum + count, 0))}
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
               Math.round((petitions.filter((p) => p.status === "COMPLETED").length / Math.max(petitions.length, 1)) * 100)}%
            </div>
            <p className="text-xs text-slate-500">Completed petitions</p>
          </CardContent>
        </Card>
      </div>

      {/* Petitions Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>National Petitions ({petitions.length})</CardTitle>
          <CardDescription>Citizen petitions from across all provinces and districts</CardDescription>
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
        <TableCell className="font-medium max-w-xs">
          <div>
            <p className="font-semibold">{petition.title}</p>
            <p className="text-sm text-slate-500 truncate">{petition.description}</p>
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
        <TableCell>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleRemovePetition(petition.id)}
              disabled={deletingId === petition.id || loading}
            >
              {deletingId === petition.id ? "Removing..." : "Remove"}
            </Button>
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
