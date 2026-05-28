"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  canShowInvoicePost,
  canShowInvoicePreview,
  canShowJobSummaryPrint,
  isJobLocked,
  isJobStatusLocked,
} from "@/helpers/project"
import {
  IDebitNoteItem,
  IJobOrderHd,
  ISaveDebitNoteItem,
} from "@/interfaces/checklist"
import { IInvoicePreview } from "@/interfaces/invoice-preview"
import { useAuthStore } from "@/stores/auth-store"
import { useCompanyStore } from "@/stores/company-store"
import { usePermissionStore } from "@/stores/permission-store"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Building2,
  Edit3,
  Eye,
  FileText,
  Printer,
  Receipt,
  RefreshCcw,
  Trash,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { apiClient } from "@/lib/api-client"
import { JobOrder } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import { useGetJobOrderByIdNo } from "@/hooks/use-checklist"
import { useDelete } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CompanyAutocomplete,
  CompanyCustomerAutocomplete,
} from "@/components/autocomplete"
import { CloneConfirmation } from "@/components/confirmation/clone-confirmation"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import {
  InvoicePreviewDialog,
  normalizePreview,
} from "@/components/Operations/invoice-preview-dialog"

import { ChecklistDetailsForm } from "./checklist-details-form"
import { ChecklistHistory } from "./checklist-history"
import { ChecklistMain } from "./checklist-main"
import { ChecklistLog } from "./checklist-timeline"
import { TransportationTab } from "./checklist-transporation"
import { CloneChecklistSelectDialog } from "./clone-checklist-select-dialog"
import { DebitNoteItemsTable } from "./debit-note-items-table"

interface ChecklistTabsProps {
  jobData: IJobOrderHd
  onClone?: (clonedData: IJobOrderHd) => void
  onUpdateSuccess?: () => void
}

