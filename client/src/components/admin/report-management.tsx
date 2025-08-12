"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Shield, Clock, CheckCircle, Search, Loader2, X, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { reportService, type Report, type ReportStatistics } from "@/services/report"

export function ReportManagement() {
  const [reports, setReports] = useState<Report[]>([])
  const [statistics, setStatistics] = useState<ReportStatistics['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState<"created_time" | "priority" | "report_title">("created_time")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [searchResults, setSearchResults] = useState<string>("")

  const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load reports on component mount and when search/filters change
  useEffect(() => {
    loadReports()
  }, [])

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch()
    } else {
      loadReports()
    }
  }, [debouncedSearchTerm, filterPriority, filterStatus])

  // Load all reports from backend
  const loadReports = async () => {
    try {
      setLoading(true)
      const reportsData = await reportService.getAllReports()
      const sortedReports = sortReports(reportsData)
      setReports(sortedReports)
      setSearchResults("")
      
      // Load statistics
      const statsData = await reportService.getReportStatistics()
      setStatistics(statsData)
    } catch (error) {
      console.error('Failed to load reports:', error)
      toast.error('Failed to load reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Perform search with backend API
  const performSearch = async () => {
    try {
      setLoading(true)
      const searchData = await reportService.searchReportsAdvanced({
        keyword: debouncedSearchTerm,
        priority: filterPriority !== "all" ? filterPriority : undefined,
        resolved: filterStatus !== "all" ? filterStatus === "resolved" : undefined
      })
      const sortedReports = sortReports(searchData)
      setReports(sortedReports)
      setSearchResults(`Found ${searchData.length} report(s) matching "${debouncedSearchTerm}"`)
    } catch (error) {
      console.error('Failed to search reports:', error)
      toast.error('Failed to search reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Sort reports based on sortBy and sortOrder
  const sortReports = (reportsToSort: Report[]) => {
    return [...reportsToSort].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "created_time":
          comparison = new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
          break
        case "report_title":
          comparison = a.report_title.localeCompare(b.report_title)
          break
        case "priority":
          const priorityOrder = { "CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 }
          comparison = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
          break
        default:
          comparison = 0
      }
      
      return sortOrder === "desc" ? -comparison : comparison
    })
  }

  // Handle sorting change
  useEffect(() => {
    const sortedReports = sortReports(reports)
    setReports(sortedReports)
  }, [sortBy, sortOrder])

  // Handle resolve/unresolve report toggle
  const handleToggleResolve = async (reportId: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        // If currently resolved, mark as pending (unresolve)
        const unresolved = await reportService.unresolveReport(reportId)
        setReports(reports.map(report => 
          report.report_id === reportId 
            ? { ...report, resolved_status: false, resolved_time: undefined }
            : report
        ))
        toast.success('Report marked as pending successfully!')
      } else {
        // If currently pending, mark as resolved
        const resolvedReport = await reportService.resolveReport(reportId)
        setReports(reports.map(report => 
          report.report_id === reportId 
            ? { ...report, resolved_status: true, resolved_time: resolvedReport.resolved_time }
            : report
        ))
        toast.success('Report marked as resolved successfully!')
      }
      
      // Refresh statistics
      const statsData = await reportService.getReportStatistics()
      setStatistics(statsData)
    } catch (error) {
      console.error('Failed to toggle report status:', error)
      toast.error(`Failed to ${currentStatus ? 'unresolve' : 'resolve'} report. Please try again.`)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setFilterPriority("all")
    setFilterStatus("all")
    loadReports()
  }

  // Utility functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (resolved: boolean) => {
    return resolved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">National Report Management</h2>
          <p className="text-slate-600">Manage whistleblowing reports submitted by citizens across Sri Lanka</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search reports by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {formatPriority(priority)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: "created_time" | "priority" | "report_title") => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_time">Date</SelectItem>
            <SelectItem value="report_title">Title</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest</SelectItem>
            <SelectItem value="asc">Oldest</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || filterPriority !== "all" || filterStatus !== "all") && (
          <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results indicator */}
      {searchResults && (
        <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
          {searchResults}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.total_reports || reports.length}
            </div>
            <p className="text-xs text-slate-500">All time submissions</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.unresolved_reports || 
               reports.filter((r) => !r.resolved_status).length}
            </div>
            <p className="text-xs text-slate-500">Under investigation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.resolved_reports || 
               reports.filter((r) => r.resolved_status).length}
            </div>
            <p className="text-xs text-slate-500">
              {statistics?.resolution_rate_percentage?.toFixed(0) || 
               Math.round((reports.filter((r) => r.resolved_status).length / Math.max(reports.length, 1)) * 100)}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.priority_breakdown?.HIGH || 
               reports.filter((r) => r.priority === "HIGH" || r.priority === "CRITICAL").length}
            </div>
            <p className="text-xs text-slate-500">Urgent investigations</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>National Reports ({reports.length})</CardTitle>
          <CardDescription>Whistleblowing reports submitted by citizens across Sri Lanka</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading reports...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evidence Hash</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.report_id}>
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <p className="font-semibold">{report.report_title}</p>
                        {report.description && (
                          <p className="text-sm text-slate-500 truncate">{report.description}</p>
                        )}
                        {report.assigned_to && (
                          <p className="text-xs text-slate-400">Assigned to: {report.assigned_to}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(report.priority)} variant="secondary">
                        {formatPriority(report.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.resolved_status)} variant="secondary">
                        {report.resolved_status ? "Resolved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                        {report.evidence_hash.slice(0, 16)}...
                      </code>
                    </TableCell>
                    <TableCell>{formatDate(report.created_time)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleResolve(report.report_id, report.resolved_status)}
                          className={report.resolved_status 
                            ? "text-orange-600 hover:text-orange-700" 
                            : "text-green-600 hover:text-green-700"
                          }
                        >
                          {report.resolved_status ? (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {report.resolved_status ? "Mark as Pending" : "Mark as Resolved"}
                        </Button>
                        {report.resolved_status && report.resolved_time && (
                          <div className="text-xs text-slate-500 self-center">
                            Resolved on {formatDate(report.resolved_time)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No reports found. {searchTerm || filterPriority !== "all" || filterStatus !== "all" 
                        ? "Try adjusting your search criteria." 
                        : "Reports will appear here when submitted by citizens."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
