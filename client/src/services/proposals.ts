import { apiService } from "./api"

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
  created_at: string
  updated_at: string
}

export interface ProposalResponse {
  success: boolean
  message: string
  data: Proposal | Proposal[]
  count?: number
  timestamp: number
}

export interface CreateProposalRequest {
  title: string
  shortDescription: string
  descriptionInDetails: string
  expiredDate: string
  categoryId?: number
  createdBy?: number
  activeStatus?: boolean
  yesVotes?: number
  noVotes?: number
}

export interface VoteRequest {
  proposalId: number
  voteType: "yes" | "no"
}

class ProposalsService {
  async getAllProposals(): Promise<ProposalResponse> {
    return apiService.get<ProposalResponse>("/api/proposals")
  }

  async getProposalById(id: number): Promise<ProposalResponse> {
    return apiService.get<ProposalResponse>(`/api/proposals/${id}`)
  }

  async getActiveProposals(): Promise<ProposalResponse> {
    return apiService.get<ProposalResponse>("/api/proposals/active")
  }

  async getExpiredProposals(): Promise<ProposalResponse> {
    return apiService.get<ProposalResponse>("/api/proposals/expired")
  }

  async getProposalsByStatus(activeStatus: boolean): Promise<ProposalResponse> {
    return apiService.get<ProposalResponse>(`/api/proposals/status/${activeStatus}`)
  }

  async getProposalsByCategory(categoryId: number): Promise<ProposalResponse> {
    return apiService.get<ProposalResponse>(`/api/proposals/category/${categoryId}`)
  }

  async getProposalsByCreator(createdBy: number): Promise<ProposalResponse> {
    return apiService.get<ProposalResponse>(`/api/proposals/creator/${createdBy}`)
  }

  async searchProposals(keyword: string): Promise<ProposalResponse> {
    return apiService.get<ProposalResponse>(`/api/proposals/search/${encodeURIComponent(keyword)}`)
  }

  async getProposalStatistics(): Promise<ProposalResponse> {
    return apiService.get<ProposalResponse>("/api/proposals/statistics")
  }

  async createProposal(proposal: CreateProposalRequest): Promise<ProposalResponse> {
    return apiService.post<ProposalResponse>("/api/proposals", proposal)
  }

  async updateProposal(id: number, proposal: Partial<CreateProposalRequest>): Promise<ProposalResponse> {
    return apiService.put<ProposalResponse>(`/api/proposals/${id}`, proposal)
  }

  async deleteProposal(id: number): Promise<ProposalResponse> {
    return apiService.delete<ProposalResponse>(`/api/proposals/${id}`)
  }

  async voteOnProposal(proposalId: number, voteType: "yes" | "no"): Promise<ProposalResponse> {
    return apiService.post<ProposalResponse>(`/api/proposals/${proposalId}/vote/${voteType}`)
  }

  // Helper methods for vote calculations
  getTotalVotes(proposal: Proposal): number {
    return proposal.yes_votes + proposal.no_votes
  }

  getYesPercentage(proposal: Proposal): number {
    const total = this.getTotalVotes(proposal)
    return total > 0 ? Math.round((proposal.yes_votes / total) * 100) : 0
  }

  getNoPercentage(proposal: Proposal): number {
    const total = this.getTotalVotes(proposal)
    return total > 0 ? Math.round((proposal.no_votes / total) * 100) : 0
  }

  isExpired(proposal: Proposal): boolean {
    return new Date(proposal.expired_date) < new Date()
  }

  getDaysRemaining(proposal: Proposal): number {
    const expiredDate = new Date(proposal.expired_date)
    const today = new Date()
    const diffTime = expiredDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  getTimeRemaining(proposal: Proposal): string {
    if (this.isExpired(proposal)) {
      return "Completed"
    }
    
    const days = this.getDaysRemaining(proposal)
    if (days === 0) {
      return "Expires today"
    } else if (days === 1) {
      return "1 day"
    } else {
      return `${days} days`
    }
  }

  getProposalStatus(proposal: Proposal): string {
    if (!proposal.active_status) {
      return "Inactive"
    }
    
    if (this.isExpired(proposal)) {
      return "Expired"
    }
    
    return "Active"
  }
}

export const proposalsService = new ProposalsService()
export default proposalsService
