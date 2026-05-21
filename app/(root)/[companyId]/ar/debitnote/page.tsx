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
} from "@/helpers/ar-debitnote-calculations"
import {
  IArDebitNoteDt,
  IArDebitNoteFilter,
  IArDebitNoteHd,
} from "@/interfaces"
import { ApiResponse } from "@/interfaces/auth"
import { IPaymentHistoryDetails } from "@/interfaces/history"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  ArDebitNoteDtSchemaType,
  ArDebitNoteHdSchema,
  ArDebitNoteHdSchemaType,
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
import { ArDebitNote, BasicSetting } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { ARTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetPaymentDetails } from "@/hooks/use-histoy"
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

import { getDefaultValues } from "./components/debitnote-defaultvalues"
import DebitNoteTable from "./components/debitnote-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function DebitNotePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.debitNote

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
  const [isLoadingDebitNote, setIsLoadingDebitNote] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [debitNote, setDebitNote] = useState<ArDebitNoteHdSchemaType | null>(
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
    () => `history-doc:/${companyId}/ar/debitNote`,
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

  const [filters, setFilters] = useState<IArDebitNoteFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "debitNoteNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultDebitNoteValues = useMemo(
    () => getDefaultValues(dateFormat).defaultDebitNote,
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
  const form = useForm<ArDebitNoteHdSchemaType>({
    resolver: zodResolver(ArDebitNoteHdSchema(required, visible)),
    defaultValues: debitNote
      ? {
          debitNoteId: debitNote.debitNoteId?.toString() ?? "0",
          debitNoteNo: debitNote.debitNoteNo ?? "",
          referenceNo: debitNote.referenceNo ?? "",
          suppDebitNoteNo: debitNote.suppDebitNoteNo ?? "",
          trnDate: debitNote.trnDate ?? new Date(),
          accountDate: debitNote.accountDate ?? new Date(),
          dueDate: debitNote.dueDate ?? new Date(),
          deliveryDate: debitNote.deliveryDate ?? new Date(),
          gstClaimDate: debitNote.gstClaimDate ?? new Date(),
          customerId: debitNote.customerId ?? 0,
          currencyId: debitNote.currencyId ?? 0,
          exhRate: debitNote.exhRate ?? 0,
          ctyExhRate: debitNote.ctyExhRate ?? 0,
          creditTermId: debitNote.creditTermId ?? 0,
          bankId: debitNote.bankId ?? 0,
          invoiceId: debitNote.invoiceId ?? "0",
          invoiceNo: debitNote.invoiceNo ?? "",
          totAmt: debitNote.totAmt ?? 0,
          totLocalAmt: debitNote.totLocalAmt ?? 0,
          totCtyAmt: debitNote.totCtyAmt ?? 0,
          gstAmt: debitNote.gstAmt ?? 0,
          gstLocalAmt: debitNote.gstLocalAmt ?? 0,
          gstCtyAmt: debitNote.gstCtyAmt ?? 0,
          totAmtAftGst: debitNote.totAmtAftGst ?? 0,
          totLocalAmtAftGst: debitNote.totLocalAmtAftGst ?? 0,
          totCtyAmtAftGst: debitNote.totCtyAmtAftGst ?? 0,
          balAmt: debitNote.balAmt ?? 0,
          balLocalAmt: debitNote.balLocalAmt ?? 0,
          payAmt: debitNote.payAmt ?? 0,
          payLocalAmt: debitNote.payLocalAmt ?? 0,
          exGainLoss: debitNote.exGainLoss ?? 0,
          operationId: debitNote.operationId ?? 0,
          operationNo: debitNote.operationNo ?? "",
          remarks: debitNote.remarks ?? "",
          address1: debitNote.address1 ?? "",
          address2: debitNote.address2 ?? "",
          address3: debitNote.address3 ?? "",
          address4: debitNote.address4 ?? "",
          pinCode: debitNote.pinCode ?? "",
          countryId: debitNote.countryId ?? 0,
          phoneNo: debitNote.phoneNo ?? "",
          faxNo: debitNote.faxNo ?? "",
          contactName: debitNote.contactName ?? "",
          mobileNo: debitNote.mobileNo ?? "",
          emailAdd: debitNote.emailAdd ?? "",
          moduleFrom: debitNote.moduleFrom ?? "",
          supplierName: debitNote.supplierName ?? "",
          addressId: debitNote.addressId ?? 0,
          contactId: debitNote.contactId ?? 0,
          apDebitNoteId: debitNote.apDebitNoteId ?? "",
          apDebitNoteNo: debitNote.apDebitNoteNo ?? "",
          editVersion: debitNote.editVersion ?? 0,
          salesOrderId: debitNote.salesOrderId ?? 0,
          salesOrderNo: debitNote.salesOrderNo ?? "",
          jobOrderId: debitNote.jobOrderId ?? 0,
          jobOrderNo: debitNote.jobOrderNo ?? "",
          vesselId: debitNote.vesselId ?? 0,
          portId: debitNote.portId ?? 0,
          data_details:
            debitNote.data_details?.map((detail) => ({
              ...detail,
              debitNoteId: detail.debitNoteId?.toString() ?? "0",
              debitNoteNo: detail.debitNoteNo?.toString() ?? "",
              totAmt: detail.totAmt ?? 0,
              totLocalAmt: detail.totLocalAmt ?? 0,
              totCtyAmt: detail.totCtyAmt ?? 0,
              gstAmt: detail.gstAmt ?? 0,
              gstLocalAmt: detail.gstLocalAmt ?? 0,
              gstCtyAmt: detail.gstCtyAmt ?? 0,
              deliveryDate: detail.deliveryDate ?? "",
              supplyDate: detail.supplyDate ?? "",
              remarks: detail.remarks ?? "",
              supplierName: detail.supplierName ?? "",
              suppDebitNoteNo: detail.suppDebitNoteNo ?? "",
              apDebitNoteId: detail.apDebitNoteId ?? "0",
              apDebitNoteNo: detail.apDebitNoteNo ?? "",
              editVersion: detail.editVersion ?? 0,
            })) || [],
        }
      : (() => {
          // For new debitNote, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultDebitNoteValues,
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

    const currentDebitNoteId = form.getValues("debitNoteId") || "0"
    if (
      (debitNote && debitNote.debitNoteId && debitNote.debitNoteId !== "0") ||
      currentDebitNoteId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultDebitNoteValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [
    dateFormat,
    defaultDebitNoteValues,
    decimals,
    form,
    debitNote,
    isDirty,
    user,
  ])

  // Mutations
  const saveMutation = usePersist<ArDebitNoteHdSchemaType>(`${ArDebitNote.add}`)
  const updateMutation = usePersist<ArDebitNoteHdSchemaType>(
    `${ArDebitNote.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${ArDebitNote.delete}`)

  // Remove the useGetDebitNoteById hook for selection
  // const { data: debitNoteByIdData, refetch: refetchDebitNoteById } = ...

  // Handle Save
  const handleSaveDebitNote = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as IArDebitNoteHd
      )

      // Validate the form data using the schema
      const validationResult = ArDebitNoteHdSchema(required, visible).safeParse(
        formValues
      )

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          referenceNo: "Reference No",
          accountDate: "Account Date",
          customerId: "Customer",
          currencyId: "Currency",
          totAmt: "Total Amount",
          remarks: "Remarks",
        }
        const failedFields: string[] = []
        validationResult.error.issues.forEach((error) => {
          const pathKey = error.path.join(".")
          const fieldPath = pathKey as keyof ArDebitNoteHdSchemaType
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

      console.log("handleSaveDebitNote formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.debitNoteId) === 0
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
          Number(formValues.debitNoteId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const debitNoteData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (debitNoteData) {
            const updatedSchemaType = transformToSchemaType(
              debitNoteData as unknown as IArDebitNoteHd
            )

            setSearchNo(updatedSchemaType.debitNoteNo || "")
            setDebitNote(updatedSchemaType)
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

          // Check if this was a new debitNote or update
          const wasNewDebitNote = Number(formValues.debitNoteId) === 0

          if (wasNewDebitNote) {
            //toast.success(
            // `DebitNote ${debitNoteData?.debitNoteNo || ""} saved successfully`
            //)
          } else {
            //toast.success("DebitNote updated successfully")
          }

          // Data refresh handled by DebitNoteTable component
        } else {
          toast.error(response.message || "Failed to save debitNote")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving debitNote")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneDebitNote = async () => {
    if (debitNote) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedDebitNote: ArDebitNoteHdSchemaType = {
        ...debitNote,
        debitNoteId: "0",
        debitNoteNo: "",
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
        // Clear AP debitNote link
        apDebitNoteId: "0",
        apDebitNoteNo: "",
        // Keep data details - do not remove
        data_details:
          debitNote.data_details?.map((detail) => ({
            ...detail,
            debitNoteId: "0",
            debitNoteNo: "",
            apDebitNoteId: "0",
            apDebitNoteNo: "",
            editVersion: 0,
          })) || [],
      }

      // Calculate totals from details with proper rounding
      const amtDec = decimals[0]?.amtDec || 2
      const locAmtDec = decimals[0]?.locAmtDec || 2
      const ctyAmtDec = decimals[0]?.ctyAmtDec || 2

      const details = clonedDebitNote.data_details || []
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

        clonedDebitNote.totAmt = mathRound(totAmt, amtDec)
        clonedDebitNote.gstAmt = mathRound(gstAmt, amtDec)
        clonedDebitNote.totAmtAftGst = mathRound(totAmt + gstAmt, amtDec)
        clonedDebitNote.totLocalAmt = mathRound(totLocalAmt, locAmtDec)
        clonedDebitNote.gstLocalAmt = mathRound(gstLocalAmt, locAmtDec)
        clonedDebitNote.totLocalAmtAftGst = mathRound(
          totLocalAmt + gstLocalAmt,
          locAmtDec
        )
        clonedDebitNote.totCtyAmt = mathRound(totCtyAmt, ctyAmtDec)
        clonedDebitNote.gstCtyAmt = mathRound(gstCtyAmt, ctyAmtDec)
        clonedDebitNote.totCtyAmtAftGst = mathRound(
          totCtyAmt + gstCtyAmt,
          ctyAmtDec
        )
      } else {
        // Reset amounts if no details
        clonedDebitNote.totAmt = 0
        clonedDebitNote.totLocalAmt = 0
        clonedDebitNote.totCtyAmt = 0
        clonedDebitNote.gstAmt = 0
        clonedDebitNote.gstLocalAmt = 0
        clonedDebitNote.gstCtyAmt = 0
        clonedDebitNote.totAmtAftGst = 0
        clonedDebitNote.totLocalAmtAftGst = 0
        clonedDebitNote.totCtyAmtAftGst = 0
      }

      setDebitNote(clonedDebitNote)
      form.reset(clonedDebitNote)

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedDebitNote.currencyId && clonedDebitNote.accountDate) {
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
              formDetails as unknown as IArDebitNoteDt[],
              exchangeRate,
              countryExchangeRate,
              decimals[0],
              !!visible?.m_CtyCurr
            )

            // Update form with recalculated details
            form.setValue(
              "data_details",
              updatedDetails as unknown as ArDebitNoteDtSchemaType[],
              { shouldDirty: true, shouldTouch: true }
            )

            // Recalculate header totals from updated details
            const totals = calculateTotalAmounts(
              updatedDetails as unknown as IArDebitNoteDt[],
              amtDec
            )
            form.setValue("totAmt", totals.totAmt)
            form.setValue("gstAmt", totals.gstAmt)
            form.setValue("totAmtAftGst", totals.totAmtAftGst)

            const localAmounts = calculateLocalAmounts(
              updatedDetails as unknown as IArDebitNoteDt[],
              locAmtDec
            )
            form.setValue("totLocalAmt", localAmounts.totLocalAmt)
            form.setValue("gstLocalAmt", localAmounts.gstLocalAmt)
            form.setValue("totLocalAmtAftGst", localAmounts.totLocalAmtAftGst)

            if (visible?.m_CtyCurr) {
              const countryAmounts = calculateCtyAmounts(
                updatedDetails as unknown as IArDebitNoteDt[],
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
      if (clonedDebitNote.creditTermId && clonedDebitNote.accountDate) {
        try {
          await setDueDate(form)
        } catch (error) {
          console.error("Error calculating due date:", error)
        }
      }

      // Clear search input
      setSearchNo("")

      toast.success("DebitNote cloned successfully")
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
  const handleDebitNoteDelete = async (cancelRemarks: string) => {
    if (!debitNote) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("DebitNote ID:", debitNote.debitNoteId)
      console.log("DebitNote No:", debitNote.debitNoteNo)

      const response = await deleteMutation.mutateAsync({
        documentId: debitNote.debitNoteId?.toString() ?? "",
        documentNo: debitNote.debitNoteNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setDebitNote(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultDebitNoteValues,
          data_details: [],
        })
        toast.success(`DebitNote ${debitNote.debitNoteNo} deleted successfully`)
        // Data refresh handled by DebitNoteTable component
      } else {
        toast.error(response.message || "Failed to delete debitNote")
      }
    } catch {
      toast.error("Network error while deleting debitNote")
    }
  }

  // Handle Reset
  const handleDebitNoteReset = () => {
    setDebitNote(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new debitNote)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultDebitNoteValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("DebitNote reset successfully")
  }

  // Handle Print Debit Note Report
  const handlePrintDebitNote = () => {
    if (!debitNote || debitNote.debitNoteId === "0") {
      toast.error("Please select a debit note to print")
      return
    }

    const formValues = form.getValues()
    const debitNoteId =
      formValues.debitNoteId || debitNote.debitNoteId?.toString() || "0"
    const debitNoteNo = formValues.debitNoteNo || debitNote.debitNoteNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: debitNoteId,
      invoiceNo: debitNoteNo,
      reportType: 1,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Store report data in sessionStorage
    const reportData = {
      reportFile: "ar/ArDebitNote.trdp",
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

  // Helper function to transform IArDebitNoteHd to ArDebitNoteHdSchemaType
  const transformToSchemaType = useCallback(
    (apiDebitNote: IArDebitNoteHd): ArDebitNoteHdSchemaType => {
      return {
        debitNoteId: apiDebitNote.debitNoteId?.toString() ?? "0",
        debitNoteNo: apiDebitNote.debitNoteNo ?? "",
        referenceNo: apiDebitNote.referenceNo ?? "",
        suppDebitNoteNo: apiDebitNote.suppDebitNoteNo ?? "",
        trnDate: apiDebitNote.trnDate
          ? format(
              parseDate(apiDebitNote.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiDebitNote.accountDate
          ? format(
              parseDate(apiDebitNote.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        dueDate: apiDebitNote.dueDate
          ? format(
              parseDate(apiDebitNote.dueDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        deliveryDate: apiDebitNote.deliveryDate
          ? format(
              parseDate(apiDebitNote.deliveryDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        gstClaimDate: apiDebitNote.gstClaimDate
          ? format(
              parseDate(apiDebitNote.gstClaimDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        customerId: apiDebitNote.customerId ?? 0,
        currencyId: apiDebitNote.currencyId ?? 0,
        exhRate: apiDebitNote.exhRate ?? 0,
        ctyExhRate: apiDebitNote.ctyExhRate ?? 0,
        creditTermId: apiDebitNote.creditTermId ?? 0,
        bankId: apiDebitNote.bankId ?? 0,
        invoiceId: apiDebitNote.invoiceId ?? "0",
        invoiceNo: apiDebitNote.invoiceNo ?? "",
        totAmt: apiDebitNote.totAmt ?? 0,
        totLocalAmt: apiDebitNote.totLocalAmt ?? 0,
        totCtyAmt: apiDebitNote.totCtyAmt ?? 0,
        gstAmt: apiDebitNote.gstAmt ?? 0,
        gstLocalAmt: apiDebitNote.gstLocalAmt ?? 0,
        gstCtyAmt: apiDebitNote.gstCtyAmt ?? 0,
        totAmtAftGst: apiDebitNote.totAmtAftGst ?? 0,
        totLocalAmtAftGst: apiDebitNote.totLocalAmtAftGst ?? 0,
        totCtyAmtAftGst: apiDebitNote.totCtyAmtAftGst ?? 0,
        balAmt: apiDebitNote.balAmt ?? 0,
        balLocalAmt: apiDebitNote.balLocalAmt ?? 0,
        payAmt: apiDebitNote.payAmt ?? 0,
        payLocalAmt: apiDebitNote.payLocalAmt ?? 0,
        exGainLoss: apiDebitNote.exGainLoss ?? 0,
        operationId: apiDebitNote.operationId ?? 0,
        operationNo: apiDebitNote.operationNo ?? "",
        remarks: apiDebitNote.remarks ?? "",
        addressId: apiDebitNote.addressId ?? 0, // Not available in IArDebitNoteHd
        contactId: apiDebitNote.contactId ?? 0, // Not available in IArDebitNoteHd
        address1: apiDebitNote.address1 ?? "",
        address2: apiDebitNote.address2 ?? "",
        address3: apiDebitNote.address3 ?? "",
        address4: apiDebitNote.address4 ?? "",
        pinCode: apiDebitNote.pinCode ?? "",
        countryId: apiDebitNote.countryId ?? 0,
        phoneNo: apiDebitNote.phoneNo ?? "",
        faxNo: apiDebitNote.faxNo ?? "",
        contactName: apiDebitNote.contactName ?? "",
        mobileNo: apiDebitNote.mobileNo ?? "",
        emailAdd: apiDebitNote.emailAdd ?? "",
        moduleFrom: apiDebitNote.moduleFrom ?? "",
        supplierName: apiDebitNote.supplierName ?? "",
        apDebitNoteId: apiDebitNote.apDebitNoteId ?? "",
        apDebitNoteNo: apiDebitNote.apDebitNoteNo ?? "",
        editVersion: apiDebitNote.editVersion ?? 0,
        salesOrderId: apiDebitNote.salesOrderId ?? 0,
        salesOrderNo: apiDebitNote.salesOrderNo ?? "",
        jobOrderId: apiDebitNote.jobOrderId ?? 0,
        jobOrderNo: apiDebitNote.jobOrderNo ?? "",
        vesselId: apiDebitNote.vesselId ?? 0,
        portId: apiDebitNote.portId ?? 0,
        createBy: apiDebitNote.createBy ?? "",
        editBy: apiDebitNote.editBy ?? "",
        cancelBy: apiDebitNote.cancelBy ?? "",
        createDate: apiDebitNote.createDate
          ? format(
              parseDate(apiDebitNote.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",

        editDate: apiDebitNote.editDate
          ? format(
              parseDate(apiDebitNote.editDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiDebitNote.cancelDate
          ? format(
              parseDate(apiDebitNote.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        isCancel: apiDebitNote.isCancel ?? false,
        cancelRemarks: apiDebitNote.cancelRemarks ?? "",
        data_details:
          apiDebitNote.data_details?.map(
            (detail) =>
              ({
                ...detail,
                debitNoteId: detail.debitNoteId?.toString() ?? "0",
                debitNoteNo: detail.debitNoteNo ?? "",
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
                gstId: detail.gstId ?? 1,
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
                salesOrderId: detail.salesOrderId ?? "",
                salesOrderNo: detail.salesOrderNo ?? "",

                supplyDate: detail.supplyDate
                  ? format(
                      parseDate(detail.supplyDate as string) || new Date(),
                      dateFormat
                    )
                  : "",
                supplierName: detail.supplierName ?? "",
                suppDebitNoteNo: detail.suppDebitNoteNo ?? "",
                apDebitNoteId: detail.apDebitNoteId ?? "",
                apDebitNoteNo: detail.apDebitNoteNo ?? "",
                editVersion: detail.editVersion ?? 0,
              }) as unknown as ArDebitNoteDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadDebitNote = useCallback(
    async ({
      debitNoteId,
      debitNoteNo,
      showLoader = false,
    }: {
      debitNoteId?: string | number | null
      debitNoteNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("debitNoteId", debitNoteId)
      console.log("debitNoteNo", debitNoteNo)
      const trimmedDebitNoteNo = debitNoteNo?.trim() ?? ""
      const trimmedDebitNoteId =
        typeof debitNoteId === "number"
          ? debitNoteId.toString()
          : (debitNoteId?.toString().trim() ?? "")

      if (!trimmedDebitNoteNo && !trimmedDebitNoteId) return null

      if (showLoader) {
        setIsLoadingDebitNote(true)
      }

      const requestDebitNoteId = trimmedDebitNoteId || "0"
      const requestDebitNoteNo = trimmedDebitNoteNo || ""

      try {
        const response = await getById(
          `${ArDebitNote.getByIdNo}/${requestDebitNoteId}/${requestDebitNoteNo}`
        )

        if (response?.result === 1) {
          const detailedDebitNote = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedDebitNote) {
            const parsed = parseDate(detailedDebitNote.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedDebitNote.accountDate as string)
            )

            const updatedDebitNote = transformToSchemaType(detailedDebitNote)

            setDebitNote(updatedDebitNote)
            form.reset(updatedDebitNote)
            form.trigger()

            const resolvedDebitNoteNo =
              updatedDebitNote.debitNoteNo ||
              trimmedDebitNoteNo ||
              trimmedDebitNoteId
            setSearchNo(resolvedDebitNoteNo)

            return resolvedDebitNoteNo
          }
        } else {
          toast.error(response?.message || "Failed to fetch debitNote details")
        }
      } catch (error) {
        console.error("Error fetching debitNote details:", error)
        toast.error("Error loading debitNote. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingDebitNote(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setDebitNote,
      setIsLoadingDebitNote,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleDebitNoteSelect = async (
    selectedDebitNote: IArDebitNoteHd | undefined
  ) => {
    if (!selectedDebitNote) return

    const loadedDebitNoteNo = await loadDebitNote({
      debitNoteId: selectedDebitNote.debitNoteId ?? "0",
      debitNoteNo: selectedDebitNote.debitNoteNo ?? "",
    })

    if (loadedDebitNoteNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchDebitNotes from handleFilterChange
  const handleFilterChange = (newFilters: IArDebitNoteFilter) => {
    setFilters(newFilters)
    // Data refresh handled by DebitNoteTable component
  }

  // Data refresh handled by DebitNoteTable component

  // Set createBy and createDate for new debitNotes on page load/refresh
  useEffect(() => {
    if (!debitNote && user && decimals.length > 0) {
      const currentDebitNoteId = form.getValues("debitNoteId")
      const currentDebitNoteNo = form.getValues("debitNoteNo")
      const isNewDebitNote =
        !currentDebitNoteId || currentDebitNoteId === "0" || !currentDebitNoteNo

      if (isNewDebitNote) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [debitNote, user, decimals, form])

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

  const handleDebitNoteSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedDebitNoteNo = await loadDebitNote({
        debitNoteId: "0",
        debitNoteNo: trimmedValue,
        showLoader: true,
      })

      if (loadedDebitNoteNo) {
        toast.success(`DebitNote ${loadedDebitNoteNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadDebitNote({
        debitNoteId: trimmedId,
        debitNoteNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadDebitNote, pendingDocId])

  // Determine mode and debitNote ID from URL
  const debitNoteNo = form.getValues("debitNoteNo")
  const isEdit = Boolean(debitNoteNo)
  const isCancelled = debitNote?.isCancel === true

  // Check if document has history payment-details; if yes, lock update/delete/cancel
  const watchedDebitNoteId = form.watch("debitNoteId")
  const effectiveDocIdForHistory =
    watchedDebitNoteId != null &&
    String(watchedDebitNoteId).trim() !== "" &&
    String(watchedDebitNoteId) !== "undefined"
      ? String(watchedDebitNoteId).trim()
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

  // Handle double-click to copy debitNoteNo to clipboard
  const handleCopyInvoiceNo = useCallback(async () => {
    const debitNoteNoToCopy = isEdit
      ? debitNote?.debitNoteNo || form.getValues("debitNoteNo") || ""
      : form.getValues("debitNoteNo") || ""

    await copyToClipboard(debitNoteNoToCopy)
  }, [isEdit, debitNote?.debitNoteNo, form, copyToClipboard])

  // Calculate payment status only if not cancelled
  const balAmt = debitNote?.balAmt ?? 0
  const payAmt = debitNote?.payAmt ?? 0

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
    ? `DebitNote (Edit)- v[${debitNote?.editVersion}] - ${debitNoteNo}`
    : "DebitNote (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading debitNote form...
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
                {debitNote?.cancelRemarks && (
                  <div className="max-w-[160px] truncate text-xs text-red-600 sm:max-w-[220px]">
                    {debitNote.cancelRemarks}
                  </div>
                )}
              </div>
            )}
            {!isCancelled && paymentStatus === "Not Paid" && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                Not Paid
              </span>
            )}
            {!isCancelled && paymentStatus === "Partially Paid" && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-800">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                Partially Paid
              </span>
            )}
            {!isCancelled && paymentStatus === "Fully Paid" && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-400" />
                Fully Paid
              </span>
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
                  title="Double-click to copy debit note number"
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
                  if (debitNote?.debitNoteNo) {
                    setSearchNo(debitNote.debitNoteNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingDebitNote}
                className="h-4 w-4 p-0"
                title="Refresh debitNote data"
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
                placeholder="Search DebitNote No"
                className="h-7 cursor-pointer text-xs"
                readOnly={
                  !!debitNote?.debitNoteId && debitNote.debitNoteId !== "0"
                }
                disabled={
                  !!debitNote?.debitNoteId && debitNote.debitNoteId !== "0"
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

            <Button
              variant="outline"
              size="sm"
              disabled={!debitNote || debitNote.debitNoteId === "0"}
              onClick={handlePrintDebitNote}
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
              disabled={
                !debitNote || debitNote.debitNoteId === "0" || isCancelled
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
                !debitNote ||
                debitNote.debitNoteId === "0" ||
                deleteMutation.isPending ||
                isCancelled ||
                payAmt > 0 ||
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
              handleSaveDebitNote()
            }}
            isEdit={isEdit}
            visible={visible}
            required={required}
            companyId={Number(companyId)}
            isCancelled={isCancelled}
          />
        </TabsContent>

        <TabsContent value="other" className={transactionTabPanelClass()}>
          <Other form={form} visible={visible} />
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
              DebitNote List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing debitNotes from the list below. Use
              search to filter records or create new debitNotes.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <DebitNoteTable
              onDebitNoteSelect={handleDebitNoteSelect}
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
        onConfirm={handleSaveDebitNote}
        itemName={debitNote?.debitNoteNo || "New DebitNote"}
        operationType={
          debitNote?.debitNoteId && debitNote.debitNoteId !== "0"
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
        itemName={debitNote?.debitNoteNo}
        title="Delete DebitNote"
        description="Are you sure you want to delete this debitNote? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleDebitNoteDelete}
        itemName={debitNote?.debitNoteNo}
        title="Cancel DebitNote"
        description="Please provide a reason for cancelling this debitNote."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleDebitNoteSearch(searchNo)}
        code={searchNo}
        typeLabel="DebitNote"
        showDetails={false}
        description={`Do you want to load DebitNote ${searchNo}?`}
        isLoading={isLoadingDebitNote}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleDebitNoteReset}
        itemName={debitNote?.debitNoteNo}
        title="New DebitNote"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneDebitNote}
        itemName={debitNote?.debitNoteNo}
        title="Clone DebitNote"
        description="This will create a copy as a new debitNote."
      />
    </>
  )
}
