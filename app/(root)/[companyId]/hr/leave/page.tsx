"use client"

import { ApiResponse } from "@/interfaces/auth"
import { ILeave, ILeaveBalance, ILeavePolicy } from "@/interfaces/leave"
import { LeavePolicySchemaType, LeaveRequestSchemaType } from "@/schemas/leave"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  HrLeaveApproval,
  HrLeaveBalance,
  HrLeavePolicy,
  HrLeaveRequest,
} from "@/lib/api-routes"
import { useDelete, useGet, usePersist } from "@/hooks/use-common"

import { LeaveDashboard } from "./components/leave-dashboard"

export default function LeavePage() {
  // State for managing selected items

  const queryClient = useQueryClient()

  // Use the common hooks to fetch data
  const { data: leavesData, isLoading: leavesLoading } = useGet<ILeave>(
    HrLeaveRequest.get,
    "leaves"
  )
  const { data: leaveBalancesData, isLoading: balancesLoading } =
    useGet<ILeaveBalance>(HrLeaveBalance.get, "leave-balances")
  const { data: policiesData, isLoading: policiesLoading } =
    useGet<ILeavePolicy>(HrLeavePolicy.get, "leave-policies")

  // Initialize mutation hooks using common hooks
  const saveLeaveRequestMutation = usePersist(HrLeaveRequest.add)
  const _deleteLeaveRequestMutation = useDelete(HrLeaveRequest.delete)
  const approveLeaveMutation = usePersist(HrLeaveApproval.approve)
  const rejectLeaveMutation = usePersist(HrLeaveApproval.reject)
  const savePolicyMutation = usePersist(HrLeavePolicy.add)
  const updatePolicyMutation = usePersist(HrLeavePolicy.update)

  // Extract data from API responses - ensure we get flat arrays
  const leaves = leavesData?.data || []
  const leaveBalances = leaveBalancesData?.data || []
  const policies = policiesData?.data || []

  // Handler functions using the common mutation hooks
  const handlePolicySubmit = async (data: LeavePolicySchemaType) => {
    try {
      const policyData = {
        leavePolicyId: data.leavePolicyId,
        companyId: data.companyId,
        leaveTypeId: data.leaveTypeId,
        name: data.name,
        description: data.description,
        defaultDays: data.defaultDays,
        maxDays: data.maxDays,
        minDays: data.minDays,
        advanceNoticeDays: data.advanceNoticeDays,
        maxConsecutiveDays: data.maxConsecutiveDays,
        requiresApproval: data.requiresApproval,
        requiresDocument: data.requiresDocument,
        isActive: data.isActive,
      }

      console.log("Calling policy mutation with data:", policyData)

      // Use update for existing policies (leavePolicyId > 0), save for new ones
      let response: ApiResponse<ILeavePolicy>
      if (data.leavePolicyId > 0) {
        console.log("Updating existing policy...")
        response = (await updatePolicyMutation.mutateAsync(
          policyData
        )) as ApiResponse<ILeavePolicy>
      } else {
        console.log("Creating new policy...")
        response = (await savePolicyMutation.mutateAsync(
          policyData
        )) as ApiResponse<ILeavePolicy>
      }

      console.log("Policy mutation completed with response:", response)

      if (response.result === 1) {
        toast.success(
          data.leavePolicyId > 0
            ? "Leave policy updated successfully"
            : "Leave policy created successfully"
        )
        queryClient.invalidateQueries({ queryKey: ["leave-policies"] }) // Triggers refetch
        return response
      } else {
        toast.error(response.message || "Failed to save leave policy")
        return response
      }
    } catch (error) {
      console.error("Error saving policy:", error)
      toast.error("Failed to save leave policy")
      return {
        result: -1,
        message: "Failed to save leave policy",
        data: [],
      } as ApiResponse<ILeavePolicy>
    }
  }

  const handleLeaveSubmit = async (data: LeaveRequestSchemaType) => {
    try {
      console.log("Submitting leave request:", data)
      // Convert LeaveFormData to ILeaveRequest format
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      const totalDays =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1

      const leaveRequestData = {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays,
        reason: data.reason,
        statusId: 3, // Hr_Status: 3 = Pending
        remarks: data.remarks,
        attachments: data.attachments,
      }
      saveLeaveRequestMutation.mutate(leaveRequestData)
    } catch (error) {
      console.error("Error submitting leave request:", error)
      toast.error("Failed to submit leave request")
    }
  }

  const handleLeaveSave = async (
    leaveId: string,
    action: "approve" | "reject" | "cancel",
    notes?: string
  ) => {
    try {
      console.log("Processing leave action:", { leaveId, action, notes })

      switch (action) {
        case "approve":
          approveLeaveMutation.mutate({
            leaveId,
            approverId: "1",
            comments: notes || "Approved by manager",
          })
          break
        case "reject":
          rejectLeaveMutation.mutate({
            leaveId,
            approverId: "1",
            reason: notes || "Rejected by manager",
          })
          break
        case "cancel":
          // You might need to implement a cancel mutation or use update mutation
          console.log("Cancel action not implemented yet")
          toast.info("Cancel action not implemented yet")
          break
        default:
          console.error("Unknown action:", action)
          toast.error("Unknown action")
      }
    } catch (error) {
      console.error("Error processing leave action:", error)
      toast.error("Failed to process leave action")
    }
  }

  // Show loading state
  if (leavesLoading || balancesLoading || policiesLoading) {
    return (
      <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <p className="text-muted-foreground mt-2 text-sm">
              Loading leave data...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <LeaveDashboard
        leaves={leaves}
        leaveBalances={leaveBalances}
        policies={policies}
        onLeaveSubmit={handleLeaveSubmit}
        onLeaveSave={handleLeaveSave}
        onPolicySubmit={handlePolicySubmit}
      />
    </div>
  )
}
