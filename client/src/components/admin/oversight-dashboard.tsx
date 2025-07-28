"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, FileText, Eye, CheckCircle, TrendingUp, Building } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"

export function OversightDashboard() {
  const [selectedCommittee, setSelectedCommittee] = useState("copa")

  const oversightBodies = [
    { id: "copa", name: "Committee on Public Accounts (COPA)", chair: "Hon. Dr. Harsha de Silva" },
    { id: "cope", name: "Committee on Public Enterprises (COPE)", chair: "Hon. Prof. Charitha Herath" },
    {
      id: "ciaboc",
      name: "Commission to Investigate Allegations of Bribery or Corruption",
      chair: "Justice Yasantha Kodagoda",
    },
    { id: "auditor_general", name: "Auditor General's Department", head: "Mr. W.P.C. Wickramaratne" },
  ]

  const auditFindings = [
    {
      id: 1,
      ministry: "Ministry of Health",
      finding: "Irregular procurement of medical equipment",
      amount: 2500000000,
      severity: "High",
      status: "Under Investigation",
      dateReported: "2024-01-15",
      followUpDue: "2024-02-15",
    },
    {
      id: 2,
      ministry: "Ministry of Education",
      finding: "Unauthorized budget transfers",
      amount: 890000000,
      severity: "Medium",
      status: "Response Received",
      dateReported: "2024-01-10",
      followUpDue: "2024-02-10",
    },
    {
      id: 3,
      ministry: "Ministry of Transport",
      finding: "Cost overruns in highway project",
      amount: 5600000000,
      severity: "High",
      status: "Resolved",
      dateReported: "2023-12-20",
      followUpDue: "2024-01-20",
    },
  ]

  const corruptionCases = [
    {
      id: 1,
      case: "Irregular tender award - Port Development",
      suspects: 3,
      amount: 12000000000,
      status: "Under Investigation",
      progress: 65,
      investigatingOfficer: "Senior DIG Deshabandu Tennakoon",
      dateOpened: "2023-11-15",
    },
    {
      id: 2,
      case: "Bribery in license issuance",
      suspects: 2,
      amount: 45000000,
      status: "Charges Filed",
      progress: 85,
      investigatingOfficer: "DIG Ajith Rohana",
      dateOpened: "2023-10-08",
    },
    {
      id: 3,
      case: "Misappropriation of development funds",
      suspects: 5,
      amount: 780000000,
      status: "Court Proceedings",
      progress: 90,
      investigatingOfficer: "SP Nimal Lewke",
      dateOpened: "2023-09-22",
    },
  ]

  const publicEnterpriseReviews = [
    {
      id: 1,
      enterprise: "Sri Lankan Airlines",
      reviewType: "Financial Performance",
      findings: "Significant losses due to operational inefficiencies",
      recommendation: "Restructuring and cost optimization required",
      status: "Implementation Pending",
      reviewDate: "2024-01-20",
    },
    {
      id: 2,
      enterprise: "Ceylon Electricity Board",
      reviewType: "Procurement Audit",
      findings: "Irregular procurement procedures identified",
      recommendation: "Strengthen procurement guidelines and oversight",
      status: "Under Review",
      reviewDate: "2024-01-18",
    },
    {
      id: 3,
      enterprise: "National Water Supply & Drainage Board",
      reviewType: "Project Implementation",
      findings: "Delays in rural water supply projects",
      recommendation: "Improve project management and monitoring",
      status: "Recommendations Accepted",
      reviewDate: "2024-01-12",
    },
  ]

  const oversightMetrics = [
    { month: "Jan", audits: 23, investigations: 12, resolved: 8 },
    { month: "Feb", audits: 28, investigations: 15, resolved: 11 },
    { month: "Mar", audits: 31, investigations: 18, resolved: 14 },
    { month: "Apr", audits: 26, investigations: 14, resolved: 12 },
    { month: "May", audits: 34, investigations: 21, resolved: 16 },
    { month: "Jun", audits: 29, investigations: 17, resolved: 13 },
  ]

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Rs. ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `Rs. ${(amount / 1000000).toFixed(1)}M`
    }
    return `Rs. ${amount.toLocaleString()}`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800"
      case "Under Investigation":
        return "bg-blue-100 text-blue-800"
      case "Response Received":
        return "bg-yellow-100 text-yellow-800"
      case "Charges Filed":
        return "bg-purple-100 text-purple-800"
      case "Court Proceedings":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Oversight & Accountability Dashboard</h2>
          <p className="text-slate-600">Parliamentary committees and anti-corruption oversight</p>
        </div>
        <Select value={selectedCommittee} onValueChange={setSelectedCommittee}>
          <SelectTrigger className="w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {oversightBodies.map((body) => (
              <SelectItem key={body.id} value={body.id}>
                {body.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Audits</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-slate-500">Ongoing investigations</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corruption Cases</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-slate-500">Under investigation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 8.9B</div>
            <p className="text-xs text-slate-500">This fiscal year</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73.2%</div>
            <p className="text-xs text-slate-500">Cases resolved</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audits">Audit Findings</TabsTrigger>
          <TabsTrigger value="corruption">Corruption Cases</TabsTrigger>
          <TabsTrigger value="enterprises">Public Enterprises</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="audits" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Recent Audit Findings
              </CardTitle>
              <CardDescription>Significant findings from government audits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditFindings.map((finding) => (
                  <div key={finding.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900">{finding.ministry}</h4>
                        <p className="text-sm text-slate-600">{finding.finding}</p>
                        <p className="text-lg font-semibold text-red-700">{formatCurrency(finding.amount)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
                        <Badge className={getStatusColor(finding.status)}>{finding.status}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Date Reported:</span> {finding.dateReported}
                      </div>
                      <div>
                        <span className="font-medium">Follow-up Due:</span> {finding.followUpDue}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                      <Button size="sm">Track Progress</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corruption" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Corruption Investigations
              </CardTitle>
              <CardDescription>Cases under investigation by CIABOC</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {corruptionCases.map((case_) => (
                  <div key={case_.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900">{case_.case}</h4>
                        <p className="text-sm text-slate-600">Investigating Officer: {case_.investigatingOfficer}</p>
                        <p className="text-sm text-slate-600">
                          Suspects: {case_.suspects} | Amount: {formatCurrency(case_.amount)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(case_.status)}>{case_.status}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Investigation Progress</span>
                        <span>{case_.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${case_.progress}%` }}></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">Case opened: {case_.dateOpened}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Case Details
                        </Button>
                        <Button size="sm">Update Status</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enterprises" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Public Enterprise Reviews
              </CardTitle>
              <CardDescription>COPE reviews of state-owned enterprises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {publicEnterpriseReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900">{review.enterprise}</h4>
                        <p className="text-sm text-slate-600">Review Type: {review.reviewType}</p>
                        <p className="text-sm text-slate-600">Findings: {review.findings}</p>
                        <p className="text-sm text-slate-600">Recommendation: {review.recommendation}</p>
                      </div>
                      <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">Review Date: {review.reviewDate}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Full Report
                        </Button>
                        <Button size="sm">Follow Up</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Oversight Performance Metrics</CardTitle>
              <CardDescription>Monthly oversight activity and resolution trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  audits: { label: "Audits Conducted", color: "#3b82f6" },
                  investigations: { label: "Investigations Opened", color: "#ef4444" },
                  resolved: { label: "Cases Resolved", color: "#22c55e" },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={oversightMetrics}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="audits" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="investigations" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