export function ChecklistTabs({
  jobData,
  onClone,
  onUpdateSuccess,
}: ChecklistTabsProps) {
  const params = useParams()
  const companyId = params.companyId as string
  const { user } = useAuthStore()
  const { decimals } = useCompanyStore()

  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.checklist
  const { hasPermission } = usePermissionStore()
  const _canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const _canDebitNote = hasPermission(moduleId, transactionId, "isDebitNote")

  const [activeTab, setActiveTab] = useState("main")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type:
      | "clone"
      | "update"
      | "cloneCompany"
      | "generateInvoice"
      | "deleteJobOrder"
    title: string
    message: string
  } | null>(null)
  const [formRef, setFormRef] = useState<HTMLFormElement | null>(null)

  // State for delete job order confirmation
  const [deleteJobOrderConfirmation, setDeleteJobOrderConfirmation] = useState<{
    isOpen: boolean
    jobOrderId: number | null
    jobOrderNo: string | null
  }>({
    isOpen: false,
    jobOrderId: null,
    jobOrderNo: null,
  })

  // Clone Company Dialog State
  const [showCloneCompanyDialog, setShowCloneCompanyDialog] = useState(false)
  const [showCloneCompanyConfirmDialog, setShowCloneCompanyConfirmDialog] =
    useState(false)
  const [showCloneSelectDialog, setShowCloneSelectDialog] = useState(false)
  const [pendingCloneServiceKeys, setPendingCloneServiceKeys] = useState<
    string[]
  >([])
  const [isCloning, setIsCloning] = useState(false)

  // Clone Company Form Schema
  const cloneCompanySchema = z.object({
    companyId: z.number().min(1, "Please select a company"),
    customerId: z.number().min(1, "Please select a customer"),
  })

  type CloneCompanyFormType = z.infer<typeof cloneCompanySchema>

  const cloneCompanyForm = useForm<CloneCompanyFormType>({
    resolver: zodResolver(cloneCompanySchema),
    defaultValues: {
      companyId: 0,
      customerId: 0,
    },
  })

  const selectedCompanyId = cloneCompanyForm.watch("companyId")

  // Debit Note Dialog State
  const [showDebitNoteDialog, setShowDebitNoteDialog] = useState(false)
  const [debitNoteData, setDebitNoteData] = useState<IDebitNoteItem[]>([])
  const [debitNoteLoading, setDebitNoteLoading] = useState(false)
  const [debitNoteSaving, setDebitNoteSaving] = useState(false)
  const [_debitNoteError, setDebitNoteError] = useState<string | null>(null)

  const [showInvoicePreview, setShowInvoicePreview] = useState(false)
  const [invoicePreview, setInvoicePreview] = useState<IInvoicePreview | null>(
    null
  )
  const [isLoadingInvoicePreview, setIsLoadingInvoicePreview] = useState(false)
  const [invoicePreviewError, setInvoicePreviewError] = useState<string | null>(
    null
  )

  // Fetch detailed job order data when jobData is available
  const jobOrderId = jobData?.jobOrderId?.toString() || ""

  const {
    data: detailedJobData,
    isLoading,
    error,
    refetch,
  } = useGetJobOrderByIdNo(jobOrderId)

  // Delete job order mutation
  const deleteJobOrderMutation = useDelete(`${JobOrder.delete}`)

  // Force refetch when component mounts or jobData changes
  // Removed refetch from dependencies to prevent infinite loops
  React.useEffect(() => {
    if (jobData?.jobOrderId && jobData?.jobOrderNo && !isLoading) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobData?.jobOrderId, jobData?.jobOrderNo])

  // Refetch data whenever activeTab changes (when user clicks on a tab)
  React.useEffect(() => {
    if (jobData?.jobOrderId && jobData?.jobOrderNo) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Check if detailed data is available and successful
  const isDetailedJobData = detailedJobData?.result === 1

  // Use detailed data if available and successful, otherwise fall back to original jobData
  const currentJobData = isDetailedJobData ? detailedJobData.data : jobData

  // ✅ SAFE: Check if currentJobData exists before accessing statusName
  const jobStatus = {
    jobStatusId: currentJobData?.jobStatusId,
    jobStatusName: currentJobData?.jobStatusName,
  }
  const isConfirmed = isJobLocked(jobStatus)
  const isPosted = isJobStatusLocked(jobStatus, currentJobData?.isPost)
  const allowInvoicePreviewButton = canShowInvoicePreview(jobStatus)
  const allowInvoicePostButton = canShowInvoicePost(
    jobStatus,
    currentJobData?.isPost
  )
  const allowJobSummaryPrint = canShowJobSummaryPrint(
    jobStatus,
    currentJobData?.isPost
  )

  // console.log("Original jobData:", jobData)
  // console.log("Detailed jobData:", detailedJobData)
  // console.log("Current jobData:", currentJobData)
  // console.log(isConfirmed, "isConfirmed checklist")

  // Handle loading and error states
  if (isLoading) {
    // console.log("Loading detailed job order data...")
  }

  if (error) {
    // console.error("Error fetching detailed job order:", error)
  }

  // Handle Print Checklist Report
  const handlePrint = (
    reportType:
      | "checklist"
      | "purchaseList"
      | "jobSummary"
      | "invoice" = "checklist"
  ) => {
    if (
      !currentJobData ||
      !currentJobData.jobOrderId ||
      currentJobData.jobOrderId === 0
    ) {
      toast.error("Please select a job order to print")
      return
    }

    const jobOrderId = currentJobData.jobOrderId?.toString() || "0"
    const jobOrderNo = currentJobData.jobOrderNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Determine report file and build parameters based on type
    let reportFile = "checklist/Checklist.trdp"
    let reportParams: Record<string, string | number> = {}

    switch (reportType) {
      case "checklist":
        reportFile = "checklist/Checklist.trdp"
        // Build report parameters - same structure as ar/report
        reportParams = {
          companyId: companyId,
          jobOrderId: jobOrderId,
          jobOrderNo: jobOrderNo,
          amtDec: amtDec,
          locAmtDec: locAmtDec,
          userName: user?.userName || "",
        }
        break
      case "purchaseList":
        reportFile = "checklist/PurchaseList.trdp"
        // Build report parameters - same structure as ar/report
        reportParams = {
          companyId: companyId,
          jobOrderId: jobOrderId,
          jobOrderNo: jobOrderNo,
          amtDec: amtDec,
          locAmtDec: locAmtDec,
          userName: user?.userName || "",
        }
        break
      case "jobSummary":
        if (!allowJobSummaryPrint) {
          toast.error(
            "Job Summary is available only after the invoice has been posted."
          )
          return
        }
        reportFile = "checklist/JobSummary.trdp"
        // Build report parameters - same structure as ar/report
        reportParams = {
          companyId: companyId,
          jobOrderId: jobOrderId,
          jobOrderNo: jobOrderNo,
          amtDec: amtDec,
          locAmtDec: locAmtDec,
          userName: user?.userName || "",
        }
        break
      case "invoice":
        reportFile = "ar/ArInvoice.trdp"
        // For invoice, we need invoiceId and invoiceNo instead (same as ar/report)
        if (currentJobData.invoiceId && currentJobData.invoiceNo) {
          reportParams = {
            companyId: companyId,
            invoiceId: currentJobData.invoiceId,
            invoiceNo: currentJobData.invoiceNo,
            reportType: 2,
            userName: user?.userName || "",
            amtDec: amtDec,
            locAmtDec: locAmtDec,
          }
        } else {
          toast.error("Invoice not available for this job order")
          return
        }
        break
    }

    console.log("reportParams", reportParams)

    // Store report data in sessionStorage
    const reportData = {
      reportFile: reportFile,
      parameters: reportParams,
    }

    try {
      localStorage.setItem(
        `report_window_${companyId}`,
        JSON.stringify(reportData)
      )

      // Open in a new window (not tab) with specific features
      const windowFeatures =
        "width=1200,height=800,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes"
      const viewerUrl = `/${companyId}/reports/window`
      window.open(viewerUrl, "_blank", windowFeatures)
    } catch (error) {
      console.error("Error opening report:", error)
      toast.error("Failed to open report")
    }
  }

  const handleClone = () => {
    // Create a new job order with the same data but reset certain fields
    const clonedData = {
      ...currentJobData,
      jobOrderId: 0, // Reset ID for new record
      jobOrderNo: "", // Reset job order number
      jobOrderDate: formatDateForApi(new Date()) || "", // Set to today in yyyy-MM-dd format
      editVersion: 0, // Reset edit version
      // Add any other fields that should be reset for a new record
    }

    // Update the parent component to handle the clone
    if (onClone) {
      // Pass the cloned data back to parent
      // console.log("Cloning job order:", clonedData)
      onClone(clonedData)
    }
  }

  const handleCloneCompany = async () => {
    const formValues = cloneCompanyForm.getValues()

    if (!formValues.companyId || !formValues.customerId) {
      toast.error("Please select both company and customer")
      return
    }

    if (!currentJobData?.jobOrderId) {
      toast.error("Invalid job order data")
      return
    }

    setIsCloning(true)
    try {
      // Prepare clone request data according to API specification
      const cloneData = {
        fromJobOrderId: currentJobData.jobOrderId,
        toCompanyId: formValues.companyId as number,
        toCustomerId: formValues.customerId,
        ...(pendingCloneServiceKeys.length > 0
          ? { selectedServiceKeys: pendingCloneServiceKeys.join(",") }
          : {}),
      }

      const response = await apiClient.post(JobOrder.cloneChecklist, cloneData)

      if (response.data.result === 1) {
        // Check if response is successful
        // Extract job order data from response
        const jobOrderData = Array.isArray(response.data.data)
          ? response.data.data[0]
          : response.data.data

        const newJobOrderId = (jobOrderData as IJobOrderHd)?.jobOrderId

        if (newJobOrderId) {
          toast.success(
            response.data.message ||
              "Job order cloned to different company successfully!"
          )

          // Close dialogs
          setShowCloneCompanyDialog(false)
          setShowCloneCompanyConfirmDialog(false)
          setShowCloneSelectDialog(false)
          setPendingCloneServiceKeys([])
          cloneCompanyForm.reset()

          // Create URL and open in new tab
          const newUrl = `/${formValues.companyId}/operations/checklist/${newJobOrderId}`
          window.open(newUrl, "_blank")
        } else {
          toast.error("Failed to get new job order ID")
        }
      } else {
        toast.error(response.data.message || "Failed to clone job order")
      }
    } catch (error) {
      console.error("Error cloning job order to different company:", error)
      toast.error("Failed to clone job order. Please try again.")
    } finally {
      setIsCloning(false)
    }
  }

  const handleFormSubmit = () => {
    // console.log("handleFormSubmit called, formRef:", formRef)
    if (formRef) {
      // console.log("Calling formRef.requestSubmit()")
      formRef.requestSubmit()
    } else {
      // console.error("formRef is null, cannot submit form")
    }
  }

  // Debit Note Functions
  const fetchDebitNoteData = useCallback(async () => {
    if (!jobOrderId) return

    setDebitNoteLoading(true)
    setDebitNoteError(null)

    try {
      const response = await apiClient.get(
        `/operations/GetDebitNote/${jobOrderId}`
      )
      if (response.data.result === 1) {
        const data = response.data.data || []
        setDebitNoteData(data)
      } else {
        setDebitNoteError("Failed to fetch debit note data")
      }
    } catch (_err) {
      // console.error("Error fetching debit note data:", _err)
      setDebitNoteError("Error fetching debit note data")
    } finally {
      setDebitNoteLoading(false)
    }
  }, [jobOrderId])

  const saveDebitNoteData = async () => {
    if (!debitNoteData.length) return

    setDebitNoteSaving(true)
    setDebitNoteError(null)

    try {
      const saveData: ISaveDebitNoteItem[] = debitNoteData.map((item) => ({
        debitNoteId: item.debitNoteId,
        debitNoteNo: item.debitNoteNo,
        itemNo: item.itemNo,
        updatedItemNo: item.updatedItemNo,
        updatedDebitNoteNo: item.updatedDebitNoteNo,
      }))

      const response = await apiClient.post(
        "/operations/SaveDebitNoteItemNo",
        saveData
      )
      if (response.data.result > 0) {
        // console.log("Debit note data saved successfully")
        toast.success("Debit note data saved successfully")
        setShowDebitNoteDialog(false)
        // Refresh the details tab and main data
        refetch()
      } else {
        setDebitNoteError("Failed to save debit note data")
        toast.error("Failed to save debit note data")
        // Refresh even on error to show current state
        refetch()
      }
    } catch (_err) {
      // console.error("Error saving debit note data:", _err)
      setDebitNoteError("Error saving debit note data")
      toast.error("Error saving debit note data")
      // Refresh even on error to show current state
      refetch()
    } finally {
      setDebitNoteSaving(false)
    }
  }

  const canPostInvoice = allowInvoicePostButton

  const handlePreviewInvoice = useCallback(async () => {
    if (!currentJobData?.jobOrderId) {
      toast.error("Invalid job order data")
      return
    }

    setShowInvoicePreview(true)
    setIsLoadingInvoicePreview(true)
    setInvoicePreviewError(null)
    setInvoicePreview(null)

    try {
      const response = await apiClient.get(
        `/operations/GetPreviewInvoiceByJobOrderId/${currentJobData.jobOrderId}`
      )
      if (response.data.result === 1) {
        const parsed = normalizePreview(response.data.data)
        if (parsed) {
          setInvoicePreview(parsed)
        } else {
          setInvoicePreviewError("Could not read invoice preview data")
        }
      } else {
        setInvoicePreviewError(
          response.data.message || "Failed to load preview"
        )
      }
    } catch (error) {
      console.error("Error loading invoice preview:", error)
      setInvoicePreviewError("An error occurred while loading invoice preview")
    } finally {
      setIsLoadingInvoicePreview(false)
    }
  }, [currentJobData?.jobOrderId])

  const handleGenerateInvoice = useCallback(async () => {
    if (!currentJobData?.jobOrderId) {
      toast.error("Invalid job order data")
      return
    }

    try {
      const response = await apiClient.get(
        `/operations/GetGenerateInvoiceByJobOrderId/${currentJobData.jobOrderId}`
      )

      if (response.data.result === 1) {
        toast.success(response.data.message || "Invoice generated successfully")
        setShowInvoicePreview(false)
        refetch()
        onUpdateSuccess?.()
      } else {
        toast.error(response.data.message || "Failed to generate invoice")
      }
    } catch (error) {
      console.error("Error generating invoice:", error)
      toast.error("An error occurred while generating invoice")
    }
  }, [currentJobData?.jobOrderId, refetch, onUpdateSuccess])

  // Handle delete job order confirmation
  const handleConfirmDeleteJobOrder = useCallback(async () => {
    if (!deleteJobOrderConfirmation.jobOrderId) {
      return
    }

    try {
      const response = await deleteJobOrderMutation.mutateAsync(
        deleteJobOrderConfirmation.jobOrderId.toString()
      )

      if (response && response.result === 1) {
        toast.success(response.message || "Job order deleted successfully")
        // Refetch and navigate or refresh
        refetch()
        onUpdateSuccess?.()
        // Optionally navigate back to checklist list
        // router.push(`/${companyId}/operations/checklist`)
      } else {
        toast.error(response?.message || "Failed to delete job order")
      }
    } catch (error) {
      console.error("Error deleting job order:", error)
      toast.error("An error occurred while deleting job order")
    } finally {
      setDeleteJobOrderConfirmation({
        isOpen: false,
        jobOrderId: null,
        jobOrderNo: null,
      })
    }
  }, [
    deleteJobOrderConfirmation.jobOrderId,
    deleteJobOrderMutation,
    refetch,
    onUpdateSuccess,
  ])

  // Load data when dialog opens
  useEffect(() => {
    if (showDebitNoteDialog && jobOrderId) {
      fetchDebitNoteData()
    }
  }, [showDebitNoteDialog, jobOrderId, fetchDebitNoteData])

  // Debit Note Table Handlers
  const handleDebitNoteRefresh = useCallback(() => {
    if (jobOrderId) {
      fetchDebitNoteData()
    }
  }, [jobOrderId, fetchDebitNoteData])

  const handleDebitNoteFilterChange = useCallback(() => {
    // No-op for this table
  }, [])

  const handleDebitNoteSelect = useCallback(() => {
    // No-op for this table
  }, [])

  const handleDebitNoteCreate = useCallback(() => {
    // No-op for this table
  }, [])

  const handleDebitNoteEdit = useCallback(() => {
    // No-op for this table
  }, [])

  const handleDebitNoteDelete = useCallback(() => {
    // No-op for this table
  }, [])

  const handleDebitNoteBulkDelete = useCallback(() => {
    // No-op for this table
  }, [])

  const handleDebitNoteDataReorder = useCallback(
    (newData: IDebitNoteItem[]) => {
      // Update the local state with the reordered data
      setDebitNoteData(newData)
    },
    []
  )

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="flex gap-2">
            <TabsTrigger value="main">
              <div className="flex items-center gap-1">
                <span className="text-xs">📋</span>
                <span className="text-xs sm:text-sm">Summary</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="details">
              <div className="flex items-center gap-1">
                <span className="text-xs">📊</span>
                <span className="text-xs sm:text-sm">Services</span>
              </div>
            </TabsTrigger>
            {/* <TabsTrigger value="documents">
              <div className="flex items-center gap-1">
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Documents</span>
              </div>
            </TabsTrigger> */}
            <TabsTrigger value="transportation">
              <div className="flex items-center gap-1">
                <span className="text-xs">🚚</span>
                <span className="text-xs sm:text-sm">Transportation</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="history">
              <div className="flex items-center gap-1">
                <span className="text-xs">🕒</span>
                <span className="text-xs sm:text-sm">History</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="logs">
              <div className="flex items-center gap-1">
                <span className="text-xs">⏱️</span>
                <span className="text-xs sm:text-sm">Timeline</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Action Buttons - Right side */}
        <div className="ml-4 flex items-center gap-2">
          {/* Print button */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Printer className="mr-1 h-4 w-4" />
                Print
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePrint("checklist")}>
                Checklist
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint("purchaseList")}>
                Purchase List
              </DropdownMenuItem>
              {allowJobSummaryPrint && (
                <DropdownMenuItem onClick={() => handlePrint("jobSummary")}>
                  Job Summary
                </DropdownMenuItem>
              )}
              {allowJobSummaryPrint &&
                currentJobData?.invoiceId &&
                Number(currentJobData.invoiceId) > 0 && (
                  <DropdownMenuItem onClick={() => handlePrint("invoice")}>
                    Invoice Print
                  </DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Debit Note No. Button - only show on Services tab */}
          {activeTab === "details" && (
            <Button
              variant="outline"
              size="sm"
              title="Re-Arrange Debit Note No."
              disabled={isConfirmed}
              onClick={() => {
                setShowDebitNoteDialog(true)
              }}
            >
              <Receipt className="mr-1 h-4 w-4" />
            </Button>
          )}

          {allowInvoicePreviewButton && (
            <Button variant="outline" size="sm" onClick={handlePreviewInvoice}>
              <Eye className="mr-1 h-4 w-4" />
              Preview Invoice
            </Button>
          )}
          {allowInvoicePostButton && (
            <Button
              variant="outline"
              size="sm"
              disabled={!canPostInvoice}
              onClick={() => {
                setConfirmAction({
                  type: "generateInvoice",
                  title: "Generate Invoice",
                  message: `Are you sure you want to generate an invoice for Job Order ${currentJobData?.jobOrderNo || ""}? This action cannot be undone.`,
                })
                setShowConfirmDialog(true)
              }}
            >
              <FileText className="mr-1 h-4 w-4" />
              Post Invoice
            </Button>
          )}

          {/* Refresh button */}
          <Button
            title="Refresh"
            variant="outline"
            size="sm"
            onClick={() => {
              // console.log("Manual refresh triggered")
              refetch()
            }}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>

          {/* Clone button - only show in edit mode and if user has create permission
          <Button
            title="Clone"
            variant="outline"
            size="sm"
            onClick={() => {
              setConfirmAction({
                type: "clone",
                title: "Clone Record",
                message:
                  "Do you want to clone this job order? A new record will be created.",
              })
              setShowConfirmDialog(true)
            }}
          >
            <Copy className="h-4 w-4" />
          </Button> */}

          {/* Clone Company button - only show if user has create permission */}
          {canCreate && (
            <Button
              title="Clone to Any Company"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCloneCompanyDialog(true)
              }}
            >
              <Building2 className="h-4 w-4" />
            </Button>
          )}

          {/* Delete Job Order Button - only show if user has edit permission and Summary tab is active and invoiceId is 0 and isPost is false */}
          {canEdit &&
            activeTab === "main" &&
            isConfirmed === false &&
            canDelete === true && (
              <Button
                size="sm"
                variant="destructive"
                disabled={isConfirmed}
                onClick={() => {
                  setConfirmAction({
                    type: "deleteJobOrder",
                    title: "Delete Job Order",
                    message: "Do you want to delete this job order?",
                  })
                  setShowConfirmDialog(true)
                }}
              >
                <Trash className="mr-1 h-4 w-4" />
                Delete
              </Button>
            )}

          {/* Submit/Update Button - only show if user has edit permission and Summary tab is active */}
          {canEdit && activeTab === "main" && (
            <Button
              size="sm"
              disabled={isPosted}
              onClick={() => {
                setConfirmAction({
                  type: "update",
                  title: "Update Job Order",
                  message: "Do you want to update this job order?",
                })
                setShowConfirmDialog(true)
              }}
            >
              <Edit3 className="mr-1 h-4 w-4" />
              Update
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsContent value="main" className="mt-0">
          <ChecklistMain
            jobData={currentJobData}
            setFormRef={setFormRef}
            isConfirmed={isConfirmed}
            isPosted={isPosted}
            onUpdateSuccess={() => {
              // Refetch data in ChecklistTabs
              refetch()
              // Refetch data in page.tsx (parent component)
              if (onUpdateSuccess) {
                onUpdateSuccess()
              }
            }}
          />
        </TabsContent>

        <TabsContent value="details" className="mt-0">
          <ChecklistDetailsForm
            jobData={currentJobData}
            isConfirmed={isConfirmed}
          />
        </TabsContent>

        <TabsContent
          value="transportation"
          className="mt-0 flex min-h-0 flex-col"
        >
          <TransportationTab
            jobData={currentJobData}
            moduleId={1}
            transactionId={1}
            onTaskAdded={() => {
              refetch()
              if (onUpdateSuccess) {
                onUpdateSuccess()
              }
            }}
            isConfirmed={isConfirmed}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <ChecklistHistory jobData={currentJobData} />
        </TabsContent>

        <TabsContent value="logs" className="mt-0">
          <ChecklistLog
            jobData={currentJobData}
            isConfirmed={isConfirmed}
            activeTab={activeTab}
          />
        </TabsContent>
      </Tabs>

      <InvoicePreviewDialog
        open={showInvoicePreview}
        onOpenChange={setShowInvoicePreview}
        preview={invoicePreview}
        isLoading={isLoadingInvoicePreview}
        loadError={invoicePreviewError}
        companyId={companyId}
        userName={user?.userName || ""}
        amtDec={decimals[0]?.amtDec || 2}
        locAmtDec={decimals[0]?.locAmtDec || 2}
      />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction?.title}</DialogTitle>
            <DialogDescription>{confirmAction?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              No
            </Button>
            <Button
              onClick={() => {
                if (confirmAction) {
                  // console.log(`${confirmAction.type} confirmed`)

                  switch (confirmAction.type) {
                    case "clone":
                      handleClone()
                      break
                    case "update":
                      handleFormSubmit()
                      // Always refetch after update button is clicked
                      refetch()
                      break
                    case "cloneCompany":
                      setShowCloneCompanyConfirmDialog(true)
                      break
                    case "generateInvoice":
                      handleGenerateInvoice()
                      break
                    case "deleteJobOrder":
                      // Open delete confirmation dialog
                      setDeleteJobOrderConfirmation({
                        isOpen: true,
                        jobOrderId: currentJobData?.jobOrderId || null,
                        jobOrderNo: currentJobData?.jobOrderNo || null,
                      })
                      break
                  }
                }
                setShowConfirmDialog(false)
              }}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone Company Dialog */}
      <Dialog
        open={showCloneCompanyDialog}
        onOpenChange={(open) => {
          setShowCloneCompanyDialog(open)
          if (!open) {
            cloneCompanyForm.reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone to Different Company</DialogTitle>
            <DialogDescription>
              Select the target company and customer to clone this job order.
            </DialogDescription>
          </DialogHeader>
          <Form {...cloneCompanyForm}>
            <form className="space-y-4">
              <CompanyAutocomplete
                form={cloneCompanyForm}
                name="companyId"
                label="Company"
                isRequired
              />
              <CompanyCustomerAutocomplete
                form={cloneCompanyForm}
                name="customerId"
                label="Customer"
                companyId={selectedCompanyId || undefined}
                isRequired
                isDisabled={!selectedCompanyId}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCloneCompanyDialog(false)
                cloneCompanyForm.reset()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const formValues = cloneCompanyForm.getValues()
                if (!formValues.companyId || !formValues.customerId) {
                  toast.error("Please select both company and customer")
                  return
                }
                setShowCloneCompanyDialog(false)
                setShowCloneSelectDialog(true)
              }}
              disabled={isCloning}
            >
              Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CloneChecklistSelectDialog
        open={showCloneSelectDialog}
        jobOrderId={currentJobData?.jobOrderId ?? 0}
        initialSelectedKeys={pendingCloneServiceKeys}
        onOpenChange={setShowCloneSelectDialog}
        onBack={() => {
          setShowCloneSelectDialog(false)
          setShowCloneCompanyDialog(true)
        }}
        onNext={(keys) => {
          setPendingCloneServiceKeys(keys)
          setShowCloneSelectDialog(false)
          setShowCloneCompanyConfirmDialog(true)
        }}
      />

      <CloneConfirmation
        open={showCloneCompanyConfirmDialog}
        onOpenChange={(open) => {
          setShowCloneCompanyConfirmDialog(open)
          if (!open) setPendingCloneServiceKeys([])
        }}
        title="Confirm Clone"
        skipDefaultPrompt
        description={`Are you sure you want to clone this job order to the selected company${
          pendingCloneServiceKeys.length > 0
            ? ` with ${pendingCloneServiceKeys.length} service line(s)`
            : ""
        }? A new job order will be created and opened in a new tab.`}
        onBack={() => {
          setShowCloneCompanyConfirmDialog(false)
          setShowCloneSelectDialog(true)
        }}
        onCancelAction={() => setPendingCloneServiceKeys([])}
        onConfirm={handleCloneCompany}
        isCloning={isCloning}
        confirmLabel="Yes, Clone"
        closeOnConfirm={false}
      />

      {/* Debit Note Dialog */}
      <Dialog open={showDebitNoteDialog} onOpenChange={setShowDebitNoteDialog}>
        <DialogContent className="max-h-[90vh] w-[80vw] max-w-none! overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debit Note Details</DialogTitle>
            <DialogDescription>
              Manage debit note number and item number for this job order.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <DebitNoteItemsTable
              data={debitNoteData}
              isLoading={debitNoteLoading}
              onRefreshAction={handleDebitNoteRefresh}
              onFilterChange={handleDebitNoteFilterChange}
              onSelect={handleDebitNoteSelect}
              onCreateAction={handleDebitNoteCreate}
              onEditAction={handleDebitNoteEdit}
              onDeleteAction={handleDebitNoteDelete}
              onBulkDeleteAction={handleDebitNoteBulkDelete}
              onDataReorder={handleDebitNoteDataReorder}
              moduleId={parseInt(jobOrderId) || 0}
              transactionId={parseInt(jobOrderId) || 0}
              isConfirmed={isConfirmed}
            />
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowDebitNoteDialog(false)}
              >
                Close
              </Button>
              <Button
                onClick={saveDebitNoteData}
                disabled={
                  debitNoteSaving ||
                  debitNoteLoading ||
                  debitNoteData.length === 0
                }
              >
                {debitNoteSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Job Order Confirmation */}
      <DeleteConfirmation
        open={deleteJobOrderConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteJobOrderConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Job Order"
        description="This action cannot be undone. This will permanently delete the job order from our servers."
        itemName={
          deleteJobOrderConfirmation.jobOrderNo
            ? `Job Order ${deleteJobOrderConfirmation.jobOrderNo}`
            : "Job Order"
        }
        onConfirm={handleConfirmDeleteJobOrder}
        onCancelAction={() =>
          setDeleteJobOrderConfirmation({
            isOpen: false,
            jobOrderId: null,
            jobOrderNo: null,
          })
        }
        isDeleting={deleteJobOrderMutation.isPending}
      />
    </div>
  )
}
