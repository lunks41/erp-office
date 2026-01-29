"use client"

import { useEffect, useMemo, useState } from "react"
import { IInvalidTransaction } from "@/interfaces/history"
import { usePermissionStore } from "@/stores/permission-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse, subMonths } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Inquiry } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { GLTransactionId, ModuleId } from "@/lib/utils"
import { useGetWithDates } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { InvalidTransactionTable } from "./components/invalidtransaction-table"

// Schema for filter form
const filterSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

type FilterFormType = z.infer<typeof filterSchema>

export default function InvalidTransactionInquiryPage() {
  const moduleId = ModuleId.gl
  const transactionId = GLTransactionId.journalentry

  const { hasPermission } = usePermissionStore()
  const canView = hasPermission(moduleId, transactionId, "isRead")

  const [hasSearched, setHasSearched] = useState(false)

  // Calculate default dates: 3 months ago to today
  const today = new Date()
  const threeMonthsAgo = subMonths(today, 3)

  const filterForm = useForm<FilterFormType>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      fromDate: format(threeMonthsAgo, "dd/MM/yyyy"),
      toDate: format(today, "dd/MM/yyyy"),
    },
  })

  const watchedFromDate = filterForm.watch("fromDate")
  const watchedToDate = filterForm.watch("toDate")

  // Format dates for API (yyyy-MM-dd format)
  const fromDate = useMemo(() => {
    if (!watchedFromDate) return undefined
    const date = parse(watchedFromDate, "dd/MM/yyyy", new Date())
    return isValid(date) ? formatDateForApi(date) || undefined : undefined
  }, [watchedFromDate])

  const toDate = useMemo(() => {
    if (!watchedToDate) return undefined
    const date = parse(watchedToDate, "dd/MM/yyyy", new Date())
    return isValid(date) ? formatDateForApi(date) || undefined : undefined
  }, [watchedToDate])

  // API hook for Invalid transaction inquiry using useGetWithDates
  const {
    data: invalidTransactionResponse,
    isLoading: isLoadingInvalidTransaction,
    isRefetching: isRefetchingInvalidTransaction,
    error: invalidTransactionError,
  } = useGetWithDates<IInvalidTransaction>(
    Inquiry.getInvalidTransactionInquiry,
    "invalid-transaction-inquiry",
    undefined, // No search string filter
    fromDate,
    toDate,
    undefined,
    hasSearched && !!fromDate && !!toDate
  )

  useEffect(() => {
    if (invalidTransactionError) {
      console.error(
        "Error fetching Invalid transactions:",
        invalidTransactionError
      )
      toast.error("Failed to load Invalid transactions. Please try again.")
    }
  }, [invalidTransactionError])

  const handleClear = () => {
    setHasSearched(false)
    filterForm.reset({
      fromDate: format(threeMonthsAgo, "dd/MM/yyyy"),
      toDate: format(today, "dd/MM/yyyy"),
    })
  }

  const handleSearchClick = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From Date and To Date")
      return
    }
    setHasSearched(true)
    toast.success("Search initiated")
  }

  const handleRefresh = () => {
    if (hasSearched) {
      setHasSearched(false)
      setTimeout(() => setHasSearched(true), 100)
      toast.success("Data refreshed successfully")
    } else {
      toast.info("Please perform a search first")
    }
  }

  const apiData = useMemo(
    () => (invalidTransactionResponse?.data || []) as IInvalidTransaction[],
    [invalidTransactionResponse?.data]
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
                Invalid Transaction Inquiry
              </h1>
              <p className="text-muted-foreground text-sm">
                Search Invalid transactions
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
          {isRefetchingInvalidTransaction && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-card rounded-lg border p-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Form {...filterForm}>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  From
                </span>
                <CustomDateNew
                  form={filterForm}
                  name="fromDate"
                  isRequired={true}
                  className="w-full sm:w-[150px]"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  To
                </span>
                <CustomDateNew
                  form={filterForm}
                  name="toDate"
                  isRequired={true}
                  className="w-full sm:w-[150px]"
                />
              </div>
            </div>
          </Form>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              onClick={handleSearchClick}
              className="flex items-center gap-1 px-2 sm:px-3"
              size="sm"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">Search</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="flex items-center gap-1 px-2 sm:px-3"
              size="sm"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-card rounded-lg border shadow-sm">
        {isLoadingInvalidTransaction && hasSearched ? (
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">⏳</span>
              <span className="text-sm font-medium">Loading Data</span>
            </div>
            <DataTableSkeleton columnCount={14} />
          </div>
        ) : invalidTransactionError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-600">
              Loading Failed
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Unable to load Invalid transactions. Please check your connection
              and try again.
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
              Select date range above, then click &quot;Search&quot; to find
              Invalid transactions.
            </p>
          </div>
        ) : (
          <div className="p-4">
            <InvalidTransactionTable
              data={apiData}
              isLoading={isRefetchingInvalidTransaction}
              moduleId={moduleId}
              transactionId={transactionId}
              onRefreshAction={handleRefresh}
            />
          </div>
        )}
      </div>
    </div>
  )
}
