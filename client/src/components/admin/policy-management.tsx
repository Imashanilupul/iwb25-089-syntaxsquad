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
import { Plus, Edit, Trash2, FileText, MessageSquare, Eye, Search } from "lucide-react"

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
  const [policies, setPolicies] = useState<Policy[]>([
    {
      id: 1,
      name: "Digital Sri Lanka Strategy 2030",
      description: "Comprehensive digitalization plan for government services and e-governance across all provinces",
      viewFullPolicy: "https://gov.lk/policies/digital-sri-lanka-2030.pdf",
      ministry: "Ministry of Technology",
      createdTime: "2024-01-15T10:00:00Z",
      commentCount: 234,
      status: "Public Consultation",
    },
    {
      id: 2,
      name: "National Education Policy Framework",
      description: "Modernization of education system with focus on STEM and vocational training",
      viewFullPolicy: "https://gov.lk/policies/education-framework-2024.pdf",
      ministry: "Ministry of Education",
      createdTime: "2024-01-10T14:30:00Z",
      commentCount: 567,
      status: "Under Review",
    },
    {
      id: 3,
      name: "Climate Change Adaptation Strategy",
      description: "National strategy for climate resilience and environmental protection",
      viewFullPolicy: "https://gov.lk/policies/climate-adaptation-2024.pdf",
      ministry: "Ministry of Environment",
      createdTime: "2024-01-05T09:15:00Z",
      commentCount: 189,
      status: "Approved",
    },
    {
      id: 4,
      name: "Healthcare Accessibility Act",
      description: "Ensuring universal healthcare access across all districts and provinces",
      viewFullPolicy: "https://gov.lk/policies/healthcare-accessibility.pdf",
      ministry: "Ministry of Health",
      createdTime: "2024-01-20T11:45:00Z",
      commentCount: 423,
      status: "Draft",
    },
  ])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    viewFullPolicy: "",
    ministry: "",
    status: "Draft",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMinistry, setFilterMinistry] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

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

  const policyStatuses = ["Draft", "Under Review", "Public Consultation", "Approved", "Implemented", "Archived"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newPolicy: Policy = {
      id: editingId || Date.now(),
      name: formData.name,
      description: formData.description,
      viewFullPolicy: formData.viewFullPolicy,
      ministry: formData.ministry,
      createdTime: new Date().toISOString(),
      commentCount: 0,
      status: formData.status,
    }

    if (editingId) {
      setPolicies(policies.map((policy) => (policy.id === editingId ? newPolicy : policy)))
    } else {
      setPolicies([...policies, newPolicy])
    }

    setFormData({
      name: "",
      description: "",
      viewFullPolicy: "",
      ministry: "",
      status: "Draft",
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (policy: Policy) => {
    setFormData({
      name: policy.name,
      description: policy.description,
      viewFullPolicy: policy.viewFullPolicy,
      ministry: policy.ministry,
      status: policy.status,
    })
    setEditingId(policy.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setPolicies(policies.filter((policy) => policy.id !== id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800"
      case "Under Review":
        return "bg-blue-100 text-blue-800"
      case "Public Consultation":
        return "bg-yellow-100 text-yellow-800"
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Implemented":
        return "bg-emerald-100 text-emerald-800"
      case "Archived":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMinistry = filterMinistry === "all" || policy.ministry === filterMinistry
    const matchesStatus = filterStatus === "all" || policy.status === filterStatus
    return matchesSearch && matchesMinistry && matchesStatus
  })

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
                  viewFullPolicy: "",
                  ministry: "",
                  status: "Draft",
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
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="viewFullPolicy">Policy Document URL</Label>
                <Input
                  id="viewFullPolicy"
                  placeholder="https://gov.lk/policies/policy-document.pdf"
                  value={formData.viewFullPolicy}
                  onChange={(e) => setFormData({ ...formData, viewFullPolicy: e.target.value })}
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
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
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
              {policies.filter((p) => p.status === "Public Consultation").length}
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
              {policies.reduce((sum, policy) => sum + policy.commentCount, 0).toLocaleString()}
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
            <div className="text-2xl font-bold">{new Set(policies.map((p) => p.ministry)).size}</div>
            <p className="text-xs text-slate-500">With active policies</p>
          </CardContent>
        </Card>
      </div>

      {/* Policies Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>National Policies ({filteredPolicies.length})</CardTitle>
          <CardDescription>Government policies across all ministries and departments</CardDescription>
        </CardHeader>
        <CardContent>
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
              {filteredPolicies.map((policy) => (
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
                      {policy.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{policy.commentCount.toLocaleString()}</TableCell>
                  <TableCell>{new Date(policy.createdTime).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm">
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
        </CardContent>
      </Card>
    </div>
  )
}
