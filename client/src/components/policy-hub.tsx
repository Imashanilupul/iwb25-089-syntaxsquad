"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { MessageSquare, ThumbsUp, ThumbsDown, Users, TrendingUp, Eye, Search, Plus, Globe, Loader2, Wallet, X, Send, Reply } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import { policyService, Policy, PolicyStatistics } from "@/services/policy"
import { policyCommentService, PolicyComment } from "@/services/policy-comment"
import { toast } from "@/hooks/use-toast"
import { useAppKitAccount } from '@reown/appkit/react'

// Extended interface for organized comments with replies
interface CommentWithReplies extends PolicyComment {
  replies?: PolicyComment[]
}

export function PolicyHub() {
  const [newComment, setNewComment] = useState("")
  const [replyComment, setReplyComment] = useState("")
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [comments, setComments] = useState<PolicyComment[]>([])
  const [policyStats, setPolicyStats] = useState<any>(null)
  const [commentStats, setCommentStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)
  const [likingComments, setLikingComments] = useState<Set<number>>(new Set())
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set())
  
  // Wallet connection state
  const { isConnected, address } = useAppKitAccount()

  // Fetch data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        
        // Fetch policies
        const policiesResponse = await policyService.getAllPolicies(1, 10)
        if (policiesResponse.success) {
          setPolicies(policiesResponse.data)
        }

        // Fetch policy statistics
        const statsResponse = await policyService.getPolicyStatistics()
        console.log('Policy stats response:', statsResponse)
        if (statsResponse.success) {
          setPolicyStats(statsResponse.statistics)
          console.log('Set policy stats to:', statsResponse.statistics)
        }

        // Fetch comment statistics
        const commentStatsResponse = await policyCommentService.getCommentStatistics()
        console.log('Comment stats response:', commentStatsResponse)
        if (commentStatsResponse.success) {
          setCommentStats(commentStatsResponse.data)
          console.log('Set comment stats to:', commentStatsResponse.data)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: "Failed to load policy data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Fetch comments when dialog opens and a policy is selected
  useEffect(() => {
    const fetchComments = async () => {
      if (selectedPolicy && isCommentDialogOpen) {
        try {
          setCommentsLoading(true)
          const response = await policyCommentService.getCommentsByPolicyId(selectedPolicy)
          if (response.success) {
            setComments(response.data)
          }
        } catch (error) {
          console.error('Error fetching comments:', error)
          toast({
            title: "Error",
            description: "Failed to load comments",
            variant: "destructive"
          })
        } finally {
          setCommentsLoading(false)
        }
      } else {
        setComments([])
      }
    }

    fetchComments()
  }, [selectedPolicy, isCommentDialogOpen])

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedPolicy) return

    try {
      setIsSubmittingComment(true)
      
      // For demo purposes, using user_id = 1. In real app, get from auth context
      const response = await policyCommentService.createPolicyComment({
        comment: newComment.trim(),
        user_id: 1,
        policy_id: selectedPolicy
      })

      if (response.success) {
        setNewComment("")
        // Refresh comments
        const updatedComments = await policyCommentService.getCommentsByPolicyId(selectedPolicy)
        if (updatedComments.success) {
          setComments(updatedComments.data)
        }
        toast({
          title: "Success",
          description: "Comment posted successfully"
        })
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: "Error", 
        description: "Failed to post comment",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Submit reply to comment
  const handleSubmitReply = async () => {
    if (!replyComment.trim() || !selectedPolicy || !replyToCommentId) return

    try {
      setIsSubmittingComment(true)
      
      // Create a new comment with reply_id pointing to parent comment
      const response = await policyCommentService.createPolicyComment({
        comment: replyComment.trim(),
        user_id: 1,
        policy_id: selectedPolicy,
        reply_id: replyToCommentId  // This points to the parent comment
      })

      if (response.success) {
        setReplyComment("")
        setReplyToCommentId(null)
        // Refresh comments
        const updatedComments = await policyCommentService.getCommentsByPolicyId(selectedPolicy)
        if (updatedComments.success) {
          setComments(updatedComments.data)
        }
        toast({
          title: "Success",
          description: "Reply posted successfully"
        })
      }
    } catch (error) {
      console.error('Error posting reply:', error)
      toast({
        title: "Error", 
        description: "Failed to post reply",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Open comment dialog (read-only for viewing comments)
  const openCommentDialog = (policyId: number) => {
    setSelectedPolicy(policyId)
    setIsCommentDialogOpen(true)
  }

  // Close comment dialog
  const closeCommentDialog = () => {
    setIsCommentDialogOpen(false)
    setNewComment("")
    setReplyComment("")
    setReplyToCommentId(null)
    setLikedComments(new Set()) // Reset liked comments when dialog closes
    // Don't reset selectedPolicy here to avoid navigation issues
  }

  // Handle like comment
  const handleLikeComment = async (commentId: number) => {
    if (likingComments.has(commentId)) return // Prevent double-clicking

    const isAlreadyLiked = likedComments.has(commentId)

    try {
      setLikingComments(prev => new Set(prev).add(commentId))
      
      // Call the appropriate API based on current like status
      const response = isAlreadyLiked 
        ? await policyCommentService.unlikeComment(commentId)
        : await policyCommentService.likeComment(commentId)
      
      if (response.success) {
        // Update the local state with the response from the server
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.comment_id === commentId 
              ? { ...comment, likes: response.data.likes }
              : comment
          )
        )

        // Update liked status
        setLikedComments(prev => {
          const newSet = new Set(prev)
          if (isAlreadyLiked) {
            newSet.delete(commentId)
          } else {
            newSet.add(commentId)
          }
          return newSet
        })

        toast({
          title: "Success",
          description: isAlreadyLiked ? "Comment unliked successfully!" : "Comment liked successfully!"
        })
      }

    } catch (error) {
      console.error('Error updating comment like:', error)
      toast({
        title: "Error",
        description: isAlreadyLiked ? "Failed to unlike comment" : "Failed to like comment",
        variant: "destructive"
      })
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  // Handle join discussion click
  const handleJoinDiscussion = (policyId: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to join the discussion",
        variant: "destructive"
      })
      return
    }
    openCommentDialog(policyId)
  }

  // Helper function to get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  // Helper function to organize comments into parent-child structure
  const organizeComments = (comments: PolicyComment[]): CommentWithReplies[] => {
    const parentComments = comments.filter(comment => !comment.reply_id)
    const replyComments = comments.filter(comment => comment.reply_id)
    
    return parentComments.map(parent => ({
      ...parent,
      replies: replyComments.filter(reply => reply.reply_id === parent.comment_id)
    }))
  }

  // Helper function to count total comments (including replies)
  const getTotalCommentCount = () => {
    return comments.length
  }

  // Helper function to count comments for a policy
  const getCommentCount = (policyId: number) => {
    // Use the policy engagement breakdown from comment statistics
    if (commentStats?.policy_engagement_breakdown) {
      return commentStats.policy_engagement_breakdown[policyId.toString()] || 0
    }
    return 0
  }

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
    switch (status?.toUpperCase()) {
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800"
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800"
      case "PUBLIC_CONSULTATION":
        return "bg-green-100 text-green-800"
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800"
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800"
      case "INACTIVE":
        return "bg-gray-100 text-gray-800"
      case "ARCHIVED":
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
          <h2 className="text-2xl font-bold text-slate-900">Policy Discussion Forum</h2>
          <p className="text-slate-600">Public consultation on Sri Lankan government policies</p>
        </div>
        <div className="flex gap-2">
        </div>
      </div>
      <Tabs defaultValue="discussions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discussions">Policy Discussions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="space-y-6">
          {/* Policy Stats */}
          <div className="w-full flex justify-center">
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
        <MessageSquare className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            policyStats?.statistics?.total_policies || policies.length
          )}
        </div>
        <p className="text-xs text-slate-500">Under discussion</p>
      </CardContent>
    </Card>

    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
        <Users className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            commentStats?.total_comments || "0"
          )}
        </div>
        <p className="text-xs text-slate-500">This month</p>
      </CardContent>
    </Card>

    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
        <TrendingUp className="h-4 w-4 text-purple-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            commentStats?.average_likes_per_comment ? Math.round(commentStats.average_likes_per_comment * 100) + "%" : "72%"
          )}
        </div>
        <p className="text-xs text-slate-500">Positive feedback</p>
      </CardContent>
    </Card>
  </div>
