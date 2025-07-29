"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  Search,
  MapPin,
  Building,
  Zap,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

// ------------------ Types ------------------
interface Project {
  id: number
  name: string
  category: string
  budget: number
  spent: number
  progress: number
  status: string
  contractor: string
  location: string
  blockchainHash: string
  lastUpdate: string
}

// ------------------ Component ------------------
export function SpendingTracker() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const budgetData = [
    {
      category: "Education",
      allocated: 850_000_000,
      spent: 567_000_000,
      remaining: 283_000_000,
    },
    {
      category: "Health",
      allocated: 650_000_000,
      spent: 423_000_000,
      remaining: 227_000_000,
    },
    {
      category: "Infrastructure",
      allocated: 1_200_000_000,
      spent: 890_000_000,
      remaining: 310_000_000,
    },
    {
      category: "Defense",
      allocated: 450_000_000,
      spent: 398_000_000,
      remaining: 52_000_000,
    },
    {
      category: "Agriculture",
      allocated: 300_000_000,
      spent: 178_000_000,
      remaining: 122_000_000,
    },
  ]

  const spendingTrend = [
    { month: "Jan", amount: 245_000 },
    { month: "Feb", amount: 289_000 },
    { month: "Mar", amount: 334_000 },
    { month: "Apr", amount: 298_000 },
    { month: "May", amount: 412_000 },
    { month: "Jun", amount: 387_000 },
  ]

  const projects: Project[] = [
    {
      id: 1,
      name: "Kandy-Colombo Expressway Extension",
      category: "Infrastructure",
      budget: 120_000_000_000,
      spent: 80_400_000_000,
      progress: 67,
      status: "In Progress",
      contractor: "China Harbour Engineering",
      location: "Central & Western Provinces",
      blockchainHash: "0x1a2b3c4d...",
      lastUpdate: "2 hours ago",
    },
    {
      id: 2,
      name: "Mahaweli Water Supply Project",
      category: "Infrastructure",
      budget: 85_000_000_000,
      spent: 76_500_000_000,
      progress: 90,
      status: "Near Completion",
      contractor: "National Water Supply Board",
      location: "North Central Province",
      blockchainHash: "0x5e6f7g8h...",
      lastUpdate: "4 hours ago",
    },
    {
      id: 3,
      name: "District General Hospital Modernization",
      category: "Healthcare",
      budget: 21_000_000_000,
      spent: 9_450_000_000,
      progress: 45,
      status: "In Progress",
      contractor: "Ministry of Health",
      location: "All Provinces",
      blockchainHash: "0x9i0j1k2l...",
      lastUpdate: "1 day ago",
    },
  ]

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" ||
      project.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Near Completion":
        return "bg-yellow-100 text-yellow-800"
      case "Delayed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Real-Time Government Spending Tracker
          </h2>
          <p className="text-slate-600">
            Blockchain-verified Sri Lankan government expenditure tracking
          </p>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 3.45T</div>
            <p className="text-xs text-slate-500">Allocated for FY 2024</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 2.46T</div>
            <p className="text-xs text-slate-500">71.3% of total budget</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.4%</div>
            <p className="text-xs text-slate-500">Above target (90%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Budget Allocation by Category</CardTitle>
            <CardDescription>Current fiscal year distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                allocated: { label: "Allocated", color: "#0088FE" },
                spent: { label: "Spent", color: "#00C49F" },
                remaining: { label: "Remaining", color: "#FFBB28" },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="allocated" fill="#0088FE" />
                  <Bar dataKey="spent" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
            <CardDescription>Expenditure pattern over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ amount: { label: "Amount", color: "#8884D8" } }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendingTrend}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8884D8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project List with Search & Filter */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Active Projects
          </CardTitle>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardDescription className="text-sm text-muted-foreground">
              Real-time project tracking with blockchain verification
            </CardDescription>

            <div className="flex gap-2 ml-auto items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="safety">Public Safety</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-slate-900">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {project.contractor}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Budget</p>
                      <p className="font-semibold">
                        ${project.budget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Spent</p>
                      <p className="font-semibold">
                        ${project.spent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="flex-1" />
                        <span className="text-sm font-medium">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-slate-500">
                      <span className="font-mono">
                        {project.blockchainHash}
                      </span>
                      <span className="ml-2">
                        • Updated {project.lastUpdate}
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No matching projects found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
