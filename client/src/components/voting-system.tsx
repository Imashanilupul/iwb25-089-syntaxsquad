"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Vote, Users, Shield, Clock, CheckCircle, TrendingUp, Eye, Lock, Verified } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts"

export function VotingSystem() {
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null)

  const activeProposals = [
    {
      id: 1,
      title: "Provincial Council Powers Amendment",
      description: "Proposal to devolve more administrative powers to Provincial Councils",
      category: "Constitutional Reform",
      totalVotes: 154320,
      yesVotes: 98760,
      noVotes: 55560,
      status: "Active",
      timeRemaining: "5 days",
      requiredVotes: 200000,
      blockchainHash: "0xa1b2c3d4...",
      verificationStatus: "Verified",
    },
    {
      id: 2,
      title: "Renewable Energy Development Act",
      description: "Investment in solar and wind energy infrastructure across all provinces",
      category: "Environment",
      totalVotes: 82340,
      yesVotes: 61230,
      noVotes: 21110,
      status: "Active",
      timeRemaining: "12 days",
      requiredVotes: 150000,
      blockchainHash: "0xe5f6g7h8...",
      verificationStatus: "Verified",
    },
    {
      id: 3,
      title: "Free Education Enhancement Bill",
      description: "Increase funding for public schools and universities by 20%",
      category: "Education",
      totalVotes: 221560,
      yesVotes: 182340,
      noVotes: 39220,
      status: "Passed",
      timeRemaining: "Completed",
      requiredVotes: 200000,
      blockchainHash: "0xi9j0k1l2...",
      verificationStatus: "Verified",
    },
  ]

  const voterDemographics = [
    { name: "18-25", value: 2340, color: "#0088FE" },
    { name: "26-35", value: 4567, color: "#00C49F" },
    { name: "36-45", value: 3890, color: "#FFBB28" },
    { name: "46-55", value: 2876, color: "#FF8042" },
    { name: "55+", value: 1759, color: "#8884D8" },
  ]

  const votingActivity = [
    { hour: "00:00", votes: 45 },
    { hour: "04:00", votes: 23 },
    { hour: "08:00", votes: 189 },
    { hour: "12:00", votes: 267 },
    { hour: "16:00", votes: 234 },
    { hour: "20:00", votes: 156 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800"
      case "Passed":
        return "bg-green-100 text-green-800"
      case "Failed":
        return "bg-red-100 text-red-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculatePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Digital Voting System</h2>
        <p className="text-slate-600">Secure electronic voting for Sri Lankan citizens</p>
      </div>

      <Tabs defaultValue="proposals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="proposals">Active Proposals</TabsTrigger>
          <TabsTrigger value="analytics">Voting Analytics</TabsTrigger>
          <TabsTrigger value="verification">Blockchain Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-6">
          {/* Voting Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
                <Vote className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-slate-500">Currently open for voting</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2M</div>
                <p className="text-xs text-slate-500">Registered voters</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73.2%</div>
                <p className="text-xs text-slate-500">Above average turnout</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                <Shield className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.8%</div>
                <p className="text-xs text-slate-500">Zero-knowledge verified</p>
              </CardContent>
            </Card>
          </div>

          {/* Proposals List */}
          <div className="space-y-4">
            {activeProposals.map((proposal) => (
              <Card key={proposal.id} className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{proposal.title}</CardTitle>
                        <Badge variant="outline">{proposal.category}</Badge>
                        <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                      </div>
                      <CardDescription>{proposal.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="h-4 w-4" />
                      {proposal.timeRemaining}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Voting Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Participation: {proposal.totalVotes.toLocaleString()} /{" "}
                        {proposal.requiredVotes.toLocaleString()}
                      </span>
                      <span>{Math.round((proposal.totalVotes / proposal.requiredVotes) * 100)}%</span>
                    </div>
                    <Progress value={(proposal.totalVotes / proposal.requiredVotes) * 100} />
                  </div>

                  {/* Vote Results */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-700">Yes Votes</span>
                        <span className="text-sm font-bold">{proposal.yesVotes.toLocaleString()}</span>
                      </div>
                      <Progress value={calculatePercentage(proposal.yesVotes, proposal.totalVotes)} className="h-2" />
                      <span className="text-xs text-slate-500">
                        {calculatePercentage(proposal.yesVotes, proposal.totalVotes)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-700">No Votes</span>
                        <span className="text-sm font-bold">{proposal.noVotes.toLocaleString()}</span>
                      </div>
                      <Progress value={calculatePercentage(proposal.noVotes, proposal.totalVotes)} className="h-2" />
                      <span className="text-xs text-slate-500">
                        {calculatePercentage(proposal.noVotes, proposal.totalVotes)}%
                      </span>
                    </div>
                  </div>

                  {/* Blockchain Verification */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Verified className="h-3 w-3 text-green-600" />
                      <span className="font-mono">{proposal.blockchainHash}</span>
                      <Badge variant="outline" className="text-xs">
                        {proposal.verificationStatus}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {proposal.status === "Active" && <Button size="sm">Cast Vote</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Voter Demographics</CardTitle>
                <CardDescription>Age distribution of active voters</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Voters", color: "#0088FE" },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={voterDemographics}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {voterDemographics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Voting Activity</CardTitle>
                <CardDescription>Hourly voting patterns today</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    votes: { label: "Votes", color: "#8884D8" },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={votingActivity}>
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="votes" fill="#8884D8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Blockchain Verification System
              </CardTitle>
              <CardDescription>Zero-knowledge proof verification and immutable vote recording</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center items-center w-full px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-screen-lg w-full">

                  <div className="p-6 bg-green-50 rounded-2xl shadow-md flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-lg font-semibold text-green-800">Votes Verified</span>
                    </div>
                    <p className="text-3xl font-bold text-green-900">45,892</p>
                    <p className="text-sm text-green-700 mt-1">100% verification rate</p>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-2xl shadow-md flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="h-6 w-6 text-blue-600" />
                      <span className="text-lg font-semibold text-blue-800">Anonymous Votes</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">45,892</p>
                    <p className="text-sm text-blue-700 mt-1">Zero identity exposure</p>
                  </div>
                  <div className="hidden lg:block"></div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-slate-50">
                <h4 className="font-semibold mb-2">Latest Blockchain Transactions</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span>0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6</span>
                    <Badge variant="outline">Verified</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>0xb2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7</span>
                    <Badge variant="outline">Verified</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>0xc3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8</span>
                    <Badge variant="outline">Verified</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
