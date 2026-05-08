"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { usePermissionStore } from "@/stores/permission-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { formatDateForApi } from "@/lib/date-utils"
import { APTransactionId, ModuleId } from "@/lib/utils"
import { useGetApTransactionInquiry } from "@/hooks/use-inquiry"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import ApOutStandingTransactionsTable from "@/components/accounttransaction/ap-outstandingtransactions-table"
import {
  CompanySupplierAutocomplete,
  CurrencyAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

// Schema for filter form
const filterSchema = z.object({
  supplierId: z.number().optional(),
  currencyId: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type FilterFormType = z.infer<typeof filterSchema>

export default function ApTransactionInquiryPage() {
  const params = useParams()
  const companyId = Number(params.companyId) || 0
  const moduleId = ModuleId.ap
  const transactionId = APTransactionId.payment

  const { hasPermission } = usePermissionStore()
  const canView = hasPermission(moduleId, transactionId, "isRead")

  const [hasSearched, setHasSearched] = useState(false)

  const today = new Date()
  const defaultStartDate = new Date(today)
  defaultStartDate.setMonth(today.getMonth() - 2)

  const formatDate = (date: Date) => formatDateForApi(date) || ""

  const [startDate, setStartDate] = useState(formatDate(defaultStartDate))
  const [endDate, setEndDate] = useState(formatDate(today))

  const filterForm = useForm<FilterFormType>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      supplierId: undefined,
      currencyId: undefined,
      startDate: format(defaultStartDate, "dd/MM/yyyy"),
      endDate: format(today, "dd/MM/yyyy"),
    },
  })

  const supplierId = filterForm.watch("supplierId")
  const currencyId = filterForm.watch("currencyId")

  // API hook for AP transaction inquiry
  const {
    data: apTransactionResponse,
    refetch: refetchApTransaction,
    isLoading: isLoadingApTransaction,
    isRefetching: isRefetchingApTransaction,
    error: apTransactionError,
  } = useGetApTransactionInquiry(
    undefined,
    supplierId,
    currencyId,
    startDate,
    endDate,
    hasSearched
  )

  useEffect(() => {
    if (apTransactionError) {
      console.error("Error fetching AP transactions:", apTransactionError)
      toast.error("Failed to load AP transactions. Please try again.")
    }
  }, [apTransactionError])

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = formatDate(date)
      setStartDate(formattedDate)
    }
  }

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = formatDate(date)
      setEndDate(formattedDate)
    }
  }

  const handleClear = () => {
    setStartDate(formatDate(defaultStartDate))
    setEndDate(formatDate(today))
    setHasSearched(false)
    filterForm.reset({
      supplierId: undefined,
      currencyId: undefined,
      startDate: format(defaultStartDate, "dd/MM/yyyy"),
      endDate: format(today, "dd/MM/yyyy"),
    })
  }

  const handleSearchClick = () => {
    setHasSearched(true)
    refetchApTransaction()
    toast.success("Search initiated")
  }

  const handleRefresh = () => {
    if (hasSearched) {
      refetchApTransaction()
      toast.success("Data refreshed successfully")
    } else {
      toast.info("Please perform a search first")
    }
  }

  const apiData = useMemo(
    () => apTransactionResponse?.data || [],
    [apTransactionResponse?.data]
  )

  const totalCount = apiData.length

  if (!canView) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold sm:text-2xl">
            Access Denied
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-lg">🔍</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                AP Transaction Inquiry
              </h1>
              <p className="text-muted-foreground text-sm">
                Search AP transactions across all companies
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasSearched && (
            <Badge variant="outline" className="text-xs">
              Total: {totalCount}
            </Badge>
          )}
          {isRefetchingApTransaction && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-card rounded-lg border p-4 shadow-sm">
        <Form {...filterForm}>
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CompanySupplierAutocomplete
                form={filterForm}
                name="supplierId"
                label="Supplier"
                companyId={companyId}
                isRequired={false}
              />
              <CurrencyAutocomplete
                form={filterForm}
                name="currencyId"
                label="Currency"
                isRequired={false}
              />
              <CustomDateNew
                form={filterForm}
                name="startDate"
                label="Start Date"
                onChangeEvent={handleStartDateChange}
              />
              <CustomDateNew
                form={filterForm}
                name="endDate"
                label="End Date"
                onChangeEvent={handleEndDateChange}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSearchClick}
                className="flex items-center gap-2"
              >
                <span>🔍</span>
                <span>Search</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex items-center gap-2"
              >
                <span>🗑️</span>
                <span>Clear</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center gap-2"
                disabled={!hasSearched}
              >
                <span>🔄</span>
                <span>Refresh</span>
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Info Banner */}
      {!hasSearched && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-blue-900 dark:text-blue-100">
                Cross-Company Search
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Select filters and click &quot;Search&quot; to view AP
                transactions across all companies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="bg-card rounded-lg border shadow-sm">
        {isLoadingApTransaction && hasSearched ? (
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">⏳</span>
              <span className="text-sm font-medium">Loading Data</span>
            </div>
            <DataTableSkeleton columnCount={10} />
          </div>
        ) : apTransactionError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-600">
              Loading Failed
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Unable to load AP transactions. Please check your connection and
              try again.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <span>🔄</span>
                Refresh Page
              </Button>
            </div>
          </div>
        ) : !hasSearched ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Ready to Search</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Select filters above and click &quot;Search&quot; to find AP
              transactions across all companies.
            </p>
          </div>
        ) : (
          <div className="p-4">
            <ApOutStandingTransactionsTable
              data={apiData}
              onRefreshAction={handleRefresh}
              onFilterChange={() => {}}
              visible={{
                moduleId: moduleId,
                moduleName: "",
                transactionId: transactionId,
                transactionName: "",
                m_ProductId: false,
                m_QTY: false,
                m_BillQTY: false,
                m_UomId: false,
                m_UnitPrice: false,
                m_Remarks: false,
                m_GstId: false,
                m_GstClaimDate: false,
                m_TrnDate: false,
                m_DeliveryDate: false,
                m_DepartmentId: false,
                m_JobOrderId: false,
                m_EmployeeId: false,
                m_PortId: false,
                m_VesselId: false,
                m_BargeId: false,
                m_VoyageId: false,
                m_SupplyDate: false,
                m_BankId: false,
                m_CtyCurr: false,
                m_PayeeTo: false,
                m_ServiceCategoryId: false,
                m_OtherRemarks: false,
                m_JobOrderIdHd: false,
                m_PortIdHd: false,
                m_VesselIdHd: false,
                m_BargeIdHd: false,
                m_AdvRecAmt: false,
                m_BankChgGLId: false,
                m_InvoiceDate: false,
                m_InvoiceNo: false,
                m_SupplierName: false,
                m_GstNo: false,
                m_DebitNoteNo: false,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
