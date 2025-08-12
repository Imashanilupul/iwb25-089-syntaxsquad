import { apiService } from './api'

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

export interface UserStatistics {
  total_users: number
  users_with_evm: number
  users_without_evm: number
  evm_adoption_percentage: number
}

export interface ProvinceStatistics {
  province: string
  count: number
  percentage: number
}

export interface UserAnalyticsData {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  newRegistrationsThisMonth: number
  usersByProvince: { province: string; count: number; percentage: number }[]
  usersByDistrict: { district: string; count: number; province: string }[]
  userActivity: {
    petitionsCreated: number
    reportsSubmitted: number
    commentsPosted: number
    votesParticipated: number
  }
  blockchainVerification: {
    walletConnected: number
    transactionsVerified: number
    smartContractInteractions: number
  }
  growthTrend: { month: string; users: number; growth: number }[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  count?: number
  timestamp: number
}

export const userService = {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiService.get<ApiResponse<User[]>>('/api/users')
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch users')
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  // Get user statistics
  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const response = await apiService.get<ApiResponse<UserStatistics>>('/api/users/statistics')
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch user statistics')
    } catch (error) {
      console.error('Error fetching user statistics:', error)
      throw error
    }
  },

  // Get province statistics
  async getProvinceStatistics(): Promise<ProvinceStatistics[]> {
    try {
      const response = await apiService.get<ApiResponse<{total_users_with_province: number, provinces: ProvinceStatistics[]}>>('/api/users/provinces')
      if (response.success) {
        return response.data.provinces || []
      }
      throw new Error(response.message || 'Failed to fetch province statistics')
    } catch (error) {
      console.error('Error fetching province statistics:', error)
      throw error
    }
  },

  // Get recent users (last 30 days)
  async getRecentUsers(): Promise<User[]> {
    try {
      const response = await apiService.get<ApiResponse<User[]>>('/api/users/recent')
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch recent users')
    } catch (error) {
      console.error('Error fetching recent users:', error)
      throw error
    }
  },

  // Get user by ID
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await apiService.get<ApiResponse<User>>(`/api/users/${userId}`)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch user')
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  },

  // Search users
  async searchUsers(keyword: string): Promise<User[]> {
    try {
      const response = await apiService.get<ApiResponse<User[]>>(`/api/users/search?keyword=${encodeURIComponent(keyword)}`)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Failed to search users')
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  },

  // Process user data for analytics
  async getAnalyticsData(): Promise<UserAnalyticsData> {
    try {
      // Fetch all required data
      const [users, statistics, recentUsers, provinceStats] = await Promise.all([
        this.getAllUsers(),
        this.getUserStatistics(),
        this.getRecentUsers(),
        this.getProvinceStatistics()
      ])

      // Calculate growth trend based on user creation dates
      const growthTrend = this.calculateGrowthTrend(users)

      // Calculate activity metrics (this would typically come from activity tables)
      const userActivity = await this.calculateUserActivity(users)

      return {
        totalUsers: statistics.total_users,
        activeUsers: Math.floor(statistics.total_users * 0.85), // Estimate active users
        verifiedUsers: statistics.users_with_evm,
        newRegistrationsThisMonth: recentUsers.length,
        usersByProvince: provinceStats.map(stat => ({
          province: stat.province || 'Unknown',
          count: stat.count,
          percentage: stat.percentage
        })),
        usersByDistrict: this.calculateDistrictDistribution(provinceStats.map(stat => ({
          province: stat.province || 'Unknown',
          count: stat.count,
          percentage: stat.percentage
        }))),
        userActivity,
        blockchainVerification: {
          walletConnected: statistics.users_with_evm,
          transactionsVerified: statistics.users_with_evm * 3, // Estimate
          smartContractInteractions: statistics.users_with_evm * 2, // Estimate
        },
        growthTrend
      }
    } catch (error) {
      console.error('Error getting analytics data:', error)
      throw error
    }
  },

  // Calculate province distribution (placeholder logic)
  calculateProvinceDistribution(users: User[]): { province: string; count: number; percentage: number }[] {
    const provinces = [
      "Western Province",
      "Central Province", 
      "Southern Province",
      "Northern Province",
      "Eastern Province",
      "North Western Province",
      "North Central Province",
      "Uva Province",
      "Sabaragamuwa Province"
    ]

    const totalUsers = users.length
    
    // Distribute users across provinces (this is mock distribution)
    // In real implementation, this would come from user profile data
    return provinces.map((province, index) => {
      const basePercentage = [32.2, 14.0, 12.0, 8.9, 7.9, 7.3, 6.3, 5.8, 5.6][index] || 5.0
      const count = Math.floor((basePercentage / 100) * totalUsers)
      return {
        province,
        count,
        percentage: Number(((count / totalUsers) * 100).toFixed(1))
      }
    })
  },

  // Calculate district distribution
  calculateDistrictDistribution(provinces: { province: string; count: number; percentage: number }[]): 
    { district: string; count: number; province: string }[] {
    const districts = [
      { district: "Colombo", province: "Western Province" },
      { district: "Gampaha", province: "Western Province" },
      { district: "Kandy", province: "Central Province" },
      { district: "Galle", province: "Southern Province" },
      { district: "Jaffna", province: "Northern Province" },
    ]

    return districts.map(item => {
      const provinceData = provinces.find(p => p.province === item.province)
      const count = provinceData ? Math.floor(provinceData.count * 0.6) : 0
      return {
        ...item,
        count
      }
    })
  },

  // Calculate growth trend from user creation dates
  calculateGrowthTrend(users: User[]): { month: string; users: number; growth: number }[] {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const now = new Date()
    const trends = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = monthNames[date.getMonth()]
      
      // Count users created up to this month
      const usersUpToMonth = users.filter(user => 
        new Date(user.created_at) <= new Date(date.getFullYear(), date.getMonth() + 1, 0)
      ).length

      // Calculate growth rate
      const previousMonth: number = i === 5 ? usersUpToMonth * 0.95 : trends[trends.length - 1]?.users || 0
      const growth: number = previousMonth > 0 ? Number((((usersUpToMonth - previousMonth) / previousMonth) * 100).toFixed(1)) : 0

      trends.push({
        month: monthStr,
        users: usersUpToMonth,
        growth: Math.max(0, growth)
      })
    }

    return trends
  },

  // Calculate user activity metrics (enhanced with real data from other services)
  async calculateUserActivity(users: User[]): Promise<{
    petitionsCreated: number
    reportsSubmitted: number
    commentsPosted: number
    votesParticipated: number
  }> {
    try {
      // Import other services dynamically to avoid circular dependencies
      const { petitionService } = await import('./petition')
      const { reportService } = await import('./report')
      
      // Fetch real data from other services
      const [petitionResponse, reportResponse] = await Promise.all([
        petitionService.getAllPetitions().catch(() => ({ success: false, data: [], count: 0 })),
        reportService.getAllReports().catch(() => [])
      ])

      const petitions = Array.isArray(petitionResponse) ? petitionResponse : 
                       (petitionResponse.success ? petitionResponse.data : [])

      return {
        petitionsCreated: Array.isArray(petitions) ? petitions.length : 0,
        reportsSubmitted: Array.isArray(reportResponse) ? reportResponse.length : 0,
        commentsPosted: Math.floor(users.length * 0.45), // Still estimated - would come from comment service
        votesParticipated: Math.floor(users.length * 0.25), // Still estimated - would come from voting service
      }
    } catch (error) {
      console.error('Error fetching activity data:', error)
      // Fallback to estimates
      const totalUsers = users.length
      
      return {
        petitionsCreated: Math.floor(totalUsers * 0.15),
        reportsSubmitted: Math.floor(totalUsers * 0.08),
        commentsPosted: Math.floor(totalUsers * 0.45),
        votesParticipated: Math.floor(totalUsers * 0.25),
      }
    }
  },

  // Get enhanced analytics with cross-service data
  async getEnhancedAnalytics(): Promise<{
    petitionMetrics: any
    reportMetrics: any
    userGrowth: any
  }> {
    try {
      const { petitionService } = await import('./petition')
      const { reportService } = await import('./report')
      
      const [petitionStats, reportStats] = await Promise.all([
        petitionService.getPetitionStatistics().catch(() => null),
        reportService.getReportStatistics().catch(() => null)
      ])

      return {
        petitionMetrics: petitionStats || null,
        reportMetrics: reportStats || null,
        userGrowth: await this.getDetailedGrowthMetrics()
      }
    } catch (error) {
      console.error('Error fetching enhanced analytics:', error)
      return {
        petitionMetrics: null,
        reportMetrics: null,
        userGrowth: null
      }
    }
  },

  // Get detailed growth metrics
  async getDetailedGrowthMetrics(): Promise<any> {
    try {
      const users = await this.getAllUsers()
      const monthlyData = this.calculateMonthlyGrowth(users)
      
      return {
        totalGrowth: users.length,
        monthlyBreakdown: monthlyData,
        averageMonthlyGrowth: monthlyData.reduce((sum, month) => sum + month.newUsers, 0) / monthlyData.length
      }
    } catch (error) {
      console.error('Error calculating growth metrics:', error)
      return null
    }
  },

  // Calculate monthly growth breakdown
  calculateMonthlyGrowth(users: User[]): Array<{month: string, newUsers: number, cumulative: number}> {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const now = new Date()
    const monthlyData = []

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const newUsers = users.filter(user => {
        const userDate = new Date(user.created_at)
        return userDate >= targetDate && userDate < nextMonth
      }).length

      const cumulative = users.filter(user => 
        new Date(user.created_at) < nextMonth
      ).length

      monthlyData.push({
        month: monthNames[targetDate.getMonth()],
        newUsers,
        cumulative
      })
    }

    return monthlyData
  }
}
