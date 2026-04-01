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
} from "@/helpers/cb-genpayment-calculations"
import {
  ICbGenPaymentDt,
  ICbGenPaymentFilter,
  ICbGenPaymentHd,
} from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  CbGenPaymentDtSchemaType,
  CbGenPaymentHdSchema,
  CbGenPaymentHdSchemaType,
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
import { BasicSetting, CbGenPayment } from "@/lib/api-routes"
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

import { getDefaultValues } from "./components/cbgenpayment-defaultvalues"
import CbGenPaymentTable from "./components/cbgenpayment-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function CbGenPaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbgenpayment

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
  const [isLoadingCbGenPayment, setIsLoadingCbGenPayment] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [cbGenPayment, setCbGenPayment] =
    useState<CbGenPaymentHdSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/cb/cbgenpayment`,
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

  const [filters, setFilters] = useState<ICbGenPaymentFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "paymentNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultCbGenPaymentValues = useMemo(
    () => getDefaultValues(dateFormat).defaultCbGenPayment,
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
    () => CbGenPaymentHdSchema(required, visible, { chequePaymentTypeIds }),
    [required, visible, chequePaymentTypeIds]
  )

  // Add form state management
  const form = useForm<CbGenPaymentHdSchemaType>({
    resolver: zodResolver(paymentSchema),
    defaultValues: cbGenPayment
      ? {
          paymentId: cbGenPayment.paymentId?.toString() ?? "0",
          paymentNo: cbGenPayment.paymentNo ?? "",
          referenceNo: cbGenPayment.referenceNo ?? "",
          trnDate: cbGenPayment.trnDate ?? new Date(),
          accountDate: cbGenPayment.accountDate ?? new Date(),
          gstClaimDate: cbGenPayment.gstClaimDate ?? new Date(),
          currencyId: cbGenPayment.currencyId ?? 0,
          exhRate: cbGenPayment.exhRate ?? 0,
          ctyExhRate: cbGenPayment.ctyExhRate ?? 0,
          bankId: cbGenPayment.bankId ?? 0,
          paymentTypeId: cbGenPayment.paymentTypeId ?? 0,
          chequeNo: cbGenPayment.chequeNo ?? "",
          chequeDate: cbGenPayment.chequeDate ?? new Date(),
          bankChgAmt: cbGenPayment.bankChgAmt ?? 0,
          bankChgLocalAmt: cbGenPayment.bankChgLocalAmt ?? 0,
          totAmt: cbGenPayment.totAmt ?? 0,
          totLocalAmt: cbGenPayment.totLocalAmt ?? 0,
          totCtyAmt: cbGenPayment.totCtyAmt ?? 0,
          gstAmt: cbGenPayment.gstAmt ?? 0,
          gstLocalAmt: cbGenPayment.gstLocalAmt ?? 0,
          gstCtyAmt: cbGenPayment.gstCtyAmt ?? 0,
          totAmtAftGst: cbGenPayment.totAmtAftGst ?? 0,
          totLocalAmtAftGst: cbGenPayment.totLocalAmtAftGst ?? 0,
          totCtyAmtAftGst: cbGenPayment.totCtyAmtAftGst ?? 0,
          remarks: cbGenPayment.remarks ?? "",
          payeeTo: cbGenPayment.payeeTo ?? "",
          supplierRegNo: cbGenPayment.supplierRegNo ?? "",
          moduleFrom: cbGenPayment.moduleFrom ?? "",
          createDate: cbGenPayment.createDate ?? "",
          editDate: cbGenPayment.editDate ?? "",
          isCancel: cbGenPayment.isCancel ?? false,
          cancelDate: cbGenPayment.cancelDate ?? "",
          cancelRemarks: cbGenPayment.cancelRemarks ?? "",
          createBy: cbGenPayment.createBy ?? "",
          editBy: cbGenPayment.editBy ?? "",
          cancelBy: cbGenPayment.cancelBy ?? "",
          editVersion: cbGenPayment.editVersion ?? 0,
          appBy: cbGenPayment.appBy ?? "",
          appDate: cbGenPayment.appDate ?? "",
          appStatusId: cbGenPayment.appStatusId ?? "",
          serviceCategoryId: cbGenPayment.serviceCategoryId ?? 0,
          serviceCategoryCode: cbGenPayment.serviceCategoryCode ?? "",
          serviceCategoryName: cbGenPayment.serviceCategoryName ?? "",
          data_details:
            cbGenPayment.data_details?.map((detail) => ({
              ...detail,
              paymentId: detail.paymentId?.toString() ?? "0",
              paymentNo: detail.paymentNo?.toString() ?? "",
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
          // For new cbGenPayment, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultCbGenPaymentValues,
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

    const currentGLpaymentId = form.getValues("paymentId") || "0"
    if (
      (cbGenPayment &&
        cbGenPayment.paymentId &&
        cbGenPayment.paymentId !== "0") ||
      currentGLpaymentId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCbGenPaymentValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [
    dateFormat,
    defaultCbGenPaymentValues,
    decimals,
    form,
    cbGenPayment,
    isDirty,
    user,
  ])

  // Mutations
  const saveMutation = usePersist<CbGenPaymentHdSchemaType>(
    `${CbGenPayment.add}`
  )
  const updateMutation = usePersist<CbGenPaymentHdSchemaType>(
    `${CbGenPayment.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${CbGenPayment.delete}`)

  // Remove the useGetCbGenPaymentById hook for selection
  // const { data: invoiceByIdData, refetch: refetchCbGenPaymentById } = ...

  // Handle Save
  const handleSaveCbGenPayment = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as ICbGenPaymentHd
      )

      // Validate the form data using the schema
      const validationResult = paymentSchema.safeParse(formValues)

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
          const fieldPath = pathKey as keyof CbGenPaymentHdSchemaType
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

      // If GST amount is non-zero, Service Category is mandatory
      if ((formValues.gstAmt ?? 0) !== 0 && !(formValues.serviceCategoryId ?? 0)) {
        form.setError("serviceCategoryId", {
          type: "validation",
          message: "Service Category is required when VAT amount is non-zero",
        })
        toast.error("Service Category is required when VAT amount is non-zero")
        return
      }

      console.log("handleSaveCbGenPayment formValues", formValues)

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
          Number(formValues.paymentId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const invoiceData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (invoiceData) {
            const updatedSchemaType = transformToSchemaType(
              invoiceData as unknown as ICbGenPaymentHd
            )

            setSearchNo(updatedSchemaType.paymentNo || "")
            setCbGenPayment(updatedSchemaType)
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

          // Check if this was a new cbGenPayment or update
          const wasNewCbGenPayment = Number(formValues.paymentId) === 0

          if (wasNewCbGenPayment) {
            //toast.success(
            // `CbGenPayment ${invoiceData?.paymentNo || ""} saved successfully`
            //)
          } else {
            //toast.success("CbGenPayment updated successfully")
          }

          // Data refresh handled by CbGenPaymentTable component
        } else {
          toast.error(response.message || "Failed to save cbGenPayment")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving cbGenPayment")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneCbGenPayment = async () => {
    if (cbGenPayment) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedCbGenPayment: CbGenPaymentHdSchemaType = {
        ...cbGenPayment,
        paymentId: "0",
        paymentNo: "",
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
        // Clear all balance and payment amounts
        data_details:
          cbGenPayment.data_details?.map((detail) => ({
            ...detail,
            paymentId: "0",
            paymentNo: "",
            editVersion: 0,
          })) || [],
      }

      // Calculate totals from details with proper rounding
      const amtDec = decimals[0]?.amtDec || 2
      const locAmtDec = decimals[0]?.locAmtDec || 2
      const ctyAmtDec = decimals[0]?.ctyAmtDec || 2

      const details = clonedCbGenPayment.data_details || []
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

        clonedCbGenPayment.totAmt = mathRound(totAmt, amtDec)
        clonedCbGenPayment.gstAmt = mathRound(gstAmt, amtDec)
        clonedCbGenPayment.totAmtAftGst = mathRound(totAmt + gstAmt, amtDec)
        clonedCbGenPayment.totLocalAmt = mathRound(totLocalAmt, locAmtDec)
        clonedCbGenPayment.gstLocalAmt = mathRound(gstLocalAmt, locAmtDec)
        clonedCbGenPayment.totLocalAmtAftGst = mathRound(
          totLocalAmt + gstLocalAmt,
          locAmtDec
        )
        clonedCbGenPayment.totCtyAmt = mathRound(totCtyAmt, ctyAmtDec)
        clonedCbGenPayment.gstCtyAmt = mathRound(gstCtyAmt, ctyAmtDec)
        clonedCbGenPayment.totCtyAmtAftGst = mathRound(
          totCtyAmt + gstCtyAmt,
          ctyAmtDec
        )
      } else {
        // Reset amounts if no details
        clonedCbGenPayment.totAmt = 0
        clonedCbGenPayment.totLocalAmt = 0
        clonedCbGenPayment.totCtyAmt = 0
        clonedCbGenPayment.gstAmt = 0
        clonedCbGenPayment.gstLocalAmt = 0
        clonedCbGenPayment.gstCtyAmt = 0
        clonedCbGenPayment.totAmtAftGst = 0
        clonedCbGenPayment.totLocalAmtAftGst = 0
        clonedCbGenPayment.totCtyAmtAftGst = 0
      }

      setCbGenPayment(clonedCbGenPayment)
      form.reset(clonedCbGenPayment)

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedCbGenPayment.currencyId && clonedCbGenPayment.accountDate) {
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
              formDetails as unknown as ICbGenPaymentDt[],
              exchangeRate,
              countryExchangeRate,
              decimals[0],
              !!visible?.m_CtyCurr
            )

            // Update form with recalculated details
            form.setValue(
              "data_details",
              updatedDetails as unknown as CbGenPaymentDtSchemaType[],
              { shouldDirty: true, shouldTouch: true }
            )

            // Recalculate header totals from updated details
            const totals = calculateTotalAmounts(
              updatedDetails as unknown as ICbGenPaymentDt[],
              amtDec
            )
            form.setValue("totAmt", totals.totAmt)
            form.setValue("gstAmt", totals.gstAmt)
            form.setValue("totAmtAftGst", totals.totAmtAftGst)

            const localAmounts = calculateLocalAmounts(
              updatedDetails as unknown as ICbGenPaymentDt[],
              locAmtDec
            )
            form.setValue("totLocalAmt", localAmounts.totLocalAmt)
            form.setValue("gstLocalAmt", localAmounts.gstLocalAmt)
            form.setValue("totLocalAmtAftGst", localAmounts.totLocalAmtAftGst)

            if (visible?.m_CtyCurr) {
              const countryAmounts = calculateCtyAmounts(
                updatedDetails as unknown as ICbGenPaymentDt[],
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

      toast.success("CbGenPayment cloned successfully")
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
  const handleCbGenPaymentDelete = async (cancelRemarks: string) => {
    if (!cbGenPayment) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("CbGenPayment ID:", cbGenPayment.paymentId)
      console.log("CbGenPayment No:", cbGenPayment.paymentNo)

      const response = await deleteMutation.mutateAsync({
        documentId: cbGenPayment.paymentId?.toString() ?? "",
        documentNo: cbGenPayment.paymentNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setCbGenPayment(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultCbGenPaymentValues,
          data_details: [],
        })
        toast.success(
          `CbGenPayment ${cbGenPayment.paymentNo} deleted successfully`
        )
        // Data refresh handled by CbGenPaymentTable component
      } else {
        toast.error(response.message || "Failed to delete cbGenPayment")
      }
    } catch {
      toast.error("Network error while deleting cbGenPayment")
    }
  }

  // Handle Reset
  const handleCbGenPaymentReset = () => {
    setCbGenPayment(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new cbGenPayment)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCbGenPaymentValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("CbGenPayment reset successfully")
  }

  // Handle Print CbGenPayment Report
  const handlePrintCbGenPayment = (
    reportType: "direct" | "cbGenPayment" = "cbGenPayment"
  ) => {
    if (!cbGenPayment || cbGenPayment.paymentId === "0") {
      toast.error("Please select an cbGenPayment to print")
      return
    }

    const formValues = form.getValues()
    const paymentId =
      formValues.paymentId || cbGenPayment.paymentId?.toString() || "0"
    const paymentNo = formValues.paymentNo || cbGenPayment.paymentNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: paymentId,
      invoiceNo: paymentNo,
      reportType: reportType === "direct" ? 1 : 2,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Determine report file based on type
    const reportFile = "cb/CbGenPayment.trdp"

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

  // Helper function to transform ICbGenPaymentHd to CbGenPaymentHdSchemaType
  const transformToSchemaType = useCallback(
    (apiCbGenPayment: ICbGenPaymentHd): CbGenPaymentHdSchemaType => {
      return {
        paymentId: apiCbGenPayment.paymentId?.toString() ?? "0",
        paymentNo: apiCbGenPayment.paymentNo ?? "",
        referenceNo: apiCbGenPayment.referenceNo ?? "",

        trnDate: apiCbGenPayment.trnDate
          ? format(
              parseDate(apiCbGenPayment.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiCbGenPayment.accountDate
          ? format(
              parseDate(apiCbGenPayment.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        gstClaimDate: apiCbGenPayment.gstClaimDate
          ? format(
              parseDate(apiCbGenPayment.gstClaimDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        bankId: apiCbGenPayment.bankId ?? 0,
        paymentTypeId: apiCbGenPayment.paymentTypeId ?? 0,
        chequeNo: apiCbGenPayment.chequeNo ?? "",
        chequeDate: apiCbGenPayment.chequeDate ?? new Date(),
        bankChgAmt: apiCbGenPayment.bankChgAmt ?? 0,
        bankChgLocalAmt: apiCbGenPayment.bankChgLocalAmt ?? 0,
        currencyId: apiCbGenPayment.currencyId ?? 0,
        exhRate: apiCbGenPayment.exhRate ?? 0,
        ctyExhRate: apiCbGenPayment.ctyExhRate ?? 0,

        totAmt: apiCbGenPayment.totAmt ?? 0,
        totLocalAmt: apiCbGenPayment.totLocalAmt ?? 0,
        totCtyAmt: apiCbGenPayment.totCtyAmt ?? 0,
        gstAmt: apiCbGenPayment.gstAmt ?? 0,
        gstLocalAmt: apiCbGenPayment.gstLocalAmt ?? 0,
        gstCtyAmt: apiCbGenPayment.gstCtyAmt ?? 0,
        totAmtAftGst: apiCbGenPayment.totAmtAftGst ?? 0,
        totLocalAmtAftGst: apiCbGenPayment.totLocalAmtAftGst ?? 0,
        totCtyAmtAftGst: apiCbGenPayment.totCtyAmtAftGst ?? 0,
        remarks: apiCbGenPayment.remarks ?? "",
        payeeTo: apiCbGenPayment.payeeTo ?? "",
        supplierRegNo: apiCbGenPayment.supplierRegNo ?? "",
        moduleFrom: apiCbGenPayment.moduleFrom ?? "",
        editVersion: apiCbGenPayment.editVersion ?? 0,
        createBy: apiCbGenPayment.createBy ?? "",
        editBy: apiCbGenPayment.editBy ?? "",
        cancelBy: apiCbGenPayment.cancelBy ?? "",
        createDate: apiCbGenPayment.createDate
          ? format(
              parseDate(apiCbGenPayment.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",

        editDate: apiCbGenPayment.editDate
          ? format(
              parseDate(apiCbGenPayment.editDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiCbGenPayment.cancelDate
          ? format(
              parseDate(apiCbGenPayment.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        isCancel: apiCbGenPayment.isCancel ?? false,
        cancelRemarks: apiCbGenPayment.cancelRemarks ?? "",
        appBy: apiCbGenPayment.appBy ?? "",
        appDate: apiCbGenPayment.appDate
          ? format(
              parseDate(apiCbGenPayment.appDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        appStatusId: apiCbGenPayment.appStatusId?.toString() ?? "",
        serviceCategoryId: apiCbGenPayment.serviceCategoryId ?? 0,
        serviceCategoryCode: apiCbGenPayment.serviceCategoryCode ?? "",
        serviceCategoryName: apiCbGenPayment.serviceCategoryName ?? "",
        data_details:
          apiCbGenPayment.data_details?.map(
            (detail) =>
              ({
                ...detail,
                paymentId: detail.paymentId?.toString() ?? "0",
                paymentNo: detail.paymentNo ?? "",
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
              }) as unknown as CbGenPaymentDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadCbGenPayment = useCallback(
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
      const trimmedCbGenPaymentNo = paymentNo?.trim() ?? ""
      const trimmedGLpaymentId =
        typeof paymentId === "number"
          ? paymentId.toString()
          : (paymentId?.toString().trim() ?? "")

      if (!trimmedCbGenPaymentNo && !trimmedGLpaymentId) return null

      if (showLoader) {
        setIsLoadingCbGenPayment(true)
      }

      const requestGLpaymentId = trimmedGLpaymentId || "0"
      const requestCbGenPaymentNo = trimmedCbGenPaymentNo || ""

      try {
        const response = await getById(
          `${CbGenPayment.getByIdNo}/${requestGLpaymentId}/${requestCbGenPaymentNo}`
        )

        if (response?.result === 1) {
          const detailedCbGenPayment = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedCbGenPayment) {
            const parsed = parseDate(detailedCbGenPayment.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedCbGenPayment.accountDate as string)
            )

            const updatedCbGenPayment =
              transformToSchemaType(detailedCbGenPayment)

            setCbGenPayment(updatedCbGenPayment)
            form.reset(updatedCbGenPayment)
            form.trigger()

            const resolvedCbGenPaymentNo =
              updatedCbGenPayment.paymentNo ||
              trimmedCbGenPaymentNo ||
              trimmedGLpaymentId
            setSearchNo(resolvedCbGenPaymentNo)

            return resolvedCbGenPaymentNo
          }
        } else {
          toast.error(
            response?.message || "Failed to fetch cbgenpayment details"
          )
        }
      } catch (error) {
        console.error("Error fetching cbgenpayment details:", error)
        toast.error("Error loading cbgenpayment. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingCbGenPayment(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setCbGenPayment,
      setIsLoadingCbGenPayment,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleCbGenPaymentSelect = async (
    selectedCbGenPayment: ICbGenPaymentHd | undefined
  ) => {
    if (!selectedCbGenPayment) return

    const loadedCbGenPaymentNo = await loadCbGenPayment({
      paymentId: selectedCbGenPayment.paymentId ?? "0",
      paymentNo: selectedCbGenPayment.paymentNo ?? "",
    })

    if (loadedCbGenPaymentNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchCbGenPayments from handleFilterChange
  const handleFilterChange = (newFilters: ICbGenPaymentFilter) => {
    setFilters(newFilters)
    // Data refresh handled by CbGenPaymentTable component
  }

  // Data refresh handled by CbGenPaymentTable component

  // Set createBy and createDate for new invoices on page load/refresh
  useEffect(() => {
    if (!cbGenPayment && user && decimals.length > 0) {
      const currentGLpaymentId = form.getValues("paymentId")
      const currentCbGenPaymentNo = form.getValues("paymentNo")
      const isNewCbGenPayment =
        !currentGLpaymentId ||
        currentGLpaymentId === "0" ||
        !currentCbGenPaymentNo

      if (isNewCbGenPayment) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [cbGenPayment, user, decimals, form])

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

  const handleCbGenPaymentSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedCbGenPaymentNo = await loadCbGenPayment({
        paymentId: "0",
        paymentNo: trimmedValue,
        showLoader: true,
      })

      if (loadedCbGenPaymentNo) {
        toast.success(
          `CbGenPayment ${loadedCbGenPaymentNo} loaded successfully`
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
      await loadCbGenPayment({
        paymentId: trimmedId,
        paymentNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadCbGenPayment, pendingDocId])

  // Determine mode and cbGenPayment ID from URL
  const paymentNo = form.getValues("paymentNo")
  const isEdit = Boolean(paymentNo)
  const isCancelled = cbGenPayment?.isCancel === true

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
  const handleCopyCbGenPaymentNo = useCallback(async () => {
    const paymentNoToCopy = isEdit
      ? cbGenPayment?.paymentNo || form.getValues("paymentNo") || ""
      : form.getValues("paymentNo") || ""

    await copyToClipboard(paymentNoToCopy)
  }, [isEdit, cbGenPayment?.paymentNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `CbGenPayment (Edit)- v[${cbGenPayment?.editVersion}] - ${paymentNo}`
    : "CbGenPayment (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading cbGenPayment form...
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
                {cbGenPayment?.cancelRemarks && (
                  <div className="max-w-[160px] truncate text-xs text-red-600 sm:max-w-[220px]">
                    {cbGenPayment.cancelRemarks}
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
                  onDoubleClick={handleCopyCbGenPaymentNo}
                  title="Double-click to copy cbGenPayment number"
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
                  if (cbGenPayment?.paymentNo) {
                    setSearchNo(cbGenPayment.paymentNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingCbGenPayment}
                className="h-4 w-4 p-0"
                title="Refresh cbGenPayment data"
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
                placeholder="Search CbGenPayment No"
                className="h-7 cursor-pointer text-xs"
                readOnly={
                  !!cbGenPayment?.paymentId && cbGenPayment.paymentId !== "0"
                }
                disabled={
                  !!cbGenPayment?.paymentId && cbGenPayment.paymentId !== "0"
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
              onClick={() => handlePrintCbGenPayment("cbGenPayment")}
              disabled={!cbGenPayment || cbGenPayment.paymentId === "0"}
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
                !cbGenPayment || cbGenPayment.paymentId === "0" || isCancelled
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
                !cbGenPayment ||
                cbGenPayment.paymentId === "0" ||
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
              handleSaveCbGenPayment()
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
              CbGenPayment List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing CbGenPayments from the list below. Use
              search to filter records or create new invoices.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <CbGenPaymentTable
              onCbGenPaymentSelect={handleCbGenPaymentSelect}
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
        onConfirm={handleSaveCbGenPayment}
        itemName={cbGenPayment?.paymentNo || "New CbGenPayment"}
        operationType={
          cbGenPayment?.paymentId && cbGenPayment.paymentId !== "0"
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
        itemName={cbGenPayment?.paymentNo}
        title="Delete CbGenPayment"
        description="Are you sure you want to delete this cbGenPayment? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleCbGenPaymentDelete}
        itemName={cbGenPayment?.paymentNo}
        title="Cancel CbGenPayment"
        description="Please provide a reason for cancelling this cbGenPayment."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleCbGenPaymentSearch(searchNo)}
        code={searchNo}
        typeLabel="CbGenPayment"
        showDetails={false}
        description={`Do you want to load CbGenPayment ${searchNo}?`}
        isLoading={isLoadingCbGenPayment}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleCbGenPaymentReset}
        itemName={cbGenPayment?.paymentNo}
        title="New CbGenPayment"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneCbGenPayment}
        itemName={cbGenPayment?.paymentNo}
        title="Clone CbGenPayment"
        description="This will create a copy as a new cbGenPayment."
      />
    </>
  )
}
