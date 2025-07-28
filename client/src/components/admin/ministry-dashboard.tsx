"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, DollarSign, Users, TrendingUp, Clock, Target } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"

export function MinistryDashboard() {
  const [selectedMinistry, setSelectedMinistry] = useState("education")

  const ministries = [
    { id: "education", name: "Ministry of Education", secretary: "Dr. Sunil Hettiarachchi" },
    { id: "health", name: "Ministry of Health", secretary: "Dr. Palitha Mahipala" },
    { id: "defense", name: "Ministry of Defense", secretary: "Gen. Kamal Gunaratne" },
    { id: "finance", name: "Ministry of Finance", secretary: "Dr. Mahinda Siriwardana" },
    { id: "agriculture", name: "Ministry of Agriculture", secretary: "Mr. Udaya Seneviratne" },
  ]

  const ministryData = {
    education: {
      totalBudget: 450000000000,
      spent: 367000000000,
      committed: 45000000000,
      available: 38000000000,
      departments: 12,
      projects: 47,
      staff: 285000,
      utilization: 81.6,
    },
    health: {
      totalBudget: 380000000000,
      spent: 298000000000,
      committed: 52000000000,
      available: 30000000000,
      departments: 8,
      projects: 23,
      staff: 125000,
      utilization: 78.4,
    },
  }

  const currentMinistry = ministryData[selectedMinistry as keyof typeof ministryData] || ministryData.education

  const departmentBreakdown = [
    { department: "Primary Education", budget: 180000000000, spent: 147000000000, utilization: 81.7 },
    { department: "Secondary Education", budget: 120000000000, spent: 98000000000, utilization: 81.7 },
    { department: "Higher Education", budget: 85000000000, spent: 72000000000, utilization: 84.7 },
    { department: "Technical Education", budget: 45000000000, spent: 35000000000, utilization: 77.8 },
    { department: "Administration", budget: 20000000000, spent: 15000000000, utilization: 75.0 },
  ]

  const monthlySpending = [
    { month: "Jan", amount: 28500, target: 30000 },
    { month: "Feb", amount: 31200, target: 30000 },
    { month: "Mar", amount: 29800, target: 30000 },
    { month: "Apr", amount: 32100, target: 30000 },
    { month: "May", amount: 30500, target: 30000 },
    { month: "Jun", amount: 33200, target: 30000 },
  ]

  const activeProjects = [
    {
      id: 1,
      name: "School Infrastructure Development Program",
      budget: 25000000000,
      spent: 18500000000,
      progress: 74,
      status: "On Track",
      deadline: "Dec 2024",
      contractor: "ABC Construction Ltd",
    },
    {
      id: 2,
      name: "Digital Learning Platform Implementation",
      budget: 8500000000,
      spent: 6200000000,
      progress: 73,
      status: "On Track",
      deadline: "Sep 2024",
      contractor: "TechEd Solutions",
    },
    {
      id: 3,
      name: "Teacher Training Enhancement Program",
      budget: 3200000000,
      spent: 2100000000,
      progress: 66,
      status: "Delayed",
      deadline: "Nov 2024",
      contractor: "Education Consultants Ltd",
    },
  ]

  const pendingRequests = [
    {
      id: 1,
      type: "Budget Transfer",
      from: "Administration",
      to: "Primary Education",
      amount: 2500000000,
      reason: "Increased enrollment in rural schools",
      priority: "Medium",
      submittedBy: "Director General of Education",
      date: "2024-01-15",
    },
    {
      id: 2,
      type: "Emergency Allocation",
      from: "Reserve Fund",
      to: "Infrastructure",
      amount: 5000000000,
      reason: "Urgent repairs after monsoon damage",
      priority: "High",
      submittedBy: "Chief Engineer",
      date: "2024-01-14",
    },
  ]

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Rs. ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `Rs. ${(amount / 1000000).toFixed(1)}M`
    }
    return `Rs. ${amount.toLocaleString()}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-800"
      case "Delayed":
        return "bg-red-100 text-red-800"
      case "At Risk":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600"
      case "Medium":
        return "text-yellow-600"
      case "Low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ministry Administration Dashboard</h2>
          <p className="text-slate-600">Departmental budget management and project oversight</p>
        </div>
        <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ministries.map((ministry) => (
              <SelectItem key={ministry.id} value={ministry.id}>
                {ministry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ministry Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMinistry.totalBudget)}</div>
            <p className="text-xs text-slate-500">FY 2024 Allocation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMinistry.utilization}%</div>
            <p className="text-xs text-slate-500">{formatCurrency(currentMinistry.spent)} spent</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMinistry.projects}</div>
            <p className="text-xs text-slate-500">{currentMinistry.departments} departments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Count</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMinistry.staff.toLocaleString()}</div>
            <p className="text-xs text-slate-500">Total employees</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="departments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="departments">Department Budgets</TabsTrigger>
          <TabsTrigger value="projects">Active Projects</TabsTrigger>
          <TabsTrigger value="requests">Pending Requests</TabsTrigger>
          <TabsTrigger value="analytics">Spending Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Department Budget Breakdown
              </CardTitle>
              <CardDescription>Budget allocation and utilization by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {departmentBreakdown.map((dept, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{dept.department}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          {formatCurrency(dept.spent)} / {formatCurrency(dept.budget)}
                        </span>
                        <div className="text-xs text-slate-500">{dept.utilization}% utilized</div>
                      </div>
                    </div>
                    <Progress value={dept.utilization} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Remaining: {formatCurrency(dept.budget - dept.spent)}</span>
                      <Badge
                        variant={
                          dept.utilization > 90 ? "destructive" : dept.utilization < 60 ? "secondary" : "default"
                        }
                      >
                        {dept.utilization > 90 ? "High Usage" : dept.utilization < 60 ? "Low Usage" : "Normal"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Ministry Projects
              </CardTitle>
              <CardDescription>Current project status and budget utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeProjects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900">{project.name}</h4>
                        <p className="text-sm text-slate-600">Contractor: {project.contractor}</p>
                        <p className="text-sm text-slate-600">Deadline: {project.deadline}</p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Budget</p>
                        <p className="font-semibold">{formatCurrency(project.budget)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Spent</p>
                        <p className="font-semibold">{formatCurrency(project.spent)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Progress</p>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="flex-1" />
                          <span className="text-sm font-medium">{project.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">Update Status</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Budget Requests
              </CardTitle>
              <CardDescription>Budget transfers and allocations awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900">{request.type}</h4>
                        <p className="text-sm text-slate-600">
                          From: {request.from} → To: {request.to}
                        </p>
                        <p className="text-sm text-slate-600">Reason: {request.reason}</p>
                        <p className="text-lg font-semibold text-green-700">{formatCurrency(request.amount)}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority} Priority
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{request.date}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-slate-500">Submitted by: {request.submittedBy}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Monthly Spending Trends</CardTitle>
              <CardDescription>Actual spending vs budget targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: { label: "Actual Spending", color: "#3b82f6" },
                  target: { label: "Budget Target", color: "#22c55e" },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySpending}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="target" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
