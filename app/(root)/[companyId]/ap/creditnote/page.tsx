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
} from "@/helpers/ap-creditNote-calculations"
import { ApiResponse } from "@/interfaces/auth"
import {
  IApCreditNoteDt,
  IApCreditNoteFilter,
  IApCreditNoteHd,
} from "@/interfaces"
import { IPaymentHistoryDetails } from "@/interfaces/history"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  ApCreditNoteDtSchemaType,
  ApCreditNoteHdSchema,
  ApCreditNoteHdSchemaType,
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
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getById } from "@/lib/api-client"
import { ApCreditNote, BasicSetting } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { APTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetRequiredFields, useGetVisibleFields } from "@/hooks/use-lookup"
import { useGetPaymentDetails } from "@/hooks/use-histoy"
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

import { getDefaultValues } from "./components/creditnote-defaultvalues"
import CreditNoteTable from "./components/creditnote-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function CreditNotePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.ap
  const transactionId = APTransactionId.creditNote

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
  const [isLoadingCreditNote, setIsLoadingCreditNote] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [creditNote, setCreditNote] = useState<ApCreditNoteHdSchemaType | null>(
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
    () => `history-doc:/${companyId}/ap/creditNote`,
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

  const [filters, setFilters] = useState<IApCreditNoteFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "creditNoteNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultCreditNoteValues = useMemo(
    () => getDefaultValues(dateFormat).defaultCreditNote,
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
  const form = useForm<ApCreditNoteHdSchemaType>({
    resolver: zodResolver(ApCreditNoteHdSchema(required, visible)),
    defaultValues: creditNote
      ? {
          creditNoteId: creditNote.creditNoteId?.toString() ?? "0",
          creditNoteNo: creditNote.creditNoteNo ?? "",
          referenceNo: creditNote.referenceNo ?? "",
          suppCreditNoteNo: creditNote.suppCreditNoteNo ?? "",
          trnDate: creditNote.trnDate ?? new Date(),
          accountDate: creditNote.accountDate ?? new Date(),
          dueDate: creditNote.dueDate ?? new Date(),
          deliveryDate: creditNote.deliveryDate ?? new Date(),
          gstClaimDate: creditNote.gstClaimDate ?? new Date(),
          supplierId: creditNote.supplierId ?? 0,
          currencyId: creditNote.currencyId ?? 0,
          exhRate: creditNote.exhRate ?? 0,
          ctyExhRate: creditNote.ctyExhRate ?? 0,
          creditTermId: creditNote.creditTermId ?? 0,
          bankId: creditNote.bankId ?? 0,
          invoiceId: creditNote.invoiceId ?? "0",
          invoiceNo: creditNote.invoiceNo ?? "",
          totAmt: creditNote.totAmt ?? 0,
          totLocalAmt: creditNote.totLocalAmt ?? 0,
          totCtyAmt: creditNote.totCtyAmt ?? 0,
          gstAmt: creditNote.gstAmt ?? 0,
          gstLocalAmt: creditNote.gstLocalAmt ?? 0,
          gstCtyAmt: creditNote.gstCtyAmt ?? 0,
          totAmtAftGst: creditNote.totAmtAftGst ?? 0,
          totLocalAmtAftGst: creditNote.totLocalAmtAftGst ?? 0,
          totCtyAmtAftGst: creditNote.totCtyAmtAftGst ?? 0,
          balAmt: creditNote.balAmt ?? 0,
          balLocalAmt: creditNote.balLocalAmt ?? 0,
          payAmt: creditNote.payAmt ?? 0,
          payLocalAmt: creditNote.payLocalAmt ?? 0,
          exGainLoss: creditNote.exGainLoss ?? 0,
          operationId: creditNote.operationId ?? 0,
          operationNo: creditNote.operationNo ?? "",
          remarks: creditNote.remarks ?? "",
          address1: creditNote.address1 ?? "",
          address2: creditNote.address2 ?? "",
          address3: creditNote.address3 ?? "",
          address4: creditNote.address4 ?? "",
          pinCode: creditNote.pinCode ?? "",
          countryId: creditNote.countryId ?? 0,
          phoneNo: creditNote.phoneNo ?? "",
          faxNo: creditNote.faxNo ?? "",
          contactName: creditNote.contactName ?? "",
          mobileNo: creditNote.mobileNo ?? "",
          emailAdd: creditNote.emailAdd ?? "",
          moduleFrom: creditNote.moduleFrom ?? "",
          customerName: creditNote.customerName ?? "",
          addressId: creditNote.addressId ?? 0,
          contactId: creditNote.contactId ?? 0,
          arCreditNoteId: creditNote.arCreditNoteId ?? "",
          arCreditNoteNo: creditNote.arCreditNoteNo ?? "",
          editVersion: creditNote.editVersion ?? 0,
          purchaseOrderId: creditNote.purchaseOrderId ?? 0,
          purchaseOrderNo: creditNote.purchaseOrderNo ?? "",

          serviceCategoryId: creditNote.serviceCategoryId ?? 0,

          data_details:
            creditNote.data_details?.map((detail) => ({
              ...detail,
              creditNoteId: detail.creditNoteId?.toString() ?? "0",
              creditNoteNo: detail.creditNoteNo?.toString() ?? "",
              jobOrderId: detail.jobOrderId ?? 0,
              jobOrderNo: detail.jobOrderNo ?? "",
              taskId: detail.taskId ?? 0,
              taskName: detail.taskName ?? "",
              serviceItemNo: detail.serviceItemNo ?? 0,
              serviceItemNoName: detail.serviceItemNoName ?? "",
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
              custCreditNoteNo: detail.custCreditNoteNo ?? "",
              arCreditNoteId: detail.arCreditNoteId ?? "0",
              arCreditNoteNo: detail.arCreditNoteNo ?? "",
              editVersion: detail.editVersion ?? 0,
            })) || [],
        }
      : (() => {
          // For new creditNote, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultCreditNoteValues,
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

    const currentCreditNoteId = form.getValues("creditNoteId") || "0"
    if (
      (creditNote &&
        creditNote.creditNoteId &&
        creditNote.creditNoteId !== "0") ||
      currentCreditNoteId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCreditNoteValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [
    dateFormat,
    defaultCreditNoteValues,
    decimals,
    form,
    creditNote,
    isDirty,
    user,
  ])

  // Mutations
  const saveMutation = usePersist<ApCreditNoteHdSchemaType>(
    `${ApCreditNote.add}`
  )
  const updateMutation = usePersist<ApCreditNoteHdSchemaType>(
    `${ApCreditNote.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${ApCreditNote.delete}`)

  // Remove the useGetCreditNoteById hook for selection
  // const { data: creditNoteByIdData, refetch: refetchCreditNoteById } = ...

  // Handle Save
  const handleSaveCreditNote = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as IApCreditNoteHd
      )

      // Validate the form data using the schema
      const validationResult = ApCreditNoteHdSchema(
        required,
        visible
      ).safeParse(formValues)

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          referenceNo: "Reference No",
          accountDate: "Account Date",
          supplierId: "Supplier",
          currencyId: "Currency",
          totAmt: "Total Amount",
          remarks: "Remarks",
        }
        const failedFields: string[] = []
        validationResult.error.issues.forEach((error) => {
          const pathKey = error.path.join(".")
          const fieldPath = pathKey as keyof ApCreditNoteHdSchemaType
          form.setError(fieldPath, {
            type: "validation",
            message: error.message,
          })
          const label =
            fieldLabelMap[pathKey] ??
            pathKey.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
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

      // If GST amount is non-zero, Service Category is mandatory
      if ((formValues.gstAmt ?? 0) !== 0 && !(formValues.serviceCategoryId ?? 0)) {
        form.setError("serviceCategoryId", {
          type: "validation",
          message: "Service Category is required when VAT amount is non-zero",
        })
        toast.error("Service Category is required when VAT amount is non-zero")
        return
      }

      console.log("handleSaveCreditNote formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.creditNoteId) === 0
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
          Number(formValues.creditNoteId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const creditNoteData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (creditNoteData) {
            const updatedSchemaType = transformToSchemaType(
              creditNoteData as unknown as IApCreditNoteHd
            )

            setSearchNo(updatedSchemaType.creditNoteNo || "")
            setCreditNote(updatedSchemaType)
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

          // Check if this was a new creditNote or update
          const wasNewCreditNote = Number(formValues.creditNoteId) === 0

          if (wasNewCreditNote) {
            //toast.success(
            // `CreditNote ${creditNoteData?.creditNoteNo || ""} saved successfully`
            //)
          } else {
            //toast.success("CreditNote updated successfully")
          }

          // Data refresh handled by CreditNoteTable component
        } else {
          toast.error(response.message || "Failed to save creditNote")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving creditNote")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneCreditNote = async () => {
    if (creditNote) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedCreditNote: ApCreditNoteHdSchemaType = {
        ...creditNote,
        creditNoteId: "0",
        creditNoteNo: "",
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
        // Clear AP creditNote link
        arCreditNoteId: "0",
        arCreditNoteNo: "",
        // Keep data details - do not remove
        data_details:
          creditNote.data_details?.map((detail) => ({
            ...detail,
            creditNoteId: "0",
            creditNoteNo: "",
            arCreditNoteId: "0",
            arCreditNoteNo: "",
            editVersion: 0,
          })) || [],
      }

      // Calculate totals from details with proper rounding
      const amtDec = decimals[0]?.amtDec || 2
      const locAmtDec = decimals[0]?.locAmtDec || 2
      const ctyAmtDec = decimals[0]?.ctyAmtDec || 2

      const details = clonedCreditNote.data_details || []
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

        clonedCreditNote.totAmt = mathRound(totAmt, amtDec)
        clonedCreditNote.gstAmt = mathRound(gstAmt, amtDec)
        clonedCreditNote.totAmtAftGst = mathRound(totAmt + gstAmt, amtDec)
        clonedCreditNote.totLocalAmt = mathRound(totLocalAmt, locAmtDec)
        clonedCreditNote.gstLocalAmt = mathRound(gstLocalAmt, locAmtDec)
        clonedCreditNote.totLocalAmtAftGst = mathRound(
          totLocalAmt + gstLocalAmt,
          locAmtDec
        )
        clonedCreditNote.totCtyAmt = mathRound(totCtyAmt, ctyAmtDec)
        clonedCreditNote.gstCtyAmt = mathRound(gstCtyAmt, ctyAmtDec)
        clonedCreditNote.totCtyAmtAftGst = mathRound(
          totCtyAmt + gstCtyAmt,
          ctyAmtDec
        )
      } else {
        // Reset amounts if no details
        clonedCreditNote.totAmt = 0
        clonedCreditNote.totLocalAmt = 0
        clonedCreditNote.totCtyAmt = 0
        clonedCreditNote.gstAmt = 0
        clonedCreditNote.gstLocalAmt = 0
        clonedCreditNote.gstCtyAmt = 0
        clonedCreditNote.totAmtAftGst = 0
        clonedCreditNote.totLocalAmtAftGst = 0
        clonedCreditNote.totCtyAmtAftGst = 0
      }

      setCreditNote(clonedCreditNote)
      form.reset(clonedCreditNote)

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedCreditNote.currencyId && clonedCreditNote.accountDate) {
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
              formDetails as unknown as IApCreditNoteDt[],
              exchangeRate,
              countryExchangeRate,
              decimals[0],
              !!visible?.m_CtyCurr
            )

            // Update form with recalculated details
            form.setValue(
              "data_details",
              updatedDetails as unknown as ApCreditNoteDtSchemaType[],
              { shouldDirty: true, shouldTouch: true }
            )

            // Recalculate header totals from updated details
            const totals = calculateTotalAmounts(
              updatedDetails as unknown as IApCreditNoteDt[],
              amtDec
            )
            form.setValue("totAmt", totals.totAmt)
            form.setValue("gstAmt", totals.gstAmt)
            form.setValue("totAmtAftGst", totals.totAmtAftGst)

            const localAmounts = calculateLocalAmounts(
              updatedDetails as unknown as IApCreditNoteDt[],
              locAmtDec
            )
            form.setValue("totLocalAmt", localAmounts.totLocalAmt)
            form.setValue("gstLocalAmt", localAmounts.gstLocalAmt)
            form.setValue("totLocalAmtAftGst", localAmounts.totLocalAmtAftGst)

            if (visible?.m_CtyCurr) {
              const countryAmounts = calculateCtyAmounts(
                updatedDetails as unknown as IApCreditNoteDt[],
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
      if (clonedCreditNote.creditTermId && clonedCreditNote.accountDate) {
        try {
          await setDueDate(form)
        } catch (error) {
          console.error("Error calculating due date:", error)
        }
      }

      // Clear search input
      setSearchNo("")

      toast.success("CreditNote cloned successfully")
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
  const handleCreditNoteDelete = async (cancelRemarks: string) => {
    if (!creditNote) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("CreditNote ID:", creditNote.creditNoteId)
      console.log("CreditNote No:", creditNote.creditNoteNo)

      const response = await deleteMutation.mutateAsync({
        documentId: creditNote.creditNoteId?.toString() ?? "",
        documentNo: creditNote.creditNoteNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setCreditNote(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultCreditNoteValues,
          data_details: [],
        })
        toast.success(
          `CreditNote ${creditNote.creditNoteNo} deleted successfully`
        )
        // Data refresh handled by CreditNoteTable component
      } else {
        toast.error(response.message || "Failed to delete creditNote")
      }
    } catch {
      toast.error("Network error while deleting creditNote")
    }
  }

  // Handle Reset
  const handleCreditNoteReset = () => {
    setCreditNote(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new creditNote)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCreditNoteValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("CreditNote reset successfully")
  }

  // Helper function to transform IApCreditNoteHd to ApCreditNoteHdSchemaType
  const transformToSchemaType = useCallback(
    (apiCreditNote: IApCreditNoteHd): ApCreditNoteHdSchemaType => {
      return {
        creditNoteId: apiCreditNote.creditNoteId?.toString() ?? "0",
        creditNoteNo: apiCreditNote.creditNoteNo ?? "",
        referenceNo: apiCreditNote.referenceNo ?? "",
        suppCreditNoteNo: apiCreditNote.suppCreditNoteNo ?? "",
        trnDate: apiCreditNote.trnDate
          ? format(
              parseDate(apiCreditNote.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiCreditNote.accountDate
          ? format(
              parseDate(apiCreditNote.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        dueDate: apiCreditNote.dueDate
          ? format(
              parseDate(apiCreditNote.dueDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        deliveryDate: apiCreditNote.deliveryDate
          ? format(
              parseDate(apiCreditNote.deliveryDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        gstClaimDate: apiCreditNote.gstClaimDate
          ? format(
              parseDate(apiCreditNote.gstClaimDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        supplierId: apiCreditNote.supplierId ?? 0,
        currencyId: apiCreditNote.currencyId ?? 0,
        exhRate: apiCreditNote.exhRate ?? 0,
        ctyExhRate: apiCreditNote.ctyExhRate ?? 0,
        creditTermId: apiCreditNote.creditTermId ?? 0,
        bankId: apiCreditNote.bankId ?? 0,
        invoiceId: apiCreditNote.invoiceId ?? "0",
        invoiceNo: apiCreditNote.invoiceNo ?? "",
        totAmt: apiCreditNote.totAmt ?? 0,
        totLocalAmt: apiCreditNote.totLocalAmt ?? 0,
        totCtyAmt: apiCreditNote.totCtyAmt ?? 0,
        gstAmt: apiCreditNote.gstAmt ?? 0,
        gstLocalAmt: apiCreditNote.gstLocalAmt ?? 0,
        gstCtyAmt: apiCreditNote.gstCtyAmt ?? 0,
        totAmtAftGst: apiCreditNote.totAmtAftGst ?? 0,
        totLocalAmtAftGst: apiCreditNote.totLocalAmtAftGst ?? 0,
        totCtyAmtAftGst: apiCreditNote.totCtyAmtAftGst ?? 0,
        balAmt: apiCreditNote.balAmt ?? 0,
        balLocalAmt: apiCreditNote.balLocalAmt ?? 0,
        payAmt: apiCreditNote.payAmt ?? 0,
        payLocalAmt: apiCreditNote.payLocalAmt ?? 0,
        exGainLoss: apiCreditNote.exGainLoss ?? 0,
        operationId: apiCreditNote.operationId ?? 0,
        operationNo: apiCreditNote.operationNo ?? "",
        remarks: apiCreditNote.remarks ?? "",
        addressId: apiCreditNote.addressId ?? 0, // Not available in IApCreditNoteHd
        contactId: apiCreditNote.contactId ?? 0, // Not available in IApCreditNoteHd
        address1: apiCreditNote.address1 ?? "",
        address2: apiCreditNote.address2 ?? "",
        address3: apiCreditNote.address3 ?? "",
        address4: apiCreditNote.address4 ?? "",
        pinCode: apiCreditNote.pinCode ?? "",
        countryId: apiCreditNote.countryId ?? 0,
        phoneNo: apiCreditNote.phoneNo ?? "",
        faxNo: apiCreditNote.faxNo ?? "",
        contactName: apiCreditNote.contactName ?? "",
        mobileNo: apiCreditNote.mobileNo ?? "",
        emailAdd: apiCreditNote.emailAdd ?? "",
        moduleFrom: apiCreditNote.moduleFrom ?? "",
        customerName: apiCreditNote.customerName ?? "",
        arCreditNoteId: apiCreditNote.arCreditNoteId ?? "",
        arCreditNoteNo: apiCreditNote.arCreditNoteNo ?? "",
        editVersion: apiCreditNote.editVersion ?? 0,
        purchaseOrderId: apiCreditNote.purchaseOrderId ?? 0,
        purchaseOrderNo: apiCreditNote.purchaseOrderNo ?? "",
        serviceCategoryId: apiCreditNote.serviceCategoryId ?? 0,
        createBy: apiCreditNote.createBy ?? "",
        editBy: apiCreditNote.editBy ?? "",
        cancelBy: apiCreditNote.cancelBy ?? "",
        createDate: apiCreditNote.createDate
          ? format(
              parseDate(apiCreditNote.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",

        editDate: apiCreditNote.editDate
          ? format(
              parseDate(apiCreditNote.editDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiCreditNote.cancelDate
          ? format(
              parseDate(apiCreditNote.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        isCancel: apiCreditNote.isCancel ?? false,
        cancelRemarks: apiCreditNote.cancelRemarks ?? "",
        data_details:
          apiCreditNote.data_details?.map(
            (detail) =>
              ({
                ...detail,
                creditNoteId: detail.creditNoteId?.toString() ?? "0",
                creditNoteNo: detail.creditNoteNo ?? "",
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
                jobOrderId: detail.jobOrderId ?? 0,
                jobOrderNo: detail.jobOrderNo ?? "",
                taskId: detail.taskId ?? 0,
                taskName: detail.taskName ?? "",
                serviceItemNo: detail.serviceItemNo ?? 0,
                serviceItemNoName: detail.serviceItemNoName ?? "",
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
                custCreditNoteNo: detail.custCreditNoteNo ?? "",
                arCreditNoteId: detail.arCreditNoteId ?? "",
                arCreditNoteNo: detail.arCreditNoteNo ?? "",
                editVersion: detail.editVersion ?? 0,
              }) as unknown as ApCreditNoteDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadCreditNote = useCallback(
    async ({
      creditNoteId,
      creditNoteNo,
      showLoader = false,
    }: {
      creditNoteId?: string | number | null
      creditNoteNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("creditNoteId", creditNoteId)
      console.log("creditNoteNo", creditNoteNo)
      const trimmedCreditNoteNo = creditNoteNo?.trim() ?? ""
      const trimmedCreditNoteId =
        typeof creditNoteId === "number"
          ? creditNoteId.toString()
          : (creditNoteId?.toString().trim() ?? "")

      if (!trimmedCreditNoteNo && !trimmedCreditNoteId) return null

      if (showLoader) {
        setIsLoadingCreditNote(true)
      }

      const requestCreditNoteId = trimmedCreditNoteId || "0"
      const requestCreditNoteNo = trimmedCreditNoteNo || ""

      try {
        const response = await getById(
          `${ApCreditNote.getByIdNo}/${requestCreditNoteId}/${requestCreditNoteNo}`
        )

        if (response?.result === 1) {
          const detailedCreditNote = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedCreditNote) {
            const parsed = parseDate(detailedCreditNote.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedCreditNote.accountDate as string)
            )

            const updatedCreditNote = transformToSchemaType(detailedCreditNote)

            setCreditNote(updatedCreditNote)
            form.reset(updatedCreditNote)
            form.trigger()

            const resolvedCreditNoteNo =
              updatedCreditNote.creditNoteNo ||
              trimmedCreditNoteNo ||
              trimmedCreditNoteId
            setSearchNo(resolvedCreditNoteNo)

            return resolvedCreditNoteNo
          }
        } else {
          toast.error(response?.message || "Failed to fetch creditNote details")
        }
      } catch (error) {
        console.error("Error fetching creditNote details:", error)
        toast.error("Error loading creditNote. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingCreditNote(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setCreditNote,
      setIsLoadingCreditNote,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleCreditNoteSelect = async (
    selectedCreditNote: IApCreditNoteHd | undefined
  ) => {
    if (!selectedCreditNote) return

    const loadedCreditNoteNo = await loadCreditNote({
      creditNoteId: selectedCreditNote.creditNoteId ?? "0",
      creditNoteNo: selectedCreditNote.creditNoteNo ?? "",
    })

    if (loadedCreditNoteNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchCreditNotes from handleFilterChange
  const handleFilterChange = (newFilters: IApCreditNoteFilter) => {
    setFilters(newFilters)
    // Data refresh handled by CreditNoteTable component
  }

  // Data refresh handled by CreditNoteTable component

  // Set createBy and createDate for new creditNotes on page load/refresh
  useEffect(() => {
    if (!creditNote && user && decimals.length > 0) {
      const currentCreditNoteId = form.getValues("creditNoteId")
      const currentCreditNoteNo = form.getValues("creditNoteNo")
      const isNewCreditNote =
        !currentCreditNoteId ||
        currentCreditNoteId === "0" ||
        !currentCreditNoteNo

      if (isNewCreditNote) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [creditNote, user, decimals, form])

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

  const handleCreditNoteSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedCreditNoteNo = await loadCreditNote({
        creditNoteId: "0",
        creditNoteNo: trimmedValue,
        showLoader: true,
      })

      if (loadedCreditNoteNo) {
        toast.success(`CreditNote ${loadedCreditNoteNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadCreditNote({
        creditNoteId: trimmedId,
        creditNoteNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadCreditNote, pendingDocId])

  // Determine mode and creditNote ID from URL
  const creditNoteNo = form.getValues("creditNoteNo")
  const isEdit = Boolean(creditNoteNo)
  const isCancelled = creditNote?.isCancel === true

  // Check if document has history payment-details; if yes, lock update/delete/cancel
  const watchedCreditNoteId = form.watch("creditNoteId")
  const effectiveDocIdForHistory =
    watchedCreditNoteId != null &&
    String(watchedCreditNoteId).trim() !== "" &&
    String(watchedCreditNoteId) !== "undefined"
      ? String(watchedCreditNoteId).trim()
      : ""

  const { data: paymentHistoryResponse } =
    useGetPaymentDetails<IPaymentHistoryDetails>(
      Number(moduleId),
      Number(transactionId),
      effectiveDocIdForHistory || "0",
      {
        enabled:
          !!effectiveDocIdForHistory && effectiveDocIdForHistory !== "0",
      }
    )

  const historyRawData =
    (paymentHistoryResponse as ApiResponse<IPaymentHistoryDetails>)?.data
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

  // Handle double-click to copy creditNoteNo to clipboard
  const handleCopyInvoiceNo = useCallback(async () => {
    const creditNoteNoToCopy = isEdit
      ? creditNote?.creditNoteNo || form.getValues("creditNoteNo") || ""
      : form.getValues("creditNoteNo") || ""

    await copyToClipboard(creditNoteNoToCopy)
  }, [isEdit, creditNote?.creditNoteNo, form, copyToClipboard])

  // Calculate payment status only if not cancelled
  const balAmt = creditNote?.balAmt ?? 0
  const payAmt = creditNote?.payAmt ?? 0

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
    ? `CreditNote (Edit)- v[${creditNote?.editVersion}] - ${creditNoteNo}`
    : "CreditNote (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading creditNote form...
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
                {creditNote?.cancelRemarks && (
                  <div className="max-w-xs truncate text-sm text-red-600">
                    {creditNote.cancelRemarks}
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
                  title="Double-click to copy credit note number"
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
                  if (creditNote?.creditNoteNo) {
                    setSearchNo(creditNote.creditNoteNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingCreditNote}
                className="h-4 w-4 p-0"
                title="Refresh creditNote data"
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
                placeholder="Search CreditNote No"
                className="h-8 cursor-pointer text-sm"
                readOnly={
                  !!creditNote?.creditNoteId && creditNote.creditNoteId !== "0"
                }
                disabled={
                  !!creditNote?.creditNoteId && creditNote.creditNoteId !== "0"
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

            {/* <Button
              variant="outline"
              size="sm"
              disabled={!creditNote || creditNote.creditNoteId === "0"}
              onClick={handlePrintCreditNote}
            >
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button> */}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              //disabled={!creditNote}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              New
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneConfirm(true)}
              disabled={
                !creditNote || creditNote.creditNoteId === "0" || isCancelled
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
                !creditNote ||
                creditNote.creditNoteId === "0" ||
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
          </div>
        </div>

        <TabsContent value="main">
          <Main
            form={form}
            onSuccessAction={async () => {
              handleSaveCreditNote()
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
              CreditNote List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing creditNotes from the list below. Use
              search to filter records or create new creditNotes.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <CreditNoteTable
              onCreditNoteSelect={handleCreditNoteSelect}
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
        onConfirm={handleSaveCreditNote}
        itemName={creditNote?.creditNoteNo || "New CreditNote"}
        operationType={
          creditNote?.creditNoteId && creditNote.creditNoteId !== "0"
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
        itemName={creditNote?.creditNoteNo}
        title="Delete CreditNote"
        description="Are you sure you want to delete this creditNote? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleCreditNoteDelete}
        itemName={creditNote?.creditNoteNo}
        title="Cancel CreditNote"
        description="Please provide a reason for cancelling this creditNote."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleCreditNoteSearch(searchNo)}
        code={searchNo}
        typeLabel="CreditNote"
        showDetails={false}
        description={`Do you want to load CreditNote ${searchNo}?`}
        isLoading={isLoadingCreditNote}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleCreditNoteReset}
        itemName={creditNote?.creditNoteNo}
        title="New CreditNote"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneCreditNote}
        itemName={creditNote?.creditNoteNo}
        title="Clone CreditNote"
        description="This will create a copy as a new creditNote."
      />
    </div>
  )
}
