"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Vote, Calendar, Users, Loader2, Wallet, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { proposalService, type Proposal, type ProposalFormData } from "@/services/proposal"
import { categoryService, type Category } from "@/services/category"
import { useAuth } from "@/context/AuthContext"
import { useAppKitAccount } from "@reown/appkit/react"
import { ConnectButton } from "@/components/walletConnect/wallet-connect"

export function ProposalManagement() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { address, isConnected } = useAppKitAccount()
  const { verified } = useAuth()

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    descriptionInDetails: "",
    activeStatus: true,
    expiredDate: "",
    yesVotes: "",
    noVotes: "",
    categoryId: "",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Blockchain integration state
  const [isCreatingProposal, setIsCreatingProposal] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Computed values
  const canSubmit = isConnected && verified && !isCreatingProposal

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  // Get paginated data
  const getPaginatedProposals = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return proposals.slice(startIndex, endIndex)
  }

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [proposalsResponse, categoriesResponse] = await Promise.all([
        // Get proposals from database (for UI list)
        proposalService.getAllProposals(),
        categoryService.getAllCategories(),
      ])

      if (proposalsResponse.success) {
        setProposals(proposalsResponse.data)
        setTotalItems(proposalsResponse.data.length)
      } else {
        toast({
          title: "Error",
          description: "Failed to load proposals",
          variant: "destructive",
        })
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
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

    // Prevent multiple simultaneous requests for proposal creation
    if (!editingId && isCreatingProposal) {
      toast({
        title: "⏳ Proposal creation is already in progress",
        description: "Please wait for the current process to complete"
      })
      return
    }

    // Check wallet connection for new proposal creation
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
        description: "Please verify your wallet to create new proposals.",
        variant: "destructive"
      })
      return
    }

    // Validate wallet address format for new proposals
    if (!editingId && address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast({
        title: "❌ Invalid wallet address format",
        description: "Please reconnect your wallet.",
        variant: "destructive"
      })
      return
    }

    // Validate form data
    if (!formData.title || !formData.shortDescription || !formData.descriptionInDetails || !formData.categoryId || !formData.expiredDate) {
      toast({
        title: "📝 Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (editingId) {
      // Handle proposal edit using smart contract API
      try {
        await validateWallet(address!)

        const editRes = await fetch("http://localhost:3001/proposal/edit-proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalId: editingId,
            newStatus: formData.activeStatus,
            signerIndex: 0 // Using first signer for now, should be dynamic based on user
          })
        })

        if (!editRes.ok) {
          const errorText = await editRes.text()
          throw new Error(`Edit failed: ${editRes.status} - ${errorText}`)
        }

        const editData = await editRes.json()
        console.log("Edit successful:", editData)

        toast({
          title: "✅ Success",
          description: "Proposal status updated successfully on blockchain"
        })

        // Reset form and reload data
        setFormData({
          title: "",
          shortDescription: "",
          descriptionInDetails: "",
          activeStatus: true,
          expiredDate: "",
          yesVotes: "",
          noVotes: "",
          categoryId: "",
        })
        setEditingId(null)
        setIsDialogOpen(false)
        loadData()

      } catch (error: any) {
        console.error("Edit failed:", error)
        toast({
          title: "❌ Failed to update proposal",
          description: error.message || "Unknown error",
          variant: "destructive"
        })
      }
      return
    }

    // Handle new proposal creation with blockchain integration
    setIsCreatingProposal(true)
    setLastError(null)
    
    try {
      await validateWallet(address!)

      const timestamp = new Date().toISOString()
      const expiredTimestamp = Math.floor(new Date(formData.expiredDate).getTime() / 1000)
      
      const message = `🗳️ CREATE PROPOSAL CONFIRMATION

Title: ${formData.title}

Short Description: ${formData.shortDescription}

Category: ${categories.find(c => c.category_id.toString() === formData.categoryId)?.category_name || formData.categoryId}

Expiry Date: ${formData.expiredDate}

Wallet: ${address}
Timestamp: ${timestamp}

⚠️ By signing this message, you confirm that you want to create this proposal on the blockchain. This action cannot be undone.`

      toast({
        title: "🔐 Please check your wallet to sign the proposal creation request"
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
        title: "✅ Signature confirmed - creating proposal on blockchain..."
      })

      // Prepare IPFS + contract info from the prepare service (without draftId)
      const prepRes = await fetch("http://localhost:3001/proposal/prepare-proposal", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: formData.title, 
          shortDescription: formData.shortDescription,
          descriptionInDetails: formData.descriptionInDetails,
          categoryId: parseInt(formData.categoryId),
          expiredDate: expiredTimestamp,
          walletAddress: address
        })
      })

      if (!prepRes.ok) {
        const txt = await prepRes.text()
        throw new Error(`Prepare failed: ${prepRes.status} ${txt}`)
      }

      const prepJson = await prepRes.json()
      const { titleCid, shortDescriptionCid, descriptionInDetailsCid, contractAddress, contractAbi } = prepJson
      if (!titleCid || !shortDescriptionCid || !descriptionInDetailsCid || !contractAddress || !contractAbi) {
        throw new Error("Prepare endpoint did not return all required fields")
      }

      toast({
        title: "🔐 Please confirm the transaction in your wallet"
      })

      // Send blockchain transaction FIRST
      const ethers = await import("ethers")
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      const tx = await contract.createProposal(
        titleCid,
        shortDescriptionCid,
        descriptionInDetailsCid,
        parseInt(formData.categoryId),
        expiredTimestamp
      )
      toast({
        title: `📤 Transaction sent: ${tx.hash.slice(0, 10)}...`
      })

      const receipt = await tx.wait()
      toast({
        title: `✅ Transaction confirmed in block ${receipt.blockNumber}`
      })

      // Try to get blockchain proposal ID
      let blockchainProposalId = null
      try {
        const iface = new (ethers as any).Interface(contractAbi)
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log)
            if (parsed && parsed.name && parsed.name.toLowerCase().includes("proposal")) {
              blockchainProposalId = parsed.args?.[0]?.toString() || null
              break
            }
          } catch (e) {}
        }
        if (!blockchainProposalId) {
          try {
            const bn = await contract.proposalCount()
            blockchainProposalId = bn.toString()
          } catch (e) {}
        }
      } catch (e) {
        console.warn("Could not parse event for proposal id", e)
      }

      // Only save to database AFTER blockchain transaction succeeds
      toast({
        title: "📊 Saving proposal to database..."
      })

      try {
        const ballerinaResp = await fetch("http://localhost:8080/api/proposals", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title, 
            shortDescription: formData.shortDescription,
            descriptionInDetails: formData.descriptionInDetails,
            categoryId: parseInt(formData.categoryId),
            expiredDate: formData.expiredDate,
            activeStatus: formData.activeStatus,
            yesVotes: 0,
            noVotes: 0,
            blockchainTxHash: tx.hash,
            blockchainProposalId: blockchainProposalId,
            titleCid: titleCid,
            shortDescriptionCid: shortDescriptionCid,
            descriptionInDetailsCid: descriptionInDetailsCid
          })
        })

        if (!ballerinaResp.ok) {
          const errorText = await ballerinaResp.text()
          console.error(`Database save failed: ${ballerinaResp.status} - ${errorText}`)
          toast({
            title: "⚠️ Blockchain transaction successful, but database save failed",
            description: `Proposal created on blockchain (${blockchainProposalId || 'ID unknown'}) but couldn't save to database`,
            variant: "destructive"
          })
        } else {
          const ballerinaData = await ballerinaResp.json()
          console.log("Database save successful:", ballerinaData)
          toast({
            title: "🎉 Proposal created successfully",
            description: "Saved to blockchain and database"
          })
        }
      } catch (dbError: any) {
        console.error("Database save error:", dbError)
        toast({
          title: "⚠️ Blockchain transaction successful, but database save failed",
          description: `Proposal created on blockchain (${blockchainProposalId || 'ID unknown'}) but couldn't save to database: ${dbError.message}`,
          variant: "destructive"
        })
      }

      // Reset form and reload data
      setFormData({
        title: "",
        shortDescription: "",
        descriptionInDetails: "",
        activeStatus: true,
        expiredDate: "",
        yesVotes: "",
        noVotes: "",
        categoryId: "",
      })
      setEditingId(null)
      setIsDialogOpen(false)
      loadData()

    } catch (error: any) {
      console.error("Failed create flow:", error)
      setLastError(error?.message || String(error))
      toast({
        title: `❌ Failed to create proposal: ${error?.message || "Unknown error"}`,
        variant: "destructive"
      })
    } finally {
      setIsCreatingProposal(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      shortDescription: "",
      descriptionInDetails: "",
      activeStatus: true,
      expiredDate: "",
      yesVotes: "0", // Show 0 for new proposals
      noVotes: "0",  // Show 0 for new proposals
      categoryId: "",
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (proposal: Proposal) => {
    setFormData({
      title: proposal.title,
      shortDescription: proposal.short_description,
      descriptionInDetails: proposal.description_in_details,
      activeStatus: proposal.active_status,
      expiredDate: proposal.expired_date,
      yesVotes: proposal.yes_votes.toString(),
      noVotes: proposal.no_votes.toString(),
      categoryId: proposal.category_id?.toString() || "",
    })
    setEditingId(proposal.id)
    setIsDialogOpen(true)
  }

  // Note: Delete functionality removed as it's not available in the cleaned API
  // Only essential functions (create, edit status, vote, get) are supported

  const getStatusColor = (active: boolean, expiredDate: string) => {
    if (!active) return "bg-gray-100 text-gray-800"
    const isExpired = new Date(expiredDate) < new Date()
    if (isExpired) return "bg-red-100 text-red-800"
    return "bg-green-100 text-green-800"
  }

  const getStatusText = (active: boolean, expiredDate: string) => {
    if (!active) return "Inactive"
    const isExpired = new Date(expiredDate) < new Date()
    if (isExpired) return "Expired"
    return "Active"
  }

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "No Category"
    const category = categories.find((cat) => cat.category_id === categoryId)
    return category ? category.category_name : "Unknown Category"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading proposals...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Voting Proposals</h2>
          <p className="text-slate-600">Manage voting proposals and track results</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({
                  title: "",
                  shortDescription: "",
                  descriptionInDetails: "",
                  activeStatus: true,
                  expiredDate: "",
                  yesVotes: "0", // Show 0 for new proposals
                  noVotes: "0",  // Show 0 for new proposals
                  categoryId: "",
                })
                setEditingId(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Proposal" : "Add New Proposal"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the proposal details" : "Create a new voting proposal"}
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
                      Connect your wallet to create and manage proposals on the blockchain.
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
                      Your wallet is connected but needs verification to create proposals. 
                      Please complete the verification process.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {editingId && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-orange-800">Edit Mode - Status Only</h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Only the active status can be changed. Content fields are read-only for existing proposals.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Provincial Council Powers Amendment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={editingId !== null}
                  required
                  className={editingId ? "bg-gray-50 text-gray-600" : ""}
                />
                {editingId && <p className="text-xs text-gray-500">Content cannot be modified for existing proposals</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  placeholder="Brief summary of the proposal"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  disabled={editingId !== null}
                  required
                  className={editingId ? "bg-gray-50 text-gray-600" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionInDetails">Detailed Description</Label>
                <Textarea
                  id="descriptionInDetails"
                  placeholder="Comprehensive description of the proposal..."
                  value={formData.descriptionInDetails}
                  onChange={(e) => setFormData({ ...formData, descriptionInDetails: e.target.value })}
                  disabled={editingId !== null}
                  rows={4}
                  required
                  className={editingId ? "bg-gray-50 text-gray-600" : ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    disabled={editingId !== null}
                  >
                    <SelectTrigger className={editingId ? "bg-gray-50 text-gray-600" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id.toString()}>
                          {category.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiredDate">Expiry Date</Label>
                  <Input
                    id="expiredDate"
                    type="date"
                    value={formData.expiredDate}
                    onChange={(e) => setFormData({ ...formData, expiredDate: e.target.value })}
                    disabled={editingId !== null}
                    required
                    className={editingId ? "bg-gray-50 text-gray-600" : ""}
                  />
                </div>
              </div>
{/* 
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yesVotes">Yes Votes (Read-only)</Label>
                  <Input
                    id="yesVotes"
                    type="number"
                    placeholder={editingId ? "Current yes votes" : "0"}
                    value={formData.yesVotes}
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500">Vote counts are managed automatically and cannot be edited manually</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noVotes">No Votes (Read-only)</Label>
                  <Input
                    id="noVotes"
                    type="number"
                    placeholder={editingId ? "Current no votes" : "0"}
                    value={formData.noVotes}
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500">Vote counts are managed automatically and cannot be edited manually</p>
                </div>
              </div> */}

              <div className="flex items-center space-x-2">
                <Switch
                  id="activeStatus"
                  checked={formData.activeStatus}
                  onCheckedChange={(checked) => setFormData({ ...formData, activeStatus: checked })}
                />
                <Label htmlFor="activeStatus">
                  {editingId ? "Active Status (Smart Contract)" : "Active Status"}
                </Label>
                {editingId && (
                  <p className="text-xs text-gray-500 ml-2">
                    Changes will be written to the blockchain
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 min-w-[140px]"
                  disabled={!canSubmit}
                >
                  {isCreatingProposal ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Proposal...
                    </>
                  ) : editingId ? (
                    "Update Status on Blockchain"
                  ) : (
                    "Create Proposal on Blockchain"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <Vote className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposals.length}</div>
            <p className="text-xs text-slate-500">All proposals</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proposals.filter((p) => p.active_status && new Date(p.expired_date) > new Date()).length}
            </div>
            <p className="text-xs text-slate-500">Currently voting</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(proposals.reduce((sum, prop) => sum + prop.yes_votes + prop.no_votes, 0))}
            </div>
            <p className="text-xs text-slate-500">Across all proposals</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Participation</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(
                Math.round(proposals.reduce((sum, prop) => sum + prop.yes_votes + prop.no_votes, 0) / proposals.length),
              )}
            </div>
            <p className="text-xs text-slate-500">Votes per proposal</p>
          </CardContent>
        </Card>
      </div>

      {/* Proposals Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Proposals</CardTitle>
          <CardDescription>Voting proposals with current results and status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Yes Votes</TableHead>
                <TableHead>No Votes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getPaginatedProposals().map((proposal) => {
                const totalVotes = proposal.yes_votes + proposal.no_votes
                const yesPercentage = totalVotes > 0 ? Math.round((proposal.yes_votes / totalVotes) * 100) : 0

                return (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <p className="font-semibold">{proposal.title}</p>
                        <p className="text-sm text-slate-500 truncate">{proposal.short_description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryName(proposal.category_id)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-green-600">{formatNumber(proposal.yes_votes)}</span>
                        <span className="text-xs text-slate-500">{yesPercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-red-600">{formatNumber(proposal.no_votes)}</span>
                        <span className="text-xs text-slate-500">{100 - yesPercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(proposal.active_status, proposal.expired_date)}
                        variant="secondary"
                      >
                        {getStatusText(proposal.active_status, proposal.expired_date)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(proposal.expired_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(proposal)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        {/* Delete functionality removed - not available in cleaned API */}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {proposals.length > 0 && (
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
