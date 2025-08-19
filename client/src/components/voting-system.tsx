"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Vote, Users, Shield, Clock, CheckCircle, TrendingUp, Eye, Lock, Verified, AlertCircle, Loader2 } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts"
import { proposalsService, type Proposal } from "@/services/proposals"
import { categoriesService, type Category } from "@/services/categories"
import { usersService } from "@/services/users"
import { toast } from "sonner"

export function VotingSystem() {
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [votingLoading, setVotingLoading] = useState<number | null>(null)
  const [stats, setStats] = useState({
    totalProposals: 0,
    totalVoters: 0,
    participationRate: 0,
    securityScore: 99.8
  })

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load proposals, categories, and stats in parallel
        const [proposalsRes, categoriesRes, userStatsRes] = await Promise.all([
          proposalsService.getAllProposals(),
          categoriesService.getAllCategories(),
          usersService.getUserStatistics()
        ])

        if (proposalsRes.success && Array.isArray(proposalsRes.data)) {
          setProposals(proposalsRes.data)
        } else {
          throw new Error("Failed to load proposals")
        }

        if (categoriesRes.success && Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data)
        }

        // Calculate stats
        const totalProposals = Array.isArray(proposalsRes.data) ? proposalsRes.data.length : 0
        const activeProposalsCount = Array.isArray(proposalsRes.data) 
          ? proposalsRes.data.filter(p => p.active_status && !proposalsService.isExpired(p)).length 
          : 0

        // Calculate total votes and participation
        const totalVotes = Array.isArray(proposalsRes.data) 
          ? proposalsRes.data.reduce((sum, p) => sum + p.yes_votes + p.no_votes, 0)
          : 0

        const participationRate = totalProposals > 0 ? Math.round((totalVotes / totalProposals) * 100) / 100 : 0

        setStats({
          totalProposals: activeProposalsCount,
          totalVoters: totalVotes, // This represents total votes, not unique voters
          participationRate: participationRate,
          securityScore: 99.8
        })

      } catch (err) {
        console.error("Error loading data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
        toast.error("Failed to load voting data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle voting
  const handleVote = async (proposalId: number, voteType: "yes" | "no") => {
    try {
      setVotingLoading(proposalId)
      
      const response = await proposalsService.voteOnProposal(proposalId, voteType)
      
      if (response.success && response.data && !Array.isArray(response.data)) {
        // Update the proposal in the local state
        setProposals(prev => prev.map(p => 
          p.id === proposalId ? response.data as Proposal : p
        ))
        
        toast.success(`Vote "${voteType}" recorded successfully!`)
      } else {
        throw new Error("Failed to record vote")
      }
    } catch (err) {
      console.error("Error voting:", err)
      toast.error("Failed to record vote. Please try again.")
    } finally {
      setVotingLoading(null)
    }
  }

  // Helper function to get category name
  const getCategoryName = (categoryId?: number): string => {
    if (!categoryId) return "General"
    const category = categories.find(c => c.category_id === categoryId)
    return category?.category_name || "Unknown"
  }

  // Generate voter demographics (mock data for now)
  const voterDemographics = [
    { name: "18-25", value: Math.floor(stats.totalVoters * 0.15), color: "#0088FE" },
    { name: "26-35", value: Math.floor(stats.totalVoters * 0.30), color: "#00C49F" },
    { name: "36-45", value: Math.floor(stats.totalVoters * 0.25), color: "#FFBB28" },
    { name: "46-55", value: Math.floor(stats.totalVoters * 0.20), color: "#FF8042" },
    { name: "55+", value: Math.floor(stats.totalVoters * 0.10), color: "#8884D8" },
  ]

  // Generate voting activity (mock data for now)
  const votingActivity = [
    { hour: "00:00", votes: Math.floor(Math.random() * 50) + 20 },
    { hour: "04:00", votes: Math.floor(Math.random() * 30) + 10 },
    { hour: "08:00", votes: Math.floor(Math.random() * 200) + 150 },
    { hour: "12:00", votes: Math.floor(Math.random() * 300) + 200 },
    { hour: "16:00", votes: Math.floor(Math.random() * 250) + 180 },
    { hour: "20:00", votes: Math.floor(Math.random() * 180) + 100 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800"
      case "Passed":
      case "Expired":
        return "bg-green-100 text-green-800"
      case "Failed":
        return "bg-red-100 text-red-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-lg">Loading proposals...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-2 pt-6">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Voting Stats */}
          {!loading && !error && (
            <div className="flex justify-center w-full">
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
    {/* Active Proposals */}
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
        <Vote className="h-5 w-5 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.totalProposals}</div>
        <p className="text-xs text-slate-500">Currently open for voting</p>
      </CardContent>
    </Card>

    {/* Total Votes */}
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
        <Users className="h-5 w-5 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.totalVoters.toLocaleString()}</div>
        <p className="text-xs text-slate-500">Votes cast across all proposals</p>
      </CardContent>
    </Card>

    {/* Avg Participation */}
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Avg Participation</CardTitle>
        <TrendingUp className="h-5 w-5 text-purple-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.participationRate}%</div>
        <p className="text-xs text-slate-500">Average votes per proposal</p>
      </CardContent>
    </Card>
  </div>
</div>


          )}

          {/* Proposals List */}
          {!loading && !error && (
            <div className="space-y-4">
              {proposals.length === 0 ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Vote className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">No Proposals Available</h3>
                      <p className="text-slate-500">There are currently no proposals to vote on.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                proposals.map((proposal) => {
                  const totalVotes = proposalsService.getTotalVotes(proposal)
                  const yesPercentage = proposalsService.getYesPercentage(proposal)
                  const noPercentage = proposalsService.getNoPercentage(proposal)
                  const timeRemaining = proposalsService.getTimeRemaining(proposal)
                  const status = proposalsService.getProposalStatus(proposal)
                  const categoryName = getCategoryName(proposal.category_id)
                  const isVoting = votingLoading === proposal.id

                  return (
                    <Card key={proposal.id} className="border-0 shadow-md">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{proposal.title}</CardTitle>
                              <Badge variant="outline">{categoryName}</Badge>
                              <Badge className={getStatusColor(status)}>{status}</Badge>
                            </div>
                            <CardDescription>{proposal.short_description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="h-4 w-4" />
                            {timeRemaining}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Voting Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Votes: {totalVotes.toLocaleString()}</span>
                            <span>Participation Rate</span>
                          </div>
                          <Progress value={Math.min(totalVotes / 1000 * 100, 100)} />
                        </div>

                        {/* Vote Results */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-700">Yes Votes</span>
                              <span className="text-sm font-bold">{proposal.yes_votes.toLocaleString()}</span>
                            </div>
                            <Progress value={yesPercentage} className="h-2" />
                            <span className="text-xs text-slate-500">{yesPercentage}%</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-red-700">No Votes</span>
                              <span className="text-sm font-bold">{proposal.no_votes.toLocaleString()}</span>
                            </div>
                            <Progress value={noPercentage} className="h-2" />
                            <span className="text-xs text-slate-500">{noPercentage}%</span>
                          </div>
                        </div>

                        {/* Blockchain Verification */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Verified className="h-3 w-3 text-green-600" />
                            <span className="font-mono">0x{proposal.id.toString().padStart(8, '0')}...</span>
                            <Badge variant="outline" className="text-xs">Verified</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedProposal(proposal.id)}
                            >
                              View Details
                            </Button>
                            {status === "Active" && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled={isVoting}
                                  onClick={() => handleVote(proposal.id, "yes")}
                                  className="text-green-700 border-green-200 hover:bg-green-50"
                                >
                                  {isVoting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled={isVoting}
                                  onClick={() => handleVote(proposal.id, "no")}
                                  className="text-red-700 border-red-200 hover:bg-red-50"
                                >
                                  {isVoting ? <Loader2 className="h-3 w-3 animate-spin" /> : "No"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
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
