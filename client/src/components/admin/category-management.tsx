"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Plus, Edit, Trash2, DollarSign, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import categoryService, { type Category, type CategoryFormData } from "@/services/category"

const BALLERINA_BASE_URL = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080';

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<CategoryFormData>({
    categoryName: "",
    allocatedBudget: 0,
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await categoryService.getAllCategories()
      if (response.success) {
        setCategories(response.data)
        setTotalItems(response.data.length)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load categories",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000000) {
      return `Rs. ${(amount / 1000000000000).toFixed(1)}T`
    } else if (amount >= 1000000000) {
      return `Rs. ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `Rs. ${(amount / 1000000).toFixed(1)}M`
    }
    return `Rs. ${amount.toLocaleString()}`
  }

  const resetForm = () => {
    setFormData({
      categoryName: "",
      allocatedBudget: 0,
    })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.categoryName.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }

    if (formData.allocatedBudget < 0) {
      toast({
        title: "Validation Error",
        description: "Allocated budget cannot be negative",
        variant: "destructive",
      })
      return
    }

    // Note: Spent budget validation removed as it will be auto-calculated from projects

    try {
      setSubmitting(true)

      if (editingId) {
        // Update existing category
        const response = await categoryService.updateCategory(editingId, formData)
        if (response.success) {
          toast({
            title: "Success",
            description: "Category updated successfully",
          })
          await loadCategories() // Reload the list
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to update category",
            variant: "destructive",
          })
        }
      } else {
        // Create new category
        const response = await categoryService.createCategory(formData)
        if (response.success) {
          toast({
            title: "Success",
            description: "Category created successfully",
          })
          await loadCategories() // Reload the list
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to create category",
            variant: "destructive",
          })
        }
      }

      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error submitting category:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setFormData({
      categoryName: category.category_name,
      allocatedBudget: category.allocated_budget,
    })
    setEditingId(category.category_id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return
    }

    try {
      const response = await categoryService.deleteCategory(id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        })
        await loadCategories() // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete category",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSyncSpentBudgets = async () => {
    try {
      setSyncing(true)
      
      // First test API connectivity
      toast({
        title: "🔄 Testing API connection...",
        description: "Checking if backend server is reachable"
      })

      try {
        const healthCheck = await fetch(`${BALLERINA_BASE_URL}/api/categories`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!healthCheck.ok) {
          throw new Error(`Backend server responded with status: ${healthCheck.status}`)
        }
        
        toast({
          title: "✅ API connection successful",
          description: "Backend server is reachable, proceeding with sync..."
        })
      } catch (connectError) {
        toast({
          title: "❌ Cannot connect to backend server",
          description: `Please ensure the Ballerina server is running on ${BALLERINA_BASE_URL}`,
          variant: "destructive"
        })
        console.error("Connection test failed:", connectError)
        return
      }

      toast({
        title: "🔄 Syncing category spent budgets...",
        description: "Calculating spent budgets from all projects"
      })

      const response = await categoryService.syncSpentBudgets()

      if (response.success) {
        toast({
          title: "✅ Sync completed successfully!",
          description: `Updated ${response.successCount || 0} categories. ${response.errorCount || 0} errors.`
        })
        await loadCategories() // Reload the list to show updated values
      } else {
        toast({
          title: "❌ Sync failed",
          description: response.message || "Failed to sync category spent budgets",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error syncing category spent budgets:", error)
      
      let errorMessage = "Failed to sync category spent budgets. Please try again."
      if (error.message?.includes("Network Error")) {
        errorMessage = `Cannot connect to backend server. Please ensure the Ballerina server is running on ${BALLERINA_BASE_URL}`
      } else if (error.response?.status) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`
      }
      
      toast({
        title: "❌ Sync failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  const getUtilizationColor = (spent: number, allocated: number) => {
    const percentage = (spent / allocated) * 100
    if (percentage > 90) return "text-red-600"
    if (percentage > 75) return "text-yellow-600"
    return "text-green-600"
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  // Get paginated data
  const getPaginatedCategories = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return categories.slice(startIndex, endIndex)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Budget Categories</h2>
          <p className="text-slate-600">Manage budget categories and allocations</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncSpentBudgets}
            disabled={loading || syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Spent Budgets'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm()
                }}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the category details" : "Create a new budget category"}
            </DialogDescription>
          </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  placeholder="e.g., Education, Health, Infrastructure"
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocatedBudget">Allocated Budget (Rs.)</Label>
                <Input
                  id="allocatedBudget"
                  type="number"
                  placeholder="e.g., 850000000000"
                  value={formData.allocatedBudget}
                  onChange={(e) => setFormData({ ...formData, allocatedBudget: Number(e.target.value) })}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingId ? "Update Category" : "Add Category"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : categories.length}</div>
            <p className="text-xs text-slate-500">Active budget categories</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : formatCurrency(categories.reduce((sum, cat) => sum + cat.allocated_budget, 0))}
            </div>
            <p className="text-xs text-slate-500">Across all categories</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : formatCurrency(categories.reduce((sum, cat) => sum + cat.spent_budget, 0))}
            </div>
            <p className="text-xs text-slate-500">
              {loading ? "..." : Math.round(
                (categories.reduce((sum, cat) => sum + cat.spent_budget, 0) /
                  Math.max(categories.reduce((sum, cat) => sum + cat.allocated_budget, 0), 1)) *
                  100,
              )}
              % utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
          <CardDescription>
            All budget categories with allocation and spending details. 
            Spent budget shows the total of all project spending in each category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              <span className="ml-2 text-slate-500">Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No categories found. Create your first category to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Allocated Budget</TableHead>
                  <TableHead>Spent Budget</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedCategories().map((category) => {
                  const utilization = (category.spent_budget / category.allocated_budget) * 100
                  const remaining = category.allocated_budget - category.spent_budget

                  return (
                    <TableRow key={category.category_id}>
                      <TableCell className="font-medium">{category.category_name}</TableCell>
                      <TableCell>{formatCurrency(category.allocated_budget)}</TableCell>
                      <TableCell>
                        <span className="text-blue-600">{formatCurrency(category.spent_budget)}</span>
                        <span className="text-xs text-gray-500 block">Sum of all projects</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">{formatCurrency(remaining)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getUtilizationColor(category.spent_budget, category.allocated_budget)}
                        >
                          {utilization.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={async () => {
                              try {
                                const response = await categoryService.syncSpentBudgets()
                                if (response.success) {
                                  toast({
                                    title: "✅ Category synced!",
                                    description: `Category ${category.category_name} updated`
                                  })
                                  await loadCategories()
                                }
                              } catch (error) {
                                toast({
                                  title: "❌ Sync failed",
                                  description: "Failed to sync this category",
                                  variant: "destructive"
                                })
                              }
                            }}
                            disabled={syncing}
                          >
                            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(category.category_id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {categories.length > 0 && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / pageSize)}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
