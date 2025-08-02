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
import { Plus, Edit, Trash2, AlertTriangle, Shield, Clock, CheckCircle, Search } from "lucide-react"

interface Report {
  id: number
  reportTitle: string
  createdTime: string
  lastUpdatedTime: string
  priority: string
  assignedTo: string
  evidenceHash: string
  resolvedStatus: boolean
  userId?: number
  userName?: string
  category: string
  ministry: string
  description: string
}

export function ReportManagement() {
  const [reports, setReports] = useState<Report[]>([
    {
      id: 1,
      reportTitle: "Irregular Tender Process - Highway Project",
      createdTime: "2024-01-15T10:00:00Z",
      lastUpdatedTime: "2024-01-20T14:30:00Z",
      priority: "High",
      assignedTo: "Commission to Investigate Allegations of Bribery or Corruption",
      evidenceHash: "0x7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p",
      resolvedStatus: false,
      userId: 1,
      userName: "Anonymous Citizen",
      category: "Procurement Irregularities",
      ministry: "Ministry of Transport",
      description: "Suspected irregularities in the tender process for the Kandy-Colombo Expressway Extension project",
    },
    {
      id: 2,
      reportTitle: "Environmental Violation - Industrial Zone",
      createdTime: "2024-01-10T09:15:00Z",
      lastUpdatedTime: "2024-01-25T16:45:00Z",
      priority: "Medium",
      assignedTo: "Central Environmental Authority",
      evidenceHash: "0x5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x",
      resolvedStatus: true,
      userId: 2,
      userName: "Environmental Activist",
      category: "Environmental Breach",
      ministry: "Ministry of Environment",
      description: "Illegal waste disposal and water pollution in Katunayake Industrial Zone",
    },
    {
      id: 3,
      reportTitle: "Misuse of Public Funds - Education Project",
      createdTime: "2024-01-08T11:30:00Z",
      lastUpdatedTime: "2024-01-22T10:15:00Z",
      priority: "High",
      assignedTo: "Auditor General's Department",
      evidenceHash: "0x9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l",
      resolvedStatus: false,
      category: "Financial Misconduct",
      ministry: "Ministry of Education",
      description: "Suspected misappropriation of funds allocated for school infrastructure development",
    },
    {
      id: 4,
      reportTitle: "Healthcare Service Negligence",
      createdTime: "2024-01-05T14:20:00Z",
      lastUpdatedTime: "2024-01-18T09:30:00Z",
      priority: "Medium",
      assignedTo: "Ministry of Health",
      evidenceHash: "0x3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z",
      resolvedStatus: true,
      userId: 3,
      userName: "Healthcare Worker",
      category: "Service Quality",
      ministry: "Ministry of Health",
      description: "Inadequate medical care and staff shortage at District General Hospital",
    },
  ])

  const [formData, setFormData] = useState({
    reportTitle: "",
    priority: "Medium",
    assignedTo: "",
    category: "",
    ministry: "",
    description: "",
    resolvedStatus: false,
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterMinistry, setFilterMinistry] = useState("all")

  const priorities = ["Low", "Medium", "High", "Critical"]

  const categories = [
    "Procurement Irregularities",
    "Environmental Breach",
    "Financial Misconduct",
    "Service Quality",
    "Corruption",
    "Abuse of Power",
    "Safety Violations",
    "Regulatory Breach",
    "Discrimination",
    "Other",
  ]

  const ministries = [
    "Ministry of Finance",
    "Ministry of Education",
    "Ministry of Health",
    "Ministry of Environment",
    "Ministry of Transport",
    "Ministry of Agriculture",
    "Ministry of Defense",
    "Ministry of Justice",
    "Ministry of Technology",
    "Ministry of Energy",
    "Ministry of Water Supply",
    "Ministry of Urban Development",
    "Ministry of Rural Development",
    "Ministry of Trade",
    "Ministry of Tourism",
  ]

  const investigationBodies = [
    "Commission to Investigate Allegations of Bribery or Corruption",
    "Auditor General's Department",
    "Central Environmental Authority",
    "Human Rights Commission",
    "Public Service Commission",
    "Police Financial Crimes Investigation Division",
    "Attorney General's Department",
    "Parliamentary Committee on Public Accounts",
    "Ombudsman",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newReport: Report = {
      id: editingId || Date.now(),
      reportTitle: formData.reportTitle,
      createdTime: new Date().toISOString(),
      lastUpdatedTime: new Date().toISOString(),
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      evidenceHash: `0x${Math.random().toString(16).substr(2, 32)}`,
      resolvedStatus: formData.resolvedStatus,
      category: formData.category,
      ministry: formData.ministry,
      description: formData.description,
    }

    if (editingId) {
      setReports(reports.map((report) => (report.id === editingId ? newReport : report)))
    } else {
      setReports([...reports, newReport])
    }

    setFormData({
      reportTitle: "",
      priority: "Medium",
      assignedTo: "",
      category: "",
      ministry: "",
      description: "",
      resolvedStatus: false,
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (report: Report) => {
    setFormData({
      reportTitle: report.reportTitle,
      priority: report.priority,
      assignedTo: report.assignedTo,
      category: report.category,
      ministry: report.ministry,
      description: report.description,
      resolvedStatus: report.resolvedStatus,
    })
    setEditingId(report.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setReports(reports.filter((report) => report.id !== id))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (resolved: boolean) => {
    return resolved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reportTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === "all" || report.priority === filterPriority
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "resolved" && report.resolvedStatus) ||
      (filterStatus === "pending" && !report.resolvedStatus)
    const matchesMinistry = filterMinistry === "all" || report.ministry === filterMinistry
    return matchesSearch && matchesPriority && matchesStatus && matchesMinistry
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">National Report Management</h2>
          <p className="text-slate-600">Manage whistleblowing reports and investigations across Sri Lanka</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({
                  reportTitle: "",
                  priority: "Medium",
                  assignedTo: "",
                  category: "",
                  ministry: "",
                  description: "",
                  resolvedStatus: false,
                })
                setEditingId(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Report" : "Add New Report"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the report details" : "Create a new whistleblowing report"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportTitle">Report Title</Label>
                <Input
                  id="reportTitle"
                  placeholder="e.g., Irregular Tender Process - Highway Project"
                  value={formData.reportTitle}
                  onChange={(e) => setFormData({ ...formData, reportTitle: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the reported issue..."
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ministry">Related Ministry</Label>
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
                <Label htmlFor="assignedTo">Assigned Investigation Body</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investigation body" />
                  </SelectTrigger>
                  <SelectContent>
                    {investigationBodies.map((body) => (
                      <SelectItem key={body} value={body}>
                        {body}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="resolvedStatus"
                  checked={formData.resolvedStatus}
                  onCheckedChange={(checked) => setFormData({ ...formData, resolvedStatus: checked })}
                />
                <Label htmlFor="resolvedStatus">Mark as Resolved</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Update Report" : "Add Report"}
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
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterMinistry} onValueChange={setFilterMinistry}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ministry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ministries</SelectItem>
            {ministries.map((ministry) => (
              <SelectItem key={ministry} value={ministry}>
                {ministry.replace("Ministry of ", "")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-slate-500">All time submissions</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.filter((r) => !r.resolvedStatus).length}</div>
            <p className="text-xs text-slate-500">Under investigation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.filter((r) => r.resolvedStatus).length}</div>
            <p className="text-xs text-slate-500">
              {Math.round((reports.filter((r) => r.resolvedStatus).length / reports.length) * 100)}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.priority === "High" || r.priority === "Critical").length}
            </div>
            <p className="text-xs text-slate-500">Urgent investigations</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>National Reports ({filteredReports.length})</CardTitle>
          <CardDescription>Whistleblowing reports and investigations from across Sri Lanka</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Ministry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium max-w-xs">
                    <div>
                      <p className="font-semibold">{report.reportTitle}</p>
                      <p className="text-sm text-slate-500 truncate">{report.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(report.priority)} variant="secondary">
                      {report.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.ministry.replace("Ministry of ", "")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(report.resolvedStatus)} variant="secondary">
                      {report.resolvedStatus ? "Resolved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(report.createdTime).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(report)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(report.id)}>
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
