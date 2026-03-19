"use client"

import { useEffect, useState } from "react"
import { ILeave } from "@/interfaces/leave"
import { LeaveRequestSchemaType } from "@/schemas/leave"
import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { HrUserRequest } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { useGetById, usePersist } from "@/hooks/use-common"
import { useGetEmployeeByUserId } from "@/hooks/use-employee"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { LeaveRequestForm } from "./components/leave-request-form"
import { LeaveRequestTable } from "./components/leave-request-table"

export default function LeavePage() {
  const queryClient = useQueryClient()
  const [showRequestForm, setShowRequestForm] = useState(false)

  const { data: employeeData, isLoading: employeeLoading } =
    useGetEmployeeByUserId()

  const employeeId = employeeData?.result?.toString() || ""

  // Show toast notification when employee ID is not available
  useEffect(() => {
    if (!employeeLoading && !employeeId) {
      toast.error(
        "Access Restricted: Employee information not found. Please contact your administrator or HR team.",
        {
          duration: 5000,
          description:
            "You need to be associated with an employee record to access leave management.",
        }
      )
    }
  }, [employeeLoading, employeeId])

  // Fetch leave data
  const { data: leavesData, isLoading: leavesLoading } = useGetById<ILeave>(
    HrUserRequest.get,
    "leaves",
    employeeId
  )

  // Initialize mutation hook
  const saveLeaveRequestMutation = usePersist(HrUserRequest.add)

  // Extract data
  const leaves = leavesData?.data || []

  // Calculate statistics for current year
  const currentYear = new Date().getFullYear()
  const currentYearLeaves = leaves.filter((leave) => {
    const leaveYear = new Date(leave.startDate).getFullYear()
    return leaveYear === currentYear
  })

  const totalRequests = leaves.length
  const totalLeaveBalance = 25 // Default annual leave balance
  const totalLeavePerYear = currentYearLeaves.reduce(
    (total, leave) => total + leave.totalDays,
    0
  )

  const handleAddNewRequest = () => {
    setShowRequestForm(true)
  }

  const handleLeaveSubmit = async (data: LeaveRequestSchemaType) => {
    try {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      const totalDays =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1

      // Format dates for API submission
      const leaveRequestData = {
        employeeId: employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: formatDateForApi(data.startDate) || "",
        endDate: formatDateForApi(data.endDate) || "",
        totalDays,
        reason: data.reason,
        statusId: 1,
        remarks: data.remarks,
        attachments: data.attachments,
      }

      await saveLeaveRequestMutation.mutateAsync(leaveRequestData)
      setShowRequestForm(false)
      toast.success("Leave request submitted successfully")
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
    } catch (error) {
      console.error("Error submitting leave request:", error)
      toast.error("Failed to submit leave request")
    }
  }

  // Show loading state while fetching employee data
  if (employeeLoading) {
    return (
      <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <p className="text-muted-foreground mt-2">
              Loading employee data...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show locked state when no employee ID is available
  if (!employeeId) {
    return (
      <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Access Restricted
            </h3>
            <p className="text-muted-foreground mb-4">
              Employee information not found. Please contact your administrator
              or HR team.
            </p>
            <p className="text-sm text-gray-500">
              You need to be associated with an employee record to access leave
              management.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state for leave data
  if (leavesLoading && leaves.length === 0) {
    return (
      <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <p className="text-muted-foreground mt-2">Loading leave data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Leave Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage leave requests and approvals
          </p>
        </div>
        <Button onClick={handleAddNewRequest}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-muted-foreground text-xs">All time requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeaveBalance}</div>
            <p className="text-muted-foreground text-xs">Days per year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Used This Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeavePerYear}</div>
            <p className="text-muted-foreground text-xs">{currentYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              User Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeId ? "Active" : "Inactive"}
            </div>
            <p className="text-muted-foreground text-xs">
              {employeeId ? "Employee linked" : "No employee record"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardContent>
          <LeaveRequestTable
            leaves={leaves}
            onSaveAction={() => {}}
            showActions={false}
          />
        </CardContent>
      </Card>

      {/* Leave Request Form Dialog */}
      <LeaveRequestForm
        open={showRequestForm}
        onOpenChange={setShowRequestForm}
        onSubmit={handleLeaveSubmit}
        employeeId={employeeId?.toString() || ""}
      />
    </div>
  )
}
