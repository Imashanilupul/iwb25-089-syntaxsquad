"use client"

import type React from "react"

import { useState } from "react"
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
import { Plus, Edit, Trash2, Vote, Calendar, Users } from "lucide-react"

interface Proposal {
  id: number
  title: string
  shortDescription: string
  description: string
  activeStatus: boolean
  expiredDate: string
  yesVotes: number
  noVotes: number
  categoryId: number
  categoryName: string
}

export function ProposalManagement() {
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: 1,
      title: "Provincial Council Powers Amendment",
      shortDescription: "Proposal to devolve more administrative powers to Provincial Councils",
      description:
        "This amendment seeks to strengthen the devolution of power by granting Provincial Councils greater autonomy in areas such as education, health, and local infrastructure development.",
      activeStatus: true,
      expiredDate: "2024-02-15",
      yesVotes: 98760,
      noVotes: 55560,
      categoryId: 1,
      categoryName: "Constitutional Reform",
    },
    {
      id: 2,
      title: "Renewable Energy Development Act",
      shortDescription: "Investment in solar and wind energy infrastructure across all provinces",
      description:
        "A comprehensive plan to transition Sri Lanka to renewable energy sources, targeting 70% renewable energy by 2030 through solar, wind, and hydroelectric projects.",
      activeStatus: true,
      expiredDate: "2024-02-28",
      yesVotes: 61230,
      noVotes: 21110,
      categoryId: 2,
      categoryName: "Environment",
    },
    {
      id: 3,
      title: "Free Education Enhancement Bill",
      shortDescription: "Increase funding for public schools and universities by 20%",
      description:
        "This bill proposes to increase government funding for education by 20%, focusing on infrastructure development, teacher training, and technology integration in schools.",
      activeStatus: false,
      expiredDate: "2024-01-30",
      yesVotes: 182340,
      noVotes: 39220,
      categoryId: 3,
      categoryName: "Education",
    },
  ])

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    activeStatus: true,
    expiredDate: "",
    yesVotes: "",
    noVotes: "",
    categoryId: "",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const categories = [
    { id: 1, name: "Constitutional Reform" },
    { id: 2, name: "Environment" },
    { id: 3, name: "Education" },
    { id: 4, name: "Healthcare" },
    { id: 5, name: "Infrastructure" },
    { id: 6, name: "Economic Policy" },
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const categoryName = categories.find((cat) => cat.id === Number.parseInt(formData.categoryId))?.name || ""

    const newProposal: Proposal = {
      id: editingId || Date.now(),
      title: formData.title,
      shortDescription: formData.shortDescription,
      description: formData.description,
      activeStatus: formData.activeStatus,
      expiredDate: formData.expiredDate,
      yesVotes: Number.parseInt(formData.yesVotes || "0"),
      noVotes: Number.parseInt(formData.noVotes || "0"),
      categoryId: Number.parseInt(formData.categoryId),
      categoryName,
    }

    if (editingId) {
      setProposals(proposals.map((prop) => (prop.id === editingId ? newProposal : prop)))
    } else {
      setProposals([...proposals, newProposal])
    }

    setFormData({
      title: "",
      shortDescription: "",
      description: "",
      activeStatus: true,
      expiredDate: "",
      yesVotes: "",
      noVotes: "",
      categoryId: "",
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (proposal: Proposal) => {
    setFormData({
      title: proposal.title,
      shortDescription: proposal.shortDescription,
      description: proposal.description,
      activeStatus: proposal.activeStatus,
      expiredDate: proposal.expiredDate,
      yesVotes: proposal.yesVotes.toString(),
      noVotes: proposal.noVotes.toString(),
      categoryId: proposal.categoryId.toString(),
    })
    setEditingId(proposal.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setProposals(proposals.filter((prop) => prop.id !== id))
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
                  description: "",
                  activeStatus: true,
                  expiredDate: "",
                  yesVotes: "",
                  noVotes: "",
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
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Comprehensive description of the proposal..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yesVotes">Yes Votes</Label>
                  <Input
                    id="yesVotes"
                    type="number"
                    placeholder="e.g., 98760"
                    value={formData.yesVotes}
                    onChange={(e) => setFormData({ ...formData, yesVotes: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noVotes">No Votes</Label>
                  <Input
                    id="noVotes"
                    type="number"
                    placeholder="e.g., 55560"
                    value={formData.noVotes}
                    onChange={(e) => setFormData({ ...formData, noVotes: e.target.value })}
                  />
                </div>
              </div>

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
              {proposals.filter((p) => p.activeStatus && new Date(p.expiredDate) > new Date()).length}
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
              {formatNumber(proposals.reduce((sum, prop) => sum + prop.yesVotes + prop.noVotes, 0))}
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
                Math.round(proposals.reduce((sum, prop) => sum + prop.yesVotes + prop.noVotes, 0) / proposals.length),
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
                const totalVotes = proposal.yesVotes + proposal.noVotes
                const yesPercentage = totalVotes > 0 ? Math.round((proposal.yesVotes / totalVotes) * 100) : 0

                return (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <p className="font-semibold">{proposal.title}</p>
                        <p className="text-sm text-slate-500 truncate">{proposal.shortDescription}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{proposal.categoryName}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-green-600">{formatNumber(proposal.yesVotes)}</span>
                        <span className="text-xs text-slate-500">{yesPercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-red-600">{formatNumber(proposal.noVotes)}</span>
                        <span className="text-xs text-slate-500">{100 - yesPercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(proposal.activeStatus, proposal.expiredDate)}
                        variant="secondary"
                      >
                        {getStatusText(proposal.activeStatus, proposal.expiredDate)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(proposal.expiredDate).toLocaleDateString()}</TableCell>
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
