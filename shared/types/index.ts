// User-related types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = "admin",
  MINISTRY = "ministry",
  PROVINCIAL = "provincial",
  CITIZEN = "citizen",
  SYSTEM_ADMIN = "system_admin",
  TREASURY = "treasury",
  OVERSIGHT = "oversight",
}

// Category-related types
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

// Voting-related types
export interface VotingProposal {
  id: string
  title: string
  description: string
  category: string
  totalVotes: number
  yesVotes: number
  noVotes: number
  status: ProposalStatus
  timeRemaining: string
  requiredVotes: number
  blockchainHash: string
  verificationStatus: VerificationStatus
  createdAt: Date
  endDate: Date
}

export enum ProposalStatus {
  ACTIVE = "active",
  PASSED = "passed",
  FAILED = "failed",
  PENDING = "pending",
}

export enum VerificationStatus {
  VERIFIED = "verified",
  PENDING = "pending",
  FAILED = "failed",
}

// Spending-related types
export interface SpendingProject {
  id: string
  name: string
  category: string
  budget: number
  spent: number
  progress: number
  status: ProjectStatus
  contractor: string
  location: string
  blockchainHash: string
  lastUpdate: string
  createdAt: Date
  updatedAt: Date
}

export enum ProjectStatus {
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  NEAR_COMPLETION = "Near Completion",
  DELAYED = "Delayed",
  CANCELLED = "Cancelled",
}

// Blockchain-related types
export interface BlockchainBlock {
  height: number
  hash: string
  transactions: number
  timestamp: string
  validator: string
  status: BlockStatus
}

export enum BlockStatus {
  CONFIRMED = "confirmed",
  PENDING = "pending",
  FAILED = "failed",
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
