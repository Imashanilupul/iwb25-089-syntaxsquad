"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, ThumbsDown, Users, TrendingUp, Eye, Search, Plus, Globe } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"

export function PolicyHub() {
  const [newComment, setNewComment] = useState("")
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null)

  const policies = [
    {
      id: 1,
      title: "Digital Sri Lanka Strategy 2030",
      description: "Comprehensive digitalization plan for government services and e-governance",
      category: "Technology",
      status: "Public Consultation",
      author: "Ministry of Technology",
      comments: 567,
      likes: 2341,
      dislikes: 456,
      views: 18923,
      lastUpdate: "2 hours ago",
      sentiment: "Positive",
      languages: ["Sinhala", "Tamil", "English"],
    },
    {
      id: 2,
      title: "Sustainable Agriculture Development Act",
      description: "Support for organic farming and climate-resilient agriculture practices",
      category: "Agriculture",
      status: "Under Review",
      author: "Ministry of Agriculture",
      comments: 234,
      likes: 1876,
      dislikes: 234,
      views: 12456,
      lastUpdate: "5 hours ago",
      sentiment: "Positive",
      languages: ["Sinhala", "Tamil", "English"],
    },
    {
      id: 3,
      title: "Public Transport Modernization Plan",
      description: "Investment in electric buses and railway system improvements",
      category: "Transport",
      status: "Draft",
      author: "Ministry of Transport",
      comments: 892,
      likes: 3456,
      dislikes: 234,
      views: 25678,
      lastUpdate: "1 day ago",
      sentiment: "Mixed",
      languages: ["Sinhala", "Tamil", "English"],
    },
  ]

  const comments = [
    {
      id: 1,
      author: "Sarah Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
      content:
        "This policy addresses critical environmental concerns. The 40% reduction target is ambitious but necessary.",
      timestamp: "2 hours ago",
      likes: 23,
      replies: 5,
      verified: true,
    },
    {
      id: 2,
      author: "Michael Chen",
      avatar: "/placeholder.svg?height=32&width=32",
      content: "I appreciate the comprehensive approach, but we need more specific implementation timelines.",
      timestamp: "4 hours ago",
      likes: 18,
      replies: 3,
      verified: false,
    },
    {
      id: 3,
      author: "Dr. Emily Rodriguez",
      avatar: "/placeholder.svg?height=32&width=32",
      content: "As an environmental scientist, I support this initiative. The scientific backing is solid.",
      timestamp: "6 hours ago",
      likes: 45,
      replies: 8,
      verified: true,
    },
  ]

  const sentimentData = [
    { day: "Mon", positive: 65, negative: 20, neutral: 15 },
    { day: "Tue", positive: 70, negative: 18, neutral: 12 },
    { day: "Wed", positive: 68, negative: 22, neutral: 10 },
    { day: "Thu", positive: 72, negative: 16, neutral: 12 },
    { day: "Fri", positive: 75, negative: 15, neutral: 10 },
    { day: "Sat", positive: 73, negative: 17, neutral: 10 },
    { day: "Sun", positive: 71, negative: 19, neutral: 10 },
  ]

  const engagementData = [
    { hour: "00:00", comments: 12, views: 234 },
    { hour: "04:00", comments: 8, views: 156 },
    { hour: "08:00", comments: 45, views: 567 },
    { hour: "12:00", comments: 67, views: 789 },
    { hour: "16:00", comments: 89, views: 923 },
    { hour: "20:00", comments: 56, views: 678 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-yellow-100 text-yellow-800"
      case "Under Review":
        return "bg-blue-100 text-blue-800"
      case "Public Comment":
        return "bg-green-100 text-green-800"
      case "Approved":
        return "bg-emerald-100 text-emerald-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "text-green-600"
      case "Negative":
        return "text-red-600"
      case "Mixed":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Policy Discussion Forum</h2>
          <p className="text-slate-600">Public consultation on Sri Lankan government policies</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search policies..." className="pl-10 w-64" />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Discussion
          </Button>
        </div>
      </div>

      <Tabs defaultValue="discussions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="discussions">Policy Discussions</TabsTrigger>
          <TabsTrigger value="analytics">Sentiment Analytics</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="space-y-6">
          {/* Policy Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-slate-500">Under discussion</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15.2K</div>
                <p className="text-xs text-slate-500">This month</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Sentiment</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">72%</div>
                <p className="text-xs text-slate-500">Positive feedback</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Languages</CardTitle>
                <Globe className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-slate-500">Supported languages</p>
              </CardContent>
            </Card>
          </div>

          {/* Policy List */}
          <div className="space-y-4">
            {policies.map((policy) => (
              <Card key={policy.id} className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{policy.title}</CardTitle>
                        <Badge variant="outline">{policy.category}</Badge>
                        <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
                      </div>
                      <CardDescription>{policy.description}</CardDescription>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>By {policy.author}</span>
                        <span>•</span>
                        <span>Updated {policy.lastUpdate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getSentimentColor(policy.sentiment)}`}>
                        {policy.sentiment} Sentiment
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Engagement Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">{policy.comments} comments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{policy.likes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{policy.dislikes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">{policy.views.toLocaleString()} views</span>
                    </div>
                  </div>

                  {/* Language Support */}
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Available in:</span>
                    <div className="flex gap-1">
                      {policy.languages.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang === "Sinhala" ? "සිංහල" : lang === "Tamil" ? "தமிழ்" : lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <Button variant="outline" size="sm">
                      View Full Policy
                    </Button>
                    <Button size="sm" onClick={() => setSelectedPolicy(policy.id)}>
                      Join Discussion
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comments Section */}
          {selectedPolicy && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Discussion Thread</CardTitle>
                <CardDescription>
                  Join the conversation about {policies.find((p) => p.id === selectedPolicy)?.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* New Comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Share your thoughts on this policy..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button size="sm">Post Comment</Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {comment.author
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.author}</span>
                            {comment.verified && (
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500">{comment.timestamp}</span>
                          </div>
                          <p className="text-slate-700">{comment.content}</p>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600">
                              <ThumbsUp className="h-3 w-3" />
                              {comment.likes}
                            </button>
                            <button className="text-sm text-slate-600 hover:text-blue-600">
                              Reply ({comment.replies})
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Weekly Sentiment Trends</CardTitle>
                <CardDescription>Public opinion analysis across all policies</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    positive: { label: "Positive", color: "#22c55e" },
                    negative: { label: "Negative", color: "#ef4444" },
                    neutral: { label: "Neutral", color: "#6b7280" },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sentimentData}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="positive" fill="#22c55e" />
                      <Bar dataKey="negative" fill="#ef4444" />
                      <Bar dataKey="neutral" fill="#6b7280" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>AI Moderation Stats</CardTitle>
                <CardDescription>Automated content moderation metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">98.7%</div>
                    <div className="text-sm text-green-700">Clean Comments</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-900">1.3%</div>
                    <div className="text-sm text-red-700">Flagged Content</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">156</div>
                    <div className="text-sm text-blue-700">Auto-Moderated</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-900">23</div>
                    <div className="text-sm text-yellow-700">Human Review</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Daily Engagement Patterns</CardTitle>
              <CardDescription>Comment and view activity throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  comments: { label: "Comments", color: "#3b82f6" },
                  views: { label: "Views", color: "#10b981" },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagementData}>
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="comments" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
