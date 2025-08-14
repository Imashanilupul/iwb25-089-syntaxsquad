"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"

// Web3 types
declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

type Ethereumish = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMetaMask?: boolean;
};

// Usage: cast window.ethereum as Ethereumish when you need the specific methods

interface WhistleblowingSystemProps {
  walletAddress?: string | null;
}

export function WhistleblowingSystem({ walletAddress }: WhistleblowingSystemProps) {
  const { toast } = useToast()
  const { address, verified } = useAuth() // Get auth state
  
  const [reportForm, setReportForm] = useState({
    category: "",
    title: "",
    description: "",
    evidence: null as File | null,
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
  const [userSignatures, setUserSignatures] = useState<{[key: number]: boolean}>({})

  // Get user ID from wallet address (consistent with petition signing)
  const getUserId = (walletAddress: string): number => {
    // Simple hash of wallet address to create consistent user ID
    let hash = 0;
    for (let i = 0; i < walletAddress.length; i++) {
      const char = walletAddress.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash % 10000) + 1; // Ensure positive ID between 1-10000
  }

  // Submit anonymous report function
  const submitReport = async () => {
    // Check wallet connection and verification
    if (!address || !verified) {
      toast({
        title: "Wallet Required",
        description: "Please connect and verify your wallet to submit reports",
        variant: "destructive",
      })
      return
    }

    // Validate form
    if (!reportForm.category || !reportForm.title || !reportForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingReport(true)
    try {
      // Create evidence hash (for anonymity)
      const reportData = {
        category: reportForm.category,
        title: reportForm.title,
        description: reportForm.description,
        timestamp: new Date().toISOString(),
        userAddress: address // For hashing only, not stored directly
      }
      
      // Generate evidence hash from report data
      const evidenceHash = await generateEvidenceHash(JSON.stringify(reportData))
      
      // Get user ID from wallet address
      const userId = getUserId(address)
      
      // Prepare report payload for backend
      const reportPayload = {
        report_title: reportForm.title,
        description: reportForm.description,
        evidence_hash: evidenceHash,
        priority: getCategoryPriority(reportForm.category),
        // Only include user_id if we want to track (for now, we'll make it optional for true anonymity)
        // user_id: userId
      }

      // Submit to backend
      const response = await fetch("http://localhost:8080/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportPayload),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: "✅ Report Submitted",
            description: `Your anonymous report has been submitted successfully. Report ID: ${data.data?.report_id || 'Generated'}`,
          })
          
          // Reset form
          setReportForm({
            category: "",
            title: "",
            description: "",
            evidence: null,
          })
        } else {
          throw new Error(data.message || "Failed to submit report")
        }
      } else {
        throw new Error("Failed to submit report to server")
      }
    } catch (error: any) {
      console.error("Error submitting report:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReport(false)
    }
  }

  // Generate evidence hash for anonymity
  const generateEvidenceHash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return `0x${hashHex.substring(0, 16)}` // Truncate for display
  }

  // Map category to priority
  const getCategoryPriority = (category: string): string => {
    switch (category) {
      case "financial": return "HIGH"
      case "safety": return "CRITICAL" 
      case "regulatory": return "HIGH"
      case "ethical": return "MEDIUM"
      default: return "MEDIUM"
    }
  }

  // Web3 state
  const [isCreatingPetition, setIsCreatingPetition] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Fetch petitions from API
  const fetchPetitions = async () => {
    setIsLoadingPetitions(true)
    try {
      const response = await fetch("http://localhost:8080/api/petitions")
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

  // Check which petitions the user has already signed
  const checkUserSignatures = async (petitionList: any[]) => {
    if (!walletAddress) return
    
    const userId = getUserId(walletAddress)
    const signatures: {[key: number]: boolean} = {}
    
    for (const petition of petitionList) {
      try {
        const response = await fetch(`http://localhost:8080/api/petitions/${petition.id}/signed/${userId}`)
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

    // Check if user has already signed
    if (userSignatures[petitionId]) {
      toast({
        title: "Already signed",
        description: "You have already signed this petition",
        variant: "destructive",
      })
      return
    }

    setSigningPetition(petitionId)
    try {
      const userId = getUserId(walletAddress)
      
      // Create signature for petition signing
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed")
      }

      const petition = petitions.find(p => p.id === petitionId)
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

      const signature = await (window.ethereum as any).request({
        method: "personal_sign",
        params: [message, walletAddress],
      })

      // Submit signature to backend with user ID
      const response = await fetch(`http://localhost:8080/api/petitions/${petitionId}/sign`, {
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
          setPetitions(prev => prev.map(p => 
            p.id === petitionId 
              ? { ...p, signature_count: data.newSignatureCount || (p.signature_count || 0) + 1 }
              : p
          ))
          
          // Mark this petition as signed by the user
          setUserSignatures(prev => ({
            ...prev,
            [petitionId]: true
          }))

          toast({
            title: "✅ Petition signed!",
            description: `Your signature has been added to "${petition.title}"`,
          })
        } else if (data.error === "ALREADY_SIGNED") {
          toast({
            title: "Already signed",
            description: "You have already signed this petition",
            variant: "destructive",
          })
          // Update local state to reflect this
          setUserSignatures(prev => ({
            ...prev,
            [petitionId]: true
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

  // Load petitions when component mounts
  React.useEffect(() => {
    fetchPetitions()
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
        accounts = await (window.ethereum as any).request({ method: 'eth_accounts' })
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
          accounts = await (window.ethereum as any).request({ method: 'eth_requestAccounts' })
        } catch (requestError: any) {
          if (requestError.code === -32002) {
            throw new Error("MetaMask is already processing a connection request. Please check your MetaMask extension and try again.")
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
        throw new Error(`Account mismatch. Please switch to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} in MetaMask`)
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

      // Step 2: Try to create petition on smart contract backend (optional)
      let contractData = null
      try {
        const smartContractResponse = await fetch("http://localhost:3001/petition/create-petition", {
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
        })

        if (smartContractResponse.ok) {
          contractData = await smartContractResponse.json()
          console.log("✅ Smart contract petition created:", contractData)
        } else {
          console.warn("⚠️ Smart contract service responded with error:", smartContractResponse.status)
        }
      } catch (blockchainError) {
        console.warn("⚠️ Smart contract service unavailable, continuing with database storage only:", blockchainError)
      }
      
      // Step 3: Save petition to Ballerina backend (this always happens)
      const ballerinaResponse = await fetch("http://localhost:8080/api/petitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: petitionForm.title,
          description: petitionForm.description,
          requiredSignatures: petitionForm.targetSignatures,
          walletAddress,
          draftId,
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

      toast({ title: "Ready to sign", description: "Please confirm the transaction in your wallet" })

      // 3) Send transaction from user's wallet using ethers and Sepolia network
      const ethers = await import("ethers")
      // Use BrowserProvider for ESM v6 in browser
      const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
      // Request accounts (ensure connected)
      await (window.ethereum as any).request({ method: 'eth_requestAccounts' })
      const signer = await provider.getSigner()
      const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

      // Send transaction
      const tx = await contract.createPetition(titleCid, descriptionCid, petitionForm.targetSignatures)
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
      await fetch(`http://localhost:8080/api/petitions/${draftId}/confirm`, {
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

      toast({ title: "Petition created", description: "Saved to blockchain and backend" })

      // Reset form
      setPetitionForm({
        title: "",
        description: "",
        targetSignatures: 10000,
      })

      // Refresh petitions list
      fetchPetitions()

      console.log("Smart contract data:", contractData)
      console.log("Database data:", ballerinaData)

    } catch (error: any) {
      console.error("Failed create flow:", error)
      setLastError(error?.message || String(error))
      toast({ title: "Failed to create petition", description: error?.message || "Unknown error", variant: "destructive" })
    } finally {
      setIsCreatingPetition(false)
    }
  }

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
        <p className="text-slate-600">Anonymous reporting and public petitions for Sri Lankan governance</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <div className="flex justify-between items-center pt-2 border-t">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Petitions</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {petitions.filter(p => p.status === 'ACTIVE').length}
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
                  {petitions.reduce((total, p) => total + (p.signature_count || 0), 0).toLocaleString()}
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
                    ? Math.round((petitions.filter(p => (p.signature_count || 0) >= p.required_signature_count).length / petitions.length) * 100)
                    : 0}%
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
                <div className="animate-spin mr-2">⏳</div>
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
                const progress = petition.required_signature_count > 0 
                  ? ((petition.signature_count || 0) / petition.required_signature_count) * 100 
                  : 0
                const isThresholdMet = (petition.signature_count || 0) >= petition.required_signature_count
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
                            <span>Created: {new Date(petition.created_at).toLocaleDateString()}</span>
                            {petition.deadline && (
                              <>
                                <span>•</span>
                                <span>Deadline: {new Date(petition.deadline).toLocaleDateString()}</span>
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

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Hash className="h-3 w-3" />
                          <span>ID: {petition.id}</span>
                          {petition.blockchain_petition_id && (
                            <>
                              <span>•</span>
                              <span className="font-mono">Blockchain: {petition.blockchain_petition_id}</span>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {petition.status === "ACTIVE" && !isThresholdMet && (
                            <>
                              {userSignatures[petition.id] ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled
                                >
                                  ✅ Already Signed
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={() => signPetition(petition.id)}
                                  disabled={!walletAddress || signingPetition === petition.id}
                                >
                                  {signingPetition === petition.id ? (
                                    <>
                                      <span className="animate-spin mr-2">⏳</span>
                                      Signing...
                                    </>
                                  ) : (
                                    "Sign Petition"
                                  )}
                                </Button>
                              )}
                            </>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submit Report */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Submit Anonymous Report
                </CardTitle>
                <CardDescription>End-to-end encrypted submission with cryptographic anonymity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={reportForm.category}
                    onValueChange={(value) => setReportForm({ ...reportForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial Misconduct</SelectItem>
                      <SelectItem value="regulatory">Regulatory Breach</SelectItem>
                      <SelectItem value="ethical">Ethical Violation</SelectItem>
                      <SelectItem value="safety">Safety Concern</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">Drop files here or click to upload</p>
                    <p className="text-xs text-slate-500">Files will be encrypted and hashed for verification</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">Privacy Guarantee</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Your identity is protected through zero-knowledge proofs. No personal information is stored or
                    transmitted.
                  </p>
                </div>

                {/* Wallet Status Display */}
                {address && verified ? (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Wallet Connected & Verified</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {address.slice(0, 6)}...{address.slice(-4)} - Ready to submit anonymous reports
                    </p>
                  </div>
                ) : address && !verified ? (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Wallet Verification Required</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your wallet is connected but needs verification to submit reports.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Wallet Required</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please connect your wallet to submit anonymous reports securely.
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={submitReport}
                  disabled={!address || !verified || isSubmittingReport || !reportForm.title.trim() || !reportForm.description.trim() || !reportForm.category}
                >
                  {isSubmittingReport ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting Report...
                    </>
                  ) : !address ? (
                    "🔐 Connect Wallet to Submit"
                  ) : !verified ? (
                    "🔑 Verify Wallet to Submit"  
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
                <CardDescription>Automated execution when signature threshold is met</CardDescription>
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
                    onChange={(e) => setPetitionForm({ ...petitionForm, description: e.target.value })}
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
                      const numValue = value === '' ? 0 : Number.parseInt(value)
                      if (!isNaN(numValue) && numValue >= 0) {
                        setPetitionForm({ ...petitionForm, targetSignatures: numValue })
                      }
                    }}
                  />
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Smart Contract Execution</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    When the signature threshold is reached, the petition will automatically trigger an official
                    response within 30 days.
                  </p>
                </div>

                {/* Wallet Status Display */}
                {walletAddress ? (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Wallet Connected</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Wallet Required</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please connect your wallet using the button in the top right corner to create petitions.
                    </p>
                  </div>
                )}

                {/* Debug: Show wallet address status */}
                <div className="bg-gray-50 p-2 rounded text-xs mb-3">
                  <strong>Debug Info:</strong><br/>
                  Wallet Address: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}<br/>
                  Valid Format: {walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress) ? 'Yes' : 'No'}
                </div>

                <Button 
                  className="w-full" 
                  onClick={createPetition}
                  disabled={!walletAddress || isCreatingPetition || !petitionForm.title.trim() || !petitionForm.description.trim()}
                >
                  {isCreatingPetition ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
