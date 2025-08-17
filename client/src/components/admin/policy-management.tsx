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
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Plus, Edit, Trash2, FileText, MessageSquare, Eye, Search, Loader2, X, Wallet, AlertCircle } from "lucide-react"
import { policyService, type Policy as PolicyType, type CreatePolicyData, type PolicyStatistics, type PaginationMeta } from "@/services/policy"
import { policyCommentService } from "@/services/policy-comment"
import { useToast } from "@/hooks/use-toast"
import { MinistryInput } from "@/components/ui/ministry-input"
import { useAuth } from "@/context/AuthContext"
import { useAppKitAccount } from "@reown/appkit/react"
import { ConnectButton } from "@/components/walletConnect/wallet-connect"

export function PolicyManagement() {
  const [policies, setPolicies] = useState<PolicyType[]>([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<PolicyStatistics["statistics"] | null>(null)
  const [ministries, setMinistries] = useState<string[]>([])
  const [loadingMinistries, setLoadingMinistries] = useState(false)
  const { toast } = useToast()
  const { address, isConnected } = useAppKitAccount()
  const { verified } = useAuth()

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

  // Blockchain integration state
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)

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
    loadMinistries()
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

  const loadMinistries = async () => {
    try {
      setLoadingMinistries(true)
      const uniqueMinistries = await policyService.getUniqueMinistries()
      setMinistries(uniqueMinistries)
    } catch (error) {
      console.error("Failed to load ministries:", error)
      toast({
        title: "Error",
        description: "Failed to load ministries. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingMinistries(false)
    }
  }

  const loadPolicies = async (page: number = currentPage, limit: number = pageSize) => {
    try {
      setLoading(true)
      const response = await policyService.getAllPolicies(page, limit)
      setPolicies(response.data)
      if (response.pagination) {
        setPagination(response.pagination)
      }
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
      setStatistics(response.statistics)
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
      
      // Reset pagination when searching
      setCurrentPage(1)
      setPagination(null)
      
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
    setCurrentPage(1)
    // Reload with pagination
    loadPolicies(1, pageSize)
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
        toast({
          title: "Account Access Required",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple simultaneous requests for policy creation
    if (!editingId && isCreatingPolicy) {
      toast({
        title: "⏳ Policy creation is already in progress",
        description: "Please wait for the current process to complete"
      })
      return
    }

    // Check wallet connection for new policy creation
    if (!editingId && !isConnected) {
      toast({
        title: "🔗 Please connect your wallet first using the Connect button",
        variant: "destructive"
      })
      return
    }

    if (!editingId && isConnected && !verified) {
      toast({
        title: "❌ Verification Required",
        description: "Please verify your wallet to create new policies.",
        variant: "destructive"
      })
      return
    }

    // Validate wallet address format for new policies
    if (!editingId && address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast({
        title: "❌ Invalid wallet address format",
        description: "Please reconnect your wallet.",
        variant: "destructive"
      })
      return
    }

    // Validate form data
    if (!formData.name || !formData.description || !formData.view_full_policy || !formData.ministry) {
      toast({
        title: "📝 Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (editingId) {
      // Handle policy update (existing logic)
      try {
        const policyData: CreatePolicyData = {
          name: formData.name,
          description: formData.description,
          view_full_policy: formData.view_full_policy,
          ministry: formData.ministry,
          status: formData.status,
        }

        await policyService.updatePolicy(editingId, policyData)
        toast({
          title: "✅ Success",
          description: "Policy updated successfully."
        })

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
        loadPolicies(currentPage, pageSize)
        loadStatistics()
        loadMinistries()
      } catch (error) {
        console.error("Update failed:", error)
        toast({
          title: "❌ Failed to update policy",
          variant: "destructive"
        })
      }
      return
    }

    // Handle new policy creation with blockchain integration
    setIsCreatingPolicy(true)
    setLastError(null)
    
    try {
      await validateWallet(address!)

      const timestamp = new Date().toISOString()
      const effectiveDate = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days from now
      
      const message = `� CREATE POLICY CONFIRMATION

Name: ${formData.name}

Description: ${formData.description}

Ministry: ${formData.ministry}

Status: ${formData.status}

Wallet: ${address}
Timestamp: ${timestamp}

⚠️ By signing this message, you confirm that you want to create this policy on the blockchain. This action cannot be undone.`

      toast({
        title: "🔐 Please check your wallet to sign the policy creation request"
      })

      let signature
      try {
        signature = await (window.ethereum as any).request({
          method: "personal_sign",
          params: [message, address]
        })
      } catch (error: any) {
        if (error.code === 4001) throw new Error("User rejected the signature request")
        throw new Error(`Signature failed: ${error.message || error}`)
      }

      if (!signature) throw new Error("No signature received from wallet")

      toast({
        title: "✅ Signature confirmed - creating policy on blockchain..."
      })

      // Save to Ballerina backend first to get draft ID
      const ballerinaResp = await fetch("http://localhost:8080/api/policies", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name, 
          description: formData.description,
          view_full_policy: formData.view_full_policy,
          ministry: formData.ministry,
          status: formData.status,
          creator_address: address
        })
      })

      if (!ballerinaResp.ok) {
        const txt = await ballerinaResp.text()
        throw new Error(`Failed to create draft: ${ballerinaResp.status} ${txt}`)
      }

      const ballerinaData = await ballerinaResp.json()
      const draftId = ballerinaData?.data?.id || ballerinaData?.id || ballerinaData?.policy?.id
      if (!draftId) throw new Error("Could not determine draftId from Ballerina response")

      // Prepare IPFS + contract info
      const prepRes = await fetch("http://localhost:3001/policy/prepare-policy", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formData.name, 
          description: formData.description,
          viewFullPolicy: formData.view_full_policy,
          ministry: formData.ministry,
          effectiveDate: effectiveDate,
          walletAddress: address,
          draftId: draftId
        })
      })

      if (!prepRes.ok) {
        const txt = await prepRes.text()
        throw new Error(`Prepare failed: ${prepRes.status} ${txt}`)
      }

      const prepJson = await prepRes.json()
      const { descriptionCid, contractAddress, contractAbi } = prepJson
      if (!descriptionCid || !contractAddress || !contractAbi) {
        throw new Error("Prepare endpoint did not return all required fields")
      }

      toast({
        title: "🔐 Please confirm the transaction in your wallet"
      })

      // Send blockchain transaction
      const ethers = await import("ethers")
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      const tx = await contract.createPolicy(
        formData.name,
        descriptionCid,
        formData.view_full_policy,
        formData.ministry,
        effectiveDate
      )
      toast({
        title: `📤 Transaction sent: ${tx.hash.slice(0, 10)}...`
      })

      const receipt = await tx.wait()
      toast({
        title: `✅ Transaction confirmed in block ${receipt.blockNumber}`
      })

      // Try to get blockchain policy ID
      let blockchainPolicyId = null
      try {
        const iface = new (ethers as any).Interface(contractAbi)
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log)
            if (parsed && parsed.name && parsed.name.toLowerCase().includes("policy")) {
              blockchainPolicyId = parsed.args?.[0]?.toString() || null
              break
            }
          } catch (e) {}
        }
        if (!blockchainPolicyId) {
          try {
            const bn = await contract.policyCount()
            blockchainPolicyId = bn.toString()
          } catch (e) {}
        }
      } catch (e) {
        console.warn("Could not parse event for policy id", e)
      }

      // Confirm with backend
      try {
        await fetch(`http://localhost:8080/api/policies/${draftId}/confirm`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: tx.hash, 
            blockNumber: receipt.blockNumber, 
            blockchainPolicyId,
            descriptionCid
          })
        })
      } catch (err) {
        console.log(err)
      }

      toast({
        title: "🎉 Policy created: Saved to blockchain and backend"
      })

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
      loadPolicies(currentPage, pageSize)
      loadStatistics()
      loadMinistries()

    } catch (error: any) {
      console.error("Failed create flow:", error)
      setLastError(error?.message || String(error))
      toast({
        title: `❌ Failed to create policy: ${error?.message || "Unknown error"}`,
        variant: "destructive"
      })
    } finally {
      setIsCreatingPolicy(false)
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
      loadPolicies(currentPage, pageSize)
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

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadPolicies(page, pageSize)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
    loadPolicies(1, size)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">National Policy Management</h2>
          <p className="text-slate-600">Manage government policies across all ministries and provinces</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Wallet Status */}
          {isConnected ? (
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-blue-600" />
              <span className="text-slate-700">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <Badge variant={verified ? "default" : "secondary"} className="text-xs">
                {verified ? "Verified" : "Unverified"}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ConnectButton />
            </div>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={!isConnected || !verified}
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

              {/* Wallet Connection Alerts inside Dialog */}
              {!isConnected && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-amber-800">Wallet Connection Required</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Connect your wallet to create and manage policies on the blockchain.
                      </p>
                    </div>
                    <div className="ml-4">
                      <ConnectButton />
                    </div>
                  </div>
                </div>
              )}

              {isConnected && !verified && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-800">Wallet Verification Required</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Your wallet is connected but needs verification to create policies. 
                        Please complete the verification process.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                    <MinistryInput
                      value={formData.ministry}
                      onChange={(value) => setFormData({ ...formData, ministry: value })}
                      ministries={ministries}
                      placeholder="Type or select ministry..."
                      required
                    />
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

                {/* Error Display */}
                {lastError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium text-red-800">Policy Creation Failed</h3>
                        <p className="text-sm text-red-700 mt-1">{lastError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isCreatingPolicy || (!editingId && (!isConnected || !verified))}
                  >
                    {isCreatingPolicy ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Policy...
                      </>
                    ) : editingId ? (
                      "Update Policy"
                    ) : (
                      "Add Policy"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isCreatingPolicy}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
            <div className="text-2xl font-bold">{statistics?.total_policies || policies.length}</div>
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
              {statistics?.status_distribution?.PUBLIC_CONSULTATION || 
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
              {statistics ? Object.keys(statistics.ministry_distribution).length : 
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
          
          {/* Pagination */}
          {pagination && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              pageSize={pageSize}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

