"use client"

import { useEffect, useState } from "react"
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
import { projectService } from "@/services/project"
import { categoryService } from "@/services/category"

// ------------------ Types ------------------
interface Project {
  project_id: number
  project_name: string
  category_id?: number
  allocated_budget: number
  spent_budget: number
  state: string
  province: string
  ministry: string
  view_details?: string
  status: string
  created_at?: string
  updated_at?: string
  categories?: {
    category_name: string
  }
  progress?: number
}

// ------------------ Component ------------------
export function SpendingTracker() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [totalBudget, setTotalBudget] = useState<number>(0)
  const [totalSpent, setTotalSpent] = useState<number>(0)
  const [budgetData, setBudgetData] = useState<
    Array<{ category: string; allocated: number; spent: number; remaining: number }>
  >([])
  const [spendingTrend, setSpendingTrend] = useState<Array<{ month: string; amount: number }>>([])
  const [projects, setProjects] = useState<any[]>([])

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString("en-LK")}`

  // Fetch categories data for charts and totals
  useEffect(() => {
    let isMounted = true
    categoryService
      .getAllCategories()
      .then((res) => {
        if (!isMounted) return
        const categories = (res?.data || [])
        
        // Totals from categories
        const totalAllocated = categories.reduce(
          (acc, c) => acc + (Number(c.allocated_budget) || 0),
          0
        )
        const totalSpentCalc = categories.reduce(
          (acc, c) => acc + (Number(c.spent_budget) || 0),
          0
        )
        setTotalBudget(totalAllocated)
        setTotalSpent(totalSpentCalc)

        // Chart data from categories
        const chart = categories.map((c: any) => {
          const allocated = Number(c.allocated_budget) || 0
          const spent = Number(c.spent_budget) || 0
          return {
            category: c.category_name,
            allocated,
            spent,
            remaining: Math.max(0, allocated - spent),
          }
        })
        setBudgetData(chart)

        // Monthly spending trend from categories
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const now = new Date()
        const trend: Array<{ month: string; amount: number }> = []
        for (let i = 5; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
          const amount = categories.reduce((acc: number, c: any) => {
            const ts: string | undefined = (c.updated_at as string) || (c.created_at as string)
            if (!ts) return acc
            const d = new Date(ts)
            return d >= start && d < end ? acc + (Number(c.spent_budget) || 0) : acc
          }, 0)
          trend.push({ month: monthNames[start.getMonth()], amount })
        }
        setSpendingTrend(trend)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  // Fetch projects data for project list
  useEffect(() => {
    let isMounted = true
    projectService
      .getAllProjects()
      .then((res) => {
        if (!isMounted) return
        const projectsData = (res?.data || []) as any[]
        setProjects(projectsData)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.project_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" ||
      (project?.categories?.category_name || String(project?.category_id || "Uncategorized")).toLowerCase() === selectedCategory.toLowerCase()
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
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-slate-500">Allocated for FY 2024</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-slate-500">
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : "0.0"}% of total budget
            </p>
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
          <YAxis
            tickFormatter={(value: number) => {
              if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
              if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
              if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
              return String(value)
            }}
          />
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
          <YAxis
            tickFormatter={(value: number) => {
              if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
              if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
              if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
              return String(value)
            }}
          />
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
                  key={project.project_id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-slate-900">
                        {project.project_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.province}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {project.ministry}
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
                        {formatCurrency(project.allocated_budget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Spent</p>
                      <p className="font-semibold">
                        {formatCurrency(project.spent_budget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress || 0} className="flex-1" />
                        <span className="text-sm font-medium">
                          {project.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-slate-500">
                      <span className="font-mono">
                        {project.view_details || "No details"}
                      </span>
                      <span className="ml-2">
                        • Updated {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : "Unknown"}
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
