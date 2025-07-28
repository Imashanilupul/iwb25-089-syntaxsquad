/**
 * Format currency in Sri Lankan Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format large numbers with abbreviations (K, M, B, T)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  return num.toString()
}

/**
 * Calculate percentage with specified decimal places
 */
export function calculatePercentage(value: number, total: number, decimals: number = 1): number {
  if (total === 0) return 0
  return Number(((value / total) * 100).toFixed(decimals))
}

/**
 * Format time ago (e.g., "2 hours ago", "3 days ago")
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
  if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`
  return `${diffInSeconds} second${diffInSeconds > 1 ? "s" : ""} ago`
}

/**
 * Truncate blockchain hash for display
 */
export function truncateHash(hash: string, startChars: number = 6, endChars: number = 4): string {
  if (hash.length <= startChars + endChars) return hash
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
