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
import { Plus, Edit, Trash2, Building, MapPin } from "lucide-react"

interface Project {
  id: number
  projectName: string
  categoryId: number
  categoryName: string
  allocatedBudget: number
  spentBudget: number
  state: string
  province: string
  ministry: string
  viewDetails?: string
}

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      projectName: "Kandy-Colombo Expressway Extension",
      categoryId: 3,
      categoryName: "Infrastructure",
      allocatedBudget: 120000000000,
      spentBudget: 80400000000,
      state: "In Progress",
      province: "Central Province",
      ministry: "Ministry of Transport",
      viewDetails: "Highway extension project connecting major cities",
    },
    {
      id: 2,
      projectName: "Mahaweli Water Supply Project",
      categoryId: 3,
      categoryName: "Infrastructure",
      allocatedBudget: 85000000000,
      spentBudget: 76500000000,
      state: "Near Completion",
      province: "North Central Province",
      ministry: "Ministry of Water Supply",
      viewDetails: "Water supply infrastructure development",
    },
    {
      id: 3,
      projectName: "District General Hospital Modernization",
      categoryId: 2,
      categoryName: "Health",
      allocatedBudget: 21000000000,
      spentBudget: 9450000000,
      state: "In Progress",
      province: "All Provinces",
      ministry: "Ministry of Health",
      viewDetails: "Modernization of district hospitals nationwide",
    },
  ])

  const [formData, setFormData] = useState({
    projectName: "",
    categoryId: "",
    allocatedBudget: "",
    spentBudget: "",
    state: "",
    province: "",
    ministry: "",
    viewDetails: "",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const categories = [
    { id: 1, name: "Education" },
    { id: 2, name: "Health" },
    { id: 3, name: "Infrastructure" },
    { id: 4, name: "Defense" },
    { id: 5, name: "Agriculture" },
  ]

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

  const ministries = [
    "Ministry of Finance",
    "Ministry of Education",
    "Ministry of Health",
    "Ministry of Transport",
    "Ministry of Agriculture",
    "Ministry of Technology",
    "Ministry of Environment",
    "Ministry of Defense",
    "Ministry of Water Supply",
  ]

  const projectStates = ["Planning", "In Progress", "Near Completion", "Completed", "On Hold", "Cancelled"]

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000000) {
      return `Rs. ${(amount / 1000000000000).toFixed(1)}T`
    } else if (amount >= 1000000000) {
      return `Rs. ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `Rs. ${(amount / 1000000).toFixed(1)}M`
    }
    return `Rs. ${amount.toLocaleString()}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const categoryName = categories.find((cat) => cat.id === Number.parseInt(formData.categoryId))?.name || ""

    const newProject: Project = {
      id: editingId || Date.now(),
      projectName: formData.projectName,
      categoryId: Number.parseInt(formData.categoryId),
      categoryName,
      allocatedBudget: Number.parseFloat(formData.allocatedBudget),
      spentBudget: Number.parseFloat(formData.spentBudget || "0"),
      state: formData.state,
      province: formData.province,
      ministry: formData.ministry,
      viewDetails: formData.viewDetails,
    }

    if (editingId) {
      setProjects(projects.map((proj) => (proj.id === editingId ? newProject : proj)))
    } else {
      setProjects([...projects, newProject])
    }

    setFormData({
      projectName: "",
      categoryId: "",
      allocatedBudget: "",
      spentBudget: "",
      state: "",
      province: "",
      ministry: "",
      viewDetails: "",
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (project: Project) => {
    setFormData({
      projectName: project.projectName,
      categoryId: project.categoryId.toString(),
      allocatedBudget: project.allocatedBudget.toString(),
      spentBudget: project.spentBudget.toString(),
      state: project.state,
      province: project.province,
      ministry: project.ministry,
      viewDetails: project.viewDetails || "",
    })
    setEditingId(project.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setProjects(projects.filter((proj) => proj.id !== id))
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Near Completion":
        return "bg-yellow-100 text-yellow-800"
      case "On Hold":
        return "bg-orange-100 text-orange-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Management</h2>
          <p className="text-slate-600">Manage government projects and their budgets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({
                  projectName: "",
                  categoryId: "",
                  allocatedBudget: "",
                  spentBudget: "",
                  state: "",
                  province: "",
                  ministry: "",
                  viewDetails: "",
                })
                setEditingId(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Project" : "Add New Project"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the project details" : "Create a new government project"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Kandy-Colombo Expressway"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    required
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allocatedBudget">Allocated Budget (Rs.)</Label>
                  <Input
                    id="allocatedBudget"
                    type="number"
                    placeholder="e.g., 120000000000"
                    value={formData.allocatedBudget}
                    onChange={(e) => setFormData({ ...formData, allocatedBudget: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spentBudget">Spent Budget (Rs.)</Label>
                  <Input
                    id="spentBudget"
                    type="number"
                    placeholder="e.g., 80400000000"
                    value={formData.spentBudget}
                    onChange={(e) => setFormData({ ...formData, spentBudget: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">Project State</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
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

              <div className="space-y-2">
                <Label htmlFor="ministry">Responsible Ministry</Label>
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
                <Label htmlFor="viewDetails">Project Details</Label>
                <Textarea
                  id="viewDetails"
                  placeholder="Detailed description of the project..."
                  value={formData.viewDetails}
                  onChange={(e) => setFormData({ ...formData, viewDetails: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Update Project" : "Add Project"}
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
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-slate-500">Active projects</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Building className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter((p) => p.state === "In Progress").length}</div>
            <p className="text-xs text-slate-500">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(projects.reduce((sum, proj) => sum + proj.allocatedBudget, 0))}
            </div>
            <p className="text-xs text-slate-500">Allocated across all projects</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provinces</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(projects.map((p) => p.province)).size}</div>
            <p className="text-xs text-slate-500">Provinces covered</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Government projects with budget and progress details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Province</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.projectName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.categoryName}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(project.allocatedBudget)}</TableCell>
                  <TableCell>{formatCurrency(project.spentBudget)}</TableCell>
                  <TableCell>
                    <Badge className={getStateColor(project.state)} variant="secondary">
                      {project.state}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.province}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(project.id)}>
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
