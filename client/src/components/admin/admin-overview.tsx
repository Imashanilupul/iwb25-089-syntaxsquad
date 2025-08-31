"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
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
  Loader2,
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import { adminService, type AdminDashboardData } from "@/services/admin"
import { categoryService } from "@/services/category"

export function AdminOverview() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [categoriesData, setCategoriesData] = useState({
    totalBudget: 0,
    totalSpent: 0,
    monthlySpending: [] as Array<{ month: string; amount: number }>
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let isMounted = true
    
    // Fetch admin dashboard data
    adminService.getDashboardData()
      .then((data) => {
        if (!isMounted) return
        setDashboardData(data)
        setIsLoading(false)
      })
      .catch((error) => {
        if (!isMounted) return
        setError(error.message)
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    
    // Fetch categories data for spending analysis (only once)
    categoryService.getAllCategories()
      .then((res) => {
        if (!isMounted) return
        const categories = (res?.data || [])
        
        // Calculate totals from categories
        const totalBudget = categories.reduce(
          (acc, c) => acc + (Number(c.allocated_budget) || 0),
          0
        )
        const totalSpent = categories.reduce(
          (acc, c) => acc + (Number(c.spent_budget) || 0),
          0
        )

        // Calculate monthly spending trend from categories
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const now = new Date()
        const monthlySpending: Array<{ month: string; amount: number }> = []
        
        for (let i = 5; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
          
          // Calculate total spent for this month from all categories
          const amount = categories.reduce((acc: number, c: any) => {
            const ts: string | undefined = (c.updated_at as string) || (c.created_at as string)
            if (!ts) return acc
            const d = new Date(ts)
            return d >= start && d < end ? acc + (Number(c.spent_budget) || 0) : acc
          }, 0)
          
          monthlySpending.push({ 
            month: monthNames[start.getMonth()], 
            amount 
          })
        }

        // Set categories data separately to avoid infinite loops
        setCategoriesData({
          totalBudget,
          totalSpent,
          monthlySpending
        })
      })
      .catch((error) => {
        console.error('Error fetching categories:', error)
      })

    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array - only run once

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString("en-LK")}`

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getIconComponent = (iconName: string) => {
    const icons: any = {
      DollarSign,
      Building,
      Vote,
      AlertTriangle,
      FileText,
      MessageSquare
    }
    return icons[iconName] || FileText
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">{error || 'Failed to load dashboard data'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Transparency Dashboard</h2>
        <p className="text-slate-600">Blockchain-powered governance insights and aggregated public data</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(categoriesData.totalBudget)}</div>
            <p className="text-xs text-slate-500">
              Spent: {formatCurrency(categoriesData.totalSpent)} ({categoriesData.totalBudget > 0 ? ((categoriesData.totalSpent / categoriesData.totalBudget) * 100).toFixed(1) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeProjects}</div>
            <p className="text-xs text-slate-500">Active • {dashboardData.completedProjects} completed</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voting</CardTitle>
            <Vote className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeProposals}</div>
            <p className="text-xs text-slate-500">{formatNumber(dashboardData.totalVotes)} total votes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalUsers)}</div>
            <p className="text-xs text-slate-500">Registered citizens</p>
          </CardContent>
        </Card>
      </div>

      {/* Geographic and Government Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">National Coverage</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.provinces}</div>
            <p className="text-xs text-slate-500">
              {dashboardData.districts} districts • 341 local authorities
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Government Entities</CardTitle>
            <Building className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-slate-500">Ministries and departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activePolicies}</div>
            <p className="text-xs text-slate-500">{formatNumber(dashboardData.totalComments)} comments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.pendingReports}</div>
            <p className="text-xs text-slate-500">Pending • {dashboardData.resolvedReports} resolved</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Petitions</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activePetitions}</div>
            <p className="text-xs text-slate-500">{formatNumber(dashboardData.totalSignatures)} signatures</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.systemHealth.uptime}%</div>
            <p className="text-xs text-slate-500">Uptime • All systems {dashboardData.systemHealth.status}</p>
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
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={dashboardData.categoryData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} 
  fontSize={12}
/>
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
            <CardDescription>Government expenditure over time from categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: { label: "Amount", color: "#8b5cf6" },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={categoriesData.monthlySpending}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} 
  fontSize={12}
/>
<ChartTooltip
  content={<ChartTooltipContent />}
  formatter={(value) => [`${(Number(value) / 1000000).toFixed(1)}M`, ""]}
/>
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Recent Data Updates</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-slate-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => window.location.reload()}
                className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                title="Refresh data"
              >
                <Clock className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
          <CardDescription>Latest changes to platform data (auto-refreshes every 30 seconds)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentActivities.map((activity, index) => {
              const IconComponent = getIconComponent(activity.icon)
              const colorClass = {
                green: 'text-green-600',
                blue: 'text-blue-600', 
                purple: 'text-purple-600',
                red: 'text-red-600',
                indigo: 'text-indigo-600'
              }[activity.color] || 'text-gray-600'

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`h-5 w-5 ${colorClass}`} />
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-slate-500">{activity.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{activity.timestamp}</Badge>
                </div>
              )
            })}
            
            {dashboardData.recentActivities.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
