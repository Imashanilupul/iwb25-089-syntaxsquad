import { apiService } from './api'

export interface PolicyComment {
  comment_id: number
  comment: string
  user_id: number
  policy_id: number
  reply_id?: number
  reply_comment?: string
  likes: number
  created_at: string
  updated_at?: string
}

export interface PolicyCommentResponse {
  success: boolean
  message: string
  data: PolicyComment[]
  count: number
  timestamp: number
}

export interface CreatePolicyCommentData {
  comment: string
  user_id: number
  policy_id: number
  reply_id?: number
  reply_comment?: string
}

export interface PolicyCommentStatistics {
  success: boolean
  message: string
  data: {
    total_comments: number
    total_likes: number
    replies_count: number
    average_likes_per_comment: number
    user_activity_breakdown: Record<string, number>
    policy_engagement_breakdown: Record<string, number>
  }
  timestamp: number
}

export const policyCommentService = {
  // Get all policy comments
  async getAllPolicyComments(): Promise<PolicyCommentResponse> {
    const response = await apiService.get<PolicyCommentResponse>('/api/policycomments')
    return response
  },

  // Get policy comment by ID
  async getPolicyCommentById(id: number): Promise<{ success: boolean; message: string; data: PolicyComment; timestamp: number }> {
    const response = await apiService.get(`/api/policycomments/${id}`) as { success: boolean; message: string; data: PolicyComment; timestamp: number }
    return response
  },

  // Create new policy comment
  async createPolicyComment(data: CreatePolicyCommentData): Promise<{ success: boolean; message: string; data: PolicyComment; timestamp: number }> {
    const response = await apiService.post('/api/policycomments', data) as { success: boolean; message: string; data: PolicyComment; timestamp: number }
    return response
  },

  // Update policy comment
  async updatePolicyComment(id: number, data: Partial<CreatePolicyCommentData>): Promise<{ success: boolean; message: string; data: PolicyComment; timestamp: number }> {
    const response = await apiService.put(`/api/policycomments/${id}`, data) as { success: boolean; message: string; data: PolicyComment; timestamp: number }
    return response
  },

  // Delete policy comment
  async deletePolicyComment(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete(`/api/policycomments/${id}`) as { success: boolean; message: string }
    return response
  },

  // Get comments by policy ID
  async getCommentsByPolicyId(policyId: number): Promise<PolicyCommentResponse> {
    const response = await apiService.get<PolicyCommentResponse>(`/api/policycomments/policy/${policyId}`)
    return response
  },

  // Get comments by user ID
  async getCommentsByUserId(userId: number): Promise<PolicyCommentResponse> {
    const response = await apiService.get<PolicyCommentResponse>(`/api/policycomments/user/${userId}`)
    return response
  },

  // Get replies to a comment
  async getRepliesByCommentId(commentId: number): Promise<PolicyCommentResponse> {
    const response = await apiService.get<PolicyCommentResponse>(`/api/policycomments/${commentId}/replies`)
    return response
  },

  // Search comments by keyword
  async searchComments(keyword: string): Promise<PolicyCommentResponse> {
    const response = await apiService.get<PolicyCommentResponse>(`/api/policycomments/search/${encodeURIComponent(keyword)}`)
    return response
  },

  // Get comment statistics
  async getCommentStatistics(): Promise<PolicyCommentStatistics> {
    const response = await apiService.get<PolicyCommentStatistics>('/api/policycomments/statistics')
    return response
  },

  // Get recent comments
  async getRecentComments(): Promise<PolicyCommentResponse> {
    const response = await apiService.get<PolicyCommentResponse>('/api/policycomments/recent')
    return response
  },

  // Like a comment
  async likeComment(commentId: number): Promise<{ success: boolean; message: string; data: PolicyComment; timestamp: number }> {
    const response = await apiService.post(`/api/policycomments/${commentId}/like`) as { success: boolean; message: string; data: PolicyComment; timestamp: number }
    return response
  },

  // Unlike a comment
  async unlikeComment(commentId: number): Promise<{ success: boolean; message: string; data: PolicyComment; timestamp: number }> {
    const response = await apiService.post(`/api/policycomments/${commentId}/unlike`) as { success: boolean; message: string; data: PolicyComment; timestamp: number }
    return response
  },

  // Get top liked comments
  async getTopLikedComments(limit: number = 10): Promise<PolicyCommentResponse> {
    const response = await apiService.get<PolicyCommentResponse>(`/api/policycomments/top/${limit}`)
    return response
  },

  // Get comment count for a specific policy (helper method)
  async getCommentCountForPolicy(policyId: number): Promise<number> {
    try {
      const response = await this.getCommentsByPolicyId(policyId)
      return response.count
    } catch (error) {
      console.error(`Failed to get comment count for policy ${policyId}:`, error)
      return 0
    }
  }
}
