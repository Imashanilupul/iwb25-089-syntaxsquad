"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Shield,
  Users,
  DollarSign,
  FileText,
  AlertTriangle,
  Clock,
  Settings,
  Eye,
  TrendingUp,
  Building,
  MapPin,
} from "lucide-react"
import { TreasuryDashboard } from "@/components/admin/treasury-dashboard"
import { MinistryDashboard } from "@/components/admin/ministry-dashboard"
import { ProvincialDashboard } from "@/components/admin/provincial-dashboard"
import { OversightDashboard } from "@/components/admin/oversight-dashboard"
import { SystemAdminDashboard } from "@/components/admin/system-admin-dashboard"

interface AdminUser {
  id: string
  name: string
  role: string
  department: string
  level: "super" | "ministry" | "provincial" | "local" | "oversight" | "technical"
  permissions: string[]
  avatar?: string
}

export function AdminDashboard() {
  const [currentUser] = useState<AdminUser>({
    id: "admin-001",
    name: "Dr. Mahinda Siriwardana",
    role: "Secretary to Treasury",
    department: "Ministry of Finance",
    level: "super",
    permissions: ["budget_management", "audit_access", "system_config", "user_management"],
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [activeTab, setActiveTab] = useState("overview")

  const systemStats = [
    {
      title: "Total Budget Oversight",
      value: "Rs. 5.2T",
      change: "+3.2%",
      icon: DollarSign,
      color: "text-green-600",
      description: "FY 2024 National Budget",
    },
    {
      title: "Active Transactions",
      value: "12,847",
      change: "+15.3%",
      icon: TrendingUp,
      color: "text-blue-600",
      description: "Blockchain verified",
    },
    {
      title: "Ministry Accounts",
      value: "47",
      change: "0%",
      icon: Building,
      color: "text-purple-600",
      description: "All ministries connected",
    },
    {
      title: "Provincial Councils",
      value: "9",
      change: "0%",
      icon: MapPin,
      color: "text-orange-600",
      description: "All provinces active",
    },
  ]

  const recentAlerts = [
    {
      id: 1,
      type: "budget_variance",
      title: "Budget Variance Alert - Ministry of Health",
      description: "Expenditure exceeds allocated budget by 5.2%",
      severity: "medium",
      timestamp: "2 hours ago",
      status: "pending",
    },
    {
      id: 2,
      type: "audit_required",
      title: "Audit Required - Provincial Road Development",
      description: "Quarterly audit due for Central Province road projects",
      severity: "high",
      timestamp: "4 hours ago",
      status: "pending",
    },
    {
      id: 3,
      type: "system_update",
      title: "Blockchain Network Update",
      description: "Scheduled maintenance completed successfully",
      severity: "low",
      timestamp: "1 day ago",
      status: "resolved",
    },
  ]

  const pendingApprovals = [
    {
      id: 1,
      title: "Budget Reallocation Request",
      department: "Ministry of Education",
      amount: "Rs. 2.5B",
      type: "budget_transfer",
      priority: "high",
      submittedBy: "Chief Accounting Officer",
      timestamp: "3 hours ago",
    },
    {
      id: 2,
      title: "New Project Approval",
      department: "Western Provincial Council",
      amount: "Rs. 850M",
      type: "project_approval",
      priority: "medium",
      submittedBy: "Provincial Secretary",
      timestamp: "1 day ago",
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/images/sri-lanka-emblem.png"
                alt="Sri Lanka National Emblem"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Government Administration Portal</h1>
                <p className="text-slate-600">Financial Management & Oversight System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-slate-900">{currentUser.name}</p>
                <p className="text-sm text-slate-600">{currentUser.role}</p>
                <p className="text-xs text-slate-500">{currentUser.department}</p>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
            <TabsTrigger value="ministry">Ministry</TabsTrigger>
            <TabsTrigger value="provincial">Provincial</TabsTrigger>
            <TabsTrigger value="oversight">Oversight</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {systemStats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change} from last period
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    System Alerts
                  </CardTitle>
                  <CardDescription>Critical notifications requiring attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-slate-900">{alert.title}</h4>
                          <p className="text-sm text-slate-600">{alert.description}</p>
                        </div>
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{alert.timestamp}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pending Approvals */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Pending Approvals
                  </CardTitle>
                  <CardDescription>Items requiring your authorization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-slate-900">{approval.title}</h4>
                          <p className="text-sm text-slate-600">{approval.department}</p>
                          <p className="text-sm font-semibold text-green-700">{approval.amount}</p>
                        </div>
                        <div className={`text-sm font-medium ${getPriorityColor(approval.priority)}`}>
                          {approval.priority} priority
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          <span>By {approval.submittedBy}</span>
                          <span className="ml-2">• {approval.timestamp}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                          <Button size="sm">Approve</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Frequently used administrative functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <FileText className="h-6 w-6" />
                    Generate Report
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <Users className="h-6 w-6" />
                    User Management
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <Shield className="h-6 w-6" />
                    Security Audit
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <Eye className="h-6 w-6" />
                    System Monitor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="treasury">
            <TreasuryDashboard />
          </TabsContent>

          <TabsContent value="ministry">
            <MinistryDashboard />
          </TabsContent>

          <TabsContent value="provincial">
            <ProvincialDashboard />
          </TabsContent>

          <TabsContent value="oversight">
            <OversightDashboard />
          </TabsContent>

          <TabsContent value="system">
            <SystemAdminDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
