"use client"

import type React from "react"

import { useState } from "react"
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
import { Plus, Edit, Trash2, DollarSign } from "lucide-react"

interface Category {
  id: number
  categoryName: string
  allocatedBudget: number
  spentBudget: number
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, categoryName: "Education", allocatedBudget: 850000000000, spentBudget: 567000000000 },
    { id: 2, categoryName: "Health", allocatedBudget: 650000000000, spentBudget: 423000000000 },
    { id: 3, categoryName: "Infrastructure", allocatedBudget: 1200000000000, spentBudget: 890000000000 },
    { id: 4, categoryName: "Defense", allocatedBudget: 450000000000, spentBudget: 398000000000 },
    { id: 5, categoryName: "Agriculture", allocatedBudget: 300000000000, spentBudget: 178000000000 },
  ])

  const [formData, setFormData] = useState({
    categoryName: "",
    allocatedBudget: "",
    spentBudget: "",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newCategory: Category = {
      id: editingId || Date.now(),
      categoryName: formData.categoryName,
      allocatedBudget: Number.parseFloat(formData.allocatedBudget),
      spentBudget: Number.parseFloat(formData.spentBudget || "0"),
    }

    if (editingId) {
      setCategories(categories.map((cat) => (cat.id === editingId ? newCategory : cat)))
    } else {
      setCategories([...categories, newCategory])
    }

    setFormData({ categoryName: "", allocatedBudget: "", spentBudget: "" })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (category: Category) => {
    setFormData({
      categoryName: category.categoryName,
      allocatedBudget: category.allocatedBudget.toString(),
      spentBudget: category.spentBudget.toString(),
    })
    setEditingId(category.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setCategories(categories.filter((cat) => cat.id !== id))
  }

  const getUtilizationColor = (spent: number, allocated: number) => {
    const percentage = (spent / allocated) * 100
    if (percentage > 90) return "text-red-600"
    if (percentage > 75) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Budget Categories</h2>
          <p className="text-slate-600">Manage budget categories and allocations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ categoryName: "", allocatedBudget: "", spentBudget: "" })
                setEditingId(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocatedBudget">Allocated Budget (Rs.)</Label>
                <Input
                  id="allocatedBudget"
                  type="number"
                  placeholder="e.g., 850000000000"
                  value={formData.allocatedBudget}
                  onChange={(e) => setFormData({ ...formData, allocatedBudget: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spentBudget">Spent Budget (Rs.)</Label>
                <Input
                  id="spentBudget"
                  type="number"
                  placeholder="e.g., 567000000000"
                  value={formData.spentBudget}
                  onChange={(e) => setFormData({ ...formData, spentBudget: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Update Category" : "Add Category"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
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
              {formatCurrency(categories.reduce((sum, cat) => sum + cat.allocatedBudget, 0))}
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
              {formatCurrency(categories.reduce((sum, cat) => sum + cat.spentBudget, 0))}
            </div>
            <p className="text-xs text-slate-500">
              {Math.round(
                (categories.reduce((sum, cat) => sum + cat.spentBudget, 0) /
                  categories.reduce((sum, cat) => sum + cat.allocatedBudget, 0)) *
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
          <CardDescription>All budget categories with allocation and spending details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Allocated Budget</TableHead>
                <TableHead>Spent Budget</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const utilization = (category.spentBudget / category.allocatedBudget) * 100
                const remaining = category.allocatedBudget - category.spentBudget

                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.categoryName}</TableCell>
                    <TableCell>{formatCurrency(category.allocatedBudget)}</TableCell>
                    <TableCell>{formatCurrency(category.spentBudget)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getUtilizationColor(category.spentBudget, category.allocatedBudget)}
                      >
                        {utilization.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(remaining)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
