"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { IGLOpeningBalance } from "@/interfaces"
import { GLOpeningBalanceSchema, GLOpeningBalanceSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { Save } from "lucide-react"
import { Resolver, useForm } from "react-hook-form"
import { toast } from "sonner"

import { getById } from "@/lib/api-client"
import { BasicSetting, GLOpeningBalance } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { GLTransactionId, ModuleId } from "@/lib/utils"
import { useGetById, usePersist } from "@/hooks/use-common"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DeleteConfirmation,
  ResetConfirmation,
  SaveConfirmation,
} from "@/components/confirmation"

import Main, { type OpeningBalanceTotals } from "./components/main-tab"
import { getDefaultValues } from "./components/openingbalance-defaultvalues"

export default function OpeningBalancePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.gl
  const transactionId = GLTransactionId.openingbalance

  const { hasPermission } = usePermissionStore()
  const { decimals, user } = useAuthStore()
  const { defaults } = useUserSettingDefaults()
  const _pageSize = defaults?.common?.trnGridTotalRecords || 100

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
  const _canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const _canPost = hasPermission(moduleId, transactionId, "isPost")

  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [openingBalance, setOpeningBalance] =
    useState<GLOpeningBalanceSchemaType | null>(null)
  const [_searchNo, setSearchNo] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [documentIdToFetch, setDocumentIdToFetch] = useState<
    string | undefined
  >(undefined)
  const [totals, setTotals] = useState<OpeningBalanceTotals>({
    totDebitLocalAmt: 0,
    totCreditLocalAmt: 0,
  })

  // Track previous account date to send as PrevAccountDate to API
  const [previousAccountDate, setPreviousAccountDate] = useState<string>("")

  // Get documentId from searchParams if available
  useEffect(() => {
    const docId = searchParams.get("documentId")
    if (docId) {
      setDocumentIdToFetch(docId)
    }
  }, [searchParams])

  // Fetch opening balance by ID using useGetById hook
  const { data: fetchedOpeningBalance, isLoading: _isLoadingOpeningBalance } =
    useGetById<IGLOpeningBalance>(
      GLOpeningBalance.getById,
      "gl-opening-balance",
      documentIdToFetch || "",
      {
        enabled: !!documentIdToFetch && documentIdToFetch !== "0",
      }
    )

  // Extract opening balance data from API response
  const fetchedData: IGLOpeningBalance | undefined =
    fetchedOpeningBalance?.result === 1 && fetchedOpeningBalance?.data
      ? Array.isArray(fetchedOpeningBalance.data)
        ? fetchedOpeningBalance.data[0]
        : fetchedOpeningBalance.data
      : undefined

  // Transform fetched data to schema type
  const transformToSchemaType = useCallback(
    (apiData: IGLOpeningBalance): GLOpeningBalanceSchemaType => {
      return {
        companyId: apiData.companyId ?? 0,
        documentId: String(apiData.documentId ?? "0"),
        itemNo: apiData.itemNo ?? 0,
        glId: apiData.glId ?? 0,
        documentNo: apiData.documentNo ?? "",
        accountDate: apiData.accountDate ?? "",
        customerId: apiData.customerId ?? 0,
        supplierId: apiData.supplierId ?? 0,
        currencyId: apiData.currencyId ?? 0,
        exhRate: apiData.exhRate ?? 0,
        isDebit: apiData.isDebit ?? true,
        totAmt: apiData.totAmt ?? 0,
        totLocalAmt: apiData.totLocalAmt ?? 0,
        departmentId: apiData.departmentId ?? 0,
        employeeId: apiData.employeeId ?? 0,
        productId: apiData.productId ?? 0,
        vesselId: apiData.vesselId ?? 0,
        portId: apiData.portId ?? 0,
        bargeId: apiData.bargeId ?? 0,
        voyageId: apiData.voyageId ?? 0,
        isSystem: apiData.isSystem ?? false,
        createById: apiData.createById ?? 0,
        createDate: apiData.createDate ?? "",
        editById: apiData.editById ?? null,
        editDate: apiData.editDate ?? null,
        editVersion: apiData.editVersion ?? 0,
      }
    },
    []
  )

  // Initialize form with default values or fetched data
  const defaultFormValues = useMemo(() => {
    if (fetchedData) {
      return transformToSchemaType(fetchedData)
    }
    if (openingBalance) {
      return openingBalance
    }
    // Get default values for new opening balance
    const defaults = getDefaultValues(
      Number(companyId),
      user?.userId ? Number(user.userId) : 0,
      dateFormat
    )
    return defaults.defaultOpeningBalanceDetails
  }, [
    fetchedData,
    openingBalance,
    companyId,
    user?.userId,
    dateFormat,
    transformToSchemaType,
  ])

  const form = useForm<GLOpeningBalanceSchemaType>({
    resolver: zodResolver(
      GLOpeningBalanceSchema
    ) as Resolver<GLOpeningBalanceSchemaType>,
    defaultValues: defaultFormValues,
  })

  // Update form when fetched data changes
  useEffect(() => {
    if (fetchedData) {
      const transformed = transformToSchemaType(fetchedData)
      setOpeningBalance(transformed)
      const parsed = parseDate(transformed.accountDate as string)
      setPreviousAccountDate(
        parsed
          ? format(parsed, dateFormat)
          : (transformed.accountDate as string)
      )
      form.reset(transformed)
      form.trigger()
      setSearchNo(transformed.documentNo || "")
    }
  }, [fetchedData, form, dateFormat, transformToSchemaType])

  // Mutations using use-common hooks
  const saveMutation = usePersist<GLOpeningBalanceSchemaType>(
    GLOpeningBalance.add
  )

  // Handle Save
  const handleSaveOpeningBalance = async () => {
    // Prevent double-submit
    if (isSaving || saveMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      // Get form values and validate them
      const formValues = form.getValues()

      // Validate the form data using the schema
      const validationResult = GLOpeningBalanceSchema.safeParse(formValues)

      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error)

        const fieldLabelMap: Record<string, string> = {
          accountDate: "Account Date",
          currencyId: "Currency",
          exhRate: "Exchange Rate",
          totAmt: "Total Amount",
          remarks: "Remarks",
        }
        const failedFields: string[] = []
        validationResult.error.issues.forEach((error) => {
          const pathKey = error.path.join(".")
          const fieldPath = pathKey as keyof GLOpeningBalanceSchemaType
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

      // Check totamt and totlocalamt should not be zero
      if (formValues.totAmt === 0 || formValues.totLocalAmt === 0) {
        toast.error("Total Amount and Total Local Amount should not be zero")
        return
      }

      // Check GL period closed before saving (supports previous account date)
      try {
        const accountDate = formValues.accountDate as unknown as string
        const isNew = Number(formValues.documentId) === 0
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
        accountDate: formatDateForApi(formValues.accountDate) || "",
      }

      const response = await saveMutation.mutateAsync(apiFormValues)

      if (response.result === 1) {
        const openingBalanceData = Array.isArray(response.data)
          ? response.data[0]
          : response.data

        // Transform API response back to form values
        if (openingBalanceData) {
          const updatedSchemaType = transformToSchemaType(
            openingBalanceData as unknown as IGLOpeningBalance
          )

          setSearchNo(updatedSchemaType.documentNo || "")
          setOpeningBalance(updatedSchemaType)
          setDocumentIdToFetch(String(updatedSchemaType.documentId))
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

        toast.success("Opening Balance saved successfully")
      } else {
        toast.error(response.message || "Failed to save opening balance")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving opening balance")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Reset
  const handleOpeningBalanceReset = () => {
    setOpeningBalance(null)
    setSearchNo("")
    setDocumentIdToFetch(undefined)

    // Get current date/time and user name - always set for reset (new opening balance)
    const _currentDateTime = decimals[0]?.longDateFormat
      ? format(new Date(), decimals[0].longDateFormat)
      : format(new Date(), "dd/MM/yyyy HH:mm:ss")

    const defaults = getDefaultValues(
      Number(companyId),
      user?.userId ? Number(user.userId) : 0,
      dateFormat
    )

    form.reset(defaults.defaultOpeningBalanceDetails)
    toast.success("Opening Balance reset successfully")
  }

  const isEdit = !!openingBalance && Number(openingBalance.documentId) !== 0
  const isCancelled = false // Add logic if needed
  const locAmtDec = decimals[0]?.locAmtDec ?? 2

  // Compose title text
  const titleText = isEdit
    ? `GLOpeningBalance (Edit)- v[${openingBalance?.editVersion}] - ${openingBalance?.documentNo}`
    : "GLOpeningBalance (New)"

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
              <TabsTrigger value="history" disabled={!isEdit}>
                History
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {/* Debit/Credit totals (local amount only) - left side of button row */}
              <Badge
                variant="secondary"
                className="border-blue-200 bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
              >
                DebitAmt: {formatNumber(totals.totDebitLocalAmt, locAmtDec)}
              </Badge>
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800"
              >
                CreditAmt: {formatNumber(totals.totCreditLocalAmt, locAmtDec)}
              </Badge>

              <h1>
                {/* Outer wrapper: gradient border or pulsing border */}
                <span
                  className={`relative inline-flex rounded-full p-[2px] transition-all ${
                    isEdit
                      ? "bg-gradient-to-r from-purple-500 to-blue-500"
                      : "animate-pulse bg-gradient-to-r from-purple-500 to-blue-500"
                  } `}
                >
                  <span className="inline-flex cursor-default items-center rounded-full px-3 py-1 text-xs font-medium text-white select-none">
                    {titleText}
                  </span>
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowSaveConfirm(true)}
              disabled={
                !canView ||
                isSaving ||
                saveMutation.isPending ||
                isCancelled ||
                (isEdit && !canEdit) ||
                (!isEdit && !canCreate)
              }
              className={isEdit ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isSaving || saveMutation.isPending ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              {isSaving || saveMutation.isPending
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                  ? "Update"
                  : "Save"}
            </Button>
          </div>
        </div>

        <TabsContent value="main">
          <Main
            form={form}
            onSuccessAction={async () => {
              handleSaveOpeningBalance()
            }}
            isEdit={isEdit}
            companyId={Number(companyId)}
            isCancelled={isCancelled}
            onTotalsChange={setTotals}
          />
        </TabsContent>
        <TabsContent value="history">History</TabsContent>
      </Tabs>

      {/* Save Confirmation */}
      <SaveConfirmation
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        onConfirm={handleSaveOpeningBalance}
        itemName={openingBalance?.documentNo || "New Opening Balance"}
        operationType={
          openingBalance?.documentId && openingBalance.documentId !== "0"
            ? "update"
            : "create"
        }
        isSaving={isSaving || saveMutation.isPending}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => {
          // Handle delete if needed
          setShowDeleteConfirm(false)
        }}
        itemName={openingBalance?.documentNo}
        title="Delete Opening Balance"
        description="Are you sure you want to delete this opening balance?"
        isDeleting={false}
      />

      {/* Reset Confirmation */}
      <ResetConfirmation
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleOpeningBalanceReset}
        itemName={openingBalance?.documentNo}
        title="New Opening Balance"
        description="This will clear all unsaved changes."
      />
    </div>
  )
}
