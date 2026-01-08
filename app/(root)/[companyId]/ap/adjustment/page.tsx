"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  mathRound,
  setDueDate,
  setExchangeRate,
  setExchangeRateLocal,
} from "@/helpers/account"
import {
  calculateCtyAmounts,
  calculateLocalAmounts,
  calculateTotalAmounts,
  recalculateAllDetailsLocalAndCtyAmounts,
} from "@/helpers/ap-adjustment-calculations"
import {
  IApAdjustmentDt,
  IApAdjustmentFilter,
  IApAdjustmentHd,
} from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  ApAdjustmentDtSchemaType,
  ApAdjustmentHdSchema,
  ApAdjustmentHdSchemaType,
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
import { ApAdjustment, BasicSetting } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { APTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetRequiredFields, useGetVisibleFields } from "@/hooks/use-lookup"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import { Badge } from "@/components/ui/badge"
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

import { getDefaultValues } from "./components/adjustment-defaultvalues"
import AdjustmentTable from "./components/adjustment-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function AdjustmentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.ar
  const transactionId = APTransactionId.adjustment

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
  const [isLoadingAdjustment, setIsLoadingAdjustment] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [adjustment, setAdjustment] = useState<ApAdjustmentHdSchemaType | null>(
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
    () => `history-doc:/${companyId}/ap/adjustment`,
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

  const [filters, setFilters] = useState<IApAdjustmentFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "adjustmentNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultAdjustmentValues = useMemo(
    () => getDefaultValues(dateFormat).defaultAdjustment,
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
  const form = useForm<ApAdjustmentHdSchemaType>({
    resolver: zodResolver(ApAdjustmentHdSchema(required, visible)),
    defaultValues: adjustment
      ? {
          adjustmentId: adjustment.adjustmentId?.toString() ?? "0",
          adjustmentNo: adjustment.adjustmentNo ?? "",
          referenceNo: adjustment.referenceNo ?? "",
          suppAdjustmentNo: adjustment.suppAdjustmentNo ?? "",
          trnDate: adjustment.trnDate ?? new Date(),
          accountDate: adjustment.accountDate ?? new Date(),
          dueDate: adjustment.dueDate ?? new Date(),
          deliveryDate: adjustment.deliveryDate ?? new Date(),
          gstClaimDate: adjustment.gstClaimDate ?? new Date(),
          supplierId: adjustment.supplierId ?? 0,
          currencyId: adjustment.currencyId ?? 0,
          exhRate: adjustment.exhRate ?? 0,
          ctyExhRate: adjustment.ctyExhRate ?? 0,
          creditTermId: adjustment.creditTermId ?? 0,
          bankId: adjustment.bankId ?? 0,
          isDebit: adjustment.isDebit ?? false,
          totAmt: adjustment.totAmt ?? 0,
          totLocalAmt: adjustment.totLocalAmt ?? 0,
          totCtyAmt: adjustment.totCtyAmt ?? 0,
          gstAmt: adjustment.gstAmt ?? 0,
          gstLocalAmt: adjustment.gstLocalAmt ?? 0,
          gstCtyAmt: adjustment.gstCtyAmt ?? 0,
          totAmtAftGst: adjustment.totAmtAftGst ?? 0,
          totLocalAmtAftGst: adjustment.totLocalAmtAftGst ?? 0,
          totCtyAmtAftGst: adjustment.totCtyAmtAftGst ?? 0,
          balAmt: adjustment.balAmt ?? 0,
          balLocalAmt: adjustment.balLocalAmt ?? 0,
          payAmt: adjustment.payAmt ?? 0,
          payLocalAmt: adjustment.payLocalAmt ?? 0,
          exGainLoss: adjustment.exGainLoss ?? 0,
          operationId: adjustment.operationId ?? 0,
          operationNo: adjustment.operationNo ?? "",
          remarks: adjustment.remarks ?? "",
          moduleFrom: adjustment.moduleFrom ?? "",
          customerName: adjustment.customerName ?? "",
          arAdjustmentId: adjustment.arAdjustmentId ?? "",
          arAdjustmentNo: adjustment.arAdjustmentNo ?? "",
          editVersion: adjustment.editVersion ?? 0,
          purchaseOrderId: adjustment.purchaseOrderId ?? 0,
          purchaseOrderNo: adjustment.purchaseOrderNo ?? "",

          data_details:
            adjustment.data_details?.map((detail) => ({
              ...detail,
              adjustmentId: detail.adjustmentId?.toString() ?? "0",
              adjustmentNo: detail.adjustmentNo?.toString() ?? "",
              totAmt: detail.totAmt ?? 0,
              totLocalAmt: detail.totLocalAmt ?? 0,
              totCtyAmt: detail.totCtyAmt ?? 0,
              gstAmt: detail.gstAmt ?? 0,
              gstLocalAmt: detail.gstLocalAmt ?? 0,
              gstCtyAmt: detail.gstCtyAmt ?? 0,
              deliveryDate: detail.deliveryDate ?? "",
              supplyDate: detail.supplyDate ?? "",
              remarks: detail.remarks ?? "",
              customerName: detail.customerName ?? "",
              custAdjustmentNo: detail.custAdjustmentNo ?? "",
              arAdjustmentId: detail.arAdjustmentId ?? "0",
              arAdjustmentNo: detail.arAdjustmentNo ?? "",
              editVersion: detail.editVersion ?? 0,
            })) || [],
        }
      : (() => {
          // For new adjustment, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultAdjustmentValues,
            createBy: userName,
            createDate: currentDateTime,
          }
        })(),
  })

  const previousDateFormatRef = useRef<string>(dateFormat)
  const { isDirty } = form.formState

  // Watch isDebit value for badge display
  const headerIsDebit = form.watch("isDebit")
  // Watch data_details to check if details exist
  const dataDetails = form.watch("data_details") || []
  const hasDetails = dataDetails.length > 0

  useEffect(() => {
    if (previousDateFormatRef.current === dateFormat) return
    previousDateFormatRef.current = dateFormat

    if (isDirty) return

    const currentAdjustmentId = form.getValues("adjustmentId") || "0"
    if (
      (adjustment &&
        adjustment.adjustmentId &&
        adjustment.adjustmentId !== "0") ||
      currentAdjustmentId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultAdjustmentValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [
    dateFormat,
    defaultAdjustmentValues,
    decimals,
    form,
    adjustment,
    isDirty,
    user,
  ])

  // Mutations
  const saveMutation = usePersist<ApAdjustmentHdSchemaType>(
    `${ApAdjustment.add}`
  )
  const updateMutation = usePersist<ApAdjustmentHdSchemaType>(
    `${ApAdjustment.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${ApAdjustment.delete}`)

  // Remove the useGetAdjustmentById hook for selection
  // const { data: adjustmentByIdData, refetch: refetchAdjustmentById } = ...

  // Handle Save
  const handleSaveAdjustment = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as IApAdjustmentHd
      )

      // Validate the form data using the schema
      const validationResult = ApAdjustmentHdSchema(
        required,
        visible
      ).safeParse(formValues)

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        // Set field-level errors on the form so FormMessage components can display them
        validationResult.error.issues.forEach((error) => {
          const fieldPath = error.path.join(
            "."
          ) as keyof ApAdjustmentHdSchemaType
          form.setError(fieldPath, {
            type: "validation",
            message: error.message,
          })
        })

        toast.error("Please check form data and try again")
        return
      }

      //check totamt and totlocalamt should be zero
      if (formValues.totAmt === 0 || formValues.totLocalAmt === 0) {
        toast.error("Total Amount and Total Local Amount should not be zero")
        return
      }

      console.log("handleSaveAdjustment formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.adjustmentId) === 0
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
          dueDate: formatDateForApi(formValues.dueDate) || "",
          deliveryDate: formatDateForApi(formValues.deliveryDate) || "",
          gstClaimDate: formatDateForApi(formValues.gstClaimDate) || "",
          // Format dates in details array
          data_details:
            formValues.data_details?.map((detail) => ({
              ...detail,
              deliveryDate: formatDateForApi(detail.deliveryDate) || "",
              supplyDate: formatDateForApi(detail.supplyDate) || "",
            })) || [],
        }

        const response =
          Number(formValues.adjustmentId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const adjustmentData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (adjustmentData) {
            const updatedSchemaType = transformToSchemaType(
              adjustmentData as unknown as IApAdjustmentHd
            )

            setSearchNo(updatedSchemaType.adjustmentNo || "")
            setAdjustment(updatedSchemaType)
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

          // Check if this was a new adjustment or update
          const wasNewAdjustment = Number(formValues.adjustmentId) === 0

          if (wasNewAdjustment) {
            //toast.success(
            // `Adjustment ${adjustmentData?.adjustmentNo || ""} saved successfully`
            //)
          } else {
            //toast.success("Adjustment updated successfully")
          }

          // Data refresh handled by AdjustmentTable component
        } else {
          toast.error(response.message || "Failed to save adjustment")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving adjustment")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneAdjustment = async () => {
    if (adjustment) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedAdjustment: ApAdjustmentHdSchemaType = {
        ...adjustment,
        adjustmentId: "0",
        adjustmentNo: "",
        // Set all dates to current date
        trnDate: dateStr,
        accountDate: dateStr,
        deliveryDate: dateStr,
        gstClaimDate: dateStr,
        // dueDate will be calculated based on accountDate and credit terms
        dueDate: dateStr,
        // Clear all audit fields
        createBy: "",
        editBy: "",
        cancelBy: "",
        createDate: "",
        editDate: "",
        cancelDate: "",
        // Clear all balance and payment amounts
        balAmt: 0,
        balLocalAmt: 0,
        payAmt: 0,
        payLocalAmt: 0,
        exGainLoss: 0,
        // Clear AP adjustment link
        arAdjustmentId: "0",
        arAdjustmentNo: "",
        // Keep data details - do not remove
        data_details:
          adjustment.data_details?.map((detail) => ({
            ...detail,
            adjustmentId: "0",
            adjustmentNo: "",
            arAdjustmentId: "0",
            arAdjustmentNo: "",
            editVersion: 0,
          })) || [],
      }

      // Calculate totals from details with proper rounding
      const amtDec = decimals[0]?.amtDec || 2
      const locAmtDec = decimals[0]?.locAmtDec || 2
      const ctyAmtDec = decimals[0]?.ctyAmtDec || 2

      const details = clonedAdjustment.data_details || []
      if (details.length > 0) {
        const totAmt = details.reduce((sum, d) => sum + (d.totAmt || 0), 0)
        const gstAmt = details.reduce((sum, d) => sum + (d.gstAmt || 0), 0)
        const totLocalAmt = details.reduce(
          (sum, d) => sum + (d.totLocalAmt || 0),
          0
        )
        const gstLocalAmt = details.reduce(
          (sum, d) => sum + (d.gstLocalAmt || 0),
          0
        )
        const totCtyAmt = details.reduce(
          (sum, d) => sum + (d.totCtyAmt || 0),
          0
        )
        const gstCtyAmt = details.reduce(
          (sum, d) => sum + (d.gstCtyAmt || 0),
          0
        )

        clonedAdjustment.totAmt = mathRound(totAmt, amtDec)
        clonedAdjustment.gstAmt = mathRound(gstAmt, amtDec)
        clonedAdjustment.totAmtAftGst = mathRound(totAmt + gstAmt, amtDec)
        clonedAdjustment.totLocalAmt = mathRound(totLocalAmt, locAmtDec)
        clonedAdjustment.gstLocalAmt = mathRound(gstLocalAmt, locAmtDec)
        clonedAdjustment.totLocalAmtAftGst = mathRound(
          totLocalAmt + gstLocalAmt,
          locAmtDec
        )
        clonedAdjustment.totCtyAmt = mathRound(totCtyAmt, ctyAmtDec)
        clonedAdjustment.gstCtyAmt = mathRound(gstCtyAmt, ctyAmtDec)
        clonedAdjustment.totCtyAmtAftGst = mathRound(
          totCtyAmt + gstCtyAmt,
          ctyAmtDec
        )
      } else {
        // Reset amounts if no details
        clonedAdjustment.totAmt = 0
        clonedAdjustment.totLocalAmt = 0
        clonedAdjustment.totCtyAmt = 0
        clonedAdjustment.gstAmt = 0
        clonedAdjustment.gstLocalAmt = 0
        clonedAdjustment.gstCtyAmt = 0
        clonedAdjustment.totAmtAftGst = 0
        clonedAdjustment.totLocalAmtAftGst = 0
        clonedAdjustment.totCtyAmtAftGst = 0
      }

      setAdjustment(clonedAdjustment)
      form.reset(clonedAdjustment)

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedAdjustment.currencyId && clonedAdjustment.accountDate) {
        try {
          await setExchangeRate(form, exhRateDec, visible)
          if (visible?.m_CtyCurr) {
            await setExchangeRateLocal(form, exhRateDec)
          }

          // Get updated exchange rates
          const exchangeRate = form.getValues("exhRate") || 0
          const countryExchangeRate = form.getValues("ctyExhRate") || 0

          // Recalculate detail amounts with new exchange rates if details exist
          const formDetails = form.getValues("data_details")
          if (formDetails && formDetails.length > 0) {
            const updatedDetails = recalculateAllDetailsLocalAndCtyAmounts(
              formDetails as unknown as IApAdjustmentDt[],
              exchangeRate,
              countryExchangeRate,
              decimals[0],
              !!visible?.m_CtyCurr
            )

            // Update form with recalculated details
            form.setValue(
              "data_details",
              updatedDetails as unknown as ApAdjustmentDtSchemaType[],
              { shouldDirty: true, shouldTouch: true }
            )

            // Recalculate header totals from updated details
            const totals = calculateTotalAmounts(
              updatedDetails as unknown as IApAdjustmentDt[],
              amtDec
            )
            form.setValue("totAmt", totals.totAmt)
            form.setValue("gstAmt", totals.gstAmt)
            form.setValue("totAmtAftGst", totals.totAmtAftGst)

            const localAmounts = calculateLocalAmounts(
              updatedDetails as unknown as IApAdjustmentDt[],
              locAmtDec
            )
            form.setValue("totLocalAmt", localAmounts.totLocalAmt)
            form.setValue("gstLocalAmt", localAmounts.gstLocalAmt)
            form.setValue("totLocalAmtAftGst", localAmounts.totLocalAmtAftGst)

            if (visible?.m_CtyCurr) {
              const countryAmounts = calculateCtyAmounts(
                updatedDetails as unknown as IApAdjustmentDt[],
                visible?.m_CtyCurr ? ctyAmtDec : locAmtDec
              )
              form.setValue("totCtyAmt", countryAmounts.totCtyAmt)
              form.setValue("gstCtyAmt", countryAmounts.gstCtyAmt)
              form.setValue("totCtyAmtAftGst", countryAmounts.totCtyAmtAftGst)
            }
          }
        } catch (error) {
          console.error("Error updating exchange rates:", error)
        }
      }

      // Calculate due date based on accountDate and credit terms
      if (clonedAdjustment.creditTermId && clonedAdjustment.accountDate) {
        try {
          await setDueDate(form)
        } catch (error) {
          console.error("Error calculating due date:", error)
        }
      }

      // Clear search input
      setSearchNo("")

      toast.success("Adjustment cloned successfully")
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
  const handleAdjustmentDelete = async (cancelRemarks: string) => {
    if (!adjustment) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("Adjustment ID:", adjustment.adjustmentId)
      console.log("Adjustment No:", adjustment.adjustmentNo)

      const response = await deleteMutation.mutateAsync({
        documentId: adjustment.adjustmentId?.toString() ?? "",
        documentNo: adjustment.adjustmentNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setAdjustment(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultAdjustmentValues,
          data_details: [],
        })
        toast.success(
          `Adjustment ${adjustment.adjustmentNo} deleted successfully`
        )
        // Data refresh handled by AdjustmentTable component
      } else {
        toast.error(response.message || "Failed to delete adjustment")
      }
    } catch {
      toast.error("Network error while deleting adjustment")
    }
  }

  // Handle Reset
  const handleAdjustmentReset = () => {
    setAdjustment(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new adjustment)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultAdjustmentValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("Adjustment reset successfully")
  }

  // Handle Print Adjustment Report
  const handlePrintAdjustment = () => {
    if (!adjustment || adjustment.adjustmentId === "0") {
      toast.error("Please select an adjustment to print")
      return
    }

    const formValues = form.getValues()
    const adjustmentId =
      formValues.adjustmentId || adjustment.adjustmentId?.toString() || "0"
    const adjustmentNo =
      formValues.adjustmentNo || adjustment.adjustmentNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: adjustmentId,
      invoiceNo: adjustmentNo,
      reportType: 1,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Store report data in sessionStorage
    const reportData = {
      reportFile: "ap/ApAdjustment.trdp",
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

  // Helper function to transform IApAdjustmentHd to ApAdjustmentHdSchemaType
  const transformToSchemaType = useCallback(
    (apiAdjustment: IApAdjustmentHd): ApAdjustmentHdSchemaType => {
      return {
        adjustmentId: apiAdjustment.adjustmentId?.toString() ?? "0",
        adjustmentNo: apiAdjustment.adjustmentNo ?? "",
        referenceNo: apiAdjustment.referenceNo ?? "",
        suppAdjustmentNo: apiAdjustment.suppAdjustmentNo ?? "",
        trnDate: apiAdjustment.trnDate
          ? format(
              parseDate(apiAdjustment.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiAdjustment.accountDate
          ? format(
              parseDate(apiAdjustment.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        dueDate: apiAdjustment.dueDate
          ? format(
              parseDate(apiAdjustment.dueDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        deliveryDate: apiAdjustment.deliveryDate
          ? format(
              parseDate(apiAdjustment.deliveryDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        gstClaimDate: apiAdjustment.gstClaimDate
          ? format(
              parseDate(apiAdjustment.gstClaimDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        supplierId: apiAdjustment.supplierId ?? 0,
        currencyId: apiAdjustment.currencyId ?? 0,
        exhRate: apiAdjustment.exhRate ?? 0,
        ctyExhRate: apiAdjustment.ctyExhRate ?? 0,
        creditTermId: apiAdjustment.creditTermId ?? 0,
        bankId: apiAdjustment.bankId ?? 0,
        isDebit: apiAdjustment.isDebit ?? false,
        totAmt: apiAdjustment.totAmt ?? 0,
        totLocalAmt: apiAdjustment.totLocalAmt ?? 0,
        totCtyAmt: apiAdjustment.totCtyAmt ?? 0,
        gstAmt: apiAdjustment.gstAmt ?? 0,
        gstLocalAmt: apiAdjustment.gstLocalAmt ?? 0,
        gstCtyAmt: apiAdjustment.gstCtyAmt ?? 0,
        totAmtAftGst: apiAdjustment.totAmtAftGst ?? 0,
        totLocalAmtAftGst: apiAdjustment.totLocalAmtAftGst ?? 0,
        totCtyAmtAftGst: apiAdjustment.totCtyAmtAftGst ?? 0,
        balAmt: apiAdjustment.balAmt ?? 0,
        balLocalAmt: apiAdjustment.balLocalAmt ?? 0,
        payAmt: apiAdjustment.payAmt ?? 0,
        payLocalAmt: apiAdjustment.payLocalAmt ?? 0,
        exGainLoss: apiAdjustment.exGainLoss ?? 0,
        operationId: apiAdjustment.operationId ?? 0,
        operationNo: apiAdjustment.operationNo ?? "",
        remarks: apiAdjustment.remarks ?? "",
        moduleFrom: apiAdjustment.moduleFrom ?? "",
        customerName: apiAdjustment.customerName ?? "",
        arAdjustmentId: apiAdjustment.arAdjustmentId ?? "",
        arAdjustmentNo: apiAdjustment.arAdjustmentNo ?? "",
        editVersion: apiAdjustment.editVersion ?? 0,
        purchaseOrderId: apiAdjustment.purchaseOrderId ?? 0,
        purchaseOrderNo: apiAdjustment.purchaseOrderNo ?? "",
        createBy: apiAdjustment.createBy ?? "",
        editBy: apiAdjustment.editBy ?? "",
        cancelBy: apiAdjustment.cancelBy ?? "",
        createDate: apiAdjustment.createDate
          ? format(
              parseDate(apiAdjustment.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",

        editDate: apiAdjustment.editDate
          ? format(
              parseDate(apiAdjustment.editDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiAdjustment.cancelDate
          ? format(
              parseDate(apiAdjustment.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        isCancel: apiAdjustment.isCancel ?? false,
        cancelRemarks: apiAdjustment.cancelRemarks ?? "",
        data_details:
          apiAdjustment.data_details?.map(
            (detail) =>
              ({
                ...detail,
                adjustmentId: detail.adjustmentId?.toString() ?? "0",
                adjustmentNo: detail.adjustmentNo ?? "",
                itemNo: detail.itemNo ?? 0,
                seqNo: detail.seqNo ?? 0,
                docItemNo: detail.docItemNo ?? 0,
                productId: detail.productId ?? 0,
                productCode: detail.productCode ?? "",
                productName: detail.productName ?? "",
                glId: detail.glId ?? 0,
                glCode: detail.glCode ?? "",
                glName: detail.glName ?? "",
                qty: detail.qty ?? 0,
                billQTY: detail.billQTY ?? 0,
                uomId: detail.uomId ?? 0,
                uomCode: detail.uomCode ?? "",
                uomName: detail.uomName ?? "",
                unitPrice: detail.unitPrice ?? 0,
                totAmt: detail.totAmt ?? 0,
                totLocalAmt: detail.totLocalAmt ?? 0,
                totCtyAmt: detail.totCtyAmt ?? 0,
                remarks: detail.remarks ?? "",
                gstId: detail.gstId ?? 0,
                gstName: detail.gstName ?? "",
                gstPercentage: detail.gstPercentage ?? 0,
                gstAmt: detail.gstAmt ?? 0,
                gstLocalAmt: detail.gstLocalAmt ?? 0,
                gstCtyAmt: detail.gstCtyAmt ?? 0,
                deliveryDate: detail.deliveryDate
                  ? format(
                      parseDate(detail.deliveryDate as string) || new Date(),
                      dateFormat
                    )
                  : "",
                departmentId: detail.departmentId ?? 0,
                departmentCode: detail.departmentCode ?? "",
                departmentName: detail.departmentName ?? "",
                employeeId: detail.employeeId ?? 0,
                employeeCode: detail.employeeCode ?? "",
                employeeName: detail.employeeName ?? "",
                portId: detail.portId ?? 0,
                portCode: detail.portCode ?? "",
                portName: detail.portName ?? "",
                vesselId: detail.vesselId ?? 0,
                vesselCode: detail.vesselCode ?? "",
                vesselName: detail.vesselName ?? "",
                bargeId: detail.bargeId ?? 0,
                bargeCode: detail.bargeCode ?? "",
                bargeName: detail.bargeName ?? "",
                voyageId: detail.voyageId ?? 0,
                voyageNo: detail.voyageNo ?? "",
                operationId: detail.operationId ?? "",
                operationNo: detail.operationNo ?? "",
                opRefNo: detail.opRefNo ?? "",
                purchaseOrderId: detail.purchaseOrderId ?? "",
                purchaseOrderNo: detail.purchaseOrderNo ?? "",

                supplyDate: detail.supplyDate
                  ? format(
                      parseDate(detail.supplyDate as string) || new Date(),
                      dateFormat
                    )
                  : "",
                customerName: detail.customerName ?? "",
                custAdjustmentNo: detail.custAdjustmentNo ?? "",
                arAdjustmentId: detail.arAdjustmentId ?? "",
                arAdjustmentNo: detail.arAdjustmentNo ?? "",
                editVersion: detail.editVersion ?? 0,
              }) as unknown as ApAdjustmentDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadAdjustment = useCallback(
    async ({
      adjustmentId,
      adjustmentNo,
      showLoader = false,
    }: {
      adjustmentId?: string | number | null
      adjustmentNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("adjustmentId", adjustmentId)
      console.log("adjustmentNo", adjustmentNo)
      const trimmedAdjustmentNo = adjustmentNo?.trim() ?? ""
      const trimmedAdjustmentId =
        typeof adjustmentId === "number"
          ? adjustmentId.toString()
          : (adjustmentId?.toString().trim() ?? "")

      if (!trimmedAdjustmentNo && !trimmedAdjustmentId) return null

      if (showLoader) {
        setIsLoadingAdjustment(true)
      }

      const requestAdjustmentId = trimmedAdjustmentId || "0"
      const requestAdjustmentNo = trimmedAdjustmentNo || ""

      try {
        const response = await getById(
          `${ApAdjustment.getByIdNo}/${requestAdjustmentId}/${requestAdjustmentNo}`
        )

        if (response?.result === 1) {
          const detailedAdjustment = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedAdjustment) {
            const parsed = parseDate(detailedAdjustment.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedAdjustment.accountDate as string)
            )

            const updatedAdjustment = transformToSchemaType(detailedAdjustment)

            setAdjustment(updatedAdjustment)
            form.reset(updatedAdjustment)
            form.trigger()

            const resolvedAdjustmentNo =
              updatedAdjustment.adjustmentNo ||
              trimmedAdjustmentNo ||
              trimmedAdjustmentId
            setSearchNo(resolvedAdjustmentNo)

            return resolvedAdjustmentNo
          }
        } else {
          toast.error(response?.message || "Failed to fetch adjustment details")
        }
      } catch (error) {
        console.error("Error fetching adjustment details:", error)
        toast.error("Error loading adjustment. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingAdjustment(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setAdjustment,
      setIsLoadingAdjustment,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleAdjustmentSelect = async (
    selectedAdjustment: IApAdjustmentHd | undefined
  ) => {
    if (!selectedAdjustment) return

    const loadedAdjustmentNo = await loadAdjustment({
      adjustmentId: selectedAdjustment.adjustmentId ?? "0",
      adjustmentNo: selectedAdjustment.adjustmentNo ?? "",
    })

    if (loadedAdjustmentNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchAdjustments from handleFilterChange
  const handleFilterChange = (newFilters: IApAdjustmentFilter) => {
    setFilters(newFilters)
    // Data refresh handled by AdjustmentTable component
  }

  // Data refresh handled by AdjustmentTable component

  // Set createBy and createDate for new adjustments on page load/refresh
  useEffect(() => {
    if (!adjustment && user && decimals.length > 0) {
      const currentAdjustmentId = form.getValues("adjustmentId")
      const currentAdjustmentNo = form.getValues("adjustmentNo")
      const isNewAdjustment =
        !currentAdjustmentId ||
        currentAdjustmentId === "0" ||
        !currentAdjustmentNo

      if (isNewAdjustment) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [adjustment, user, decimals, form])

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

  const handleAdjustmentSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedAdjustmentNo = await loadAdjustment({
        adjustmentId: "0",
        adjustmentNo: trimmedValue,
        showLoader: true,
      })

      if (loadedAdjustmentNo) {
        toast.success(`Adjustment ${loadedAdjustmentNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadAdjustment({
        adjustmentId: trimmedId,
        adjustmentNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadAdjustment, pendingDocId])

  // Determine mode and adjustment ID from URL
  const adjustmentNo = form.getValues("adjustmentNo")
  const isEdit = Boolean(adjustmentNo)
  const isCancelled = adjustment?.isCancel === true

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

  // Handle double-click to copy adjustmentNo to clipboard
  const handleCopyInvoiceNo = useCallback(async () => {
    const adjustmentNoToCopy = isEdit
      ? adjustment?.adjustmentNo || form.getValues("adjustmentNo") || ""
      : form.getValues("adjustmentNo") || ""

    await copyToClipboard(adjustmentNoToCopy)
  }, [isEdit, adjustment?.adjustmentNo, form, copyToClipboard])

  // Calculate payment status only if not cancelled
  const balAmt = adjustment?.balAmt ?? 0
  const payAmt = adjustment?.payAmt ?? 0

  const paymentStatus = isCancelled
    ? ""
    : balAmt === 0 && payAmt > 0
      ? "Fully Paid"
      : balAmt > 0 && payAmt > 0
        ? "Partially Paid"
        : balAmt > 0 && payAmt === 0
          ? "Not Paid"
          : ""

  // Compose title text
  const titleText = isEdit
    ? `Adjustment (Edit)- v[${adjustment?.editVersion}] - ${adjustmentNo}`
    : "Adjustment (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading adjustment form...
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
                {adjustment?.cancelRemarks && (
                  <div className="max-w-xs truncate text-sm text-red-600">
                    {adjustment.cancelRemarks}
                  </div>
                )}
              </div>
            )}

            {/* Payment Status Badge - Only show if not cancelled */}
            {!isCancelled && paymentStatus === "Not Paid" && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                <span className="mr-1 h-2 w-2 rounded-full bg-red-400"></span>
                Not Paid
              </span>
            )}
            {!isCancelled && paymentStatus === "Partially Paid" && (
              <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                <span className="mr-1 h-2 w-2 rounded-full bg-orange-400"></span>
                Partially Paid
              </span>
            )}
            {!isCancelled && paymentStatus === "Fully Paid" && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                <span className="mr-1 h-2 w-2 rounded-full bg-green-400"></span>
                Fully Paid
              </span>
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
                  title="Double-click to copy adjustment number"
                >
                  {titleText}
                </span>
              </span>
            </h1>
            {hasDetails && (
              <Badge
                variant={headerIsDebit ? "default" : "destructive"}
                className="px-3 py-1 text-xs font-medium"
              >
                {headerIsDebit ? "Debit" : "Credit"}
              </Badge>
            )}
            {isEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (adjustment?.adjustmentNo) {
                    setSearchNo(adjustment.adjustmentNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingAdjustment}
                className="h-4 w-4 p-0"
                title="Refresh adjustment data"
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
                placeholder="Search Adjustment No"
                className="h-8 cursor-pointer text-sm"
                readOnly={
                  !!adjustment?.adjustmentId && adjustment.adjustmentId !== "0"
                }
                disabled={
                  !!adjustment?.adjustmentId && adjustment.adjustmentId !== "0"
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
                payAmt > 0 ||
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
              disabled={!adjustment || adjustment.adjustmentId === "0"}
              onClick={handlePrintAdjustment}
            >
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              //disabled={!adjustment}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneConfirm(true)}
              disabled={
                !adjustment || adjustment.adjustmentId === "0" || isCancelled
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
                !adjustment ||
                adjustment.adjustmentId === "0" ||
                deleteMutation.isPending ||
                isCancelled ||
                payAmt > 0 ||
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
              handleSaveAdjustment()
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
              Adjustment List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing adjustments from the list below. Use
              search to filter records or create new adjustments.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <AdjustmentTable
              onAdjustmentSelect={handleAdjustmentSelect}
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              pageSize={pageSize || 50}
              onCloseAction={() => setShowListDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation */}
      <SaveConfirmation
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        onConfirm={handleSaveAdjustment}
        itemName={adjustment?.adjustmentNo || "New Adjustment"}
        operationType={
          adjustment?.adjustmentId && adjustment.adjustmentId !== "0"
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
        itemName={adjustment?.adjustmentNo}
        title="Delete Adjustment"
        description="Are you sure you want to delete this adjustment? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleAdjustmentDelete}
        itemName={adjustment?.adjustmentNo}
        title="Cancel Adjustment"
        description="Please provide a reason for cancelling this adjustment."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleAdjustmentSearch(searchNo)}
        code={searchNo}
        typeLabel="Adjustment"
        showDetails={false}
        description={`Do you want to load Adjustment ${searchNo}?`}
        isLoading={isLoadingAdjustment}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleAdjustmentReset}
        itemName={adjustment?.adjustmentNo}
        title="Reset Adjustment"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneAdjustment}
        itemName={adjustment?.adjustmentNo}
        title="Clone Adjustment"
        description="This will create a copy as a new adjustment."
      />
    </div>
  )
}
