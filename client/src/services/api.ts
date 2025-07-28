import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios"

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem("authToken")
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem("authToken")
          window.location.href = "/login"
        }
        return Promise.reject(error)
      }
    )
  }

  // Generic methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete(url, config)
    return response.data
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.post("/api/auth/login", { email, password })
  }

  async register(userData: { email: string; name: string; password: string; role: string }) {
    return this.post("/api/auth/register", userData)
  }

  async logout() {
    return this.post("/api/auth/logout")
  }

  // Voting methods
  async getVotingProposals(page = 1, limit = 20) {
    return this.get(`/api/voting/proposals?page=${page}&limit=${limit}`)
  }

  async submitVote(proposalId: string, vote: boolean) {
    return this.post(`/api/voting/proposals/${proposalId}/vote`, { vote })
  }

  // Spending methods
  async getSpendingProjects(page = 1, limit = 20) {
    return this.get(`/api/spending/projects?page=${page}&limit=${limit}`)
  }

  async getBudgetData() {
    return this.get("/api/spending/budget")
  }

  // Blockchain methods
  async getBlockchainBlocks() {
    return this.get("/api/blockchain/blocks")
  }

  async verifyTransaction(hash: string) {
    return this.get(`/api/blockchain/verify?hash=${hash}`)
  }
}

export const apiService = new ApiService()
export default apiService
