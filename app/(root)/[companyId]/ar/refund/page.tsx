"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  setDueDate,
  setExchangeRate,
  setPayExchangeRate,
} from "@/helpers/account"
import { IArRefundFilter, IArRefundHd } from "@/interfaces"
import { ApiResponse } from "@/interfaces/auth"
import { IPaymentHistoryDetails } from "@/interfaces/history"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  ArRefundDtSchemaType,
  ArRefundHdSchema,
  ArRefundHdSchemaType,
} from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  format,
  isValid,
  lastDayOfMonth,
  parse,
  startOfMonth,
  subMonths,
} from "date-fns"
import {
  Copy,
  ListFilter,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getById } from "@/lib/api-client"
import { ArRefund, BasicSetting } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { ARTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetPaymentDetails } from "@/hooks/use-histoy"
import {
  useGetRequiredFields,
  useGetVisibleFields,
  usePaymentTypeLookup,
} from "@/hooks/use-lookup"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import {
  MainOtherHistoryTabList,
  TransactionWorkspaceRoot,
  transactionTabPanelClass,
} from "@/components/layout/transaction-workspace-layout"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { TabsContent } from "@/components/ui/tabs"
import {
  CancelConfirmation,
  CloneConfirmation,
  DeleteConfirmation,
  LoadConfirmation,
  ResetConfirmation,
  SaveConfirmation,
} from "@/components/confirmation"

import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"
import { getDefaultValues } from "./components/refund-defaultvalues"
import RefundTable from "./components/refund-table"

