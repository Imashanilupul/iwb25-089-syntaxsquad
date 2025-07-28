"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Server, Shield, Users, Database, Activity, AlertTriangle, HardDrive, Wifi, Zap } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

export function SystemAdminDashboard() {
  const [systemHealth] = useState({
    uptime: 99.97,
    totalUsers: 1247856,
    activeUsers: 89234,
    totalTransactions: 2847392,
    blockchainNodes: 156,
    storageUsed: 78.3,
    networkLatency: 12.4,
  })

  const blockchainMetrics = [
    { time: "00:00", tps: 847, nodes: 156, latency: 12 },
    { time: "04:00", tps: 623, nodes: 155, latency: 14 },
    { time: "08:00", tps: 1234, nodes: 156, latency: 11 },
    { time: "12:00", tps: 1567, nodes: 156, latency: 10 },
    { time: "16:00", tps: 1389, nodes: 156, latency: 13 },
    { time: "20:00", tps: 1045, nodes: 156, latency: 12 },
  ]

  const securityEvents = [
    {
      id: 1,
      type: "Failed Login Attempt",
      severity: "Medium",
      source: "203.94.94.123",
      target: "Treasury Admin Portal",
      timestamp: "2024-01-15 14:23:45",
      status: "Blocked",
    },
    {
      id: 2,
      type: "Suspicious Transaction Pattern",
      severity: "High",
      source: "Automated Detection",
      target: "Ministry of Health Payments",
      timestamp: "2024-01-15 13:45:12",
      status: "Under Review",
    },
    {
      id: 3,
      type: "Unauthorized Access Attempt",
      severity: "High",
      source: "192.168.1.45",
      target: "Blockchain Validator Node",
      timestamp: "2024-01-15 12:15:33",
      status: "Blocked",
    },
  ]

  const userManagement = [
    { role: "Super Admin", count: 5, active: 3, permissions: "Full System Access" },
    { role: "Treasury Admin", count: 12, active: 8, permissions: "Budget Management, Audit Access" },
    { role: "Ministry Admin", count: 47, active: 32, permissions: "Department Budget, Project Management" },
    { role: "Provincial Admin", count: 27, active: 19, permissions: "Provincial Budget, Local Projects" },
    { role: "Oversight Admin", count: 15, active: 11, permissions: "Audit Reports, Investigation Tools" },
    { role: "Technical Admin", count: 8, active: 6, permissions: "System Configuration, Monitoring" },
  ]

  const systemAlerts = [
    {
      id: 1,
      type: "Performance",
      message: "High CPU usage on Blockchain Node 7",
      severity: "Medium",
      timestamp: "5 minutes ago",
      status: "Active",
    },
    {
      id: 2,
      type: "Security",
      message: "Multiple failed login attempts detected",
      severity: "High",
      timestamp: "12 minutes ago",
      status: "Investigating",
    },
    {
      id: 3,
      type: "Storage",
      message: "Database storage approaching 80% capacity",
      severity: "Medium",
      timestamp: "1 hour ago",
      status: "Acknowledged",
    },
  ]

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
      case "Active":
        return "bg-red-100 text-red-800"
      case "Blocked":
        return "bg-green-100 text-green-800"
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"
      case "Investigating":
        return "bg-blue-100 text-blue-800"
      case "Acknowledged":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Administration Dashboard</h2>
        <p className="text-slate-600">Blockchain network monitoring and system management</p>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemHealth.uptime}%</div>
            <p className="text-xs text-slate-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-slate-500">of {systemHealth.totalUsers.toLocaleString()} total</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Nodes</CardTitle>
            <Server className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.blockchainNodes}</div>
            <p className="text-xs text-slate-500">All nodes operational</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.storageUsed}%</div>
            <p className="text-xs text-slate-500">Database capacity</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList>
          <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
          <TabsTrigger value="security">Security Center</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain Network</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Performance
                </CardTitle>
                <CardDescription>System performance metrics over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    tps: { label: "Transactions/sec", color: "#3b82f6" },
                    latency: { label: "Latency (ms)", color: "#ef4444" },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={blockchainMetrics}>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="tps" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="latency" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  System Alerts
                </CardTitle>
                <CardDescription>Recent system alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-slate-900">{alert.type}</h4>
                          <p className="text-sm text-slate-600">{alert.message}</p>
                        </div>
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{alert.timestamp}</span>
                        <Badge className={getStatusColor(alert.status)}>{alert.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Events
              </CardTitle>
              <CardDescription>Recent security incidents and threats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900">{event.type}</h4>
                        <p className="text-sm text-slate-600">Source: {event.source}</p>
                        <p className="text-sm text-slate-600">Target: {event.target}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                        <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">{event.timestamp}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                        <Button size="sm">Investigate</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Role Management
              </CardTitle>
              <CardDescription>System user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userManagement.map((role, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">{role.role}</h4>
                        <p className="text-sm text-slate-600">{role.permissions}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-slate-900">
                          {role.active} / {role.count}
                        </div>
                        <div className="text-xs text-slate-500">Active / Total</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Active Users</span>
                        <span>{Math.round((role.active / role.count) * 100)}%</span>
                      </div>
                      <Progress value={(role.active / role.count) * 100} className="h-2" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Manage Users
                      </Button>
                      <Button size="sm">Edit Permissions</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network TPS</CardTitle>
                <Zap className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-slate-500">Transactions per second</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
                <Wifi className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemHealth.networkLatency}ms</div>
                <p className="text-xs text-slate-500">Average response time</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Block Height</CardTitle>
                <Database className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247,856</div>
                <p className="text-xs text-slate-500">Latest block number</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Blockchain Network Status
              </CardTitle>
              <CardDescription>Real-time blockchain network monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Validator Nodes</h4>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((node) => (
                      <div key={node} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm">Node {node}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-slate-600">Online</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Network Health</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Consensus Rate</span>
                      <span className="text-sm font-semibold text-green-600">99.8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Block Time</span>
                      <span className="text-sm font-semibold">12.3s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Network Difficulty</span>
                      <span className="text-sm font-semibold">2.4T</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending Transactions</span>
                      <span className="text-sm font-semibold">234</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
