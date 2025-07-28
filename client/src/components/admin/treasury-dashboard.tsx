"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Building,
  Calculator,
  PieChartIcon,
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell, Pie } from "recharts"

export function TreasuryDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("current")

  const budgetOverview = {
    totalBudget: 5200000000000, // Rs. 5.2T
    allocated: 4680000000000, // Rs. 4.68T
    spent: 3120000000000, // Rs. 3.12T
    remaining: 2080000000000, // Rs. 2.08T
    variance: -2.3, // Negative indicates under-spending
  }

  const ministryAllocations = [
    { ministry: "Defense", allocated: 520000000000, spent: 398000000000, utilization: 76.5 },
    { ministry: "Education", allocated: 450000000000, spent: 367000000000, utilization: 81.6 },
    { ministry: "Health", allocated: 380000000000, spent: 298000000000, utilization: 78.4 },
    { ministry: "Infrastructure", allocated: 650000000000, spent: 487000000000, utilization: 74.9 },
    { ministry: "Agriculture", allocated: 280000000000, spent: 234000000000, utilization: 83.6 },
    { ministry: "Social Services", allocated: 320000000000, spent: 267000000000, utilization: 83.4 },
  ]

  const revenueStreams = [
    { source: "Income Tax", amount: 890000000000, percentage: 28.5, growth: 12.3 },
    { source: "VAT", amount: 756000000000, percentage: 24.2, growth: 8.7 },
    { source: "Import Duties", amount: 445000000000, percentage: 14.3, growth: -3.2 },
    { source: "Excise Tax", amount: 334000000000, percentage: 10.7, growth: 15.6 },
    { source: "Corporate Tax", amount: 567000000000, percentage: 18.2, growth: 9.4 },
    { source: "Other", amount: 128000000000, percentage: 4.1, growth: 5.8 },
  ]

  const monthlyTrends = [
    { month: "Jan", revenue: 245000, expenditure: 289000, deficit: -44000 },
    { month: "Feb", revenue: 267000, expenditure: 298000, deficit: -31000 },
    { month: "Mar", revenue: 289000, expenditure: 334000, deficit: -45000 },
    { month: "Apr", revenue: 298000, expenditure: 298000, deficit: 0 },
    { month: "May", revenue: 334000, expenditure: 312000, deficit: 22000 },
    { month: "Jun", revenue: 356000, expenditure: 287000, deficit: 69000 },
  ]

  const criticalAlerts = [
    {
      id: 1,
      type: "budget_overrun",
      ministry: "Ministry of Health",
      amount: "Rs. 23.5B",
      percentage: 105.2,
      severity: "high",
      description: "COVID-19 emergency expenditure exceeding allocated budget",
    },
    {
      id: 2,
      type: "low_utilization",
      ministry: "Ministry of Sports",
      amount: "Rs. 8.9B",
      percentage: 45.3,
      severity: "medium",
      description: "Significantly under-utilized budget allocation",
    },
    {
      id: 3,
      type: "revenue_shortfall",
      ministry: "Inland Revenue Department",
      amount: "Rs. 45.2B",
      percentage: 87.6,
      severity: "high",
      description: "Tax collection below projected targets",
    },
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Treasury Operations Dashboard</h2>
          <p className="text-slate-600">National budget management and fiscal oversight</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current FY 2024</SelectItem>
            <SelectItem value="previous">Previous FY 2023</SelectItem>
            <SelectItem value="quarterly">Q2 2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(budgetOverview.totalBudget)}</div>
            <p className="text-xs text-slate-500">FY 2024 Allocation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(budgetOverview.spent)}</div>
            <p className="text-xs text-slate-500">
              {((budgetOverview.spent / budgetOverview.totalBudget) * 100).toFixed(1)}% of total budget
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(budgetOverview.remaining)}</div>
            <p className="text-xs text-slate-500">Available for allocation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
            {budgetOverview.variance < 0 ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${budgetOverview.variance < 0 ? "text-green-600" : "text-red-600"}`}>
              {budgetOverview.variance > 0 ? "+" : ""}
              {budgetOverview.variance}%
            </div>
            <p className="text-xs text-slate-500">{budgetOverview.variance < 0 ? "Under budget" : "Over budget"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="allocations">Ministry Allocations</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="trends">Financial Trends</TabsTrigger>
          <TabsTrigger value="alerts">Critical Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Ministry Budget Utilization
              </CardTitle>
              <CardDescription>Current spending vs allocated budgets by ministry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {ministryAllocations.map((ministry, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{ministry.ministry}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          {formatCurrency(ministry.spent)} / {formatCurrency(ministry.allocated)}
                        </span>
                        <div className="text-xs text-slate-500">{ministry.utilization}% utilized</div>
                      </div>
                    </div>
                    <Progress value={ministry.utilization} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Remaining: {formatCurrency(ministry.allocated - ministry.spent)}</span>
                      <Badge
                        variant={
                          ministry.utilization > 90
                            ? "destructive"
                            : ministry.utilization < 60
                              ? "secondary"
                              : "default"
                        }
                      >
                        {ministry.utilization > 90 ? "High Usage" : ministry.utilization < 60 ? "Low Usage" : "Normal"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Government revenue breakdown by source</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    amount: { label: "Amount", color: "#0088FE" },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={revenueStreams}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="amount"
                        label={(entry: any) => `${entry.source} ${entry.percentage}%`}
                      >
                        {revenueStreams.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
                <CardDescription>Year-over-year growth by revenue source</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenueStreams.map((stream, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{stream.source}</p>
                      <p className="text-sm text-slate-600">{formatCurrency(stream.amount)}</p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-semibold ${stream.growth >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {stream.growth >= 0 ? "+" : ""}
                        {stream.growth}%
                      </div>
                      <div className="text-xs text-slate-500">{stream.percentage}% of total</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Monthly Financial Trends</CardTitle>
              <CardDescription>Revenue vs expenditure trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: { label: "Revenue", color: "#22c55e" },
                  expenditure: { label: "Expenditure", color: "#ef4444" },
                  deficit: { label: "Surplus/Deficit", color: "#3b82f6" },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenditure" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="deficit" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Critical Financial Alerts
              </CardTitle>
              <CardDescription>Issues requiring immediate treasury attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-slate-900">{alert.ministry}</h4>
                      <p className="text-sm text-slate-600">{alert.description}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-slate-900">{alert.amount}</span>
                        <span
                          className={`text-sm font-medium ${
                            alert.type === "budget_overrun"
                              ? "text-red-600"
                              : alert.type === "low_utilization"
                                ? "text-yellow-600"
                                : "text-blue-600"
                          }`}
                        >
                          {alert.percentage}%
                        </span>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm">Take Action</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
