import apiService from "./api"

export interface Proposal {
  id: number
  title: string
  short_description: string
  description_in_details: string
  active_status: boolean
  expired_date: string
  yes_votes: number
  no_votes: number
  category_id?: number
  created_by?: number
  removed?: boolean
  created_at?: string
  updated_at?: string
}

export interface ProposalFormData {
  title: string
  shortDescription: string
  descriptionInDetails: string
  activeStatus: boolean
  expiredDate: string
  yesVotes?: number
  noVotes?: number
  categoryId?: number
  createdBy?: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  count?: number
  timestamp: number
}

class ProposalService {
  private baseUrl = "/api/proposals"

  // Get all proposals
  async getAllProposals(): Promise<ApiResponse<Proposal[]>> {
    return await apiService.get<ApiResponse<Proposal[]>>(this.baseUrl)
  }

  // Get proposal by ID
  async getProposalById(id: number): Promise<ApiResponse<Proposal>> {
    return await apiService.get<ApiResponse<Proposal>>(`${this.baseUrl}/${id}`)
  }

  // Create new proposal
  async createProposal(proposalData: ProposalFormData): Promise<ApiResponse<Proposal>> {
    return await apiService.post<ApiResponse<Proposal>>(this.baseUrl, proposalData)
  }

  // Update proposal
  async updateProposal(id: number, proposalData: Partial<ProposalFormData>): Promise<ApiResponse<Proposal>> {
    return await apiService.put<ApiResponse<Proposal>>(`${this.baseUrl}/${id}`, proposalData)
  }

  // Delete proposal
  async deleteProposal(id: number): Promise<ApiResponse<{ proposalId: number }>> {
    return await apiService.delete<ApiResponse<{ proposalId: number }>>(`${this.baseUrl}/${id}`)
  }

  // Get proposals by category
  async getProposalsByCategory(categoryId: number): Promise<ApiResponse<Proposal[]>> {
    return await apiService.get<ApiResponse<Proposal[]>>(`${this.baseUrl}/category/${categoryId}`)
  }

  // Get proposals by status
  async getProposalsByStatus(activeStatus: boolean): Promise<ApiResponse<Proposal[]>> {
    return await apiService.get<ApiResponse<Proposal[]>>(`${this.baseUrl}/status/${activeStatus}`)
  }

  // Get proposals by creator
  async getProposalsByCreator(createdBy: number): Promise<ApiResponse<Proposal[]>> {
    return await apiService.get<ApiResponse<Proposal[]>>(`${this.baseUrl}/creator/${createdBy}`)
  }

  // Search proposals
  async searchProposals(keyword: string): Promise<ApiResponse<Proposal[]>> {
    return await apiService.get<ApiResponse<Proposal[]>>(`${this.baseUrl}/search/${keyword}`)
  }

  // Get proposal statistics
  async getProposalStatistics(): Promise<ApiResponse<any>> {
    return await apiService.get<ApiResponse<any>>(`${this.baseUrl}/statistics`)
  }

  // Get active proposals
  async getActiveProposals(): Promise<ApiResponse<Proposal[]>> {
    return await apiService.get<ApiResponse<Proposal[]>>(`${this.baseUrl}/active`)
  }

  // Get expired proposals
  async getExpiredProposals(): Promise<ApiResponse<Proposal[]>> {
    return await apiService.get<ApiResponse<Proposal[]>>(`${this.baseUrl}/expired`)
  }

  // Vote on proposal
  async voteOnProposal(id: number, voteType: 'yes' | 'no'): Promise<ApiResponse<Proposal>> {
    return await apiService.post<ApiResponse<Proposal>>(`${this.baseUrl}/${id}/vote/${voteType}`)
  }
}

export const proposalService = new ProposalService()
export default proposalService
