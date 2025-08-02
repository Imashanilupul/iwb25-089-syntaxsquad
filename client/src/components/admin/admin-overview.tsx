"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  FileText,
  Vote,
  AlertTriangle,
  Users,
  Building,
  MessageSquare,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"

export function AdminOverview() {
  // Mock data - in real app, this would come from your database
  const [stats, setStats] = useState({
    totalBudget: 3450000000000, // Rs. 3.45T - National Budget
    totalSpent: 2460000000000, // Rs. 2.46T
    activeProjects: 1247, // National projects across all provinces
    completedProjects: 892,
    activeProposals: 23, // Parliamentary and provincial proposals
    totalVotes: 2458920, // Citizens participating in digital voting
    activePolicies: 156, // Active policies across all ministries
    totalComments: 45200, // Public consultation comments
    pendingReports: 89, // Whistleblowing reports pending investigation
    resolvedReports: 1234,
    activePetitions: 67, // Public petitions
    totalSignatures: 890000, // Total petition signatures
    totalUsers: 2100000, // Registered citizens (about 10% of population)
    provinces: 9, // All 9 provinces
    districts: 25, // All 25 districts
    ministries: 28, // All government ministries
    localAuthorities: 341, // Municipal councils, urban councils, pradeshiya sabhas
  })

  const categoryData = [
    { name: "Education", allocated: 850000000000, spent: 567000000000 },
    { name: "Health", allocated: 650000000000, spent: 423000000000 },
    { name: "Infrastructure", allocated: 1200000000000, spent: 890000000000 },
    { name: "Defense", allocated: 450000000000, spent: 398000000000 },
    { name: "Agriculture", allocated: 300000000000, spent: 178000000000 },
  ]

  const monthlySpending = [
    { month: "Jan", amount: 245000000000 },
    { month: "Feb", amount: 289000000000 },
    { month: "Mar", amount: 334000000000 },
    { month: "Apr", amount: 298000000000 },
    { month: "May", amount: 412000000000 },
    { month: "Jun", amount: 387000000000 },
  ]

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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
        <p className="text-slate-600">Overview of all platform data and statistics</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
            <p className="text-xs text-slate-500">
              Spent: {formatCurrency(stats.totalSpent)} ({Math.round((stats.totalSpent / stats.totalBudget) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-slate-500">Active • {stats.completedProjects} completed</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voting</CardTitle>
            <Vote className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProposals}</div>
            <p className="text-xs text-slate-500">{formatNumber(stats.totalVotes)} total votes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
            <p className="text-xs text-slate-500">Registered citizens</p>
          </CardContent>
        </Card>
      </div>

      {/* Add after existing stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">National Coverage</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.provinces}</div>
            <p className="text-xs text-slate-500">
              {stats.districts} districts • {stats.localAuthorities} local authorities
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Government Entities</CardTitle>
            <Building className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ministries}</div>
            <p className="text-xs text-slate-500">Ministries and departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policies</CardTitle>
            <FileText className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePolicies}</div>
            <p className="text-xs text-slate-500">{formatNumber(stats.totalComments)} comments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-slate-500">Pending • {stats.resolvedReports} resolved</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Petitions</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePetitions}</div>
            <p className="text-xs text-slate-500">{formatNumber(stats.totalSignatures)} signatures</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-slate-500">Uptime • All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Budget by Category</CardTitle>
            <CardDescription>Allocated vs Spent amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                allocated: { label: "Allocated", color: "#3b82f6" },
                spent: { label: "Spent", color: "#10b981" },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                  />
                  <Bar dataKey="allocated" fill="#3b82f6" />
                  <Bar dataKey="spent" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
            <CardDescription>Government expenditure over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: { label: "Amount", color: "#8b5cf6" },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySpending}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Data Updates
          </CardTitle>
          <CardDescription>Latest changes to platform data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Budget updated for Education category</p>
                  <p className="text-sm text-slate-500">Allocated amount increased by Rs. 50B</p>
                </div>
              </div>
              <Badge variant="outline">2 hours ago</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">New project added</p>
                  <p className="text-sm text-slate-500">Colombo Metro Rail Extension - Rs. 120B</p>
                </div>
              </div>
              <Badge variant="outline">4 hours ago</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Vote className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Voting proposal created</p>
                  <p className="text-sm text-slate-500">Provincial Council Reform Bill</p>
                </div>
              </div>
              <Badge variant="outline">6 hours ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
