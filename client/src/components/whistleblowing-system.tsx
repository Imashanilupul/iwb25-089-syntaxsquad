"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"
import {
  Shield,
  AlertTriangle,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Lock,
  Upload,
  Hash,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import axios from "axios"
import { Report, reportService } from "@/services/report"
import ChatWidget from "./ChatWidget.jsx"

// Types
type Ethereumish = {
  request: (args: { method: string; params?: any[] }) => Promise<any>
  isMetaMask?: boolean
}

// Usage: cast window.ethereum as Ethereumish when you need the specific methods

interface WhistleblowingSystemProps {
  walletAddress?: string | null
}

export function WhistleblowingSystem({ walletAddress }: WhistleblowingSystemProps) {
  const { toast } = useToast()
  const { address, verified } = useAuth() // Get auth state

  // Environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const BALLERINA_BASE_URL = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080';

  const [reportForm, setReportForm] = useState({
    category: "",
    title: "",
    description: "",
  })

  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const [petitionForm, setPetitionForm] = useState({
    title: "",
    description: "",
    targetSignatures: 10000,
  })

  // Real petition data state
  const [petitions, setPetitions] = useState<any[]>([])
  const [isLoadingPetitions, setIsLoadingPetitions] = useState(false)
  const [signingPetition, setSigningPetition] = useState<number | null>(null)
  const [userSignatures, setUserSignatures] = useState<{ [key: number]: boolean }>({})
  const [categories, setCategories] = useState<any[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Add upvote/downvote state for reports
  const [reportVotes, setReportVotes] = useState<{ [id: number]: "upvote" | "downvote" | null }>({})
  const [openReportDetails, setOpenReportDetails] = useState<{ [id: number]: boolean }>({})
  const [reportCounts, setReportCounts] = useState<{
    [id: string]: { upvote: number; downvote: number }
  }>({
    "LK-2024-001": { upvote: 50, downvote: 5 },
    "LK-2024-002": { upvote: 120, downvote: 10 },
  })
  const [priorityChanges, setPriorityChanges] = useState<{ [id: number]: string }>({})

  // Handler for upvote/downvote
  const handleReportVote = async (id: number, type: "upvote" | "downvote") => {
    if (!address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to vote on reports",
        variant: "destructive",
      })
      return
    }

    try {
      let updatedReport: Report

      if (type === "upvote") {
        updatedReport = await reportService.likeReport(id, address)
      } else {
        updatedReport = await reportService.dislikeReport(id, address)
      }

      // Update local state with new data from backend
      setReports((prev) => prev.map((r) => (r.report_id === id ? updatedReport : r)))

      // Check if priority changed
      const currentReport = reports.find((r) => r.report_id === id)
      if (currentReport && currentReport.priority !== updatedReport.priority) {
        setPriorityChanges((prev) => ({
          ...prev,
          [id]: `${currentReport.priority} → ${updatedReport.priority}`,
        }))

        // Clear the priority change indicator after 5 seconds
        setTimeout(() => {
          setPriorityChanges((prev) => {
            const newChanges = { ...prev }
            delete newChanges[id]
            return newChanges
          })
        }, 5000)
      }

      // Update local vote state
      setReportVotes((prev) => ({ ...prev, [id]: type }))

      // Update local report counts immediately for optimistic UI
      setReports((prev) =>
        prev.map((r) => {
          if (r.report_id !== id) return r
          const likes =
            (r.likes || 0) +
            (type === "upvote" ? 1 : 0) -
            (reportVotes[id] === "downvote" && type === "upvote" ? 1 : 0)
          const dislikes =
            (r.dislikes || 0) +
            (type === "downvote" ? 1 : 0) -
            (reportVotes[id] === "upvote" && type === "downvote" ? 1 : 0)
          return { ...r, likes, dislikes } as Report
        })
      )

      // Refresh report statistics to reflect the new vote
      await refreshReportStatistics()

      toast({
        title: "Vote recorded!",
        description: `Your ${type} has been recorded. Priority updated to ${updatedReport.priority}`,
      })
    } catch (error: any) {
      console.error(`Failed to ${type} report:`, error)

      // Handle specific error cases
      if (error.message && error.message.includes("already")) {
        toast({
          title: "Already voted",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Vote failed",
          description: error.message || `Failed to ${type} report`,
          variant: "destructive",
        })
      }
    }
  }

  // Get user ID from wallet address (consistent with petition signing)
  const getUserId = (walletAddress: string): number => {
    // Simple hash of wallet address to create consistent user ID
    let hash = 0
    for (let i = 0; i < walletAddress.length; i++) {
      const char = walletAddress.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash % 10000) + 1 // Ensure positive ID between 1-10000
  }

  // Submit anonymous report function
  // Complete submitReport function - replace from line 107 to line 256
  // Submit anonymous report function - EXACT pattern as createPetition, no evidence hash
  // Submit anonymous report function - EXACT pattern as createPetition
  const submitReport = async () => {
    // Prevent multiple simultaneous requests
    if (isSubmittingReport) {
      toast({
        title: "Please wait",
        description: "Report submission is already in progress",
        variant: "destructive",
      })
      return
    }

    // Enhanced wallet address validation (using address from useAuth)
    if (!address || address.trim() === "") {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first using the Connect button",
        variant: "destructive",
      })
      return
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast({
        title: "Invalid wallet address",
        description: "The wallet address format is invalid. Please reconnect your wallet.",
        variant: "destructive",
      })
      return
    }

    if (!reportForm.title || !reportForm.description || !reportForm.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingReport(true)
    try {
      // Step 1: Check if MetaMask/wallet is available
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
      }

      // Step 2: Ensure we're connected to the right account
      let accounts
      try {
        accounts = await (window.ethereum as any).request({ method: "eth_accounts" })
      } catch (accountError: any) {
        console.error("Failed to get accounts:", accountError)
        throw new Error("Failed to get wallet accounts. Please try again.")
      }

      if (accounts.length === 0) {
        // Only request accounts if we don't have any
        try {
          toast({
            title: "Account Access Required",
            description: "Please approve wallet connection in MetaMask",
          })
          accounts = await (window.ethereum as any).request({ method: "eth_requestAccounts" })
        } catch (requestError: any) {
          if (requestError.code === -32002) {
            throw new Error(
              "MetaMask is already processing a connection request. Please check your MetaMask extension and try again."
            )
          } else if (requestError.code === 4001) {
            throw new Error("User rejected wallet connection request")
          }
          throw new Error(`Failed to connect wallet: ${requestError.message || requestError}`)
        }
      }

      // Double-check the current account matches our address
      const currentAccount = accounts[0]?.toLowerCase()
      if (!currentAccount) {
        throw new Error("No wallet account found. Please connect your wallet first.")
      }

      if (currentAccount !== address.toLowerCase()) {
        throw new Error(
          `Account mismatch. Please switch to ${address.slice(0, 6)}...${address.slice(-4)} in MetaMask`
        )
      }

      // Step 3: Create a clear message to sign
      const timestamp = new Date().toISOString()
      const message = `🛡️ SUBMIT ANONYMOUS REPORT CONFIRMATION

Title: ${reportForm.title}

Description: ${reportForm.description}

Category: ${reportForm.category}

Wallet: ${address}
Timestamp: ${timestamp}

⚠️ By signing this message, you confirm that you want to submit this anonymous report to the blockchain. This action cannot be undone.`

      toast({
        title: "Signature Required",
        description: "Please check your wallet to sign the report submission request",
      })

      // Step 4: Request signature from user
      let signature
      try {
        signature = await (window.ethereum as any).request({
          method: "personal_sign",
          params: [message, address],
        })
      } catch (signError: any) {
        if (signError.code === 4001) {
          throw new Error("User rejected the signature request")
        }
        throw new Error(`Signature failed: ${signError.message || signError}`)
      }

      if (!signature) {
        throw new Error("No signature received from wallet")
      }

      toast({
        title: "✅ Signature confirmed",
        description: "Creating report on blockchain...",
      })

      // Step 3: Prepare IPFS + contract info from the prepare service
      const prepRes = await fetch(`${API_BASE_URL}/report/prepare-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reportForm.title,
          description: reportForm.description,
        }),
      })

      if (!prepRes.ok) {
        const txt = await prepRes.text()
        throw new Error(`Prepare failed: ${prepRes.status} ${txt}`)
      }

      const prepJson = await prepRes.json()
      const { titleCid, descriptionCid, contractAddress, contractAbi } = prepJson
      if (!titleCid || !descriptionCid || !contractAddress || !contractAbi) {
        throw new Error("Prepare endpoint did not return all required fields")
      }

      toast({
        title: "Ready to submit",
        description: "Please confirm the transaction in your wallet",
      })

      // Send transaction from user's wallet using ethers and Sepolia network
      const ethers = await import("ethers")
      // Use BrowserProvider for ESM v6 in browser
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      // Request accounts (ensure connected)
      await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      // Send transaction
      const tx = await contract.createReport(titleCid, descriptionCid)
      toast({ title: "Transaction sent", description: tx.hash })

      // Wait for confirmation
      const receipt = await tx.wait()
      toast({ title: "Transaction confirmed", description: `Block ${receipt.blockNumber}` })

      // Try to decode event to get reportId
      let blockchainReportId = null
      try {
        const iface = new (ethers as any).Interface(contractAbi)
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log)
            if (parsed && parsed.name && parsed.name.toLowerCase().includes("report")) {
              blockchainReportId = parsed.args?.[0]?.toString() || null
              break
            }
          } catch (e) {
            // ignore non-matching logs
          }
        }
        if (!blockchainReportId) {
          try {
            const count = await contract.reportCount()
            blockchainReportId = count.toString()
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.warn("Could not parse event for report id", e)
      }

      // Step 4: Create database record with blockchain metadata
      const ballerinaResp = await fetch(`${BALLERINA_BASE_URL}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_title: reportForm.title,
          description: reportForm.description,
          category: reportForm.category,
          priority: getCategoryPriority(reportForm.category),
          wallet_address: address,
          tx_hash: tx.hash,
          block_number: receipt.blockNumber,
          blockchain_report_id: blockchainReportId,
          title_cid: titleCid,
          description_cid: descriptionCid,
        }),
      })

      if (!ballerinaResp.ok) {
        const txt = await ballerinaResp.text()
        console.error("Failed to create database record after successful blockchain transaction:", txt)
        // Don't throw error here since blockchain tx succeeded
        toast({
          title: "⚠️ Partial Success",
          description: "Report created on blockchain but database record failed. Please contact support.",
          variant: "destructive"
        })
      } else {
        const ballerinaData = await ballerinaResp.json()
        console.debug("✅ Database record created:", ballerinaData)
        toast({ title: "✅ Report created", description: "Successfully saved to blockchain and database" })
      }

      // Reset form
      setReportForm({
        category: "",
        title: "",
        description: "",
      })

      // Refresh reports list and statistics
      await refreshReportStatistics()
    } catch (error: any) {
      console.error("Failed create flow:", error)

      // Handle specific errors (keep your existing error handling)
      if (error.message && error.message.includes("User not authorized")) {
        toast({
          title: "❌ Not Authorized",
          description: "Your wallet address is not authorized to submit reports. Please contact an administrator to get your address authorized in the system.",
          variant: "destructive",
        })
      } else if (error.message && error.message.includes("You can only create one report per day")) {
        toast({
          title: "❌ Daily Limit Reached",
          description: "You can only submit one report per day. Please try again tomorrow.",
          variant: "destructive",
        })
      } else if (error.message && error.message.includes("execution reverted")) {
        const revertReason = error.reason || error.message.match(/execution reverted: "?([^"]*)"?/)?.[1] || "Unknown contract error"
        toast({
          title: "❌ Blockchain Error",
          description: `Transaction failed: ${revertReason}`,
          variant: "destructive",
        })
      } else if (error.code === 4001) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the report submission",
          variant: "destructive",
        })
      } else {
        toast({
          title: "❌ Submission Failed",
          description: error?.message || "Failed to submit report. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmittingReport(false)
    }
  }
  // (evidence file reading removed — evidence hash is derived from textual fields only)

  // Normalize an Ethereum address (ensure 0x prefix and proper format)
  const normalizeAddress = (addr?: string | null) => {
    if (!addr) return null
    let a = String(addr).trim()

    // Ensure 0x prefix
    if (!a.startsWith("0x")) {
      if (/^[a-fA-F0-9]{40}$/.test(a)) {
        a = `0x${a}`
      } else {
        return null // Invalid format
      }
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(a)) {
      return null
    }

    return a.toLowerCase() // Return lowercase for consistency
  }

  // Robust personal_sign helper: some providers expect [message, address], others [address, message]
  const requestPersonalSign = async (message: string, account?: string | null) => {
    if (!window.ethereum) throw new Error("No web3 provider available")

    // Normalize and validate the account address
    const normalizedAccount = normalizeAddress(account)
    if (!normalizedAccount) {
      throw new Error(`Invalid Ethereum address: ${account}`)
    }

    // Get current accounts to ensure we're using the right one
    let currentAccounts: string[] = []
    try {
      currentAccounts = await (window.ethereum as any).request({ method: "eth_accounts" })
    } catch (err) {
      console.warn("Could not get current accounts:", err)
    }

    // Use the first current account if available, otherwise use normalized account
    const addressToUse =
      currentAccounts.length > 0
        ? normalizeAddress(currentAccounts[0]) || normalizedAccount
        : normalizedAccount

    console.debug("Requesting personal_sign with address:", addressToUse)

    // Try the common (message, address) order first
    try {
      return await (window.ethereum as any).request({
        method: "personal_sign",
        params: [message, addressToUse],
      })
    } catch (err: any) {
      console.debug("First attempt failed:", err)
      // If provider complains about invalid params, try the reversed order
      if (err?.code === -32602 || /invalid params/i.test(String(err?.message || ""))) {
        console.debug("Trying reversed parameter order...")
        try {
          return await (window.ethereum as any).request({
            method: "personal_sign",
            params: [addressToUse, message],
          })
        } catch (err2: any) {
          console.debug("Second attempt also failed:", err2)
          throw new Error(`Personal sign failed: ${err2.message || err2}`)
        }
      }
      throw new Error(`Personal sign failed: ${err.message || err}`)
    }
  }

  // Generate evidence hash for anonymity
  const generateEvidenceHash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return `0x${hashHex.substring(0, 16)}` // Truncate for display
  }

  // Map category to priority
  const getCategoryPriority = (category: string): string => {
    // Map database categories to priorities
    switch (category.toLowerCase()) {
      case "health":
        return "HIGH"
      case "defense":
        return "CRITICAL"
      case "infrastructure":
        return "HIGH"
      case "agriculture":
        return "MEDIUM"
      case "education":
        return "MEDIUM"
      case "finance":
        return "HIGH"
      case "security":
        return "CRITICAL"
      case "environment":
        return "HIGH"
      // Legacy categories for backward compatibility
      case "financial":
        return "HIGH"
      case "safety":
        return "CRITICAL"
      case "regulatory":
        return "HIGH"
      case "ethical":
        return "MEDIUM"
      default:
        return "MEDIUM"
    }
  }

  // Web3 state
  const [isCreatingPetition, setIsCreatingPetition] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Fetch petitions from API
  const fetchPetitions = async () => {
    setIsLoadingPetitions(true)
    try {
      const response = await fetch(`${BALLERINA_BASE_URL}/petitions`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setPetitions(data.data)

          // If wallet is connected, check which petitions user has signed
          if (walletAddress) {
            await checkUserSignatures(data.data)
          }
        }
      } else {
        console.error("Failed to fetch petitions:", response.statusText)
        toast({
          title: "Error",
          description: "Failed to load petitions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching petitions:", error)
      toast({
        title: "Error",
        description: "Failed to load petitions",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPetitions(false)
    }
  }

  // Fetch categories from API
  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const response = await fetch(`${BALLERINA_BASE_URL}/categories`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setCategories(data.data)
        }
      } else {
        console.error("Failed to fetch categories:", response.statusText)
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // Check which petitions the user has already signed
  const checkUserSignatures = async (petitionList: any[]) => {
    if (!walletAddress) return

    const userId = getUserId(walletAddress)
    const signatures: { [key: number]: boolean } = {}

    for (const petition of petitionList) {
      try {
        const response = await fetch(
          `${BALLERINA_BASE_URL}/petitions/${petition.id}/signed/${userId}`
        )
        if (response.ok) {
          const data = await response.json()
          signatures[petition.id] = data.hasSigned || false
        }
      } catch (error) {
        console.error(`Error checking signature for petition ${petition.id}:`, error)
        signatures[petition.id] = false
      }
    }

    setUserSignatures(signatures)
  }

  // Sign petition function
  const signPetition = async (petitionId: number) => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to sign petitions",
        variant: "destructive",
      })
      return
    }

    // Do not pre-check whether the user already signed; let the blockchain
    // reject duplicate signatures and surface the error to the user.

    setSigningPetition(petitionId)
    try {
      // Check if MetaMask/wallet is available
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed")
      }

      // Get current accounts to ensure we're connected
      let accounts
      try {
        accounts = await (window.ethereum as any).request({ method: "eth_accounts" })
      } catch (accountError: any) {
        console.error("Failed to get accounts:", accountError)
        throw new Error("Failed to get wallet accounts. Please try again.")
      }

      if (accounts.length === 0) {
        try {
          accounts = await (window.ethereum as any).request({ method: "eth_requestAccounts" })
        } catch (requestError: any) {
          if (requestError.code === 4001) {
            throw new Error("User rejected wallet connection request")
          }
          throw new Error(`Failed to connect wallet: ${requestError.message || requestError}`)
        }
      }

      // Validate the current account matches our walletAddress
      const currentAccount = accounts[0]?.toLowerCase()
      if (!currentAccount) {
        throw new Error("No wallet account found. Please connect your wallet first.")
      }

      if (currentAccount !== walletAddress.toLowerCase()) {
        throw new Error(
          `Account mismatch. Please switch to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} in MetaMask`
        )
      }

      const userId = getUserId(walletAddress)
      const petition = petitions.find((p) => p.id === petitionId)
      if (!petition) {
        throw new Error("Petition not found")
      }

      const message = `🗳️ SIGN PETITION

Title: ${petition.title}
ID: ${petition.id}
User ID: ${userId}
Wallet: ${walletAddress}
Timestamp: ${new Date().toISOString()}

By signing this message, you confirm your signature on this petition.`

      // Use the same direct approach as createPetition
      let signature
      try {
        signature = await (window.ethereum as any).request({
          method: "personal_sign",
          params: [message, walletAddress],
        })
      } catch (signError: any) {
        if (signError.code === 4001) {
          throw new Error("User rejected the signature request")
        }
        throw new Error(`Signature failed: ${signError.message || signError}`)
      }

      if (!signature) {
        throw new Error("No signature received from wallet")
      }

      toast({
        title: "✅ Signature confirmed",
        description: "Submitting signature to blockchain...",
      })

      // Get contract address and ABI from the prepare service (same as petition creation)
      let blockchainSigningSuccess = false
      try {
        const prepRes = await fetch(`${API_BASE_URL}/petition/prepare-petition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "dummy", // We just need contract info
            description: "dummy",
          }),
        })

        if (prepRes.ok) {
          const prepJson = await prepRes.json()
          const { contractAddress, contractAbi } = prepJson

          if (contractAddress && contractAbi) {
            toast({
              title: "Signing on blockchain",
              description: "Please confirm the transaction in your wallet",
            })

            // Send transaction to blockchain using ethers
            const ethers = await import("ethers")
            const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
            await (window.ethereum as any).request({ method: "eth_requestAccounts" })
            const signer = await provider.getSigner()
            const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

            // Get the blockchain petition ID - try multiple approaches
            let blockchainPetitionId =
              petition.blockchain_petition_id ||
              petition.blockchainPetitionId ||
              petition.blockchain_id

            // If we don't have the stored blockchain ID, we might need to find it
            if (!blockchainPetitionId) {
              // As a fallback, we could try using the database ID
              // This assumes petition IDs are sequential and match
              // But this is not guaranteed - ideally we should store the mapping
              blockchainPetitionId = petitionId
              console.warn(
                `No blockchain petition ID found for petition ${petitionId}, using database ID as fallback`
              )

              toast({
                title: "Warning",
                description: "Blockchain petition ID not found, using fallback method",
                variant: "destructive",
              })
            }

            console.debug(
              `Signing petition - DB ID: ${petitionId}, Blockchain ID: ${blockchainPetitionId}`
            )

            // Send transaction to sign petition on blockchain
            const tx = await contract.signPetition(blockchainPetitionId)
            toast({ title: "Transaction sent", description: `Hash: ${tx.hash.slice(0, 10)}...` })

            // Wait for confirmation
            const receipt = await tx.wait()
            toast({
              title: "Blockchain signature confirmed",
              description: `Block: ${receipt.blockNumber}`,
            })

            console.debug("✅ Petition signed on blockchain:", receipt)
            blockchainSigningSuccess = true
          }
        }
      } catch (blockchainError: any) {
        console.warn("⚠️ Blockchain signing failed:", blockchainError)

        // Check for specific authorization error
        if (blockchainError.message && blockchainError.message.includes("User not authorized")) {
          toast({
            title: "❌ Not Authorized",
            description:
              "Your wallet address is not authorized to sign petitions. Please contact an administrator to get your address authorized in the system.",
            variant: "destructive",
          })
          return // Don't continue with database signing if not authorized
        } else if (
          blockchainError.message &&
          blockchainError.message.includes("execution reverted")
        ) {
          // Other contract revert errors
          const revertReason =
            blockchainError.reason ||
            blockchainError.message.match(/execution reverted: "?([^"]*)"?/)?.[1] ||
            "Unknown contract error"
          toast({
            title: "❌ Transaction Failed",
            description: `Blockchain error: ${revertReason}`,
            variant: "destructive",
          })
          return
        } else if (blockchainError.code === 4001) {
          // User rejected transaction
          toast({
            title: "Transaction Cancelled",
            description: "You cancelled the blockchain transaction",
            variant: "destructive",
          })
          return
        } else {
          // Other blockchain errors (network issues, etc.)
          toast({
            title: "⚠️ Blockchain Error",
            description:
              "Failed to sign on blockchain. Your signature will only be recorded in the database.",
            variant: "destructive",
          })
          console.debug("⚠️ Continuing with database-only signing due to blockchain error")
        }
      }

      // Submit signature to backend with user ID
      const response = await fetch(`${BALLERINA_BASE_URL}/petitions/${petitionId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          wallet_address: walletAddress,
          signature: signature,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update local petition data
          setPetitions((prev) =>
            prev.map((p) =>
              p.id === petitionId ? { ...p, signature_count: (p.signature_count || 0) + 1 } : p
            )
          )

          // Also create petition activity
          await fetch(`${BALLERINA_BASE_URL}/petitionactivities`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              petition_id: petitionId,
              activity_type: "SIGNATURE",
              signature_count: 1,
              user_id: 1, // You might want to get this from user context
            }),
          })

          // Update user signatures state
          setUserSignatures((prev) => ({
            ...prev,
            [petitionId]: true,
          }))

          toast({
            title: "✅ Petition signed!",
            description: blockchainSigningSuccess
              ? `Your signature has been added to "${petition.title}" on blockchain and database`
              : `Your signature has been added to "${petition.title}" in database (blockchain signing failed)`,
          })
        } else if (data.error === "ALREADY_SIGNED") {
          toast({
            title: "Already signed",
            description: "You have already signed this petition",
            variant: "destructive",
          })
          // Update local state to reflect this
          setUserSignatures((prev) => ({
            ...prev,
            [petitionId]: true,
          }))
        } else {
          throw new Error(data.message || "Failed to sign petition")
        }
      } else {
        throw new Error("Failed to sign petition")
      }
    } catch (error: any) {
      console.error("Error signing petition:", error)
      if (error.code === 4001) {
        toast({
          title: "Signature cancelled",
          description: "You cancelled the signature request",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error signing petition",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        })
      }
    } finally {
      setSigningPetition(null)
    }
  }

  // Load petitions and categories when component mounts
  React.useEffect(() => {
    fetchPetitions()
    fetchCategories()
  }, [])

  // Check user signatures when wallet address changes
  React.useEffect(() => {
    if (walletAddress && petitions.length > 0) {
      checkUserSignatures(petitions)
    }
  }, [walletAddress, petitions.length])

  // Create petition function
  const createPetition = async () => {
    // Prevent multiple simultaneous requests
    if (isCreatingPetition) {
      toast({
        title: "Please wait",
        description: "Petition creation is already in progress",
        variant: "destructive",
      })
      return
    }

    // Enhanced wallet address validation
    if (!walletAddress || walletAddress.trim() === "") {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first using the Connect button",
        variant: "destructive",
      })
      return
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      toast({
        title: "Invalid wallet address",
        description: "The wallet address format is invalid. Please reconnect your wallet.",
        variant: "destructive",
      })
      return
    }

    if (!petitionForm.title || !petitionForm.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsCreatingPetition(true)
    setLastError(null) // Clear any previous errors
    try {
      // Step 1: Check if MetaMask/wallet is available
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
      }

      // Step 2: Ensure we're connected to the right account
      let accounts
      try {
        accounts = await (window.ethereum as any).request({ method: "eth_accounts" })
      } catch (accountError: any) {
        console.error("Failed to get accounts:", accountError)
        throw new Error("Failed to get wallet accounts. Please try again.")
      }

      if (accounts.length === 0) {
        // Only request accounts if we don't have any
        try {
          toast({
            title: "Account Access Required",
            description: "Please approve wallet connection in MetaMask",
          })
          accounts = await (window.ethereum as any).request({ method: "eth_requestAccounts" })
        } catch (requestError: any) {
          if (requestError.code === -32002) {
            throw new Error(
              "MetaMask is already processing a connection request. Please check your MetaMask extension and try again."
            )
          } else if (requestError.code === 4001) {
            throw new Error("User rejected wallet connection request")
          }
          throw new Error(`Failed to connect wallet: ${requestError.message || requestError}`)
        }
      }

      // Double-check the current account matches our walletAddress
      const currentAccount = accounts[0]?.toLowerCase()
      if (!currentAccount) {
        throw new Error("No wallet account found. Please connect your wallet first.")
      }

      if (currentAccount !== walletAddress.toLowerCase()) {
        throw new Error(
          `Account mismatch. Please switch to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} in MetaMask`
        )
      }

      // Step 3: Create a clear message to sign
      const timestamp = new Date().toISOString()
      const message = `🗳️ CREATE PETITION CONFIRMATION

Title: ${petitionForm.title}

Description: ${petitionForm.description}

Target Signatures: ${petitionForm.targetSignatures.toLocaleString()}

Wallet: ${walletAddress}
Timestamp: ${timestamp}

⚠️ By signing this message, you confirm that you want to create this petition on the blockchain. This action cannot be undone.`

      toast({
        title: "Signature Required",
        description: "Please check your wallet to sign the petition creation request",
      })

      // Step 4: Request signature from user
      let signature
      try {
        signature = await (window.ethereum as any).request({
          method: "personal_sign",
          params: [message, walletAddress],
        })
      } catch (signError: any) {
        if (signError.code === 4001) {
          throw new Error("User rejected the signature request")
        }
        throw new Error(`Signature failed: ${signError.message || signError}`)
      }

      if (!signature) {
        throw new Error("No signature received from wallet")
      }

      toast({
        title: "✅ Signature confirmed",
        description: "Creating petition on blockchain...",
      })

      // Optional: previous server-side create attempt (kept for compatibility)
      let contractData = null
      try {
        const smartContractResponse = await fetch(
          `${API_BASE_URL}/petition/create-petition`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: petitionForm.title,
              description: petitionForm.description,
              requiredSignatures: petitionForm.targetSignatures,
              signerIndex: 0, // Use first signer for demo
            }),
          }
        )

        if (smartContractResponse.ok) {
          contractData = await smartContractResponse.json()
          console.debug("✅ Smart contract petition created:", contractData)
        } else {
          console.warn(
            "⚠️ Smart contract service responded with error:",
            smartContractResponse.status
          )
        }
      } catch (blockchainError) {
        console.warn(
          "⚠️ Smart contract service unavailable, continuing with database storage only:",
          blockchainError
        )
      }

      // Step 3: Save petition draft to Ballerina backend (required to obtain draftId)
      const ballerinaResp = await fetch(`${BALLERINA_BASE_URL}/petitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: petitionForm.title,
          description: petitionForm.description,
          required_signature_count: petitionForm.targetSignatures,
          wallet_address: walletAddress,
        }),
      })

      if (!ballerinaResp.ok) {
        const txt = await ballerinaResp.text()
        throw new Error(`Failed to create draft: ${ballerinaResp.status} ${txt}`)
      }

      const ballerinaData = await ballerinaResp.json()
      // try to extract draft id from common response shapes
      const draftId = ballerinaData?.data?.id || ballerinaData?.id || ballerinaData?.petition?.id
      if (!draftId) {
        throw new Error("Could not determine draftId from Ballerina response")
      }

      // Step 4: Prepare IPFS + contract info from the prepare service
      const prepRes = await fetch(`${API_BASE_URL}/petition/prepare-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: petitionForm.title,
          description: petitionForm.description,
        }),
      })

      if (!prepRes.ok) {
        const txt = await prepRes.text()
        throw new Error(`Prepare failed: ${prepRes.status} ${txt}`)
      }

      const prepJson = await prepRes.json()
      const { titleCid, descriptionCid, contractAddress, contractAbi } = prepJson
      if (!titleCid || !descriptionCid || !contractAddress || !contractAbi) {
        throw new Error("Prepare endpoint did not return all required fields")
      }

      toast({
        title: "Ready to sign",
        description: "Please confirm the transaction in your wallet",
      })

      // 3) Send transaction from user's wallet using ethers and Sepolia network
      const ethers = await import("ethers")
      // Use BrowserProvider for ESM v6 in browser
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      // Request accounts (ensure connected)
      await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      // Send transaction
      const tx = await contract.createPetition(
        titleCid,
        descriptionCid,
        petitionForm.targetSignatures
      )
      toast({ title: "Transaction sent", description: tx.hash })

      // 4) Wait for confirmation
      const receipt = await tx.wait()
      toast({ title: "Transaction confirmed", description: `Block ${receipt.blockNumber}` })

      // Try to decode event to get petitionId
      let blockchainPetitionId = null
      try {
        const iface = new (ethers as any).Interface(contractAbi)
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log)
            if (parsed && parsed.name && parsed.name.toLowerCase().includes("petition")) {
              blockchainPetitionId = parsed.args?.[0]?.toString() || null
              break
            }
          } catch (e) {
            // ignore non-matching logs
          }
        }
        if (!blockchainPetitionId) {
          try {
            const bn = await contract.petitionCount()
            blockchainPetitionId = bn.toString()
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.warn("Could not parse event for petition id", e)
      }

      // 5) Confirm draft with Ballerina backend
      try {
        await fetch(`${BALLERINA_BASE_URL}/petitions/${draftId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            blockchainPetitionId,
            titleCid,
            descriptionCid,
          }),
        })
      } catch (err) {
        console.error(err)
      }

      toast({ title: "Petition created", description: "Saved to blockchain and backend" })

      // Reset form
      setPetitionForm({
        title: "",
        description: "",
        targetSignatures: 10000,
      })

      // Refresh petitions list
      fetchPetitions()

      console.debug("Smart contract data:", contractData)
      console.debug("Database data:", ballerinaData)
    } catch (error: any) {
      console.error("Failed create flow:", error)
      setLastError(error?.message || String(error))
      toast({
        title: "Failed to create petition",
        description: error?.message || "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsCreatingPetition(false)
    }
  }

  // Reports state from backend
  const [reports, setReports] = useState<Report[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)

  // Report statistics state
  const [reportStatistics, setReportStatistics] = useState({
    total_reports: 0,
    resolved_reports: 0,
    unresolved_reports: 0,
    resolution_rate_percentage: 0,
    priority_breakdown: {} as Record<string, number>,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0)

  // Fetch reports from backend
  React.useEffect(() => {
    const fetchReports = async () => {
      setIsLoadingReports(true)
      try {
        const data = await reportService.getAllReports()
        // Normalize reports: some backends return `id` or `reportId` instead of `report_id`
        // Also handle vote column name variations: likes/dislikes OR upvotes/downvotes
        const normalized = data.map((r: any) => {
          const idCandidate = r.report_id ?? r.id ?? r.reportId ?? r.reportIdString ?? null
          const reportIdNum = idCandidate == null ? undefined : Number(idCandidate)
          // Normalize title fields from different backends
          const title = r.report_title ?? r.title ?? r.reportTitle ?? ""

          // Coalesce vote fields from different possible shapes
          const rawLikes = r.likes ?? r.like ?? r.upvotes ?? r.upvote ?? (r.votes && r.votes.likes)
          const rawDislikes =
            r.dislikes ?? r.dislike ?? r.downvotes ?? r.downvote ?? (r.votes && r.votes.dislikes)

          const likesNum = Number.isFinite(Number(rawLikes)) ? Number(rawLikes) : 0
          const dislikesNum = Number.isFinite(Number(rawDislikes)) ? Number(rawDislikes) : 0

          return {
            ...r,
            report_id: reportIdNum ?? r.report_id,
            report_title: title,
            likes: likesNum,
            dislikes: dislikesNum,
          } as Report & any
        })
        setReports(normalized)

        // Check user votes if wallet is connected (use normalized data so IDs and shapes are consistent)
        if (address) {
          await checkUserReportVotes(normalized)
        }

        // Refresh statistics after fetching reports
        await refreshReportStatistics()
      } catch (e) {
        // Optionally show a toast
        console.error("Failed to fetch reports:", e)
      } finally {
        setIsLoadingReports(false)
      }
    }
    fetchReports()
  }, [address])

  // Check user votes when wallet address changes and reports are already loaded
  React.useEffect(() => {
    if (address && reports.length > 0) {
      checkUserReportVotes(reports)
    }
  }, [address, reports.length])

  // Fetch report statistics from backend
  React.useEffect(() => {
    const fetchReportStatistics = async () => {
      setIsLoadingStats(true)
      try {
        const stats = await reportService.getReportStatistics()
        setReportStatistics(stats)
      } catch (e) {
        console.error("Failed to fetch report statistics:", e)
        // Fallback to calculating from current reports
        if (reports.length > 0) {
          const resolved = reports.filter((r) => r.resolved_status).length
          const unresolved = reports.filter((r) => !r.resolved_status).length
          const total = reports.length
          const rate = total > 0 ? Math.round((resolved / total) * 100) : 0

          setReportStatistics({
            total_reports: total,
            resolved_reports: resolved,
            unresolved_reports: unresolved,
            resolution_rate_percentage: rate,
            priority_breakdown: getDynamicPriorityStats(),
          })
        }
      } finally {
        setIsLoadingStats(false)
      }
    }
    fetchReportStatistics()
  }, [reports.length, statsRefreshTrigger])

  // Function to refresh report statistics
  const refreshReportStatistics = async () => {
    setStatsRefreshTrigger((prev) => prev + 1)
  }

  // Calculate average resolution time from resolved reports
  const getAverageResolutionTime = () => {
    const resolvedReports = reports.filter((r) => r.resolved_status && r.resolved_time)
    if (resolvedReports.length === 0) return null

    const totalDays = resolvedReports.reduce((sum, report) => {
      const created = new Date(report.created_time)
      const resolved = new Date(report.resolved_time!)
      const diffTime = Math.abs(resolved.getTime() - created.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return sum + diffDays
    }, 0)

    return Math.round(totalDays / resolvedReports.length)
  }

  // Check which reports the user has already voted on
  const checkUserReportVotes = async (reportList: Report[]) => {
    if (!address) return

    const votes: { [key: number]: "upvote" | "downvote" | null } = {}

    // Check user votes using the API
    for (const report of reportList) {
      try {
        const voteType = await reportService.checkUserVote(report.report_id, address)
        // Map backend response ("like"/"dislike") to frontend format ("upvote"/"downvote")
        if (voteType === "like") {
          votes[report.report_id] = "upvote"
        } else if (voteType === "dislike") {
          votes[report.report_id] = "downvote"
        } else {
          votes[report.report_id] = null
        }
      } catch (error) {
        console.error(`Error checking vote for report ${report.report_id}:`, error)
        votes[report.report_id] = null
      }
    }

    setReportVotes(votes)
  }

  // Allow users to change their vote
  const changeVote = async (reportId: number, newVoteType: "upvote" | "downvote") => {
    if (!address) {
      toast({
        title: "Wallet Required",
        description: "Connect your wallet to vote",
        variant: "destructive",
      })
      return
    }

    // Find report to get blockchain id fallback
    const report = reports.find((r) => r.report_id === reportId)
    
    // Prevent voting on resolved reports
    if (report?.resolved_status) {
      toast({
        title: "Cannot Vote",
        description: "Resolved reports cannot be voted on",
        variant: "destructive",
      })
      return
    }

    try {
      // Step 1: call prepare endpoint to get contract info (we pass minimal dummy payload)
      const prepRes = await fetch(`${API_BASE_URL}/report/prepare-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: report?.report_title || "vote",
          description: "vote",
          evidenceHash: "0x0",
        }),
      })

      if (!prepRes.ok) {
        const txt = await prepRes.text()
        throw new Error(`Prepare failed: ${prepRes.status} ${txt}`)
      }

      const prepJson = await prepRes.json()
      const { contractAddress, contractAbi } = prepJson
      if (!contractAddress || !contractAbi) throw new Error("Contract information not available")

      // Step 2: send tx from user's wallet
      const ethers = await import("ethers")
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      // Determine blockchain report id (use stored blockchain id if available)
      const blockchainId =
        (report as any)?.blockchain_report_id || (report as any)?.blockchainReportId || reportId

      let tx
      if (newVoteType === "upvote") {
        tx = await contract.upvoteReport(blockchainId)
      } else {
        tx = await contract.downvoteReport(blockchainId)
      }

      toast({ title: "Transaction sent", description: tx.hash })
      const receipt = await tx.wait()
      toast({ title: "Transaction confirmed", description: `Block ${receipt.blockNumber}` })

      // Step 3: persist vote to backend and update UI from returned report
      let updatedReport
      try {
        if (newVoteType === "upvote") {
          updatedReport = await reportService.likeReport(reportId, address)
        } else {
          updatedReport = await reportService.dislikeReport(reportId, address)
        }
      } catch (backendError: any) {
        // Handle backend errors (500, 400, etc.) gracefully
        console.error("Backend vote error:", backendError)
        const errorMsg = backendError?.response?.data?.message || 
                        backendError?.message || 
                        "Failed to record vote in database"
        toast({
          title: "Backend Error",
          description: `Blockchain vote succeeded, but database sync failed: ${errorMsg}`,
          variant: "destructive",
        })
        // Still refresh the reports list to get latest state
        const data = await reportService.getAllReports()
        const normalized = data.map((r: any) => {
          const reportIdNum = Number.isFinite(Number(r.id)) ? Number(r.id) : r.report_id
          const title = r.report_title || r.title || "Untitled Report"
          const rawLikes = r.likes ?? r.like ?? r.upvotes ?? r.upvote ?? (r.votes && r.votes.likes)
          const rawDislikes = r.dislikes ?? r.dislike ?? r.downvotes ?? r.downvote ?? (r.votes && r.votes.dislikes)
          const likesNum = Number.isFinite(Number(rawLikes)) ? Number(rawLikes) : 0
          const dislikesNum = Number.isFinite(Number(rawDislikes)) ? Number(rawDislikes) : 0
          return { ...r, report_id: reportIdNum ?? r.report_id, report_title: title, likes: likesNum, dislikes: dislikesNum } as Report & any
        })
        setReports(normalized)
        return
      }

      // Update local state with new data from backend (single source of truth)
      setReports((prev) => prev.map((r) => (r.report_id === reportId ? updatedReport : r)))
      setReportVotes((prev) => ({ ...prev, [reportId]: newVoteType }))

      toast({
        title: "Vote Recorded",
        description: `Successfully ${newVoteType === "upvote" ? "upvoted" : "downvoted"} report`,
      })

      // Show priority change if it occurred
      const currentReport = reports.find((r) => r.report_id === reportId)
      if (currentReport && currentReport.priority !== updatedReport.priority) {
        setPriorityChanges((prev) => ({
          ...prev,
          [reportId]: `${currentReport.priority} → ${updatedReport.priority}`,
        }))
        setTimeout(() => {
          setPriorityChanges((prev) => {
            const newChanges = { ...prev }
            delete newChanges[reportId]
            return newChanges
          })
        }, 5000)
      }
    } catch (error: any) {
      console.error("Failed to change vote:", error)
      
      // Provide more helpful error messages
      let errorMessage = "Failed to record vote"
      if (error?.code === 4001) {
        errorMessage = "Transaction rejected by user"
      } else if (error?.message?.includes("Prepare failed")) {
        errorMessage = "Unable to prepare blockchain transaction. Smart contract service may be unavailable."
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Vote Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const reportStats = [
    { month: "Jan", reports: 23, resolved: 18 },
    { month: "Feb", reports: 31, resolved: 24 },
    { month: "Mar", reports: 28, resolved: 22 },
    { month: "Apr", reports: 35, resolved: 29 },
    { month: "May", reports: 42, resolved: 35 },
    { month: "Jun", reports: 38, resolved: 31 },
  ]

  const petitionActivity = [
    { day: "Mon", signatures: 234 },
    { day: "Tue", signatures: 456 },
    { day: "Wed", signatures: 389 },
    { day: "Thu", signatures: 567 },
    { day: "Fri", signatures: 723 },
    { day: "Sat", signatures: 445 },
    { day: "Sun", signatures: 334 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Under Investigation":
        return "bg-yellow-100 text-yellow-800"
      case "Resolved":
        return "bg-green-100 text-green-800"
      case "Dismissed":
        return "bg-red-100 text-red-800"
      case "Active":
        return "bg-blue-100 text-blue-800"
      case "Threshold Met":
        return "bg-green-100 text-green-800"
      case "Expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get priority color based on priority level
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "text-red-600"
      case "HIGH":
        return "text-orange-600"
      case "MEDIUM":
        return "text-yellow-600"
      case "LOW":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  // Calculate dynamic priority statistics from current reports
  const getDynamicPriorityStats = () => {
    const stats = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    reports.forEach((report) => {
      if (stats.hasOwnProperty(report.priority)) {
        stats[report.priority as keyof typeof stats]++
      }
    })
    return stats
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Citizen Reporting & Petition System</h2>
        <p className="text-slate-600">
          Anonymous Reporting And Public Petitions For Sri Lankan Governance
        </p>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList
          className="flex w-full overflow-x-auto overflow-y-hidden justify-start sm:justify-start"
        >
          <TabsTrigger
            value="reports"
            className="flex-shrink-0 px-4 py-2 text-sm"
          >
            Whistleblowing Reports
          </TabsTrigger>
          <TabsTrigger
            value="petitions"
            className="flex-shrink-0 px-4 py-2 text-sm"
          >
            Smart Contract Petitions
          </TabsTrigger>
          <TabsTrigger
            value="submit"
            className="flex-shrink-0 px-4 py-2 text-sm"
          >
            Submit Report/Petition
          </TabsTrigger>
        </TabsList>



        <TabsContent value="reports" className="space-y-6">
          {/* Stats Header with Refresh */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Report Overview</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshReportStatistics}
              disabled={isLoadingStats}
              className="flex items-center gap-2"
            >
              {isLoadingStats ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                  Updating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Refresh Stats
                </>
              )}
            </Button>
          </div>

          {/* Report Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {isLoadingStats && reports.length === 0 ? (
              // Show loading skeleton when initially loading
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border-0 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200"></div>
                    <div className="h-4 w-4 animate-pulse rounded bg-slate-200"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 h-8 w-16 animate-pulse rounded bg-slate-200"></div>
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="border-0 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    {isLoadingStats ? (
                      <div className="animate-pulse text-2xl font-bold">...</div>
                    ) : (
                      <div className="text-2xl font-bold">
                        {reportStatistics.unresolved_reports}
                      </div>
                    )}
                    <p className="text-xs text-slate-500">Under investigation</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    {isLoadingStats ? (
                      <div className="animate-pulse text-2xl font-bold">...</div>
                    ) : (
                      <div className="text-2xl font-bold">{reportStatistics.resolved_reports}</div>
                    )}
                    <p className="text-xs text-slate-500">This year</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    {isLoadingStats ? (
                      <div className="animate-pulse text-2xl font-bold">...</div>
                    ) : (
                      <div className="text-2xl font-bold">{reportStatistics.total_reports}</div>
                    )}
                    <p className="text-xs text-slate-500">All time</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    {isLoadingStats ? (
                      <div className="animate-pulse text-2xl font-bold">...</div>
                    ) : (
                      <div className="text-2xl font-bold">
                        {reportStatistics.resolution_rate_percentage}%
                      </div>
                    )}
                    <p className="text-xs text-slate-500">Success rate</p>
                    {!isLoadingStats && getAverageResolutionTime() && (
                      <p className="mt-1 text-xs text-slate-400">
                        Avg. time: {getAverageResolutionTime()} days
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {isLoadingReports ? (
              <div className="flex justify-center py-8">Loading reports...</div>
            ) : (
              reports.map((report) => (
                <Card key={report.report_id} className="border-0 shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{report.report_title}</CardTitle>
                          <Badge variant="outline">{report.priority}</Badge>
                          <Badge
                            className={getStatusColor(
                              report.resolved_status ? "Resolved" : "Under Investigation"
                            )}
                          >
                            {report.resolved_status ? "Resolved" : "Under Investigation"}
                          </Badge>
                          {/* Priority change indicator */}
                          {priorityChanges[report.report_id] && (
                            <Badge
                              variant="secondary"
                              className="animate-pulse bg-blue-100 text-blue-800"
                            >
                              <TrendingUp className="mr-1 h-3 w-3" />
                              {priorityChanges[report.report_id]}
                            </Badge>
                          )}
                          <div className="text-xs text-slate-500">
                            {report.likes && report.dislikes && (
                              <span className="inline-flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Vote-based priority
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>ID: {report.report_id}</span>
                          <span>•</span>
                          <span>
                            Submitted: {new Date(report.created_time).toLocaleDateString()}
                          </span>
                          {report.last_updated_time && (
                            <>
                              <span>•</span>
                              <span>
                                Updated: {new Date(report.last_updated_time).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getPriorityColor(report.priority)}`}>
                          {report.priority} Priority
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Net votes: {(report.likes || 0) - (report.dislikes || 0)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-600">Submitted By</p>
                        <p className="text-sm font-medium">{report.assigned_to || "Anonymous"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Assigned To</p>
                        <p className="font-medium">{report.assigned_to || "Unassigned"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Hash className="h-3 w-3" />
                        <span>Blockchain verified</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setOpenReportDetails((prev) => ({
                              ...prev,
                              [report.report_id]: !prev[report.report_id],
                            }))
                          }
                        >
                          {openReportDetails[report.report_id] ? "Hide Details" : "View Details"}
                        </Button>
                        {/* Upvote/Downvote Buttons for Reports - disabled if resolved */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => changeVote(report.report_id, "upvote")}
                            disabled={report.resolved_status || reportVotes[report.report_id] === "upvote"}
                            className={
                              reportVotes[report.report_id] === "upvote"
                                ? "bg-green-50 text-green-600 hover:text-green-700"
                                : "text-slate-500 hover:text-slate-700"
                            }
                            title={report.resolved_status ? "Cannot vote on resolved reports" : "Upvote this report"}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <span className="min-w-[2rem] text-center text-sm font-medium text-slate-600">
                            {report.likes || 0}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => changeVote(report.report_id, "downvote")}
                            disabled={report.resolved_status || reportVotes[report.report_id] === "downvote"}
                            className={
                              reportVotes[report.report_id] === "downvote"
                                ? "bg-red-50 text-red-600 hover:text-red-700"
                                : "text-slate-500 hover:text-slate-700"
                            }
                            title={report.resolved_status ? "Cannot vote on resolved reports" : "Downvote this report"}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                          <span className="min-w-[2rem] text-center text-sm font-medium text-slate-600">
                            {report.dislikes || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Details area (toggle) */}
                    {openReportDetails[report.report_id] && (
                      <div className="mt-3 rounded bg-gray-50 p-3">
                        <p className="whitespace-pre-wrap text-sm text-slate-700">
                          {report.description || "No description available"}
                        </p>
                        {(report as any).title_cid && (
                          <p className="mt-2 text-xs text-slate-400">
                            Title CID:{" "}
                            <span className="font-mono">{(report as any).title_cid}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="petitions" className="space-y-6">
          {/* Petition Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Petitions</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {petitions.filter((p) => !p.removed && p.status === "ACTIVE").length}
                </div>
                <p className="text-xs text-slate-500">Collecting signatures </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Signatures</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {petitions
                    .filter((p) => !p.removed)
                    .reduce((total, p) => total + (p.signature_count || 0), 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-slate-500">All time </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {petitions.filter((p) => !p.removed).length > 0
                    ? Math.round(
                      (petitions.filter(
                        (p) => !p.removed && (p.signature_count || 0) >= p.required_signature_count
                      ).length /
                        petitions.filter((p) => !p.removed).length) *
                      100
                    )
                    : 0}
                  %
                </div>
                <p className="text-xs text-slate-500">Threshold reached </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Petitions</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{petitions.filter((p) => !p.removed).length}</div>
                <p className="text-xs text-slate-500">All petitions </p>
              </CardContent>
            </Card>
          </div>

          {/* Petitions List */}
          <div className="space-y-4">
            {isLoadingPetitions ? (
              <div className="flex justify-center py-8">
                <div className="mr-2 animate-spin">⏳</div>
                Loading petitions...
              </div>
            ) : petitions.filter((p) => !p.removed).length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-8 text-center text-slate-500">
                  No petitions found. Create the first petition to get started!
                </CardContent>
              </Card>
            ) : (
              petitions.filter((p) => !p.removed).map((petition) => {
                const progress =
                  petition.required_signature_count > 0
                    ? ((petition.signature_count || 0) / petition.required_signature_count) * 100
                    : 0
                const isThresholdMet =
                  (petition.signature_count || 0) >= petition.required_signature_count
                const status = isThresholdMet
                  ? "Threshold Met"
                  : petition.completed
                    ? "Completed"
                    : "Active"

                return (
                  <Card key={petition.id} className="border-0 shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{petition.title}</CardTitle>
                            <Badge variant="outline">Governance</Badge>
                            <Badge className={getStatusColor(status)}>{status}</Badge>
                          </div>
                          <CardDescription>{petition.description}</CardDescription>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>
                              Created: {new Date(petition.created_at).toLocaleDateString()}
                            </span>
                            {petition.deadline && (
                              <>
                                <span>•</span>
                                <span>
                                  Deadline: {new Date(petition.deadline).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            Signatures: {(petition.signature_count || 0).toLocaleString()} /{" "}
                            {petition.required_signature_count.toLocaleString()}
                          </span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} />
                      </div>

                      <div className="flex items-center justify-between border-t pt-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Hash className="h-3 w-3" />
                          <span>ID: {petition.id}</span>
                          {petition.blockchain_petition_id && (
                            <>
                              <span>•</span>
                              <span className="font-mono">
                                Blockchain: {petition.blockchain_petition_id}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {!petition.completed && !isThresholdMet && (
                            <Button
                              size="sm"
                              onClick={() => signPetition(petition.id)}
                              disabled={
                                !walletAddress ||
                                signingPetition === petition.id ||
                                userSignatures[petition.id]
                              }
                            >
                              {signingPetition === petition.id ? (
                                <>
                                  <span className="mr-2 animate-spin">⏳</span>
                                  Signing...
                                </>
                              ) : userSignatures[petition.id] ? (
                                "Already Signed"
                              ) : (
                                "Sign Petition"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Submit Report */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Submit Anonymous Report
                </CardTitle>
                <CardDescription>
                  End-To-End Encrypted Submission With Cryptographic Anonymity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={reportForm.category}
                    onValueChange={(value) => setReportForm({ ...reportForm, category: value })}
                    disabled={isLoadingCategories}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingCategories ? "Loading categories..." : "Select category"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_name}>
                          {category.category_name}
                        </SelectItem>
                      ))}
                      {categories.length === 0 && !isLoadingCategories && (
                        <SelectItem value="other" disabled>
                          No categories available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Brief description of the issue"
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Detailed Description</label>
                  <Textarea
                    placeholder="Provide detailed information about the incident..."
                    rows={4}
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  />
                </div>

                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">Privacy Guarantee</span>
                  </div>
                  <p className="mt-1 text-xs text-blue-700">
                    Your identity is protected through zero-knowledge proofs. No personal
                    information is stored or transmitted.
                  </p>
                </div>

                {/* Wallet Status Display */}
                {address ? (
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Wallet Connected</span>
                    </div>
                    <p className="mt-1 text-xs text-green-700">
                      {address.slice(0, 6)}...{address.slice(-4)} - Ready to submit anonymous
                      reports
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-yellow-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Wallet Required</span>
                    </div>
                    <p className="mt-1 text-xs text-yellow-700">
                      Please connect your wallet to submit anonymous reports securely.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={submitReport}
                  disabled={
                    !address ||
                    isSubmittingReport ||
                    !reportForm.title.trim() ||
                    !reportForm.description.trim() ||
                    !reportForm.category
                  }
                >
                  {isSubmittingReport ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      Submitting Report...
                    </>
                  ) : !address ? (
                    "🔐 Connect Wallet to Submit"
                  ) : (
                    "🛡️ Submit Anonymous Report"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Create Petition */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Create Smart Contract Petition
                </CardTitle>
                <CardDescription>
                  Automated Execution When Signature Threshold Is Met
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Petition Title</label>
                  <Input
                    placeholder="Clear, actionable petition title"
                    value={petitionForm.title}
                    onChange={(e) => setPetitionForm({ ...petitionForm, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Detailed explanation of the petition and desired outcome..."
                    rows={4}
                    value={petitionForm.description}
                    onChange={(e) =>
                      setPetitionForm({ ...petitionForm, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Signatures</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Enter target signature count"
                    value={petitionForm.targetSignatures.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      const numValue = value === "" ? 0 : Number.parseInt(value)
                      if (!isNaN(numValue) && numValue >= 0) {
                        setPetitionForm({ ...petitionForm, targetSignatures: numValue })
                      }
                    }}
                  />
                </div>


                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">Privacy Guarantee</span>
                  </div>
                  <p className="mt-1 text-xs text-blue-700">
                    Your identity is protected through zero-knowledge proofs. No personal
                    information is stored or transmitted.
                    Note: A citizen can only create one petition every week to prevent spam.
                  </p>
                </div>

                {/* Wallet Status Display */}
                {walletAddress ? (
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Wallet Connected</span>
                    </div>
                    <p className="mt-1 text-xs text-green-700">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)} - Ready to Create Petition
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-yellow-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Wallet Required</span>
                    </div>
                    <p className="mt-1 text-xs text-yellow-700">
                      Please connect your wallet using the button in the top right corner to create
                      petitions.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={createPetition}
                  disabled={
                    !walletAddress ||
                    isCreatingPetition ||
                    !petitionForm.title.trim() ||
                    !petitionForm.description.trim()
                  }
                >
                  {isCreatingPetition ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      Creating Petition...
                    </>
                  ) : lastError === "user_rejected" ? (
                    "🔄 Try Again - Create Petition"
                  ) : lastError === "metamask_busy" ? (
                    "⏰ Retry - Create Petition"
                  ) : (
                    "Create Petition"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
