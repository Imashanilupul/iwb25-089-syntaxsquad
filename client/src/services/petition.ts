import { apiService } from './api'

export interface Petition {
  id: number
  title: string
  description: string
  required_signature_count: number
  signature_count: number
  creator_id?: number
  status: string
  deadline?: string
  created_at: string
  updated_at: string
}

export interface CreatePetitionData {
  title: string
  description: string
  required_signature_count: number
  creator_id?: number
  deadline?: string
}

export interface PetitionResponse {
  success: boolean
  message: string
  data: Petition[]
  count: number
  timestamp: number
}

export interface SinglePetitionResponse {
  success: boolean
  message: string
  data: Petition
  timestamp: number
}

export interface PetitionStatistics {
  success: boolean
  message: string
  data: {
    total_petitions: number
    total_signatures: number
    completed_petitions: number
    completion_rate_percentage: number
    status_breakdown: Record<string, number>
  }
  timestamp: number
}

export interface SearchFilters {
  keyword?: string
  status?: string
  category?: string
  sortBy?: 'title' | 'created_at' | 'signature_count'
  sortOrder?: 'asc' | 'desc'
}

class PetitionService {
  // Get all petitions
  async getAllPetitions(): Promise<PetitionResponse> {
    const response = await apiService.get<PetitionResponse>('/api/petitions')
    return response
  }

  // Get petition by ID
  async getPetitionById(id: number): Promise<SinglePetitionResponse> {
    const response = await apiService.get<SinglePetitionResponse>(`/api/petitions/${id}`)
    return response
  }

  // Create new petition
  async createPetition(petitionData: CreatePetitionData): Promise<SinglePetitionResponse> {
    const response = await apiService.post<SinglePetitionResponse>('/api/petitions', petitionData)
    return response
  }

  // Update petition
  async updatePetition(id: number, petitionData: Partial<CreatePetitionData>): Promise<SinglePetitionResponse> {
    const response = await apiService.put<SinglePetitionResponse>(`/api/petitions/${id}`, petitionData)
    return response
  }

  // Delete petition
  async deletePetition(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete<{ success: boolean; message: string }>(`/api/petitions/${id}`)
    return response
  }

  // Get petitions by status
  async getPetitionsByStatus(status: string): Promise<PetitionResponse> {
    const response = await apiService.get<PetitionResponse>(`/api/petitions/status/${status}`)
    return response
  }

  // Get petitions by creator
  async getPetitionsByCreator(creatorId: number): Promise<PetitionResponse> {
    const response = await apiService.get<PetitionResponse>(`/api/petitions/creator/${creatorId}`)
    return response
  }

  // Search petitions
  async searchPetitions(keyword: string): Promise<PetitionResponse> {
    const response = await apiService.get<PetitionResponse>(`/api/petitions/search/${encodeURIComponent(keyword)}`)
    return response
  }

  // Get active petitions
  async getActivePetitions(): Promise<PetitionResponse> {
    const response = await apiService.get<PetitionResponse>('/api/petitions/active')
    return response
  }

  // Get petition statistics
  async getPetitionStatistics(): Promise<PetitionStatistics> {
    const response = await apiService.get<PetitionStatistics>('/api/petitions/statistics')
    return response
  }

  // Sign petition
  async signPetition(id: number): Promise<SinglePetitionResponse> {
    const response = await apiService.post<SinglePetitionResponse>(`/api/petitions/${id}/sign`, {})
    return response
  }

  // Advanced search with multiple filters
  async searchPetitionsAdvanced(filters: SearchFilters): Promise<PetitionResponse> {
    try {
      // Always start with getting all petitions as our base data
      let petitions: PetitionResponse
      
      try {
        petitions = await this.getAllPetitions()
      } catch (error) {
        console.error('Failed to get base petitions:', error)
        return { 
          data: [], 
          count: 0, 
          message: 'Failed to fetch petitions',
          success: false,
          timestamp: Date.now()
        }
      }

      // Apply all filters client-side for reliability
      let filteredData = petitions.data

      // Apply keyword filter
      if (filters.keyword && filters.keyword.trim()) {
        const keyword = filters.keyword.toLowerCase()
        filteredData = filteredData.filter(petition => 
          petition.title.toLowerCase().includes(keyword) || 
          petition.description.toLowerCase().includes(keyword)
        )
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        filteredData = filteredData.filter(petition => 
          petition.status.toLowerCase() === filters.status!.toLowerCase()
        )
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredData.sort((a, b) => {
          let aValue: string | number = ''
          let bValue: string | number = ''

          switch (filters.sortBy) {
            case 'title':
              aValue = a.title.toLowerCase()
              bValue = b.title.toLowerCase()
              break
            case 'created_at':
              aValue = new Date(a.created_at).getTime()
              bValue = new Date(b.created_at).getTime()
              break
            case 'signature_count':
              aValue = a.signature_count
              bValue = b.signature_count
              break
          }

          if (filters.sortOrder === 'desc') {
            return aValue < bValue ? 1 : -1
          }
          return aValue > bValue ? 1 : -1
        })
      }

      return {
        ...petitions,
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

export const petitionService = new PetitionService()
export default petitionService
