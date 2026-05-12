"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useParams } from "next/navigation"
import { usePermissionStore } from "@/stores/permission-store"
import { toast } from "sonner"

import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import {
  useGetChecklistInquiry,
  useGetCustomerInvoiceInquiry,
} from "@/hooks/use-inquiry"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { InquiryTable } from "./components/checklist-table"
import { CustomerInvoiceTable } from "./components/customerinvoice-table"

export default function InquiryPage() {
  const params = useParams()
  const _companyId = params.companyId as string
  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.checklist

  const { hasPermission } = usePermissionStore()

  const canView = hasPermission(moduleId, transactionId, "isRead")

  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeTab, setActiveTab] = useState("checklist")

  // API hooks for checklist inquiry across all companies (no date filters)
  const {
    data: jobOrderResponse,
    refetch: refetchJobOrder,
    isLoading: isLoadingJobOrder,
    isRefetching: isRefetchingJobOrder,
    error: jobOrderError,
  } = useGetChecklistInquiry(searchQuery, hasSearched)

  // API hooks for customer invoice across all companies (no date filters for checklist page)
  const {
    data: customerInvoiceResponse,
    refetch: refetchCustomerInvoice,
    isLoading: isLoadingCustomerInvoice,
    isRefetching: isRefetchingCustomerInvoice,
    error: customerInvoiceError,
  } = useGetCustomerInvoiceInquiry(
    searchQuery,
    undefined,
    undefined,
    hasSearched
  )

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Handle API errors
  useEffect(() => {
    if (jobOrderError) {
      console.error("Error fetching job orders:", jobOrderError)
      toast.error("Failed to load job orders. Please try refreshing the page.")
    }
  }, [jobOrderError])

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleClear = () => {
    setSearchQuery("")
    setHasSearched(false)
  }

  const handleSearchClick = () => {
    setHasSearched(true)
    refetchJobOrder()
    toast.success("Search initiated")
  }

  const handleRefresh = () => {
    if (hasSearched) {
      if (activeTab === "checklist") {
        refetchJobOrder()
      } else {
        refetchCustomerInvoice()
      }
      toast.success("Data refreshed successfully")
    } else {
      toast.info("Please perform a search first")
    }
  }

  // Use API data with proper error handling
  const apiData = useMemo(
    () => jobOrderResponse?.data || [],
    [jobOrderResponse?.data]
  )

  // Customer invoice data
  const customerInvoiceData = useMemo(
    () => customerInvoiceResponse?.data || [],
    [customerInvoiceResponse?.data]
  )

  // Get total count
  const totalCount = apiData.length
  const customerInvoiceCount = customerInvoiceData.length

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
                Job Order Inquiry
              </h1>
              <p className="text-muted-foreground text-sm">
                Search across all companies
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasSearched && (
            <Badge variant="outline" className="text-xs">
              Total:{" "}
              {activeTab === "checklist" ? totalCount : customerInvoiceCount}
            </Badge>
          )}
          {(isRefetchingJobOrder || isRefetchingCustomerInvoice) && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Simple Search Section */}
      <div className="bg-card rounded-lg border p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-muted-foreground text-xs">🔎</span>
            <Input
              type="text"
              placeholder={
                activeTab === "checklist"
                  ? "Search Job Orders..."
                  : "Search Customer Invoices..."
              }
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchClick()
                }
              }}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSearchClick}
              className="flex w-full items-center gap-2 sm:w-auto"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">Search</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex w-full items-center gap-2 sm:w-auto"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Clear</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex w-full items-center gap-2 sm:w-auto"
              disabled={!hasSearched}
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {!hasSearched && (
        <div className="rounded-lg border border-border bg-card p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-foreground dark:text-blue-100">
                Cross-Company Search
              </h3>
              <p className="text-sm text-primary dark:text-blue-200">
                This inquiry screen searches across all companies. Select a tab
                (Checklist or Customer) and enter search criteria, then click
                &quot;Search&quot; to view results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
        </TabsList>

        {/* Checklist Tab Content */}
        <TabsContent value="checklist" className="mt-0">
          <div className="bg-card rounded-lg border shadow-sm">
            {isLoading ||
            (isLoadingJobOrder && hasSearched && activeTab === "checklist") ? (
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">⏳</span>
                  <span className="text-sm font-medium">Loading Data</span>
                </div>
                <DataTableSkeleton columnCount={14} />
              </div>
            ) : jobOrderError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <span className="text-2xl">❌</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-red-600">
                  Loading Failed
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Unable to load job orders. Please check your connection and
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
                  <Button
                    variant="destructive"
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    <span>🔄</span>
                    Reload Page
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
                  Enter your search criteria above and click &quot;Search&quot;
                  to find job orders across all companies.
                </p>
              </div>
            ) : (
              <div className="p-4">
                <InquiryTable
                  data={apiData}
                  isLoading={isRefetchingJobOrder}
                  moduleId={moduleId}
                  transactionId={transactionId}
                  onRefreshAction={handleRefresh}
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Customer Tab Content */}
        <TabsContent value="customer" className="mt-0">
          <div className="bg-card rounded-lg border shadow-sm">
            {isLoading ||
            (isLoadingCustomerInvoice &&
              hasSearched &&
              activeTab === "customer") ? (
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">⏳</span>
                  <span className="text-sm font-medium">Loading Data</span>
                </div>
                <DataTableSkeleton columnCount={10} />
              </div>
            ) : customerInvoiceError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <span className="text-2xl">❌</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-red-600">
                  Loading Failed
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Unable to load customer invoices. Please check your connection
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
                  <Button
                    variant="destructive"
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    <span>🔄</span>
                    Reload Page
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
                  Enter your search criteria above and click &quot;Search&quot;
                  to find customer invoices across all companies.
                </p>
              </div>
            ) : (
              <div className="p-4">
                <CustomerInvoiceTable
                  data={customerInvoiceData}
                  isLoading={isRefetchingCustomerInvoice}
                  moduleId={moduleId}
                  transactionId={transactionId}
                  onRefreshAction={handleRefresh}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
