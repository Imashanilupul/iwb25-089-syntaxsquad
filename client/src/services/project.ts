import apiService from "./api"

export interface Project {
  project_id: number
  project_name: string
  category_id?: number
  allocated_budget: number
  spent_budget: number
  state: string
  province: string
  ministry: string
  view_details?: string
  status: string
  created_at?: string
  updated_at?: string
  categories?: {
    category_name: string
  }
}

export interface ProjectFormData {
  projectName: string
  categoryId?: number
  allocatedBudget: number
  spentBudget?: number
  state: string
  province: string
  ministry: string
  viewDetails?: string
  status?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  count?: number
  timestamp: number
}

class ProjectService {
  private baseUrl = "/api/projects"

  // Get all projects
  async getAllProjects(): Promise<ApiResponse<Project[]>> {
    return await apiService.get<ApiResponse<Project[]>>(this.baseUrl)
  }

  // Get project by ID
  async getProjectById(id: number): Promise<ApiResponse<Project>> {
    return await apiService.get<ApiResponse<Project>>(`${this.baseUrl}/${id}`)
  }

  // Create new project
  async createProject(projectData: ProjectFormData): Promise<ApiResponse<Project>> {
    return await apiService.post<ApiResponse<Project>>(this.baseUrl, projectData)
  }

  // Update project
  async updateProject(id: number, projectData: Partial<ProjectFormData>): Promise<ApiResponse<Project>> {
    return await apiService.put<ApiResponse<Project>>(`${this.baseUrl}/${id}`, projectData)
  }

  // Delete project
  async deleteProject(id: number): Promise<ApiResponse<{ projectId: number }>> {
    return await apiService.delete<ApiResponse<{ projectId: number }>>(`${this.baseUrl}/${id}`)
  }

  // Get projects by category
  async getProjectsByCategory(categoryId: number): Promise<ApiResponse<Project[]>> {
    return await apiService.get<ApiResponse<Project[]>>(`${this.baseUrl}/category/${categoryId}`)
  }

  // Get projects by status
  async getProjectsByStatus(status: string): Promise<ApiResponse<Project[]>> {
    return await apiService.get<ApiResponse<Project[]>>(`${this.baseUrl}/status/${status}`)
  }

  // Get projects by ministry
  async getProjectsByMinistry(ministry: string): Promise<ApiResponse<Project[]>> {
    return await apiService.get<ApiResponse<Project[]>>(`${this.baseUrl}/ministry/${ministry}`)
  }

  // Get projects by state
  async getProjectsByState(state: string): Promise<ApiResponse<Project[]>> {
    return await apiService.get<ApiResponse<Project[]>>(`${this.baseUrl}/state/${state}`)
  }

  // Get projects by province
  async getProjectsByProvince(province: string): Promise<ApiResponse<Project[]>> {
    return await apiService.get<ApiResponse<Project[]>>(`${this.baseUrl}/province/${province}`)
  }

  // Search projects
  async searchProjects(keyword: string): Promise<ApiResponse<Project[]>> {
    return await apiService.get<ApiResponse<Project[]>>(`${this.baseUrl}/search/${keyword}`)
  }

  // Get project statistics
  async getProjectStatistics(): Promise<ApiResponse<any>> {
    return await apiService.get<ApiResponse<any>>(`${this.baseUrl}/statistics`)
  }
}

export const projectService = new ProjectService()
export default projectService
