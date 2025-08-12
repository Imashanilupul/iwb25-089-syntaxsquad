import { apiService } from './api'

// Report interface matching the backend structure
export interface Report {
  report_id: number
  report_title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  evidence_hash: string
  assigned_to?: string
  user_id?: number
  resolved_status: boolean
  created_time: string
  last_updated_time?: string
  resolved_time?: string
}

export interface ReportStatistics {
  success: boolean
  message: string
  data: {
    total_reports: number
    resolved_reports: number
    unresolved_reports: number
    resolution_rate_percentage: number
    priority_breakdown: Record<string, number>
  }
  timestamp: number
}

export interface ReportResponse {
  success: boolean
  message: string
  data: Report | Report[]
  count?: number
  timestamp: number
}

export interface SearchReportsParams {
  keyword?: string
  priority?: string
  resolved?: boolean
  user_id?: number
}

export const reportService = {
  // Get all reports
  async getAllReports(): Promise<Report[]> {
    try {
      const response = await apiService.get<ReportResponse>('/api/reports')
      if (response.success && Array.isArray(response.data)) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch reports')
    } catch (error) {
      console.error('Error fetching reports:', error)
      throw error
    }
  },

  // Get report by ID
  async getReportById(reportId: number): Promise<Report> {
    try {
      const response = await apiService.get<ReportResponse>(`/api/reports/${reportId}`)
      if (response.success && !Array.isArray(response.data)) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch report')
    } catch (error) {
      console.error('Error fetching report:', error)
      throw error
    }
  },

  // Search reports with keyword
  async searchReports(keyword: string): Promise<Report[]> {
    try {
      const response = await apiService.get<ReportResponse>(`/api/reports/search?keyword=${encodeURIComponent(keyword)}`)
      if (response.success && Array.isArray(response.data)) {
        return response.data
      }
      throw new Error(response.message || 'Failed to search reports')
    } catch (error) {
      console.error('Error searching reports:', error)
      throw error
    }
  },

  // Advanced search with multiple filters
  async searchReportsAdvanced(params: SearchReportsParams): Promise<Report[]> {
    try {
      let allReports = await this.getAllReports()
      
      // Apply client-side filtering
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase()
        allReports = allReports.filter(report => 
          report.report_title.toLowerCase().includes(keyword) ||
          (report.description && report.description.toLowerCase().includes(keyword))
        )
      }
      
      if (params.priority) {
        allReports = allReports.filter(report => report.priority === params.priority)
      }
      
      if (params.resolved !== undefined) {
        allReports = allReports.filter(report => report.resolved_status === params.resolved)
      }
      
      if (params.user_id) {
        allReports = allReports.filter(report => report.user_id === params.user_id)
      }
      
      return allReports
    } catch (error) {
      console.error('Error in advanced search:', error)
      throw error
    }
  },

  // Get reports by priority
  async getReportsByPriority(priority: string): Promise<Report[]> {
    try {
      const response = await apiService.get<ReportResponse>(`/api/reports/priority/${priority}`)
      if (response.success && Array.isArray(response.data)) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch reports by priority')
    } catch (error) {
      console.error('Error fetching reports by priority:', error)
      throw error
    }
  },

  // Get reports by status
  async getReportsByStatus(resolved: boolean): Promise<Report[]> {
    try {
      const response = await apiService.get<ReportResponse>(`/api/reports/status/${resolved}`)
      if (response.success && Array.isArray(response.data)) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch reports by status')
    } catch (error) {
      console.error('Error fetching reports by status:', error)
      throw error
    }
  },

  // Mark report as resolved
  async resolveReport(reportId: number): Promise<Report> {
    try {
      const response = await apiService.post<ReportResponse>(`/api/reports/${reportId}/resolve`, {})
      if (response.success && !Array.isArray(response.data)) {
        return response.data
      }
      throw new Error(response.message || 'Failed to resolve report')
    } catch (error) {
      console.error('Error resolving report:', error)
      throw error
    }
  },

  // Mark report as pending (unresolve)
  async unresolveReport(reportId: number): Promise<Report> {
    try {
      const response = await apiService.post<ReportResponse>(`/api/reports/${reportId}/unresolve`)
      if (response.success && !Array.isArray(response.data)) {
        return response.data
      }
      throw new Error(response.message || 'Failed to unresolve report')
    } catch (error) {
      console.error('Error unresolving report:', error)
      throw error
    }
  },

  // Get report statistics
  async getReportStatistics(): Promise<ReportStatistics['data']> {
    try {
      const response = await apiService.get<ReportStatistics>('/api/reports/statistics')
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch report statistics')
    } catch (error) {
      console.error('Error fetching report statistics:', error)
      throw error
    }
  },

  // Get recent reports (last 30 days)
  async getRecentReports(): Promise<Report[]> {
    try {
      const response = await apiService.get<ReportResponse>('/api/reports/recent')
      if (response.success && Array.isArray(response.data)) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch recent reports')
    } catch (error) {
      console.error('Error fetching recent reports:', error)
      throw error
    }
  }
}
