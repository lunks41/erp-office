"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  canShowInvoicePost,
  canShowInvoicePreview,
  canShowJobSummaryPrint,
  isJobLocked,
  isJobStatusLocked,
} from "@/helpers/project"
import { ITallyService } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { useCompanyStore } from "@/stores/company-store"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"
import { IInvoicePreview } from "@/interfaces/invoice-preview"
import { Eye, FileText, Printer } from "lucide-react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api-client"
import { TallyService } from "@/lib/api-routes"
import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import { useGetById, usePersist } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
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
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import {
  InvoicePreviewDialog,
  normalizePreview,
} from "@/components/Operations/invoice-preview-dialog"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { TallyServiceForm } from "./tally-service-form"
import {
  extractRows,
  mapTallyServiceForSave,
  normalizeTallyService,
} from "./tally-service-utils"

const FORM_ID = "tally-service-form"
const INVOICE_BADGE_CLASS =
  "px-3 py-1.5 text-xs font-semibold leading-none shadow-sm transition-colors duration-200"

const STATUS_BADGE_COLORS: Record<string, string> = {
  Pending:
    "border-amber-300 bg-linear-to-r from-amber-50 to-yellow-100 text-amber-800 hover:from-amber-100 hover:to-yellow-200",
  Completed:
    "border-emerald-300 bg-linear-to-r from-emerald-50 to-green-100 text-emerald-800 hover:from-emerald-100 hover:to-green-200",
  Cancelled:
    "border-red-300 bg-linear-to-r from-red-50 to-rose-100 text-red-800 hover:from-red-100 hover:to-rose-200",
  "Cancel with Service":
    "border-orange-300 bg-linear-to-r from-orange-50 to-amber-100 text-orange-800 hover:from-orange-100 hover:to-amber-200",
  Confirmed:
    "border-border bg-linear-to-r from-blue-50 to-indigo-100 text-primary hover:from-blue-100 hover:to-indigo-200",
}

interface TallyServiceDetailPageProps {
  mode: "create" | "edit"
  tallyServiceId?: string
}

