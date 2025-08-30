import { apiService, ApiService } from './api'

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
  likes?: number
  dislikes?: number
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
    } catch (error: any) {
      console.error('Error fetching reports:', error)
      const errorMessage = ApiService.getErrorMessage(error)
      throw new Error(errorMessage)
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
    } catch (error: any) {
      console.error('Error fetching report:', error)
      const errorMessage = ApiService.getErrorMessage(error)
      throw new Error(errorMessage)
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
    } catch (error: any) {
      console.error('Error searching reports:', error)
      const errorMessage = ApiService.getErrorMessage(error)
      throw new Error(errorMessage)
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
  },

  // Like a report
  async likeReport(reportId: number, walletAddress: string): Promise<Report> {
    try {
      const response = await apiService.post<ReportResponse>(`/api/reports/${reportId}/like`, {
        wallet_address: walletAddress
      });
      if (response.success && !Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to like report');
    } catch (error: any) {
      console.error('Error liking report:', error);
      
      // Handle specific server errors gracefully
      if (error.response?.status === 500) {
        const errorMsg = (error.response?.data as any)?.message || 
                        error.userMessage || 
                        'Server error when liking report - database may need migration';
        throw new Error(errorMsg);
      } else if (error.response?.status === 404) {
        throw new Error('Report not found or voting endpoint not available');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied - you may not have permission to vote on this report');
      } else if (!error.response) {
        throw new Error('Network error - unable to connect to server');
      }
      
      // Use the utility method for other errors
      throw new Error(ApiService.getErrorMessage(error));
    }
  },

  // Dislike a report
  async dislikeReport(reportId: number, walletAddress: string): Promise<Report> {
    try {
      const response = await apiService.post<ReportResponse>(`/api/reports/${reportId}/dislike`, {
        wallet_address: walletAddress
      });
      if (response.success && !Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to dislike report');
    } catch (error: any) {
      console.error('Error disliking report:', error);
      
      // Handle specific server errors gracefully
      if (error.response?.status === 500) {
        const errorMsg = (error.response?.data as any)?.message || 
                        error.userMessage || 
                        'Server error when disliking report - database may need migration';
        throw new Error(errorMsg);
      } else if (error.response?.status === 404) {
        throw new Error('Report not found or voting endpoint not available');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied - you may not have permission to vote on this report');
      } else if (!error.response) {
        throw new Error('Network error - unable to connect to server');
      }
      
      // Use the utility method for other errors
      throw new Error(ApiService.getErrorMessage(error));
    }
  },

  // Check user vote on a report
  async checkUserVote(reportId: number, walletAddress: string): Promise<string | null> {
    try {
      const response = await apiService.get<{ success: boolean; data: { vote: string | null } }>(
        `/api/reports/${reportId}/vote/${walletAddress}`
      );
      if (response.success) {
        return response.data.vote;
      }
      return null;
    } catch (error: any) {
      console.error('Error checking user vote:', error);
      
      // Handle specific server errors gracefully
      if (error.response?.status === 500) {
        const errorMsg = (error.response?.data as any)?.message || 
                        error.userMessage || 
                        'Server error when checking user vote - user_votes table may not exist';
        console.warn(errorMsg + '. Returning null.');
        return null;
      } else if (error.response?.status === 404) {
        console.warn('User vote endpoint not found or user has not voted yet. Returning null.');
        return null;
      } else if (error.response?.status === 403) {
        console.warn('Access denied when checking user vote. Returning null.');
        return null;
      } else if (!error.response) {
        console.warn('Network error when checking user vote. Returning null.');
        return null;
      }
      
      return null;
    }
  },

  // Assign report to a user
  async assignReport(reportId: number, assignedTo: string): Promise<Report> {
    try {
      const response = await apiService.post<ReportResponse>(`/api/reports/${reportId}/assign`, {
        assigned_to: assignedTo
      });
      if (response.success && !Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to assign report');
    } catch (error: any) {
      console.error('Error assigning report:', error);
      const errorMessage = ApiService.getErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  // Unassign report (remove assignment)
  async unassignReport(reportId: number): Promise<Report> {
    try {
      const response = await apiService.post<ReportResponse>(`/api/reports/${reportId}/unassign`, {});
      if (response.success && !Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to unassign report');
    } catch (error: any) {
      console.error('Error unassigning report:', error);
      const errorMessage = ApiService.getErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  // Utility: Determine priority from likes/dislikes
  getPriorityFromVotes(likes: number = 0, dislikes: number = 0): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const net = likes - dislikes;
    if (net > 50) return 'CRITICAL';
    if (net > 20) return 'HIGH';
    if (net > 0) return 'MEDIUM';
    return 'LOW';
  },
}
