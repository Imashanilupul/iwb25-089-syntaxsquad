import { apiService } from './api'
import { createPolicyOnBlockchain, updatePolicyStatusOnBlockchain, type BlockchainPolicyData } from './blockchain-policy'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  offset: number
  hasNext: boolean
  hasPrev: boolean
}

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
  count?: number
  pagination?: PaginationMeta
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
  statistics: {
    total_policies: number
    status_distribution: Record<string, number>
    ministry_distribution: Record<string, number>
  }
  timestamp: number
}

export const policyService = {
  // Get all policies with pagination
  async getAllPolicies(page: number = 1, pageLimit: number = 20): Promise<PolicyResponse> {
    const response = await apiService.get<PolicyResponse>(`/api/policies?page=${page}&pageLimit=${pageLimit}`)
    return response
  },

  // Get all policies without pagination (for searches, dropdowns, etc.)
  async getAllPoliciesUnpaginated(): Promise<PolicyResponse> {
    const response = await apiService.get<PolicyResponse>('/api/policies?pageLimit=1000')
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

  // Create new policy with blockchain integration
  async createPolicyWithBlockchain(data: CreatePolicyData): Promise<SinglePolicyResponse & { blockchain?: any }> {
    try {
      console.log("🏛️ Creating policy with blockchain integration...");
      
      // Step 1: Create policy in database via Ballerina backend
      console.log("💾 Step 1: Creating policy in database...");
      const dbResponse = await apiService.post<SinglePolicyResponse>('/api/policies', data)
      
      if (!dbResponse.success) {
        throw new Error(dbResponse.message || 'Failed to create policy in database')
      }

      // Step 2: Prepare blockchain data
      const blockchainData: BlockchainPolicyData = {
        name: data.name,
        description: data.description,
        viewFullPolicy: data.view_full_policy,
        ministry: data.ministry,
        effectiveDate: data.effective_date
      }

      // Step 3: Create policy on blockchain
      console.log("⛓️ Step 2: Creating policy on blockchain...");
      const blockchainResponse = await createPolicyOnBlockchain(blockchainData)
      
      if (blockchainResponse.success && blockchainResponse.data) {
        console.log("✅ Policy created on blockchain successfully!");
        
        // Step 4: Update database with blockchain data if needed
        try {
          const confirmPayload = {
            txHash: blockchainResponse.data.transactionHash,
            blockNumber: blockchainResponse.data.blockNumber,
            policyId: blockchainResponse.data.policyId,
            descriptionCid: blockchainResponse.data.ipfs?.descriptionCid
          }
          
          // Call confirm endpoint to update database with blockchain data
          await apiService.post(`/api/policies/${dbResponse.data.id}/confirm`, confirmPayload)
          console.log("✅ Database updated with blockchain confirmation!");
          
        } catch (confirmError) {
          console.warn("⚠️ Failed to update database with blockchain data:", confirmError);
          // Don't fail the entire operation for this
        }

        return {
          ...dbResponse,
          blockchain: blockchainResponse.data,
          message: "Policy created successfully on database and blockchain!"
        }
      } else {
        console.warn("⚠️ Blockchain creation failed, but database entry exists");
        return {
          ...dbResponse,
          blockchain: null,
          message: "Policy created in database (blockchain creation failed)"
        }
      }
      
    } catch (error) {
      console.error("❌ Failed to create policy:", error);
      throw error;
    }
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
        policies = await this.getAllPoliciesUnpaginated()
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
  },

  // Get unique ministries from the database
  async getUniqueMinistries(): Promise<string[]> {
    try {
      const response = await this.getAllPoliciesUnpaginated()
      if (response.success) {
        // Extract unique ministries from the policies
        const ministries = Array.from(new Set(response.data.map(policy => policy.ministry)))
        return ministries.filter(ministry => ministry && ministry.trim().length > 0).sort()
      }
      return []
    } catch (error) {
      console.error('Failed to get unique ministries:', error)
      return []
    }
  },

  // Search ministries by keyword for autocomplete
  async searchMinistries(keyword: string): Promise<string[]> {
    try {
      const allMinistries = await this.getUniqueMinistries()
      if (!keyword || keyword.trim().length === 0) {
        return allMinistries
      }
      
      const lowerKeyword = keyword.toLowerCase()
      return allMinistries.filter(ministry => 
        ministry.toLowerCase().includes(lowerKeyword)
      )
    } catch (error) {
      console.error('Failed to search ministries:', error)
      return []
    }
  }
}
