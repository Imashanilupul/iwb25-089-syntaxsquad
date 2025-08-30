import apiService from "./api"

export interface Category {
  category_id: number
  category_name: string
  allocated_budget: number
  spent_budget: number
  created_at?: string
  updated_at?: string
}

export interface CategoryFormData {
  categoryName: string
  allocatedBudget: number
  spentBudget?: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  count?: number
  timestamp: number
}

class CategoryService {
  private baseUrl = "/api/categories"

  // Get all categories
  async getAllCategories(): Promise<ApiResponse<Category[]>> {
    return await apiService.get<ApiResponse<Category[]>>(this.baseUrl)
  }

  // Get category by ID
  async getCategoryById(id: number): Promise<ApiResponse<Category>> {
    return await apiService.get<ApiResponse<Category>>(`${this.baseUrl}/${id}`)
  }

  // Create new category
  async createCategory(categoryData: CategoryFormData): Promise<ApiResponse<Category>> {
    return await apiService.post<ApiResponse<Category>>(this.baseUrl, categoryData)
  }

  // Update category
  async updateCategory(id: number, categoryData: Partial<CategoryFormData>): Promise<ApiResponse<Category>> {
    return await apiService.put<ApiResponse<Category>>(`${this.baseUrl}/${id}`, categoryData)
  }

  // Delete category
  async deleteCategory(id: number): Promise<ApiResponse<{ categoryId: number }>> {
    return await apiService.delete<ApiResponse<{ categoryId: number }>>(`${this.baseUrl}/${id}`)
  }

  // Sync category spent budgets
  async syncSpentBudgets(): Promise<any> {
    return await apiService.post<any>(`${this.baseUrl}/sync`, {})
  }
}

export const categoryService = new CategoryService()
export default categoryService
