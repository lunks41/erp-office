"use client"

import { useParams, useRouter } from "next/navigation"
import { IJobOrderHd } from "@/interfaces/checklist"
import { usePermissionStore } from "@/stores/permission-store"

import { formatDateForApi } from "@/lib/date-utils"
import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import { useGetJobOrderByIdNo } from "@/hooks/use-checklist"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { JobOrderNotFound } from "@/components/errors"
import { JobOrderDetailsSkeleton } from "@/components/skeleton/job-order-details-skeleton"

import { ChecklistTabs } from "./components/checklist-tabs"

export default function JobOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const jobOrderId = params.joborderId as string // Note: using joborderId (lowercase) to match directory name

  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.checklist

  const { hasPermission } = usePermissionStore()

  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const canDebitNote = hasPermission(moduleId, transactionId, "isDebitNote")

  // Validate jobOrderId format (should be numeric string)
  const isValidJobOrderId = jobOrderId && /^\d+$/.test(jobOrderId)

  // Fetch the job order data using the hook
  const {
    data: jobOrderResponse,
    isLoading,
    isError,
    refetch: refetchJobOrder,
  } = useGetJobOrderByIdNo(isValidJobOrderId ? jobOrderId : "")

  // Debug logging
  // console.log("JobOrderDetailsPage - API Response:", {
  //   isLoading,
  //   isError,
  //   hasData: !!jobOrderResponse?.data,
  //   error: error?.message,
  //   jobOrderId,
  //   companyId: params.companyId,
  // })

  const statusColors: Record<string, string> = {
    Pending:
      "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-800 hover:from-amber-100 hover:to-yellow-200",
    Completed:
      "border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 hover:from-emerald-100 hover:to-green-200",
    Cancelled:
      "border-red-300 bg-gradient-to-r from-red-50 to-rose-100 text-red-800 hover:from-red-100 hover:to-rose-200",
    "Cancel with Service":
      "border-orange-300 bg-gradient-to-r from-orange-50 to-amber-100 text-orange-800 hover:from-orange-100 hover:to-amber-200",
    Confirmed:
      "border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 hover:from-blue-100 hover:to-indigo-200",
    Posted:
      "border-purple-300 bg-gradient-to-r from-purple-50 to-violet-100 text-purple-800 hover:from-purple-100 hover:to-violet-200",
    Delivered:
      "border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-100 text-teal-800 hover:from-teal-100 hover:to-cyan-200",
    Approved:
      "border-green-300 bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 hover:from-green-100 hover:to-emerald-200",
  }

  // Handle clone functionality
  const handleClone = (clonedData: IJobOrderHd) => {
    try {
      // Store cloned data in sessionStorage for the new page to use
      // This avoids URL length limits and preserves complex objects
      const clonedDataForStorage = {
        ...clonedData,
        jobOrderId: 0, // Reset ID for new record
        jobOrderNo: "", // Reset job order number
        jobOrderDate: formatDateForApi(new Date()) || "", // Set to today in yyyy-MM-dd format
        editVersion: 0, // Reset edit version
      }
      sessionStorage.setItem(
        "clonedJobOrder",
        JSON.stringify(clonedDataForStorage)
      )
      // Navigate to the new checklist page
      router.push(`/${params.companyId}/operations/checklist/new`)
    } catch (error) {
      console.error("Error cloning job order:", error)
    }
  }

  // Handle loading state
  if (isLoading) {
    return <JobOrderDetailsSkeleton />
  }

  // Handle invalid jobOrderId format
  if (!isValidJobOrderId) {
    return (
      <JobOrderNotFound
        jobOrderId={jobOrderId}
        companyId={params.companyId as string}
      />
    )
  }

  // Handle error state - Job order not found in current company
  if (isError || !jobOrderResponse?.data) {
    return (
      <JobOrderNotFound
        jobOrderId={jobOrderId}
        companyId={params.companyId as string}
      />
    )
  }

  return (
   <div className="@container mx-auto space-y-2 px-2 pt-2 pb-4 sm:space-y-2 sm:px-4 sm:pt-2 sm:pb-4 lg:px-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                Checklist Details{" "}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          {jobOrderResponse?.data?.jobOrderNo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="flex h-8 items-center border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-4 text-sm font-semibold text-blue-800 shadow-sm transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:shadow-md dark:border-blue-700 dark:from-blue-900 dark:to-blue-800 dark:text-blue-200 dark:hover:from-blue-800 dark:hover:to-blue-700"
                  >
                    <span className="mr-1 text-blue-600">📋</span>
                    {`${jobOrderResponse?.data?.jobOrderNo} : v[${jobOrderResponse?.data?.editVersion}]`}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-3xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-xl">
                  <div className="space-y-4">
                    <div className="border-b-2 border-blue-200 pb-3">
                      <h4 className="text-lg font-bold text-blue-900">
                        Checklist Details
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          JobOrderNo:
                        </span>
                        <span className="font-medium text-gray-900">
                          {jobOrderResponse?.data?.jobOrderNo}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          Customer:
                        </span>
                        <span className="font-medium text-gray-900 break-words">
                          {jobOrderResponse?.data?.customerName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          Port:
                        </span>
                        <span className="font-medium text-gray-900">
                          {jobOrderResponse?.data?.portName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          Currency:
                        </span>
                        <span className="font-medium text-gray-900">
                          {jobOrderResponse?.data?.currencyName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          Job Date:
                        </span>
                        <span className="font-medium text-gray-900">
                          {jobOrderResponse?.data?.jobOrderDate
                            ? new Date(
                                jobOrderResponse.data.jobOrderDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          Vessel:
                        </span>
                        <span className="font-medium text-gray-900">
                          {jobOrderResponse?.data?.vesselName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          IMO:
                        </span>
                        <span className="font-medium text-gray-900">
                          {jobOrderResponse?.data?.imoCode || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          Last Port:
                        </span>
                        <span className="font-medium text-gray-900">
                          {jobOrderResponse?.data?.lastPortName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          Next Port:
                        </span>
                        <span className="font-medium text-gray-900">
                          {jobOrderResponse?.data?.nextPortName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-gray-50/50 p-2">
                        <span className="min-w-[100px] font-semibold text-gray-700">
                          Status:
                        </span>
                        <span className="font-medium text-gray-900">
                          {jobOrderResponse?.data?.jobStatusName || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {jobOrderResponse?.data?.jobStatusName && (
            <Badge
              className={`flex h-8 items-center border-2 px-4 text-sm font-semibold shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg ${statusColors[jobOrderResponse.data.jobStatusName as keyof typeof statusColors] || "border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300"}`}
            >
              <span className="mr-1">⚡</span>
              {jobOrderResponse.data.jobStatusName}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={jobOrderResponse?.data ? "default" : "secondary"}
            className="text-xs"
          >
            {jobOrderResponse?.data ? "Edit Mode" : "Create Mode"}
          </Badge>
        </div>
      </div>

      {/* ChecklistTabs Component */}
      <ChecklistTabs
        jobData={jobOrderResponse?.data as IJobOrderHd}
        onClone={handleClone}
        onUpdateSuccess={refetchJobOrder}
        canView={canView}
        canEdit={canEdit}
        canDelete={canDelete}
        canCreate={canCreate}
        canDebitNote={canDebitNote}
      />
    </div>
  )
}
