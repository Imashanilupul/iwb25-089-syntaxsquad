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
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Vote, Calendar, Users, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { proposalService, type Proposal, type ProposalFormData } from "@/services/proposal"
import { categoryService, type Category } from "@/services/category"

export function ProposalManagement() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
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

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [proposalsResponse, categoriesResponse] = await Promise.all([
        proposalService.getAllProposals(),
        categoryService.getAllCategories(),
      ])

      if (proposalsResponse.success) {
        setProposals(proposalsResponse.data)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const proposalData: ProposalFormData = {
        title: formData.title,
        shortDescription: formData.shortDescription,
        descriptionInDetails: formData.descriptionInDetails,
        activeStatus: formData.activeStatus,
        expiredDate: formData.expiredDate,
        // Vote counts are not included - they should be managed automatically by the voting system
        yesVotes: 0, // Default to 0 for new proposals
        noVotes: 0,  // Default to 0 for new proposals
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
      }

      let response
      if (editingId) {
        response = await proposalService.updateProposal(editingId, proposalData)
      } else {
        response = await proposalService.createProposal(proposalData)
      }

      if (response.success) {
        toast({
          title: "Success",
          description: editingId ? "Proposal updated successfully" : "Proposal created successfully",
        })
        await loadData() // Reload data
        resetForm()
      } else {
        toast({
          title: "Error",
          description: response.message || "Operation failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving proposal:", error)
      toast({
        title: "Error",
        description: "Failed to save proposal. Please try again.",
        variant: "destructive",
      })
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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this proposal?")) {
      return
    }

    try {
      const response = await proposalService.deleteProposal(id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Proposal deleted successfully",
        })
        await loadData() // Reload data
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete proposal",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting proposal:", error)
      toast({
        title: "Error",
        description: "Failed to delete proposal. Please try again.",
        variant: "destructive",
      })
    }
  }

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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Provincial Council Powers Amendment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  placeholder="Brief summary of the proposal"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionInDetails">Detailed Description</Label>
                <Textarea
                  id="descriptionInDetails"
                  placeholder="Comprehensive description of the proposal..."
                  value={formData.descriptionInDetails}
                  onChange={(e) => setFormData({ ...formData, descriptionInDetails: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
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
                    required
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
                <Label htmlFor="activeStatus">Active Status</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Update Proposal" : "Add Proposal"}
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
              {proposals.map((proposal) => {
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
                        <Button variant="outline" size="sm" onClick={() => handleDelete(proposal.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
