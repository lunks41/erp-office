"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  calculateAdditionAmount,
  mathRound,
  setExchangeRate,
  setExchangeRateLocal,
} from "@/helpers/account"
import {
  calculateCtyAmounts,
  calculateLocalAmounts,
  calculateTotalAmounts,
  recalculateAllDetailsLocalAndCtyAmounts,
} from "@/helpers/gl-journal-calculations"
import { IGLJournalDt, IGLJournalFilter, IGLJournalHd } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  GLJournalDtSchemaType,
  GLJournalHdSchema,
  GLJournalHdSchemaType,
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
import { BasicSetting, GLJournal } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { GLTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetRequiredFields, useGetVisibleFields } from "@/hooks/use-lookup"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BalanceMismatchWarning,
  CancelConfirmation,
  CloneConfirmation,
  DeleteConfirmation,
  LoadConfirmation,
  ResetConfirmation,
  SaveConfirmation,
} from "@/components/confirmation"

import { getDefaultValues } from "./components/glJournal-defaultvalues"
import GLJournalTable from "./components/glJournal-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function GLJournalPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.gl
  const transactionId = GLTransactionId.journalentry

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
  const [showBalanceMismatchWarning, setShowBalanceMismatchWarning] =
    useState(false)
  const [balanceMismatchData, setBalanceMismatchData] = useState<{
    debitTotal: number
    creditTotal: number
    difference: number
  } | null>(null)
  const [isLoadingGLJournal, setIsLoadingGLJournal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [glJournal, setGLJournal] = useState<GLJournalHdSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/gl/journalentry`,
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

  const [filters, setFilters] = useState<IGLJournalFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "journalNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultGLJournalValues = useMemo(
    () => getDefaultValues(dateFormat).defaultGLJournal,
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
  const form = useForm<GLJournalHdSchemaType>({
    resolver: zodResolver(GLJournalHdSchema(required, visible)),
    defaultValues: glJournal
      ? {
          journalId: glJournal.journalId?.toString() ?? "0",
          journalNo: glJournal.journalNo ?? "",
          referenceNo: glJournal.referenceNo ?? "",
          trnDate: glJournal.trnDate ?? new Date(),
          accountDate: glJournal.accountDate ?? new Date(),
          gstClaimDate: glJournal.gstClaimDate ?? new Date(),
          currencyId: glJournal.currencyId ?? 0,
          exhRate: glJournal.exhRate ?? 0,
          ctyExhRate: glJournal.ctyExhRate ?? 0,
          totAmt: glJournal.totAmt ?? 0,
          totLocalAmt: glJournal.totLocalAmt ?? 0,
          totCtyAmt: glJournal.totCtyAmt ?? 0,
          gstAmt: glJournal.gstAmt ?? 0,
          gstLocalAmt: glJournal.gstLocalAmt ?? 0,
          gstCtyAmt: glJournal.gstCtyAmt ?? 0,
          totAmtAftGst: glJournal.totAmtAftGst ?? 0,
          totLocalAmtAftGst: glJournal.totLocalAmtAftGst ?? 0,
          totCtyAmtAftGst: glJournal.totCtyAmtAftGst ?? 0,
          moduleFrom: glJournal.moduleFrom ?? "",
          editVersion: glJournal.editVersion ?? 0,
          data_details:
            glJournal.data_details?.map((detail) => ({
              ...detail,
              journalId: detail.journalId?.toString() ?? "0",
              journalNo: detail.journalNo?.toString() ?? "",
              totAmt: detail.totAmt ?? 0,
              totLocalAmt: detail.totLocalAmt ?? 0,
              totCtyAmt: detail.totCtyAmt ?? 0,
              gstAmt: detail.gstAmt ?? 0,
              gstLocalAmt: detail.gstLocalAmt ?? 0,
              gstCtyAmt: detail.gstCtyAmt ?? 0,
              remarks: detail.remarks ?? "",
              editVersion: detail.editVersion ?? 0,
            })) || [],
        }
      : (() => {
          // For new glJournal, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultGLJournalValues,
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

    const currentGLjournalId = form.getValues("journalId") || "0"
    if (
      (glJournal && glJournal.journalId && glJournal.journalId !== "0") ||
      currentGLjournalId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultGLJournalValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [
    dateFormat,
    defaultGLJournalValues,
    decimals,
    form,
    glJournal,
    isDirty,
    user,
  ])

  // Mutations
  const saveMutation = usePersist<GLJournalHdSchemaType>(`${GLJournal.add}`)
  const updateMutation = usePersist<GLJournalHdSchemaType>(`${GLJournal.add}`)
  const deleteMutation = useDeleteWithRemarks(`${GLJournal.delete}`)

  // Remove the useGetGLJournalById hook for selection
  // const { data: invoiceByIdData, refetch: refetchGLJournalById } = ...

  // Handle Save
  const handleSaveGLJournal = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as IGLJournalHd
      )

      // Check debit and credit balance before saving
      const details = (formValues.data_details ||
        []) as unknown as IGLJournalDt[]
      if (details.length > 0) {
        const amtDec = decimals[0]?.amtDec || 2

        // Calculate sum of totAmt for isDebit = true
        let debitTotal = 0
        const debitDetails = details.filter((detail) => detail.isDebit === true)
        debitDetails.forEach((detail) => {
          debitTotal = calculateAdditionAmount(
            debitTotal,
            Number(detail.totAmt) || 0,
            amtDec
          )
        })

        // Calculate sum of totAmt for isDebit = false
        let creditTotal = 0
        const creditDetails = details.filter(
          (detail) => detail.isDebit === false
        )
        creditDetails.forEach((detail) => {
          creditTotal = calculateAdditionAmount(
            creditTotal,
            Number(detail.totAmt) || 0,
            amtDec
          )
        })

        // Check if debit and credit totals match
        const difference = Math.abs(debitTotal - creditTotal)
        // Use a very small tolerance for floating point comparison (0.0001)
        // Any difference >= 0.01 should be flagged as unbalanced
        const tolerance = 0.0001
        if (difference >= tolerance) {
          // Close save confirmation dialog
          setShowSaveConfirm(false)
          // Show warning dialog with amounts
          setBalanceMismatchData({
            debitTotal,
            creditTotal,
            difference,
          })
          setShowBalanceMismatchWarning(true)
          setIsSaving(false)
          return
        }
      }

      // Validate the form data using the schema
      const validationResult = GLJournalHdSchema(required, visible).safeParse(
        formValues
      )

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        // Set field-level errors on the form so FormMessage components can display them
        validationResult.error.issues.forEach((error) => {
          const fieldPath = error.path.join(".") as keyof GLJournalHdSchemaType
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

      console.log("handleSaveGLJournal formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.journalId) === 0
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
          gstClaimDate: formatDateForApi(formValues.gstClaimDate) || "",
        }

        const response =
          Number(formValues.journalId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const invoiceData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (invoiceData) {
            const updatedSchemaType = transformToSchemaType(
              invoiceData as unknown as IGLJournalHd
            )

            setSearchNo(updatedSchemaType.journalNo || "")
            setGLJournal(updatedSchemaType)
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

          // Check if this was a new glJournal or update
          const wasNewGLJournal = Number(formValues.journalId) === 0

          if (wasNewGLJournal) {
            //toast.success(
            // `GLJournal ${invoiceData?.journalNo || ""} saved successfully`
            //)
          } else {
            //toast.success("GLJournal updated successfully")
          }

          // Data refresh handled by GLJournalTable component
        } else {
          toast.error(response.message || "Failed to save glJournal")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving glJournal")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneGLJournal = async () => {
    if (glJournal) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedGLJournal: GLJournalHdSchemaType = {
        ...glJournal,
        journalId: "0",
        journalNo: "",
        // Set all dates to current date
        trnDate: dateStr,
        accountDate: dateStr,
        gstClaimDate: dateStr,
        isReverse: false,
        isRecurrency: false,
        revDate: dateStr,
        recurrenceUntilDate: dateStr,
        // Clear all audit fields
        createBy: "",
        editBy: "",
        cancelBy: "",
        createDate: "",
        editDate: "",
        cancelDate: "",
        // Clear all balance and payment amounts
        data_details:
          glJournal.data_details?.map((detail) => ({
            ...detail,
            journalId: "0",
            journalNo: "",
            editVersion: 0,
          })) || [],
      }

      // Calculate totals from details with proper rounding
      const amtDec = decimals[0]?.amtDec || 2
      const locAmtDec = decimals[0]?.locAmtDec || 2
      const ctyAmtDec = decimals[0]?.ctyAmtDec || 2

      const details = clonedGLJournal.data_details || []
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

        clonedGLJournal.totAmt = mathRound(totAmt, amtDec)
        clonedGLJournal.gstAmt = mathRound(gstAmt, amtDec)
        clonedGLJournal.totAmtAftGst = mathRound(totAmt + gstAmt, amtDec)
        clonedGLJournal.totLocalAmt = mathRound(totLocalAmt, locAmtDec)
        clonedGLJournal.gstLocalAmt = mathRound(gstLocalAmt, locAmtDec)
        clonedGLJournal.totLocalAmtAftGst = mathRound(
          totLocalAmt + gstLocalAmt,
          locAmtDec
        )
        clonedGLJournal.totCtyAmt = mathRound(totCtyAmt, ctyAmtDec)
        clonedGLJournal.gstCtyAmt = mathRound(gstCtyAmt, ctyAmtDec)
        clonedGLJournal.totCtyAmtAftGst = mathRound(
          totCtyAmt + gstCtyAmt,
          ctyAmtDec
        )
      } else {
        // Reset amounts if no details
        clonedGLJournal.totAmt = 0
        clonedGLJournal.totLocalAmt = 0
        clonedGLJournal.totCtyAmt = 0
        clonedGLJournal.gstAmt = 0
        clonedGLJournal.gstLocalAmt = 0
        clonedGLJournal.gstCtyAmt = 0
        clonedGLJournal.totAmtAftGst = 0
        clonedGLJournal.totLocalAmtAftGst = 0
        clonedGLJournal.totCtyAmtAftGst = 0
      }

      setGLJournal(clonedGLJournal)
      form.reset(clonedGLJournal)

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedGLJournal.currencyId && clonedGLJournal.accountDate) {
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
              formDetails as unknown as IGLJournalDt[],
              exchangeRate,
              countryExchangeRate,
              decimals[0],
              !!visible?.m_CtyCurr
            )

            // Update form with recalculated details
            form.setValue(
              "data_details",
              updatedDetails as unknown as GLJournalDtSchemaType[],
              { shouldDirty: true, shouldTouch: true }
            )

            // Recalculate header totals from updated details
            const totals = calculateTotalAmounts(
              updatedDetails as unknown as IGLJournalDt[],
              amtDec
            )
            form.setValue("totAmt", totals.totAmt)
            form.setValue("gstAmt", totals.gstAmt)
            form.setValue("totAmtAftGst", totals.totAmtAftGst)

            const localAmounts = calculateLocalAmounts(
              updatedDetails as unknown as IGLJournalDt[],
              locAmtDec
            )
            form.setValue("totLocalAmt", localAmounts.totLocalAmt)
            form.setValue("gstLocalAmt", localAmounts.gstLocalAmt)
            form.setValue("totLocalAmtAftGst", localAmounts.totLocalAmtAftGst)

            if (visible?.m_CtyCurr) {
              const countryAmounts = calculateCtyAmounts(
                updatedDetails as unknown as IGLJournalDt[],
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

      // Clear search input
      setSearchNo("")

      toast.success("GLJournal cloned successfully")
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
  const handleGLJournalDelete = async (cancelRemarks: string) => {
    if (!glJournal) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("GLJournal ID:", glJournal.journalId)
      console.log("GLJournal No:", glJournal.journalNo)

      const response = await deleteMutation.mutateAsync({
        documentId: glJournal.journalId?.toString() ?? "",
        documentNo: glJournal.journalNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setGLJournal(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultGLJournalValues,
          data_details: [],
        })
        toast.success(`GLJournal ${glJournal.journalNo} deleted successfully`)
        // Data refresh handled by GLJournalTable component
      } else {
        toast.error(response.message || "Failed to delete glJournal")
      }
    } catch {
      toast.error("Network error while deleting glJournal")
    }
  }

  // Handle Reset
  const handleGLJournalReset = () => {
    setGLJournal(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new glJournal)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultGLJournalValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("GLJournal reset successfully")
  }

  // Handle Print GLJournal Report
  // Handle Print GL Journal Report (single standard report)
  const handlePrintGLJournal = () => {
    if (!glJournal || glJournal.journalId === "0") {
      toast.error("Please select an glJournal to print")
      return
    }

    const formValues = form.getValues()
    const journalId =
      formValues.journalId || glJournal.journalId?.toString() || "0"
    const journalNo = formValues.journalNo || glJournal.journalNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: journalId,
      invoiceNo: journalNo,
      reportType: 2,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Single report file (no direct variant)
    const reportFile = "gl/GLJournal.trdp"

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

  // Helper function to transform IGLJournalHd to GLJournalHdSchemaType
  const transformToSchemaType = useCallback(
    (apiGLJournal: IGLJournalHd): GLJournalHdSchemaType => {
      return {
        journalId: apiGLJournal.journalId?.toString() ?? "0",
        journalNo: apiGLJournal.journalNo ?? "",
        referenceNo: apiGLJournal.referenceNo ?? "",

        trnDate: apiGLJournal.trnDate
          ? format(
              parseDate(apiGLJournal.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiGLJournal.accountDate
          ? format(
              parseDate(apiGLJournal.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        gstClaimDate: apiGLJournal.gstClaimDate
          ? format(
              parseDate(apiGLJournal.gstClaimDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        currencyId: apiGLJournal.currencyId ?? 0,
        exhRate: apiGLJournal.exhRate ?? 0,
        ctyExhRate: apiGLJournal.ctyExhRate ?? 0,

        totAmt: apiGLJournal.totAmt ?? 0,
        totLocalAmt: apiGLJournal.totLocalAmt ?? 0,
        totCtyAmt: apiGLJournal.totCtyAmt ?? 0,
        gstAmt: apiGLJournal.gstAmt ?? 0,
        gstLocalAmt: apiGLJournal.gstLocalAmt ?? 0,
        gstCtyAmt: apiGLJournal.gstCtyAmt ?? 0,
        totAmtAftGst: apiGLJournal.totAmtAftGst ?? 0,
        totLocalAmtAftGst: apiGLJournal.totLocalAmtAftGst ?? 0,
        totCtyAmtAftGst: apiGLJournal.totCtyAmtAftGst ?? 0,
        isReverse: apiGLJournal.isReverse ?? false,
        isRecurrency: apiGLJournal.isRecurrency ?? false,
        revDate: apiGLJournal.revDate
          ? format(
              parseDate(apiGLJournal.revDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        recurrenceUntilDate: apiGLJournal.recurrenceUntilDate
          ? format(
              parseDate(apiGLJournal.recurrenceUntilDate as string) ||
                new Date(),
              dateFormat
            )
          : dateFormat,
        remarks: apiGLJournal.remarks ?? "",
        moduleFrom: apiGLJournal.moduleFrom ?? "",
        editVersion: apiGLJournal.editVersion ?? 0,
        createBy: apiGLJournal.createBy ?? "",
        editBy: apiGLJournal.editBy ?? "",
        cancelBy: apiGLJournal.cancelBy ?? "",
        createDate: apiGLJournal.createDate
          ? format(
              parseDate(apiGLJournal.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",

        editDate: apiGLJournal.editDate
          ? format(
              parseDate(apiGLJournal.editDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiGLJournal.cancelDate
          ? format(
              parseDate(apiGLJournal.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        isCancel: apiGLJournal.isCancel ?? false,
        cancelRemarks: apiGLJournal.cancelRemarks ?? "",
        data_details:
          apiGLJournal.data_details?.map(
            (detail) =>
              ({
                ...detail,
                journalId: detail.journalId?.toString() ?? "0",
                journalNo: detail.journalNo ?? "",
                itemNo: detail.itemNo ?? 0,
                seqNo: detail.seqNo ?? 0,
                productId: detail.productId ?? 0,
                productCode: detail.productCode ?? "",
                productName: detail.productName ?? "",
                glId: detail.glId ?? 0,
                glCode: detail.glCode ?? "",
                glName: detail.glName ?? "",
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
                jobOrderId: detail.jobOrderId ?? 0,
                jobOrderNo: detail.jobOrderNo ?? "",
                taskId: detail.taskId ?? 0,
                taskName: detail.taskName ?? "",
                serviceItemNo: detail.serviceItemNo ?? 0,
                serviceItemNoName: detail.serviceItemNoName ?? "",
                editVersion: detail.editVersion ?? 0,
              }) as unknown as GLJournalDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadGLJournal = useCallback(
    async ({
      journalId,
      journalNo,
      showLoader = false,
    }: {
      journalId?: string | number | null
      journalNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("journalId", journalId)
      console.log("journalNo", journalNo)
      const trimmedGLJournalNo = journalNo?.trim() ?? ""
      const trimmedGLjournalId =
        typeof journalId === "number"
          ? journalId.toString()
          : (journalId?.toString().trim() ?? "")

      if (!trimmedGLJournalNo && !trimmedGLjournalId) return null

      if (showLoader) {
        setIsLoadingGLJournal(true)
      }

      const requestGLjournalId = trimmedGLjournalId || "0"
      const requestGLJournalNo = trimmedGLJournalNo || ""

      try {
        const response = await getById(
          `${GLJournal.getByIdNo}/${requestGLjournalId}/${requestGLJournalNo}`
        )

        if (response?.result === 1) {
          const detailedGLJournal = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedGLJournal) {
            const parsed = parseDate(detailedGLJournal.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedGLJournal.accountDate as string)
            )

            const updatedGLJournal = transformToSchemaType(detailedGLJournal)

            setGLJournal(updatedGLJournal)
            form.reset(updatedGLJournal)
            form.trigger()

            const resolvedGLJournalNo =
              updatedGLJournal.journalNo ||
              trimmedGLJournalNo ||
              trimmedGLjournalId
            setSearchNo(resolvedGLJournalNo)

            return resolvedGLJournalNo
          }
        } else {
          toast.error(response?.message || "Failed to fetch glJournal details")
        }
      } catch (error) {
        console.error("Error fetching glJournal details:", error)
        toast.error("Error loading glJournal. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingGLJournal(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setGLJournal,
      setIsLoadingGLJournal,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleGLJournalSelect = async (
    selectedGLJournal: IGLJournalHd | undefined
  ) => {
    if (!selectedGLJournal) return

    const loadedGLJournalNo = await loadGLJournal({
      journalId: selectedGLJournal.journalId ?? "0",
      journalNo: selectedGLJournal.journalNo ?? "",
    })

    if (loadedGLJournalNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchGLJournals from handleFilterChange
  const handleFilterChange = (newFilters: IGLJournalFilter) => {
    setFilters(newFilters)
    // Data refresh handled by GLJournalTable component
  }

  // Data refresh handled by GLJournalTable component

  // Set createBy and createDate for new invoices on page load/refresh
  useEffect(() => {
    if (!glJournal && user && decimals.length > 0) {
      const currentGLjournalId = form.getValues("journalId")
      const currentGLJournalNo = form.getValues("journalNo")
      const isNewGLJournal =
        !currentGLjournalId || currentGLjournalId === "0" || !currentGLJournalNo

      if (isNewGLJournal) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [glJournal, user, decimals, form])

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

  const handleGLJournalSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedGLJournalNo = await loadGLJournal({
        journalId: "0",
        journalNo: trimmedValue,
        showLoader: true,
      })

      if (loadedGLJournalNo) {
        toast.success(`GLJournal ${loadedGLJournalNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadGLJournal({
        journalId: trimmedId,
        journalNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadGLJournal, pendingDocId])

  // Determine mode and glJournal ID from URL
  const journalNo = form.getValues("journalNo")
  const isEdit = Boolean(journalNo)
  const isCancelled = glJournal?.isCancel === true

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

  // Handle double-click to copy journalNo to clipboard
  const handleCopyGLJournalNo = useCallback(async () => {
    const journalNoToCopy = isEdit
      ? glJournal?.journalNo || form.getValues("journalNo") || ""
      : form.getValues("journalNo") || ""

    await copyToClipboard(journalNoToCopy)
  }, [isEdit, glJournal?.journalNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `GLJournal (Edit)- v[${glJournal?.editVersion}] - ${journalNo}`
    : "GLJournal (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading glJournal form...
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
                {glJournal?.cancelRemarks && (
                  <div className="max-w-xs truncate text-sm text-red-600">
                    {glJournal.cancelRemarks}
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
                  onDoubleClick={handleCopyGLJournalNo}
                  title="Double-click to copy glJournal number"
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
                  if (glJournal?.journalNo) {
                    setSearchNo(glJournal.journalNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingGLJournal}
                className="h-4 w-4 p-0"
                title="Refresh glJournal data"
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
                placeholder="Search GLJournal No"
                className="h-8 cursor-pointer text-sm"
                readOnly={!!glJournal?.journalId && glJournal.journalId !== "0"}
                disabled={!!glJournal?.journalId && glJournal.journalId !== "0"}
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
              onClick={handlePrintGLJournal}
              disabled={!glJournal || glJournal.journalId === "0"}
            >
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              //disabled={!glJournal}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneConfirm(true)}
              disabled={
                !glJournal || glJournal.journalId === "0" || isCancelled
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
                !glJournal ||
                glJournal.journalId === "0" ||
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
              handleSaveGLJournal()
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
              GLJournal List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing GLJournals from the list below. Use
              search to filter records or create new invoices.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <GLJournalTable
              onGLJournalSelect={handleGLJournalSelect}
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
        onConfirm={handleSaveGLJournal}
        itemName={glJournal?.journalNo || "New GLJournal"}
        operationType={
          glJournal?.journalId && glJournal.journalId !== "0"
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
        itemName={glJournal?.journalNo}
        title="Delete GLJournal"
        description="Are you sure you want to delete this glJournal? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleGLJournalDelete}
        itemName={glJournal?.journalNo}
        title="Cancel GLJournal"
        description="Please provide a reason for cancelling this glJournal."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleGLJournalSearch(searchNo)}
        code={searchNo}
        typeLabel="GLJournal"
        showDetails={false}
        description={`Do you want to load GLJournal ${searchNo}?`}
        isLoading={isLoadingGLJournal}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleGLJournalReset}
        itemName={glJournal?.journalNo}
        title="Reset GLJournal"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneGLJournal}
        itemName={glJournal?.journalNo}
        title="Clone GLJournal"
        description="This will create a copy as a new glJournal."
      />

      {/* Balance Mismatch Warning */}
      {balanceMismatchData && (
        <BalanceMismatchWarning
          open={showBalanceMismatchWarning}
          onOpenChange={setShowBalanceMismatchWarning}
          debitTotal={balanceMismatchData.debitTotal}
          creditTotal={balanceMismatchData.creditTotal}
          difference={balanceMismatchData.difference}
          decimals={decimals[0]?.amtDec || 2}
        />
      )}
    </div>
  )
}
