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
import { Progress } from "@/components/ui/progress"
import { Plus, Edit, Trash2, MessageSquare, Users, TrendingUp, Search, Calendar } from "lucide-react"

interface Petition {
  id: number
  title: string
  description: string
  requiredSignatureCount: number
  signatureCount: number
  creatorId: number
  creatorName: string
  status: string
  category: string
  createdDate: string
  province: string
}

export function PetitionManagement() {
  const [petitions, setPetitions] = useState<Petition[]>([
    {
      id: 1,
      title: "Preserve Sinharaja Forest Reserve",
      description:
        "Petition to strengthen protection measures for UNESCO World Heritage Site and prevent deforestation",
      requiredSignatureCount: 100000,
      signatureCount: 84560,
      creatorId: 1,
      creatorName: "Environmental Protection Society",
      status: "Active",
      category: "Environment",
      createdDate: "2024-01-20",
      province: "Sabaragamuwa Province",
    },
    {
      id: 2,
      title: "Improve Public Transport in Colombo",
      description: "Petition for better bus services and railway connectivity in the Western Province",
      requiredSignatureCount: 50000,
      signatureCount: 67890,
      creatorId: 2,
      creatorName: "Commuters Association",
      status: "Threshold Met",
      category: "Transport",
      createdDate: "2024-01-15",
      province: "Western Province",
    },
    {
      id: 3,
      title: "Free WiFi in All Public Schools",
      description: "Petition to provide internet connectivity to all government schools across Sri Lanka",
      requiredSignatureCount: 75000,
      signatureCount: 45230,
      creatorId: 3,
      creatorName: "Parents-Teachers Association",
      status: "Active",
      category: "Education",
      createdDate: "2024-01-10",
      province: "All Provinces",
    },
    {
      id: 4,
      title: "Establish Cancer Treatment Centers",
      description: "Petition to establish specialized cancer treatment centers in all provinces",
      requiredSignatureCount: 200000,
      signatureCount: 234567,
      creatorId: 4,
      creatorName: "Cancer Patients Support Group",
      status: "Implemented",
      category: "Healthcare",
      createdDate: "2023-12-01",
      province: "All Provinces",
    },
  ])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSignatureCount: "",
    signatureCount: "",
    creatorName: "",
    status: "Active",
    category: "",
    province: "",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")

  const provinces = [
    "Western Province",
    "Central Province",
    "Southern Province",
    "Northern Province",
    "Eastern Province",
    "North Western Province",
    "North Central Province",
    "Uva Province",
    "Sabaragamuwa Province",
    "All Provinces",
  ]

  const categories = [
    "Environment",
    "Transport",
    "Education",
    "Healthcare",
    "Infrastructure",
    "Social Welfare",
    "Economic Development",
    "Governance",
    "Technology",
    "Agriculture",
  ]

  const petitionStatuses = ["Active", "Threshold Met", "Under Review", "Approved", "Implemented", "Rejected", "Expired"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newPetition: Petition = {
      id: editingId || Date.now(),
      title: formData.title,
      description: formData.description,
      requiredSignatureCount: Number.parseInt(formData.requiredSignatureCount),
      signatureCount: Number.parseInt(formData.signatureCount || "0"),
      creatorId: Date.now(),
      creatorName: formData.creatorName,
      status: formData.status,
      category: formData.category,
      createdDate: new Date().toISOString().split("T")[0],
      province: formData.province,
    }

    if (editingId) {
      setPetitions(petitions.map((petition) => (petition.id === editingId ? newPetition : petition)))
    } else {
      setPetitions([...petitions, newPetition])
    }

    setFormData({
      title: "",
      description: "",
      requiredSignatureCount: "",
      signatureCount: "",
      creatorName: "",
      status: "Active",
      category: "",
      province: "",
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (petition: Petition) => {
    setFormData({
      title: petition.title,
      description: petition.description,
      requiredSignatureCount: petition.requiredSignatureCount.toString(),
      signatureCount: petition.signatureCount.toString(),
      creatorName: petition.creatorName,
      status: petition.status,
      category: petition.category,
      province: petition.province,
    })
    setEditingId(petition.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setPetitions(petitions.filter((petition) => petition.id !== id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800"
      case "Threshold Met":
        return "bg-green-100 text-green-800"
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"
      case "Approved":
        return "bg-emerald-100 text-emerald-800"
      case "Implemented":
        return "bg-purple-100 text-purple-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const filteredPetitions = petitions.filter((petition) => {
    const matchesSearch =
      petition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      petition.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || petition.status === filterStatus
    const matchesCategory = filterCategory === "all" || petition.category === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">National Petition Management</h2>
          <p className="text-slate-600">Manage citizen petitions across all provinces and districts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({
                  title: "",
                  description: "",
                  requiredSignatureCount: "",
                  signatureCount: "",
                  creatorName: "",
                  status: "Active",
                  category: "",
                  province: "",
                })
                setEditingId(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Petition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Petition" : "Add New Petition"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the petition details" : "Create a new citizen petition"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Petition Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Preserve Sinharaja Forest Reserve"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the petition..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requiredSignatureCount">Required Signatures</Label>
                  <Input
                    id="requiredSignatureCount"
                    type="number"
                    placeholder="e.g., 100000"
                    value={formData.requiredSignatureCount}
                    onChange={(e) => setFormData({ ...formData, requiredSignatureCount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signatureCount">Current Signatures</Label>
                  <Input
                    id="signatureCount"
                    type="number"
                    placeholder="e.g., 84560"
                    value={formData.signatureCount}
                    onChange={(e) => setFormData({ ...formData, signatureCount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creatorName">Creator/Organization</Label>
                  <Input
                    id="creatorName"
                    placeholder="e.g., Environmental Protection Society"
                    value={formData.creatorName}
                    onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
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
                      {petitionStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Update Petition" : "Add Petition"}
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
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search petitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
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
            {petitionStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Petitions</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{petitions.length}</div>
            <p className="text-xs text-slate-500">All time</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Petitions</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{petitions.filter((p) => p.status === "Active").length}</div>
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
              {formatNumber(petitions.reduce((sum, petition) => sum + petition.signatureCount, 0))}
            </div>
            <p className="text-xs text-slate-500">Citizen participation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((petitions.filter((p) => p.status === "Implemented").length / petitions.length) * 100)}%
            </div>
            <p className="text-xs text-slate-500">Implemented petitions</p>
          </CardContent>
        </Card>
      </div>

      {/* Petitions Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>National Petitions ({filteredPetitions.length})</CardTitle>
          <CardDescription>Citizen petitions from across all provinces and districts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Petition Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Province</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPetitions.map((petition) => {
                const progress = Math.min((petition.signatureCount / petition.requiredSignatureCount) * 100, 100)

                return (
                  <TableRow key={petition.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <p className="font-semibold">{petition.title}</p>
                        <p className="text-sm text-slate-500">By {petition.creatorName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{petition.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{formatNumber(petition.signatureCount)}</span>
                          <span>{formatNumber(petition.requiredSignatureCount)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-slate-500">{progress.toFixed(1)}% complete</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(petition.status)} variant="secondary">
                        {petition.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{petition.province}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(petition)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(petition.id)}>
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
