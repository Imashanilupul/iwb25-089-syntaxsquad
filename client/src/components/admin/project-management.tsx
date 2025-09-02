"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MinistryCombobox } from "@/components/ui/ministry-combobox"
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
import { Plus, Edit, Trash2, Building, MapPin, Loader2, AlertCircle, Check, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { projectService, type Project, type ProjectFormData } from "@/services/project"
import { categoryService, type Category } from "@/services/category"
import { ConnectButton } from "@/components/walletConnect/wallet-connect"
import { useAppKitAccount } from '@reown/appkit/react'
import { useAuth } from "@/context/AuthContext"

export function ProjectManagement() {
  // Environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const BALLERINA_BASE_URL = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080';

  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ministries, setMinistries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    projectName: "",
    categoryId: "",
    allocatedBudget: "",
    spentBudget: "",
    state: "",
    province: "",
    ministry: "",
    viewDetails: "",
    status: "",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Wallet connection state
  const { address, isConnected } = useAppKitAccount()
  const { verified } = useAuth() // Use shared AuthContext
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  // Spent budget editing state
  const [editingSpentBudget, setEditingSpentBudget] = useState<{ [key: number]: string }>({})
  const [updatingSpentBudget, setUpdatingSpentBudget] = useState<{ [key: number]: boolean }>({})

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  // Get paginated data
  const getPaginatedProjects = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return projects.slice(startIndex, endIndex)
  }

  const provinces = [
    "Western Province",
    "Central Province",
    "Southern Province",
    "Northern Province",
    "Eastern Province",
    "North Western Province",
    "North Central Province",
    "Uva Province",
    "Sabaragamuwa Province",
    "All Provinces",
  ]

  const projectStatuses = [
    { value: "PLANNED", label: "Planning" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "CANCELLED", label: "Cancelled" },
  ]

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [projectsResponse, categoriesResponse, ministriesResponse] = await Promise.all([
        projectService.getAllProjects(),
        categoryService.getAllCategories(),
        projectService.getDistinctMinistries(),
      ])

      if (projectsResponse.success) {
        setProjects(projectsResponse.data)
        setTotalItems(projectsResponse.data.length)
      } else {
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        })
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        })
      }

      if (ministriesResponse.success) {
        setMinistries(ministriesResponse.data)
      } else {
        // If ministries fail to load, we can still continue with an empty array
        console.warn("Failed to load ministries:", ministriesResponse.message)
        setMinistries([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please check your connection.",
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

  // Wallet validation function
  const validateWallet = async (walletAddress: string) => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }
    
    let accounts
    try {
      accounts = await (window.ethereum as any).request({ method: "eth_accounts" })
    } catch (error: any) {
      throw new Error("Failed to get wallet accounts. Please try again.")
    }

    if (accounts.length === 0) {
      try {
        toast({
          title: "🔗 Please approve wallet connection in MetaMask"
        })
        accounts = await (window.ethereum as any).request({ method: "eth_requestAccounts" })
      } catch (requestError: any) {
        if (requestError.code === -32002) {
          throw new Error("MetaMask is already processing a connection request. Please check your MetaMask extension and try again.")
        } else if (requestError.code === 4001) {
          throw new Error("User rejected wallet connection request")
        }
        throw new Error(`Failed to connect wallet: ${requestError.message || requestError}`)
      }
    }

    const currentAccount = accounts[0]?.toLowerCase()
    if (!currentAccount) {
      throw new Error("No wallet account found. Please connect your wallet first.")
    }

    if (currentAccount !== walletAddress.toLowerCase()) {
      throw new Error(`Account mismatch. Please switch to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} in MetaMask`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple simultaneous requests for project creation
    if (!editingId && isCreatingProject) {
      toast({
        title: "⏳ Project creation is already in progress",
        description: "Please wait for the current process to complete"
      })
      return
    }

    // Check wallet connection for new project creation
    if (!editingId && !isConnected) {
      toast({
        title: "🔗 Please connect your wallet first using the Connect button",
        variant: "destructive"
      })
      return
    }

    if (!editingId && isConnected && !verified) {
      toast({
        title: "❌ Verification Required",
        description: "Please verify your wallet to create new projects.",
        variant: "destructive"
      })
      return
    }

    // Validate wallet address format for new projects
    if (!editingId && address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast({
        title: "❌ Invalid wallet address format",
        variant: "destructive"
      })
      return
    }

    // Validate form data
    if (!formData.projectName || !formData.categoryId || !formData.allocatedBudget || !formData.state || !formData.province || !formData.ministry || !formData.status) {
      toast({
        title: "📝 Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    // Validate allocated budget against category available budget
    const selectedCategory = categories.find(c => c.category_id.toString() === formData.categoryId)
    if (selectedCategory) {
      const availableBudget = selectedCategory.allocated_budget - selectedCategory.spent_budget
      const requestedBudget = parseFloat(formData.allocatedBudget)
      
      if (requestedBudget > availableBudget) {
        toast({
          title: "💰 Budget Exceeded",
          description: `Requested budget (${formatCurrency(requestedBudget)}) exceeds category available budget (${formatCurrency(availableBudget)})`,
          variant: "destructive"
        })
        return
      }
    }

    if (editingId) {
      // Handle project edit with blockchain integration
      if (!isConnected) {
        toast({
          title: "🔗 Please connect your wallet to edit projects",
          variant: "destructive"
        })
        return
      }

      if (!verified) {
        toast({
          title: "❌ Verification Required",
          description: "Please verify your wallet to edit projects.",
          variant: "destructive"
        })
        return
      }

      setIsCreatingProject(true)
      setLastError(null)
      
      try {
        await validateWallet(address!)

        // Get category name for the form data
        const selectedCategory = categories.find(c => c.category_id.toString() === formData.categoryId)
        const categoryName = selectedCategory?.category_name || formData.categoryId

        const timestamp = new Date().toISOString()
        const message = `🏗️ UPDATE PROJECT CONFIRMATION

Project ID: ${editingId}
Project Name: ${formData.projectName}

Category: ${categoryName}

State: ${formData.state}
Province: ${formData.province}
Ministry: ${formData.ministry}

Status: ${formData.status}

Wallet: ${address}
Timestamp: ${timestamp}

⚠️ By signing this message, you confirm that you want to update this project on the blockchain. This action cannot be undone.`

        toast({
          title: "🔐 Please check your wallet to sign the project update request"
        })

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

        toast({
          title: "✅ Signature confirmed - updating project on blockchain..."
        })

        // Prepare IPFS + contract info from the prepare service
        const prepRes = await fetch(`${API_BASE_URL}/project/prepare-project`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            projectName: formData.projectName,
            categoryName: categoryName,
            allocatedBudget: parseFloat(formData.allocatedBudget),
            state: formData.state,
            province: formData.province,
            ministry: formData.ministry,
            viewDetails: formData.viewDetails || "",
            status: formData.status,
            walletAddress: address
          })
        })

        if (!prepRes.ok) {
          const txt = await prepRes.text()
          throw new Error(`Prepare failed: ${prepRes.status} ${txt}`)
        }

        const prepJson = await prepRes.json()
        const { viewDetailsCid, contractAddress, contractAbi } = prepJson
        if (!contractAddress || !contractAbi) {
          throw new Error("Prepare endpoint did not return all required fields")
        }

        toast({
          title: "🔐 Please confirm the blockchain transaction in your wallet"
        })

        // Send blockchain transaction FIRST
        const ethers = await import("ethers")
        const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
        await (window.ethereum as any).request({ method: "eth_requestAccounts" })
        const signer = await provider.getSigner()
        const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

        // Find the blockchain project ID - we'll need to get this from the project data
        // For now, we'll use the database ID, but in a real implementation you'd need to store blockchain IDs
        const blockchainProjectId = editingId // This should be the actual blockchain project ID

        const tx = await contract.updateProject(
          blockchainProjectId,
          formData.projectName,
          categoryName,
          formData.state,
          formData.province,
          formData.ministry,
          viewDetailsCid || "",
          formData.status
        )

        toast({
          title: `📤 Transaction sent: ${tx.hash.slice(0, 10)}...`
        })

        const receipt = await tx.wait()
        toast({
          title: `✅ Transaction confirmed in block ${receipt.blockNumber}`
        })

        // Only update database AFTER blockchain transaction succeeds
        toast({
          title: "📊 Updating database..."
        })

        try {
          const projectData: ProjectFormData = {
            projectName: formData.projectName,
            categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
            allocatedBudget: parseFloat(formData.allocatedBudget),
            spentBudget: formData.spentBudget ? parseFloat(formData.spentBudget) : 0,
            state: formData.state,
            province: formData.province,
            ministry: formData.ministry,
            viewDetails: formData.viewDetails,
            status: formData.status || "PLANNED"
          }

          const dbResponse = await projectService.updateProject(editingId, projectData)

          if (dbResponse.success) {
            toast({
              title: "🎉 Project updated successfully!",
              description: `Project "${formData.projectName}" has been updated on blockchain and database`
            })
            await loadData()
            resetForm()
            setIsDialogOpen(false)
          } else {
            throw new Error(dbResponse.message || "Database update failed")
          }
        } catch (dbError: any) {
          console.error("Database update error:", dbError)
          toast({
            title: "⚠️ Blockchain Success, Database Warning",
            description: `Project updated on blockchain (${tx.hash.slice(0, 10)}...) but database update failed: ${dbError.message}`,
            variant: "destructive"
          })
        }

      } catch (error: any) {
        console.error("Error updating project:", error)
        setLastError(error.message)

        let errorTitle = "❌ Project Update Failed"
        let errorDescription = error.message || "An unknown error occurred"

        if (error.message?.includes("User rejected")) {
          errorTitle = "🚫 User Cancelled"
          errorDescription = "Project update was cancelled by user"
        } else if (error.message?.includes("insufficient funds")) {
          errorTitle = "💰 Insufficient Funds"
          errorDescription = "You don't have enough funds to pay for gas fees"
        } else if (error.message?.includes("User not authorized")) {
          errorTitle = "❌ Not Authorized"
          errorDescription = "Your wallet address is not authorized. Please contact an administrator."
        } else if (error.message?.includes("Only creator can modify")) {
          errorTitle = "❌ Not Project Creator"
          errorDescription = "Only the project creator can modify this project."
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive"
        })
      } finally {
        setIsCreatingProject(false)
      }
    } else {
      // Handle new project creation with blockchain
      setIsCreatingProject(true)
      setLastError(null)
      
      try {
        await validateWallet(address!)

        // Get category name for the form data
        const selectedCategory = categories.find(c => c.category_id.toString() === formData.categoryId)
        const categoryName = selectedCategory?.category_name || formData.categoryId

        const timestamp = new Date().toISOString()
        const message = `🏗️ CREATE PROJECT CONFIRMATION

Project Name: ${formData.projectName}

Category: ${categoryName}

Allocated Budget: Rs. ${parseFloat(formData.allocatedBudget).toLocaleString()}

State: ${formData.state}
Province: ${formData.province}
Ministry: ${formData.ministry}

Status: ${formData.status}

Wallet: ${address}
Timestamp: ${timestamp}

⚠️ By signing this message, you confirm that you want to create this project on the blockchain. This action cannot be undone.`

        toast({
          title: "🔐 Please check your wallet to sign the project creation request"
        })

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

        toast({
          title: "✅ Signature confirmed - creating project on blockchain..."
        })

        // Prepare IPFS + contract info from the prepare service
        const prepRes = await fetch(`${API_BASE_URL}/project/prepare-project`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            projectName: formData.projectName,
            categoryName: categoryName,
            allocatedBudget: parseFloat(formData.allocatedBudget),
            state: formData.state,
            province: formData.province,
            ministry: formData.ministry,
            viewDetails: formData.viewDetails || "",
            status: formData.status,
            walletAddress: address
          })
        })

        if (!prepRes.ok) {
          const txt = await prepRes.text()
          throw new Error(`Prepare failed: ${prepRes.status} ${txt}`)
        }

        const prepJson = await prepRes.json()
        const { viewDetailsCid, contractAddress, contractAbi } = prepJson
        if (!contractAddress || !contractAbi) {
          throw new Error("Prepare endpoint did not return all required fields")
        }

        toast({
          title: "🔐 Please confirm the transaction in your wallet"
        })

        // Send blockchain transaction FIRST
        const ethers = await import("ethers")
        const provider = new (ethers as any).BrowserProvider(window.ethereum as any)
        await (window.ethereum as any).request({ method: "eth_requestAccounts" })
        const signer = await provider.getSigner()
        const contract = new (ethers as any).Contract(contractAddress, contractAbi, signer)

        // Convert allocated budget to Wei (assuming input is in ETH for blockchain - we'll adjust this)
        const allocatedBudgetWei = (ethers as any).parseEther((parseFloat(formData.allocatedBudget) / 1000000).toString()) // Convert Rs to a reasonable ETH amount

        // Only pass supported arguments to contract
        const tx = await contract.createProject(
          formData.projectName,
          categoryName,
          allocatedBudgetWei,
          formData.state,
          formData.province,
          formData.ministry,
          viewDetailsCid || "",
          formData.status
        )
        toast({
          title: `📤 Transaction sent: ${tx.hash.slice(0, 10)}...`
        })

        const receipt = await tx.wait()
        toast({
          title: `✅ Transaction confirmed in block ${receipt.blockNumber}`
        })

        // Try to get blockchain project ID
        let blockchainProjectId = null
        try {
          const iface = new (ethers as any).Interface(contractAbi)
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog(log)
              if (parsed && parsed.name && parsed.name.toLowerCase().includes("project")) {
                blockchainProjectId = parsed.args?.[0]?.toString() || null
                break
              }
            } catch (e) {}
          }
          if (!blockchainProjectId) {
            try {
              const bn = await contract.projectCount()
              blockchainProjectId = bn.toString()
            } catch (e) {}
          }
        } catch (e) {
          console.warn("Could not parse event for project id", e)
        }

        // Only save to database AFTER blockchain transaction succeeds
        toast({
          title: "📊 Saving project to database..."
        })

        // Fetch actual data from IPFS using CID
        let viewDetailsData = formData.viewDetails
        if (viewDetailsCid) {
          try {
            const ipfsRes = await fetch(`https://ipfs.io/ipfs/${viewDetailsCid}`)
            if (ipfsRes.ok) {
              viewDetailsData = await ipfsRes.text()
            } else {
              console.warn("Failed to fetch IPFS data, storing CID as fallback")
              viewDetailsData = viewDetailsCid
            }
          } catch (err) {
            console.warn("Error fetching IPFS data:", err)
            viewDetailsData = viewDetailsCid
          }
        }

        try {
          const projectData: ProjectFormData = {
            projectName: formData.projectName,
            categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
            allocatedBudget: parseFloat(formData.allocatedBudget),
            spentBudget: formData.spentBudget ? parseFloat(formData.spentBudget) : 0,
            state: formData.state,
            province: formData.province,
            ministry: formData.ministry,
            viewDetails: viewDetailsData,
            status: formData.status || "PLANNED"
          }

          const dbResponse = await projectService.createProject(projectData)

          if (dbResponse.success) {
            toast({
              title: "🎉 Project created successfully!",
              description: `Project "${formData.projectName}" has been created on blockchain and saved to database`
            })
            await loadData()
            resetForm()
            setIsDialogOpen(false)
          } else {
            throw new Error(dbResponse.message || "Database save failed")
          }
        } catch (dbError: any) {
          console.error("Database save error:", dbError)
          toast({
            title: "⚠️ Blockchain Success, Database Warning",
            description: `Project created on blockchain (${tx.hash.slice(0, 10)}...) but database save failed: ${dbError.message}`,
            variant: "destructive"
          })
        }

      } catch (error: any) {
        console.error("Error creating project:", error)
        setLastError(error.message)

        let errorTitle = "❌ Project Creation Failed"
        let errorDescription = error.message || "An unknown error occurred"

        if (error.message?.includes("User rejected")) {
          errorTitle = "🚫 User Cancelled"
          errorDescription = "Project creation was cancelled by user"
        } else if (error.message?.includes("insufficient funds")) {
          errorTitle = "💰 Insufficient Funds"
          errorDescription = "You don't have enough funds to pay for gas fees"
        } else if (error.message?.includes("User not authorized")) {
          errorTitle = "❌ Not Authorized"
          errorDescription = "Your wallet address is not authorized. Please contact an administrator."
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive"
        })
      } finally {
        setIsCreatingProject(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      projectName: "",
      categoryId: "",
      allocatedBudget: "",
      spentBudget: "",
      state: "",
      province: "",
      ministry: "",
      viewDetails: "",
      status: "",
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (project: Project) => {
    setFormData({
      projectName: project.project_name,
      categoryId: project.category_id?.toString() || "",
      allocatedBudget: project.allocated_budget.toString(),
      spentBudget: project.spent_budget.toString(),
      state: project.state,
      province: project.province,
      ministry: project.ministry,
      viewDetails: project.view_details || "",
      status: project.status,
    })
    setEditingId(project.project_id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    try {
      const response = await projectService.deleteProject(id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Project deleted successfully",
        })
        await loadData() // Reload data
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete project",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStateColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "PLANNED":
        return "bg-yellow-100 text-yellow-800"
      case "ON_HOLD":
        return "bg-orange-100 text-orange-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    const statusItem = projectStatuses.find((s) => s.value === status)
    return statusItem ? statusItem.label : status
  }

  const getCategoryName = (project: Project) => {
    // First try to get category name from embedded categories relationship
    if (project.categories?.category_name) {
      return project.categories.category_name
    }
    
    // Fall back to looking up by category_id
    if (!project.category_id) return "No Category"
    
    // Convert categoryId to number for comparison since categories.category_id is always number
    const numericCategoryId = typeof project.category_id === 'string' ? parseInt(project.category_id) : project.category_id
    
    if (isNaN(numericCategoryId)) return "Invalid Category"
    
    const category = categories.find((cat) => cat.category_id === numericCategoryId)
    return category ? category.category_name : `Unknown Category (ID: ${project.category_id})`
  }

  // Handle spent budget update
  const handleSpentBudgetUpdate = async (projectId: number, newSpentBudget: string) => {
    const numericValue = parseFloat(newSpentBudget)
    
    // Find the project to get the allocated budget
    const project = projects.find(p => p.project_id === projectId)
    if (!project) {
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive"
      })
      return
    }

    // Validate the input
    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: "Invalid Input",
        description: "Spent budget must be a non-negative number",
        variant: "destructive"
      })
      return
    }

    if (numericValue > project.allocated_budget) {
      toast({
        title: "Validation Error",
        description: "Spent budget cannot exceed allocated budget",
        variant: "destructive"
      })
      return
    }

    try {
      setUpdatingSpentBudget(prev => ({ ...prev, [projectId]: true }))
      
      const response = await projectService.updateProject(projectId, {
        spentBudget: numericValue
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Spent budget updated successfully"
        })
        // Clear the editing state
        setEditingSpentBudget(prev => {
          const newState = { ...prev }
          delete newState[projectId]
          return newState
        })
        // Reload data to reflect changes
        await loadData()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update spent budget",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating spent budget:", error)
      toast({
        title: "Error",
        description: "Failed to update spent budget. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUpdatingSpentBudget(prev => ({ ...prev, [projectId]: false }))
    }
  }

  // Handle spent budget edit
  const handleSpentBudgetEdit = (projectId: number, currentValue: number) => {
    setEditingSpentBudget(prev => ({ ...prev, [projectId]: currentValue.toString() }))
  }

  // Handle spent budget change
  const handleSpentBudgetChange = (projectId: number, value: string) => {
    setEditingSpentBudget(prev => ({ ...prev, [projectId]: value }))
  }

  // Cancel spent budget edit
  const cancelSpentBudgetEdit = (projectId: number) => {
    setEditingSpentBudget(prev => {
      const newState = { ...prev }
      delete newState[projectId]
      return newState
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading projects...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Management</h2>
          <p className="text-slate-600">Manage Government Projects And Their Budgets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({
                  projectName: "",
                  categoryId: "",
                  allocatedBudget: "",
                  spentBudget: "",
                  state: "",
                  province: "",
                  ministry: "",
                  viewDetails: "",
                  status: "",
                })
                setEditingId(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Project" : "Add New Project"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the project details" : "Create a new government project"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Kandy-Colombo Expressway"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="z-[10002] max-h-[200px]" position="popper">
                      {categories.map((category) => {
                        const availableBudget = category.allocated_budget - category.spent_budget
                        return (
                          <SelectItem key={category.category_id} value={category.category_id.toString()}>
                            <div className="flex flex-col">
                              <span>{category.category_name}</span>
                              <span className="text-xs text-gray-500">
                                Available: {formatCurrency(availableBudget)}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {formData.categoryId && (
                    <p className="text-xs text-gray-500">
                      Available budget: {
                        (() => {
                          const selectedCategory = categories.find(c => c.category_id.toString() === formData.categoryId)
                          return selectedCategory ? formatCurrency(selectedCategory.allocated_budget - selectedCategory.spent_budget) : "Unknown"
                        })()
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allocatedBudget">Allocated Budget (Rs.)</Label>
                  <Input
                    id="allocatedBudget"
                    type="number"
                    placeholder="e.g., 120000000000"
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
                    placeholder="e.g., 80400000000"
                    value={formData.spentBudget}
                    onChange={(e) => setFormData({ ...formData, spentBudget: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Project Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="z-[10002] max-h-[200px]" position="popper">
                      {projectStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent className="z-[10002] max-h-[200px]" position="popper">
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State/District</Label>
                  <Input
                    id="state"
                    placeholder="e.g., Kandy"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ministry">Responsible Ministry</Label>
                  <MinistryCombobox
                    value={formData.ministry}
                    onValueChange={(value) => setFormData({ ...formData, ministry: value })}
                    ministries={ministries}
                    placeholder="Select or type ministry name..."
                    disabled={isCreatingProject}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="viewDetails">Project Details</Label>
                <Textarea
                  id="viewDetails"
                  placeholder="Detailed description of the project..."
                  value={formData.viewDetails}
                  onChange={(e) => setFormData({ ...formData, viewDetails: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isCreatingProject}>
                  {isCreatingProject ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editingId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingId ? "Update Project" : "Add Project"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isCreatingProject}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallet Connection Alerts */}
      {!isConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800">Wallet Connection Required</h3>
              <p className="text-sm text-amber-700 mt-1">
                Connect your wallet to create and manage projects on the blockchain.
              </p>
            </div>
            <div className="ml-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}

      {isConnected && !verified && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-800">Wallet Verification Required</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your wallet is connected but needs verification to create projects. 
                Please contact an administrator for authorization.
              </p>
            </div>
            <div className="ml-4 text-sm text-blue-600 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
        </div>
      )}

      {isConnected && verified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="h-2 w-2 bg-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-green-800">Wallet Connected & Verified</h3>
              <p className="text-sm text-green-700 mt-1">
                You can create and manage projects on the blockchain.
              </p>
            </div>
            <div className="ml-4 text-sm text-green-600 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {lastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Last Error</h3>
              <p className="text-sm text-red-700 mt-1">{lastError}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLastError(null)}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-slate-500">Active projects</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Building className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter((p) => p.status === "IN_PROGRESS").length}</div>
            <p className="text-xs text-slate-500">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(projects.reduce((sum, proj) => sum + proj.allocated_budget, 0))}
            </div>
            <p className="text-xs text-slate-500">Allocated across all projects</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provinces</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(projects.map((p) => p.province)).size}</div>
            <p className="text-xs text-slate-500">Provinces covered</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Government projects with budget and progress details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Province</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getPaginatedProjects().map((project) => (
                <TableRow key={project.project_id}>
                  <TableCell className="font-medium">{project.project_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryName(project)}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(project.allocated_budget)}</TableCell>
                  <TableCell>
                    {editingSpentBudget[project.project_id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editingSpentBudget[project.project_id]}
                          onChange={(e) => handleSpentBudgetChange(project.project_id, e.target.value)}
                          className="w-24"
                          min="0"
                          max={project.allocated_budget}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSpentBudgetUpdate(project.project_id, editingSpentBudget[project.project_id])}
                          disabled={updatingSpentBudget[project.project_id]}
                        >
                          {updatingSpentBudget[project.project_id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelSpentBudgetEdit(project.project_id)}
                          disabled={updatingSpentBudget[project.project_id]}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                        onClick={() => handleSpentBudgetEdit(project.project_id, project.spent_budget)}
                      >
                        {formatCurrency(project.spent_budget)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStateColor(project.status)} variant="secondary">
                      {getStatusLabel(project.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.province}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleDelete(project.project_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {projects.length > 0 && (
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