</div>


          {/* Policy List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading policies...</span>
              </div>
            ) : policies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No policies found</p>
              </div>
            ) : (
              policies.map((policy) => (
                <Card key={policy.id} className="border-0 shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{policy.name}</CardTitle>
                          <Badge variant="outline">Government Policy</Badge>
                          <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
                        </div>
                        <CardDescription>{policy.description}</CardDescription>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>By {policy.ministry}</span>
                          <span>•</span>
                          <span>Updated {getRelativeTime(policy.updated_at || policy.created_time)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          Active Policy
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Engagement Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-500" />
                        <span className="text-sm">{getCommentCount(policy.id)} comments</span>
                      </div>
                      <button 
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => openCommentDialog(policy.id)}
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Comments</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span className="text-sm">Public</span>
                      </div>
                    </div>

                    {/* Language Support */}
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">Available in:</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">සිංහල</Badge>
                        <Badge variant="outline" className="text-xs">தமிழ்</Badge>
                        <Badge variant="outline" className="text-xs">English</Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => {
                        // Open policy in new tab or modal
                        window.open(`data:text/html,<html><body><h1>${policy.name}</h1><p>${policy.view_full_policy}</p></body></html>`, '_blank')
                      }}>
                        View Full Policy
                      </Button>
                      
                      <Button 
                        size="sm" 
                        onClick={() => handleJoinDiscussion(policy.id)}
                        disabled={!isConnected}
                        className={!isConnected ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        {!isConnected && <Wallet className="h-4 w-4 mr-2" />}
                        {isConnected ? "Join Discussion" : "Connect Wallet to Discuss"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>Public opinion trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    positive: {
                      label: "Positive",
                      color: "#10b981",
                    },
                    negative: {
                      label: "Negative", 
                      color: "#ef4444",
                    },
                    neutral: {
                      label: "Neutral",
                      color: "#6b7280",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentimentData}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="neutral" stroke="#6b7280" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Comments and views by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    comments: {
                      label: "Comments",
                      color: "#3b82f6",
                    },
                    views: {
                      label: "Views",
                      color: "#8b5cf6",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="comments" fill="#3b82f6" />
                      <Bar dataKey="views" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={closeCommentDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-lg font-semibold">
              {policies.find((p) => p.id === selectedPolicy)?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {isConnected 
                ? `Join the conversation • Connected as ${address?.slice(0, 6)}...${address?.slice(-4)}`
                : "Viewing comments • Connect your wallet to participate in the discussion"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-[70vh]">
            {/* Comments Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="font-medium text-lg mb-2">Start the conversation</h3>
                  <p>Be the first to share your thoughts about this policy!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 mb-4">
                    {getTotalCommentCount()} comment{getTotalCommentCount() !== 1 ? 's' : ''}
                  </h4>
                  {organizeComments(comments).map((parentComment) => (
                    <div key={parentComment.comment_id} className="space-y-3">
                      {/* Parent Comment */}
                      <div className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                              U{parentComment.user_id}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">User {parentComment.user_id}</span>
                              <span className="text-xs text-slate-500">{getRelativeTime(parentComment.created_at)}</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{parentComment.comment}</p>
                            
                            {/* Comment Actions */}
                            <div className="flex items-center gap-4 pt-2">
                              <button 
                                className={`flex items-center gap-1 text-sm transition-colors disabled:opacity-50 ${
                                  likedComments.has(parentComment.comment_id)
                                    ? 'text-blue-600 hover:text-blue-700'
                                    : 'text-slate-600 hover:text-blue-600'
                                }`}
                                onClick={() => handleLikeComment(parentComment.comment_id)}
                                disabled={likingComments.has(parentComment.comment_id)}
                                title={
                                  likedComments.has(parentComment.comment_id) 
                                    ? 'Unlike this comment' 
                                    : 'Like this comment'
                                }
                              >
                                {likingComments.has(parentComment.comment_id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ThumbsUp 
                                    className={`h-4 w-4 ${
                                      likedComments.has(parentComment.comment_id) ? 'fill-current' : ''
                                    }`} 
                                  />
                                )}
                                <span>{parentComment.likes || 0}</span>
                              </button>
                              <button 
                                className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors"
                                onClick={() => {
                                  if (replyToCommentId === parentComment.comment_id) {
                                    setReplyToCommentId(null)
                                    setReplyComment("")
                                  } else {
                                    setReplyToCommentId(parentComment.comment_id)
                                    setReplyComment("")
                                  }
                                }}
                              >
                                <Reply className="h-4 w-4" />
                                <span>Reply</span>
                              </button>
                              {parentComment.replies && parentComment.replies.length > 0 && (
                                <span className="text-xs text-slate-500">
                                  {parentComment.replies.length} repl{parentComment.replies.length === 1 ? 'y' : 'ies'}
                                </span>
                              )}
                            </div>
                            
                            {/* Reply Form for this comment */}
                            {replyToCommentId === parentComment.comment_id && (
                              <div className="mt-3 space-y-2">
                                <Textarea
                                  placeholder="Write a reply..."
                                  value={replyComment}
                                  onChange={(e) => setReplyComment(e.target.value)}
                                  className="min-h-[80px] text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={handleSubmitReply}
                                    disabled={isSubmittingComment || !replyComment.trim()}
                                    className="h-8 px-3 text-sm"
                                  >
                                    {isSubmittingComment ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Send className="h-3 w-3 mr-1" />
                                        Reply
                                      </>
                                    )}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setReplyToCommentId(null)
                                      setReplyComment("")
                                    }}
                                    className="h-8 px-3 text-sm"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Replies to this comment */}
                      {parentComment.replies && parentComment.replies.length > 0 && (
                        <div className="ml-12 space-y-2">
                          {parentComment.replies.map((reply) => (
                            <div key={reply.comment_id} className="bg-white border border-slate-200 rounded-lg p-3">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-7 w-7 border border-slate-200">
                                  <AvatarImage src="/placeholder.svg" />
                                  <AvatarFallback className="bg-green-100 text-green-700 text-xs font-medium">
                                    U{reply.user_id}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-slate-900">User {reply.user_id}</span>
                                    <span className="text-xs text-slate-500">{getRelativeTime(reply.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed">{reply.comment}</p>
                                  <div className="flex items-center gap-3 pt-1">
                                    <button 
                                      className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
                                        likedComments.has(reply.comment_id)
                                          ? 'text-blue-600 hover:text-blue-700'
                                          : 'text-slate-600 hover:text-blue-600'
                                      }`}
                                      onClick={() => handleLikeComment(reply.comment_id)}
                                      disabled={likingComments.has(reply.comment_id)}
                                      title={
                                        likedComments.has(reply.comment_id) 
                                          ? 'Unlike this reply' 
                                          : 'Like this reply'
                                      }
                                    >
                                      {likingComments.has(reply.comment_id) ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <ThumbsUp 
                                          className={`h-3 w-3 ${
                                            likedComments.has(reply.comment_id) ? 'fill-current' : ''
                                          }`} 
                                        />
                                      )}
                                      <span>{reply.likes || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* New Comment Form - Fixed at bottom */}
            {isConnected && (
              <div className="border-t bg-white p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-green-100 text-green-700 text-sm font-medium">
                        Me
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder="What are your thoughts on this policy?"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px] resize-none border-slate-200 focus:border-blue-300 transition-colors"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={handleSubmitComment}
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="h-9 px-4"
                    >
                      {isSubmittingComment ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Wallet connection prompt for non-connected users */}
            {!isConnected && (
              <div className="border-t bg-slate-50 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm">Connect your wallet to join the discussion</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    You can view comments without connecting, but need a wallet to participate
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
