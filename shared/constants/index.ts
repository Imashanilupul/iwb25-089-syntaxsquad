// Application constants
export const APP_CONFIG = {
  NAME: "Civic Blockchain Platform",
  VERSION: "0.1.0",
  DESCRIPTION: "A civic blockchain platform for transparency and governance",
} as const

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
  },
  USERS: {
    BASE: "/api/users",
    PROFILE: "/api/users/profile",
    BY_ID: (id: string) => `/api/users/${id}`,
  },
  VOTING: {
    BASE: "/api/voting",
    PROPOSALS: "/api/voting/proposals",
    VOTE: (id: string) => `/api/voting/proposals/${id}/vote`,
    RESULTS: (id: string) => `/api/voting/proposals/${id}/results`,
  },
  SPENDING: {
    BASE: "/api/spending",
    PROJECTS: "/api/spending/projects",
    BUDGET: "/api/spending/budget",
    TRACKING: "/api/spending/tracking",
  },
  BLOCKCHAIN: {
    BASE: "/api/blockchain",
    BLOCKS: "/api/blockchain/blocks",
    TRANSACTIONS: "/api/blockchain/transactions",
    VERIFY: "/api/blockchain/verify",
  },
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

// Vote categories
export const VOTE_CATEGORIES = [
  "Constitutional Reform",
  "Environment",
  "Education",
  "Healthcare",
  "Infrastructure",
  "Economic Policy",
  "Social Welfare",
] as const

// Project categories
export const PROJECT_CATEGORIES = [
  "Education",
  "Health",
  "Infrastructure",
  "Defense",
  "Agriculture",
  "Environment",
  "Technology",
] as const

// Sri Lankan provinces
export const SRI_LANKAN_PROVINCES = [
  "Western Province",
  "Central Province",
  "Southern Province",
  "Northern Province",
  "Eastern Province",
  "North Western Province",
  "North Central Province",
  "Uva Province",
  "Sabaragamuwa Province",
] as const
