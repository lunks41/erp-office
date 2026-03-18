"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  setDueDate,
  setExchangeRate,
  setPayExchangeRate,
} from "@/helpers/account"
import { IApPaymentFilter, IApPaymentHd } from "@/interfaces"
import { ApiResponse } from "@/interfaces/auth"
import { IPaymentHistoryDetails } from "@/interfaces/history"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  ApPaymentDtSchemaType,
  ApPaymentHdSchema,
  ApPaymentHdSchemaType,
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
import { ApPayment, BasicSetting } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { APTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetPaymentDetails } from "@/hooks/use-histoy"
import {
  useGetRequiredFields,
  useGetVisibleFields,
  usePaymentTypeLookup,
} from "@/hooks/use-lookup"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { getDefaultValues } from "./components/payment-defaultvalues"
import PaymentTable from "./components/payment-table"

export default function PaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.ap
  const transactionId = APTransactionId.payment

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
  const [isLoadingPayment, setIsLoadingPayment] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [payment, setPayment] = useState<ApPaymentHdSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/ap/payment`,
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

  const [filters, setFilters] = useState<IApPaymentFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "paymentNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultPaymentValues = useMemo(
    () => getDefaultValues(dateFormat).defaultPayment,
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
  const paymentSchema = useMemo(
    () => ApPaymentHdSchema(required, visible, { chequePaymentTypeIds }),
    [required, visible, chequePaymentTypeIds]
  )

  // Add form state management
  const form = useForm<ApPaymentHdSchemaType>({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment
      ? {
          paymentId: payment.paymentId?.toString() ?? "0",
          paymentNo: payment.paymentNo ?? "",
          referenceNo: payment.referenceNo ?? "",
          trnDate: payment.trnDate ?? new Date(),
          accountDate: payment.accountDate ?? new Date(),
          bankId: payment.bankId ?? 0,
          paymentTypeId: payment.paymentTypeId ?? 0,
          chequeNo: payment.chequeNo ?? "",
          chequeDate: payment.chequeDate ?? new Date(),
          bankChgGLId: payment.bankChgGLId ?? 0,
          isBankCharges: payment.isBankCharges ?? false,
          isAdjCharges: payment.isAdjCharges ?? false,
          bankChgAmt: payment.bankChgAmt ?? 0,
          bankChgLocalAmt: payment.bankChgLocalAmt ?? 0,
          supplierId: payment.supplierId ?? 0,
          currencyId: payment.currencyId ?? 0,
          exhRate: payment.exhRate ?? 0,
          unAllocTotAmt: payment.unAllocTotAmt ?? 0,
          unAllocTotLocalAmt: payment.unAllocTotLocalAmt ?? 0,
          docExhRate: payment.docExhRate ?? 0,
          docTotAmt: payment.docTotAmt ?? 0,
          docTotLocalAmt: payment.docTotLocalAmt ?? 0,
          totLocalAmt: payment.totLocalAmt ?? 0,
          payCurrencyId: payment.payCurrencyId ?? 0,
          payExhRate: payment.payExhRate ?? 0,
          payTotAmt: payment.payTotAmt ?? 0,
          payTotLocalAmt: payment.payTotLocalAmt ?? 0,
          exhGainLoss: payment.exhGainLoss ?? 0,
          remarks: payment.remarks ?? "",
          allocTotAmt: payment.allocTotAmt ?? 0,
          allocTotLocalAmt: payment.allocTotLocalAmt ?? 0,
          moduleFrom: payment.moduleFrom ?? "",
          editVersion: payment.editVersion ?? 0,
          createBy: payment.createBy ?? "",
          editBy: payment.editBy ?? "",
          cancelBy: payment.cancelBy ?? "",
          isCancel: payment.isCancel ?? false,
          cancelDate: payment.cancelDate ?? "",
          cancelRemarks: payment.cancelRemarks ?? "",
          createDate: payment.createDate ?? "",
          editDate: payment.editDate ?? "",
          data_details:
            payment.data_details?.map((detail) => ({
              ...detail,
              paymentId: detail.paymentId?.toString() ?? "0",
              paymentNo: detail.paymentNo ?? "",
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
          // For new payment, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultPaymentValues,
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

    const currentPaymentId = form.getValues("paymentId") || "0"
    if (
      (payment && payment.paymentId && payment.paymentId !== "0") ||
      currentPaymentId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultPaymentValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [dateFormat, defaultPaymentValues, decimals, form, payment, isDirty, user])

  // Mutations
  const saveMutation = usePersist<ApPaymentHdSchemaType>(`${ApPayment.add}`)
  const updateMutation = usePersist<ApPaymentHdSchemaType>(`${ApPayment.add}`)
  const deleteMutation = useDeleteWithRemarks(`${ApPayment.delete}`)

  // Remove the useGetPaymentById hook for selection
  // const { data: paymentByIdData, refetch: refetchPaymentById } = ...

  // Handle Save
  const handleSavePayment = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as IApPaymentHd
      )

      // Validate the form data using the schema
      const validationResult = paymentSchema.safeParse(formValues)

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          referenceNo: "Reference No",
          accountDate: "Account Date",
          supplierId: "Supplier",
          bankId: "Bank",
          paymentTypeId: "Pay",
          chequeNo: "Pay No",
          chequeDate: "Pay Date",
          currencyId: "Currency",
          exhRate: "Exchange Rate",
          totAmt: "Total Amount",
          remarks: "Remarks",
        }
        const failedFields: string[] = []
        validationResult.error.issues.forEach((error) => {
          const pathKey = error.path.join(".")
          const fieldPath = pathKey as keyof ApPaymentHdSchemaType
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

      console.log("handleSavePayment formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.paymentId) === 0
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
          // Format dates in details array
          data_details:
            formValues.data_details?.map((detail) => ({
              ...detail,
              docAccountDate: formatDateForApi(detail.docAccountDate) || "",
              docDueDate: formatDateForApi(detail.docDueDate) || "",
            })) || [],
        }

        const response =
          Number(formValues.paymentId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const paymentData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (paymentData) {
            const updatedSchemaType = transformToSchemaType(
              paymentData as unknown as IApPaymentHd
            )

            setSearchNo(updatedSchemaType.paymentNo || "")
            setPayment(updatedSchemaType)
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

          // Check if this was a new payment or update
          const wasNewPayment = Number(formValues.paymentId) === 0

          if (wasNewPayment) {
            //toast.success(
            // `Payment ${paymentData?.paymentNo || ""} saved successfully`
            //)
          } else {
            //toast.success("Payment updated successfully")
          }

          // Data refresh handled by PaymentTable component
        } else {
          toast.error(response.message || "Failed to save payment")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving payment")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleClonePayment = async () => {
    if (payment) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedPayment: ApPaymentHdSchemaType = {
        ...payment,
        paymentId: "0",
        paymentNo: "",
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
        payTotAmt: 0,
        payTotLocalAmt: 0,
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

      setPayment(clonedPayment)
      form.reset(clonedPayment)
      form.trigger("accountDate")

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedPayment.currencyId && clonedPayment.accountDate) {
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

      toast.success("Payment cloned successfully")
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
  const handlePaymentDelete = async (cancelRemarks: string) => {
    if (!payment) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("Payment ID:", payment.paymentId)
      console.log("Payment No:", payment.paymentNo)

      const response = await deleteMutation.mutateAsync({
        documentId: payment.paymentId?.toString() ?? "",
        documentNo: payment.paymentNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setPayment(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultPaymentValues,
          data_details: [],
        })
        toast.success(`Payment ${payment.paymentNo} deleted successfully`)
        // Data refresh handled by PaymentTable component
      } else {
        toast.error(response.message || "Failed to delete payment")
      }
    } catch {
      toast.error("Network error while deleting payment")
    }
  }

  // Handle Reset
  const handlePaymentReset = () => {
    setPayment(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new payment)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultPaymentValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("Payment reset successfully")
  }

  // Handle Print Payment Report
  const handlePrintPayment = (
    reportType: "Payment" | "ChequePayment" = "Payment"
  ) => {
    if (!payment || payment.paymentId === "0") {
      toast.error("Please select a payment to print")
      return
    }

    const formValues = form.getValues()
    const paymentId =
      formValues.paymentId || payment.paymentId?.toString() || "0"
    const paymentNo = formValues.paymentNo || payment.paymentNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: paymentId,
      invoiceNo: paymentNo,
      reportType: 1,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Determine report file based on type
    const reportFile =
      reportType === "ChequePayment"
        ? "ap/ApChequePayment.trdp"
        : "ap/ApPayment.trdp"

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

  // Helper function to transform IApPaymentHd to ApPaymentHdSchemaType
  const transformToSchemaType = useCallback(
    (apiPayment: IApPaymentHd): ApPaymentHdSchemaType => {
      return {
        paymentId: apiPayment.paymentId?.toString() ?? "0",
        paymentNo: apiPayment.paymentNo ?? "",
        referenceNo: apiPayment.referenceNo ?? "",
        trnDate: apiPayment.trnDate
          ? format(
              parseDate(apiPayment.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiPayment.accountDate
          ? format(
              parseDate(apiPayment.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        bankId: apiPayment.bankId ?? 0,
        paymentTypeId: apiPayment.paymentTypeId ?? 0,
        chequeNo: apiPayment.chequeNo ?? "",
        chequeDate: apiPayment.chequeDate
          ? format(
              parseDate(apiPayment.chequeDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        bankChgGLId: apiPayment.bankChgGLId ?? 0,
        isBankCharges: apiPayment.isBankCharges ?? false,
        isAdjCharges: apiPayment.isAdjCharges ?? false,
        bankChgAmt: apiPayment.bankChgAmt ?? 0,
        bankChgLocalAmt: apiPayment.bankChgLocalAmt ?? 0,
        supplierId: apiPayment.supplierId ?? 0,
        currencyId: apiPayment.currencyId ?? 0,
        exhRate: apiPayment.exhRate ?? 0,
        unAllocTotAmt: apiPayment.unAllocTotAmt ?? 0,
        unAllocTotLocalAmt: apiPayment.unAllocTotLocalAmt ?? 0,
        docExhRate: apiPayment.docExhRate ?? 0,
        docTotAmt: apiPayment.docTotAmt ?? 0,
        docTotLocalAmt: apiPayment.docTotLocalAmt ?? 0,
        totAmt: apiPayment.totAmt ?? 0,
        totLocalAmt: apiPayment.totLocalAmt ?? 0,
        payCurrencyId: apiPayment.payCurrencyId ?? 0,
        payExhRate: apiPayment.payExhRate ?? 0,
        payTotAmt: apiPayment.payTotAmt ?? 0,
        payTotLocalAmt: apiPayment.payTotLocalAmt ?? 0,
        exhGainLoss: apiPayment.exhGainLoss ?? 0,
        remarks: apiPayment.remarks ?? "",
        allocTotAmt: apiPayment.allocTotAmt ?? 0,
        allocTotLocalAmt: apiPayment.allocTotLocalAmt ?? 0,
        moduleFrom: apiPayment.moduleFrom ?? "",
        editVersion: apiPayment.editVersion ?? 0,
        createBy: apiPayment.createBy ?? "",
        editBy: apiPayment.editBy ?? "",
        cancelBy: apiPayment.cancelBy ?? "",
        isCancel:
          apiPayment.isCancel === true ||
          (apiPayment as unknown as Record<string, unknown>).IsCancel ===
            true ||
          false,
        createDate: apiPayment.createDate
          ? format(
              parseDate(apiPayment.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        editDate: apiPayment.editDate
          ? format(
              parseDate(apiPayment.editDate as unknown as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiPayment.cancelDate
          ? format(
              parseDate(apiPayment.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelRemarks: apiPayment.cancelRemarks ?? "",
        data_details:
          apiPayment.data_details?.map(
            (detail) =>
              ({
                ...detail,
                paymentId: detail.paymentId?.toString() ?? "0",
                paymentNo: detail.paymentNo ?? "",
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
              }) as unknown as ApPaymentDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadPayment = useCallback(
    async ({
      paymentId,
      paymentNo,
      showLoader = false,
    }: {
      paymentId?: string | number | null
      paymentNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("paymentId", paymentId)
      console.log("paymentNo", paymentNo)
      const trimmedPaymentNo = paymentNo?.trim() ?? ""
      const trimmedPaymentId =
        typeof paymentId === "number"
          ? paymentId.toString()
          : (paymentId?.toString().trim() ?? "")

      if (!trimmedPaymentNo && !trimmedPaymentId) return null

      if (showLoader) {
        setIsLoadingPayment(true)
      }

      const requestPaymentId = trimmedPaymentId || "0"
      const requestPaymentNo = trimmedPaymentNo || ""

      try {
        const response = await getById(
          `${ApPayment.getByIdNo}/${requestPaymentId}/${requestPaymentNo}`
        )

        if (response?.result === 1) {
          const detailedPayment = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedPayment) {
            const parsed = parseDate(detailedPayment.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedPayment.accountDate as string)
            )

            const updatedPayment = transformToSchemaType(detailedPayment)

            setPayment(updatedPayment)
            form.reset(updatedPayment)
            form.trigger()

            const resolvedPaymentNo =
              updatedPayment.paymentNo || trimmedPaymentNo || trimmedPaymentId
            setSearchNo(resolvedPaymentNo)

            return resolvedPaymentNo
          }
        } else {
          toast.error(response?.message || "Failed to fetch payment details")
        }
      } catch (error) {
        console.error("Error fetching payment details:", error)
        toast.error("Error loading payment. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingPayment(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setPayment,
      setIsLoadingPayment,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handlePaymentSelect = async (
    selectedPayment: IApPaymentHd | undefined
  ) => {
    if (!selectedPayment) return

    const loadedPaymentNo = await loadPayment({
      paymentId: selectedPayment.paymentId ?? "0",
      paymentNo: selectedPayment.paymentNo ?? "",
    })

    if (loadedPaymentNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchPayments from handleFilterChange
  const handleFilterChange = (newFilters: IApPaymentFilter) => {
    setFilters(newFilters)
    // Data refresh handled by PaymentTable component
  }

  // Data refresh handled by PaymentTable component

  // Set createBy and createDate for new payments on page load/refresh
  useEffect(() => {
    if (!payment && user && decimals.length > 0) {
      const currentPaymentId = form.getValues("paymentId")
      const currentPaymentNo = form.getValues("paymentNo")
      const isNewPayment =
        !currentPaymentId || currentPaymentId === "0" || !currentPaymentNo

      if (isNewPayment) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [payment, user, decimals, form])

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

  const handlePaymentSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedPaymentNo = await loadPayment({
        paymentId: "0",
        paymentNo: trimmedValue,
        showLoader: true,
      })

      if (loadedPaymentNo) {
        toast.success(`Payment ${loadedPaymentNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadPayment({
        paymentId: trimmedId,
        paymentNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadPayment, pendingDocId])

  // Determine mode and payment ID from URL
  const paymentNo = form.getValues("paymentNo")
  const isEdit = Boolean(paymentNo)
  const watchedIsCancel = form.watch("isCancel")
  const watchedCancelRemarks = form.watch("cancelRemarks")
  const isCancelled = payment?.isCancel === true || watchedIsCancel === true
  const displayCancelRemarks =
    (watchedCancelRemarks && String(watchedCancelRemarks).trim()) ||
    (payment?.cancelRemarks && String(payment.cancelRemarks).trim()) ||
    ""

  // Check if payment has history payment-details; if yes, lock update/delete/cancel
  const watchedPaymentId = form.watch("paymentId")
  const effectivePaymentIdForHistory =
    watchedPaymentId != null &&
    String(watchedPaymentId).trim() !== "" &&
    String(watchedPaymentId) !== "undefined"
      ? String(watchedPaymentId).trim()
      : ""

  const { data: paymentHistoryResponse } =
    useGetPaymentDetails<IPaymentHistoryDetails>(
      Number(moduleId),
      Number(transactionId),
      effectivePaymentIdForHistory || "0",
      {
        enabled:
          !!effectivePaymentIdForHistory &&
          effectivePaymentIdForHistory !== "0",
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

  // Handle double-click to copy paymentNo to clipboard
  const handleCopyInvoiceNo = useCallback(async () => {
    const paymentNoToCopy = isEdit
      ? payment?.paymentNo || form.getValues("paymentNo") || ""
      : form.getValues("paymentNo") || ""

    await copyToClipboard(paymentNoToCopy)
  }, [isEdit, payment?.paymentNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `Payment (Edit)- v[${payment?.editVersion}] - ${paymentNo}`
    : "Payment (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading payment form...</p>
          <p className="mt-2 text-xs text-gray-500">
            Preparing field settings and validation rules
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="@container flex flex-1 flex-col p-4">
      <Tabs
        defaultValue="main"
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TabsList>
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Cancel Remarks Badge - Only show when cancelled */}
            {isCancelled && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                  <span className="mr-1 h-2 w-2 rounded-full bg-red-400"></span>
                  Cancelled
                </span>
                {payment?.cancelRemarks && (
                  <div className="max-w-xs truncate text-sm text-red-600">
                    {payment.cancelRemarks}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h1>
              {/* Outer wrapper: gradient border or yellow pulsing border */}
              <span
                className={`relative inline-flex rounded-full p-[2px] transition-all ${
                  isEdit
                    ? "bg-gradient-to-r from-purple-500 to-blue-500" // pulsing yellow border on edit
                    : "animate-pulse bg-gradient-to-r from-purple-500 to-blue-500" // default gradient border
                } `}
              >
                {/* Inner pill: solid dark background + white text - same size as Fully Paid badge */}
                <span
                  className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1 text-xs font-medium select-none ${isEdit ? "text-white" : "text-white"}`}
                  onDoubleClick={handleCopyInvoiceNo}
                  title="Double-click to copy payment number"
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
                  if (payment?.paymentNo) {
                    setSearchNo(payment.paymentNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingPayment}
                className="h-4 w-4 p-0"
                title="Refresh payment data"
              >
                <RefreshCw className="h-2 w-2" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              onDoubleClick={handleCopySearchNo}
              className="flex-1"
              title="Double-click to copy to clipboard"
            >
              <Input
                value={searchNo}
                onChange={(e) => setSearchNo(e.target.value)}
                onBlur={handleSearchNoBlur}
                onKeyDown={handleSearchNoKeyDown}
                placeholder="Search Payment No"
                className="h-8 cursor-pointer text-sm"
                readOnly={!!payment?.paymentId && payment.paymentId !== "0"}
                disabled={!!payment?.paymentId && payment.paymentId !== "0"}
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
              {isSaving ||
              saveMutation.isPending ||
              updateMutation.isPending ? (
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!payment || payment.paymentId === "0"}
                >
                  <Printer className="mr-1 h-4 w-4" />
                  Print
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlePrintPayment("Payment")}>
                  1. Payment
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePrintPayment("ChequePayment")}
                >
                  2. ChequePayment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              //disabled={!payment}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              New
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneConfirm(true)}
              disabled={!payment || payment.paymentId === "0" || isCancelled}
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
                !payment ||
                payment.paymentId === "0" ||
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
          </div>
        </div>

        <TabsContent value="main">
          <Main
            form={form}
            onSuccessAction={async () => {
              handleSavePayment()
            }}
            isEdit={isEdit}
            visible={visible}
            required={required}
            companyId={Number(companyId)}
            isCancelled={isCancelled}
          />
        </TabsContent>

        <TabsContent value="other">
          <Other form={form} />
        </TabsContent>

        <TabsContent value="history">
          <History form={form} isEdit={isEdit} />
        </TabsContent>
      </Tabs>

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
              Payment List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing payments from the list below. Use
              search to filter records or create new payments.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <PaymentTable
              onPaymentSelect={handlePaymentSelect}
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              pageSize={pageSize || 50}
              onCloseAction={() => setShowListDialog(false)}
              visible={visible}
              isDialogOpen={showListDialog}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation */}
      <SaveConfirmation
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        onConfirm={handleSavePayment}
        itemName={payment?.paymentNo || "New Payment"}
        operationType={
          payment?.paymentId && payment.paymentId !== "0" ? "update" : "create"
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
        itemName={payment?.paymentNo}
        title="Delete Payment"
        description="Are you sure you want to delete this payment? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handlePaymentDelete}
        itemName={payment?.paymentNo}
        title="Cancel Payment"
        description="Please provide a reason for cancelling this payment."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handlePaymentSearch(searchNo)}
        code={searchNo}
        typeLabel="Payment"
        showDetails={false}
        description={`Do you want to load Payment ${searchNo}?`}
        isLoading={isLoadingPayment}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handlePaymentReset}
        itemName={payment?.paymentNo}
        title="New Payment"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleClonePayment}
        itemName={payment?.paymentNo}
        title="Clone Payment"
        description="This will create a copy as a new payment."
      />
    </div>
  )
}