export default function RefundPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.refund

  const { hasPermission } = usePermissionStore()
  const { decimals, user } = useAuthStore()
  const { defaults } = useUserSettingDefaults()
  const pageSize = defaults?.common?.trnGridTotalRecords || 100

  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const parseWithFallback = useCallback(
    (value: string | Date | null | undefined): Date | null => {
      if (!value) return null
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value
      }

      if (typeof value !== "string") return null

      const parsed = parse(value, dateFormat, new Date())
      if (isValid(parsed)) {
        return parsed
      }

      const fallback = parseDate(value)
      return fallback ?? null
    },
    [dateFormat]
  )

  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const _canPost = hasPermission(moduleId, transactionId, "isPost")

  const [showListDialog, setShowListDialog] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showLoadConfirm, setShowLoadConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showCloneConfirm, setShowCloneConfirm] = useState(false)
  const [isLoadingRefund, setIsLoadingRefund] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [refund, setRefund] = useState<ArRefundHdSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/ar/refund`,
    [companyId]
  )

  useEffect(() => {
    if (documentIdFromQuery) {
      setPendingDocId(documentIdFromQuery)
      return
    }

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(autoLoadStorageKey)
      if (stored) {
        window.localStorage.removeItem(autoLoadStorageKey)
        const trimmed = stored.trim()
        if (trimmed) {
          setPendingDocId(trimmed)
        }
      }
    }
  }, [autoLoadStorageKey, documentIdFromQuery])

  // Track previous account date to send as PrevAccountDate to API
  const [previousAccountDate, setPreviousAccountDate] = useState<string>("")

  const today = useMemo(() => new Date(), [])
  const defaultFilterStartDate = useMemo(
    () => format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd"),
    [today]
  )
  const defaultFilterEndDate = useMemo(
    () => format(lastDayOfMonth(today), "yyyy-MM-dd"),
    [today]
  )

  const [filters, setFilters] = useState<IArRefundFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "refundNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultRefundValues = useMemo(
    () => getDefaultValues(dateFormat).defaultRefund,
    [dateFormat]
  )

  const { data: visibleFieldsData } = useGetVisibleFields(
    moduleId,
    transactionId
  )

  const { data: requiredFieldsData } = useGetRequiredFields(
    moduleId,
    transactionId
  )
  const { data: paymentTypes = [] } = usePaymentTypeLookup()

  // Use nullish coalescing to handle fallback values
  const visible: IVisibleFields = visibleFieldsData ?? null
  const required: IMandatoryFields = requiredFieldsData ?? null

  const chequePaymentTypeIds = useMemo(
    () =>
      paymentTypes
        .filter(
          (pt) =>
            pt.paymentTypeName?.toLowerCase().includes("cheque") ||
            pt.paymentTypeCode?.toLowerCase().includes("cheque")
        )
        .map((pt) => pt.paymentTypeId),
    [paymentTypes]
  )
  const refundSchema = useMemo(
    () => ArRefundHdSchema(required, visible, { chequePaymentTypeIds }),
    [required, visible, chequePaymentTypeIds]
  )

  // Add form state management
  const form = useForm<ArRefundHdSchemaType>({
    resolver: zodResolver(refundSchema),
    defaultValues: refund
      ? {
          refundId: refund.refundId?.toString() ?? "0",
          refundNo: refund.refundNo ?? "",
          referenceNo: refund.referenceNo ?? "",
          trnDate: refund.trnDate ?? new Date(),
          accountDate: refund.accountDate ?? new Date(),
          bankId: refund.bankId ?? 0,
          paymentTypeId: refund.paymentTypeId ?? 0,
          chequeNo: refund.chequeNo ?? "",
          chequeDate: refund.chequeDate ?? new Date(),
          bankChgGLId: refund.bankChgGLId ?? 0,
          isBankCharges: refund.isBankCharges ?? false,
          isAdjCharges: refund.isAdjCharges ?? false,
          bankChgAmt: refund.bankChgAmt ?? 0,
          bankChgLocalAmt: refund.bankChgLocalAmt ?? 0,
          customerId: refund.customerId ?? 0,
          currencyId: refund.currencyId ?? 0,
          exhRate: refund.exhRate ?? 0,
          totLocalAmt: refund.totLocalAmt ?? 0,
          recCurrencyId: refund.recCurrencyId ?? 0,
          recExhRate: refund.recExhRate ?? 0,
          recTotAmt: refund.recTotAmt ?? 0,
          recTotLocalAmt: refund.recTotLocalAmt ?? 0,
          exhGainLoss: refund.exhGainLoss ?? 0,
          remarks: refund.remarks ?? "",
          allocTotAmt: refund.allocTotAmt ?? 0,
          allocTotLocalAmt: refund.allocTotLocalAmt ?? 0,
          moduleFrom: refund.moduleFrom ?? "",
          editVersion: refund.editVersion ?? 0,
          data_details:
            refund.data_details?.map((detail) => ({
              ...detail,
              refundId: detail.refundId?.toString() ?? "0",
              refundNo: detail.refundNo ?? "",
              documentId: detail.documentId?.toString() ?? "0",
              documentNo: detail.documentNo ?? "",
              docRefNo: detail.docRefNo ?? "",
              docCurrencyId: detail.docCurrencyId ?? 0,
              docExhRate: detail.docExhRate ?? 0,
              docAccountDate: detail.docAccountDate ?? "",
              docDueDate: detail.docDueDate ?? "",
              docTotAmt: detail.docTotAmt ?? 0,
              docTotLocalAmt: detail.docTotLocalAmt ?? 0,
              docBalAmt: detail.docBalAmt ?? 0,
              docBalLocalAmt: detail.docBalLocalAmt ?? 0,
              allocAmt: detail.allocAmt ?? 0,
              allocLocalAmt: detail.allocLocalAmt ?? 0,
              docAllocAmt: detail.docAllocAmt ?? 0,
              docAllocLocalAmt: detail.docAllocLocalAmt ?? 0,
              centDiff: detail.centDiff ?? 0,
              exhGainLoss: detail.exhGainLoss ?? 0,
              editVersion: detail.editVersion ?? 0,
            })) || [],
        }
      : (() => {
          // For new refund, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultRefundValues,
            createBy: userName,
            createDate: currentDateTime,
          }
        })(),
  })

  const previousDateFormatRef = useRef<string>(dateFormat)
  const { isDirty } = form.formState

  useEffect(() => {
    if (previousDateFormatRef.current === dateFormat) return
    previousDateFormatRef.current = dateFormat

    if (isDirty) return

    const currentRefundId = form.getValues("refundId") || "0"
    if (
      (refund && refund.refundId && refund.refundId !== "0") ||
      currentRefundId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultRefundValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [dateFormat, defaultRefundValues, decimals, form, refund, isDirty, user])

  // Mutations
  const saveMutation = usePersist<ArRefundHdSchemaType>(`${ArRefund.add}`)
  const updateMutation = usePersist<ArRefundHdSchemaType>(`${ArRefund.add}`)
  const deleteMutation = useDeleteWithRemarks(`${ArRefund.delete}`)

  // Remove the useGetRefundById hook for selection
  // const { data: refundByIdData, refetch: refetchRefundById } = ...

  // Handle Save
  const handleSaveRefund = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as IArRefundHd
      )

      // Validate the form data using the schema
      const validationResult = refundSchema.safeParse(formValues)

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          referenceNo: "Reference No",
          accountDate: "Account Date",
          customerId: "Customer",
          bankId: "Bank",
          paymentTypeId: "Pay",
          chequeNo: "Pay No",
          chequeDate: "Pay Date",
          currencyId: "Currency",
          totAmt: "Total Amount",
          remarks: "Remarks",
        }
        const failedFields: string[] = []
        validationResult.error.issues.forEach((error) => {
          const pathKey = error.path.join(".")
          const fieldPath = pathKey as keyof ArRefundHdSchemaType
          form.setError(fieldPath, {
            type: "validation",
            message: error.message,
          })
          const label =
            fieldLabelMap[pathKey] ??
            pathKey
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (s) => s.toUpperCase())
          if (!failedFields.includes(label)) failedFields.push(label)
        })
        if (failedFields.length > 0) {
          toast.error(
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div>Please check form data and try again.</div>
              <div style={{ marginTop: 4 }}>Missing or invalid:</div>
              {failedFields.map((f) => (
                <div key={f} style={{ paddingLeft: 8 }}>
                  {f}
                </div>
              ))}
            </div>
          )
        } else {
          toast.error("Please check form data and try again.")
        }
        return
      }

      //check totamt and totlocalamt should be zero
      if (formValues.totAmt === 0 || formValues.totLocalAmt === 0) {
        toast.error("Total Amount and Total Local Amount should not be zero")
        return
      }

      if (formValues.data_details?.length === 0) {
        toast.error("Data details should not be empty")
        return
      }

      console.log("handleSaveRefund formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.refundId) === 0
        const prevAccountDate = isNew ? accountDate : previousAccountDate

        console.log("accountDate", accountDate)
        console.log("prevAccountDate", prevAccountDate)

        const parsedAccountDate = parseWithFallback(
          accountDate as unknown as string | Date | null
        )
        if (!parsedAccountDate) {
          toast.error("Invalid account date")
          return
        }

        const parsedPrevAccountDate = parseWithFallback(
          prevAccountDate as unknown as string | Date | null
        )

        const acc = format(parsedAccountDate, "yyyy-MM-dd")
        const prev = parsedPrevAccountDate
          ? format(parsedPrevAccountDate, "yyyy-MM-dd")
          : ""

        const glCheck = await getById(
          `${BasicSetting.getCheckPeriodClosedByAccountDate}/${moduleId}/${acc}/${prev}`
        )

        if (glCheck?.result === 1) {
          toast.error("GL Period is closed for this date")
          return
        }
      } catch (_e) {
        // If the check fails to reach API, block save as safe default
        toast.error("Failed to validate GL Period. Please try again.")
        return
      }

      {
        // Format dates for API submission (yyyy-MM-dd format)
        const apiFormValues = {
          ...formValues,
          trnDate: formatDateForApi(formValues.trnDate) || "",
          accountDate: formatDateForApi(formValues.accountDate) || "",
          chequeDate: formatDateForApi(formValues.chequeDate) || "",
        }

        const response =
          Number(formValues.refundId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const refundData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (refundData) {
            const updatedSchemaType = transformToSchemaType(
              refundData as unknown as IArRefundHd
            )

            setSearchNo(updatedSchemaType.refundNo || "")
            setRefund(updatedSchemaType)
            const parsed = parseDate(updatedSchemaType.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (updatedSchemaType.accountDate as string)
            )
            form.reset(updatedSchemaType)
            form.trigger()
          }

          // Close the save confirmation dialog
          setShowSaveConfirm(false)

          // Check if this was a new refund or update
          const wasNewRefund = Number(formValues.refundId) === 0

          if (wasNewRefund) {
            //toast.success(
            // `Refund ${refundData?.refundNo || ""} saved successfully`
            //)
          } else {
            //toast.success("Refund updated successfully")
          }

          // Data refresh handled by RefundTable component
        } else {
          toast.error(response.message || "Failed to save refund")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving refund")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneRefund = async () => {
    if (refund) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedRefund: ArRefundHdSchemaType = {
        ...refund,
        refundId: "0",
        refundNo: "",
        // Set all dates to current date
        trnDate: dateStr,
        accountDate: dateStr,
        chequeDate: dateStr,
        // Clear all audit fields
        createBy: "",
        editBy: "",
        cancelBy: "",
        createDate: "",
        editDate: "",
        cancelDate: "",
        // Clear all amounts for new refund
        totAmt: 0,
        totLocalAmt: 0,
        recTotAmt: 0,
        recTotLocalAmt: 0,
        exhGainLoss: 0,
        allocTotAmt: 0,
        allocTotLocalAmt: 0,
        bankChgAmt: 0,
        bankChgLocalAmt: 0,
        isBankCharges: false,
        isAdjCharges: false,
        // Clear data details - remove all records
        data_details: [],
      }

      setRefund(clonedRefund)
      form.reset(clonedRefund)
      form.trigger("accountDate")

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedRefund.currencyId && clonedRefund.accountDate) {
        try {
          // Wait a tick to ensure form state is updated before calling setExchangeRate
          await new Promise((resolve) => setTimeout(resolve, 0))

          await setExchangeRate(form, exhRateDec, visible)
          await setPayExchangeRate(form, exhRateDec)

          // Calculate and set due date (for detail records)
          await setDueDate(form)
        } catch (error) {
          console.error("Error updating exchange rates:", error)
        }
      }

      // Clear search input
      setSearchNo("")

      toast.success("Refund cloned successfully")
    }
  }

  // Handle Delete - First Level: Confirmation
  const handleDeleteConfirmation = () => {
    // Close delete confirmation and open cancel confirmation
    setShowDeleteConfirm(false)
    setShowCancelConfirm(true)
  }

  // Handle Search No Blur - Trim spaces before and after, then trigger load confirmation
  const handleSearchNoBlur = () => {
    // Trim leading and trailing spaces
    const trimmedValue = searchNo.trim()

    // Only update if there was a change (handles "   value   " => "value")
    if (trimmedValue !== searchNo) {
      setSearchNo(trimmedValue)
    }

    // Show load confirmation if there's a value after trimming
    if (trimmedValue) {
      setShowLoadConfirm(true)
    }
  }

  // Handle Search No Enter Key
  const handleSearchNoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Trim the value and check if it's not empty before triggering
    const trimmedValue = searchNo.trim()
    if (e.key === "Enter" && trimmedValue) {
      e.preventDefault()
      // Update the search input with trimmed value if it was changed
      if (trimmedValue !== searchNo) {
        setSearchNo(trimmedValue)
      }
      setShowLoadConfirm(true)
    }
  }

  // Handle Delete - Second Level: With Cancel Remarks
  const handleRefundDelete = async (cancelRemarks: string) => {
    if (!refund) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("Refund ID:", refund.refundId)
      console.log("Refund No:", refund.refundNo)

      const response = await deleteMutation.mutateAsync({
        documentId: refund.refundId?.toString() ?? "",
        documentNo: refund.refundNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setRefund(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultRefundValues,
          data_details: [],
        })
        toast.success(`Refund ${refund.refundNo} deleted successfully`)
        // Data refresh handled by RefundTable component
      } else {
        toast.error(response.message || "Failed to delete refund")
      }
    } catch {
      toast.error("Network error while deleting refund")
    }
  }

  // Handle Reset
  const handleRefundReset = () => {
    setRefund(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new refund)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultRefundValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("Ready for new Refund")
  }

  // Handle Print Refund Report
  const handlePrintRefund = () => {
    if (!refund || refund.refundId === "0") {
      toast.error("Please select a refund to print")
      return
    }

    const formValues = form.getValues()
    const refundId = formValues.refundId || refund.refundId?.toString() || "0"
    const refundNo = formValues.refundNo || refund.refundNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: refundId,
      invoiceNo: refundNo,
      reportType: 1,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Store report data in localStorage (to match receipt/AP refund behaviour)
    const reportData = {
      reportFile: "ar/ArRefund.trdp",
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

  // Helper function to transform IArRefundHd to ArRefundHdSchemaType
  const transformToSchemaType = useCallback(
    (apiRefund: IArRefundHd): ArRefundHdSchemaType => {
      return {
        refundId: apiRefund.refundId?.toString() ?? "0",
        refundNo: apiRefund.refundNo ?? "",
        referenceNo: apiRefund.referenceNo ?? "",
        trnDate: apiRefund.trnDate
          ? format(
              parseDate(apiRefund.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiRefund.accountDate
          ? format(
              parseDate(apiRefund.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        bankId: apiRefund.bankId ?? 0,
        paymentTypeId: apiRefund.paymentTypeId ?? 0,
        chequeNo: apiRefund.chequeNo ?? "",
        chequeDate: apiRefund.chequeDate
          ? format(
              parseDate(apiRefund.chequeDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        bankChgGLId: apiRefund.bankChgGLId ?? 0,
        isBankCharges: apiRefund.isBankCharges ?? false,
        isAdjCharges: apiRefund.isAdjCharges ?? false,
        bankChgAmt: apiRefund.bankChgAmt ?? 0,
        bankChgLocalAmt: apiRefund.bankChgLocalAmt ?? 0,
        customerId: apiRefund.customerId ?? 0,
        currencyId: apiRefund.currencyId ?? 0,
        exhRate: apiRefund.exhRate ?? 0,
        totAmt: apiRefund.totAmt ?? 0,
        totLocalAmt: apiRefund.totLocalAmt ?? 0,
        recCurrencyId: apiRefund.recCurrencyId ?? 0,
        recExhRate: apiRefund.recExhRate ?? 0,
        recTotAmt: apiRefund.recTotAmt ?? 0,
        recTotLocalAmt: apiRefund.recTotLocalAmt ?? 0,
        exhGainLoss: apiRefund.exhGainLoss ?? 0,
        remarks: apiRefund.remarks ?? "",
        allocTotAmt: apiRefund.allocTotAmt ?? 0,
        allocTotLocalAmt: apiRefund.allocTotLocalAmt ?? 0,
        moduleFrom: apiRefund.moduleFrom ?? "",
        editVersion: apiRefund.editVersion ?? 0,
        createBy: apiRefund.createBy ?? "",
        editBy: apiRefund.editBy ?? "",
        cancelBy: apiRefund.cancelBy ?? "",
        isCancel:
          apiRefund.isCancel === true ||
          (apiRefund as unknown as Record<string, unknown>).IsCancel === true ||
          false,
        createDate: apiRefund.createDate
          ? format(
              parseDate(apiRefund.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        editDate: apiRefund.editDate
          ? format(
              parseDate(apiRefund.editDate as unknown as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiRefund.cancelDate
          ? format(
              parseDate(apiRefund.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelRemarks: (() => {
          const raw =
            apiRefund.cancelRemarks ??
            (apiRefund as unknown as Record<string, unknown>).CancelRemarks
          return typeof raw === "string" ? raw : ""
        })(),
        data_details:
          apiRefund.data_details?.map(
            (detail) =>
              ({
                ...detail,
                refundId: detail.refundId?.toString() ?? "0",
                refundNo: detail.refundNo ?? "",
                itemNo: detail.itemNo ?? 0,
                transactionId: detail.transactionId ?? 0,
                documentId: detail.documentId?.toString() ?? "0",
                documentNo: detail.documentNo ?? "",
                docRefNo: detail.docRefNo ?? "",
                docCurrencyId: detail.docCurrencyId ?? 0,
                docExhRate: detail.docExhRate ?? 0,
                docAccountDate: detail.docAccountDate
                  ? format(
                      parseDate(detail.docAccountDate as string) || new Date(),
                      dateFormat
                    )
                  : "",
                docDueDate: detail.docDueDate
                  ? format(
                      parseDate(detail.docDueDate as string) || new Date(),
                      dateFormat
                    )
                  : "",
                docTotAmt: detail.docTotAmt ?? 0,
                docTotLocalAmt: detail.docTotLocalAmt ?? 0,
                docBalAmt: detail.docBalAmt ?? 0,
                docBalLocalAmt: detail.docBalLocalAmt ?? 0,
                allocAmt: detail.allocAmt ?? 0,
                allocLocalAmt: detail.allocLocalAmt ?? 0,
                docAllocAmt: detail.docAllocAmt ?? 0,
                docAllocLocalAmt: detail.docAllocLocalAmt ?? 0,
                centDiff: detail.centDiff ?? 0,
                exhGainLoss: detail.exhGainLoss ?? 0,
                editVersion: detail.editVersion ?? 0,
              }) as unknown as ArRefundDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadRefund = useCallback(
    async ({
      refundId,
      refundNo,
      showLoader = false,
    }: {
      refundId?: string | number | null
      refundNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("refundId", refundId)
      console.log("refundNo", refundNo)
      const trimmedRefundNo = refundNo?.trim() ?? ""
      const trimmedRefundId =
        typeof refundId === "number"
          ? refundId.toString()
          : (refundId?.toString().trim() ?? "")

      if (!trimmedRefundNo && !trimmedRefundId) return null

      if (showLoader) {
        setIsLoadingRefund(true)
      }

      const requestRefundId = trimmedRefundId || "0"
      const requestRefundNo = trimmedRefundNo || ""

      try {
        const response = await getById(
          `${ArRefund.getByIdNo}/${requestRefundId}/${requestRefundNo}`
        )

        if (response?.result === 1) {
          const detailedRefund = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedRefund) {
            const parsed = parseDate(detailedRefund.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedRefund.accountDate as string)
            )

            const updatedRefund = transformToSchemaType(detailedRefund)

            setRefund(updatedRefund)
            form.reset(updatedRefund)
            form.trigger()

            const resolvedRefundNo =
              updatedRefund.refundNo || trimmedRefundNo || trimmedRefundId
            setSearchNo(resolvedRefundNo)

            return resolvedRefundNo
          }
        } else {
          toast.error(response?.message || "Failed to fetch refund details")
        }
      } catch (error) {
        console.error("Error fetching refund details:", error)
        toast.error("Error loading refund. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingRefund(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setRefund,
      setIsLoadingRefund,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleRefundSelect = async (
    selectedRefund: IArRefundHd | undefined
  ) => {
    if (!selectedRefund) return

    const loadedRefundNo = await loadRefund({
      refundId: selectedRefund.refundId ?? "0",
      refundNo: selectedRefund.refundNo ?? "",
    })

    if (loadedRefundNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchRefunds from handleFilterChange
  const handleFilterChange = (newFilters: IArRefundFilter) => {
    setFilters(newFilters)
    // Data refresh handled by RefundTable component
  }

  // Data refresh handled by RefundTable component

  // Set createBy and createDate for new refunds on page load/refresh
  useEffect(() => {
    if (!refund && user && decimals.length > 0) {
      const currentRefundId = form.getValues("refundId")
      const currentRefundNo = form.getValues("refundNo")
      const isNewRefund =
        !currentRefundId || currentRefundId === "0" || !currentRefundNo

      if (isNewRefund) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [refund, user, decimals, form])

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        setShowSaveConfirm(true)
      }
      // Ctrl+L or Cmd+L: Open List
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault()
        setShowListDialog(true)
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  // Add unsaved changes warning
  useEffect(() => {
    const isDirty = form.formState.isDirty
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [form.formState.isDirty])

  // Clear form errors when tab changes
  useEffect(() => {
    form.clearErrors()
  }, [activeTab, form])

  const handleRefundSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedRefundNo = await loadRefund({
        refundId: "0",
        refundNo: trimmedValue,
        showLoader: true,
      })

      if (loadedRefundNo) {
        toast.success(`Refund ${loadedRefundNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadRefund({
        refundId: trimmedId,
        refundNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadRefund, pendingDocId])

  // Determine mode and refund ID from URL
  const refundNo = form.getValues("refundNo")
  const isEdit = Boolean(refundNo)
  const isCancelled = refund?.isCancel === true

  // Check if document has history payment-details; if yes, lock update/delete/cancel
  const watchedRefundId = form.watch("refundId")
  const effectiveDocIdForHistory =
    watchedRefundId != null &&
    String(watchedRefundId).trim() !== "" &&
    String(watchedRefundId) !== "undefined"
      ? String(watchedRefundId).trim()
      : ""

  const { data: paymentHistoryResponse } =
    useGetPaymentDetails<IPaymentHistoryDetails>(
      Number(moduleId),
      Number(transactionId),
      effectiveDocIdForHistory || "0",
      {
        enabled: !!effectiveDocIdForHistory && effectiveDocIdForHistory !== "0",
      }
    )

  const historyRawData = (
    paymentHistoryResponse as ApiResponse<IPaymentHistoryDetails>
  )?.data
  const hasPaymentHistory =
    Array.isArray(historyRawData) && historyRawData.length > 0

  // Generic function to copy text to clipboard
  const copyToClipboard = useCallback(async (textToCopy: string) => {
    if (!textToCopy || textToCopy.trim() === "") {
      toast.error("No text available to copy")
      return
    }

    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy)
        toast.success("Copying to clipboard was successful!")
        return
      } catch (error) {
        console.error("Clipboard API failed, trying fallback:", error)
      }
    }

    // Fallback method for older browsers or when Clipboard API fails
    try {
      const textArea = document.createElement("textarea")
      textArea.value = textToCopy
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)

      if (successful) {
        toast.success("Copying to clipboard was successful!")
      } else {
        throw new Error("execCommand failed")
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  // Handle double-click to copy searchNo to clipboard
  const handleCopySearchNo = useCallback(async () => {
    await copyToClipboard(searchNo)
  }, [searchNo, copyToClipboard])

  // Handle double-click to copy refundNo to clipboard
  const handleCopyInvoiceNo = useCallback(async () => {
    const refundNoToCopy = isEdit
      ? refund?.refundNo || form.getValues("refundNo") || ""
      : form.getValues("refundNo") || ""

    await copyToClipboard(refundNoToCopy)
  }, [isEdit, refund?.refundNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `Refund (Edit)- v[${refund?.editVersion}] - ${refundNo}`
    : "Refund (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading refund form...</p>
          <p className="mt-2 text-xs text-gray-500">
            Preparing field settings and validation rules
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <TransactionWorkspaceRoot
        activeTab={activeTab}
        onTabChange={setActiveTab}
        leftColumn={
          <>
            <MainOtherHistoryTabList />
            {isCancelled && (
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="inline-flex shrink-0 items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                  Cancelled
                </span>
                {refund?.cancelRemarks && (
                  <div className="max-w-[160px] truncate text-xs text-red-600 sm:max-w-[220px]">
                    {refund.cancelRemarks}
                  </div>
                )}
              </div>
            )}
          </>
        }
        centerColumn={
          <div className="flex shrink-0 items-center gap-1.5">
            <h1 className="m-0">
              <span
                className={`relative inline-flex rounded-full p-[2px] transition-all ${
                  isEdit
                    ? "bg-gradient-to-r from-purple-500 to-blue-500"
                    : "animate-pulse bg-gradient-to-r from-purple-500 to-blue-500"
                } `}
              >
                <span
                  className="inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white select-none"
                  onDoubleClick={handleCopyInvoiceNo}
                  title="Double-click to copy refund number"
                >
                  {titleText}
                </span>
              </span>
            </h1>
            {isEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (refund?.refundNo) {
                    setSearchNo(refund.refundNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingRefund}
                className="h-4 w-4 p-0"
                title="Refresh refund data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        }
        rightColumn={
          <>
            <div
              onDoubleClick={handleCopySearchNo}
              className="min-w-[120px] w-full max-w-xs sm:w-64"
              title="Double-click to copy to clipboard"
            >
              <Input
                value={searchNo}
                onChange={(e) => setSearchNo(e.target.value)}
                onBlur={handleSearchNoBlur}
                onKeyDown={handleSearchNoKeyDown}
                placeholder="Search Refund No"
                className="h-7 cursor-pointer text-xs"
                readOnly={!!refund?.refundId && refund.refundId !== "0"}
                disabled={!!refund?.refundId && refund.refundId !== "0"}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowListDialog(true)}
              disabled={false}
            >
              <ListFilter className="mr-1 h-4 w-4" />
              List
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => setShowSaveConfirm(true)}
              disabled={
                !canView ||
                isSaving ||
                saveMutation.isPending ||
                updateMutation.isPending ||
                isCancelled ||
                (isEdit && !canEdit) ||
                (!isEdit && !canCreate) ||
                (isEdit && hasPaymentHistory)
              }
              className={isEdit ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isSaving || saveMutation.isPending || updateMutation.isPending ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              {isSaving || saveMutation.isPending || updateMutation.isPending
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                  ? "Update"
                  : "Save"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!refund || refund.refundId === "0"}
              onClick={handlePrintRefund}
            >
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              New
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneConfirm(true)}
              disabled={!refund || refund.refundId === "0" || isCancelled}
            >
              <Copy className="mr-1 h-4 w-4" />
              Clone
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={
                !canView ||
                !refund ||
                refund.refundId === "0" ||
                deleteMutation.isPending ||
                isCancelled ||
                !canDelete ||
                hasPaymentHistory
              }
            >
              {deleteMutation.isPending ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Trash2 className="mr-1 h-4 w-4" />
              )}
              {deleteMutation.isPending ? "Cancelling..." : "Cancel"}
            </Button>
          </>
        }
      >
        <TabsContent value="main" className={transactionTabPanelClass()}>
          <Main
            form={form}
            onSuccessAction={async () => {
              handleSaveRefund()
            }}
            isEdit={isEdit}
            visible={visible}
            required={required}
            companyId={Number(companyId)}
            isCancelled={isCancelled}
          />
        </TabsContent>

        <TabsContent value="other" className={transactionTabPanelClass()}>
          <Other form={form} />
        </TabsContent>

        <TabsContent value="history" className={transactionTabPanelClass()}>
          <History form={form} isEdit={isEdit} />
        </TabsContent>
      </TransactionWorkspaceRoot>

      {/* List Dialog */}
      <Dialog
        open={showListDialog}
        onOpenChange={(open) => {
          setShowListDialog(open)
        }}
      >
        <DialogContent
          className="@container flex h-auto w-[90vw] !max-w-none flex-col gap-0 overflow-hidden rounded-lg p-0"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="bg-background flex flex-col gap-1 border-b p-2">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Refund List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing refunds from the list below. Use search
              to filter records or create new refunds.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <RefundTable
              onRefundSelect={handleRefundSelect}
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              pageSize={pageSize || 50}
              onCloseAction={() => setShowListDialog(false)}
              isDialogOpen={showListDialog}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation */}
      <SaveConfirmation
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        onConfirm={handleSaveRefund}
        itemName={refund?.refundNo || "New Refund"}
        operationType={
          refund?.refundId && refund.refundId !== "0" ? "update" : "create"
        }
        isSaving={
          isSaving || saveMutation.isPending || updateMutation.isPending
        }
      />

      {/* Delete Confirmation - First Level */}
      <DeleteConfirmation
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => handleDeleteConfirmation()}
        itemName={refund?.refundNo}
        title="Delete Refund"
        description="Are you sure you want to delete this refund? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleRefundDelete}
        itemName={refund?.refundNo}
        title="Cancel Refund"
        description="Please provide a reason for cancelling this refund."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleRefundSearch(searchNo)}
        code={searchNo}
        typeLabel="Refund"
        showDetails={false}
        description={`Do you want to load Refund ${searchNo}?`}
        isLoading={isLoadingRefund}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleRefundReset}
        itemName={refund?.refundNo}
        title="New Refund"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneRefund}
        itemName={refund?.refundNo}
        title="Clone Refund"
        description="This will create a copy as a new refund."
      />
    </>
  )
}