export function TallyServiceDetailPage({
  mode,
  tallyServiceId,
}: TallyServiceDetailPageProps) {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const numericCompanyId = Number(companyId) || 0
  const queryClient = useQueryClient()
  const { hasPermission } = usePermissionStore()
  const { decimals } = useCompanyStore()
  const { user } = useAuthStore()

  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.tallyService
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const isPermissionReadOnly =
    mode === "edit" ? !canEdit : !canCreate

  const isValidId =
    mode === "edit" && !!tallyServiceId && /^\d+$/.test(tallyServiceId)

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetById<ITallyService>(
    TallyService.getById,
    "tallyService",
    isValidId ? tallyServiceId! : "",
    { enabled: isValidId }
  )

  const saveMutation = usePersist<ITallyService>(TallyService.add)
  const [hasRequiredServiceLine, setHasRequiredServiceLine] = useState(false)
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: ITallyService | null
  }>({ isOpen: false, data: null })
  const [showPostInvoiceConfirm, setShowPostInvoiceConfirm] = useState(false)
  const [isPostingInvoice, setIsPostingInvoice] = useState(false)
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)
  const [invoicePreview, setInvoicePreview] = useState<IInvoicePreview | null>(
    null
  )
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const tallyService = useMemo(() => {
    if (mode === "create") return undefined
    const rows = extractRows(response?.data)
    return normalizeTallyService(rows[0], numericCompanyId)
  }, [mode, numericCompanyId, response?.data])

  const jobStatus = {
    jobStatusId: tallyService?.jobStatusId,
    jobStatusName: tallyService?.jobStatusName,
  }
  const isConfirmed = isJobLocked(jobStatus)
  const isPosted = isJobStatusLocked(jobStatus, tallyService?.isPost)
  const allowInvoicePreviewButton = canShowInvoicePreview(jobStatus)
  const allowInvoicePostButton = canShowInvoicePost(
    jobStatus,
    tallyService?.isPost
  )
  const allowJobSummaryPrint = canShowJobSummaryPrint(
    jobStatus,
    tallyService?.isPost
  )

  const isFieldsLocked = mode === "edit" && isConfirmed
  const isReadOnly = isPermissionReadOnly

  const hasPostedInvoice =
    Number(tallyService?.invoiceId ?? 0) > 0 && tallyService?.isPost === true

  const canPostInvoice =
    mode === "edit" &&
    allowInvoicePostButton &&
    !isPermissionReadOnly &&
    !tallyService?.isCancel

  const handleInvoiceNoDoubleClick = useCallback(() => {
    const invoiceId = tallyService?.invoiceId
    if (
      !companyId ||
      invoiceId === undefined ||
      invoiceId === null ||
      Number(invoiceId) <= 0
    ) {
      return
    }
    const docId = String(invoiceId).trim()
    if (!docId) return
    const targetPath = `/${companyId}/ar/invoice`
    const storageKey = `history-doc:${targetPath}`
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, docId)
      window.open(targetPath, "_blank", "noopener,noreferrer")
    }
  }, [companyId, tallyService?.invoiceId])

  const handlePrintInvoice = useCallback(() => {
    if (
      !tallyService?.invoiceId ||
      !tallyService.invoiceNo ||
      Number(tallyService.invoiceId) <= 0
    ) {
      toast.error("Invoice not available for this tally service")
      return
    }

    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2
    const reportData = {
      reportFile: "ar/ArInvoice.trdp",
      parameters: {
        companyId,
        invoiceId: tallyService.invoiceId,
        invoiceNo: tallyService.invoiceNo,
        reportType: 2,
        userName: user?.userName || "",
        amtDec,
        locAmtDec,
      },
    }

    try {
      localStorage.setItem(
        `report_window_${companyId}`,
        JSON.stringify(reportData)
      )
      window.open(
        `/${companyId}/reports/window`,
        "_blank",
        "width=1200,height=800,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes"
      )
    } catch {
      toast.error("Failed to open report")
    }
  }, [companyId, decimals, tallyService, user?.userName])

  const handlePreviewInvoice = useCallback(async () => {
    if (!tallyService?.tallyServiceId) {
      toast.error("Invalid tally service data")
      return
    }

    setShowInvoicePreview(true)
    setIsLoadingPreview(true)
    setPreviewError(null)
    setInvoicePreview(null)

    try {
      const response = await apiClient.get(
        `${TallyService.previewInvoice}/${tallyService.tallyServiceId}`
      )
      if (response.data.result === 1) {
        const parsed = normalizePreview(response.data.data)
        if (parsed) {
          setInvoicePreview(parsed)
        } else {
          setPreviewError("Could not read invoice preview data")
        }
      } else {
        setPreviewError(response.data.message || "Failed to load preview")
      }
    } catch {
      setPreviewError("An error occurred while loading invoice preview")
    } finally {
      setIsLoadingPreview(false)
    }
  }, [tallyService?.tallyServiceId])

  const handleGenerateInvoice = useCallback(async () => {
    if (!tallyService?.tallyServiceId) {
      toast.error("Invalid tally service data")
      return
    }

    setIsPostingInvoice(true)
    try {
      const response = await apiClient.get(
        `${TallyService.generateInvoice}/${tallyService.tallyServiceId}`
      )
      if (response.data.result === 1) {
        toast.success(response.data.message || "Invoice generated successfully")
        await queryClient.invalidateQueries({ queryKey: ["tallyService"] })
        await queryClient.invalidateQueries({ queryKey: ["tallyServices"] })
        refetch()
        setShowPostInvoiceConfirm(false)
        setShowInvoicePreview(false)
      } else {
        toast.error(response.data.message || "Failed to generate invoice")
      }
    } catch {
      toast.error("An error occurred while generating invoice")
    } finally {
      setIsPostingInvoice(false)
    }
  }, [queryClient, refetch, tallyService?.tallyServiceId])

  const handlePostFromPreview = useCallback(() => {
    setShowPostInvoiceConfirm(true)
  }, [])

  const handleSaveRequest = (data: ITallyService) => {
    setSaveConfirmation({ isOpen: true, data })
  }

  const handleSaveConfirm = async () => {
    if (!saveConfirmation.data) return

    try {
      const payload = mapTallyServiceForSave(saveConfirmation.data)
      const result = await saveMutation.mutateAsync(
        payload as unknown as Partial<ITallyService>
      )
      const savedRows = extractRows<ITallyService>(result?.data)
      const savedId =
        savedRows[0]?.tallyServiceId ?? payload.tallyServiceId ?? 0

      if (result?.result === 1) {
        await queryClient.invalidateQueries({ queryKey: ["tallyServices"] })
        setSaveConfirmation({ isOpen: false, data: null })

        if (mode === "create" && savedId > 0) {
          router.push(`/${companyId}/operations/tallyservice/${savedId}`)
        } else {
          await queryClient.invalidateQueries({ queryKey: ["tallyService"] })
          refetch()
        }
        return
      }

      toast.error(result?.message || "Failed to save tally service.")
    } catch {
      toast.error("Failed to save tally service. Please try again.")
    }
  }

  const handleCancel = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push(`/${companyId}/operations/tallyservice`)
  }

  if (mode === "edit" && !isValidId) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive text-sm">Invalid tally service id.</p>
        <Button className="mt-4" variant="outline" onClick={handleCancel}>
          Back to list
        </Button>
      </div>
    )
  }

  if (mode === "edit" && isLoading) {
    return <DataTableSkeleton columnCount={6} filterCount={0} shrinkZero />
  }

  if (mode === "edit" && (isError || !tallyService)) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive text-sm">Tally service not found.</p>
        <Button className="mt-4" variant="outline" onClick={handleCancel}>
          Back to list
        </Button>
      </div>
    )
  }

  const title =
    mode === "create"
      ? "Create Tally Service"
      : `Tally Service${tallyService?.tallyServiceId ? ` #${tallyService.tallyServiceId}` : ""}`

  return (
    <div className="@container mx-auto space-y-3 px-4 pt-2 pb-6 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <span className="text-lg">⚓</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">
              {mode === "create"
                ? "Fill in the details to create a new tally service."
                : "View and update tally service details."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && tallyService && (
            <Badge variant="outline" className="px-3 py-1.5 text-xs font-semibold">
              #{tallyService.tallyServiceId}
              {tallyService.editVersion != null
                ? ` · v${tallyService.editVersion}`
                : ""}
            </Badge>
          )}

          {mode === "edit" && tallyService?.jobStatusName && (
            <Badge
              className={`flex h-8 items-center border-2 px-4 text-sm font-semibold shadow-sm ${STATUS_BADGE_COLORS[tallyService.jobStatusName] || "border-gray-300 bg-linear-to-r from-gray-100 to-gray-200 text-gray-800"}`}
            >
              <span className="mr-1">⚡</span>
              {tallyService.jobStatusName}
            </Badge>
          )}

          {hasPostedInvoice && (
            <Badge
              variant="outline"
              className="flex h-8 items-center border-2 border-green-300 bg-green-100 px-4 text-sm font-semibold text-green-800"
            >
              Posted
            </Badge>
          )}

          {mode === "edit" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Printer className="mr-1 h-4 w-4" />
                  Print
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {allowJobSummaryPrint &&
                Number(tallyService?.invoiceId ?? 0) > 0 ? (
                  <DropdownMenuItem onClick={handlePrintInvoice}>
                    Invoice Print
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    Invoice not posted yet
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {mode === "edit" && allowInvoicePreviewButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={tallyService?.isCancel}
              onClick={handlePreviewInvoice}
            >
              <Eye className="mr-1 h-4 w-4" />
              Preview Invoice
            </Button>
          )}
          {mode === "edit" && allowInvoicePostButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canPostInvoice || isPostingInvoice}
              onClick={() => setShowPostInvoiceConfirm(true)}
            >
              <FileText className="mr-1 h-4 w-4" />
              Post Invoice
            </Button>
          )}

          {mode === "edit" && tallyService?.invoiceNo && (
            <Badge
              variant="outline"
              role="button"
              tabIndex={0}
              className={`${INVOICE_BADGE_CLASS} border-border bg-card text-primary cursor-pointer hover:bg-blue-100`}
              title="Double-click to open AR Invoice"
              onDoubleClick={handleInvoiceNoDoubleClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleInvoiceNoDoubleClick()
                }
              }}
            >
              Invoice No: {tallyService.invoiceNo}
            </Badge>
          )}

          <Button type="button" variant="outline" onClick={handleCancel}>
            {isPermissionReadOnly || isPosted ? "Close" : "Cancel"}
          </Button>
          {!isPermissionReadOnly && !isPosted && (
            <Button
              type="submit"
              form={FORM_ID}
              disabled={
                saveMutation.isPending ||
                !hasRequiredServiceLine
              }
              title={
                !hasRequiredServiceLine
                  ? "Add at least one freshwater line (charge + UOM) or one launch line (charge) on the Service tab"
                  : undefined
              }
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </div>

      <TallyServiceForm
        companyId={numericCompanyId}
        initialData={tallyService}
        mode={
          isReadOnly ? "view" : mode === "create" ? "create" : "edit"
        }
        isFieldsLocked={isFieldsLocked}
        isJobStatusLocked={isPosted}
        submitAction={handleSaveRequest}
        onCancelAction={handleCancel}
        isSubmitting={saveMutation.isPending}
        formId={FORM_ID}
        hideActions
        onSaveEligibilityChange={setHasRequiredServiceLine}
      />

      <SaveConfirmation
        open={saveConfirmation.isOpen}
        closeOnConfirm={false}
        onOpenChange={(isOpen) => {
          if (!saveMutation.isPending) {
            setSaveConfirmation((prev) => ({ ...prev, isOpen }))
            if (!isOpen) {
              setSaveConfirmation((prev) => ({ ...prev, data: null }))
            }
          }
        }}
        title={
          mode === "create" ? "Create Tally Service" : "Update Tally Service"
        }
        itemName={
          saveConfirmation.data?.tallyServiceId
            ? `Tally Service #${saveConfirmation.data.tallyServiceId}`
            : saveConfirmation.data?.customerName ||
              saveConfirmation.data?.chargeName ||
              "this tally service"
        }
        operationType={mode === "create" ? "create" : "update"}
        onConfirm={() => void handleSaveConfirm()}
        onCancelAction={() =>
          setSaveConfirmation({ isOpen: false, data: null })
        }
        isSaving={saveMutation.isPending}
      />

      <InvoicePreviewDialog
        open={showInvoicePreview}
        onOpenChange={setShowInvoicePreview}
        preview={invoicePreview}
        isLoading={isLoadingPreview}
        loadError={previewError}
        canPost={canPostInvoice}
        isPosting={isPostingInvoice}
        onPostInvoice={handlePostFromPreview}
        companyId={companyId}
        userName={user?.userName || ""}
        amtDec={decimals[0]?.amtDec || 2}
        locAmtDec={decimals[0]?.locAmtDec || 2}
      />

      <Dialog open={showPostInvoiceConfirm} onOpenChange={setShowPostInvoiceConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to generate an invoice for tally service
              {tallyService?.tallyServiceId
                ? ` #${tallyService.tallyServiceId}`
                : ""}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPostInvoiceConfirm(false)}
              disabled={isPostingInvoice}
            >
              No
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={isPostingInvoice}>
              {isPostingInvoice ? "Posting..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
