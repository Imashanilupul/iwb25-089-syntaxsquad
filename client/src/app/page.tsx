"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Vote,
  MessageSquare,
  Shield,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  Building,
  AlertTriangle,
} from "lucide-react"
import { SpendingTracker } from "@/components/spending-tracker"
import { VotingSystem } from "@/components/voting-system"
import { PolicyHub } from "@/components/policy-hub"
import { WhistleblowingSystem } from "@/components/whistleblowing-system"
import { ConnectButton } from "@/components/walletConnect/wallet-connect"
import { BlockchainVisualization } from "@/components/blockchain-visualization"
import { RegistrationDialog } from "@/components/registration-dialog"
import SignUpPage from "@/components/signup"
import { userService } from "@/services/user"
import { categoryService } from "@/services/category"
import { useAuth } from "@/context/AuthContext"
import ChatWidget from "@/components/ChatWidget"
import { adminService, type AdminDashboardData } from "@/services/admin"
import { policyService } from "@/services/policy"
import { policyCommentService } from "@/services/policy-comment"

export default function CivicPlatform() {
  const { address } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [userCount, setUserCount] = useState<number>(0)
  const [userChangePct, setUserChangePct] = useState<number>(0)
  const [totalBudget, setTotalBudget] = useState<number>(0)
  const [budgetChangePct, setBudgetChangePct] = useState<number>(0)
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)
  const [discussionCount, setDiscussionCount] = useState<number>(0)
  const [discussionChangePct, setDiscussionChangePct] = useState<number>(0)

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString("en-LK")}`

  useEffect(() => {
    let isMounted = true
    userService
      .getAllUsers()
      .then((users) => {
        if (!isMounted) return
        setUserCount(users.length)
        try {
          const trend = userService.calculateGrowthTrend(users)
          const latest = trend?.[trend.length - 1]?.growth ?? 0
          setUserChangePct(Number.isFinite(latest) ? latest : 0)
        } catch {
          setUserChangePct(0)
        }
      })
      .catch(() => { })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    categoryService
      .getAllCategories()
      .then((res) => {
        if (!isMounted) return
        const sum = (res?.data || []).reduce((acc, c) => acc + (c.allocated_budget || 0), 0)
        setTotalBudget((prev) => {
          const change = prev > 0 ? ((sum - prev) / prev) * 100 : 0
          setBudgetChangePct(Number.isFinite(change) ? change : 0)
          return sum
        })
      })
      .catch(() => { })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Fetch admin dashboard data for recent activities
    adminService.getDashboardData()
      .then((data) => {
        if (!isMounted) return
        setDashboardData(data)
        setIsLoadingActivities(false)
      })
      .catch((error) => {
        if (!isMounted) return
        console.error('Error fetching dashboard data:', error)
        setIsLoadingActivities(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    
    // Fetch policy and comment data for discussion count
    const fetchDiscussionData = async () => {
      try {
        const [policiesResponse, commentsResponse] = await Promise.all([
          policyService.getAllPolicies(1, 100), // Get more policies for accurate count
          policyCommentService.getCommentStatistics()
        ])
        
        if (!isMounted) return
        
        if (policiesResponse.success && commentsResponse.success) {
          const totalPolicies = policiesResponse.data.length
          const totalComments = commentsResponse.data.total_comments || 0
          
          // Calculate total discussions (policies + comments)
          const totalDiscussions = totalPolicies + totalComments
          setDiscussionCount(totalDiscussions)
          
          // Calculate change percentage (simplified - you can enhance this)
          setDiscussionChangePct(12.5) // You can calculate this based on historical data
        }
      } catch (error) {
        console.error('Error fetching discussion data:', error)
        // Fallback to static data
        setDiscussionCount(1234)
        setDiscussionChangePct(23.1)
      }
    }
    
    fetchDiscussionData()
    
    return () => {
      isMounted = false
    }
  }, [])

  const overviewStats = [
    {
      title: "Total Budget Tracked",
      value: formatCurrency(totalBudget),
      change: `${budgetChangePct >= 0 ? "+" : ""}${budgetChangePct.toFixed(1)}%`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Active Citizens",
      value: userCount.toLocaleString(),
      change: `${userChangePct >= 0 ? "+" : ""}${userChangePct.toFixed(1)}%`,
      icon: Vote,
      color: "text-blue-600",
    },
    {
      title: "Provincial Discussions",
      value: discussionCount.toLocaleString(),
      change: `${discussionChangePct >= 0 ? "+" : ""}${discussionChangePct.toFixed(1)}%`,
      icon: MessageSquare,
      color: "text-purple-600",
    },
  ]

  const recentActivities = [
    {
      type: "spending",
      title: "Colombo Metro Rail Project",
      amount: "Rs. 120B",
      status: "In Progress",
      progress: 67,
      icon: CheckCircle,
      time: "2 hours ago",
    },
    {
      type: "vote",
      title: "Provincial Council Reform Bill",
      amount: "15,432 votes",
      status: "Active",
      progress: 89,
      icon: Vote,
      time: "4 hours ago",
    },
    {
      type: "policy",
      title: "Digital Sri Lanka Act",
      amount: "234 comments",
      status: "Under Review",
      progress: 45,
      icon: FileText,
      time: "6 hours ago",
    },
  ]

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 relative">
      <div className="container mx-auto p-6">
        {/* Top-right fixed buttons */}
        <div className="fixed top-6 right-6 z-[10000] flex gap-3">
          <RegistrationDialog />
          <ConnectButton />
        </div>

        {/* Header */}
        <div className="relative mb-8 z-[9000]">
          <div className="mb-4 flex items-center gap-4">
            <img
              src="/images/sri-lanka-emblem.png"
              alt="Sri Lanka National Emblem"
              className="h-16 w-16 object-contain"
            />
            <div>
              <h1 className="mb-2 text-4xl font-bold text-slate-900">
                ශ්‍රී ලංකා පාරදෘශ්‍ය පාලන වේදිකාව
              </h1>
              <h2 className="mb-2 text-3xl font-bold text-slate-700">
                Sri Lanka Transparent Governance Platform
              </h2>
              <p className="text-lg text-slate-600">
                Blockchain-powered transparent governance for the Democratic Socialist Republic of
                Sri Lanka
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="spending" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Spending
            </TabsTrigger>
            <TabsTrigger value="voting" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Voting
            </TabsTrigger>
            <TabsTrigger value="policy" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Policy
            </TabsTrigger>
            <TabsTrigger value="whistleblowing" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="w-full px-6">
              <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
                {overviewStats.map((stat, index) => (
                  <Card key={index} className="border-0 shadow-md w-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <TrendingUp className="h-3 w-3" />
                        {stat.change} from last month
                      </p>
                      {stat.title === "Provincial Discussions" && (
                        <p className="text-xs text-slate-400 mt-1">
                          Total Policies + Total Comments
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>





            {/* Recent Activities */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activities
                  </CardTitle>
                  <CardDescription>
                    Latest updates across all platform modules
                  </CardDescription>
                </CardHeader>

                {/* Limit height to ~2 items, make rest scrollable */}
                <CardContent className="space-y-4 max-h-40 overflow-y-auto pr-2">
                  {isLoadingActivities ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-slate-500">Loading activities...</p>
                      </div>
                    </div>
                  ) : dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
                    dashboardData.recentActivities.map((activity, index) => {
                      const IconComponent = getIconComponent(activity.icon)
                      const colorClass = {
                        green: 'text-green-600',
                        blue: 'text-blue-600',
                        purple: 'text-purple-600',
                        red: 'text-red-600',
                        indigo: 'text-indigo-600',
                      }[activity.color] || 'text-gray-600'

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className={`h-5 w-5 ${colorClass}`} />
                            <div>
                              <p className="font-medium text-slate-900">{activity.title}</p>
                              <p className="text-sm text-slate-500">{activity.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {activity.timestamp}
                            </Badge>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    // fallback static data
                    recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <activity.icon className="h-5 w-5 text-slate-600" />
                          <div>
                            <p className="font-medium text-slate-900">{activity.title}</p>
                            <p className="text-sm text-slate-500">{activity.amount}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {activity.status}
                          </Badge>
                          <p className="text-xs text-slate-500">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>




              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Blockchain Network Status
                  </CardTitle>
                  <CardDescription>
                    Real-time network health and transaction metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BlockchainVisualization />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="spending">
            <SpendingTracker />
          </TabsContent>

          <TabsContent value="voting">
            <VotingSystem />
          </TabsContent>

          <TabsContent value="policy">
            <PolicyHub />
          </TabsContent>

          <TabsContent value="whistleblowing">
            <WhistleblowingSystem walletAddress={address} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t bg-slate-50 py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <img
                src="/images/sri-lanka-emblem.png"
                alt="Sri Lanka Emblem"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h3 className="font-semibold text-slate-900">Government of Sri Lanka</h3>
                <p className="text-sm text-slate-600">Transparent Governance Initiative</p>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Quick Links</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>
                  <a href="https://www.parliament.lk/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    Parliament of Sri Lanka
                  </a>
                </li>
                <li>
                  <a href="https://www.presidentsoffice.gov.lk/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    Presidential Secretariat
                  </a>
                </li>
                <li>
                  <a href="https://www.gov.lk/webdirectory/provincialcouncils" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    Provincial Councils
                  </a>
                </li>
                <li>
                  <a href="https://mpclg.gov.lk/web/index.php?option=com_content&view=article&id=69&Itemid=188&lang=en" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    Local Government
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Contact</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>Email: info@gov.lk</li>
                <li>Phone: +94 11 234 5678</li>
                <li>Address: Colombo, Sri Lanka</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-4 text-center text-sm text-slate-600">
            <p>
              &copy; 2024 Government of Sri Lanka. All rights reserved. | Built with blockchain
              technology for transparency.
            </p>
          </div>
        </div>
      </footer>

      {/* Chat Widget Container */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]">
        <ChatWidget />
      </div>
    </div>
  )
}

export function Signup() {
  return <SignUpPage />
}