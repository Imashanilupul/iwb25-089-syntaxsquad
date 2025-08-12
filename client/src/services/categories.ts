import { apiService } from "./api"

export interface Category {
  category_id: number
  category_name: string
  allocated_budget: number
  spent_budget: number
  created_at: string
  updated_at: string
}

export interface CategoryResponse {
  success: boolean
  message: string
  data: Category | Category[]
  count?: number
  timestamp: number
}

class CategoriesService {
  async getAllCategories(): Promise<CategoryResponse> {
    return apiService.get<CategoryResponse>("/api/categories")
  }

  async getCategoryById(id: number): Promise<CategoryResponse> {
    return apiService.get<CategoryResponse>(`/api/categories/${id}`)
  }

  async createCategory(category: {
    categoryName: string
    allocatedBudget: number
    spentBudget?: number
  }): Promise<CategoryResponse> {
    return apiService.post<CategoryResponse>("/api/categories", category)
  }

  async updateCategory(id: number, category: Partial<{
    categoryName: string
    allocatedBudget: number
    spentBudget: number
  }>): Promise<CategoryResponse> {
    return apiService.put<CategoryResponse>(`/api/categories/${id}`, category)
  }

  async deleteCategory(id: number): Promise<CategoryResponse> {
    return apiService.delete<CategoryResponse>(`/api/categories/${id}`)
  }
}

export const categoriesService = new CategoriesService()
export default categoriesService
