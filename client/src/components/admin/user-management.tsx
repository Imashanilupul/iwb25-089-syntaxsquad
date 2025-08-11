"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit, Trash2, Users, UserCheck, Search, MapPin } from "lucide-react"

interface User {
  id: number
  userName: string
  email: string
  nic: string
  mobileNo: string
  evm?: string
  registrationDate: string
  status: string
  province: string
  district: string
  petitionCount: number
  commentCount: number
  reportCount: number
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      userName: "Kumara Perera",
      email: "kumara.perera@gmail.com",
      nic: "199012345678",
      mobileNo: "+94771234567",
      evm: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
      registrationDate: "2024-01-15",
      status: "Active",
      province: "Western Province",
      district: "Colombo",
      petitionCount: 3,
      commentCount: 45,
      reportCount: 1,
    },
    {
      id: 2,
      userName: "Nayani Silva",
      email: "nayani.silva@yahoo.com",
      nic: "198567891234",
      mobileNo: "+94712345678",
      evm: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u",
      registrationDate: "2024-01-10",
      status: "Active",
      province: "Central Province",
      district: "Kandy",
      petitionCount: 1,
      commentCount: 23,
      reportCount: 0,
    },
    {
      id: 3,
      userName: "Rajesh Fernando",
      email: "rajesh.fernando@hotmail.com",
      nic: "197789123456",
      mobileNo: "+94723456789",
      registrationDate: "2024-01-08",
      status: "Active",
      province: "Southern Province",
      district: "Galle",
      petitionCount: 2,
      commentCount: 67,
      reportCount: 2,
    },
    {
      id: 4,
      userName: "Chamila Jayawardena",
      email: "chamila.j@gmail.com",
      nic: "199234567890",
      mobileNo: "+94734567890",
      evm: "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w",
      registrationDate: "2024-01-05",
      status: "Inactive",
      province: "Northern Province",
      district: "Jaffna",
      petitionCount: 0,
      commentCount: 12,
      reportCount: 0,
    },
    {
      id: 5,
      userName: "Pradeep Wickramasinghe",
      email: "pradeep.w@outlook.com",
      nic: "198890123456",
      mobileNo: "+94745678901",
      registrationDate: "2024-01-20",
      status: "Suspended",
      province: "Eastern Province",
      district: "Batticaloa",
      petitionCount: 1,
      commentCount: 8,
      reportCount: 3,
    },
  ])

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    nic: "",
    mobileNo: "",
    evm: "",
    status: "Active",
    province: "",
    district: "",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProvince, setFilterProvince] = useState("all")

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
  ]

  const districts = {
    "Western Province": ["Colombo", "Gampaha", "Kalutara"],
    "Central Province": ["Kandy", "Matale", "Nuwara Eliya"],
    "Southern Province": ["Galle", "Matara", "Hambantota"],
    "Northern Province": ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
    "Eastern Province": ["Batticaloa", "Ampara", "Trincomalee"],
    "North Western Province": ["Kurunegala", "Puttalam"],
    "North Central Province": ["Anuradhapura", "Polonnaruwa"],
    "Uva Province": ["Badulla", "Monaragala"],
    "Sabaragamuwa Province": ["Ratnapura", "Kegalle"],
  }

  const userStatuses = ["Active", "Inactive", "Suspended", "Banned"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newUser: User = {
      id: editingId || Date.now(),
      userName: formData.userName,
      email: formData.email,
      nic: formData.nic,
      mobileNo: formData.mobileNo,
      evm: formData.evm,
      registrationDate: new Date().toISOString().split("T")[0],
      status: formData.status,
      province: formData.province,
      district: formData.district,
      petitionCount: 0,
      commentCount: 0,
      reportCount: 0,
    }

    if (editingId) {
      setUsers(
        users.map((user) =>
          user.id === editingId
            ? {
                ...newUser,
                petitionCount: users.find((u) => u.id === editingId)?.petitionCount || 0,
                commentCount: users.find((u) => u.id === editingId)?.commentCount || 0,
                reportCount: users.find((u) => u.id === editingId)?.reportCount || 0,
              }
            : user,
        ),
      )
    } else {
      setUsers([...users, newUser])
    }

    setFormData({
      userName: "",
      email: "",
      nic: "",
      mobileNo: "",
      evm: "",
      status: "Active",
      province: "",
      district: "",
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (user: User) => {
    setFormData({
      userName: user.userName,
      email: user.email,
      nic: user.nic,
      mobileNo: user.mobileNo,
      evm: user.evm || "",
      status: user.status,
      province: user.province,
      district: user.district,
    })
    setEditingId(user.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setUsers(users.filter((user) => user.id !== id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-gray-100 text-gray-800"
      case "Suspended":
        return "bg-yellow-100 text-yellow-800"
      case "Banned":
        return "bg-red-100 text-red-800"
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nic.includes(searchTerm)
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    const matchesProvince = filterProvince === "all" || user.province === filterProvince
    return matchesSearch && matchesStatus && matchesProvince
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">National User Management</h2>
          <p className="text-slate-600">Manage registered citizens across all provinces and districts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({
                  userName: "",
                  email: "",
                  nic: "",
                  mobileNo: "",
                  evm: "",
                  status: "Active",
                  province: "",
                  district: "",
                })
                setEditingId(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the user details" : "Register a new citizen user"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Full Name</Label>
                  <Input
                    id="userName"
                    placeholder="e.g., Kumara Perera"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., kumara.perera@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nic">NIC Number</Label>
                  <Input
                    id="nic"
                    placeholder="e.g., 199012345678"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNo">Mobile Number</Label>
                  <Input
                    id="mobileNo"
                    placeholder="e.g., +94771234567"
                    value={formData.mobileNo}
                    onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evm">EVM Address (Optional)</Label>
                <Input
                  id="evm"
                  placeholder="e.g., 0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t"
                  value={formData.evm}
                  onChange={(e) => setFormData({ ...formData, evm: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value, district: "" })}
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

                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData({ ...formData, district: value })}
                    disabled={!formData.province}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.province &&
                        districts[formData.province as keyof typeof districts]?.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Account Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {userStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Update User" : "Add User"}
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
            placeholder="Search users by name, email, or NIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {userStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProvince} onValueChange={setFilterProvince}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
            {provinces.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(users.length)}</div>
            <p className="text-xs text-slate-500">Registered citizens</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(users.filter((u) => u.status === "Active").length)}</div>
            <p className="text-xs text-slate-500">
              {Math.round((users.filter((u) => u.status === "Active").length / users.length) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Users</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(users.filter((u) => u.evm).length)}</div>
            <p className="text-xs text-slate-500">With EVM addresses</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geographic Coverage</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(users.map((u) => u.province)).size}</div>
            <p className="text-xs text-slate-500">Provinces represented</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Registered Citizens ({filteredUsers.length})</CardTitle>
          <CardDescription>All registered users across Sri Lanka with their activity summary</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                        <AvatarFallback>
                          {user.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.userName}</p>
                        <p className="text-sm text-slate-500">NIC: {user.nic}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{user.email}</p>
                      <p className="text-sm text-slate-500">{user.mobileNo}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{user.district}</p>
                      <p className="text-sm text-slate-500">{user.province}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {user.petitionCount} petitions
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {user.commentCount} comments
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {user.reportCount} reports
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)} variant="secondary">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.registrationDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(user.id)}>
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
