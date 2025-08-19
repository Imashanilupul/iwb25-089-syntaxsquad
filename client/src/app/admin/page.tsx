"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminOverview } from "@/components/admin/admin-overview"
import { CategoryManagement } from "@/components/admin/category-management"
import { ProjectManagement } from "@/components/admin/project-management"
import { ProposalManagement } from "@/components/admin/proposal-management"
import { PolicyManagement } from "@/components/admin/policy-management"
import { PetitionManagement } from "@/components/admin/petition-management"
import { ReportManagement } from "@/components/admin/report-management"
import { UserAnalytics } from "@/components/admin/user-analytics"
import { DbSync } from "@/components/admin/db-sync"
import { ConnectButton } from "@/components/walletConnect/wallet-connect"
import { useAuth } from "@/context/AuthContext"
import { useAppKitAccount } from "@reown/appkit/react"
import {
  LayoutDashboard,
  DollarSign,
  Building,
  Vote,
  FileText,
  MessageSquare,
  AlertTriangle,
  Users,
  Wallet,
  Database,
} from "lucide-react"

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState("overview")
  const { address, isConnected } = useAppKitAccount()
  const { verified } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img
                src="/images/sri-lanka-emblem.png"
                alt="Sri Lanka National Emblem"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Admin Portal</h1>
                <p className="text-slate-600">Sri Lanka Transparent Governance Platform - Data Management</p>
              </div>
            </div>
            
            {/* Wallet Connection Section */}
            <div className="flex items-center gap-4">
              {isConnected && address ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <Badge variant={verified ? "default" : "secondary"}>
                      {verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Wallet not connected</div>
              )}
              <ConnectButton />
            </div>
          </div>
          
          {/* Connection Status Alert */}
          {!isConnected && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  Connect your wallet to access all admin features and blockchain interactions.
                </span>
              </div>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="proposals" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Proposals
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="petitions" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Petitions
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="db-sync" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Sync
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectManagement />
          </TabsContent>

          <TabsContent value="proposals">
            <ProposalManagement />
          </TabsContent>

          <TabsContent value="policies">
            <PolicyManagement />
          </TabsContent>

          <TabsContent value="petitions">
            <PetitionManagement />
          </TabsContent>

          <TabsContent value="reports">
            <ReportManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserAnalytics />
          </TabsContent>

          <TabsContent value="db-sync">
            <DbSync />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
