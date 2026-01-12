"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  ICbBankTransferCtmDt,
  ICbBankTransferCtmFilter,
  ICbBankTransferCtmHd,
} from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  CbBankTransferCtmHdSchema,
  CbBankTransferCtmHdSchemaType,
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
import { BasicSetting, CbBankTransferCtm } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { CBTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetRequiredFields, useGetVisibleFields } from "@/hooks/use-lookup"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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

import { getDefaultValues } from "./components/cbbanktransferctm-defaultvalues"
import CbBankTransferCtmTable from "./components/cbbanktransferctm-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function CbBankTransferCtmPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbanktransferctm

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
  const [isLoadingCbBankTransferCtm, setIsLoadingCbBankTransferCtm] =
    useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [cbBankTransferCtm, setCbBankTransferCtm] =
    useState<CbBankTransferCtmHdSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/cb/cbbanktransferctm`,
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

  const [filters, setFilters] = useState<ICbBankTransferCtmFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "transferNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultCbBankTransferCtmValues = useMemo(
    () => getDefaultValues(dateFormat).defaultCbBankTransferCtm,
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
  const form = useForm<CbBankTransferCtmHdSchemaType>({
    resolver: zodResolver(CbBankTransferCtmHdSchema(required, visible)),
    defaultValues: cbBankTransferCtm
      ? {
          transferId: cbBankTransferCtm.transferId?.toString() ?? "0",
          transferNo: cbBankTransferCtm.transferNo ?? "",
          referenceNo: cbBankTransferCtm.referenceNo ?? "",
          trnDate: cbBankTransferCtm.trnDate ?? new Date(),
          accountDate: cbBankTransferCtm.accountDate ?? new Date(),
          paymentTypeId: cbBankTransferCtm.paymentTypeId ?? 0,
          chequeNo: cbBankTransferCtm.chequeNo ?? "",
          chequeDate: cbBankTransferCtm.chequeDate ?? new Date(),
          fromBankId: cbBankTransferCtm.fromBankId ?? 0,
          fromCurrencyId: cbBankTransferCtm.fromCurrencyId ?? 0,
          fromExhRate: cbBankTransferCtm.fromExhRate ?? 0,
          fromBankChgGLId: cbBankTransferCtm.fromBankChgGLId ?? 0,
          fromBankChgAmt: cbBankTransferCtm.fromBankChgAmt ?? 0,
          fromBankChgLocalAmt: cbBankTransferCtm.fromBankChgLocalAmt ?? 0,
          fromTotAmt: cbBankTransferCtm.fromTotAmt ?? 0,
          fromTotLocalAmt: cbBankTransferCtm.fromTotLocalAmt ?? 0,
          remarks: cbBankTransferCtm.remarks ?? "",
          payeeTo: cbBankTransferCtm.payeeTo ?? "",
          exhGainLoss: cbBankTransferCtm.exhGainLoss ?? 0,
          moduleFrom: cbBankTransferCtm.moduleFrom ?? "",
          editVersion: cbBankTransferCtm.editVersion ?? 0,
          isCancel: cbBankTransferCtm.isCancel ?? false,
          cancelBy: cbBankTransferCtm.cancelBy ?? null,
          cancelDate: cbBankTransferCtm.cancelDate ?? null,
          cancelRemarks: cbBankTransferCtm.cancelRemarks ?? null,
          isPost: cbBankTransferCtm.isPost ?? null,
          postBy: cbBankTransferCtm.postBy ?? null,
          postDate: cbBankTransferCtm.postDate ?? null,
          appStatusId: cbBankTransferCtm.appStatusId ?? null,
          appBy: cbBankTransferCtm.appBy ?? null,
          appDate: cbBankTransferCtm.appDate ?? null,
          createBy: cbBankTransferCtm.createBy ?? "",
          createDate: cbBankTransferCtm.createDate ?? "",
          editBy: cbBankTransferCtm.editBy ?? null,
          editDate: cbBankTransferCtm.editDate ?? null,
          data_details:
            cbBankTransferCtm.data_details?.map((detail) => ({
              ...detail,
              transferId: detail.transferId?.toString() ?? "0",
              transferNo: detail.transferNo ?? "",
              itemNo: detail.itemNo ?? 0,
              seqNo: detail.seqNo ?? 0,
              jobOrderId: detail.jobOrderId ?? 0,
              jobOrderNo: detail.jobOrderNo ?? "",
              taskId: detail.taskId ?? 0,
              taskName: detail.taskName ?? "",
              serviceItemNo: detail.serviceItemNo ?? 0,
              serviceItemNoName: detail.serviceItemNoName ?? "",
              toBankId: detail.toBankId ?? 0,
              toBankCode: detail.toBankCode ?? "",
              toBankName: detail.toBankName ?? "",
              toCurrencyId: detail.toCurrencyId ?? 0,
              toCurrencyCode: detail.toCurrencyCode ?? "",
              toCurrencyName: detail.toCurrencyName ?? "",
              toExhRate: detail.toExhRate ?? 0,
              toTotAmt: detail.toTotAmt ?? 0,
              toTotLocalAmt: detail.toTotLocalAmt ?? 0,
              toBankChgGLId: detail.toBankChgGLId ?? 0,
              toBankChgGLCode: detail.toBankChgGLCode ?? "",
              toBankChgGLName: detail.toBankChgGLName ?? "",
              toBankChgAmt: detail.toBankChgAmt ?? 0,
              toBankChgLocalAmt: detail.toBankChgLocalAmt ?? 0,
              toBankExhRate: detail.toBankExhRate ?? 0,
              toBankTotAmt: detail.toBankTotAmt ?? 0,
              toBankTotLocalAmt: detail.toBankTotLocalAmt ?? 0,
              editVersion: detail.editVersion ?? 0,
            })) || [],
        }
      : (() => {
          // For new cbBankTransferCtm, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultCbBankTransferCtmValues,
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

    const currentTransferId = form.getValues("transferId") || "0"
    if (
      (cbBankTransferCtm &&
        cbBankTransferCtm.transferId &&
        cbBankTransferCtm.transferId !== "0") ||
      currentTransferId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCbBankTransferCtmValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [
    dateFormat,
    defaultCbBankTransferCtmValues,
    decimals,
    form,
    cbBankTransferCtm,
    isDirty,
    user,
  ])

  // Mutations
  const saveMutation = usePersist<CbBankTransferCtmHdSchemaType>(
    `${CbBankTransferCtm.add}`
  )
  const updateMutation = usePersist<CbBankTransferCtmHdSchemaType>(
    `${CbBankTransferCtm.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${CbBankTransferCtm.delete}`)

  // Remove the useGetCbBankTransferCtmById hook for selection
  // const { data: invoiceByIdData, refetch: refetchCbBankTransferCtmById } = ...

  // Handle Save
  const handleSaveCbBankTransferCtm = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as ICbBankTransferCtmHd
      )

      // Validate the form data using the schema
      const validationResult = CbBankTransferCtmHdSchema(
        required,
        visible
      ).safeParse(formValues)

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        // Set field-level errors on the form so FormMessage components can display them
        validationResult.error.issues.forEach((error) => {
          const fieldPath = error.path.join(
            "."
          ) as keyof CbBankTransferCtmHdSchemaType
          form.setError(fieldPath, {
            type: "validation",
            message: error.message,
          })
        })

        toast.error("Please check form data and try again")
        return
      }

      // Check if there are detail items
      if (!formValues.data_details || formValues.data_details.length === 0) {
        toast.warning("Please add at least one transfer detail")
        return
      }

      // Check header from total amounts should not be zero
      if (formValues.fromTotAmt === 0 || formValues.fromTotLocalAmt === 0) {
        toast.warning(
          "From Total Amount and From Total Local Amount should not be zero"
        )
        return
      }

      // Validate that fromTotLocalAmt equals sum of (toTotLocalAmt + toBankChgLocalAmt) from all details
      const { validateFromTotLocalAmt } = await import(
        "@/helpers/cb-banktransferctm-calculations"
      )
      const locAmtDec = decimals[0]?.locAmtDec || 2
      const validation = validateFromTotLocalAmt(
        formValues.fromTotLocalAmt,
        formValues.data_details as unknown as ICbBankTransferCtmDt[],
        locAmtDec
      )

      if (!validation.isValid) {
        toast.error(
          `From Total Local Amount (${validation.actualTotal.toFixed(
            locAmtDec
          )}) must equal the sum of all details (To Total Local + To Bank Charge Local) = ${validation.expectedTotal.toFixed(
            locAmtDec
          )}`
        )
        form.setError("fromTotLocalAmt", {
          type: "validation",
          message: `Must equal sum of details: ${validation.expectedTotal.toFixed(
            locAmtDec
          )}`,
        })
        return
      }

      console.log("handleSaveCbBankTransferCtm formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.transferId) === 0
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
          Number(formValues.transferId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const bankTransferData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (bankTransferData) {
            const updatedSchemaType = transformToSchemaType(
              bankTransferData as unknown as ICbBankTransferCtmHd
            )

            setSearchNo(updatedSchemaType.transferNo || "")
            setCbBankTransferCtm(updatedSchemaType)
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

          // Data refresh handled by CbBankTransferCtmTable component
        } else {
          toast.error(response.message || "Failed to save Bank Transfer CTM")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving Bank Transfer CTM")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneCbBankTransferCtm = async () => {
    if (cbBankTransferCtm) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedBankTransferCtm: CbBankTransferCtmHdSchemaType = {
        ...cbBankTransferCtm,
        transferId: "0",
        transferNo: "",
        // Set all dates to current date
        trnDate: dateStr,
        accountDate: dateStr,
        chequeDate: dateStr,
        // Clear all audit fields
        createBy: "",
        editBy: "",
        cancelBy: "",
        createDate: "",
        editDate: null,
        cancelDate: null,
        // Reset amounts for new Bank Transfer CTM
        fromTotAmt: 0,
        fromTotLocalAmt: 0,
        exhGainLoss: 0,
        // Clone details with reset IDs
        data_details:
          cbBankTransferCtm.data_details?.map((detail) => ({
            ...detail,
            transferId: "0",
            transferNo: "",
            editVersion: 0,
          })) || [],
      }

      setCbBankTransferCtm(clonedBankTransferCtm)
      form.reset(clonedBankTransferCtm)

      // Clear search input
      setSearchNo("")

      toast.success("Bank Transfer CTM cloned successfully")
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
  const handleCbBankTransferCtmDelete = async (cancelRemarks: string) => {
    if (!cbBankTransferCtm) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("Bank Transfer CTM ID:", cbBankTransferCtm.transferId)
      console.log("Bank Transfer CTM No:", cbBankTransferCtm.transferNo)

      const response = await deleteMutation.mutateAsync({
        documentId: cbBankTransferCtm.transferId?.toString() ?? "",
        documentNo: cbBankTransferCtm.transferNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setCbBankTransferCtm(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultCbBankTransferCtmValues,
          data_details: [],
        })
        toast.success(
          `Bank Transfer CTM ${cbBankTransferCtm.transferNo} deleted successfully`
        )
        // Data refresh handled by CbBankTransferCtmTable component
      } else {
        toast.error(response.message || "Failed to delete Bank Transfer CTM")
      }
    } catch {
      toast.error("Network error while deleting Bank Transfer CTM")
    }
  }

  // Handle Reset
  const handleCbBankTransferCtmReset = () => {
    setCbBankTransferCtm(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new Bank Transfer CTM)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCbBankTransferCtmValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("Bank Transfer CTM reset successfully")
  }

  // Handle Print Bank Transfer CTM Report
  const handlePrintCbBankTransferCtm = (
    reportType: "direct" | "bankTransferCtm" = "bankTransferCtm"
  ) => {
    if (!cbBankTransferCtm || cbBankTransferCtm.transferId === "0") {
      toast.error("Please select a Bank Transfer CTM to print")
      return
    }

    const formValues = form.getValues()
    const transferId =
      formValues.transferId || cbBankTransferCtm.transferId?.toString() || "0"
    const transferNo =
      formValues.transferNo || cbBankTransferCtm.transferNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: transferId,
      invoiceNo: transferNo,
      reportType: reportType === "direct" ? 1 : 2,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Determine report file based on type
    const reportFile = "cb/CbBankTransferCtm.trdp"

    // Store report data in sessionStorage
    const reportData = {
      reportFile: reportFile,
      parameters: reportParams,
    }

    try {
      sessionStorage.setItem(
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

  // Helper function to transform ICbBankTransferCtmHd to CbBankTransferCtmHdSchemaType
  const transformToSchemaType = useCallback(
    (
      apiCbBankTransferCtm: ICbBankTransferCtmHd
    ): CbBankTransferCtmHdSchemaType => {
      return {
        transferId: apiCbBankTransferCtm.transferId?.toString() ?? "0",
        transferNo: apiCbBankTransferCtm.transferNo ?? "",
        referenceNo: apiCbBankTransferCtm.referenceNo ?? "",
        trnDate: apiCbBankTransferCtm.trnDate
          ? format(
              parseDate(apiCbBankTransferCtm.trnDate as string) || new Date(),
              dateFormat
            )
          : format(new Date(), dateFormat),
        accountDate: apiCbBankTransferCtm.accountDate
          ? format(
              parseDate(apiCbBankTransferCtm.accountDate as string) ||
                new Date(),
              dateFormat
            )
          : format(new Date(), dateFormat),
        paymentTypeId: apiCbBankTransferCtm.paymentTypeId ?? 0,
        chequeNo: apiCbBankTransferCtm.chequeNo ?? "",
        chequeDate: apiCbBankTransferCtm.chequeDate
          ? format(
              parseDate(apiCbBankTransferCtm.chequeDate as string) ||
                new Date(),
              dateFormat
            )
          : apiCbBankTransferCtm.accountDate
            ? format(
                parseDate(apiCbBankTransferCtm.accountDate as string) ||
                  new Date(),
                dateFormat
              )
            : format(new Date(), dateFormat),

        fromBankId: apiCbBankTransferCtm.fromBankId ?? 0,
        fromCurrencyId: apiCbBankTransferCtm.fromCurrencyId ?? 0,
        fromExhRate: apiCbBankTransferCtm.fromExhRate ?? 0,
        fromBankChgGLId: apiCbBankTransferCtm.fromBankChgGLId ?? 0,
        fromBankChgAmt: apiCbBankTransferCtm.fromBankChgAmt ?? 0,
        fromBankChgLocalAmt: apiCbBankTransferCtm.fromBankChgLocalAmt ?? 0,
        fromTotAmt: apiCbBankTransferCtm.fromTotAmt ?? 0,
        fromTotLocalAmt: apiCbBankTransferCtm.fromTotLocalAmt ?? 0,

        remarks: apiCbBankTransferCtm.remarks ?? "",
        payeeTo: apiCbBankTransferCtm.payeeTo ?? "",
        moduleFrom: apiCbBankTransferCtm.moduleFrom ?? "",
        exhGainLoss: apiCbBankTransferCtm.exhGainLoss ?? 0,
        editVersion: apiCbBankTransferCtm.editVersion ?? 0,
        createBy: apiCbBankTransferCtm.createBy ?? "",
        editBy: apiCbBankTransferCtm.editBy ?? "",
        cancelBy: apiCbBankTransferCtm.cancelBy ?? "",
        createDate: apiCbBankTransferCtm.createDate
          ? format(
              parseDate(apiCbBankTransferCtm.createDate as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        editDate: apiCbBankTransferCtm.editDate
          ? parseDate(apiCbBankTransferCtm.editDate as unknown as string) ||
            null
          : null,
        cancelDate: apiCbBankTransferCtm.cancelDate
          ? parseDate(apiCbBankTransferCtm.cancelDate as unknown as string) ||
            null
          : null,
        cancelRemarks: apiCbBankTransferCtm.cancelRemarks ?? null,
        isPost: apiCbBankTransferCtm.isPost ?? false,
        postBy: apiCbBankTransferCtm.postBy ?? "",
        postDate: apiCbBankTransferCtm.postDate
          ? parseDate(apiCbBankTransferCtm.postDate as unknown as string) ||
            null
          : null,
        appStatusId: apiCbBankTransferCtm.appStatusId ?? null,
        appBy: apiCbBankTransferCtm.appBy ?? "",
        appDate: apiCbBankTransferCtm.appDate
          ? parseDate(apiCbBankTransferCtm.appDate as unknown as string) || null
          : null,
        isCancel: apiCbBankTransferCtm.isCancel ?? false,
        data_details:
          apiCbBankTransferCtm.data_details?.map((detail) => ({
            transferId: detail.transferId?.toString() ?? "0",
            transferNo: detail.transferNo ?? "",
            itemNo: detail.itemNo ?? 0,
            seqNo: detail.seqNo ?? 0,
            jobOrderId: detail.jobOrderId ?? 0,
            jobOrderNo: detail.jobOrderNo ?? "",
            taskId: detail.taskId ?? 0,
            taskName: detail.taskName ?? "",
            serviceItemNo: detail.serviceItemNo ?? 0,
            serviceItemNoName: detail.serviceItemNoName ?? "",
            toBankId: detail.toBankId ?? 0,
            toBankCode: detail.toBankCode ?? "",
            toBankName: detail.toBankName ?? "",
            toCurrencyId: detail.toCurrencyId ?? 0,
            toCurrencyCode: detail.toCurrencyCode ?? "",
            toCurrencyName: detail.toCurrencyName ?? "",
            toExhRate: detail.toExhRate ?? 0,
            toBankChgGLId: detail.toBankChgGLId ?? 0,
            toBankChgGLCode: detail.toBankChgGLCode ?? "",
            toBankChgGLName: detail.toBankChgGLName ?? "",
            toBankChgAmt: detail.toBankChgAmt ?? 0,
            toBankChgLocalAmt: detail.toBankChgLocalAmt ?? 0,
            toTotAmt: detail.toTotAmt ?? 0,
            toTotLocalAmt: detail.toTotLocalAmt ?? 0,
            toBankExhRate: detail.toBankExhRate ?? 0,
            toBankTotAmt: detail.toBankTotAmt ?? 0,
            toBankTotLocalAmt: detail.toBankTotLocalAmt ?? 0,
            editVersion: detail.editVersion ?? 0,
          })) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadCbBankTransferCtm = useCallback(
    async ({
      transferId,
      transferNo,
      showLoader = false,
    }: {
      transferId?: string | number | null
      transferNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("transferId", transferId)
      console.log("transferNo", transferNo)
      const trimmedTransferNo = transferNo?.trim() ?? ""
      const trimmedTransferId =
        typeof transferId === "number"
          ? transferId.toString()
          : (transferId?.toString().trim() ?? "")

      if (!trimmedTransferNo && !trimmedTransferId) return null

      if (showLoader) {
        setIsLoadingCbBankTransferCtm(true)
      }

      const requestTransferId = trimmedTransferId || "0"
      const requestTransferNo = trimmedTransferNo || ""

      try {
        const response = await getById(
          `${CbBankTransferCtm.getByIdNo}/${requestTransferId}/${requestTransferNo}`
        )

        if (response?.result === 1) {
          const detailedBankTransferCtm = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedBankTransferCtm) {
            const parsed = parseDate(
              detailedBankTransferCtm.accountDate as string
            )
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedBankTransferCtm.accountDate as string)
            )

            const updatedBankTransferCtm = transformToSchemaType(
              detailedBankTransferCtm
            )

            setCbBankTransferCtm(updatedBankTransferCtm)
            form.reset(updatedBankTransferCtm)
            form.trigger()

            const resolvedTransferNo =
              updatedBankTransferCtm.transferNo ||
              trimmedTransferNo ||
              trimmedTransferId
            setSearchNo(resolvedTransferNo)

            return resolvedTransferNo
          }
        } else {
          toast.error(
            response?.message || "Failed to fetch Bank Transfer CTM details"
          )
        }
      } catch (error) {
        console.error("Error fetching Bank Transfer CTM details:", error)
        toast.error("Error loading Bank Transfer CTM. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingCbBankTransferCtm(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setCbBankTransferCtm,
      setIsLoadingCbBankTransferCtm,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleCbBankTransferCtmSelect = async (
    selectedBankTransferCtm: ICbBankTransferCtmHd | undefined
  ) => {
    if (!selectedBankTransferCtm) return

    const loadedTransferNo = await loadCbBankTransferCtm({
      transferId: selectedBankTransferCtm.transferId ?? "0",
      transferNo: selectedBankTransferCtm.transferNo ?? "",
    })

    if (loadedTransferNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetch from handleFilterChange
  const handleFilterChange = (newFilters: ICbBankTransferCtmFilter) => {
    setFilters(newFilters)
    // Data refresh handled by CbBankTransferCtmTable component
  }

  // Data refresh handled by CbBankTransferCtmTable component

  // Set createBy and createDate for new Bank Transfer CTM on page load/refresh
  useEffect(() => {
    if (!cbBankTransferCtm && user && decimals.length > 0) {
      const currentTransferId = form.getValues("transferId")
      const currentTransferNo = form.getValues("transferNo")
      const isNewBankTransferCtm =
        !currentTransferId || currentTransferId === "0" || !currentTransferNo

      if (isNewBankTransferCtm) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [cbBankTransferCtm, user, decimals, form])

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

  const handleCbBankTransferCtmSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedTransferNo = await loadCbBankTransferCtm({
        transferId: "0",
        transferNo: trimmedValue,
        showLoader: true,
      })

      if (loadedTransferNo) {
        toast.success(
          `Bank Transfer CTM ${loadedTransferNo} loaded successfully`
        )
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadCbBankTransferCtm({
        transferId: trimmedId,
        transferNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadCbBankTransferCtm, pendingDocId])

  // Determine mode and Bank Transfer CTM ID from URL
  const transferNo = form.getValues("transferNo")
  const isEdit = Boolean(transferNo)
  const isCancelled = cbBankTransferCtm?.isCancel === true

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

  // Handle double-click to copy transferNo to clipboard
  const handleCopyCbBankTransferCtmNo = useCallback(async () => {
    const transferNoToCopy = isEdit
      ? cbBankTransferCtm?.transferNo || form.getValues("transferNo") || ""
      : form.getValues("transferNo") || ""

    await copyToClipboard(transferNoToCopy)
  }, [isEdit, cbBankTransferCtm?.transferNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `Bank Transfer CTM (Edit)- v[${cbBankTransferCtm?.editVersion}] - ${transferNo}`
    : "Bank Transfer CTM (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading Bank Transfer CTM form...
          </p>
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
                {cbBankTransferCtm?.cancelRemarks && (
                  <div className="max-w-xs truncate text-sm text-red-600">
                    {cbBankTransferCtm.cancelRemarks}
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
                  onDoubleClick={handleCopyCbBankTransferCtmNo}
                  title="Double-click to copy Bank Transfer CTM number"
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
                  if (cbBankTransferCtm?.transferNo) {
                    setSearchNo(cbBankTransferCtm.transferNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingCbBankTransferCtm}
                className="h-4 w-4 p-0"
                title="Refresh Bank Transfer CTM data"
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
                placeholder="Search Bank Transfer CTM No"
                className="h-8 cursor-pointer text-sm"
                readOnly={
                  !!cbBankTransferCtm?.transferId &&
                  cbBankTransferCtm.transferId !== "0"
                }
                disabled={
                  !!cbBankTransferCtm?.transferId &&
                  cbBankTransferCtm.transferId !== "0"
                }
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintCbBankTransferCtm("bankTransferCtm")}
              disabled={
                !cbBankTransferCtm || cbBankTransferCtm.transferId === "0"
              }
            >
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              //disabled={!cbBankTransferCtm}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              New
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneConfirm(true)}
              disabled={
                !cbBankTransferCtm ||
                cbBankTransferCtm.transferId === "0" ||
                isCancelled
              }
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
                !cbBankTransferCtm ||
                cbBankTransferCtm.transferId === "0" ||
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
          </div>
        </div>

        <TabsContent value="main">
          <Main
            form={form}
            onSuccessAction={async () => {
              handleSaveCbBankTransferCtm()
            }}
            isEdit={isEdit}
            visible={visible}
            required={required}
            companyId={Number(companyId)}
            isCancelled={isCancelled}
          />
        </TabsContent>

        <TabsContent value="other">
          <Other form={form} visible={visible} />
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
              Bank Transfer CTM List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing Bank Transfer CTMs from the list below.
              Use search to filter records or create new transfers.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <CbBankTransferCtmTable
              onCbBankTransferCtmSelect={handleCbBankTransferCtmSelect}
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              pageSize={pageSize || 50}
              onCloseAction={() => setShowListDialog(false)}
              visible={visible}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation */}
      <SaveConfirmation
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        onConfirm={handleSaveCbBankTransferCtm}
        itemName={cbBankTransferCtm?.transferNo || "New Bank Transfer CTM"}
        operationType={
          cbBankTransferCtm?.transferId && cbBankTransferCtm.transferId !== "0"
            ? "update"
            : "create"
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
        itemName={cbBankTransferCtm?.transferNo}
        title="Delete Bank Transfer CTM"
        description="Are you sure you want to delete this Bank Transfer CTM? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleCbBankTransferCtmDelete}
        itemName={cbBankTransferCtm?.transferNo}
        title="Cancel Bank Transfer CTM"
        description="Please provide a reason for cancelling this Bank Transfer CTM."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleCbBankTransferCtmSearch(searchNo)}
        code={searchNo}
        typeLabel="Bank Transfer CTM"
        showDetails={false}
        description={`Do you want to load Bank Transfer CTM ${searchNo}?`}
        isLoading={isLoadingCbBankTransferCtm}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleCbBankTransferCtmReset}
        itemName={cbBankTransferCtm?.transferNo}
        title="New Bank Transfer CTM"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneCbBankTransferCtm}
        itemName={cbBankTransferCtm?.transferNo}
        title="Clone Bank Transfer CTM"
        description="This will create a copy as a new Bank Transfer CTM."
      />
    </div>
  )
}
