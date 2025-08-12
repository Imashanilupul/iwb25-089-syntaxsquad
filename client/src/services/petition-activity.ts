import { apiService } from './api'

export interface PetitionActivity {
  id: number
  petition_id: number
  activity_type: string
  signature_count: number
  user_id?: number
  activity_date: string
}

export interface CreatePetitionActivityData {
  petition_id: number
  activity_type: string
  signature_count: number
  user_id?: number
}

export interface PetitionActivityResponse {
  success: boolean
  message: string
  data: PetitionActivity[]
  count: number
  timestamp: number
}

export interface SinglePetitionActivityResponse {
  success: boolean
  message: string
  data: PetitionActivity
  timestamp: number
}

export interface PetitionActivityStatistics {
  success: boolean
  message: string
  data: {
    total_activities: number
    total_signatures: number
    activity_type_breakdown: Record<string, number>
    petition_activity_breakdown: Record<string, number>
  }
  timestamp: number
}

class PetitionActivityService {
  // Get all petition activities
  async getAllPetitionActivities(): Promise<PetitionActivityResponse> {
    const response = await apiService.get<PetitionActivityResponse>('/api/petitionactivities')
    return response
  }

  // Get petition activity by ID
  async getPetitionActivityById(id: number): Promise<SinglePetitionActivityResponse> {
    const response = await apiService.get<SinglePetitionActivityResponse>(`/api/petitionactivities/${id}`)
    return response
  }

  // Create new petition activity
  async createPetitionActivity(activityData: CreatePetitionActivityData): Promise<SinglePetitionActivityResponse> {
    const response = await apiService.post<SinglePetitionActivityResponse>('/api/petitionactivities', activityData)
    return response
  }

  // Update petition activity
  async updatePetitionActivity(id: number, activityData: Partial<CreatePetitionActivityData>): Promise<SinglePetitionActivityResponse> {
    const response = await apiService.put<SinglePetitionActivityResponse>(`/api/petitionactivities/${id}`, activityData)
    return response
  }

  // Delete petition activity
  async deletePetitionActivity(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete<{ success: boolean; message: string }>(`/api/petitionactivities/${id}`)
    return response
  }

  // Get activities by petition ID
  async getActivitiesByPetitionId(petitionId: number): Promise<PetitionActivityResponse> {
    const response = await apiService.get<PetitionActivityResponse>(`/api/petitionactivities/petition/${petitionId}`)
    return response
  }

  // Get activities by user ID
  async getActivitiesByUserId(userId: number): Promise<PetitionActivityResponse> {
    const response = await apiService.get<PetitionActivityResponse>(`/api/petitionactivities/user/${userId}`)
    return response
  }

  // Get activities by type
  async getActivitiesByType(activityType: string): Promise<PetitionActivityResponse> {
    const response = await apiService.get<PetitionActivityResponse>(`/api/petitionactivities/type/${activityType}`)
    return response
  }

  // Get recent activities
  async getRecentActivities(): Promise<PetitionActivityResponse> {
    const response = await apiService.get<PetitionActivityResponse>('/api/petitionactivities/recent')
    return response
  }

  // Get activity statistics
  async getActivityStatistics(): Promise<PetitionActivityStatistics> {
    const response = await apiService.get<PetitionActivityStatistics>('/api/petitionactivities/statistics')
    return response
  }
}

export const petitionActivityService = new PetitionActivityService()
export default petitionActivityService
