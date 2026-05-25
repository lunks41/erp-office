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
} from "@/helpers/ap-invoice-calculations"
import { ApiResponse } from "@/interfaces/auth"
import { IApInvoiceDt, IApInvoiceFilter, IApInvoiceHd } from "@/interfaces"
import { IPaymentHistoryDetails } from "@/interfaces/history"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  ApInvoiceDtSchemaType,
  ApInvoiceHdSchema,
  ApInvoiceHdSchemaType,
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
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getById } from "@/lib/api-client"
import { ApInvoice, BasicSetting } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { APTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import { useGetRequiredFields, useGetVisibleFields } from "@/hooks/use-lookup"
import { useGetPaymentDetails } from "@/hooks/use-histoy"
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

//import { Table } from "@/components/ui/table"

import History from "./components/history"
import { getDefaultValues } from "./components/invoice-defaultvalues"
import type { InvoiceDetailsFormRef } from "./components/invoice-details-form"
import InvoiceTable from "./components/invoice-table"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function InvoicePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.ap
  const transactionId = APTransactionId.invoice

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
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [invoice, setInvoice] = useState<ApInvoiceHdSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")
  const detailsFormRef = useRef<InvoiceDetailsFormRef | null>(null)

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/ap/invoice`,
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

  const [filters, setFilters] = useState<IApInvoiceFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "invoiceNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultInvoiceValues = useMemo(
    () => getDefaultValues(dateFormat).defaultInvoice,
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
  const form = useForm<ApInvoiceHdSchemaType>({
    resolver: zodResolver(ApInvoiceHdSchema(required, visible)),
    defaultValues: invoice
      ? {
          invoiceId: invoice.invoiceId?.toString() ?? "0",
          invoiceNo: invoice.invoiceNo ?? "",
          referenceNo: invoice.referenceNo ?? "",
          suppInvoiceNo: invoice.suppInvoiceNo ?? "",
          trnDate: invoice.trnDate ?? new Date(),
          accountDate: invoice.accountDate ?? new Date(),
          dueDate: invoice.dueDate ?? new Date(),
          deliveryDate: invoice.deliveryDate ?? new Date(),
          gstClaimDate: invoice.gstClaimDate ?? new Date(),
          supplierId: invoice.supplierId ?? 0,
          currencyId: invoice.currencyId ?? 0,
          exhRate: invoice.exhRate ?? 0,
          ctyExhRate: invoice.ctyExhRate ?? 0,
          creditTermId: invoice.creditTermId ?? 0,
          bankId: invoice.bankId ?? 0,
          totAmt: invoice.totAmt ?? 0,
          totLocalAmt: invoice.totLocalAmt ?? 0,
          totCtyAmt: invoice.totCtyAmt ?? 0,
          gstAmt: invoice.gstAmt ?? 0,
          gstLocalAmt: invoice.gstLocalAmt ?? 0,
          gstCtyAmt: invoice.gstCtyAmt ?? 0,
          totAmtAftGst: invoice.totAmtAftGst ?? 0,
          totLocalAmtAftGst: invoice.totLocalAmtAftGst ?? 0,
          totCtyAmtAftGst: invoice.totCtyAmtAftGst ?? 0,
          balAmt: invoice.balAmt ?? 0,
          balLocalAmt: invoice.balLocalAmt ?? 0,
          payAmt: invoice.payAmt ?? 0,
          payLocalAmt: invoice.payLocalAmt ?? 0,
          exGainLoss: invoice.exGainLoss ?? 0,
          operationId: invoice.operationId ?? 0,
          operationNo: invoice.operationNo ?? "",
          remarks: invoice.remarks ?? "",
          address1: invoice.address1 ?? "",
          address2: invoice.address2 ?? "",
          address3: invoice.address3 ?? "",
          address4: invoice.address4 ?? "",
          pinCode: invoice.pinCode ?? "",
          countryId: invoice.countryId ?? 0,
          phoneNo: invoice.phoneNo ?? "",
          faxNo: invoice.faxNo ?? "",
          contactName: invoice.contactName ?? "",
          mobileNo: invoice.mobileNo ?? "",
          emailAdd: invoice.emailAdd ?? "",
          moduleFrom: invoice.moduleFrom ?? "",
          customerName: invoice.customerName ?? "",
          addressId: invoice.addressId ?? 0,
          contactId: invoice.contactId ?? 0,
          arInvoiceId: invoice.arInvoiceId ?? "",
          arInvoiceNo: invoice.arInvoiceNo ?? "",
          editVersion: invoice.editVersion ?? 0,
          purchaseOrderId: invoice.purchaseOrderId ?? 0,
          purchaseOrderNo: invoice.purchaseOrderNo ?? "",

          serviceCategoryId: invoice.serviceCategoryId ?? 0,

          data_details:
            invoice.data_details?.map((detail) => ({
              ...detail,
              invoiceId: detail.invoiceId?.toString() ?? "0",
              invoiceNo: detail.invoiceNo?.toString() ?? "",
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
              custInvoiceNo: detail.custInvoiceNo ?? "",
              arInvoiceId: detail.arInvoiceId ?? "0",
              arInvoiceNo: detail.arInvoiceNo ?? "",
              editVersion: detail.editVersion ?? 0,
            })) || [],
        }
      : (() => {
          // For new invoice, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultInvoiceValues,
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

    const currentInvoiceId = form.getValues("invoiceId") || "0"
    if (
      (invoice && invoice.invoiceId && invoice.invoiceId !== "0") ||
      currentInvoiceId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultInvoiceValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [dateFormat, defaultInvoiceValues, decimals, form, invoice, isDirty, user])

  // Mutations
  const saveMutation = usePersist<ApInvoiceHdSchemaType>(`${ApInvoice.add}`)
  const updateMutation = usePersist<ApInvoiceHdSchemaType>(`${ApInvoice.add}`)
  const deleteMutation = useDeleteWithRemarks(`${ApInvoice.delete}`)

  // Remove the useGetInvoiceById hook for selection
  // const { data: invoiceByIdData, refetch: refetchInvoiceById } = ...

  // Handle Save
  const handleSaveInvoice = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as IApInvoiceHd
      )

      // Validate the form data using the schema
      const validationResult = ApInvoiceHdSchema(required, visible).safeParse(
        formValues
      )

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
          const fieldPath = pathKey as keyof ApInvoiceHdSchemaType
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
      const headerGst = Number(formValues.gstAmt)
      const headerGstNonZero =
        Number.isFinite(headerGst) && headerGst !== 0
      if (headerGstNonZero && !(formValues.serviceCategoryId ?? 0)) {
        form.setError("serviceCategoryId", {
          type: "validation",
          message: "Service Category is required when VAT amount is non-zero",
        })
        toast.error("Service Category is required when VAT amount is non-zero")
        return
      }

      console.log("handleSaveInvoice formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.invoiceId) === 0
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
          Number(formValues.invoiceId) === 0
            ? await saveMutation.mutateAsync(apiFormValues)
            : await updateMutation.mutateAsync(apiFormValues)

        if (response.result === 1) {
          const invoiceData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          // Transform API response back to form values
          if (invoiceData) {
            const updatedSchemaType = transformToSchemaType(
              invoiceData as unknown as IApInvoiceHd
            )

            setSearchNo(updatedSchemaType.invoiceNo || "")
            setInvoice(updatedSchemaType)
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

          // Check if this was a new invoice or update
          const wasNewInvoice = Number(formValues.invoiceId) === 0

          if (wasNewInvoice) {
            //toast.success(
            // `Invoice ${invoiceData?.invoiceNo || ""} saved successfully`
            //)
          } else {
            //toast.success("Invoice updated successfully")
          }

          // Data refresh handled by InvoiceTable component
        } else {
          toast.error(response.message || "Failed to save invoice")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving invoice")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneInvoice = async () => {
    if (invoice) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedInvoice: ApInvoiceHdSchemaType = {
        ...invoice,
        invoiceId: "0",
        invoiceNo: "",
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
        // Clear AP invoice link
        arInvoiceId: "0",
        arInvoiceNo: "",
        // Keep data details - do not remove
        data_details:
          invoice.data_details?.map((detail) => ({
            ...detail,
            invoiceId: "0",
            invoiceNo: "",
            arInvoiceId: "0",
            arInvoiceNo: "",
            editVersion: 0,
          })) || [],
      }

      // Calculate totals from details with proper rounding
      const amtDec = decimals[0]?.amtDec || 2
      const locAmtDec = decimals[0]?.locAmtDec || 2
      const ctyAmtDec = decimals[0]?.ctyAmtDec || 2

      const details = clonedInvoice.data_details || []
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

        clonedInvoice.totAmt = mathRound(totAmt, amtDec)
        clonedInvoice.gstAmt = mathRound(gstAmt, amtDec)
        clonedInvoice.totAmtAftGst = mathRound(totAmt + gstAmt, amtDec)
        clonedInvoice.totLocalAmt = mathRound(totLocalAmt, locAmtDec)
        clonedInvoice.gstLocalAmt = mathRound(gstLocalAmt, locAmtDec)
        clonedInvoice.totLocalAmtAftGst = mathRound(
          totLocalAmt + gstLocalAmt,
          locAmtDec
        )
        clonedInvoice.totCtyAmt = mathRound(totCtyAmt, ctyAmtDec)
        clonedInvoice.gstCtyAmt = mathRound(gstCtyAmt, ctyAmtDec)
        clonedInvoice.totCtyAmtAftGst = mathRound(
          totCtyAmt + gstCtyAmt,
          ctyAmtDec
        )
      } else {
        // Reset amounts if no details
        clonedInvoice.totAmt = 0
        clonedInvoice.totLocalAmt = 0
        clonedInvoice.totCtyAmt = 0
        clonedInvoice.gstAmt = 0
        clonedInvoice.gstLocalAmt = 0
        clonedInvoice.gstCtyAmt = 0
        clonedInvoice.totAmtAftGst = 0
        clonedInvoice.totLocalAmtAftGst = 0
        clonedInvoice.totCtyAmtAftGst = 0
      }

      setInvoice(clonedInvoice)
      form.reset(clonedInvoice)

      // Get exchange rate decimal places
      const exhRateDec = decimals[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedInvoice.currencyId && clonedInvoice.accountDate) {
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
              formDetails as unknown as IApInvoiceDt[],
              exchangeRate,
              countryExchangeRate,
              decimals[0],
              !!visible?.m_CtyCurr
            )

            // Update form with recalculated details
            form.setValue(
              "data_details",
              updatedDetails as unknown as ApInvoiceDtSchemaType[],
              { shouldDirty: true, shouldTouch: true }
            )

            // Recalculate header totals from updated details
            const totals = calculateTotalAmounts(
              updatedDetails as unknown as IApInvoiceDt[],
              amtDec
            )
            form.setValue("totAmt", totals.totAmt)
            form.setValue("gstAmt", totals.gstAmt)
            form.setValue("totAmtAftGst", totals.totAmtAftGst)

            const localAmounts = calculateLocalAmounts(
              updatedDetails as unknown as IApInvoiceDt[],
              locAmtDec
            )
            form.setValue("totLocalAmt", localAmounts.totLocalAmt)
            form.setValue("gstLocalAmt", localAmounts.gstLocalAmt)
            form.setValue("totLocalAmtAftGst", localAmounts.totLocalAmtAftGst)

            if (visible?.m_CtyCurr) {
              const countryAmounts = calculateCtyAmounts(
                updatedDetails as unknown as IApInvoiceDt[],
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
      if (clonedInvoice.creditTermId && clonedInvoice.accountDate) {
        try {
          await setDueDate(form)
        } catch (error) {
          console.error("Error calculating due date:", error)
        }
      }

      // Clear search input
      setSearchNo("")

      toast.success("Invoice cloned successfully")
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
  const handleInvoiceDelete = async (cancelRemarks: string) => {
    if (!invoice) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("Invoice ID:", invoice.invoiceId)
      console.log("Invoice No:", invoice.invoiceNo)

      const response = await deleteMutation.mutateAsync({
        documentId: invoice.invoiceId?.toString() ?? "",
        documentNo: invoice.invoiceNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setInvoice(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultInvoiceValues,
          data_details: [],
        })
        detailsFormRef.current?.resetForm()
        toast.success(`Invoice ${invoice.invoiceNo} deleted successfully`)
        // Data refresh handled by InvoiceTable component
      } else {
        toast.error(response.message || "Failed to delete invoice")
      }
    } catch {
      toast.error("Network error while deleting invoice")
    }
  }

  // Handle Reset
  const handleInvoiceReset = () => {
    setInvoice(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new invoice)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultInvoiceValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    detailsFormRef.current?.resetForm()
    toast.success("Invoice reset successfully")
  }

  // Helper function to transform IApInvoiceHd to ApInvoiceHdSchemaType
  const transformToSchemaType = useCallback(
    (apiInvoice: IApInvoiceHd): ApInvoiceHdSchemaType => {
      return {
        invoiceId: apiInvoice.invoiceId?.toString() ?? "0",
        invoiceNo: apiInvoice.invoiceNo ?? "",
        referenceNo: apiInvoice.referenceNo ?? "",
        suppInvoiceNo: apiInvoice.suppInvoiceNo ?? "",
        trnDate: apiInvoice.trnDate
          ? format(
              parseDate(apiInvoice.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiInvoice.accountDate
          ? format(
              parseDate(apiInvoice.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        dueDate: apiInvoice.dueDate
          ? format(
              parseDate(apiInvoice.dueDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        deliveryDate: apiInvoice.deliveryDate
          ? format(
              parseDate(apiInvoice.deliveryDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        gstClaimDate: apiInvoice.gstClaimDate
          ? format(
              parseDate(apiInvoice.gstClaimDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        supplierId: apiInvoice.supplierId ?? 0,
        currencyId: apiInvoice.currencyId ?? 0,
        exhRate: apiInvoice.exhRate ?? 0,
        ctyExhRate: apiInvoice.ctyExhRate ?? 0,
        creditTermId: apiInvoice.creditTermId ?? 0,
        bankId: apiInvoice.bankId ?? 0,

        totAmt: apiInvoice.totAmt ?? 0,
        totLocalAmt: apiInvoice.totLocalAmt ?? 0,
        totCtyAmt: apiInvoice.totCtyAmt ?? 0,
        gstAmt: apiInvoice.gstAmt ?? 0,
        gstLocalAmt: apiInvoice.gstLocalAmt ?? 0,
        gstCtyAmt: apiInvoice.gstCtyAmt ?? 0,
        totAmtAftGst: apiInvoice.totAmtAftGst ?? 0,
        totLocalAmtAftGst: apiInvoice.totLocalAmtAftGst ?? 0,
        totCtyAmtAftGst: apiInvoice.totCtyAmtAftGst ?? 0,
        balAmt: apiInvoice.balAmt ?? 0,
        balLocalAmt: apiInvoice.balLocalAmt ?? 0,
        payAmt: apiInvoice.payAmt ?? 0,
        payLocalAmt: apiInvoice.payLocalAmt ?? 0,
        exGainLoss: apiInvoice.exGainLoss ?? 0,
        operationId: apiInvoice.operationId ?? 0,
        operationNo: apiInvoice.operationNo ?? "",
        remarks: apiInvoice.remarks ?? "",
        addressId: apiInvoice.addressId ?? 0, // Not available in IApInvoiceHd
        contactId: apiInvoice.contactId ?? 0, // Not available in IApInvoiceHd
        address1: apiInvoice.address1 ?? "",
        address2: apiInvoice.address2 ?? "",
        address3: apiInvoice.address3 ?? "",
        address4: apiInvoice.address4 ?? "",
        pinCode: apiInvoice.pinCode ?? "",
        countryId: apiInvoice.countryId ?? 0,
        phoneNo: apiInvoice.phoneNo ?? "",
        faxNo: apiInvoice.faxNo ?? "",
        contactName: apiInvoice.contactName ?? "",
        mobileNo: apiInvoice.mobileNo ?? "",
        emailAdd: apiInvoice.emailAdd ?? "",
        moduleFrom: apiInvoice.moduleFrom ?? "",
        customerName: apiInvoice.customerName ?? "",
        arInvoiceId: apiInvoice.arInvoiceId ?? "",
        arInvoiceNo: apiInvoice.arInvoiceNo ?? "",
        editVersion: apiInvoice.editVersion ?? 0,
        purchaseOrderId: apiInvoice.purchaseOrderId ?? 0,
        purchaseOrderNo: apiInvoice.purchaseOrderNo ?? "",
        serviceCategoryId: apiInvoice.serviceCategoryId ?? 0,
        createBy: apiInvoice.createBy ?? "",
        editBy: apiInvoice.editBy ?? "",
        cancelBy: apiInvoice.cancelBy ?? "",
        createDate: apiInvoice.createDate
          ? format(
              parseDate(apiInvoice.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",

        editDate: apiInvoice.editDate
          ? format(
              parseDate(apiInvoice.editDate as unknown as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiInvoice.cancelDate
          ? format(
              parseDate(apiInvoice.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        isCancel: apiInvoice.isCancel ?? false,
        cancelRemarks: apiInvoice.cancelRemarks ?? "",
        data_details:
          apiInvoice.data_details?.map(
            (detail) =>
              ({
                ...detail,
                invoiceId: detail.invoiceId?.toString() ?? "0",
                invoiceNo: detail.invoiceNo ?? "",
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
                custInvoiceNo: detail.custInvoiceNo ?? "",
                arInvoiceId: detail.arInvoiceId ?? "",
                arInvoiceNo: detail.arInvoiceNo ?? "",
                editVersion: detail.editVersion ?? 0,
              }) as unknown as ApInvoiceDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadInvoice = useCallback(
    async ({
      invoiceId,
      invoiceNo,
      showLoader = false,
    }: {
      invoiceId?: string | number | null
      invoiceNo?: string | null
      showLoader?: boolean
    }) => {
      console.log("invoiceId", invoiceId)
      console.log("invoiceNo", invoiceNo)
      const trimmedInvoiceNo = invoiceNo?.trim() ?? ""
      const trimmedInvoiceId =
        typeof invoiceId === "number"
          ? invoiceId.toString()
          : (invoiceId?.toString().trim() ?? "")

      if (!trimmedInvoiceNo && !trimmedInvoiceId) return null

      if (showLoader) {
        setIsLoadingInvoice(true)
      }

      const requestInvoiceId = trimmedInvoiceId || "0"
      const requestInvoiceNo = trimmedInvoiceNo || ""

      try {
        const response = await getById(
          `${ApInvoice.getByIdNo}/${requestInvoiceId}/${requestInvoiceNo}`
        )

        if (response?.result === 1) {
          const detailedInvoice = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedInvoice) {
            const parsed = parseDate(detailedInvoice.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedInvoice.accountDate as string)
            )

            const updatedInvoice = transformToSchemaType(detailedInvoice)

            setInvoice(updatedInvoice)
            form.reset(updatedInvoice)
            form.trigger()

            const resolvedInvoiceNo =
              updatedInvoice.invoiceNo || trimmedInvoiceNo || trimmedInvoiceId
            setSearchNo(resolvedInvoiceNo)

            return resolvedInvoiceNo
          }
        } else {
          toast.error(response?.message || "Failed to fetch invoice details")
        }
      } catch (error) {
        console.error("Error fetching invoice details:", error)
        toast.error("Error loading invoice. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingInvoice(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setInvoice,
      setIsLoadingInvoice,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleInvoiceSelect = async (
    selectedInvoice: IApInvoiceHd | undefined
  ) => {
    if (!selectedInvoice) return

    const loadedInvoiceNo = await loadInvoice({
      invoiceId: selectedInvoice.invoiceId ?? "0",
      invoiceNo: selectedInvoice.invoiceNo ?? "",
    })

    if (loadedInvoiceNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchInvoices from handleFilterChange
  const handleFilterChange = (newFilters: IApInvoiceFilter) => {
    setFilters(newFilters)
    // Data refresh handled by InvoiceTable component
  }

  // Data refresh handled by InvoiceTable component

  // Set createBy and createDate for new invoices on page load/refresh
  useEffect(() => {
    if (!invoice && user && decimals.length > 0) {
      const currentInvoiceId = form.getValues("invoiceId")
      const currentInvoiceNo = form.getValues("invoiceNo")
      const isNewInvoice =
        !currentInvoiceId || currentInvoiceId === "0" || !currentInvoiceNo

      if (isNewInvoice) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [invoice, user, decimals, form])

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

  const handleInvoiceSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedInvoiceNo = await loadInvoice({
        invoiceId: "0",
        invoiceNo: trimmedValue,
        showLoader: true,
      })

      if (loadedInvoiceNo) {
        toast.success(`Invoice ${loadedInvoiceNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadInvoice({
        invoiceId: trimmedId,
        invoiceNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadInvoice, pendingDocId])

  // Determine mode and invoice ID from URL
  const invoiceNo = form.getValues("invoiceNo")
  const isEdit = Boolean(invoiceNo)
  const isCancelled = invoice?.isCancel === true

  // Check if document has history payment-details; if yes, lock update/delete/cancel
  const watchedInvoiceId = form.watch("invoiceId")
  const effectiveDocIdForHistory =
    watchedInvoiceId != null &&
    String(watchedInvoiceId).trim() !== "" &&
    String(watchedInvoiceId) !== "undefined"
      ? String(watchedInvoiceId).trim()
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

  // Handle double-click to copy invoiceNo to clipboard
  const handleCopyInvoiceNo = useCallback(async () => {
    const invoiceNoToCopy = isEdit
      ? invoice?.invoiceNo || form.getValues("invoiceNo") || ""
      : form.getValues("invoiceNo") || ""

    await copyToClipboard(invoiceNoToCopy)
  }, [isEdit, invoice?.invoiceNo, form, copyToClipboard])

  // Calculate payment status only if not cancelled
  const balAmt = invoice?.balAmt ?? 0
  const payAmt = invoice?.payAmt ?? 0

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
    ? `Invoice (Edit)- v[${invoice?.editVersion}] - ${invoiceNo}`
    : "Invoice (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading invoice form...</p>
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
              {invoice?.cancelRemarks && (
                <div className="max-w-[160px] truncate text-xs text-red-600 sm:max-w-[220px]">
                  {invoice.cancelRemarks}
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
                title="Double-click to copy invoice number"
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
                if (invoice?.invoiceNo) {
                  setSearchNo(invoice.invoiceNo)
                  setShowLoadConfirm(true)
                }
              }}
              disabled={isLoadingInvoice}
              className="h-4 w-4 p-0"
              title="Refresh invoice data"
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
              placeholder="Search Invoice No"
              className="h-7 cursor-pointer text-xs"
              readOnly={!!invoice?.invoiceId && invoice.invoiceId !== "0"}
              disabled={!!invoice?.invoiceId && invoice.invoiceId !== "0"}
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
            onClick={() => setShowResetConfirm(true)}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            New
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCloneConfirm(true)}
            disabled={!invoice || invoice.invoiceId === "0" || isCancelled}
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
              !invoice ||
              invoice.invoiceId === "0" ||
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
            handleSaveInvoice()
          }}
          isEdit={isEdit}
          visible={visible}
          required={required}
          companyId={Number(companyId)}
          isCancelled={isCancelled}
          detailsFormRef={detailsFormRef}
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
              Invoice List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing invoices from the list below. Use
              search to filter records or create new invoices.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <InvoiceTable
              onInvoiceSelect={handleInvoiceSelect}
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
        onConfirm={handleSaveInvoice}
        itemName={invoice?.invoiceNo || "New Invoice"}
        operationType={
          invoice?.invoiceId && invoice.invoiceId !== "0" ? "update" : "create"
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
        itemName={invoice?.invoiceNo}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleInvoiceDelete}
        itemName={invoice?.invoiceNo}
        title="Cancel Invoice"
        description="Please provide a reason for cancelling this invoice."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleInvoiceSearch(searchNo)}
        code={searchNo}
        typeLabel="Invoice"
        showDetails={false}
        description={`Do you want to load Invoice ${searchNo}?`}
        isLoading={isLoadingInvoice}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleInvoiceReset}
        itemName={invoice?.invoiceNo}
        title="New Invoice"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneInvoice}
        itemName={invoice?.invoiceNo}
        title="Clone Invoice"
        description="This will create a copy as a new invoice."
      />
    </>
  )
}
