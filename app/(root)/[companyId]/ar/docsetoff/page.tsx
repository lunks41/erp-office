"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { setExchangeRate } from "@/helpers/account"
import { IArDocSetOffFilter, IArDocSetOffHd } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  ArDocSetOffDtSchemaType,
  ArDocSetOffHdSchema,
  ArDocSetOffHdSchemaType,
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
import { ArDocSetOff, BasicSetting } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { ARTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetRequiredFields, useGetVisibleFields } from "@/hooks/use-lookup"
import { useUserSettingDefaults } from "@/hooks/use-settings"
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
import {
  MainOtherHistoryTabList,
  TransactionWorkspaceRoot,
  transactionTabPanelClass,
} from "@/components/layout/transaction-workspace-layout"

import { getDefaultValues } from "./components/docsetoff-defaultvalues"
import DocSetOffTable from "./components/docsetoff-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function DocSetOffPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.docsetoff

  const { hasPermission } = usePermissionStore()
  const { user } = useAuthStore()
  const { decimals } = useCompanyStore()
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
  const [isLoadingDocSetOff, setIsLoadingDocSetOff] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [docSetOff, setDocSetOff] = useState<ArDocSetOffHdSchemaType | null>(
    null
  )
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/ar/docsetoff`,
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

  const [filters, setFilters] = useState<IArDocSetOffFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "setoffNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultDocSetOffValues = useMemo(
    () => getDefaultValues(dateFormat).defaultDocSetOff,
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
  const form = useForm<ArDocSetOffHdSchemaType>({
    resolver: zodResolver(ArDocSetOffHdSchema(required, visible)),
    defaultValues: docSetOff
      ? {
          setoffId: docSetOff.setoffId?.toString() ?? "0",
          setoffNo: docSetOff.setoffNo ?? "",
          referenceNo: docSetOff.referenceNo ?? "",
          trnDate: docSetOff.trnDate ?? new Date(),
          accountDate: docSetOff.accountDate ?? new Date(),
          customerId: docSetOff.customerId ?? 0,
          currencyId: docSetOff.currencyId ?? 0,
          exhRate: docSetOff.exhRate ?? 0,
          exhGainLoss: docSetOff.exhGainLoss ?? 0,
          remarks: docSetOff.remarks ?? "",
          allocTotAmt: docSetOff.allocTotAmt ?? 0,
          balTotAmt: docSetOff.balTotAmt ?? 0,
          unAllocTotAmt: docSetOff.unAllocTotAmt ?? 0,
          moduleFrom: docSetOff.moduleFrom ?? "",
          editVersion: docSetOff.editVersion ?? 0,
          data_details:
            docSetOff.data_details?.map((detail) => ({
              ...detail,
              setoffId: detail.setoffId?.toString() ?? "0",
              setoffNo: detail.setoffNo ?? "",
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
          // For new docSetOff, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultDocSetOffValues,
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

    const currentDocSetOffId = form.getValues("setoffId") || "0"
    if (
      (docSetOff && docSetOff.setoffId && docSetOff.setoffId !== "0") ||
      currentDocSetOffId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultDocSetOffValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [
    dateFormat,
    defaultDocSetOffValues,
    decimals,
    form,
    docSetOff,
    isDirty,
    user,
  ])

  // Mutations
  const saveMutation = usePersist<ArDocSetOffHdSchemaType>(`${ArDocSetOff.add}`)
  const updateMutation = usePersist<ArDocSetOffHdSchemaType>(
    `${ArDocSetOff.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${ArDocSetOff.delete}`)

  // Remove the useGetDocSetOffById hook for selection
  // const { data: docSetOffByIdData, refetch: refetchDocSetOffById } = ...

  // Handle Save
  const handleSaveDocSetOff = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as IArDocSetOffHd
      )

      // Validate the form data using the schema
      const validationResult = ArDocSetOffHdSchema(required, visible).safeParse(
        formValues
      )

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          referenceNo: "Reference No",
          accountDate: "Account Date",
          customerId: "Customer",
          allocTotAmt: "Allocated Total Amount",
          remarks: "Remarks",
        }
        const failedFields: string[] = []
        validationResult.error.issues.forEach((error) => {
          const pathKey = error.path.join(".")
          const fieldPath = pathKey as keyof ArDocSetOffHdSchemaType
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
      if (formValues.allocTotAmt === 0) {
        toast.error("Allocated Total Amount should not be zero")
        setIsSaving(false)
        return
      }

      // Check if totalSetOffAmt (sum of all allocAmt) is zero
      const rawSetOffAmt = (formValues.data_details || []).reduce(
        (sum, detail) => {
          const allocAmt =
            Number((detail as ArDocSetOffDtSchemaType).allocAmt) || 0
          return sum + allocAmt
        },
        0
      )
      const totalSetOffAmt = Math.abs(rawSetOffAmt) < 1e-9 ? 0 : rawSetOffAmt

      if (totalSetOffAmt !== 0) {
        toast.warning(
          `You cannot save. SetOff Amount must be zero. Current value: ${totalSetOffAmt.toFixed(2)}`
        )
        setIsSaving(false)
        return
      }

      console.log("handleSaveDocSetOff formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.setoffId) === 0
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
        }

        const response =
          Number(formValues.setoffId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const docSetOffData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (docSetOffData) {
            const updatedSchemaType = transformToSchemaType(
              docSetOffData as unknown as IArDocSetOffHd
            )

            setSearchNo(updatedSchemaType.setoffNo || "")
            setDocSetOff(updatedSchemaType)
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

          // Check if this was a new docSetOff or update
          const wasNewDocSetOff = Number(formValues.setoffId) === 0

          if (wasNewDocSetOff) {
            //toast.success(
            // `DocSetOff ${docSetOffData?.setoffNo || ""} saved successfully`
            //)
          } else {
            //toast.success("DocSetOff updated successfully")
          }

          // Data refresh handled by DocSetOffTable component
        } else {
          toast.error(response.message || "Failed to save docSetOff")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving docSetOff")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneDocSetOff = async () => {
    if (docSetOff) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedDocSetOff: ArDocSetOffHdSchemaType = {
        ...docSetOff,
        setoffId: "0",
        setoffNo: "",
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
        // Clear all amounts for new refund
        exhGainLoss: 0,
        allocTotAmt: 0,
        balTotAmt: 0,
        unAllocTotAmt: 0,
        // Clear data details - remove all records
        data_details: [],
      }

      setDocSetOff(clonedDocSetOff)
      form.reset(clonedDocSetOff)
      form.trigger("accountDate")

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedDocSetOff.currencyId && clonedDocSetOff.accountDate) {
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

      toast.success("DocSetOff cloned successfully")
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
  const handleDocSetOffDelete = async (cancelRemarks: string) => {
    if (!docSetOff) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("DocSetOff ID:", docSetOff.setoffId)
      console.log("DocSetOff No:", docSetOff.setoffNo)

      const response = await deleteMutation.mutateAsync({
        documentId: docSetOff.setoffId?.toString() ?? "",
        documentNo: docSetOff.setoffNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setDocSetOff(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultDocSetOffValues,
          data_details: [],
        })
        toast.success(`DocSetOff ${docSetOff.setoffNo} deleted successfully`)
        // Data refresh handled by DocSetOffTable component
      } else {
        toast.error(response.message || "Failed to delete docSetOff")
      }
    } catch {
      toast.error("Network error while deleting docSetOff")
    }
  }

  // Handle Reset
  const handleDocSetOffReset = () => {
    setDocSetOff(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new docSetOff)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultDocSetOffValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("Ready for new DocSetOff")
  }

  // Handle Print Doc Set Off Report
  const handlePrintDocSetOff = () => {
    if (!docSetOff || docSetOff.setoffId === "0") {
      toast.error("Please select a doc set off to print")
      return
    }

    const formValues = form.getValues()
    const setoffId =
      formValues.setoffId || docSetOff.setoffId?.toString() || "0"
    const setoffNo = formValues.setoffNo || docSetOff.setoffNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: setoffId,
      invoiceNo: setoffNo,
      reportType: 1,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Store report data in sessionStorage
    const reportData = {
      reportFile: "ar/ArDocSetOff.trdp",
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

  // Helper function to transform IArDocSetOffHd to ArDocSetOffHdSchemaType
  const transformToSchemaType = useCallback(
    (apiDocSetOff: IArDocSetOffHd): ArDocSetOffHdSchemaType => {
      return {
        setoffId: apiDocSetOff.setoffId?.toString() ?? "0",
        setoffNo: apiDocSetOff.setoffNo ?? "",
        referenceNo: apiDocSetOff.referenceNo ?? "",
        trnDate: apiDocSetOff.trnDate
          ? format(
              parseDate(apiDocSetOff.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiDocSetOff.accountDate
          ? format(
              parseDate(apiDocSetOff.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        customerId: apiDocSetOff.customerId ?? 0,
        currencyId: apiDocSetOff.currencyId ?? 0,
        exhRate: apiDocSetOff.exhRate ?? 0,
        exhGainLoss: apiDocSetOff.exhGainLoss ?? 0,
        remarks: apiDocSetOff.remarks ?? "",
        allocTotAmt: apiDocSetOff.allocTotAmt ?? 0,
        balTotAmt: apiDocSetOff.balTotAmt ?? 0,
        unAllocTotAmt: apiDocSetOff.unAllocTotAmt ?? 0,
        moduleFrom: apiDocSetOff.moduleFrom ?? "",
        editVersion: apiDocSetOff.editVersion ?? 0,
        createBy: apiDocSetOff.createBy ?? "",
        editBy: apiDocSetOff.editBy ?? "",
        cancelBy: apiDocSetOff.cancelBy ?? "",
        isCancel:
          apiDocSetOff.isCancel === true ||
          (apiDocSetOff as unknown as Record<string, unknown>).IsCancel ===
            true ||
          false,
        createDate: apiDocSetOff.createDate
          ? format(
              parseDate(apiDocSetOff.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        editDate: apiDocSetOff.editDate
          ? format(
              parseDate(apiDocSetOff.editDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiDocSetOff.cancelDate
          ? format(
              parseDate(apiDocSetOff.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelRemarks: (() => {
          const raw =
            apiDocSetOff.cancelRemarks ??
            (apiDocSetOff as unknown as Record<string, unknown>).CancelRemarks
          return typeof raw === "string" ? raw : ""
        })(),
        data_details:
          apiDocSetOff.data_details?.map(
            (detail) =>
              ({
                ...detail,
                setoffId: detail.setoffId?.toString() ?? "0",
                setoffNo: detail.setoffNo ?? "",
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
              }) as unknown as ArDocSetOffDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadDocSetOff = useCallback(
    async ({
      setoffId,
      setoffNo,
      showLoader = false,
    }: {
      setoffId?: string | number | null
      setoffNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("setoffId", setoffId)
      console.log("setoffNo", setoffNo)
      const trimmedDocSetOffNo = setoffNo?.trim() ?? ""
      const trimmedDocSetOffId =
        typeof setoffId === "number"
          ? setoffId.toString()
          : (setoffId?.toString().trim() ?? "")

      if (!trimmedDocSetOffNo && !trimmedDocSetOffId) return null

      if (showLoader) {
        setIsLoadingDocSetOff(true)
      }

      const requestDocSetOffId = trimmedDocSetOffId || "0"
      const requestDocSetOffNo = trimmedDocSetOffNo || ""

      try {
        const response = await getById(
          `${ArDocSetOff.getByIdNo}/${requestDocSetOffId}/${requestDocSetOffNo}`
        )

        if (response?.result === 1) {
          const detailedDocSetOff = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedDocSetOff) {
            const parsed = parseDate(detailedDocSetOff.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedDocSetOff.accountDate as string)
            )

            const updatedDocSetOff = transformToSchemaType(detailedDocSetOff)

            setDocSetOff(updatedDocSetOff)
            form.reset(updatedDocSetOff)
            form.trigger()

            const resolvedDocSetOffNo =
              updatedDocSetOff.setoffNo ||
              trimmedDocSetOffNo ||
              trimmedDocSetOffId
            setSearchNo(resolvedDocSetOffNo)

            return resolvedDocSetOffNo
          }
        } else {
          toast.error(response?.message || "Failed to fetch docSetOff details")
        }
      } catch (error) {
        console.error("Error fetching docSetOff details:", error)
        toast.error("Error loading docSetOff. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingDocSetOff(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setDocSetOff,
      setIsLoadingDocSetOff,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleDocSetOffSelect = async (
    selectedDocSetOff: IArDocSetOffHd | undefined
  ) => {
    if (!selectedDocSetOff) return

    const loadedDocSetOffNo = await loadDocSetOff({
      setoffId: selectedDocSetOff.setoffId ?? "0",
      setoffNo: selectedDocSetOff.setoffNo ?? "",
    })

    if (loadedDocSetOffNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchDocSetOffs from handleFilterChange
  const handleFilterChange = (newFilters: IArDocSetOffFilter) => {
    setFilters(newFilters)
    // Data refresh handled by DocSetOffTable component
  }

  // Data refresh handled by DocSetOffTable component

  // Set createBy and createDate for new docSetOffs on page load/refresh
  useEffect(() => {
    if (!docSetOff && user && decimals.length > 0) {
      const currentDocSetOffId = form.getValues("setoffId")
      const currentDocSetOffNo = form.getValues("setoffNo")
      const isNewDocSetOff =
        !currentDocSetOffId || currentDocSetOffId === "0" || !currentDocSetOffNo

      if (isNewDocSetOff) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [docSetOff, user, decimals, form])

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

  const handleDocSetOffSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedDocSetOffNo = await loadDocSetOff({
        setoffId: "0",
        setoffNo: trimmedValue,
        showLoader: true,
      })

      if (loadedDocSetOffNo) {
        toast.success(`DocSetOff ${loadedDocSetOffNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadDocSetOff({
        setoffId: trimmedId,
        setoffNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadDocSetOff, pendingDocId])

  // Determine mode and docSetOff ID from URL
  const setoffNo = form.getValues("setoffNo")
  const isEdit = Boolean(setoffNo)
  const isCancelled = docSetOff?.isCancel === true

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

  // Handle double-click to copy setoffNo to clipboard
  const handleCopyInvoiceNo = useCallback(async () => {
    const setoffNoToCopy = isEdit
      ? docSetOff?.setoffNo || form.getValues("setoffNo") || ""
      : form.getValues("setoffNo") || ""

    await copyToClipboard(setoffNoToCopy)
  }, [isEdit, docSetOff?.setoffNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `DocSetOff (Edit)- v[${docSetOff?.editVersion}] - ${setoffNo}`
    : "DocSetOff (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading docSetOff form...
          </p>
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
                {docSetOff?.cancelRemarks && (
                  <div className="max-w-[160px] truncate text-xs text-red-600 sm:max-w-[220px]">
                    {docSetOff.cancelRemarks}
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
                  title="Double-click to copy setoff number"
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
                  if (docSetOff?.setoffNo) {
                    setSearchNo(docSetOff.setoffNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingDocSetOff}
                className="h-4 w-4 p-0"
                title="Refresh docSetOff data"
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
              className="w-full max-w-xs min-w-[120px] sm:w-64"
              title="Double-click to copy to clipboard"
            >
              <Input
                value={searchNo}
                onChange={(e) => setSearchNo(e.target.value)}
                onBlur={handleSearchNoBlur}
                onKeyDown={handleSearchNoKeyDown}
                placeholder="Search DocSetOff No"
                className="h-7 cursor-pointer text-xs"
                readOnly={!!docSetOff?.setoffId && docSetOff.setoffId !== "0"}
                disabled={!!docSetOff?.setoffId && docSetOff.setoffId !== "0"}
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
              disabled={!docSetOff || docSetOff.setoffId === "0"}
              onClick={handlePrintDocSetOff}
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
              disabled={!docSetOff || docSetOff.setoffId === "0" || isCancelled}
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
                !docSetOff ||
                docSetOff.setoffId === "0" ||
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
              handleSaveDocSetOff()
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
              DocSetOff List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing docSetOffs from the list below. Use
              search to filter records or create new docSetOffs.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <DocSetOffTable
              onDocSetOffSelect={handleDocSetOffSelect}
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
        onConfirm={handleSaveDocSetOff}
        itemName={docSetOff?.setoffNo || "New DocSetOff"}
        operationType={
          docSetOff?.setoffId && docSetOff.setoffId !== "0"
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
        itemName={docSetOff?.setoffNo}
        title="Delete DocSetOff"
        description="Are you sure you want to delete this docSetOff? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleDocSetOffDelete}
        itemName={docSetOff?.setoffNo}
        title="Cancel DocSetOff"
        description="Please provide a reason for cancelling this docSetOff."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleDocSetOffSearch(searchNo)}
        code={searchNo}
        typeLabel="DocSetOff"
        showDetails={false}
        description={`Do you want to load DocSetOff ${searchNo}?`}
        isLoading={isLoadingDocSetOff}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleDocSetOffReset}
        itemName={docSetOff?.setoffNo}
        title="New DocSetOff"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneDocSetOff}
        itemName={docSetOff?.setoffNo}
        title="Clone DocSetOff"
        description="This will create a copy as a new docSetOff."
      />
    </>
  )
}
