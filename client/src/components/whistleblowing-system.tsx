"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
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
    ethereum?: any;
  }
}

interface WhistleblowingSystemProps {
  walletAddress?: string | null;
}

export function WhistleblowingSystem({ walletAddress }: WhistleblowingSystemProps) {
  const { toast } = useToast()
  
  const [reportForm, setReportForm] = useState({
    category: "",
    title: "",
    description: "",
    evidence: null as File | null,
  })

  const [petitionForm, setPetitionForm] = useState({
    title: "",
    description: "",
    targetSignatures: 10000,
  })

  // Web3 state
  const [isCreatingPetition, setIsCreatingPetition] = useState(false)

  // Create petition function
  const createPetition = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
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
    try {
      // Step 1: Request wallet signature confirmation
      if (!window.ethereum) {
        throw new Error("MetaMask not found")
      }

      // Create a message to sign
      const message = `Create Petition: ${petitionForm.title}\n\nDescription: ${petitionForm.description}\n\nTarget Signatures: ${petitionForm.targetSignatures}\n\nBy signing this message, you confirm that you want to create this petition on the blockchain.`
      
      // Request signature from user
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, walletAddress],
      })

      toast({
        title: "Signature confirmed",
        description: "Creating petition on blockchain...",
      })

      // Step 2: Create petition on smart contract backend
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

      if (!smartContractResponse.ok) {
        throw new Error("Failed to create petition on blockchain")
      }

      const contractData = await smartContractResponse.json()
      
      // Step 3: Save petition to Ballerina backend
      const ballerinaResponse = await fetch("http://localhost:8080/petitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: petitionForm.title,
          description: petitionForm.description,
          required_signature_count: petitionForm.targetSignatures,
          creator_id: 1, // You might want to get this from user context
          blockchain_petition_id: contractData.petitionId,
          title_cid: contractData.titleCid,
          description_cid: contractData.descriptionCid,
          wallet_address: walletAddress,
          signature: signature,
        }),
      })

      if (!ballerinaResponse.ok) {
        throw new Error("Failed to save petition to database")
      }

      const ballerinaData = await ballerinaResponse.json()

      toast({
        title: "Petition created successfully!",
        description: `Petition ID: ${contractData.petitionId}`,
      })

      // Reset form
      setPetitionForm({
        title: "",
        description: "",
        targetSignatures: 10000,
      })

      console.log("Smart contract data:", contractData)
      console.log("Database data:", ballerinaData)

    } catch (error) {
      console.error("Failed to create petition:", error)
      
      if (error.code === 4001) {
        toast({
          title: "Signature cancelled",
          description: "You cancelled the signature request",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed to create petition",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        })
      }
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

  const petitions = [
    {
      id: "PET-LK-2024-001",
      title: "Preserve Sinharaja Forest Reserve",
      description: "Petition to strengthen protection measures for UNESCO World Heritage Site",
      currentSignatures: 84560,
      targetSignatures: 100000,
      progress: 84.56,
      status: "Active",
      category: "Environment",
      createdDate: "2024-01-20",
      deadline: "2024-02-20",
      blockchainHash: "0x3q4r5s6t7u8v9w0x",
      autoExecute: true,
    },
    {
      id: "PET-LK-2024-002",
      title: "Right to Information Act Enhancement",
      description: "Strengthen RTI implementation and reduce response times for public information requests",
      currentSignatures: 152340,
      targetSignatures: 120000,
      progress: 126.95,
      status: "Threshold Met",
      category: "Governance",
      createdDate: "2024-01-05",
      deadline: "2024-02-05",
      blockchainHash: "0x1y2z3a4b5c6d7e8f",
      autoExecute: true,
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
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-slate-500">Collecting signatures</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Signatures</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156K</div>
                <p className="text-xs text-slate-500">All time</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73%</div>
                <p className="text-xs text-slate-500">Threshold reached</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auto-Executed</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-slate-500">Smart contracts</p>
              </CardContent>
            </Card>
          </div>

          {/* Petitions List */}
          <div className="space-y-4">
            {petitions.map((petition) => (
              <Card key={petition.id} className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{petition.title}</CardTitle>
                        <Badge variant="outline">{petition.category}</Badge>
                        <Badge className={getStatusColor(petition.status)}>{petition.status}</Badge>
                      </div>
                      <CardDescription>{petition.description}</CardDescription>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>Created: {petition.createdDate}</span>
                        <span>•</span>
                        <span>Deadline: {petition.deadline}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Signatures: {petition.currentSignatures.toLocaleString()} /{" "}
                        {petition.targetSignatures.toLocaleString()}
                      </span>
                      <span>{petition.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(petition.progress, 100)} />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Hash className="h-3 w-3" />
                      <span className="font-mono">{petition.blockchainHash}</span>
                      {petition.autoExecute && (
                        <Badge variant="outline" className="text-xs">
                          Auto-Execute
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {petition.status === "Active" && <Button size="sm">Sign Petition</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

                <Button className="w-full">Submit Anonymous Report</Button>
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
                  <Select
                    value={petitionForm.targetSignatures.toString()}
                    onValueChange={(value) =>
                      setPetitionForm({ ...petitionForm, targetSignatures: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5000">5,000 signatures</SelectItem>
                      <SelectItem value="10000">10,000 signatures</SelectItem>
                      <SelectItem value="25000">25,000 signatures</SelectItem>
                      <SelectItem value="50000">50,000 signatures</SelectItem>
                    </SelectContent>
                  </Select>
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

                <Button 
                  className="w-full" 
                  onClick={createPetition}
                  disabled={!walletAddress || isCreatingPetition}
                >
                  {isCreatingPetition ? "Creating Petition..." : "Create Petition"}
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
