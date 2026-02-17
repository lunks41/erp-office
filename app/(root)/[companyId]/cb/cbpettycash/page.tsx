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
} from "@/helpers/cb-pettycash-calculations"
import {
  ICbPettyCashDt,
  ICbPettyCashFilter,
  ICbPettyCashHd,
} from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  CbPettyCashDtSchemaType,
  CbPettyCashHdSchema,
  CbPettyCashHdSchemaType,
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
import { BasicSetting, CbPettyCash } from "@/lib/api-routes"
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

import { getDefaultValues } from "./components/cbpettycash-defaultvalues"
import CbPettyCashTable from "./components/cbpettycash-table"
import History from "./components/history"
import Main from "./components/main-tab"
import Other from "./components/other"

export default function CbPettyCashPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbpettycash

  const { hasPermission } = usePermissionStore()
  const { decimals, user } = useAuthStore()
  const { defaults } = useUserSettingDefaults()
  const pageSize = defaults?.common?.trnGridTotalRecords || 100

  const dateFormat = useMemo(
    () => decimals?.[0]?.dateFormat || clientDateFormat,
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
  const [isLoadingCbPettyCash, setIsLoadingCbPettyCash] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [cbPettyCash, setCbPettyCash] =
    useState<CbPettyCashHdSchemaType | null>(null)
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [pendingDocId, setPendingDocId] = useState("")

  const documentIdFromQuery = useMemo(() => {
    const value =
      searchParams?.get("docId") ?? searchParams?.get("documentId") ?? ""
    return value ? value.trim() : ""
  }, [searchParams])

  const autoLoadStorageKey = useMemo(
    () => `history-doc:/${companyId}/cb/cbpettycash`,
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

  const [filters, setFilters] = useState<ICbPettyCashFilter>({
    startDate: defaultFilterStartDate,
    endDate: defaultFilterEndDate,
    search: "",
    sortBy: "paymentNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: pageSize,
  })

  const defaultCbPettyCashValues = useMemo(
    () => getDefaultValues(dateFormat).defaultCbPettyCash,
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
  const form = useForm<CbPettyCashHdSchemaType>({
    resolver: zodResolver(CbPettyCashHdSchema(required, visible)),
    defaultValues: cbPettyCash
      ? {
          paymentId: cbPettyCash.paymentId?.toString() ?? "0",
          paymentNo: cbPettyCash.paymentNo ?? "",
          referenceNo: cbPettyCash.referenceNo ?? "",
          trnDate: cbPettyCash.trnDate ?? new Date(),
          accountDate: cbPettyCash.accountDate ?? new Date(),
          gstClaimDate: cbPettyCash.gstClaimDate ?? new Date(),
          currencyId: cbPettyCash.currencyId ?? 0,
          exhRate: cbPettyCash.exhRate ?? 0,
          ctyExhRate: cbPettyCash.ctyExhRate ?? 0,
          bankId: cbPettyCash.bankId ?? 0,
          paymentTypeId: cbPettyCash.paymentTypeId ?? 0,
          chequeNo: cbPettyCash.chequeNo ?? "",
          chequeDate: cbPettyCash.chequeDate ?? new Date(),
          bankChgAmt: cbPettyCash.bankChgAmt ?? 0,
          bankChgLocalAmt: cbPettyCash.bankChgLocalAmt ?? 0,
          totAmt: cbPettyCash.totAmt ?? 0,
          totLocalAmt: cbPettyCash.totLocalAmt ?? 0,
          totCtyAmt: cbPettyCash.totCtyAmt ?? 0,
          gstAmt: cbPettyCash.gstAmt ?? 0,
          gstLocalAmt: cbPettyCash.gstLocalAmt ?? 0,
          gstCtyAmt: cbPettyCash.gstCtyAmt ?? 0,
          totAmtAftGst: cbPettyCash.totAmtAftGst ?? 0,
          totLocalAmtAftGst: cbPettyCash.totLocalAmtAftGst ?? 0,
          totCtyAmtAftGst: cbPettyCash.totCtyAmtAftGst ?? 0,
          remarks: cbPettyCash.remarks ?? "",
          payeeTo: cbPettyCash.payeeTo ?? "",
          moduleFrom: cbPettyCash.moduleFrom ?? "",
          createDate: cbPettyCash.createDate ?? "",
          editDate: cbPettyCash.editDate ?? "",
          isCancel: cbPettyCash.isCancel ?? false,
          cancelDate: cbPettyCash.cancelDate ?? "",
          cancelRemarks: cbPettyCash.cancelRemarks ?? "",
          createBy: cbPettyCash.createBy ?? "",
          editBy: cbPettyCash.editBy ?? "",
          cancelBy: cbPettyCash.cancelBy ?? "",
          editVersion: cbPettyCash.editVersion ?? 0,
          appBy: cbPettyCash.appBy ?? "",
          appDate: cbPettyCash.appDate ?? "",
          appStatusId: cbPettyCash.appStatusId ?? "",
          data_details:
            cbPettyCash.data_details?.map((detail) => ({
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
              invoiceDate: detail.invoiceDate
                ? typeof detail.invoiceDate === "string"
                  ? detail.invoiceDate
                  : format(detail.invoiceDate, dateFormat)
                : format(new Date(), dateFormat),
              invoiceNo: detail.invoiceNo ?? "",
              supplierName: detail.supplierName ?? "",
              supplierRegNo: detail.supplierRegNo ?? "",
              jobOrderId: detail.jobOrderId ?? 0,
              jobOrderNo: detail.jobOrderNo ?? "",
              taskId: detail.taskId ?? 0,
              taskName: detail.taskName ?? "",
              serviceItemNo: detail.serviceItemNo ?? 0,
              serviceItemNoName: detail.serviceItemNoName ?? "",
              serviceCategoryId: detail.serviceCategoryId ?? 0,
              serviceCategoryName: detail.serviceCategoryName ?? "",
              editVersion: detail.editVersion ?? 0,
            })) || [],
        }
      : (() => {
          // For new cbPettyCash, set createDate with time and createBy
          const currentDateTime = decimals?.[0]?.longDateFormat
            ? format(
                new Date(),
                decimals?.[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
              )
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultCbPettyCashValues,
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
      (cbPettyCash && cbPettyCash.paymentId && cbPettyCash.paymentId !== "0") ||
      currentGLpaymentId !== "0"
    ) {
      return
    }

    const currentDateTime = decimals?.[0]?.longDateFormat
      ? format(
          new Date(),
          decimals?.[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
        )
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCbPettyCashValues,
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
  }, [
    dateFormat,
    defaultCbPettyCashValues,
    decimals,
    form,
    cbPettyCash,
    isDirty,
    user,
  ])

  // Mutations
  const saveMutation = usePersist<CbPettyCashHdSchemaType>(`${CbPettyCash.add}`)
  const updateMutation = usePersist<CbPettyCashHdSchemaType>(
    `${CbPettyCash.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${CbPettyCash.delete}`)

  // Remove the useGetCbPettyCashById hook for selection
  // const { data: invoiceByIdData, refetch: refetchCbPettyCashById } = ...

  // Handle Save
  const handleSaveCbPettyCash = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as ICbPettyCashHd
      )

      // Validate the form data using the schema
      const validationResult = CbPettyCashHdSchema(required, visible).safeParse(
        formValues
      )

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        // Set field-level errors on the form so FormMessage components can display them
        validationResult.error.issues.forEach((error) => {
          const fieldPath = error.path.join(
            "."
          ) as keyof CbPettyCashHdSchemaType
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

      console.log("handleSaveCbPettyCash formValues", formValues)

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
          // Format invoiceDate in details array
          data_details:
            formValues.data_details?.map((detail) => ({
              ...detail,
              invoiceDate: formatDateForApi(detail.invoiceDate) || "",
            })) || [],
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
              invoiceData as unknown as ICbPettyCashHd
            )

            setSearchNo(updatedSchemaType.paymentNo || "")
            setCbPettyCash(updatedSchemaType)
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

          // Check if this was a new cbPettyCash or update
          const wasNewCbPettyCash = Number(formValues.paymentId) === 0

          if (wasNewCbPettyCash) {
            //toast.success(
            // `CbPettyCash ${invoiceData?.paymentNo || ""} saved successfully`
            //)
          } else {
            //toast.success("CbPettyCash updated successfully")
          }

          // Data refresh handled by CbPettyCashTable component
        } else {
          toast.error(response.message || "Failed to save cbPettyCash")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving cbPettyCash")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Clone
  const handleCloneCbPettyCash = async () => {
    if (cbPettyCash) {
      // Create a proper clone with form values
      const currentDate = new Date()
      const dateStr = format(currentDate, dateFormat)

      const clonedCbPettyCash: CbPettyCashHdSchemaType = {
        ...cbPettyCash,
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
        // Clear all balance and payment amounts; keep detail fields: invoiceNo, invoiceDate, supplierRegNo, supplierName, jobOrderId, taskId, serviceItemNo
        data_details:
          cbPettyCash.data_details?.map((detail) => ({
            ...detail,
            paymentId: "0",
            paymentNo: "",
            // Keep from source detail: invoiceNo, invoiceDate, supplierRegNo, supplierName, jobOrderId, jobOrderNo, taskId, taskName, serviceItemNo, serviceItemNoName
            editVersion: 0,
          })) || [],
      }

      // Calculate totals from details with proper rounding
      const amtDec = decimals?.[0]?.amtDec || 2
      const locAmtDec = decimals?.[0]?.locAmtDec || 2
      const ctyAmtDec = decimals?.[0]?.ctyAmtDec || 2

      const details = clonedCbPettyCash.data_details || []
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

        clonedCbPettyCash.totAmt = mathRound(totAmt, amtDec)
        clonedCbPettyCash.gstAmt = mathRound(gstAmt, amtDec)
        clonedCbPettyCash.totAmtAftGst = mathRound(totAmt + gstAmt, amtDec)
        clonedCbPettyCash.totLocalAmt = mathRound(totLocalAmt, locAmtDec)
        clonedCbPettyCash.gstLocalAmt = mathRound(gstLocalAmt, locAmtDec)
        clonedCbPettyCash.totLocalAmtAftGst = mathRound(
          totLocalAmt + gstLocalAmt,
          locAmtDec
        )
        clonedCbPettyCash.totCtyAmt = mathRound(totCtyAmt, ctyAmtDec)
        clonedCbPettyCash.gstCtyAmt = mathRound(gstCtyAmt, ctyAmtDec)
        clonedCbPettyCash.totCtyAmtAftGst = mathRound(
          totCtyAmt + gstCtyAmt,
          ctyAmtDec
        )
      } else {
        // Reset amounts if no details
        clonedCbPettyCash.totAmt = 0
        clonedCbPettyCash.totLocalAmt = 0
        clonedCbPettyCash.totCtyAmt = 0
        clonedCbPettyCash.gstAmt = 0
        clonedCbPettyCash.gstLocalAmt = 0
        clonedCbPettyCash.gstCtyAmt = 0
        clonedCbPettyCash.totAmtAftGst = 0
        clonedCbPettyCash.totLocalAmtAftGst = 0
        clonedCbPettyCash.totCtyAmtAftGst = 0
      }

      setCbPettyCash(clonedCbPettyCash)
      form.reset(clonedCbPettyCash)

      // Get exchange rate decimal places
      const exhRateDec = decimals?.[0]?.exhRateDec || 6

      // Fetch and set new exchange rates based on new account date
      if (clonedCbPettyCash.currencyId && clonedCbPettyCash.accountDate) {
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
              formDetails as unknown as ICbPettyCashDt[],
              exchangeRate,
              countryExchangeRate,
              decimals?.[0] || {},
              !!visible?.m_CtyCurr
            )

            // Update form with recalculated details
            form.setValue(
              "data_details",
              updatedDetails as unknown as CbPettyCashDtSchemaType[],
              { shouldDirty: true, shouldTouch: true }
            )

            // Recalculate header totals from updated details
            const totals = calculateTotalAmounts(
              updatedDetails as unknown as ICbPettyCashDt[],
              amtDec
            )
            form.setValue("totAmt", totals.totAmt)
            form.setValue("gstAmt", totals.gstAmt)
            form.setValue("totAmtAftGst", totals.totAmtAftGst)

            const localAmounts = calculateLocalAmounts(
              updatedDetails as unknown as ICbPettyCashDt[],
              locAmtDec
            )
            form.setValue("totLocalAmt", localAmounts.totLocalAmt)
            form.setValue("gstLocalAmt", localAmounts.gstLocalAmt)
            form.setValue("totLocalAmtAftGst", localAmounts.totLocalAmtAftGst)

            if (visible?.m_CtyCurr) {
              const countryAmounts = calculateCtyAmounts(
                updatedDetails as unknown as ICbPettyCashDt[],
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

      toast.success("CbPettyCash cloned successfully")
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
  const handleCbPettyCashDelete = async (cancelRemarks: string) => {
    if (!cbPettyCash) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("CbPettyCash ID:", cbPettyCash.paymentId)
      console.log("CbPettyCash No:", cbPettyCash.paymentNo)

      const response = await deleteMutation.mutateAsync({
        documentId: cbPettyCash.paymentId?.toString() ?? "",
        documentNo: cbPettyCash.paymentNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setCbPettyCash(null)
        setSearchNo("") // Clear search input
        form.reset({
          ...defaultCbPettyCashValues,
          data_details: [],
        })
        toast.success(
          `CbPettyCash ${cbPettyCash.paymentNo} deleted successfully`
        )
        // Data refresh handled by CbPettyCashTable component
      } else {
        toast.error(response.message || "Failed to delete cbPettyCash")
      }
    } catch {
      toast.error("Network error while deleting cbPettyCash")
    }
  }

  // Handle Reset
  const handleCbPettyCashReset = () => {
    setCbPettyCash(null)
    setSearchNo("") // Clear search input

    // Get current date/time and user name - always set for reset (new cbPettyCash)
    const currentDateTime = decimals?.[0]?.longDateFormat
      ? format(
          new Date(),
          decimals?.[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
        )
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultCbPettyCashValues,
      // Always set createBy and createDate to current user and current date/time on reset
      createBy: userName,
      createDate: currentDateTime,
      data_details: [],
    })
    toast.success("CbPettyCash reset successfully")
  }

  // Handle Print CbPettyCash Report
  const handlePrintCbPettyCash = (
    reportType: "direct" | "cbPettyCash" = "cbPettyCash"
  ) => {
    if (!cbPettyCash || cbPettyCash.paymentId === "0") {
      toast.error("Please select an cbPettyCash to print")
      return
    }

    const formValues = form.getValues()
    const paymentId =
      formValues.paymentId || cbPettyCash.paymentId?.toString() || "0"
    const paymentNo = formValues.paymentNo || cbPettyCash.paymentNo || ""

    // Get decimals
    const amtDec = decimals?.[0]?.amtDec || 2
    const locAmtDec = decimals?.[0]?.locAmtDec || 2

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
    const reportFile = "cb/CbPettyCash.trdp"

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

  // Helper function to transform ICbPettyCashHd to CbPettyCashHdSchemaType
  const transformToSchemaType = useCallback(
    (apiCbPettyCash: ICbPettyCashHd): CbPettyCashHdSchemaType => {
      return {
        paymentId: apiCbPettyCash.paymentId?.toString() ?? "0",
        paymentNo: apiCbPettyCash.paymentNo ?? "",
        referenceNo: apiCbPettyCash.referenceNo ?? "",

        trnDate: apiCbPettyCash.trnDate
          ? format(
              parseDate(apiCbPettyCash.trnDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        accountDate: apiCbPettyCash.accountDate
          ? format(
              parseDate(apiCbPettyCash.accountDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        gstClaimDate: apiCbPettyCash.gstClaimDate
          ? format(
              parseDate(apiCbPettyCash.gstClaimDate as string) || new Date(),
              dateFormat
            )
          : dateFormat,
        bankId: apiCbPettyCash.bankId ?? 0,
        paymentTypeId: apiCbPettyCash.paymentTypeId ?? 0,
        chequeNo: apiCbPettyCash.chequeNo ?? "",
        chequeDate: apiCbPettyCash.chequeDate ?? new Date(),
        bankChgAmt: apiCbPettyCash.bankChgAmt ?? 0,
        bankChgLocalAmt: apiCbPettyCash.bankChgLocalAmt ?? 0,
        currencyId: apiCbPettyCash.currencyId ?? 0,
        exhRate: apiCbPettyCash.exhRate ?? 0,
        ctyExhRate: apiCbPettyCash.ctyExhRate ?? 0,

        totAmt: apiCbPettyCash.totAmt ?? 0,
        totLocalAmt: apiCbPettyCash.totLocalAmt ?? 0,
        totCtyAmt: apiCbPettyCash.totCtyAmt ?? 0,
        gstAmt: apiCbPettyCash.gstAmt ?? 0,
        gstLocalAmt: apiCbPettyCash.gstLocalAmt ?? 0,
        gstCtyAmt: apiCbPettyCash.gstCtyAmt ?? 0,
        totAmtAftGst: apiCbPettyCash.totAmtAftGst ?? 0,
        totLocalAmtAftGst: apiCbPettyCash.totLocalAmtAftGst ?? 0,
        totCtyAmtAftGst: apiCbPettyCash.totCtyAmtAftGst ?? 0,
        remarks: apiCbPettyCash.remarks ?? "",
        payeeTo: apiCbPettyCash.payeeTo ?? "",
        moduleFrom: apiCbPettyCash.moduleFrom ?? "",
        createDate: apiCbPettyCash.createDate
          ? format(
              parseDate(apiCbPettyCash.createDate as string) || new Date(),
              decimals?.[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        editDate: apiCbPettyCash.editDate
          ? format(
              parseDate(apiCbPettyCash.editDate as unknown as string) ||
                new Date(),
              decimals?.[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        isCancel: apiCbPettyCash.isCancel ?? false,
        cancelDate: apiCbPettyCash.cancelDate
          ? format(
              parseDate(apiCbPettyCash.cancelDate as unknown as string) ||
                new Date(),
              decimals?.[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        cancelRemarks: apiCbPettyCash.cancelRemarks ?? "",
        createBy: apiCbPettyCash.createBy ?? "",
        editBy: apiCbPettyCash.editBy ?? "",
        cancelBy: apiCbPettyCash.cancelBy ?? "",
        editVersion: apiCbPettyCash.editVersion ?? 0,
        appBy: apiCbPettyCash.appBy ?? "",
        appDate: apiCbPettyCash.appDate
          ? format(
              parseDate(apiCbPettyCash.appDate as unknown as string) ||
                new Date(),
              decimals?.[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : "",
        appStatusId: apiCbPettyCash.appStatusId?.toString() ?? "",
        data_details:
          apiCbPettyCash.data_details?.map(
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
                invoiceDate: detail.invoiceDate
                  ? format(
                      parseDate(detail.invoiceDate as string) || new Date(),
                      dateFormat
                    )
                  : format(new Date(), dateFormat),
                invoiceNo: detail.invoiceNo ?? "",
                supplierName: detail.supplierName ?? "",
                supplierRegNo: detail.supplierRegNo ?? "",
                serviceCategoryId: detail.serviceCategoryId ?? 0,
                serviceCategoryName: detail.serviceCategoryName ?? "",
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
              }) as unknown as CbPettyCashDtSchemaType
          ) || [],
      }
    },
    [dateFormat, decimals]
  )

  const loadCbPettyCash = useCallback(
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
      const trimmedCbPettyCashNo = paymentNo?.trim() ?? ""
      const trimmedGLpaymentId =
        typeof paymentId === "number"
          ? paymentId.toString()
          : (paymentId?.toString().trim() ?? "")

      if (!trimmedCbPettyCashNo && !trimmedGLpaymentId) return null

      if (showLoader) {
        setIsLoadingCbPettyCash(true)
      }

      const requestGLpaymentId = trimmedGLpaymentId || "0"
      const requestCbPettyCashNo = trimmedCbPettyCashNo || ""

      try {
        const response = await getById(
          `${CbPettyCash.getByIdNo}/${requestGLpaymentId}/${requestCbPettyCashNo}`
        )

        if (response?.result === 1) {
          const detailedCbPettyCash = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (detailedCbPettyCash) {
            const parsed = parseDate(detailedCbPettyCash.accountDate as string)
            setPreviousAccountDate(
              parsed
                ? format(parsed, dateFormat)
                : (detailedCbPettyCash.accountDate as string)
            )

            const updatedCbPettyCash =
              transformToSchemaType(detailedCbPettyCash)

            setCbPettyCash(updatedCbPettyCash)
            form.reset(updatedCbPettyCash)
            form.trigger()

            const resolvedCbPettyCashNo =
              updatedCbPettyCash.paymentNo ||
              trimmedCbPettyCashNo ||
              trimmedGLpaymentId
            setSearchNo(resolvedCbPettyCashNo)

            return resolvedCbPettyCashNo
          }
        } else {
          toast.error(
            response?.message || "Failed to fetch cbpettycash details"
          )
        }
      } catch (error) {
        console.error("Error fetching cbpettycash details:", error)
        toast.error("Error loading cbpettycash. Please try again.")
      } finally {
        if (showLoader) {
          setIsLoadingCbPettyCash(false)
        }
      }

      return null
    },
    [
      dateFormat,
      form,
      setCbPettyCash,
      setIsLoadingCbPettyCash,
      setPreviousAccountDate,
      setSearchNo,
      transformToSchemaType,
    ]
  )

  const handleCbPettyCashSelect = async (
    selectedCbPettyCash: ICbPettyCashHd | undefined
  ) => {
    if (!selectedCbPettyCash) return

    const loadedCbPettyCashNo = await loadCbPettyCash({
      paymentId: selectedCbPettyCash.paymentId ?? "0",
      paymentNo: selectedCbPettyCash.paymentNo ?? "",
    })

    if (loadedCbPettyCashNo) {
      setShowListDialog(false)
    }
  }

  // Remove direct refetchCbPettyCashs from handleFilterChange
  const handleFilterChange = (newFilters: ICbPettyCashFilter) => {
    setFilters(newFilters)
    // Data refresh handled by CbPettyCashTable component
  }

  // Data refresh handled by CbPettyCashTable component

  // Set createBy and createDate for new invoices on page load/refresh
  useEffect(() => {
    if (!cbPettyCash && user && decimals.length > 0) {
      const currentGLpaymentId = form.getValues("paymentId")
      const currentCbPettyCashNo = form.getValues("paymentNo")
      const isNewCbPettyCash =
        !currentGLpaymentId ||
        currentGLpaymentId === "0" ||
        !currentCbPettyCashNo

      if (isNewCbPettyCash) {
        const currentDateTime = decimals?.[0]?.longDateFormat
          ? format(
              new Date(),
              decimals?.[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
            )
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.setValue("createBy", userName)
        form.setValue("createDate", currentDateTime)
      }
    }
  }, [cbPettyCash, user, decimals, form])

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

  const handleCbPettyCashSearch = async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const loadedCbPettyCashNo = await loadCbPettyCash({
        paymentId: "0",
        paymentNo: trimmedValue,
        showLoader: true,
      })

      if (loadedCbPettyCashNo) {
        toast.success(`CbPettyCash ${loadedCbPettyCashNo} loaded successfully`)
      }
    } finally {
      setShowLoadConfirm(false)
    }
  }

  useEffect(() => {
    const trimmedId = pendingDocId.trim()
    if (!trimmedId) return

    const executeLoad = async () => {
      await loadCbPettyCash({
        paymentId: trimmedId,
        paymentNo: "0",
        showLoader: true,
      })
    }

    void executeLoad()
    setPendingDocId("")
  }, [loadCbPettyCash, pendingDocId])

  // Determine mode and cbPettyCash ID from URL
  const paymentNo = form.getValues("paymentNo")
  const isEdit = Boolean(paymentNo)
  const isCancelled = cbPettyCash?.isCancel === true

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
  const handleCopyCbPettyCashNo = useCallback(async () => {
    const paymentNoToCopy = isEdit
      ? cbPettyCash?.paymentNo || form.getValues("paymentNo") || ""
      : form.getValues("paymentNo") || ""

    await copyToClipboard(paymentNoToCopy)
  }, [isEdit, cbPettyCash?.paymentNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `CbPettyCash (Edit)- v[${cbPettyCash?.editVersion}] - ${paymentNo}`
    : "CbPettyCash (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading cbPettyCash form...
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
                {cbPettyCash?.cancelRemarks && (
                  <div className="max-w-xs truncate text-sm text-red-600">
                    {cbPettyCash.cancelRemarks}
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
                  onDoubleClick={handleCopyCbPettyCashNo}
                  title="Double-click to copy cbPettyCash number"
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
                  if (cbPettyCash?.paymentNo) {
                    setSearchNo(cbPettyCash.paymentNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingCbPettyCash}
                className="h-4 w-4 p-0"
                title="Refresh cbPettyCash data"
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
                placeholder="Search CbPettyCash No"
                className="h-8 cursor-pointer text-sm"
                readOnly={
                  !!cbPettyCash?.paymentId && cbPettyCash.paymentId !== "0"
                }
                disabled={
                  !!cbPettyCash?.paymentId && cbPettyCash.paymentId !== "0"
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
              onClick={() => handlePrintCbPettyCash("cbPettyCash")}
              disabled={!cbPettyCash || cbPettyCash.paymentId === "0"}
            >
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              //disabled={!cbPettyCash}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              New
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneConfirm(true)}
              disabled={
                !cbPettyCash || cbPettyCash.paymentId === "0" || isCancelled
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
                !cbPettyCash ||
                cbPettyCash.paymentId === "0" ||
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
              handleSaveCbPettyCash()
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
              CbPettyCash List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing CbPettyCashs from the list below. Use
              search to filter records or create new invoices.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <CbPettyCashTable
              onCbPettyCashSelect={handleCbPettyCashSelect}
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
        onConfirm={handleSaveCbPettyCash}
        itemName={cbPettyCash?.paymentNo || "New CbPettyCash"}
        operationType={
          cbPettyCash?.paymentId && cbPettyCash.paymentId !== "0"
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
        itemName={cbPettyCash?.paymentNo}
        title="Delete CbPettyCash"
        description="Are you sure you want to delete this cbPettyCash? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleCbPettyCashDelete}
        itemName={cbPettyCash?.paymentNo}
        title="Cancel CbPettyCash"
        description="Please provide a reason for cancelling this cbPettyCash."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleCbPettyCashSearch(searchNo)}
        code={searchNo}
        typeLabel="CbPettyCash"
        showDetails={false}
        description={`Do you want to load CbPettyCash ${searchNo}?`}
        isLoading={isLoadingCbPettyCash}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleCbPettyCashReset}
        itemName={cbPettyCash?.paymentNo}
        title="New CbPettyCash"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneCbPettyCash}
        itemName={cbPettyCash?.paymentNo}
        title="Clone CbPettyCash"
        description="This will create a copy as a new cbPettyCash."
      />
    </div>
  )
}
