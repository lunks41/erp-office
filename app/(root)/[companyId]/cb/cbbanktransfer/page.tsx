"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ICbBankTransfer, ICbBankTransferFilter } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { CbBankTransferSchema, CbBankTransferSchemaType } from "@/schemas"
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
import { BasicSetting, CbBankTransfer } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { CBTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import {
  useGetRequiredFields,
  useGetVisibleFields,
  usePaymentTypeLookup,
} from "@/hooks/use-lookup"
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

import { getDefaultValues } from "./components/cbbanktransfer-defaultvalues"
import BankTransferTable from "./components/cbbanktransfer-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function BankTransferPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbanktransfer

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
  const [isLoadingBankTransfer, setIsLoadingBankTransfer] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [bankTransfer, setBankTransfer] =
    useState<CbBankTransferSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/cb/cbbanktransfer`,
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

  const [filters, setFilters] = useState<ICbBankTransferFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "transferNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

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
  const bankTransferSchema = useMemo(
    () => CbBankTransferSchema(required, visible, { chequePaymentTypeIds }),
    [required, visible, chequePaymentTypeIds]
  )

  const defaultBankTransferValues = useMemo(
    () => getDefaultValues(dateFormat).defaultBankTransfer,
    [dateFormat]
  )

  // Add form state management
  const form = useForm<CbBankTransferSchemaType>({
    resolver: zodResolver(bankTransferSchema),
    defaultValues: bankTransfer
      ? {
          transferId: bankTransfer.transferId?.toString() ?? "0",
          transferNo: bankTransfer.transferNo ?? "",
          referenceNo: bankTransfer.referenceNo ?? "",
          trnDate: bankTransfer.trnDate ?? new Date(),
          accountDate: bankTransfer.accountDate ?? new Date(),
          paymentTypeId: bankTransfer.paymentTypeId ?? 0,
          chequeNo: bankTransfer.chequeNo ?? "",
          chequeDate: bankTransfer.chequeDate ?? "",
          jobOrderId: bankTransfer.jobOrderId ?? 0,
          taskId: bankTransfer.taskId ?? 0,
          serviceItemNo: bankTransfer.serviceItemNo ?? 0,
          fromBankId: bankTransfer.fromBankId ?? 0,
          fromCurrencyId: bankTransfer.fromCurrencyId ?? 0,
          fromExhRate: bankTransfer.fromExhRate ?? 0,
          fromBankChgGLId: bankTransfer.fromBankChgGLId ?? 0,
          fromBankChgAmt: bankTransfer.fromBankChgAmt ?? 0,
          fromBankChgLocalAmt: bankTransfer.fromBankChgLocalAmt ?? 0,
          fromTotAmt: bankTransfer.fromTotAmt ?? 0,
          fromTotLocalAmt: bankTransfer.fromTotLocalAmt ?? 0,
          toBankId: bankTransfer.toBankId ?? 0,
          toCurrencyId: bankTransfer.toCurrencyId ?? 0,
          toExhRate: bankTransfer.toExhRate ?? 0,
          toBankChgGLId: bankTransfer.toBankChgGLId ?? 0,
          toBankChgAmt: bankTransfer.toBankChgAmt ?? 0,
          toBankChgLocalAmt: bankTransfer.toBankChgLocalAmt ?? 0,
          toTotAmt: bankTransfer.toTotAmt ?? 0,
          toTotLocalAmt: bankTransfer.toTotLocalAmt ?? 0,
          bankExhRate: bankTransfer.bankExhRate ?? 0,
          bankTotAmt: bankTransfer.bankTotAmt ?? 0,
          bankTotLocalAmt: bankTransfer.bankTotLocalAmt ?? 0,
          exhGainLoss: bankTransfer.exhGainLoss ?? 0,
          remarks: bankTransfer.remarks ?? "",
          payeeTo: bankTransfer.payeeTo ?? "",
          moduleFrom: bankTransfer.moduleFrom ?? "",
          editVersion: bankTransfer.editVersion ?? 0,
          isCancel: bankTransfer.isCancel ?? false,
          cancelBy: bankTransfer.cancelBy ?? "",
          cancelDate: bankTransfer.cancelDate ?? "",
          cancelRemarks: bankTransfer.cancelRemarks ?? "",
          isPost: bankTransfer.isPost ?? false,
          postBy: bankTransfer.postBy ?? "",
          postDate: bankTransfer.postDate ?? "",
          appStatusId: bankTransfer.appStatusId ?? null,
          appBy: bankTransfer.appBy ?? "",
          appDate: bankTransfer.appDate ?? "",
          createBy: bankTransfer.createBy ?? "",
          editBy: bankTransfer.editBy ?? "",
          createDate: bankTransfer.createDate ?? "",
          editDate: bankTransfer.editDate ?? "",
        }
      : (() => {
          // For new bankTransfer, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultBankTransferValues,
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
      (bankTransfer &&
        bankTransfer.transferId &&
        bankTransfer.transferId !== "0") ||
      currentTransferId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultBankTransferValues,
      createBy: userName,
      createDate: currentDateTime,
    })
  }, [
    dateFormat,
    defaultBankTransferValues,
    decimals,
    form,
    bankTransfer,
    isDirty,
    user,
  ])

  // Helper function to transform ICbBankTransfer to CbBankTransferSchemaType
  const transformToSchemaType = useCallback(
    (apiBankTransfer: ICbBankTransfer): CbBankTransferSchemaType => {
      return {
        transferId: apiBankTransfer.transferId?.toString() ?? "0",
        transferNo: apiBankTransfer.transferNo ?? "",
        referenceNo: apiBankTransfer.referenceNo ?? "",
        trnDate: apiBankTransfer.trnDate
          ? format(
              parseDate(apiBankTransfer.trnDate as string) || new Date(),
              dateFormat
            )
          : format(new Date(), dateFormat),
        accountDate: apiBankTransfer.accountDate
          ? format(
              parseDate(apiBankTransfer.accountDate as string) || new Date(),
              dateFormat
            )
          : format(new Date(), dateFormat),
        paymentTypeId: apiBankTransfer.paymentTypeId ?? 0,
        chequeNo: apiBankTransfer.chequeNo ?? "",
        chequeDate: apiBankTransfer.chequeDate
          ? format(
              parseDate(apiBankTransfer.chequeDate as string) || new Date(),
              dateFormat
            )
          : apiBankTransfer.accountDate
            ? format(
                parseDate(apiBankTransfer.accountDate as string) || new Date(),
                dateFormat
              )
            : format(new Date(), dateFormat),
        jobOrderId: apiBankTransfer.jobOrderId ?? 0,
        taskId: apiBankTransfer.taskId ?? 0,
        serviceItemNo: apiBankTransfer.serviceItemNo ?? 0,

        fromBankId: apiBankTransfer.fromBankId ?? 0,
        fromCurrencyId: apiBankTransfer.fromCurrencyId ?? 0,
        fromExhRate: apiBankTransfer.fromExhRate ?? 0,
        fromBankChgGLId: apiBankTransfer.fromBankChgGLId ?? 0,
        fromBankChgAmt: apiBankTransfer.fromBankChgAmt ?? 0,
        fromBankChgLocalAmt: apiBankTransfer.fromBankChgLocalAmt ?? 0,
        fromTotAmt: apiBankTransfer.fromTotAmt ?? 0,
        fromTotLocalAmt: apiBankTransfer.fromTotLocalAmt ?? 0,

        toBankId: apiBankTransfer.toBankId ?? 0,
        toCurrencyId: apiBankTransfer.toCurrencyId ?? 0,
        toExhRate: apiBankTransfer.toExhRate ?? 0,
        toBankChgGLId: apiBankTransfer.toBankChgGLId ?? 0,
        toBankChgAmt: apiBankTransfer.toBankChgAmt ?? 0,
        toBankChgLocalAmt: apiBankTransfer.toBankChgLocalAmt ?? 0,
        toTotAmt: apiBankTransfer.toTotAmt ?? 0,
        toTotLocalAmt: apiBankTransfer.toTotLocalAmt ?? 0,

        bankExhRate: apiBankTransfer.bankExhRate ?? 0,
        bankTotAmt: apiBankTransfer.bankTotAmt ?? 0,
        bankTotLocalAmt: apiBankTransfer.bankTotLocalAmt ?? 0,

        remarks: apiBankTransfer.remarks ?? "",
        payeeTo: apiBankTransfer.payeeTo ?? "",
        moduleFrom: apiBankTransfer.moduleFrom ?? "",
        exhGainLoss: apiBankTransfer.exhGainLoss ?? 0,
        editVersion: apiBankTransfer.editVersion ?? 0,
        createBy: apiBankTransfer.createBy ?? "",
        editBy: apiBankTransfer.editBy ?? "",
        cancelBy: apiBankTransfer.cancelBy ?? "",
        createDate: apiBankTransfer.createDate
          ? format(
              parseDate(apiBankTransfer.createDate as string) || new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        editDate: apiBankTransfer.editDate
          ? format(
              parseDate(apiBankTransfer.editDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelDate: apiBankTransfer.cancelDate
          ? format(
              parseDate(apiBankTransfer.cancelDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelRemarks: apiBankTransfer.cancelRemarks ?? "",
        isPost: apiBankTransfer.isPost ?? false,
        postDate: apiBankTransfer.postDate
          ? format(
              parseDate(apiBankTransfer.postDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        appStatusId: apiBankTransfer.appStatusId ?? null,
        appBy: apiBankTransfer.appBy ?? "",
        appDate: apiBankTransfer.appDate
          ? format(
              parseDate(apiBankTransfer.appDate as unknown as string) ||
                new Date(),
              decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        isCancel: apiBankTransfer.isCancel ?? false,
      }
    },
    [dateFormat, decimals]
  )

  const loadBankTransfer = useCallback(
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
        setIsLoadingBankTransfer(true)
      }

      const requestTransferId = trimmedTransferId || "0"
      const requestTransferNo = trimmedTransferNo || ""

      try {
        const response = await getById(
          `${CbBankTransfer.getByIdNo}/${requestTransferId}/${requestTransferNo}`
        )

        if (response?.result === 1) {
          const detailedBankTransfer = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedBankTransfer) {
            const parsed = parseDate(detailedBankTransfer.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedBankTransfer.accountDate as string)
            )

            const updatedBankTransfer =
              transformToSchemaType(detailedBankTransfer)

            setBankTransfer(updatedBankTransfer)
            form.reset(updatedBankTransfer)
            form.trigger()

            const resolvedTransferNo =
              updatedBankTransfer.transferNo ||
              trimmedTransferNo ||
              trimmedTransferId
            setSearchNo(resolvedTransferNo)

            return resolvedTransferNo
          }
        } else {
          toast.error(
            response?.message || "Failed to fetch bank transfer details"
          )
        }
      } catch (error) {
        console.error("Error fetching bank transfer details:", error)
        toast.error("Error loading bank transfer. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingBankTransfer(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setBankTransfer,
      setIsLoadingBankTransfer,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  // Mutations
  const saveMutation = usePersist<CbBankTransferSchemaType>(
    `${CbBankTransfer.add}`
  )
  const updateMutation = usePersist<CbBankTransferSchemaType>(
    `${CbBankTransfer.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${CbBankTransfer.delete}`)

  // Handle Save
  const handleSaveBankTransfer = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as ICbBankTransfer
      )

      // Set chequeDate to accountDate if it's empty
      if (!formValues.chequeDate || formValues.chequeDate === "") {
        formValues.chequeDate = formValues.accountDate
      }

      // Validate the form data using the schema
      const validationResult = bankTransferSchema.safeParse(formValues)

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          referenceNo: "Reference No",
          accountDate: "Account Date",
          fromBankId: "From Bank",
          toBankId: "To Bank",
          paymentTypeId: "Pay",
          chequeNo: "Pay No",
          fromTotAmt: "From Total Amount",
          toTotAmt: "To Total Amount",
          remarks: "Remarks",
        }
        const failedFields: string[] = []
        validationResult.error.issues.forEach((error) => {
          const pathKey = error.path.join(".")
          const fieldPath = pathKey as keyof CbBankTransferSchemaType
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

      // Check header from total amounts should not be zero
      if (formValues.fromTotAmt === 0 || formValues.fromTotLocalAmt === 0) {
        toast.warning(
          "From Total Amount and From Total Local Amount should not be zero"
        )
        return
      }

      // Check to total amounts should not be zero
      if (formValues.toTotAmt === 0 || formValues.toTotLocalAmt === 0) {
        toast.warning(
          "To Total Amount and To Total Local Amount should not be zero"
        )
        return
      }

      console.log("handleSaveBankTransfer formValues", formValues)

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = form.getValues("accountDate") as unknown as string
        const isNew = Number(formValues.transferId) === 0
        const prevAccountDate = isNew ? accountDate : previousAccountDate

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
            bankTransferData as unknown as ICbBankTransfer
          )

          setSearchNo(updatedSchemaType.transferNo || "")
          setBankTransfer(updatedSchemaType)
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

        // Data refresh handled by BankTransferTable component
      } else {
        toast.error(response.message || "Failed to save Bank Transfer")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving Bank Transfer")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneBankTransfer = () => {
    if (bankTransfer) {
      // Create a proper clone with form values
      const clonedBankTransfer: CbBankTransferSchemaType = {
        ...bankTransfer,
        transferId: "0",
        transferNo: "",
        // Reset amounts for new bankTransfer
        fromTotAmt: 0,
        fromTotLocalAmt: 0,
        toTotAmt: 0,
        toTotLocalAmt: 0,
        bankTotAmt: 0,
        bankTotLocalAmt: 0,
        exhGainLoss: 0,
      }
      setBankTransfer(clonedBankTransfer)
      form.reset(clonedBankTransfer)
      toast.success("Bank Transfer cloned successfully")
    }
  }

  // Handle Delete - First Level: Confirmation
  const handleDeleteConfirmation = () => {
    // Close delete confirmation and open cancel confirmation
    setShowDeleteConfirm(false)
    setShowCancelConfirm(true)
  }

  // Handle Delete - Second Level: With Cancel Remarks
  const handleBankTransferDelete = async (cancelRemarks: string) => {
    if (!bankTransfer) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("Bank Transfer ID:", bankTransfer.transferId)
      console.log("Bank Transfer No:", bankTransfer.transferNo)

      const response = await deleteMutation.mutateAsync({
        documentId: bankTransfer.transferId?.toString() ?? "",
        documentNo: bankTransfer.transferNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setBankTransfer(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultBankTransferValues,
        })
        toast.success(
          `Bank Transfer ${bankTransfer.transferNo} deleted successfully`
        )
        // Data refresh handled by BankTransferTable component
      } else {
        toast.error(response.message || "Failed to delete Bank Transfer")
      }
    } catch {
      toast.error("Network error while deleting Bank Transfer")
    }
  }

  // Handle Reset
  const handleBankTransferReset = () => {
    setBankTransfer(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new Bank Transfer)
    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultBankTransferValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
    })
    toast.success("Bank Transfer reset successfully")
  }

  // Handle Print Bank Transfer Report
  const handlePrintBankTransfer = (
    reportType: "direct" | "bankTransfer" = "bankTransfer"
  ) => {
    if (!bankTransfer || bankTransfer.transferId === "0") {
      toast.error("Please select a bank transfer to print")
      return
    }

    const formValues = form.getValues()
    const transferId =
      formValues.transferId || bankTransfer.transferId?.toString() || "0"
    const transferNo = formValues.transferNo || bankTransfer.transferNo || ""

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
    const reportFile = "cb/CbBankTransfer.trdp"

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

  const handleBankTransferSelect = async (
    selectedBankTransfer: ICbBankTransfer | undefined
  ) => {
    if (!selectedBankTransfer) return

    const loadedTransferNo = await loadBankTransfer({
      transferId: selectedBankTransfer.transferId ?? "0",
      transferNo: selectedBankTransfer.transferNo ?? "",
    })

    if (loadedTransferNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchBankTransfers from handleFilterChange
  const handleFilterChange = (newFilters: ICbBankTransferFilter) => {
    setFilters(newFilters)
    // Data refresh handled by BankTransferTable component
  }

  // Data refresh handled by BankTransferTable component

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

  // Set createBy and createDate for new bank transfers on page load/refresh
  useEffect(() => {
    if (!bankTransfer && user && decimals.length > 0) {
      const currentTransferId = form.getValues("transferId")
      const currentTransferNo = form.getValues("transferNo")
      const isNewBankTransfer =
        !currentTransferId || currentTransferId === "0" || !currentTransferNo

      if (isNewBankTransfer) {
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [bankTransfer, user, decimals, form])

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

  const handleBankTransferSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedTransferNo = await loadBankTransfer({
        transferId: "0",
        transferNo: trimmedValue,
        showLoader: true,
      })

      if (loadedTransferNo) {
        toast.success(`Bank Transfer ${loadedTransferNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadBankTransfer({
        transferId: trimmedId,
        transferNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadBankTransfer, pendingDocId])

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

  // Determine mode and bankTransfer ID from URL
  const transferNo = form.getValues("transferNo")
  const isEdit = Boolean(transferNo)
  const isCancelled = bankTransfer?.isCancel === true

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
  const handleCopyInvoiceNo = useCallback(async () => {
    const transferNoToCopy = isEdit
      ? bankTransfer?.transferNo || form.getValues("transferNo") || ""
      : form.getValues("transferNo") || ""

    await copyToClipboard(transferNoToCopy)
  }, [isEdit, bankTransfer?.transferNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `CB Bank Transfer (Edit)- v[${bankTransfer?.editVersion}] - ${transferNo}`
    : "CB Bank Transfer (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading Bank Transfer form...
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
                {bankTransfer?.cancelRemarks && (
                  <div className="max-w-xs truncate text-sm text-red-600">
                    {bankTransfer.cancelRemarks}
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
                  onDoubleClick={handleCopyInvoiceNo}
                  title="Double-click to copy bank transfer number"
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
                  if (bankTransfer?.transferNo) {
                    setSearchNo(bankTransfer.transferNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingBankTransfer}
                className="h-4 w-4 p-0"
                title="Refresh bank transfer data"
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
                placeholder="Search BankTransfer No"
                className="h-8 cursor-pointer text-sm"
                readOnly={
                  !!bankTransfer?.transferId && bankTransfer.transferId !== "0"
                }
                disabled={
                  !!bankTransfer?.transferId && bankTransfer.transferId !== "0"
                }
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowListDialog(true)}
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
              onClick={() => handlePrintBankTransfer("bankTransfer")}
              disabled={!bankTransfer || bankTransfer.transferId === "0"}
            >
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              //disabled={!bankTransfer}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              New
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneConfirm(true)}
              disabled={
                !bankTransfer || bankTransfer.transferId === "0" || isCancelled
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
                !bankTransfer ||
                bankTransfer.transferId === "0" ||
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
              handleSaveBankTransfer()
            }}
            isEdit={isEdit}
            visible={visible}
            required={required}
            companyId={Number(companyId)}
          />
        </TabsContent>

        <TabsContent value="other">
          <Other form={form} />
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
              Bank Transfer List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing Bank Transfers from the list below. Use
              search to filter records or create new transfers.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <BankTransferTable
              onBankTransferSelect={handleBankTransferSelect}
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              pageSize={pageSize}
              isDialogOpen={showListDialog}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation */}
      <SaveConfirmation
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        onConfirm={handleSaveBankTransfer}
        itemName={bankTransfer?.transferNo || "New Bank Transfer"}
        operationType={
          bankTransfer?.transferId && bankTransfer.transferId !== "0"
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
        itemName={bankTransfer?.transferNo}
        title="Delete Bank Transfer"
        description="Are you sure you want to delete this Bank Transfer? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleBankTransferDelete}
        itemName={bankTransfer?.transferNo}
        title="Cancel Bank Transfer"
        description="Please provide a reason for cancelling this Bank Transfer."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleBankTransferSearch(searchNo)}
        code={searchNo}
        typeLabel="Bank Transfer"
        showDetails={false}
        description={`Do you want to load Bank Transfer ${searchNo}?`}
        isLoading={isLoadingBankTransfer}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleBankTransferReset}
        itemName={bankTransfer?.transferNo}
        title="New Bank Transfer"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneBankTransfer}
        itemName={bankTransfer?.transferNo}
        title="Clone Bank Transfer"
        description="This will create a copy as a new bank transfer."
      />
    </div>
  )
}
