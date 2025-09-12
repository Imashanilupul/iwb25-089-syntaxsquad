import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios"

class ApiService {
  private api: AxiosInstance

  constructor() {
    // Build a robust base URL that always ends with "/api" exactly once
    const raw = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || "http://localhost:8080"
    const noTrailingSlash = raw.endsWith("/") ? raw.slice(0, -1) : raw
    const baseURL = /\/api$/.test(noTrailingSlash) ? noTrailingSlash : `${noTrailingSlash}/api`

    this.api = axios.create({
      baseURL,
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

        // Normalize per-request URL paths so callers can pass either
        // "/api/xyz" or "xyz" without creating double "/api/api".
        if (typeof config.url === "string") {
          // Remove any leading double slashes
          if (config.url.startsWith("//")) {
            config.url = config.url.replace(/^\/\/+/, "/")
          }
          // If the request path begins with "/api/", strip that prefix,
          // because baseURL already ends with "/api".
          if (config.url.startsWith("/api/")) {
            config.url = config.url.slice(4) // keep leading slash for axios to join
          }
          // Ensure single leading slash so axios joins with baseURL cleanly
          if (!config.url.startsWith("/")) {
            config.url = "/" + config.url
          }
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
        
        // Enhanced error logging with proper serialization
        const errorDetails = {
          status: error.response?.status || 'No status',
          statusText: error.response?.statusText || 'No status text',
          data: error.response?.data || 'No response data',
          url: error.config?.url || 'No URL',
          method: error.config?.method?.toUpperCase() || 'No method',
          message: error.message || 'No error message',
          code: error.code || 'No error code'
        }
        
        console.error("API Error Details:", errorDetails)
        console.error("Full error object:", error)
        
        // Create enhanced error with user-friendly message
        let enhancedError = error as any
        if (error.response?.status === 500) {
          const serverMessage = (error.response?.data as any)?.message || 'Internal server error occurred'
          enhancedError.userMessage = `Server Error (500): ${serverMessage}`
        } else if (error.response?.status === 404) {
          enhancedError.userMessage = `Not Found (404): ${error.config?.url || 'Resource not found'}`
        } else if (error.response?.status === 403) {
          enhancedError.userMessage = `Forbidden (403): Access denied`
        } else if (!error.response) {
          enhancedError.userMessage = `Network Error: Unable to connect to server`
        }
        
        return Promise.reject(enhancedError)
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

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch(url, data, config)
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

  // Utility method to check if API is reachable
  async healthCheck() {
    try {
      return await this.get("/api/health")
    } catch (error) {
      console.warn("Health check failed:", error)
      return { status: "error", message: "API not reachable" }
    }
  }

  // Utility method to get user-friendly error message
  static getErrorMessage(error: any): string {
    if (error.userMessage) {
      return error.userMessage
    }
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
    return "An unexpected error occurred"
  }
}

export const apiService = new ApiService()
export { ApiService }
export default apiService
