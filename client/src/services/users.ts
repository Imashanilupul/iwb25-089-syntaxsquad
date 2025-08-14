import { apiService } from "./api"

export interface User {
  id: number
  user_name: string
  email: string
  nic: string
  mobile_no: string
  evm?: string
  Province?: string
  created_at: string
  updated_at: string
}

export interface UserResponse {
  success: boolean
  message: string
  data: User | User[]
  count?: number
  timestamp: number
}

export interface UserStatistics {
  total_users: number
  recent_users: number
  users_by_province: Record<string, number>
  growth_rate: number
}

class UsersService {
  async getAllUsers(): Promise<UserResponse> {
    return apiService.get<UserResponse>("/api/users")
  }

  async getUserById(id: number): Promise<UserResponse> {
    return apiService.get<UserResponse>(`/api/users/${id}`)
  }

  async getUserStatistics(): Promise<UserResponse> {
    return apiService.get<UserResponse>("/api/users/statistics")
  }

  async getProvinceStatistics(): Promise<UserResponse> {
    return apiService.get<UserResponse>("/api/users/provinces")
  }

  async getRecentUsers(): Promise<UserResponse> {
    return apiService.get<UserResponse>("/api/users/recent")
  }

  async searchUsers(keyword: string): Promise<UserResponse> {
    return apiService.get<UserResponse>(`/api/users/search/${encodeURIComponent(keyword)}`)
  }

  async createUser(user: {
    user_name: string
    email: string
    nic: string
    mobile_no: string
    evm?: string
    Province?: string
  }): Promise<UserResponse> {
    return apiService.post<UserResponse>("/api/users", user)
  }

  async updateUser(id: number, user: Partial<{
    user_name: string
    email: string
    nic: string
    mobile_no: string
    evm: string
    Province: string
  }>): Promise<UserResponse> {
    return apiService.put<UserResponse>(`/api/users/${id}`, user)
  }

  async deleteUser(id: number): Promise<UserResponse> {
    return apiService.delete<UserResponse>(`/api/users/${id}`)
  }
}

export const usersService = new UsersService()
export default usersService
