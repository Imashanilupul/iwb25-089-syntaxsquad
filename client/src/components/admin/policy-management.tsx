"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, FileText, MessageSquare, Eye, Search, Loader2, X } from "lucide-react"
import { policyService, type Policy as PolicyType, type CreatePolicyData, type PolicyStatistics } from "@/services/policy"
import { policyCommentService } from "@/services/policy-comment"
import { useToast } from "@/hooks/use-toast"

interface Policy {
  id: number
  name: string
  description: string
  viewFullPolicy: string
  ministry: string
  createdTime: string
  commentCount: number
  status: string
}

export function PolicyManagement() {
  const [policies, setPolicies] = useState<PolicyType[]>([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<PolicyStatistics["data"] | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    view_full_policy: "",
    ministry: "",
    status: "DRAFT",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMinistry, setFilterMinistry] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState<"name" | "created_time" | "ministry">("created_time")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [searchResults, setSearchResults] = useState<string>("")
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({})

  const ministries = [
    "Ministry of Technology",
    "Ministry of Education",
    "Ministry of Health",
    "Ministry of Environment",
    "Ministry of Finance",
    "Ministry of Transport",
    "Ministry of Agriculture",
    "Ministry of Defense",
    "Ministry of Justice",
    "Ministry of Foreign Affairs",
    "Ministry of Trade",
    "Ministry of Tourism",
    "Ministry of Energy",
    "Ministry of Water Supply",
    "Ministry of Urban Development",
    "Ministry of Rural Development",
    "Ministry of Women and Child Affairs",
    "Ministry of Youth and Sports",
    "Ministry of Cultural Affairs",
    "Ministry of Labour",
    "Ministry of Industries",
    "Ministry of Fisheries",
    "Ministry of Livestock",
    "Ministry of Plantation Industries",
    "Ministry of Public Administration",
    "Ministry of Provincial Councils",
    "Ministry of Parliamentary Affairs",
    "Ministry of Mass Media",
  ]

  const policyStatuses = ["DRAFT", "UNDER_REVIEW", "PUBLIC_CONSULTATION", "APPROVED", "ACTIVE", "INACTIVE", "ARCHIVED"]

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
    [searchTerm, filterMinistry, filterStatus, sortBy, sortOrder]
  )

  // Load policies and statistics
  useEffect(() => {
    loadPolicies()
    loadStatistics()
  }, [])

  // Load comment counts after policies are loaded
  useEffect(() => {
    if (policies.length > 0) {
      loadCommentCounts()
    }
  }, [policies])

  // Apply filters when search term or filters change
  useEffect(() => {
    debouncedSearch()
  }, [searchTerm, filterMinistry, filterStatus, sortBy, sortOrder, debouncedSearch])

  const loadPolicies = async () => {
    try {
      setLoading(true)
      const response = await policyService.getAllPolicies()
      setPolicies(response.data)
    } catch (error) {
      console.error("Failed to load policies:", error)
      toast({
        title: "Error",
        description: "Failed to load policies. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await policyService.getPolicyStatistics()
      setStatistics(response.data)
    } catch (error) {
      console.error("Failed to load statistics:", error)
    }
  }

  const loadCommentCounts = async () => {
    try {
      const counts: Record<number, number> = {}
      // Load comment counts for all current policies
      const currentPolicies = policies
      if (currentPolicies.length === 0) return
      
      for (const policy of currentPolicies) {
        try {
          const response = await policyCommentService.getCommentsByPolicyId(policy.id)
          counts[policy.id] = response.data.length
        } catch (error) {
          console.error(`Failed to load comments for policy ${policy.id}:`, error)
          counts[policy.id] = 0
        }
      }
      setCommentCounts(counts)
    } catch (error) {
      console.error("Failed to load comment counts:", error)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      
      // Use advanced search with filters - this will handle all cases including empty filters
      const response = await policyService.searchPoliciesAdvanced({
        keyword: searchTerm || undefined,
        ministry: filterMinistry !== "all" ? filterMinistry : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        sortBy,
        sortOrder,
      })
      
      // Set the filtered policies as the main display data
      setPolicies(response.data)
      
      // Update search results indicator
      const activeFilters = []
      if (searchTerm) activeFilters.push(`keyword: "${searchTerm}"`)
      if (filterMinistry !== "all") activeFilters.push(`ministry: ${filterMinistry}`)
      if (filterStatus !== "all") activeFilters.push(`status: ${filterStatus}`)
      
      if (activeFilters.length > 0) {
        setSearchResults(`Found ${response.data.length} policies (filtered by ${activeFilters.join(', ')})`)
      } else {
        setSearchResults(`Showing all ${response.data.length} policies`)
      }
      
    } catch (error) {
      console.error("Search failed:", error)
      toast({
        title: "Error",
        description: "Search failed. Please try again.",
        variant: "destructive",
      })
      // On error, clear results
      setPolicies([])
      setSearchResults("Search failed")
    } finally {
      setLoading(false)
    }
  }

  const applySorting = (data: PolicyType[]) => {
    return [...data].sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created_time':
          aValue = new Date(a.created_time).getTime()
          bValue = new Date(b.created_time).getTime()
          break
        case 'ministry':
          aValue = a.ministry.toLowerCase()
          bValue = b.ministry.toLowerCase()
          break
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1
      }
      return aValue > bValue ? 1 : -1
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilterMinistry("all")
    setFilterStatus("all")
    setSortBy("created_time")
    setSortOrder("desc")
    setSearchResults("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const policyData: CreatePolicyData = {
        name: formData.name,
        description: formData.description,
        view_full_policy: formData.view_full_policy,
        ministry: formData.ministry,
        status: formData.status,
      }

      if (editingId) {
        // Update existing policy
        await policyService.updatePolicy(editingId, policyData)
        toast({
          title: "Success",
          description: "Policy updated successfully.",
        })
      } else {
        // Create new policy
        await policyService.createPolicy(policyData)
        toast({
          title: "Success",
          description: "Policy created successfully.",
        })
      }

      // Reset form and reload data
      setFormData({
        name: "",
        description: "",
        view_full_policy: "",
        ministry: "",
        status: "DRAFT",
      })
      setEditingId(null)
      setIsDialogOpen(false)
      loadPolicies()
      loadStatistics()
    } catch (error) {
      console.error("Submit failed:", error)
      toast({
        title: "Error",
        description: editingId ? "Failed to update policy." : "Failed to create policy.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (policy: PolicyType) => {
    setFormData({
      name: policy.name,
      description: policy.description,
      view_full_policy: policy.view_full_policy,
      ministry: policy.ministry,
      status: policy.status,
    })
    setEditingId(policy.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this policy?")) {
      return
    }

    try {
      await policyService.deletePolicy(id)
      toast({
        title: "Success",
        description: "Policy deleted successfully.",
      })
      loadPolicies()
      loadStatistics()
    } catch (error) {
      console.error("Delete failed:", error)
      toast({
        title: "Error",
        description: "Failed to delete policy.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800"
      case "PUBLIC_CONSULTATION":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800"
      case "INACTIVE":
      case "ARCHIVED":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (status: string) => {
    return status.replace("_", " ").split(" ").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(" ")
  }

  // Get real comment count for a policy from the loaded data
  const getCommentCount = (policyId: number) => {
    return commentCounts[policyId] || 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">National Policy Management</h2>
          <p className="text-slate-600">Manage government policies across all ministries and provinces</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({
                  name: "",
                  description: "",
                  view_full_policy: "",
                  ministry: "",
                  status: "DRAFT",
                })
                setEditingId(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Policy" : "Add New Policy"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the policy details" : "Create a new government policy"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Digital Sri Lanka Strategy 2030"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Comprehensive description of the policy..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ministry">Ministry</Label>
                  <Select
                    value={formData.ministry}
                    onValueChange={(value) => setFormData({ ...formData, ministry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ministry" />
                    </SelectTrigger>
                    <SelectContent>
                      {ministries.map((ministry) => (
                        <SelectItem key={ministry} value={ministry}>
                          {ministry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {policyStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatStatus(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="view_full_policy">Policy Document URL</Label>
                <Input
                  id="view_full_policy"
                  placeholder="https://gov.lk/policies/policy-document.pdf"
                  value={formData.view_full_policy}
                  onChange={(e) => setFormData({ ...formData, view_full_policy: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Update Policy" : "Add Policy"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search policies by name or description..."
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
        <Select value={filterMinistry} onValueChange={setFilterMinistry}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by ministry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ministries</SelectItem>
            {ministries.map((ministry) => (
              <SelectItem key={ministry} value={ministry}>
                {ministry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {policyStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {formatStatus(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: "name" | "created_time" | "ministry") => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_time">Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="ministry">Ministry</SelectItem>
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
        {(searchTerm || filterMinistry !== "all" || filterStatus !== "all") && (
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
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalPolicies || policies.length}</div>
            <p className="text-xs text-slate-500">Across all ministries</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Consultation</CardTitle>
            <MessageSquare className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.statusCounts?.PUBLIC_CONSULTATION || 
               policies.filter((p) => p.status.toUpperCase() === "PUBLIC_CONSULTATION").length}
            </div>
            <p className="text-xs text-slate-500">Open for comments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.reduce((sum, policy) => sum + getCommentCount(policy.id), 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Public engagement</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ministries</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics ? Object.keys(statistics.ministryCounts).length : 
               new Set(policies.map((p) => p.ministry)).size}
            </div>
            <p className="text-xs text-slate-500">With active policies</p>
          </CardContent>
        </Card>
      </div>

      {/* Policies Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>National Policies ({policies.length})</CardTitle>
          <CardDescription>Government policies across all ministries and departments</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading policies...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Name</TableHead>
                  <TableHead>Ministry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <p className="font-semibold">{policy.name}</p>
                        <p className="text-sm text-slate-500 truncate">{policy.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{policy.ministry.replace("Ministry of ", "")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(policy.status)} variant="secondary">
                        {formatStatus(policy.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getCommentCount(policy.id).toLocaleString()}</TableCell>
                    <TableCell>{new Date(policy.created_time).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => window.open(policy.view_full_policy, '_blank')}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(policy)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(policy.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
