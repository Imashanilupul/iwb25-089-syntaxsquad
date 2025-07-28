"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, DollarSign, Users, Building, TrendingUp, FileText } from "lucide-react"

export function ProvincialDashboard() {
  const [selectedProvince, setSelectedProvince] = useState("western")

  const provinces = [
    { id: "western", name: "Western Province", capital: "Colombo", chiefMinister: "Hon. Isura Devapriya" },
    { id: "central", name: "Central Province", capital: "Kandy", chiefMinister: "Hon. Sarath Ekanayake" },
    { id: "southern", name: "Southern Province", capital: "Galle", chiefMinister: "Hon. Shan Wijayalal" },
    { id: "northern", name: "Northern Province", capital: "Jaffna", chiefMinister: "Hon. C.V. Wigneswaran" },
    { id: "eastern", name: "Eastern Province", capital: "Trincomalee", chiefMinister: "Hon. Nazeer Ahamed" },
    {
      id: "north_western",
      name: "North Western Province",
      capital: "Kurunegala",
      chiefMinister: "Hon. Dayasiri Jayasekara",
    },
    {
      id: "north_central",
      name: "North Central Province",
      capital: "Anuradhapura",
      chiefMinister: "Hon. Peshala Jayaratne",
    },
    { id: "uva", name: "Uva Province", capital: "Badulla", chiefMinister: "Hon. Harin Fernando" },
    { id: "sabaragamuwa", name: "Sabaragamuwa Province", capital: "Ratnapura", chiefMinister: "Hon. Namal Rajapaksa" },
  ]

  const provincialData = {
    western: {
      totalBudget: 285000000000,
      spent: 198000000000,
      population: 6200000,
      districts: 3,
      localAuthorities: 42,
      utilization: 69.5,
      gdpContribution: 45.2,
    },
    central: {
      totalBudget: 156000000000,
      spent: 124000000000,
      population: 2600000,
      districts: 3,
      localAuthorities: 35,
      utilization: 79.5,
      gdpContribution: 12.8,
    },
  }

  const currentProvince = provincialData[selectedProvince as keyof typeof provincialData] || provincialData.western

  const districtBreakdown = [
    { district: "Colombo", budget: 145000000000, spent: 98000000000, population: 2400000, utilization: 67.6 },
    { district: "Gampaha", budget: 89000000000, spent: 67000000000, population: 2400000, utilization: 75.3 },
    { district: "Kalutara", budget: 51000000000, spent: 33000000000, population: 1300000, utilization: 64.7 },
  ]

  const provincialProjects = [
    {
      id: 1,
      name: "Provincial Road Development Program",
      budget: 45000000000,
      spent: 32000000000,
      progress: 71,
      status: "On Track",
      beneficiaries: 850000,
      completion: "Mar 2025",
    },
    {
      id: 2,
      name: "Rural Water Supply Enhancement",
      budget: 28000000000,
      spent: 19000000000,
      progress: 68,
      status: "On Track",
      beneficiaries: 450000,
      completion: "Dec 2024",
    },
    {
      id: 3,
      name: "Provincial Hospital Modernization",
      budget: 67000000000,
      spent: 41000000000,
      progress: 61,
      status: "Delayed",
      beneficiaries: 1200000,
      completion: "Jun 2025",
    },
  ]

  const devolutionAreas = [
    { area: "Provincial Education", budget: 89000000000, spent: 67000000000, utilization: 75.3, performance: "Good" },
    {
      area: "Provincial Health",
      budget: 76000000000,
      spent: 54000000000,
      utilization: 71.1,
      performance: "Satisfactory",
    },
    {
      area: "Agriculture & Lands",
      budget: 45000000000,
      spent: 38000000000,
      utilization: 84.4,
      performance: "Excellent",
    },
    {
      area: "Local Government",
      budget: 34000000000,
      spent: 23000000000,
      utilization: 67.6,
      performance: "Needs Improvement",
    },
    { area: "Social Services", budget: 41000000000, spent: 16000000000, utilization: 39.0, performance: "Poor" },
  ]

  const interGovernmentalTransfers = [
    { type: "Block Grant", amount: 125000000000, received: 125000000000, percentage: 100 },
    { type: "Matching Grant", amount: 67000000000, received: 45000000000, percentage: 67.2 },
    { type: "Special Purpose Grant", amount: 43000000000, received: 28000000000, percentage: 65.1 },
    { type: "Provincial Revenue", amount: 50000000000, collected: 42000000000, percentage: 84.0 },
  ]

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Rs. ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `Rs. ${(amount / 1000000).toFixed(1)}M`
    }
    return `Rs. ${amount.toLocaleString()}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-800"
      case "Delayed":
        return "bg-red-100 text-red-800"
      case "At Risk":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "Excellent":
        return "text-green-600"
      case "Good":
        return "text-blue-600"
      case "Satisfactory":
        return "text-yellow-600"
      case "Needs Improvement":
        return "text-orange-600"
      case "Poor":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Provincial Council Dashboard</h2>
          <p className="text-slate-600">Provincial administration and devolved subject management</p>
        </div>
        <Select value={selectedProvince} onValueChange={setSelectedProvince}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provincial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provincial Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentProvince.totalBudget)}</div>
            <p className="text-xs text-slate-500">FY 2024 Allocation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Population</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(currentProvince.population / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-slate-500">{currentProvince.districts} districts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentProvince.utilization}%</div>
            <p className="text-xs text-slate-500">{formatCurrency(currentProvince.spent)} spent</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GDP Contribution</CardTitle>
            <Building className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentProvince.gdpContribution}%</div>
            <p className="text-xs text-slate-500">National GDP share</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="districts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="districts">District Breakdown</TabsTrigger>
          <TabsTrigger value="projects">Provincial Projects</TabsTrigger>
          <TabsTrigger value="devolution">Devolved Subjects</TabsTrigger>
          <TabsTrigger value="transfers">Inter-Governmental Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="districts" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                District Budget Allocation
              </CardTitle>
              <CardDescription>Budget distribution across districts in the province</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {districtBreakdown.map((district, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-900">{district.district} District</span>
                        <p className="text-sm text-slate-600">
                          Population: {(district.population / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          {formatCurrency(district.spent)} / {formatCurrency(district.budget)}
                        </span>
                        <div className="text-xs text-slate-500">{district.utilization}% utilized</div>
                      </div>
                    </div>
                    <Progress value={district.utilization} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Remaining: {formatCurrency(district.budget - district.spent)}</span>
                      <Badge
                        variant={
                          district.utilization > 80 ? "default" : district.utilization < 60 ? "secondary" : "outline"
                        }
                      >
                        {district.utilization > 80
                          ? "Good Progress"
                          : district.utilization < 60
                            ? "Slow Progress"
                            : "Moderate"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Major Provincial Projects
              </CardTitle>
              <CardDescription>Key infrastructure and development projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {provincialProjects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900">{project.name}</h4>
                        <p className="text-sm text-slate-600">
                          Beneficiaries: {project.beneficiaries.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-600">Expected completion: {project.completion}</p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Budget</p>
                        <p className="font-semibold">{formatCurrency(project.budget)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Spent</p>
                        <p className="font-semibold">{formatCurrency(project.spent)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Progress</p>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="flex-1" />
                          <span className="text-sm font-medium">{project.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">Update Progress</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devolution" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Devolved Subject Performance
              </CardTitle>
              <CardDescription>Performance in areas devolved to provincial councils</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {devolutionAreas.map((area, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-900">{area.area}</span>
                        <div className={`text-sm font-medium ${getPerformanceColor(area.performance)}`}>
                          Performance: {area.performance}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          {formatCurrency(area.spent)} / {formatCurrency(area.budget)}
                        </span>
                        <div className="text-xs text-slate-500">{area.utilization}% utilized</div>
                      </div>
                    </div>
                    <Progress value={area.utilization} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Remaining: {formatCurrency(area.budget - area.spent)}</span>
                      <Badge
                        variant={
                          area.utilization > 80 ? "default" : area.utilization < 50 ? "destructive" : "secondary"
                        }
                      >
                        {area.utilization > 80
                          ? "High Utilization"
                          : area.utilization < 50
                            ? "Low Utilization"
                            : "Moderate"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Inter-Governmental Financial Transfers
              </CardTitle>
              <CardDescription>Central government transfers and provincial revenue collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interGovernmentalTransfers.map((transfer, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">{transfer.type}</h4>
                        <p className="text-sm text-slate-600">
                          {transfer.type.includes("Revenue") ? "Collected" : "Received"}:{" "}
                          {formatCurrency((transfer.received || transfer.collected) ?? 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-slate-900">{formatCurrency(transfer.amount)}</div>
                        <div
                          className={`text-sm font-medium ${transfer.percentage >= 90 ? "text-green-600" : transfer.percentage >= 70 ? "text-yellow-600" : "text-red-600"}`}
                        >
                          {transfer.percentage}%
                        </div>
                      </div>
                    </div>
                    <Progress value={transfer.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        {transfer.type.includes("Revenue") ? "Target vs Actual Collection" : "Allocated vs Received"}
                      </span>
                      <Badge
                        variant={
                          transfer.percentage >= 90
                            ? "default"
                            : transfer.percentage >= 70
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {transfer.percentage >= 90
                          ? "Excellent"
                          : transfer.percentage >= 70
                            ? "Good"
                            : "Needs Attention"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
