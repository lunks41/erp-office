"use client"

import { useMemo, useState } from "react"
import { IEmployee } from "@/interfaces/employee"
import { ILeave, ILeaveBalance } from "@/interfaces/leave"
import { LeaveRequestSchemaType } from "@/schemas/leave"
import { format } from "date-fns"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { LeaveRequestForm } from "./leave-request-form"

interface EmployeeLeaveViewProps {
  employee: IEmployee
  leaves: ILeave[]
  leaveBalances: ILeaveBalance[]
  onLeaveSubmit: (data: LeaveRequestSchemaType) => Promise<void>
  onLeaveCancel?: (leaveId: string) => Promise<void>
}

export function EmployeeLeaveView({
  employee,
  leaves,
  leaveBalances,
  onLeaveSubmit,
  onLeaveCancel,
}: EmployeeLeaveViewProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Filter data for this employee
  const employeeLeaves = useMemo(() => {
    return leaves.filter((leave) => leave.employeeId === employee.employeeId)
  }, [leaves, employee.employeeId])

  const employeeBalances = useMemo(() => {
    return leaveBalances.filter(
      (balance) => balance.employeeId === employee.employeeId
    )
  }, [leaveBalances, employee.employeeId])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalLeaves = employeeLeaves.length
    const pendingLeaves = employeeLeaves.filter(
      (l) => l.statusName === "PENDING"
    ).length
    const approvedLeaves = employeeLeaves.filter(
      (l) => l.statusName === "APPROVED"
    ).length
    const rejectedLeaves = employeeLeaves.filter(
      (l) => l.statusName === "REJECTED"
    ).length
    const totalDays = employeeLeaves.reduce((sum, l) => sum + l.totalDays, 0)
    const approvedDays = employeeLeaves
      .filter((l) => l.statusName === "APPROVED")
      .reduce((sum, l) => sum + l.totalDays, 0)

    return {
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      totalDays,
      approvedDays,
    }
  }, [employeeLeaves])

  // Get approval hierarchy for this employee
  const getApprovalHierarchy = () => {
    // In a real system, this would come from employee's department and role
    return [
      {
        level: 1,
        title: "Direct Manager",
        name: "Manager Smith",
        role: "IT Manager",
        email: "manager.smith@company.com",
        status: "pending",
      },
      {
        level: 2,
        title: "Department Head",
        name: "John Manager",
        role: "IT Director",
        email: "john.manager@company.com",
        status: "pending",
      },
      {
        level: 3,
        title: "HR Manager",
        name: "Sarah HR",
        role: "HR Manager",
        email: "sarah.hr@company.com",
        status: "pending",
      },
    ]
  }

  const approvalHierarchy = getApprovalHierarchy()

  const handleLeaveSubmit = async (data: LeaveRequestSchemaType) => {
    try {
      await onLeaveSubmit({
        ...data,
        employeeId: employee.employeeId,
      })
      toast.success(
        "Leave request submitted successfully! Sent to approval hierarchy."
      )
    } catch {
      toast.error("Failed to submit leave request")
    }
  }

  const handleCancelLeave = async (leaveId: string) => {
    if (onLeaveCancel) {
      try {
        await onLeaveCancel(leaveId)
        toast.success("Leave request cancelled successfully")
      } catch {
        toast.error("Failed to cancel leave request")
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Employee Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.photo} alt={employee.employeeName} />
              <AvatarFallback>
                {employee.employeeName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{employee.employeeName}</h2>
              <p className="text-muted-foreground">
                {employee.employeeCode} • {employee.departmentName}
              </p>
              <p className="text-muted-foreground text-sm">
                Joined:{" "}
                {format(new Date(employee.joinDate || new Date()), "MMM yyyy")}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={employee.isActive ? "default" : "secondary"}>
                {employee.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Leaves</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalLeaves}</p>
            <p className="text-muted-foreground text-xs">
              {stats.totalDays} days total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats.pendingLeaves}</p>
            <p className="text-muted-foreground text-xs">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <p className="text-2xl font-bold">{stats.approvedLeaves}</p>
            <p className="text-muted-foreground text-xs">
              {stats.approvedDays} days approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <p className="text-2xl font-bold">{stats.rejectedLeaves}</p>
            <p className="text-muted-foreground text-xs">Not approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="new-request">New Request</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Leave Balances Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Leave Balances</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employeeBalances.map((balance) => (
                  <div key={balance.leaveBalanceId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        Leave Type {balance.leaveTypeId}
                      </span>
                      <span className="text-muted-foreground">
                        {balance.remainingBalance} / {balance.totalAllocated}{" "}
                        days
                      </span>
                    </div>
                    <Progress
                      value={
                        (balance.remainingBalance / balance.totalAllocated) *
                        100
                      }
                      className="h-2"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span>Used: {balance.totalUsed}</span>
                      <span>Pending: {balance.totalPending}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Leave Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Recent Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeeLeaves.slice(0, 5).map((leave) => (
                    <div
                      key={leave.leaveId}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(leave.statusName)}
                        <div>
                          <p className="font-medium">{leave.leaveTypeName}</p>
                          <p className="text-muted-foreground text-sm">
                            {format(new Date(leave.startDate), "MMM dd")} -{" "}
                            {format(new Date(leave.endDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(leave.statusName)}>
                        {leave.statusName}
                      </Badge>
                    </div>
                  ))}
                  {employeeLeaves.length === 0 && (
                    <p className="text-muted-foreground py-4 text-center">
                      No leave requests yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leave Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeBalances.map((balance) => (
                  <div
                    key={balance.leaveBalanceId}
                    className="rounded-lg border p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">
                        Leave Type {balance.leaveTypeId}
                      </h3>
                      <Badge variant="outline">{balance.year}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Allocated</p>
                        <p className="font-medium">
                          {balance.totalAllocated} days
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Used</p>
                        <p className="font-medium">{balance.totalUsed} days</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pending</p>
                        <p className="font-medium">
                          {balance.totalPending} days
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-medium text-green-600">
                          {balance.remainingBalance} days
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={
                        ((balance.totalUsed + balance.totalPending) /
                          balance.totalAllocated) *
                        100
                      }
                      className="mt-3"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeLeaves.map((leave) => (
                  <div key={leave.leaveId} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{leave.leaveTypeName}</h3>
                        <p className="text-muted-foreground text-sm">
                          {format(new Date(leave.startDate), "MMM dd, yyyy")} -{" "}
                          {format(new Date(leave.endDate), "MMM dd, yyyy")}
                        </p>
                        <p className="text-sm">{leave.totalDays} days</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(leave.statusName)}
                        <Badge className={getStatusColor(leave.statusName)}>
                          {leave.statusName}
                        </Badge>
                      </div>
                    </div>

                    <p className="mb-3 text-sm">{leave.reason}</p>

                    {leave.statusName === "PENDING" && (
                      <div className="flex space-x-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleCancelLeave(leave.leaveId.toString())
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {leave.statusName === "APPROVED" && leave.actionBy && (
                      <div className="text-sm text-green-600">
                        Approved by {leave.actionBy} on{" "}
                        {format(
                          new Date(leave.actionDate || new Date()),
                          "MMM dd, yyyy"
                        )}
                      </div>
                    )}

                    {leave.statusName === "REJECTED" && leave.actionRemarks && (
                      <div className="text-sm text-red-600">
                        Rejected: {leave.actionRemarks}
                      </div>
                    )}
                  </div>
                ))}

                {employeeLeaves.length === 0 && (
                  <p className="text-muted-foreground py-8 text-center">
                    No leave requests found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Request Tab */}
        <TabsContent value="new-request" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Submit Leave Request</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveRequestForm onSubmit={handleLeaveSubmit} />
            </CardContent>
          </Card>

          {/* Approval Hierarchy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Approval Hierarchy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalHierarchy.map((approver, index) => (
                  <div
                    key={approver.level}
                    className="flex items-center space-x-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-sm font-medium text-muted-foreground">
                          {approver.level}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{approver.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {approver.name} • {approver.role}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {approver.email}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="capitalize">
                        {approver.status}
                      </Badge>
                    </div>
                    {index < approvalHierarchy.length - 1 && (
                      <div className="absolute top-8 left-4 h-8 w-0.5 bg-gray-200" />
                    )}
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="text-muted-foreground text-sm">
                <p>
                  • Your leave request will be sent to the approval hierarchy
                  above
                </p>
                <p>• Each level must approve before proceeding to the next</p>
                <p>• You will receive notifications at each step</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
