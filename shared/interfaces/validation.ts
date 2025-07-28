import { z } from "zod"
import { UserRole, ProposalStatus, ProjectStatus } from "../types"

// User validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(UserRole),
})

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// Voting validation schemas
export const CreateProposalSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  requiredVotes: z.number().min(1, "Required votes must be at least 1"),
  endDate: z.date().refine((date) => date > new Date(), "End date must be in the future"),
})

export const VoteSchema = z.object({
  proposalId: z.string().uuid("Invalid proposal ID"),
  vote: z.boolean(),
  voterSignature: z.string().min(1, "Voter signature is required"),
})

// Spending validation schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(5, "Project name must be at least 5 characters"),
  category: z.string().min(1, "Category is required"),
  budget: z.number().min(1, "Budget must be greater than 0"),
  contractor: z.string().min(1, "Contractor is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
})

export const UpdateProjectSchema = z.object({
  spent: z.number().min(0, "Spent amount cannot be negative").optional(),
  progress: z.number().min(0).max(100, "Progress must be between 0 and 100").optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
})

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().min(1, "Page must be at least 1").default(1),
  limit: z.number().min(1).max(100, "Limit must be between 1 and 100").default(20),
})

// Search schema
export const SearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  category: z.string().optional(),
  status: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type CreateProposalInput = z.infer<typeof CreateProposalSchema>
export type VoteInput = z.infer<typeof VoteSchema>
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type PaginationInput = z.infer<typeof PaginationSchema>
export type SearchInput = z.infer<typeof SearchSchema>
