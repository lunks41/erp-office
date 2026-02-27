"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ICbBankReconFilter, ICbBankReconHd } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  CbBankReconDtSchemaType,
  CbBankReconHdSchema,
  CbBankReconHdSchemaType,
} from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ZodIssue } from "zod"
import { format, subMonths } from "date-fns"
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
import { CbBankRecon } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { CBTransactionId, ModuleId } from "@/lib/utils"
import { useDeleteWithRemarks, usePersist } from "@/hooks/use-common"
import {
  useGetRequiredFields,
  useGetVisibleFields,
  usePaymentTypeLookup,
} from "@/hooks/use-lookup"
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

import { defaultBankRecon } from "./components/cbbankrecon-defaultvalues"
import BankReconTable from "./components/cbbankrecon-table"
import History from "./components/history"
import Main from "./components/main-tab"

export default function BankReconPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const { decimals, user } = useAuthStore()
  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbankrecon

  const [showListDialog, setShowListDialog] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showLoadConfirm, setShowLoadConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showCloneConfirm, setShowCloneConfirm] = useState(false)
  const [isLoadingBankRecon, setIsLoadingBankRecon] = useState(false)
  const [isSelectingBankRecon, setIsSelectingBankRecon] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [bankRecon, setBankRecon] = useState<CbBankReconHdSchemaType | null>(
    null
  )
  const [searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")

  const [filters, setFilters] = useState<ICbBankReconFilter>({
    startDate: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    search: "",
    sortBy: "reconNo",
    sortOrder: "asc",
    pageNumber: 1,
    pageSize: 15,
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
  const bankReconSchema = useMemo(
    () => CbBankReconHdSchema(required, visible, { chequePaymentTypeIds }),
    [required, visible, chequePaymentTypeIds]
  )

  // Add form state management
  const form = useForm<CbBankReconHdSchemaType>({
    resolver: zodResolver(bankReconSchema),
    defaultValues: bankRecon
      ? {
          reconId: bankRecon.reconId?.toString() ?? "0",
          reconNo: bankRecon.reconNo ?? "",
          prevReconId: bankRecon.prevReconId ?? 0,
          prevReconNo: bankRecon.prevReconNo ?? "",
          referenceNo: bankRecon.referenceNo ?? "",
          trnDate: bankRecon.trnDate ?? new Date(),
          accountDate: bankRecon.accountDate ?? new Date(),
          bankId: bankRecon.bankId ?? 0,
          currencyId: bankRecon.currencyId ?? 0,
          fromDate: bankRecon.fromDate ?? new Date(),
          toDate: bankRecon.toDate ?? new Date(),
          remarks: bankRecon.remarks ?? "",
          totAmt: bankRecon.totAmt ?? 0,
          opBalAmt: bankRecon.opBalAmt ?? 0,
          clBalAmt: bankRecon.clBalAmt ?? 0,
          createById: bankRecon.createById ?? 0,
          createBy: bankRecon.createBy ?? "",
          createDate: bankRecon.createDate ?? "",
          editById: bankRecon.editById ?? undefined,
          editBy: bankRecon.editBy ?? "",
          editDate: bankRecon.editDate ?? "",
          editVersion: bankRecon.editVersion ?? 0,
          isCancel: bankRecon.isCancel ?? false,
          cancelById: bankRecon.cancelById ?? undefined,
          cancelBy: bankRecon.cancelBy ?? "",
          cancelDate: bankRecon.cancelDate ?? "",
          cancelRemarks: bankRecon.cancelRemarks ?? null,
          isPost: bankRecon.isPost ?? false,
          postById: bankRecon.postById ?? undefined,
          postBy: bankRecon.postBy ?? "",
          postDate: bankRecon.postDate ?? "",
          appStatusId: bankRecon.appStatusId ?? null,
          appById: bankRecon.appById ?? null,
          appBy: bankRecon.appBy ?? "",
          appDate: bankRecon.appDate ?? "",
          data_details:
            bankRecon.data_details?.map((detail) => ({
              ...detail,
              reconId: detail.reconId?.toString() ?? "0",
              reconNo: detail.reconNo ?? "",
              itemNo: detail.itemNo ?? 0,
              isSel: detail.isSel ?? false,
              moduleId: detail.moduleId ?? 0,
              transactionId: detail.transactionId ?? 0,
              documentId: detail.documentId ?? 0,
              documentNo: detail.documentNo ?? "",
              docReferenceNo: detail.docReferenceNo ?? "",
              accountDate: detail.accountDate ?? new Date(),
              paymentTypeId: detail.paymentTypeId ?? 0,
              chequeNo: detail.chequeNo ?? "",
              chequeDate: detail.chequeDate ?? new Date(),
              customerId: detail.customerId ?? 0,
              supplierId: detail.supplierId ?? 0,
              glId: detail.glId ?? 0,
              isDebit: detail.isDebit ?? false,
              exhRate: detail.exhRate ?? 0,
              totAmt: detail.totAmt ?? 0,
              totLocalAmt: detail.totLocalAmt ?? 0,
              paymentFromTo: detail.paymentFromTo ?? "",
              remarks: detail.remarks ?? "",
              editVersion: detail.editVersion ?? 0,
            })) || [],
        }
      : (() => {
          // For new bankRecon, set createDate with time and createBy
          const currentDateTime = decimals[0]?.longDateFormat
            ? format(new Date(), decimals[0].longDateFormat)
            : format(new Date(), "dd/MM/yyyy HH:mm:ss")
          const userName = user?.userName || ""

          return {
            ...defaultBankRecon,
            createBy: userName,
            createDate: currentDateTime,
            editDate: "",
            cancelDate: "",
            postDate: "",
            appDate: "",
          }
        })(),
  })

  // Data fetching moved to BankReconTable component for better performance

  // Mutations
  const saveMutation = usePersist<CbBankReconHdSchemaType>(`${CbBankRecon.add}`)
  const updateMutation = usePersist<CbBankReconHdSchemaType>(
    `${CbBankRecon.add}`
  )
  const deleteMutation = useDeleteWithRemarks(`${CbBankRecon.delete}`)

  // Handle Save
  const handleSaveBankRecon = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending || updateMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = transformToSchemaType(
        form.getValues() as unknown as ICbBankReconHd
      )

      // Validate the form data using the schema
      const validationResult = bankReconSchema.safeParse(formValues)

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          referenceNo: "Reference No",
          accountDate: "Account Date",
          bankId: "Bank",
          paymentTypeId: "Pay",
          chequeNo: "Pay No",
          remarks: "Remarks",
        }
        const failedFields: string[] = []
        validationResult.error.issues.forEach((error: ZodIssue) => {
          const pathKey = error.path.map(String).join(".")
          const fieldPath = pathKey as keyof CbBankReconHdSchemaType
          form.setError(fieldPath, {
            type: "validation",
            message: error.message,
          })
          const label =
            fieldLabelMap[pathKey] ??
            pathKey
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (s: string) => s.toUpperCase())
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

      // Check if at least one detail is selected
      if (!formValues.data_details || formValues.data_details.length === 0) {
        toast.error("Please add at least one reconciliation detail")
        return
      }

      console.log(formValues)

      // Format dates for API submission (yyyy-MM-dd format)
      const apiFormValues = {
        ...formValues,
        trnDate: formatDateForApi(formValues.trnDate) || "",
        accountDate: formatDateForApi(formValues.accountDate) || "",
        // Format dates in details array
        data_details:
          formValues.data_details?.map((detail) => ({
            ...detail,
            accountDate: formatDateForApi(detail.accountDate) || "",
            chequeDate: formatDateForApi(detail.chequeDate) || "",
          })) || [],
      }

      const response =
        Number(formValues.reconId) === 0
          ? await saveMutation.mutateAsync(apiFormValues)
          : await updateMutation.mutateAsync(apiFormValues)

      if (response.result === 1) {
        const bankReconData = Array.isArray(response.data)
          ? response.data[0]
          : response.data

        // Transform API response back to form values
        if (bankReconData) {
          const updatedSchemaType = transformToSchemaType(
            bankReconData as unknown as ICbBankReconHd
          )
          setIsSelectingBankRecon(true)
          setBankRecon(updatedSchemaType)
          form.reset(updatedSchemaType)
          form.trigger()
        }

        // Close the save confirmation dialog
        setShowSaveConfirm(false)

        // Data refresh handled by BankReconTable component
      } else {
        toast.error(response.message || "Failed to save Bank Reconciliation")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving Bank Reconciliation")
    } finally {
      setIsSaving(false)
      setIsSelectingBankRecon(false)
    }
  }

  // Handle Clone
  const handleCloneBankRecon = () => {
    if (bankRecon) {
      // Create a proper clone with form values
      const clonedBankRecon: CbBankReconHdSchemaType = {
        ...bankRecon,
        reconId: "0",
        reconNo: "",
        prevReconId: 0,
        prevReconNo: "",
        // Reset amounts for new reconciliation
        totAmt: 0,
        opBalAmt: 0,
        clBalAmt: 0,
        // Reset data details
        data_details: [],
      }
      setBankRecon(clonedBankRecon)
      form.reset(clonedBankRecon)
      toast.success("Bank Reconciliation cloned successfully")
    }
  }

  // Handle Delete - First Level: Confirmation
  const handleDeleteConfirmation = () => {
    // Close delete confirmation and open cancel confirmation
    setShowDeleteConfirm(false)
    setShowCancelConfirm(true)
  }

  // Handle Delete - Second Level: With Cancel Remarks
  const handleBankReconDelete = async (cancelRemarks: string) => {
    if (!bankRecon) return

    try {
      console.log("Cancel remarks:", cancelRemarks)
      console.log("BankRecon ID:", bankRecon.reconId)
      console.log("BankRecon No:", bankRecon.reconNo)

      const response = await deleteMutation.mutateAsync({
        documentId: bankRecon.reconId?.toString() ?? "",
        documentNo: bankRecon.reconNo ?? "",
        cancelRemarks: cancelRemarks,
      })

      if (response.result === 1) {
        setBankRecon(null)
        setSearchNo("") // Clear search input
        const currentDateTime = decimals[0]?.longDateFormat
          ? format(new Date(), decimals[0].longDateFormat)
          : format(new Date(), "dd/MM/yyyy HH:mm:ss")
        const userName = user?.userName || ""

        form.reset({
          ...defaultBankRecon,
          createBy: userName,
          createDate: currentDateTime,
          editDate: "",
          cancelDate: "",
          postDate: "",
          appDate: "",
          data_details: [],
        })
        toast.success(
          `Bank Reconciliation ${bankRecon.reconNo} deleted successfully`
        )
        // Data refresh handled by BankReconTable component
      } else {
        toast.error(response.message || "Failed to delete Bank Reconciliation")
      }
    } catch {
      toast.error("Network error while deleting Bank Reconciliation")
    }
  }

  // Handle Reset
  const handleBankReconReset = () => {
    setBankRecon(null)
    setSearchNo("") // Clear search input

    const currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")
    const userName = user?.userName || ""

    form.reset({
      ...defaultBankRecon,
      createBy: userName,
      createDate: currentDateTime,
      editDate: "",
      cancelDate: "",
      postDate: "",
      appDate: "",
      data_details: [],
    } as CbBankReconHdSchemaType)
    toast.success("Ready for new Bank Reconciliation")
  }

  // Handle Print Bank Recon Report
  const handlePrintBankRecon = () => {
    if (!bankRecon || bankRecon.reconId === "0") {
      toast.error("Please select a bank reconciliation to print")
      return
    }

    const formValues = form.getValues()
    const reconId = formValues.reconId || bankRecon.reconId?.toString() || "0"
    const reconNo = formValues.reconNo || bankRecon.reconNo || ""

    // Get decimals
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2

    // Build report parameters
    const reportParams = {
      companyId: companyId,
      invoiceId: reconId,
      invoiceNo: reconNo,
      reportType: 1,
      userName: user?.userName || "",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
    }

    console.log("reportParams", reportParams)

    // Store report data in sessionStorage
    const reportData = {
      reportFile: "cb/CbBankRecon.trdp",
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

  // Helper function to transform ICbBankReconHd to CbBankReconHdSchemaType
  const transformToSchemaType = (
    apiBankRecon: ICbBankReconHd
  ): CbBankReconHdSchemaType => {
    return {
      reconId: apiBankRecon.reconId?.toString() ?? "0",
      reconNo: apiBankRecon.reconNo ?? "",
      prevReconId: apiBankRecon.prevReconId ?? 0,
      prevReconNo: apiBankRecon.prevReconNo ?? "",
      referenceNo: apiBankRecon.referenceNo ?? "",
      trnDate: apiBankRecon.trnDate
        ? format(
            parseDate(apiBankRecon.trnDate as string) || new Date(),
            clientDateFormat
          )
        : "",
      accountDate: apiBankRecon.accountDate
        ? format(
            parseDate(apiBankRecon.accountDate as string) || new Date(),
            clientDateFormat
          )
        : "",
      bankId: apiBankRecon.bankId ?? 0,
      currencyId: apiBankRecon.currencyId ?? 0,
      fromDate: apiBankRecon.fromDate
        ? format(
            parseDate(apiBankRecon.fromDate as string) || new Date(),
            clientDateFormat
          )
        : "",
      toDate: apiBankRecon.toDate
        ? format(
            parseDate(apiBankRecon.toDate as string) || new Date(),
            clientDateFormat
          )
        : "",
      remarks: apiBankRecon.remarks ?? "",
      totAmt: apiBankRecon.totAmt ?? 0,
      opBalAmt: apiBankRecon.opBalAmt ?? 0,
      clBalAmt: apiBankRecon.clBalAmt ?? 0,
      createById: apiBankRecon.createById ?? 0,
      createDate: apiBankRecon.createDate
        ? format(
            parseDate(apiBankRecon.createDate as string) || new Date(),
            decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
          )
        : "",
      editById: apiBankRecon.editById ?? undefined,
      editDate: apiBankRecon.editDate
        ? format(
            parseDate(apiBankRecon.editDate as unknown as string) || new Date(),
            decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
          )
        : "",
      editVersion: apiBankRecon.editVersion ?? 0,
      isCancel: apiBankRecon.isCancel ?? false,
      cancelById: apiBankRecon.cancelById ?? undefined,
      cancelDate: apiBankRecon.cancelDate
        ? format(
            parseDate(apiBankRecon.cancelDate as unknown as string) ||
              new Date(),
            decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
          )
        : "",
      cancelRemarks: apiBankRecon.cancelRemarks ?? null,
      isPost: apiBankRecon.isPost ?? false,
      postById: apiBankRecon.postById ?? undefined,
      postDate: apiBankRecon.postDate
        ? format(
            parseDate(apiBankRecon.postDate as unknown as string) || new Date(),
            decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
          )
        : "",
      appStatusId: apiBankRecon.appStatusId ?? null,
      appById: apiBankRecon.appById ?? null,
      appDate: apiBankRecon.appDate
        ? format(
            parseDate(apiBankRecon.appDate as unknown as string) || new Date(),
            decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
          )
        : "",
      data_details:
        apiBankRecon.data_details?.map(
          (detail) =>
            ({
              ...detail,
              reconId: detail.reconId?.toString() ?? "0",
              reconNo: detail.reconNo ?? "",
              itemNo: detail.itemNo ?? 0,
              isSel: detail.isSel ?? false,
              moduleId: detail.moduleId ?? 0,
              transactionId: detail.transactionId ?? 0,
              documentId: detail.documentId ?? 0,
              documentNo: detail.documentNo ?? "",
              docReferenceNo: detail.docReferenceNo ?? "",
              accountDate: detail.accountDate
                ? format(
                    parseDate(detail.accountDate as string) || new Date(),
                    clientDateFormat
                  )
                : "",
              paymentTypeId: detail.paymentTypeId ?? 0,
              chequeNo: detail.chequeNo ?? "",
              chequeDate: detail.chequeDate
                ? format(
                    parseDate(detail.chequeDate as string) || new Date(),
                    clientDateFormat
                  )
                : "",
              customerId: detail.customerId ?? 0,
              supplierId: detail.supplierId ?? 0,
              glId: detail.glId ?? 0,
              isDebit: detail.isDebit ?? false,
              exhRate: detail.exhRate ?? 0,
              totAmt: detail.totAmt ?? 0,
              totLocalAmt: detail.totLocalAmt ?? 0,
              paymentFromTo: detail.paymentFromTo ?? "",
              remarks: detail.remarks ?? "",
              editVersion: detail.editVersion ?? 0,
            }) as unknown as CbBankReconDtSchemaType
        ) || [],
    }
  }

  const handleBankReconSelect = async (
    selectedBankRecon: ICbBankReconHd | undefined
  ) => {
    if (!selectedBankRecon) return

    setIsSelectingBankRecon(true)

    try {
      // Fetch Bank Reconciliation details directly using selected reconciliation's values
      const response = await getById(
        `${CbBankRecon.getByIdNo}/${selectedBankRecon.reconId}/${selectedBankRecon.reconNo}`
      )

      if (response?.result === 1) {
        const detailedBankRecon = Array.isArray(response.data)
          ? response.data[0]
          : response.data

        if (detailedBankRecon) {
          console.log("detailedBankRecon", detailedBankRecon)

          const updatedBankRecon = transformToSchemaType(detailedBankRecon)
          setBankRecon(updatedBankRecon)
          form.reset(updatedBankRecon)
          form.trigger()

          // Close dialog only on success
          setShowListDialog(false)
          toast.success(
            `BankRecon ${selectedBankRecon.reconNo} loaded successfully`
          )
        }
      } else {
        toast.error(
          response?.message || "Failed to fetch Bank Reconciliation details"
        )
        // Keep dialog open on failure so user can try again
      }
    } catch (error) {
      console.error("Error fetching Bank Reconciliation details:", error)
      toast.error("Error loading Bank Reconciliation. Please try again.")
      // Keep dialog open on error
    } finally {
      setIsSelectingBankRecon(false)
    }
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: ICbBankReconFilter) => {
    setFilters(newFilters)
  }

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

  const handleBankReconSearch = async (value: string) => {
    if (!value) return

    setIsLoadingBankRecon(true)

    try {
      const response = await getById(`${CbBankRecon.getByIdNo}/0/${value}`)

      if (response?.result === 1) {
        const detailedBankRecon = Array.isArray(response.data)
          ? response.data[0]
          : response.data

        if (detailedBankRecon) {
          const updatedBankRecon = transformToSchemaType(detailedBankRecon)
          setBankRecon(updatedBankRecon)
          form.reset(updatedBankRecon)
          form.trigger()

          // Show success message
          toast.success(`Bank Reconciliation ${value} loaded successfully`)

          // Close the load confirmation dialog on success
          setShowLoadConfirm(false)
        }
      } else {
        toast.error(
          response?.message ||
            "Failed to fetch Bank Reconciliation details (direct)"
        )
      }
    } catch {
      toast.error("Error searching for Bank Reconciliation")
    } finally {
      setIsLoadingBankRecon(false)
    }
  }

  // Determine mode and bank recon ID from URL
  const reconNo = form.getValues("reconNo")
  const isEdit = Boolean(reconNo)
  const isCancelled = bankRecon?.isCancel === true

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

  // Handle double-click to copy reconNo to clipboard
  const handleCopyInvoiceNo = useCallback(async () => {
    const reconNoToCopy = isEdit
      ? bankRecon?.reconNo || form.getValues("reconNo") || ""
      : form.getValues("reconNo") || ""

    await copyToClipboard(reconNoToCopy)
  }, [isEdit, bankRecon?.reconNo, form, copyToClipboard])

  // Compose title text
  const titleText = isEdit
    ? `CB Bank Reconciliation (Edit) - v[${bankRecon?.editVersion}] - ${reconNo}`
    : "CB Bank Reconciliation (New)"

  // Show loading spinner while essential data is loading
  if (!visible || !required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Loading Bank Reconciliation form...
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
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Cancel Remarks Badge - Only show when cancelled */}
            {isCancelled && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                  <span className="mr-1 h-2 w-2 rounded-full bg-red-400"></span>
                  Cancelled
                </span>
                {bankRecon?.cancelRemarks && (
                  <div className="max-w-xs truncate text-sm text-red-600">
                    {bankRecon.cancelRemarks}
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
                  title="Double-click to copy reconciliation number"
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
                  if (bankRecon?.reconNo) {
                    setSearchNo(bankRecon.reconNo)
                    setShowLoadConfirm(true)
                  }
                }}
                disabled={isLoadingBankRecon}
                className="h-4 w-4 p-0"
                title="Refresh bank reconciliation data"
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
                onBlur={() => {
                  if (searchNo.trim()) {
                    setShowLoadConfirm(true)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchNo.trim()) {
                    e.preventDefault()
                    setShowLoadConfirm(true)
                  }
                }}
                placeholder="Search Reconciliation No"
                className="h-8 cursor-pointer text-sm"
                readOnly={!!bankRecon?.reconId && bankRecon.reconId !== "0"}
                disabled={!!bankRecon?.reconId && bankRecon.reconId !== "0"}
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
                isSaving || saveMutation.isPending || updateMutation.isPending
              }
              className={isEdit ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <Save className="mr-1 h-4 w-4" />
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
              disabled={!bankRecon || bankRecon.reconId === "0"}
              onClick={handlePrintBankRecon}
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
              disabled={!bankRecon || bankRecon.reconId === "0" || isCancelled}
            >
              <Copy className="mr-1 h-4 w-4" />
              Clone
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={
                !bankRecon ||
                bankRecon.reconId === "0" ||
                deleteMutation.isPending ||
                isCancelled
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
              handleSaveBankRecon()
            }}
            isEdit={isEdit}
            visible={visible}
            required={required}
            companyId={Number(companyId)}
          />
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
              CB Bank Reconciliation List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing Bank Reconciliations from the list
              below. Use search to filter records or create new Bank
              Reconciliations.
            </p>
          </div>

          {/* Table Container - Takes remaining space */}
          <div className="flex-1 overflow-auto px-4 py-2">
            {isSelectingBankRecon ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                  <Spinner size="lg" className="mx-auto" />
                  <p className="mt-4 text-sm text-gray-600">
                    {isSelectingBankRecon
                      ? "Loading Bank Reconciliation details..."
                      : "Loading Bank Reconciliations..."}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {isSelectingBankRecon
                      ? "Please wait while we fetch the complete Bank Reconciliation data"
                      : "Please wait while we fetch the Bank Reconciliation list"}
                  </p>
                </div>
              </div>
            ) : (
              <BankReconTable
                onBankReconSelect={handleBankReconSelect}
                onFilterChange={handleFilterChange}
                initialFilters={filters}
                isDialogOpen={showListDialog}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation */}
      <SaveConfirmation
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        onConfirm={handleSaveBankRecon}
        itemName={bankRecon?.reconNo || "New Bank Reconciliation"}
        operationType={
          bankRecon?.reconId && bankRecon.reconId !== "0" ? "update" : "create"
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
        itemName={bankRecon?.reconNo}
        title="Delete Bank Reconciliation"
        description="Are you sure you want to delete this bank reconciliation? You will be asked to provide a reason."
        isDeleting={false}
      />

      {/* Cancel Confirmation - Second Level */}
      <CancelConfirmation
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmAction={handleBankReconDelete}
        itemName={bankRecon?.reconNo}
        title="Cancel Bank Reconciliation"
        description="Please provide a reason for cancelling this bank reconciliation."
        isCancelling={deleteMutation.isPending}
      />

      {/* Load Confirmation */}
      <LoadConfirmation
        open={showLoadConfirm}
        onOpenChange={setShowLoadConfirm}
        onLoad={() => handleBankReconSearch(searchNo)}
        code={searchNo}
        typeLabel="Bank Reconciliation"
        showDetails={false}
        description={`Do you want to load Bank Reconciliation ${searchNo}?`}
        isLoading={isLoadingBankRecon}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleBankReconReset}
        itemName={bankRecon?.reconNo}
        title="New Bank Reconciliation"
        description="This will clear all unsaved changes."
      />

      {/* Clone Confirmation */}
      <CloneConfirmation
        open={showCloneConfirm}
        onOpenChange={setShowCloneConfirm}
        onConfirm={handleCloneBankRecon}
        itemName={bankRecon?.reconNo}
        title="Clone Bank Reconciliation"
        description="This will create a copy as a new bank reconciliation."
      />
    </div>
  )
}
