"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { Shield, AlertTriangle, FileText, Users, Clock, CheckCircle, Lock, Upload, Hash, TrendingUp } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import axios from 'axios'

declare global {
  interface Window {
    ethereum?: Record<string, unknown>
  }
}

interface WhistleblowingSystemProps {
  walletAddress?: string | null
}

export function WhistleblowingSystem({ walletAddress }: WhistleblowingSystemProps) {
  const { address, verified } = useAuth()
  
  // Form states
  const [reportForm, setReportForm] = useState({ category: "", title: "", description: "", evidence: null as File | null })
  const [petitionForm, setPetitionForm] = useState({ title: "", description: "", targetSignatures: 10000 })
  
  // Loading states
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [isCreatingPetition, setIsCreatingPetition] = useState(false)
  const [isLoadingPetitions, setIsLoadingPetitions] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [signingPetition, setSigningPetition] = useState<number | null>(null)
  
  // Data states
  const [petitions, setPetitions] = useState<any[]>([])
  const [userSignatures, setUserSignatures] = useState<{ [key: number]: boolean }>({})
  const [categories, setCategories] = useState<any[]>([])
  const [lastError, setLastError] = useState<string | null>(null)

  // Utility functions
  const getUserId = (walletAddress: string): number => {
    let hash = 0
    for (let i = 0; i < walletAddress.length; i++) {
      const char = walletAddress.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash % 10000) + 1
  }

  const normalizeAddress = (addr?: string | null) => {
    if (!addr) return null
    let a = String(addr).trim()
    if (!a.startsWith("0x")) {
      if (/^[a-fA-F0-9]{40}$/.test(a)) a = `0x${a}`
      else return null
    }
    return /^0x[a-fA-F0-9]{40}$/.test(a) ? a.toLowerCase() : null
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve((e.target?.result as string) || "")
      reader.onerror = (e) => reject(e)
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  const generateEvidenceHash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return `0x${hashHex.substring(0, 16)}`
  }

  const getCategoryPriority = (category: string): string => {
    const priorityMap: { [key: string]: string } = {
      health: "HIGH", defense: "CRITICAL", infrastructure: "HIGH", security: "CRITICAL",
      environment: "HIGH", finance: "HIGH", financial: "HIGH", safety: "CRITICAL", regulatory: "HIGH"
    }
    return priorityMap[category.toLowerCase()] || "MEDIUM"
  }

  // Wallet validation helper
  const validateWallet = async (requiredAddress: string) => {
    if (!window.ethereum) throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    
    let accounts
    try {
      accounts = await (window.ethereum as any).request({ method: "eth_accounts" })
    } catch (error: any) {
      throw new Error("Failed to get wallet accounts. Please try again.")
    }

    if (accounts.length === 0) {
      try {
        toast.loading("🔗 Please approve wallet connection in MetaMask")
        accounts = await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      } catch (error: any) {
        if (error.code === -32002) throw new Error("MetaMask is already processing a connection request. Please check your MetaMask extension and try again.")
        if (error.code === 4001) throw new Error("User rejected wallet connection request")
        throw new Error(`Failed to connect wallet: ${error.message || error}`)
      }
    }

    const currentAccount = accounts[0]?.toLowerCase()
    if (!currentAccount) throw new Error("No wallet account found. Please connect your wallet first.")
    if (currentAccount !== requiredAddress.toLowerCase()) {
      throw new Error(`Account mismatch. Please switch to ${requiredAddress.slice(0, 6)}...${requiredAddress.slice(-4)} in MetaMask`)
    }
  }

  // Submit report function
  const submitReport = async () => {
    if (isSubmittingReport) {
      toast.error("⏳ Report submission is already in progress")
      return
    }

    if (!address) {
      toast.error("🔗 Please connect your wallet to submit reports")
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast.error("❌ Invalid wallet address format. Please reconnect your wallet.")
      return
    }

    if (!reportForm.category || !reportForm.title || !reportForm.description) {
      toast.error("📝 Please fill in all required fields")
      return
    }

    setIsSubmittingReport(true)
    try {
      await validateWallet(address)

      // Create evidence data and hash
      let evidenceData: any = {
        category: reportForm.category, title: reportForm.title, description: reportForm.description,
        timestamp: new Date().toISOString(), userAddress: address
      }

      if (reportForm.evidence) {
        const fileContent = await readFileAsText(reportForm.evidence)
        evidenceData.evidenceFile = {
          name: reportForm.evidence.name, size: reportForm.evidence.size, 
          type: reportForm.evidence.type, content: fileContent.substring(0, 1000)
        }
      }

      const evidenceHash = await generateEvidenceHash(JSON.stringify(evidenceData))
      const timestamp = new Date().toISOString()
      const message = `🛡️ SUBMIT ANONYMOUS REPORT CONFIRMATION

Title: ${reportForm.title}
Category: ${reportForm.category}
Evidence Hash: ${evidenceHash}

Wallet: ${address}
Timestamp: ${timestamp}

⚠️ By signing this message, you confirm that you want to submit this anonymous report to the blockchain. Your identity will be cryptographically protected.`

      toast.loading("🔐 Please check your wallet to sign the report submission request")

      let signature
      try {
        signature = await (window.ethereum as any).request({
          method: "personal_sign",
          params: [message, address]
        })
      } catch (error: any) {
        if (error.code === 4001) throw new Error("User rejected the signature request")
        throw new Error(`Signature failed: ${error.message || error}`)
      }

      if (!signature) throw new Error("No signature received from wallet")

      toast.success("✅ Signature confirmed - preparing report for blockchain submission...")

      // Save to Ballerina backend
      const userId = getUserId(address)
      let draftId: string

      try {
        const ballerinaResp = await axios.post("http://localhost:8080/api/reports", {
          report_title: reportForm.title, description: reportForm.description, 
          evidence_hash: evidenceHash, priority: getCategoryPriority(reportForm.category),
          wallet_address: address
        })
        const ballerinaData = ballerinaResp.data
        draftId = ballerinaData?.data?.report_id || ballerinaData?.report_id || ballerinaData?.id
        if (!draftId) throw new Error("Could not determine draftId from Ballerina response")
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message
          throw new Error(`Failed to create report draft: ${error.response?.status} ${errorMsg}`)
        }
        throw new Error(`Failed to create report draft: ${error.message || error}`)
      }

      // Prepare IPFS + contract info
      const prepRes = await fetch("http://localhost:3001/report/prepare-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reportForm.title, description: reportForm.description,
          evidenceHash: evidenceHash, draftId: draftId
        })
      })

      if (!prepRes.ok) {
        const txt = await prepRes.text()
        throw new Error(`Prepare failed: ${prepRes.status} ${txt}`)
      }

      const prepJson = await prepRes.json()
      const { titleCid, descriptionCid, evidenceHashCid, contractAddress, contractAbi } = prepJson
      if (!titleCid || !descriptionCid || !evidenceHashCid || !contractAddress || !contractAbi) {
        throw new Error("Prepare endpoint did not return all required fields")
      }

      toast.loading("🔐 Please confirm the transaction in your wallet")

      // Send blockchain transaction
      const ethers = await import("ethers")
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      const tx = await contract.createReport(titleCid, descriptionCid, evidenceHashCid)
      toast.success(`📤 Transaction sent: ${tx.hash.slice(0, 10)}...`)

      const receipt = await tx.wait()
      toast.success(`✅ Transaction confirmed in block ${receipt.blockNumber}`)

      // Try to get blockchain report ID
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
          } catch (e) {}
        }
        if (!blockchainReportId) {
          try {
            const count = await contract.reportCount()
            blockchainReportId = count.toString()
          } catch (e) {}
        }
      } catch (e) {
        console.warn("Could not parse event for report id", e)
      }

      // Confirm with backend
      try {
        await fetch(`http://localhost:8080/api/reports/${draftId}/confirm`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: tx.hash, blockNumber: receipt.blockNumber, blockchainReportId,
            titleCid, descriptionCid, evidenceHashCid
          })
        })
      } catch (err) {
        console.log("Backend confirmation failed:", err)
      }

      toast.success("🎉 Report submitted successfully! Your anonymous report has been saved to blockchain and backend")

      setReportForm({ category: "", title: "", description: "", evidence: null })

    } catch (error: any) {
      console.error("Failed to submit report:", error)
      
      if (error.message?.includes("User not authorized")) {
        toast.error("❌ Not Authorized: Your wallet address is not authorized to submit reports. Please contact an administrator.")
      } else if (error.message?.includes("You can only create one report per day")) {
        toast.error("❌ Daily Limit Reached: You can only submit one report per day. Please try again tomorrow.")
      } else if (error.message?.includes("execution reverted")) {
        const revertReason = error.reason || error.message.match(/execution reverted: "?([^"]*)"?/)?.[1] || "Unknown contract error"
        toast.error(`❌ Blockchain Error: Transaction failed: ${revertReason}`)
      } else if (error.code === 4001) {
        toast.error("🚫 Transaction Cancelled: You cancelled the report submission")
      } else {
        toast.error(`❌ Submission Failed: ${error?.message || "Failed to submit report. Please try again."}`)
      }
    } finally {
      setIsSubmittingReport(false)
    }
  }

  // Create petition function
  const createPetition = async () => {
    if (isCreatingPetition) {
      toast.error("⏳ Petition creation is already in progress")
      return
    }

    if (!walletAddress?.trim()) {
      toast.error("🔗 Please connect your wallet first using the Connect button")
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      toast.error("❌ Invalid wallet address format. Please reconnect your wallet.")
      return
    }

    if (!petitionForm.title || !petitionForm.description) {
      toast.error("📝 Please fill in all required fields")
      return
    }

    setIsCreatingPetition(true)
    setLastError(null)
    
    try {
      await validateWallet(walletAddress)

      const timestamp = new Date().toISOString()
      const message = `🗳️ CREATE PETITION CONFIRMATION

Title: ${petitionForm.title}

Description: ${petitionForm.description}

Target Signatures: ${petitionForm.targetSignatures.toLocaleString()}

Wallet: ${walletAddress}
Timestamp: ${timestamp}

⚠️ By signing this message, you confirm that you want to create this petition on the blockchain. This action cannot be undone.`

      toast.loading("🔐 Please check your wallet to sign the petition creation request")

      let signature
      try {
        signature = await (window.ethereum as any).request({
          method: "personal_sign",
          params: [message, walletAddress]
        })
      } catch (error: any) {
        if (error.code === 4001) throw new Error("User rejected the signature request")
        throw new Error(`Signature failed: ${error.message || error}`)
      }

      if (!signature) throw new Error("No signature received from wallet")

      toast.success("✅ Signature confirmed - creating petition on blockchain...")

      // Optional smart contract service call
      let contractData = null
      try {
        const smartContractResponse = await fetch("http://localhost:3001/petition/create-petition", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: petitionForm.title, description: petitionForm.description,
            requiredSignatures: petitionForm.targetSignatures, signerIndex: 0
          })
        })
        if (smartContractResponse.ok) {
          contractData = await smartContractResponse.json()
        }
      } catch (error) {
        console.warn("Smart contract service unavailable, continuing with database storage only:", error)
      }

      // Save to Ballerina backend
      const ballerinaResp = await fetch("http://localhost:8080/api/petitions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: petitionForm.title, description: petitionForm.description,
          required_signature_count: petitionForm.targetSignatures, wallet_address: walletAddress
        })
      })

      if (!ballerinaResp.ok) {
        const txt = await ballerinaResp.text()
        throw new Error(`Failed to create draft: ${ballerinaResp.status} ${txt}`)
      }

      const ballerinaData = await ballerinaResp.json()
      const draftId = ballerinaData?.data?.id || ballerinaData?.id || ballerinaData?.petition?.id
      if (!draftId) throw new Error("Could not determine draftId from Ballerina response")

      // Prepare IPFS + contract info
      const prepRes = await fetch("http://localhost:3001/petition/prepare-petition", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: petitionForm.title, description: petitionForm.description })
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

      toast.loading("🔐 Please confirm the transaction in your wallet")

      // Send blockchain transaction
      const ethers = await import("ethers")
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      const tx = await contract.createPetition(titleCid, descriptionCid, petitionForm.targetSignatures)
      toast.success(`📤 Transaction sent: ${tx.hash.slice(0, 10)}...`)

      const receipt = await tx.wait()
      toast.success(`✅ Transaction confirmed in block ${receipt.blockNumber}`)

      // Try to get blockchain petition ID
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
          } catch (e) {}
        }
        if (!blockchainPetitionId) {
          try {
            const bn = await contract.petitionCount()
            blockchainPetitionId = bn.toString()
          } catch (e) {}
        }
      } catch (e) {
        console.warn("Could not parse event for petition id", e)
      }

      // Confirm with backend
      try {
        await fetch(`http://localhost:8080/api/petitions/${draftId}/confirm`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: tx.hash, blockNumber: receipt.blockNumber, blockchainPetitionId,
            titleCid, descriptionCid
          })
        })
      } catch (err) {
        console.log(err)
      }

      toast.success("🎉 Petition created: Saved to blockchain and backend")

      setPetitionForm({ title: "", description: "", targetSignatures: 10000 })
      fetchPetitions()

    } catch (error: any) {
      console.error("Failed create flow:", error)
      setLastError(error?.message || String(error))
      toast.error(`❌ Failed to create petition: ${error?.message || "Unknown error"}`)
    } finally {
      setIsCreatingPetition(false)
    }
  }

  // Sign petition function
  const signPetition = async (petitionId: number) => {
    if (!walletAddress) {
      toast.error("🔗 Please connect your wallet to sign petitions")
      return
    }

    setSigningPetition(petitionId)
    try {
      await validateWallet(walletAddress)

      const userId = getUserId(walletAddress)
      const petition = petitions.find((p) => p.id === petitionId)
      if (!petition) throw new Error("Petition not found")

      const message = `🗳️ SIGN PETITION

Title: ${petition.title}
ID: ${petition.id}
User ID: ${userId}
Wallet: ${walletAddress}
Timestamp: ${new Date().toISOString()}

By signing this message, you confirm your signature on this petition.`

      let signature
      try {
        signature = await (window.ethereum as any).request({
          method: "personal_sign",
          params: [message, walletAddress]
        })
      } catch (error: any) {
        if (error.code === 4001) throw new Error("User rejected the signature request")
        throw new Error(`Signature failed: ${error.message || error}`)
      }

      if (!signature) throw new Error("No signature received from wallet")

      toast.success("✅ Signature confirmed - submitting to blockchain...")

      // Try blockchain signing
      let blockchainSigningSuccess = false
      try {
        const prepRes = await fetch("http://localhost:3001/petition/prepare-petition", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "dummy", description: "dummy" })
        })

        if (prepRes.ok) {
          const prepJson = await prepRes.json()
          const { contractAddress, contractAbi } = prepJson

          if (contractAddress && contractAbi) {
            toast.loading("🔐 Please confirm the transaction in your wallet")

            const ethers = await import("ethers")
            const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
            await (window.ethereum as any).request({ method: "eth_requestAccounts" })
            const signer = await provider.getSigner()
            const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

            let blockchainPetitionId = petition.blockchain_petition_id || petition.blockchainPetitionId || petition.blockchain_id
            if (!blockchainPetitionId) {
              blockchainPetitionId = petitionId
              console.warn(`No blockchain petition ID found for petition ${petitionId}, using database ID as fallback`)
              toast.error("⚠️ Warning: Blockchain petition ID not found, using fallback method")
            }

            const tx = await contract.signPetition(blockchainPetitionId)
            toast.success(`📤 Transaction sent: ${tx.hash.slice(0, 10)}...`)

            const receipt = await tx.wait()
            toast.success(`✅ Blockchain signature confirmed in block ${receipt.blockNumber}`)

            blockchainSigningSuccess = true
          }
        }
      } catch (error: any) {
        console.warn("Blockchain signing failed:", error)

        if (error.message?.includes("User not authorized")) {
          toast.error("❌ Not Authorized: Your wallet address is not authorized to sign petitions. Please contact an administrator.")
          return
        } else if (error.message?.includes("execution reverted")) {
          const revertReason = error.reason || error.message.match(/execution reverted: "?([^"]*)"?/)?.[1] || "Unknown contract error"
          toast.error(`❌ Transaction Failed: Blockchain error: ${revertReason}`)
          return
        } else if (error.code === 4001) {
          toast.error("🚫 Transaction Cancelled: You cancelled the blockchain transaction")
          return
        } else {
          toast.error("⚠️ Blockchain Error: Failed to sign on blockchain. Your signature will only be recorded in the database.")
        }
      }

      // Submit to backend
      const response = await fetch(`http://localhost:8080/api/petitions/${petitionId}/sign`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, wallet_address: walletAddress, signature: signature })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPetitions((prev) =>
            prev.map((p) =>
              p.id === petitionId ? { ...p, signature_count: (p.signature_count || 0) + 1 } : p
            )
          )

          await fetch("http://localhost:8080/api/petitionactivities", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              petition_id: petitionId, activity_type: "SIGNATURE", signature_count: 1, user_id: 1
            })
          })

          setUserSignatures((prev) => ({ ...prev, [petitionId]: true }))

          toast.success(blockchainSigningSuccess 
            ? `🎉 Petition signed! Your signature has been added to "${petition.title}" on blockchain and database`
            : `🎉 Petition signed! Your signature has been added to "${petition.title}" in database (blockchain signing failed)`
          )
        } else if (data.error === "ALREADY_SIGNED") {
          toast.error("❌ Already signed: You have already signed this petition")
          setUserSignatures((prev) => ({ ...prev, [petitionId]: true }))
        } else {
          throw new Error(data.message || "Failed to sign petition")
        }
      } else {
        throw new Error("Failed to sign petition")
      }
    } catch (error: any) {
      console.error("Error signing petition:", error)
      if (error.code === 4001) {
        toast.error("🚫 Signature cancelled: You cancelled the signature request")
      } else {
        toast.error(`❌ Error signing petition: ${error.message || "An unexpected error occurred"}`)
      }
    } finally {
      setSigningPetition(null)
    }
  }

  // Fetch functions
  const fetchPetitions = async () => {
    setIsLoadingPetitions(true)
    try {
      const response = await fetch("http://localhost:8080/api/petitions")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setPetitions(data.data)
          if (walletAddress) await checkUserSignatures(data.data)
        }
      } else {
        console.error("Failed to fetch petitions:", response.statusText)
        toast.error("❌ Failed to load petitions")
      }
    } catch (error) {
      console.error("Error fetching petitions:", error)
      toast.error("❌ Failed to load petitions")
    } finally {
      setIsLoadingPetitions(false)
    }
  }

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const response = await fetch("http://localhost:8080/api/categories")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setCategories(data.data)
        }
      } else {
        toast.error("❌ Failed to load categories")
      }
    } catch (error) {
      toast.error("❌ Failed to load categories")
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const checkUserSignatures = async (petitionList: any[]) => {
    if (!walletAddress) return
    const userId = getUserId(walletAddress)
    const signatures: { [key: number]: boolean } = {}

    for (const petition of petitionList) {
      try {
        const response = await fetch(`http://localhost:8080/api/petitions/${petition.id}/signed/${userId}`)
        if (response.ok) {
          const data = await response.json()
          signatures[petition.id] = data.hasSigned || false
        }
      } catch (error) {
        signatures[petition.id] = false
      }
    }
    setUserSignatures(signatures)
  }

  // Effects
  useEffect(() => {
    fetchPetitions()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (walletAddress && petitions.length > 0) {
      checkUserSignatures(petitions)
    }
  }, [walletAddress, petitions.length])


  const reports = [
    {
      id: "LK-2024-001",
      title: "Irregular Tender Process - Highway Project",
      category: "Procurement Irregularities",
      status: "Under Investigation",
      priority: "High",
      submittedDate: "2024-01-15",
      lastUpdate: "2 days ago",
      anonymityLevel: "Full",
      evidenceHash: "0x7a8b9c0d1e2f3g4h",
      investigator: "Commission to Investigate Allegations of Bribery or Corruption",
    },
    {
      id: "LK-2024-002",
      title: "Environmental Violation - Industrial Zone",
      category: "Environmental Breach",
      status: "Resolved",
      priority: "Medium",
      submittedDate: "2024-01-10",
      lastUpdate: "1 week ago",
      anonymityLevel: "Partial",
      evidenceHash: "0x5i6j7k8l9m0n1o2p",
      investigator: "Central Environmental Authority",
    },
  ]

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600"
      case "Medium":
        return "text-yellow-600"
      case "Low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Citizen Reporting & Petition System</h2>
        <p className="text-slate-600">
          Anonymous reporting and public petitions for Sri Lankan governance
        </p>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">Whistleblowing Reports</TabsTrigger>
          <TabsTrigger value="petitions">Smart Contract Petitions</TabsTrigger>
          <TabsTrigger value="submit">Submit Report/Petition</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Report Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-slate-500">Under investigation</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">234</div>
                <p className="text-xs text-slate-500">This year</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anonymity Rate</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.7%</div>
                <p className="text-xs text-slate-500">Full protection</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
                <Clock className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12 days</div>
                <p className="text-xs text-slate-500">Processing time</p>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <Badge variant="outline">{report.category}</Badge>
                        <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>ID: {report.id}</span>
                        <span>•</span>
                        <span>Submitted: {report.submittedDate}</span>
                        <span>•</span>
                        <span>Updated: {report.lastUpdate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getPriorityColor(report.priority)}`}>
                        {report.priority} Priority
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-slate-600">Anonymity Level</p>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{report.anonymityLevel}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Evidence Hash</p>
                      <p className="font-mono text-sm">{report.evidenceHash}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Assigned To</p>
                      <p className="font-medium">{report.investigator}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Hash className="h-3 w-3" />
                      <span>Blockchain verified</span>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  {petitions.filter((p) => p.status === "ACTIVE").length}
                </div>
                <p className="text-xs text-slate-500">Collecting signatures</p>
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
                    .reduce((total, p) => total + (p.signature_count || 0), 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-slate-500">All time</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {petitions.length > 0
                    ? Math.round(
                        (petitions.filter(
                          (p) => (p.signature_count || 0) >= p.required_signature_count
                        ).length /
                          petitions.length) *
                          100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-slate-500">Threshold reached</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Petitions</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{petitions.length}</div>
                <p className="text-xs text-slate-500">All petitions</p>
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
            ) : petitions.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-8 text-center text-slate-500">
                  No petitions found. Create the first petition to get started!
                </CardContent>
              </Card>
            ) : (
              petitions.map((petition) => {
                const progress =
                  petition.required_signature_count > 0
                    ? ((petition.signature_count || 0) / petition.required_signature_count) * 100
                    : 0
                const isThresholdMet =
                  (petition.signature_count || 0) >= petition.required_signature_count
                const status = isThresholdMet ? "Threshold Met" : petition.status || "Active"

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
                          {petition.status === "ACTIVE" && !isThresholdMet && (
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
                  End-to-end encrypted submission with cryptographic anonymity
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Evidence (Optional)</label>
                  <div
                    className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-slate-400"
                    onClick={() => document.getElementById("evidence-upload")?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add("border-blue-400", "bg-blue-50")
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove("border-blue-400", "bg-blue-50")
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove("border-blue-400", "bg-blue-50")
                      const files = e.dataTransfer.files
                      if (files.length > 0) {
                        const file = files[0]
                        // Check file size (max 10MB)
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("File too large: Please select a file smaller than 10MB")
                          return
                        }
                        setReportForm({ ...reportForm, evidence: file })
                      }
                    }}
                  >
                    <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                    {reportForm.evidence ? (
                      <div>
                        <p className="text-sm text-slate-600">
                          Selected: {reportForm.evidence.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Size: {(reportForm.evidence.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setReportForm({ ...reportForm, evidence: null })
                          }}
                          className="mt-2 text-xs text-red-600 hover:text-red-800"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-600">Drop files here or click to upload</p>
                        <p className="text-xs text-slate-500">
                          Files will be encrypted and hashed for verification
                        </p>
                      </div>
                    )}
                    <input
                      id="evidence-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      title="Upload evidence file"
                      aria-label="Upload evidence file"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Check file size (max 10MB)
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error("File too large: Please select a file smaller than 10MB")
                            return
                          }
                          setReportForm({ ...reportForm, evidence: file })
                        }
                      }}
                    />
                  </div>
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
                  Automated execution when signature threshold is met
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

                <div className="rounded-lg bg-green-50 p-3">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Smart Contract Execution</span>
                  </div>
                  <p className="mt-1 text-xs text-green-700">
                    When the signature threshold is reached, the petition will automatically trigger
                    an official response within 30 days.
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
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
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

                {/* Debug: Show wallet address status */}
                <div className="mb-3 rounded bg-gray-50 p-2 text-xs">
                  <strong>Debug Info:</strong>
                  <br />
                  Wallet Address:{" "}
                  {walletAddress
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : "Not connected"}
                  <br />
                  Valid Format:{" "}
                  {walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress) ? "Yes" : "No"}
                </div>

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
                    "🗳️ Create Petition"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Report Resolution Trends</CardTitle>
                <CardDescription>Monthly report submissions and resolutions</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    reports: { label: "Reports", color: "#ef4444" },
                    resolved: { label: "Resolved", color: "#22c55e" },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportStats}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="reports" fill="#ef4444" />
                      <Bar dataKey="resolved" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Petition Signature Activity</CardTitle>
                <CardDescription>Daily signature collection patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    signatures: { label: "Signatures", color: "#3b82f6" },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={petitionActivity}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="signatures" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

