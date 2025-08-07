"use client"

import { useState } from "react"
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
} from "lucide-react"
import { SpendingTracker } from "@/components/spending-tracker"
import { VotingSystem } from "@/components/voting-system"
import { PolicyHub } from "@/components/policy-hub"
import { WhistleblowingSystem } from "@/components/whistleblowing-system"
import { ConnectButton } from "@/components/walletConnect/wallet-connect"
import { BlockchainVisualization } from "@/components/blockchain-visualization"
import SignUpPage from "@/components/signup"

export default function CivicPlatform() {
  const [activeTab, setActiveTab] = useState("overview")

  const overviewStats = [
    {
      title: "Total Budget Tracked",
      value: "Rs. 2.4T",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Active Citizens",
      value: "1.2M",
      change: "+8.2%",
      icon: Vote,
      color: "text-blue-600",
    },
    {
      title: "Provincial Discussions",
      value: "1,234",
      change: "+23.1%",
      icon: MessageSquare,
      color: "text-purple-600",
    },
    {
      title: "Transparency Score",
      value: "94.2%",
      change: "+2.1%",
      icon: Shield,
      color: "text-emerald-600",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-green-50">
      <div className="container mx-auto p-6">
        <div className="fixed top-6 right-6 z-50">
          <ConnectButton />
        </div>
        {/* Header */}
        <div className="relative mb-8">
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {overviewStats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-md">
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
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activities
                  </CardTitle>
                  <CardDescription>Latest updates across all platform modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivities.map((activity, index) => (
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
                  ))}
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
            <WhistleblowingSystem />
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
                  <a href="#" className="hover:text-blue-600">
                    Parliament of Sri Lanka
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Presidential Secretariat
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Provincial Councils
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Local Government
                  </a>
                </li>
                <li>
                  <a href="/signup" className="hover:text-blue-600">
                    sign up
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
    </div>
  )
}

export function Signup() {
  return <SignUpPage />
}
