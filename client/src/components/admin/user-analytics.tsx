"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Users, UserCheck, MapPin, Activity, Shield, TrendingUp, BarChart3, PieChart, Loader2, RefreshCw } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from "recharts"
import { userService, type UserAnalyticsData } from "@/services/user"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  newRegistrationsThisMonth: number
  usersByProvince: { province: string; count: number; percentage: number }[]
  usersByDistrict: { district: string; count: number; province: string }[]
  userActivity: {
    petitionsCreated: number
    reportsSubmitted: number
    commentsPosted: number
    votesParticipated: number
  }
  blockchainVerification: {
    walletConnected: number
    transactionsVerified: number
    
    smartContractInteractions: number
  }
  growthTrend: { month: string; users: number; growth: number }[]
}

export function UserAnalytics() {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState("all")
  const [timeRange, setTimeRange] = useState("6months")
  const { toast } = useToast()

  const chartColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316", "#EC4899"]

  // Load analytics data
  const loadAnalyticsData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const data = await userService.getAnalyticsData()
      setAnalytics(data)
      
      if (showRefreshIndicator) {
        toast({
          title: "Success",
          description: "Analytics data refreshed successfully.",
        })
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getEngagementRate = () => {
    if (!analytics) return "0"
    const totalActivity = analytics.userActivity.petitionsCreated + 
                         analytics.userActivity.reportsSubmitted + 
                         analytics.userActivity.commentsPosted + 
                         analytics.userActivity.votesParticipated
    return ((totalActivity / analytics.totalUsers) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Analytics Data...</span>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-600">Failed To Load Analytics Data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Citizen Analytics Dashboard</h2>
          <p className="text-slate-600">Privacy-Preserving Insights Into Citizen Engagement And Platform Usage</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline" 
            size="sm"
            onClick={() => loadAnalyticsData(true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {analytics.usersByProvince.map((item) => (
                <SelectItem key={item.province} value={item.province}>
                  {item.province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Citizens</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalUsers)}</div>
            <p className="text-xs text-slate-500">
              ~{((analytics.totalUsers / 21000000) * 100).toFixed(1)}% of population
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Citizens</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.activeUsers)}</div>
            <p className="text-xs text-slate-500">
              {((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)}% engagement rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Verified</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.verifiedUsers)}</div>
            <p className="text-xs text-slate-500">
              {((analytics.verifiedUsers / analytics.totalUsers) * 100).toFixed(1)}% verified
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.newRegistrationsThisMonth)}</div>
            <p className="text-xs text-slate-500">+{analytics.growthTrend[analytics.growthTrend.length - 1]?.growth}% growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Distribution */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>Citizen participation by province</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.usersByProvince.map((item, index) => (
                <div key={item.province} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.province}</span>
                    <span className="text-slate-600">{formatNumber(item.count)} ({item.percentage}%)</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Growth Trend */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Growth Trend
            </CardTitle>
            <CardDescription>Citizen registration growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                users: {
                  label: "Users",
                  color: "#3B82F6",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.growthTrend}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatNumber} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="users" fill="#3B82F6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citizen Engagement */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Citizen Engagement
            </CardTitle>
            <CardDescription>Platform activity and participation metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Petitions Created</p>
                  <p className="text-sm text-blue-600">Citizen-initiated petitions</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">{formatNumber(analytics.userActivity.petitionsCreated)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">Reports Submitted</p>
                  <p className="text-sm text-green-600">Transparency reports filed</p>
                </div>
                <span className="text-2xl font-bold text-green-600">{formatNumber(analytics.userActivity.reportsSubmitted)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-900">Comments Posted</p>
                  <p className="text-sm text-yellow-600">Public consultation participation</p>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{formatNumber(analytics.userActivity.commentsPosted)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-purple-900">Votes Participated</p>
                  <p className="text-sm text-purple-600">Democratic participation</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">{formatNumber(analytics.userActivity.votesParticipated)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Analytics */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Blockchain Verification
            </CardTitle>
            <CardDescription>Transparency and verification metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600">{getEngagementRate()}%</p>
                <p className="text-sm text-emerald-700">Overall Engagement Rate</p>
                <p className="text-xs text-emerald-600 mt-1">Citizens actively participating in governance</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Wallet Connected</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {formatNumber(analytics.blockchainVerification.walletConnected)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Transactions Verified</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {formatNumber(analytics.blockchainVerification.transactionsVerified)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Smart Contract Interactions</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {formatNumber(analytics.blockchainVerification.smartContractInteractions)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Notice */}
      <Card className="border-0 shadow-md bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Privacy-First Analytics</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                This dashboard displays real-time aggregated, anonymized data from the blockchain-powered governance platform. 
                Individual user details are never exposed, maintaining the principles of transparent governance while respecting privacy rights. 
                All metrics are calculated from live database queries and updated automatically.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Live Data</Badge>
                <Badge variant="outline" className="text-xs">Zero Personal Data</Badge>
                <Badge variant="outline" className="text-xs">Blockchain Verified</Badge>
                <Badge variant="outline" className="text-xs">Aggregated Analytics</Badge>
                <Badge variant="outline" className="text-xs">GDPR Compliant</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
