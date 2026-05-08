"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  mathRound,
  setExchangeRate,
  setExchangeRateLocal,
} from "@/helpers/account"
import {
  calculateCtyAmounts,
  calculateLocalAmounts,
  calculateTotalAmounts,
  recalculateAllDetailsLocalAndCtyAmounts,
} from "@/helpers/cb-genreceipt-calculations"
import {
  ICbGenReceiptDt,
  ICbGenReceiptFilter,
  ICbGenReceiptHd,
} from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  CbGenReceiptDtSchemaType,
  CbGenReceiptHdSchema,
  CbGenReceiptHdSchemaType,
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
import { BasicSetting, CbGenReceipt } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { CBTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
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

import { getDefaultValues } from "./components/cbgenreceipt-defaultvalues"
import CbGenReceiptTable from "./components/cbgenreceipt-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function CbGenReceiptPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbgenreceipt

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
  const [isLoadingCbGenReceipt, setIsLoadingCbGenReceipt] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [cbGenReceipt, setCbGenReceipt] =
    useState<CbGenReceiptHdSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/cb/cbgenreceipt`,
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

  const [filters, setFilters] = useState<ICbGenReceiptFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "receiptNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultCbGenReceiptValues = useMemo(
    () => getDefaultValues(dateFormat).defaultCbGenReceipt,
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
  const receiptSchema = useMemo(
    () => CbGenReceiptHdSchema(required, visible, { chequePaymentTypeIds }),
    [required, visible, chequePaymentTypeIds]
  )

  // Add form state management
  const form = useForm<CbGenReceiptHdSchemaType>({
    resolver: zodResolver(receiptSchema),
    defaultValues: cbGenReceipt
      ? {
          receiptId: cbGenReceipt.receiptId?.toString() ?? "0",
          receiptNo: cbGenReceipt.receiptNo ?? "",
          referenceNo: cbGenReceipt.referenceNo ?? "",
          trnDate: cbGenReceipt.trnDate ?? new Date(),
          accountDate: cbGenReceipt.accountDate ?? new Date(),
          gstClaimDate: cbGenReceipt.gstClaimDate ?? new Date(),
          currencyId: cbGenReceipt.currencyId ?? 0,
          exhRate: cbGenReceipt.exhRate ?? 0,
          ctyExhRate: cbGenReceipt.ctyExhRate ?? 0,
          bankId: cbGenReceipt.bankId ?? 0,
          paymentTypeId: cbGenReceipt.paymentTypeId ?? 0,
          chequeNo: cbGenReceipt.chequeNo ?? "",
          chequeDate: cbGenReceipt.chequeDate ?? new Date(),
          bankChgAmt: cbGenReceipt.bankChgAmt ?? 0,
          bankChgLocalAmt: cbGenReceipt.bankChgLocalAmt ?? 0,
          totAmt: cbGenReceipt.totAmt ?? 0,
          totLocalAmt: cbGenReceipt.totLocalAmt ?? 0,
          totCtyAmt: cbGenReceipt.totCtyAmt ?? 0,
          gstAmt: cbGenReceipt.gstAmt ?? 0,
          gstLocalAmt: cbGenReceipt.gstLocalAmt ?? 0,
          gstCtyAmt: cbGenReceipt.gstCtyAmt ?? 0,
          totAmtAftGst: cbGenReceipt.totAmtAftGst ?? 0,
          totLocalAmtAftGst: cbGenReceipt.totLocalAmtAftGst ?? 0,
          totCtyAmtAftGst: cbGenReceipt.totCtyAmtAftGst ?? 0,
          remarks: cbGenReceipt.remarks ?? "",
          payeeTo: cbGenReceipt.payeeTo ?? "",
          supplierRegNo: cbGenReceipt.supplierRegNo ?? "",
          moduleFrom: cbGenReceipt.moduleFrom ?? "",
          createDate: cbGenReceipt.createDate ?? "",
          editDate: cbGenReceipt.editDate ?? "",
          isCancel: cbGenReceipt.isCancel ?? false,
          cancelDate: cbGenReceipt.cancelDate ?? "",
          cancelRemarks: cbGenReceipt.cancelRemarks ?? "",
          createBy: cbGenReceipt.createBy ?? "",
          editBy: cbGenReceipt.editBy ?? "",
          cancelBy: cbGenReceipt.cancelBy ?? "",
          editVersion: cbGenReceipt.editVersion ?? 0,
          appBy: cbGenReceipt.appBy ?? "",
          appDate: cbGenReceipt.appDate ?? "",
          appStatusId: cbGenReceipt.appStatusId ?? "",
          data_details:
            cbGenReceipt.data_details?.map((detail) => ({
              ...detail,
              receiptId: detail.receiptId?.toString() ?? "0",
              receiptNo: detail.receiptNo?.toString() ?? "",
              itemNo: detail.itemNo ?? 0,
              seqNo: detail.seqNo ?? 0,
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
            })) || [],
        }
      : (() => {
          // For new cbGenReceipt, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultCbGenReceiptValues,
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

    const currentGLreceiptId = form.getValues("receiptId") || "0"
    if (
      (cbGenReceipt &&
        cbGenReceipt.receiptId &&
        cbGenReceipt.receiptId !== "0") ||
      currentGLreceiptId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCbGenReceiptValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [
    dateFormat,
    defaultCbGenReceiptValues,
    decimals,
    form,
    cbGenReceipt,
    isDirty,
    user,
  ])

  // Mutations
  const saveMutation = usePersist<CbGenReceiptHdSchemaType>(
    `${CbGenReceipt.add}`
  )
  const updateMutation = usePersist<CbGenReceiptHdSchemaType>(
    `${CbGenReceipt.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${CbGenReceipt.delete}`)

  // Remove the useGetCbGenReceiptById hook for selection
  // const { data: invoiceByIdData, refetch: refetchCbGenReceiptById } = ...

  // Handle Save
  const handleSaveCbGenReceipt = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as ICbGenReceiptHd
      )

      // Validate the form data using the schema
      const validationResult = receiptSchema.safeParse(formValues)

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          referenceNo: "Reference No",
          accountDate: "Account Date",
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
          const fieldPath = pathKey as keyof CbGenReceiptHdSchemaType
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

      console.log("handleSaveCbGenReceipt formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.receiptId) === 0
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

        const acc = formatDateForApi(parsedAccountDate) || ""
        const prev = parsedPrevAccountDate
          ? formatDateForApi(parsedPrevAccountDate) || ""
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
          chequeDate: formatDateForApi(formValues.chequeDate) || "",
        }

        const response =
          Number(formValues.receiptId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const invoiceData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (invoiceData) {
            const updatedSchemaType = transformToSchemaType(
              invoiceData as unknown as ICbGenReceiptHd
            )

            setSearchNo(updatedSchemaType.receiptNo || "")
            setCbGenReceipt(updatedSchemaType)
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

          // Check if this was a new cbGenReceipt or update
          const wasNewCbGenReceipt = Number(formValues.receiptId) === 0

          if (wasNewCbGenReceipt) {
            //toast.success(
            // `CbGenReceipt ${invoiceData?.receiptNo || ""} saved successfully`
            //)
          } else {
            //toast.success("CbGenReceipt updated successfully")
          }

          // Data refresh handled by CbGenReceiptTable component
        } else {
          toast.error(response.message || "Failed to save cbGenReceipt")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving cbGenReceipt")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneCbGenReceipt = async () => {
    if (cbGenReceipt) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedCbGenReceipt: CbGenReceiptHdSchemaType = {
        ...cbGenReceipt,
        receiptId: "0",
        receiptNo: "",
        // Set all dates to current date
        trnDate: dateStr,
        accountDate: dateStr,
        gstClaimDate: dateStr,
        // Clear all audit fields
        createBy: "",
        editBy: "",
        cancelBy: "",
        createDate: "",
        editDate: "",
        cancelDate: "",
        // Clear all balance and receipt amounts
        data_details:
          cbGenReceipt.data_details?.map((detail) => ({
            ...detail,
            receiptId: "0",
            receiptNo: "",
            editVersion: 0,
          })) || [],
      }

      // Calculate totals from details with proper rounding
      const amtDec = decimals[0]?.amtDec || 2
      const locAmtDec = decimals[0]?.locAmtDec || 2
      const ctyAmtDec = decimals[0]?.ctyAmtDec || 2

      const details = clonedCbGenReceipt.data_details || []
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

        clonedCbGenReceipt.totAmt = mathRound(totAmt, amtDec)
        clonedCbGenReceipt.gstAmt = mathRound(gstAmt, amtDec)
        clonedCbGenReceipt.totAmtAftGst = mathRound(totAmt + gstAmt, amtDec)
        clonedCbGenReceipt.totLocalAmt = mathRound(totLocalAmt, locAmtDec)
        clonedCbGenReceipt.gstLocalAmt = mathRound(gstLocalAmt, locAmtDec)
        clonedCbGenReceipt.totLocalAmtAftGst = mathRound(
          totLocalAmt + gstLocalAmt,
          locAmtDec
        )
        clonedCbGenReceipt.totCtyAmt = mathRound(totCtyAmt, ctyAmtDec)
        clonedCbGenReceipt.gstCtyAmt = mathRound(gstCtyAmt, ctyAmtDec)
        clonedCbGenReceipt.totCtyAmtAftGst = mathRound(
          totCtyAmt + gstCtyAmt,
          ctyAmtDec
        )
      } else {
        // Reset amounts if no details
        clonedCbGenReceipt.totAmt = 0
        clonedCbGenReceipt.totLocalAmt = 0
        clonedCbGenReceipt.totCtyAmt = 0
        clonedCbGenReceipt.gstAmt = 0
        clonedCbGenReceipt.gstLocalAmt = 0
        clonedCbGenReceipt.gstCtyAmt = 0
        clonedCbGenReceipt.totAmtAftGst = 0
        clonedCbGenReceipt.totLocalAmtAftGst = 0
        clonedCbGenReceipt.totCtyAmtAftGst = 0
      }

      setCbGenReceipt(clonedCbGenReceipt)
      form.reset(clonedCbGenReceipt)

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedCbGenReceipt.currencyId && clonedCbGenReceipt.accountDate) {
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
              formDetails as unknown as ICbGenReceiptDt[],
              exchangeRate,
              countryExchangeRate,
              decimals[0],
              !!visible?.m_CtyCurr
            )

            // Update form with recalculated details
            form.setValue(
              "data_details",
              updatedDetails as unknown as CbGenReceiptDtSchemaType[],
              { shouldDirty: true, shouldTouch: true }
            )

            // Recalculate header totals from updated details
            const totals = calculateTotalAmounts(
              updatedDetails as unknown as ICbGenReceiptDt[],
              amtDec
            )
            form.setValue("totAmt", totals.totAmt)
            form.setValue("gstAmt", totals.gstAmt)
            form.setValue("totAmtAftGst", totals.totAmtAftGst)

            const localAmounts = calculateLocalAmounts(
              updatedDetails as unknown as ICbGenReceiptDt[],
              locAmtDec
            )
            form.setValue("totLocalAmt", localAmounts.totLocalAmt)
            form.setValue("gstLocalAmt", localAmounts.gstLocalAmt)
            form.setValue("totLocalAmtAftGst", localAmounts.totLocalAmtAftGst)

            if (visible?.m_CtyCurr) {
              const countryAmounts = calculateCtyAmounts(
                updatedDetails as unknown as ICbGenReceiptDt[],
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

      toast.success("CbGenReceipt cloned successfully")
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
  const handleCbGenReceiptDelete = async (cancelRemarks: string) => {
    if (!cbGenReceipt) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("CbGenReceipt ID:", cbGenReceipt.receiptId)
      console.log("CbGenReceipt No:", cbGenReceipt.receiptNo)

      const response = await deleteMutation.mutateAsync({
        documentId: cbGenReceipt.receiptId?.toString() ?? "",
        documentNo: cbGenReceipt.receiptNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setCbGenReceipt(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultCbGenReceiptValues,
          data_details: [],
        })
        toast.success(
          `CbGenReceipt ${cbGenReceipt.receiptNo} deleted successfully`
        )
        // Data refresh handled by CbGenReceiptTable component
      } else {
        toast.error(response.message || "Failed to delete cbGenReceipt")
      }
    } catch {
      toast.error("Network error while deleting cbGenReceipt")
    }
  }

  // Handle Reset
  const handleCbGenReceiptReset = () => {
    setCbGenReceipt(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new cbGenReceipt)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCbGenReceiptValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("CbGenReceipt reset successfully")
  }

  // Handle Print CbGenReceipt Report
  const handlePrintCbGenReceipt = (
    reportType: "direct" | "cbGenReceipt" = "cbGenReceipt"
  ) => {
    if (!cbGenReceipt || cbGenReceipt.receiptId === "0") {
      toast.error("Please select an cbGenReceipt to print")
      return
    }

    const formValues = form.getValues()
    const receiptId =
      formValues.receiptId || cbGenReceipt.receiptId?.toString() || "0"
    const receiptNo = formValues.receiptNo || cbGenReceipt.receiptNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: receiptId,
      invoiceNo: receiptNo,
      reportType: reportType === "direct" ? 1 : 2,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Determine report file based on type
    const reportFile = "cb/CbGenReceipt.trdp"

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

  // Helper function to transform ICbGenReceiptHd to CbGenReceiptHdSchemaType
  const transformToSchemaType = useCallback(
    (apiCbGenReceipt: ICbGenReceiptHd): CbGenReceiptHdSchemaType => {
      return {
        receiptId: apiCbGenReceipt.receiptId?.toString() ?? "0",
        receiptNo: apiCbGenReceipt.receiptNo ?? "",
        referenceNo: apiCbGenReceipt.referenceNo ?? "",

        trnDate: apiCbGenReceipt.trnDate
          ? format(
              parseDate(apiCbGenReceipt.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiCbGenReceipt.accountDate
          ? format(
              parseDate(apiCbGenReceipt.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        gstClaimDate: apiCbGenReceipt.gstClaimDate
          ? format(
              parseDate(apiCbGenReceipt.gstClaimDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        bankId: apiCbGenReceipt.bankId ?? 0,
        paymentTypeId: apiCbGenReceipt.paymentTypeId ?? 0,
        chequeNo: apiCbGenReceipt.chequeNo ?? "",
        chequeDate: apiCbGenReceipt.chequeDate ?? new Date(),
        bankChgAmt: apiCbGenReceipt.bankChgAmt ?? 0,
        bankChgLocalAmt: apiCbGenReceipt.bankChgLocalAmt ?? 0,
        currencyId: apiCbGenReceipt.currencyId ?? 0,
        exhRate: apiCbGenReceipt.exhRate ?? 0,
        ctyExhRate: apiCbGenReceipt.ctyExhRate ?? 0,

        totAmt: apiCbGenReceipt.totAmt ?? 0,
        totLocalAmt: apiCbGenReceipt.totLocalAmt ?? 0,
        totCtyAmt: apiCbGenReceipt.totCtyAmt ?? 0,
        gstAmt: apiCbGenReceipt.gstAmt ?? 0,
        gstLocalAmt: apiCbGenReceipt.gstLocalAmt ?? 0,
        gstCtyAmt: apiCbGenReceipt.gstCtyAmt ?? 0,
        totAmtAftGst: apiCbGenReceipt.totAmtAftGst ?? 0,
        totLocalAmtAftGst: apiCbGenReceipt.totLocalAmtAftGst ?? 0,
        totCtyAmtAftGst: apiCbGenReceipt.totCtyAmtAftGst ?? 0,
        remarks: apiCbGenReceipt.remarks ?? "",
        payeeTo: apiCbGenReceipt.payeeTo ?? "",
        supplierRegNo: apiCbGenReceipt.supplierRegNo ?? "",
        moduleFrom: apiCbGenReceipt.moduleFrom ?? "",
        editVersion: apiCbGenReceipt.editVersion ?? 0,
        createBy: apiCbGenReceipt.createBy ?? "",
        editBy: apiCbGenReceipt.editBy ?? "",
        cancelBy: apiCbGenReceipt.cancelBy ?? "",
        createDate: apiCbGenReceipt.createDate
          ? format(
              parseDate(apiCbGenReceipt.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",

        editDate: apiCbGenReceipt.editDate
          ? format(
              parseDate(apiCbGenReceipt.editDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiCbGenReceipt.cancelDate
          ? format(
              parseDate(apiCbGenReceipt.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        isCancel: apiCbGenReceipt.isCancel ?? false,
        cancelRemarks: apiCbGenReceipt.cancelRemarks ?? "",
        appBy: apiCbGenReceipt.appBy ?? "",
        appDate: apiCbGenReceipt.appDate
          ? format(
              parseDate(apiCbGenReceipt.appDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        appStatusId: apiCbGenReceipt.appStatusId?.toString() ?? "",
        data_details:
          apiCbGenReceipt.data_details?.map(
            (detail) =>
              ({
                ...detail,
                receiptId: detail.receiptId?.toString() ?? "0",
                receiptNo: detail.receiptNo ?? "",
                itemNo: detail.itemNo ?? 0,
                seqNo: detail.seqNo ?? 0,
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
              }) as unknown as CbGenReceiptDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadCbGenReceipt = useCallback(
    async ({
      receiptId,
      receiptNo,
      showLoader = false,
    }: {
      receiptId?: string | number | null
      receiptNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("receiptId", receiptId)
      console.log("receiptNo", receiptNo)
      const trimmedCbGenReceiptNo = receiptNo?.trim() ?? ""
      const trimmedGLreceiptId =
        typeof receiptId === "number"
          ? receiptId.toString()
          : (receiptId?.toString().trim() ?? "")

      if (!trimmedCbGenReceiptNo && !trimmedGLreceiptId) return null

      if (showLoader) {
        setIsLoadingCbGenReceipt(true)
      }

      const requestGLreceiptId = trimmedGLreceiptId || "0"
      const requestCbGenReceiptNo = trimmedCbGenReceiptNo || ""

      try {
        const response = await getById(
          `${CbGenReceipt.getByIdNo}/${requestGLreceiptId}/${requestCbGenReceiptNo}`
        )

        if (response?.result === 1) {
          const detailedCbGenReceipt = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedCbGenReceipt) {
            const parsed = parseDate(detailedCbGenReceipt.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedCbGenReceipt.accountDate as string)
            )

            const updatedCbGenReceipt =
              transformToSchemaType(detailedCbGenReceipt)

            setCbGenReceipt(updatedCbGenReceipt)
            form.reset(updatedCbGenReceipt)
            form.trigger()

            const resolvedCbGenReceiptNo =
              updatedCbGenReceipt.receiptNo ||
              trimmedCbGenReceiptNo ||
              trimmedGLreceiptId
            setSearchNo(resolvedCbGenReceiptNo)

            return resolvedCbGenReceiptNo
          }
        } else {
          toast.error(
            response?.message || "Failed to fetch cbgenreceipt details"
          )
        }
      } catch (error) {
        console.error("Error fetching cbgenreceipt details:", error)
        toast.error("Error loading cbgenreceipt. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingCbGenReceipt(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setCbGenReceipt,
      setIsLoadingCbGenReceipt,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleCbGenReceiptSelect = async (
    selectedCbGenReceipt: ICbGenReceiptHd | undefined
  ) => {
    if (!selectedCbGenReceipt) return

    const loadedCbGenReceiptNo = await loadCbGenReceipt({
      receiptId: selectedCbGenReceipt.receiptId ?? "0",
      receiptNo: selectedCbGenReceipt.receiptNo ?? "",
    })

    if (loadedCbGenReceiptNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchCbGenReceipts from handleFilterChange
  const handleFilterChange = (newFilters: ICbGenReceiptFilter) => {
    setFilters(newFilters)
    // Data refresh handled by CbGenReceiptTable component
  }

  // Data refresh handled by CbGenReceiptTable component

  // Set createBy and createDate for new invoices on page load/refresh
  useEffect(() => {
    if (!cbGenReceipt && user && decimals.length > 0) {
      const currentGLreceiptId = form.getValues("receiptId")
      const currentCbGenReceiptNo = form.getValues("receiptNo")
      const isNewCbGenReceipt =
        !currentGLreceiptId ||
        currentGLreceiptId === "0" ||
        !currentCbGenReceiptNo

      if (isNewCbGenReceipt) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [cbGenReceipt, user, decimals, form])

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

  const handleCbGenReceiptSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedCbGenReceiptNo = await loadCbGenReceipt({
        receiptId: "0",
        receiptNo: trimmedValue,
        showLoader: true,
      })

      if (loadedCbGenReceiptNo) {
        toast.success(
          `CbGenReceipt ${loadedCbGenReceiptNo} loaded successfully`
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
      await loadCbGenReceipt({
        receiptId: trimmedId,
        receiptNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadCbGenReceipt, pendingDocId])

  // Determine mode and cbGenReceipt ID from URL
  const receiptNo = form.getValues("receiptNo")
  const isEdit = Boolean(receiptNo)
  const isCancelled = cbGenReceipt?.isCancel === true

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

  // Handle double-click to copy receiptNo to clipboard
  const handleCopyCbGenReceiptNo = useCallback(async () => {
    const receiptNoToCopy = isEdit
      ? cbGenReceipt?.receiptNo || form.getValues("receiptNo") || ""
      : form.getValues("receiptNo") || ""

    await copyToClipboard(receiptNoToCopy)
  }, [isEdit, cbGenReceipt?.receiptNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `CbGenReceipt (Edit)- v[${cbGenReceipt?.editVersion}] - ${receiptNo}`
    : "CbGenReceipt (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading cbGenReceipt form...
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
                {cbGenReceipt?.cancelRemarks && (
                  <div className="max-w-[160px] truncate text-xs text-red-600 sm:max-w-[220px]">
                    {cbGenReceipt.cancelRemarks}
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
                  onDoubleClick={handleCopyCbGenReceiptNo}
                  title="Double-click to copy cbGenReceipt number"
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
                  if (cbGenReceipt?.receiptNo) {
                    setSearchNo(cbGenReceipt.receiptNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingCbGenReceipt}
                className="h-4 w-4 p-0"
                title="Refresh cbGenReceipt data"
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
                placeholder="Search CbGenReceipt No"
                className="h-7 cursor-pointer text-xs"
                readOnly={
                  !!cbGenReceipt?.receiptId && cbGenReceipt.receiptId !== "0"
                }
                disabled={
                  !!cbGenReceipt?.receiptId && cbGenReceipt.receiptId !== "0"
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
              onClick={() => handlePrintCbGenReceipt("cbGenReceipt")}
              disabled={!cbGenReceipt || cbGenReceipt.receiptId === "0"}
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
                !cbGenReceipt || cbGenReceipt.receiptId === "0" || isCancelled
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
                !cbGenReceipt ||
                cbGenReceipt.receiptId === "0" ||
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
              handleSaveCbGenReceipt()
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
              CbGenReceipt List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing CbGenReceipts from the list below. Use
              search to filter records or create new invoices.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <CbGenReceiptTable
              onCbGenReceiptSelect={handleCbGenReceiptSelect}
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
        onConfirm={handleSaveCbGenReceipt}
        itemName={cbGenReceipt?.receiptNo || "New CbGenReceipt"}
        operationType={
          cbGenReceipt?.receiptId && cbGenReceipt.receiptId !== "0"
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
        itemName={cbGenReceipt?.receiptNo}
        title="Delete CbGenReceipt"
        description="Are you sure you want to delete this cbGenReceipt? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleCbGenReceiptDelete}
        itemName={cbGenReceipt?.receiptNo}
        title="Cancel CbGenReceipt"
        description="Please provide a reason for cancelling this cbGenReceipt."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleCbGenReceiptSearch(searchNo)}
        code={searchNo}
        typeLabel="CbGenReceipt"
        showDetails={false}
        description={`Do you want to load CbGenReceipt ${searchNo}?`}
        isLoading={isLoadingCbGenReceipt}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleCbGenReceiptReset}
        itemName={cbGenReceipt?.receiptNo}
        title="New CbGenReceipt"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneCbGenReceipt}
        itemName={cbGenReceipt?.receiptNo}
        title="Clone CbGenReceipt"
        description="This will create a copy as a new cbGenReceipt."
      />
    </>
  )
}
