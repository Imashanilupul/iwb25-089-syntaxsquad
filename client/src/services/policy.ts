import { apiService } from './api'

export interface Policy {
  id: number
  name: string
  description: string
  view_full_policy: string
  ministry: string
  status: string
  created_time: string
  updated_at?: string
  effective_date?: string
}

export interface PolicyResponse {
  success: boolean
  message: string
  data: Policy[]
  count: number
  timestamp: number
}

export interface SinglePolicyResponse {
  success: boolean
  message: string
  data: Policy
  timestamp: number
}

export interface CreatePolicyData {
  name: string
  description: string
  view_full_policy: string
  ministry: string
  status?: string
  effective_date?: string
}

export interface UpdatePolicyData {
  name?: string
  description?: string
  view_full_policy?: string
  ministry?: string
  status?: string
  effective_date?: string
}

export interface PolicyStatistics {
  success: boolean
  message: string
  data: {
    totalPolicies: number
    statusCounts: Record<string, number>
    ministryCounts: Record<string, number>
    averagePoliciesPerMinistry: number
  }
  timestamp: number
}

export const policyService = {
  // Get all policies
  async getAllPolicies(): Promise<PolicyResponse> {
    const response = await apiService.get<PolicyResponse>('/api/policies')
    return response
  },

  // Get policy by ID
  async getPolicyById(id: number): Promise<SinglePolicyResponse> {
    const response = await apiService.get<SinglePolicyResponse>(`/api/policies/${id}`)
    return response
  },

  // Create new policy
  async createPolicy(data: CreatePolicyData): Promise<SinglePolicyResponse> {
    const response = await apiService.post<SinglePolicyResponse>('/api/policies', data)
    return response
  },

  // Update policy
  async updatePolicy(id: number, data: UpdatePolicyData): Promise<SinglePolicyResponse> {
    const response = await apiService.put<SinglePolicyResponse>(`/api/policies/${id}`, data)
    return response
  },

  // Delete policy
  async deletePolicy(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete(`/api/policies/${id}`) as { success: boolean; message: string }
    return response
  },

  // Search policies by keyword
  async searchPolicies(keyword: string): Promise<PolicyResponse> {
    const response = await apiService.get<PolicyResponse>(`/api/policies/search/${encodeURIComponent(keyword)}`)
    return response
  },

  // Get policies by status
  async getPoliciesByStatus(status: string): Promise<PolicyResponse> {
    const response = await apiService.get<PolicyResponse>(`/api/policies/status/${encodeURIComponent(status)}`)
    return response
  },

  // Get policies by ministry
  async getPoliciesByMinistry(ministry: string): Promise<PolicyResponse> {
    const response = await apiService.get<PolicyResponse>(`/api/policies/ministry/${encodeURIComponent(ministry)}`)
    return response
  },

  // Get policy statistics
  async getPolicyStatistics(): Promise<PolicyStatistics> {
    const response = await apiService.get<PolicyStatistics>('/api/policies/statistics')
    return response
  },

  // Get active policies
  async getActivePolicies(): Promise<PolicyResponse> {
    const response = await apiService.get<PolicyResponse>('/api/policies/active')
    return response
  },

  // Get draft policies
  async getDraftPolicies(): Promise<PolicyResponse> {
    const response = await apiService.get<PolicyResponse>('/api/policies/draft')
    return response
  },

  // Advanced search with multiple filters
  async searchPoliciesAdvanced(filters: {
    keyword?: string
    ministry?: string
    status?: string
    sortBy?: 'name' | 'created_time' | 'ministry'
    sortOrder?: 'asc' | 'desc'
  }): Promise<PolicyResponse> {
    try {
      // Always start with getting all policies as our base data
      let policies: PolicyResponse
      
      try {
        policies = await this.getAllPolicies()
      } catch (error) {
        console.error('Failed to get base policies:', error)
        return { 
          data: [], 
          count: 0, 
          message: 'Failed to fetch policies',
          success: false,
          timestamp: Date.now()
        }
      }

      // Apply all filters client-side for reliability
      let filteredData = policies.data

      // Apply keyword filter
      if (filters.keyword && filters.keyword.trim()) {
        const keyword = filters.keyword.toLowerCase()
        filteredData = filteredData.filter(policy => 
          policy.name.toLowerCase().includes(keyword) || 
          policy.description.toLowerCase().includes(keyword)
        )
      }

      // Apply ministry filter
      if (filters.ministry && filters.ministry !== 'all') {
        filteredData = filteredData.filter(policy => 
          policy.ministry === filters.ministry
        )
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        filteredData = filteredData.filter(policy => 
          policy.status === filters.status
        )
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredData.sort((a, b) => {
          let aValue: string | number = ''
          let bValue: string | number = ''

          switch (filters.sortBy) {
            case 'name':
              aValue = a.name.toLowerCase()
              bValue = b.name.toLowerCase()
              break
            case 'created_time':
              aValue = new Date(a.created_time).getTime()
              bValue = new Date(b.created_time).getTime()
              break
            case 'ministry':
              aValue = a.ministry.toLowerCase()
              bValue = b.ministry.toLowerCase()
              break
          }

          if (filters.sortOrder === 'desc') {
            return aValue < bValue ? 1 : -1
          }
          return aValue > bValue ? 1 : -1
        })
      }

      return {
        ...policies,
        data: filteredData,
        count: filteredData.length
      }
    } catch (error) {
      console.error('Advanced search failed:', error)
      // Return empty result instead of throwing to prevent UI crashes
      return { 
        data: [], 
        count: 0, 
        message: 'Search failed',
        success: false,
        timestamp: Date.now()
      }
    }
  }
}
