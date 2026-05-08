"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { setExchangeRate } from "@/helpers/account"
import {
  IGLContraDt,
  IGLContraFilter,
  IGLContraHd,
  IMandatoryFields,
  IVisibleFields,
} from "@/interfaces"
import {
  GLContraDtSchemaType,
  GLContraHdSchema,
  GLContraHdSchemaType,
} from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { useCompanyStore } from "@/stores/company-store"
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
import { BasicSetting, GLContra } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { GLTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetRequiredFields, useGetVisibleFields } from "@/hooks/use-lookup"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import {
  TransactionWorkspaceRoot,
  MainOtherHistoryTabList,
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

import { getDefaultValues } from "./components/glContra-defaultvalues"
import ContraTable from "./components/glContra-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function ArapcontraPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.gl
  const transactionId = GLTransactionId.arapcontra

  const { hasPermission } = usePermissionStore()
  const { user } = useAuthStore()
  const { decimals } = useCompanyStore()
  const { defaults } = useUserSettingDefaults()
  const pageSize = defaults?.common?.trnGridTotalRecords || 100

  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const documentNoFromQuery = useMemo(() => {
    const value =
      searchParams.get("docNo") ?? searchParams.get("documentNo") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/gl/arapcontra`,
    [companyId]
  )

  const [pendingDocNo, setPendingDocNo] = useState<string>("")

  useEffect(() => {
    if (documentNoFromQuery) {
      setPendingDocNo(documentNoFromQuery)
      setSearchNo(documentNoFromQuery)
      return
    }

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(autoLoadStorageKey)
      if (stored) {
        window.localStorage.removeItem(autoLoadStorageKey)
        setPendingDocNo(stored)
        setSearchNo(stored)
      }
    }
  }, [autoLoadStorageKey, documentNoFromQuery])

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
  const [contra, setContra] = useState<GLContraHdSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")

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

  const [filters, setFilters] = useState<IGLContraFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "contraNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const { defaultContra: defaultContraValues } = useMemo(
    () => getDefaultValues(dateFormat),
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

  // Use nullish coalescing to handle fallback values
  const visible: IVisibleFields = visibleFieldsData ?? null
  const required: IMandatoryFields = requiredFieldsData ?? null

  // Add form state management
  const form = useForm<GLContraHdSchemaType>({
    resolver: zodResolver(GLContraHdSchema(required, visible)),
    defaultValues: contra
      ? {
          contraId: contra.contraId?.toString() ?? "0",
          contraNo: contra.contraNo ?? "",
          referenceNo: contra.referenceNo ?? "",
          trnDate: contra.trnDate ?? new Date(),
          accountDate: contra.accountDate ?? new Date(),
          supplierId: contra.supplierId ?? 0,
          customerId: contra.customerId ?? 0,
          currencyId: contra.currencyId ?? 0,
          exhRate: contra.exhRate ?? 0,
          totAmt: contra.totAmt ?? 0,
          totLocalAmt: contra.totLocalAmt ?? 0,
          exhGainLoss: contra.exhGainLoss ?? 0,
          moduleFrom: contra.moduleFrom ?? "",
          editVersion: contra.editVersion ?? 0,
          data_details:
            contra.data_details?.map((detail) => ({
              ...detail,
              contraId: detail.contraId?.toString() ?? "0",
              contraNo: detail.contraNo ?? "",
              itemNo: detail.itemNo ?? 0,
              moduleId: detail.moduleId ?? 0,
              transactionId: detail.transactionId ?? 0,
              documentId: detail.documentId ?? 0,
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
            ...defaultContraValues,
            createBy: userName,
            createDate: currentDateTime,
            data_details: [],
          }
        })(),
  })

  // Data fetching moved to PaymentTable component for better performance

  const previousDateFormatRef = useRef<string>(dateFormat)
  const lastQueriedDocRef = useRef<string | null>(null)
  const { isDirty } = form.formState

  useEffect(() => {
    if (previousDateFormatRef.current === dateFormat) return
    previousDateFormatRef.current = dateFormat

    if (isDirty) return

    const currentContraId = form.getValues("contraId") || "0"
    if (
      (contra && contra.contraId && contra.contraId !== "0") ||
      currentContraId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultContraValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [dateFormat, defaultContraValues, decimals, form, contra, isDirty, user])

  // Mutations
  const saveMutation = usePersist<GLContraHdSchemaType>(`${GLContra.add}`)
  const updateMutation = usePersist<GLContraHdSchemaType>(`${GLContra.add}`)
  const deleteMutation = useDeleteWithRemarks(`${GLContra.delete}`)

  // Remove the useGetPaymentById hook for selection
  // const { data: paymentByIdData, refetch: refetchPaymentById } = ...

  // Handle Save
  const handleSaveContra = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as IGLContraHd
      )

      console.log("formValues", formValues)

      // Validate the form data using the schema
      const validationResult = GLContraHdSchema(required, visible).safeParse(
        formValues
      )

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          referenceNo: "Reference No",
          accountDate: "Account Date",
          contraNo: "Contra No",
          currencyId: "Currency",
          exhRate: "Exchange Rate",
          totAmt: "Total Amount",
          remarks: "Remarks",
        }
        const failedFields: string[] = []
        validationResult.error.issues.forEach((error) => {
          const pathKey = error.path.join(".")
          const fieldPath = pathKey as keyof GLContraHdSchemaType
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

      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.contraId) === 0
        const prevAccountDate = isNew ? accountDate : previousAccountDate

        console.log("accountDate", accountDate)
        console.log("prevAccountDate", prevAccountDate)

        const parsedAccountDate = parseWithFallback(accountDate)
        if (!parsedAccountDate) {
          toast.error("Invalid account date")
          return
        }

        const parsedPrevAccountDate = parseWithFallback(prevAccountDate)

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
        }

        const response =
          Number(formValues.contraId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const paymentData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (paymentData) {
            const updatedSchemaType = transformToSchemaType(
              paymentData as unknown as IGLContraHd
            )
            setSearchNo(updatedSchemaType.contraNo || "")
            setContra(updatedSchemaType)
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

          // Data refresh handled by PaymentTable component
        } else {
          toast.error(response.message || "Failed to save contra")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving contra")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneContra = async () => {
    if (contra) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedContra: GLContraHdSchemaType = {
        ...contra,
        contraId: "0",
        contraNo: "",
        // Set all dates to current date
        trnDate: dateStr,
        accountDate: dateStr,
        // Clear all audit fields
        createBy: "",
        editBy: "",
        cancelBy: "",
        createDate: "",
        editDate: "",
        cancelDate: "",
        // Clear all amounts for new payment
        totAmt: 0,
        totLocalAmt: 0,
        exhGainLoss: 0,
        // Clear data details - remove all records
        data_details: [],
      }

      setContra(clonedContra)
      form.reset(clonedContra)
      form.trigger("accountDate")

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedContra.currencyId && clonedContra.accountDate) {
        try {
          // Wait a tick to ensure form state is updated before calling setExchangeRate
          await new Promise((resolve) => setTimeout(resolve, 0))

          await setExchangeRate(form, exhRateDec, visible)
        } catch (error) {
          console.error("Error updating exchange rates:", error)
        }
      }

      // Clear search input
      setSearchNo("")

      toast.success("Contra cloned successfully")
    }
  }

  // Handle Delete - First Level: Confirmation
  const handleDeleteConfirmation = () => {
    // Close delete confirmation and open cancel confirmation
    setShowDeleteConfirm(false)
    setShowCancelConfirm(true)
  }

  // Handle Delete - Second Level: With Cancel Remarks
  const handleContraDelete = async (cancelRemarks: string) => {
    if (!contra) return

    try {
      const response = await deleteMutation.mutateAsync({
        documentId: contra.contraId?.toString() ?? "",
        documentNo: contra.contraNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setContra(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultContraValues,
          data_details: [],
        })
        toast.success(`Contra ${contra.contraNo} deleted successfully`)
        // Data refresh handled by ContraTable component
      } else {
        toast.error(response.message || "Failed to delete contra")
      }
    } catch {
      toast.error("Network error while deleting contra")
    }
  }

  // Handle Reset
  const handleContraReset = () => {
    setContra(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new payment)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultContraValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("Contra reset successfully")
  }

  // Handle Print Contra Report
  const handlePrintContra = () => {
    if (!contra || contra.contraId === "0") {
      toast.error("Please select a contra to print")
      return
    }

    const formValues = form.getValues()
    const contraId = formValues.contraId || contra.contraId?.toString() || "0"
    const contraNo = formValues.contraNo || contra.contraNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: contraId,
      invoiceNo: contraNo,
      reportType: 1,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Store report data in sessionStorage
    const reportData = {
      reportFile: "gl/GLContra.trdp",
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

  // Helper function to transform IGLContraHd to GLContraHdSchemaType
  const transformToSchemaType = useCallback(
    (apiContra: IGLContraHd): GLContraHdSchemaType => {
      return {
        contraId: apiContra.contraId?.toString() ?? "0",
        contraNo: apiContra.contraNo ?? "",
        referenceNo: apiContra.referenceNo ?? "",
        trnDate: apiContra.trnDate
          ? format(
              parseDate(apiContra.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiContra.accountDate
          ? format(
              parseDate(apiContra.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        supplierId: apiContra.supplierId ?? 0,
        customerId: apiContra.customerId ?? 0,
        currencyId: apiContra.currencyId ?? 0,
        exhRate: apiContra.exhRate ?? 0,
        totAmt: apiContra.totAmt ?? 0,
        totLocalAmt: apiContra.totLocalAmt ?? 0,
        exhGainLoss: apiContra.exhGainLoss ?? 0,
        remarks: apiContra.remarks ?? "",
        moduleFrom: apiContra.moduleFrom ?? "",
        editVersion: apiContra.editVersion ?? 0,
        createBy: apiContra.createBy ?? "",
        editBy: apiContra.editBy ?? "",
        cancelBy: apiContra.cancelBy ?? "",
        isCancel: apiContra.isCancel ?? false,
        createDate: apiContra.createDate
          ? format(
              parseDate(apiContra.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        editDate: apiContra.editDate
          ? format(
              parseDate(apiContra.editDate as unknown as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiContra.cancelDate
          ? format(
              parseDate(apiContra.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelRemarks: apiContra.cancelRemarks ?? "",
        data_details:
          apiContra.data_details?.map(
            (detail) =>
              ({
                ...detail,
                contraId: detail.contraId?.toString() ?? "0",
                contraNo: detail.contraNo ?? "",
                itemNo: detail.itemNo ?? 0,
                moduleId: detail.moduleId ?? 0,
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
              }) as unknown as GLContraDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const handleContraSelect = async (
    selectedPayment: IGLContraHd | undefined
  ) => {
    if (!selectedPayment) return

    try {
      // Fetch payment details directly using selected payment's values
      const response = await getById(
        `${GLContra.getByIdNo}/${selectedPayment.contraId}/${selectedPayment.contraNo}`
      )

      if (response?.result === 1) {
        const detailedPayment = Array.isArray(response.data)
          ? response.data[0]
          : response.data

        if (detailedPayment) {
          {
            const parsed = parseDate(detailedPayment.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedPayment.accountDate as string)
            )
          }

          // Parse dates properly
          const updatedPayment = {
            ...detailedPayment,
            contraId: detailedPayment.contraId?.toString() ?? "0",
            contraNo: detailedPayment.contraNo ?? "",
            referenceNo: detailedPayment.referenceNo ?? "",
            trnDate: detailedPayment.trnDate
              ? format(
                  parseDate(detailedPayment.trnDate as string) || new Date(),
                  dateFormat
                )
              : dateFormat,
            accountDate: detailedPayment.accountDate
              ? format(
                  parseDate(detailedPayment.accountDate as string) ||
                    new Date(),
                  dateFormat
                )
              : dateFormat,

            supplierId: detailedPayment.supplierId ?? 0,
            customerId: detailedPayment.customerId ?? 0,
            currencyId: detailedPayment.currencyId ?? 0,
            exhRate: detailedPayment.exhRate ?? 0,
            totAmt: detailedPayment.totAmt ?? 0,
            totLocalAmt: detailedPayment.totLocalAmt ?? 0,
            exhGainLoss: detailedPayment.exhGainLoss ?? 0,
            remarks: detailedPayment.remarks ?? "",
            data_details:
              detailedPayment.data_details?.map((detail: IGLContraDt) => ({
                contraId: detail.contraId?.toString() ?? "0",
                contraNo: detail.contraNo ?? "",
                itemNo: detail.itemNo ?? 0,
                moduleId: detail.moduleId ?? 0,
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
              })) || [],
          }

          //setContra(updatedPayment as GLContraHdSchemaType)
          setContra(transformToSchemaType(updatedPayment))
          form.reset(updatedPayment)
          form.trigger()

          // Set the payment number in search input
          setSearchNo(updatedPayment.contraNo || "")

          // Close dialog only on success
          setShowListDialog(false)
          toast.success(
            `Payment ${updatedPayment.contraNo} loaded successfully`
          )
        }
      } else {
        toast.error(response?.message || "Failed to fetch payment details")
        // Keep dialog open on failure so user can try again
      }
    } catch (error) {
      console.error("Error fetching payment details:", error)
      toast.error("Error loading payment. Please try again.")
      // Keep dialog open on error
    } finally {
      // Selection completed
    }
  }

  // Remove direct refetchPayments from handleFilterChange
  const handleFilterChange = (newFilters: IGLContraFilter) => {
    setFilters(newFilters)
    // refetchPayments(); // Removed: will be handled by useEffect
  }

  // Set createBy and createDate for new payments on page load/refresh
  useEffect(() => {
    if (!contra && user && decimals.length > 0) {
      const currentContraId = form.getValues("contraId")
      const currentContraNo = form.getValues("contraNo")
      const isNewContra =
        !currentContraId || currentContraId === "0" || !currentContraNo

      if (isNewContra) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [contra, user, decimals, form])

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

  const handleContraSearch = useCallback(
    async (value: string) => {
      if (!value) return

      setIsLoadingPayment(true)

      try {
        const response = await getById(`${GLContra.getByIdNo}/0/${value}`)

        if (response?.result === 1) {
          const detailedPayment = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedPayment) {
            {
              const parsed = parseDate(detailedPayment.accountDate as string)
              setPreviousAccountDate(
                parsed
                  ? format(parsed, dateFormat)
                  : (detailedPayment.accountDate as string)
              )
            }
            // Parse dates properly
            const updatedPayment = {
              ...detailedPayment,
              contraId: detailedPayment.contraId?.toString() ?? "0",
              contraNo: detailedPayment.contraNo ?? "",
              referenceNo: detailedPayment.referenceNo ?? "",
              suppInvoiceNo: "", // Required by schema but not in interface
              trnDate: detailedPayment.trnDate
                ? format(
                    parseDate(detailedPayment.trnDate as string) || new Date(),
                    dateFormat
                  )
                : dateFormat,
              accountDate: detailedPayment.accountDate
                ? format(
                    parseDate(detailedPayment.accountDate as string) ||
                      new Date(),
                    dateFormat
                  )
                : dateFormat,

              supplierId: detailedPayment.supplierId ?? 0,
              currencyId: detailedPayment.currencyId ?? 0,
              exhRate: detailedPayment.exhRate ?? 0,
              bankId: detailedPayment.bankId ?? 0,
              paymentTypeId: detailedPayment.paymentTypeId ?? 0,
              chequeNo: detailedPayment.chequeNo ?? "",
              chequeDate: detailedPayment.chequeDate
                ? format(
                    parseDate(detailedPayment.chequeDate as string) ||
                      new Date(),
                    dateFormat
                  )
                : dateFormat,
              bankChgGLId: detailedPayment.bankChgGLId ?? 0,
              bankChgAmt: detailedPayment.bankChgAmt ?? 0,
              bankChgLocalAmt: detailedPayment.bankChgLocalAmt ?? 0,
              totAmt: detailedPayment.totAmt ?? 0,
              totLocalAmt: detailedPayment.totLocalAmt ?? 0,
              payCurrencyId: detailedPayment.payCurrencyId ?? 0,
              payExhRate: detailedPayment.payExhRate ?? 0,
              payTotAmt: detailedPayment.payTotAmt ?? 0,
              payTotLocalAmt: detailedPayment.payTotLocalAmt ?? 0,
              unAllocTotAmt: detailedPayment.unAllocTotAmt ?? 0,
              unAllocTotLocalAmt: detailedPayment.unAllocTotLocalAmt ?? 0,
              exhGainLoss: detailedPayment.exhGainLoss ?? 0,
              remarks: detailedPayment.remarks ?? "",
              docExhRate: detailedPayment.docExhRate ?? 0,
              docTotAmt: detailedPayment.docTotAmt ?? 0,
              docTotLocalAmt: detailedPayment.docTotLocalAmt ?? 0,
              allocTotAmt: detailedPayment.allocTotAmt ?? 0,
              allocTotLocalAmt: detailedPayment.allocTotLocalAmt ?? 0,
              jobOrderId: detailedPayment.jobOrderId ?? 0,
              jobOrderNo: detailedPayment.jobOrderNo ?? "",
              moduleFrom: detailedPayment.moduleFrom ?? "",
              editVersion: detailedPayment.editVersion ?? 0,
              createBy: detailedPayment.createBy ?? "",
              createDate: detailedPayment.createDate
                ? format(
                    parseDate(detailedPayment.createDate as string) ||
                      new Date(),
                    decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
                  )
                : "",
              editBy: detailedPayment.editBy ?? "",
              editDate: detailedPayment.editDate
                ? format(
                    parseDate(detailedPayment.editDate as string) || new Date(),
                    decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
                  )
                : "",
              isCancel: detailedPayment.isCancel ?? false,
              cancelBy: detailedPayment.cancelBy ?? "",
              cancelDate: detailedPayment.cancelDate
                ? format(
                    parseDate(detailedPayment.cancelDate as string) ||
                      new Date(),
                    decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
                  )
                : "",
              cancelRemarks: detailedPayment.cancelRemarks ?? "",

              data_details:
                detailedPayment.data_details?.map((detail: IGLContraDt) => ({
                  contraId: detail.contraId?.toString() ?? "0",
                  contraNo: detail.contraNo ?? "",
                  itemNo: detail.itemNo ?? 0,
                  moduleId: detail.moduleId ?? 0,
                  transactionId: detail.transactionId ?? 0,
                  documentId: detail.documentId?.toString() ?? "0",
                  documentNo: detail.documentNo ?? "",
                  docRefNo: detail.docRefNo ?? "",
                  docCurrencyId: detail.docCurrencyId ?? 0,
                  docExhRate: detail.docExhRate ?? 0,
                  docAccountDate: detail.docAccountDate
                    ? format(
                        parseDate(detail.docAccountDate as string) ||
                          new Date(),
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
                })) || [],
            }

            //setContra(updatedPayment as GLContraHdSchemaType)
            setContra(transformToSchemaType(updatedPayment))
            form.reset(updatedPayment)
            form.trigger()

            // Set the payment number in search input to the actual payment number from database
            setSearchNo(updatedPayment.contraNo || "")

            // Show success message
            toast.success(
              `Payment ${updatedPayment.contraNo || value} loaded successfully`
            )

            // Close the load confirmation dialog on success
            setShowLoadConfirm(false)
          }
        } else {
          toast.error(response?.message || "Failed to fetch payment details")
          // Keep dialog open on failure so user can try again
        }
      } catch (error) {
        console.error("Error fetching payment details:", error)
        toast.error("Error loading payment. Please try again.")
        // Keep dialog open on error
      } finally {
        setIsLoadingPayment(false)
      }
    },
    [
      dateFormat,
      decimals,
      form,
      setIsLoadingPayment,
      setPreviousAccountDate,
      setContra,
      setShowLoadConfirm,
      transformToSchemaType,
    ]
  )

  useEffect(() => {
    if (!pendingDocNo) return
    if (lastQueriedDocRef.current === pendingDocNo) return

    lastQueriedDocRef.current = pendingDocNo
    setSearchNo(pendingDocNo)
    void handleContraSearch(pendingDocNo)
  }, [handleContraSearch, pendingDocNo])

  // Determine mode and payment ID from URL
  const contraNo = form.getValues("contraNo")
  const isEdit = Boolean(contraNo)
  const isCancelled = contra?.isCancel === true

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

  // Handle double-click to copy contraNo to clipboard
  const handleCopyInvoiceNo = useCallback(async () => {
    const contraNoToCopy = isEdit
      ? contra?.contraNo || form.getValues("contraNo") || ""
      : form.getValues("contraNo") || ""

    await copyToClipboard(contraNoToCopy)
  }, [isEdit, contra?.contraNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `Contra (Edit)- v[${contra?.editVersion}] - ${contraNo}`
    : "Contra (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading contra form...</p>
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
              {contra?.cancelRemarks && (
                <div className="max-w-[160px] truncate text-xs text-red-600 sm:max-w-[220px]">
                  {contra.cancelRemarks}
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
                title="Double-click to copy contra number"
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
                if (contra?.contraNo) {
                  setSearchNo(contra.contraNo)
                  setShowLoadConfirm(true)
                }
              }}
              disabled={isLoadingPayment}
              className="h-4 w-4 p-0"
              title="Refresh contra data"
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
              onBlur={() => {
                if (searchNo.trim()) {
                  setShowLoadConfirm(true)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchNo.trim()) {
                  e.preventDefault()
                  setShowLoadConfirm(true)
                }
              }}
              placeholder="Search Contra No"
              className="h-7 cursor-pointer text-xs"
              readOnly={!!contra?.contraId && contra.contraId !== "0"}
              disabled={!!contra?.contraId && contra.contraId !== "0"}
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
              (!isEdit && !canCreate)
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
            disabled={!contra || contra.contraId === "0"}
            onClick={handlePrintContra}
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
            disabled={!contra || contra.contraId === "0" || isCancelled}
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
              !contra ||
              contra.contraId === "0" ||
              deleteMutation.isPending ||
              isCancelled ||
              !canDelete
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
            handleSaveContra()
          }}
          isEdit={isEdit}
          visible={visible}
          required={required}
          companyId={Number(companyId)}
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
              Payment List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing payments from the list below. Use
              search to filter records or create new payments.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <ContraTable
              onContraSelect={handleContraSelect}
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
        onConfirm={handleSaveContra}
        itemName={contra?.contraNo || "New Contra"}
        operationType={
          contra?.contraId && contra.contraId !== "0" ? "update" : "create"
        }
        isSaving={
          isSaving || saveMutation.isPending || updateMutation.isPending
        }
      />

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => handleDeleteConfirmation()}
        itemName={contra?.contraNo}
        title="Delete Contra"
        description="This action cannot be undone. All contra details will be permanently deleted."
        isDeleting={deleteMutation.isPending}
      />

      {/* Cancel Confirmation */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleContraDelete}
        itemName={contra?.contraNo}
        title="Cancel Contra"
        description="Please provide a reason for cancelling this contra."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleContraSearch(searchNo)}
        code={searchNo}
        typeLabel="Contra"
        showDetails={false}
        description={`Do you want to load Contra ${searchNo}?`}
        isLoading={isLoadingPayment}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleContraReset}
        itemName={contra?.contraNo}
        title="New Contra"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneContra}
        itemName={contra?.contraNo}
        title="Clone Contra"
        description="This will create a copy as a new contra."
      />
    </>
  )
}
