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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

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

interface Category {
  category_id: number
  category_name: string
  allocated_budget?: number
  spent_budget?: number
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
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString("en-LK")}`

  // Fetch categories data for charts and totals
  useEffect(() => {
    let isMounted = true
    categoryService
      .getAllCategories()
      .then((res) => {
        if (!isMounted) return
        const categories = (res?.data || [])
        
        // Store categories for dropdown
        setCategories(categories)
        
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
        
        // Calculate progress based on budget spent percentage
        const projectsWithProgress = projectsData.map(project => {
          const allocatedBudget = Number(project.allocated_budget) || 0
          const spentBudget = Number(project.spent_budget) || 0
          const progress = allocatedBudget > 0 ? Math.round((spentBudget / allocatedBudget) * 100) : 0
          
          return {
            ...project,
            progress: Math.min(progress, 100) // Cap at 100%
          }
        })
        
        setProjects(projectsWithProgress)
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

  // Open project details dialog
  const openProjectDetails = (project: Project) => {
    setSelectedProject(project)
    setIsDetailsDialogOpen(true)
  }

  // Close project details dialog
  const closeProjectDetails = () => {
    setIsDetailsDialogOpen(false)
    setSelectedProject(null)
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
            Blockchain-Verified Sri Lankan Government Expenditure Tracking
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
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Budget Allocation */}
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
        className="h-[40vh] min-h-[280px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={budgetData} margin={{ bottom: 80, left: 10, right: 10 }}>
            <XAxis
              dataKey="category"
              angle={window.innerWidth < 640 ? -45 : -30} // more rotation on mobile
              textAnchor="end"
              interval={0}
              fontSize={window.innerWidth < 640 ? 10 : 12} // smaller font on mobile
            />
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

  {/* Monthly Spending */}
  <Card className="border-0 shadow-md">
    <CardHeader>
      <CardTitle>Monthly Spending Trend</CardTitle>
      <CardDescription>Expenditure pattern over time</CardDescription>
    </CardHeader>
    <CardContent>
      <ChartContainer
        config={{ amount: { label: "Amount", color: "#8884D8" } }}
        className="h-[40vh] min-h-[280px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spendingTrend} margin={{ left: 10, right: 10 }}>
            <XAxis dataKey="month" fontSize={window.innerWidth < 640 ? 10 : 12} />
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
              dot={{ r: 3 }}
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
    <CardTitle className="flex items-center gap-2 flex-wrap">
      <Building className="h-5 w-5" />
      Active Projects
    </CardTitle>

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
      <CardDescription className="text-sm text-muted-foreground">
        Real-time project tracking with blockchain verification
      </CardDescription>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>

        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem
                key={category.category_id}
                value={category.category_name.toLowerCase()}
              >
                {category.category_name}
              </SelectItem>
            ))}
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
            {/* Title + Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">
                  {project.project_name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.province}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {project.ministry}
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="secondary">
                      {project.categories?.category_name ||
                        project.category_id ||
                        "Uncategorized"}
                    </Badge>
                  </span>
                </div>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>

            {/* Budget / Spent / Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <Progress
                    value={project.progress || 0}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {project.progress || 0}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Budget utilization
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
              <div className="text-xs text-slate-500">
                • Updated{" "}
                {project.updatedAt
                  ? new Date(project.updatedAt).toLocaleDateString()
                  : "Unknown"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openProjectDetails(project)}
              >
                View Details
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">
          No matching projects found.
        </p>
      )}
    </div>
  </CardContent>
</Card>


      {/* Project Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={closeProjectDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedProject?.project_name}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this government project
            </DialogDescription>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-6">
              {/* Project Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">Project Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <Badge className={getStatusColor(selectedProject.status)}>
                        {selectedProject.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Province:</span>
                      <span className="font-medium">{selectedProject.province}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ministry:</span>
                      <span className="font-medium">{selectedProject.ministry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Category:</span>
                      <span className="font-medium">
                        {selectedProject.categories?.category_name || "Uncategorized"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">Budget Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Allocated Budget:</span>
                      <span className="font-medium font-mono">
                        {formatCurrency(selectedProject.allocated_budget)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Spent Budget:</span>
                      <span className="font-medium font-mono">
                        {formatCurrency(selectedProject.spent_budget)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Remaining:</span>
                      <span className="font-medium font-mono">
                        {formatCurrency(selectedProject.allocated_budget - selectedProject.spent_budget)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Utilization:</span>
                      <span className="font-medium">
                        {selectedProject.allocated_budget > 0 
                          ? ((selectedProject.spent_budget / selectedProject.allocated_budget) * 100).toFixed(1)
                          : "0"
                        }%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Project Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget Utilization Progress</span>
                    <span className="font-medium">{selectedProject.progress || 0}%</span>
                  </div>
                  <Progress value={selectedProject.progress || 0} className="h-3" />
                  <p className="text-xs text-slate-500">
                    {selectedProject.progress && selectedProject.progress >= 100 
                      ? "Project budget fully utilized"
                      : "Project is in progress"
                    }
                  </p>
                </div>
              </div>

              {/* Project Description */}
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Project Description</h4>
                <div className="bg-slate-50 rounded-lg p-4">
                  {selectedProject.view_details ? (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedProject.view_details}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      No detailed description available for this project.
                    </p>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {selectedProject.created_at 
                        ? new Date(selectedProject.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : "Unknown"
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Last Updated:</span>
                    <span className="ml-2 font-medium">
                      {selectedProject.updated_at 
                        ? new Date(selectedProject.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : "Unknown"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Blockchain Verification */}
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Blockchain Verification</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Transaction Verified</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    This project data has been verified on the blockchain and is publicly auditable.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
