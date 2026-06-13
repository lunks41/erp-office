"use client"

import { useMemo, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ILeave, ILeaveBalance, ILeavePolicy } from "@/interfaces/leave"
import {
  LeaveBalanceSchemaType,
  LeavePolicySchemaType,
  LeaveRequestSchemaType,
} from "@/schemas/leave"
import { Calendar, CheckCircle, Clock, Plus, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { LeaveBalanceForm } from "./leave-balance-form"
import { LeaveBalanceTable } from "./leave-balance-table"
import { LeavePolicyForm } from "./leave-policy-form"
import { LeavePolicyTable } from "./leave-policy-table"
import { LeaveRequestForm } from "./leave-request-form"
import { LeaveRequestTable } from "./leave-request-table"

interface LeaveDashboardProps {
  leaves: ILeave[]
  leaveBalances: ILeaveBalance[]
  policies: ILeavePolicy[]
  onLeaveSubmit?: (data: LeaveRequestSchemaType) => Promise<void>
  onLeaveSave?: (
    leaveId: string,
    action: "approve" | "reject" | "cancel",
    notes?: string
  ) => void
  onPolicySubmit?: (
    data: LeavePolicySchemaType
  ) => Promise<ApiResponse<ILeavePolicy> | void>
}

export function LeaveDashboard({
  leaves,
  leaveBalances,
  policies,
  onLeaveSubmit,
  onLeaveSave,
  onPolicySubmit,
}: LeaveDashboardProps) {
  const [activeTab, setActiveTab] = useState("requests")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")

  // Filter leaves based on search and filters
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const matchesSearch =
        leave.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.reason.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType =
        typeFilter === "ALL" || leave.leaveTypeName === typeFilter

      return matchesSearch && matchesType
    })
  }, [leaves, searchTerm, typeFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalLeaves = leaves.length
    const pendingLeaves = leaves.filter(
      (leave) => leave.statusName?.toUpperCase() === "PENDING"
    ).length
    const approvedLeaves = leaves.filter(
      (leave) => leave.statusName?.toUpperCase() === "APPROVED"
    ).length
    const rejectedLeaves = leaves.filter(
      (leave) => leave.statusName?.toUpperCase() === "REJECTED"
    ).length

    const totalDays = leaves.reduce((sum, leave) => sum + leave.totalDays, 0)
    const pendingDays = leaves
      .filter((leave) => leave.statusName?.toUpperCase() === "PENDING")
      .reduce((sum, leave) => sum + leave.totalDays, 0)
    const approvedDays = leaves
      .filter((leave) => leave.statusName?.toUpperCase() === "APPROVED")
      .reduce((sum, leave) => sum + leave.totalDays, 0)
    const rejectedDays = leaves
      .filter((leave) => leave.statusName?.toUpperCase() === "REJECTED")
      .reduce((sum, leave) => sum + leave.totalDays, 0)

    return {
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      totalDays,
      pendingDays,
      approvedDays,
      rejectedDays,
    }
  }, [leaves])

  // Get unique types for filters
  const types = useMemo(() => {
    const uniqueTypes = [...new Set(leaves.map((leave) => leave.leaveTypeName))]
    return ["ALL", ...uniqueTypes]
  }, [leaves])

  const handleLeaveSubmit = async (data: LeaveRequestSchemaType) => {
    if (onLeaveSubmit) {
      await onLeaveSubmit(data)
    }
  }

  const handlePolicySubmit = async (data: LeavePolicySchemaType) => {
    console.log("LeaveDashboard handlePolicySubmit called with data:", data)
    if (onPolicySubmit) {
      console.log("Calling onPolicySubmit...")
      const response = await onPolicySubmit(data)
      console.log("onPolicySubmit completed with response:", response)
      return response
    } else {
      console.log("onPolicySubmit is not defined")
      return {
        result: -1,
        message: "Policy submit handler not defined",
        data: [],
      } as ApiResponse<ILeavePolicy>
    }
  }

  const handleBalanceSubmit = async (data: LeaveBalanceSchemaType) => {
    console.log("LeaveDashboard handleBalanceSubmit called with data:", data)
    // TODO: Implement balance submit logic
    console.log("Balance submit not implemented yet")
    return {
      result: -1,
      message: "Balance submit not implemented yet",
      data: [],
    } as ApiResponse<ILeaveBalance>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with New Leave Request Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight sm:text-3xl">
            Leave Management
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage employee leave requests, balances, and policies
          </p>
        </div>
        <Button
          onClick={() => {
            // Trigger the LeaveRequestForm dialog
            const event = new CustomEvent("openLeaveRequestForm")
            window.dispatchEvent(event)
          }}
          className="flex w-full items-center gap-2 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Leave Request</span>
          <span className="sm:hidden">New Request</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {stats.totalLeaves}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.totalDays} total days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-600 sm:text-2xl">
              {stats.pendingLeaves}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.pendingDays} days pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600 sm:text-2xl">
              {stats.approvedLeaves}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.approvedDays} days approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600 sm:text-2xl">
              {stats.rejectedLeaves}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.rejectedDays} days rejected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 gap-2">
          <TabsTrigger value="requests" className="text-xs sm:text-sm">
            Requests
          </TabsTrigger>
          <TabsTrigger value="balances" className="text-xs sm:text-sm">
            Balances
          </TabsTrigger>
          <TabsTrigger value="policies" className="text-xs sm:text-sm">
            Policies
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leave Requests</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LeaveRequestTable
                leaves={filteredLeaves}
                onSaveAction={onLeaveSave}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leave Balances</CardTitle>
                <Button
                  onClick={() => {
                    // This will be handled by the LeaveBalanceForm component
                    const event = new CustomEvent("openBalanceForm", {
                      detail: { mode: "add" },
                    })
                    window.dispatchEvent(event)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Balance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LeaveBalanceTable balances={leaveBalances} policies={policies} />
            </CardContent>
          </Card>

          {/* Balance Form Component */}
          <LeaveBalanceForm onSubmit={handleBalanceSubmit} />
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leave Policies</CardTitle>
                <Button
                  onClick={() => {
                    // This will be handled by the LeavePolicyForm component
                    const event = new CustomEvent("openPolicyForm", {
                      detail: { mode: "add" },
                    })
                    window.dispatchEvent(event)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LeavePolicyTable policies={policies} />
            </CardContent>
          </Card>

          {/* Policy Form Component */}
          <LeavePolicyForm policies={policies} onSubmit={handlePolicySubmit} />
        </TabsContent>
      </Tabs>

      {/* Leave Request Form Dialog */}
      <LeaveRequestForm onSubmit={handleLeaveSubmit} />
    </div>
  )
}
