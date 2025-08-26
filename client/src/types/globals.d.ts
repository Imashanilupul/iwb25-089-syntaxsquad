// Global type declarations for the project

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
      [key: string]: any
    }
  }
}

export {}
