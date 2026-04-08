"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useParams } from "next/navigation"
import type { IJobOrderHd } from "@/interfaces/checklist"
import { usePermissionStore } from "@/stores/permission-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { JobOrder } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { OperationsStatus } from "@/lib/operations-utils"
import { ModuleId, OperationsTransactionId, cn } from "@/lib/utils"
import { searchJobOrdersDirect } from "@/hooks/use-checklist"
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { ChecklistTable } from "./components/checklist-table"

// Schema for date filter form
const dateFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type DateFilterFormType = z.infer<typeof dateFilterSchema>

export default function ChecklistPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.checklist

  const { hasPermission } = usePermissionStore()

  const _canView = hasPermission(moduleId, transactionId, "isRead")
  const _canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const _canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const _canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const [searchQuery, setSearchQuery] = useState("") // This is used for API calls
  const [searchInput, setSearchInput] = useState("") // This is for the input field only
  const [selectedStatus, setSelectedStatus] = useState("Pending")
  const [isLoading, setIsLoading] = useState(true)
  const [isAllTime, setIsAllTime] = useState(false)
  // When user types in search box → true (fetch all data); when empty → false
  const isAllTimeCommitted = (searchQuery ?? "").trim().length > 0

  // Add this at the top of your component
  const today = new Date()
  const defaultStartDate = new Date(today)
  defaultStartDate.setMonth(today.getMonth() - 6) // Go back 6 months

  // Format dates to YYYY-MM-DD for input fields (using standardized function)
  const formatDateForInput = (date: Date) => formatDateForApi(date) || ""

  // Inside your component state
  const [startDate, setStartDate] = useState(
    formatDateForInput(defaultStartDate)
  )
  const [endDate, setEndDate] = useState(formatDateForInput(today))
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(2000)

  // Initialize form for date filters
  const dateFilterForm = useForm<DateFilterFormType>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: {
      startDate: format(defaultStartDate, "dd/MM/yyyy"),
      endDate: format(today, "dd/MM/yyyy"),
    },
  })

  // API hooks for job order using useGetWithDatesAndPagination
  const {
    data: jobOrderResponse,
    refetch: refetchJobOrder,
    isLoading: isLoadingJobOrder,
    isRefetching: isRefetchingJobOrder,
    error: jobOrderError,
  } = useGetWithDatesAndPagination<IJobOrderHd>(
    JobOrder.get,
    "jobOrderHd",
    searchQuery,
    isAllTimeCommitted ? "" : startDate,
    isAllTimeCommitted ? "" : endDate,
    currentPage,
    pageSize,
    isAllTimeCommitted,
    undefined,
    true
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

  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value) // Only update local input state, no API call
  }

  // Handler to sync startDate from form to state (convert dd/MM/yyyy to YYYY-MM-DD)
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = formatDateForInput(date)
      setStartDate(formattedDate)
    }
  }

  // Handler to sync endDate from form to state (convert dd/MM/yyyy to YYYY-MM-DD)
  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = formatDateForInput(date)
      setEndDate(formattedDate)
    }
  }

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value)
  }

  const handleClear = () => {
    setStartDate(formatDateForInput(defaultStartDate))
    setEndDate(formatDateForInput(today))
    setSearchQuery("") // Clear the search query → isAllTimeCommitted becomes false
    setSearchInput("") // Clear the input field
    setSelectedStatus("All")
    setIsAllTime(false) // Uncheck "All data" when Clear is clicked
    setCurrentPage(1)
    // Reset form values
    dateFilterForm.reset({
      startDate: format(defaultStartDate, "dd/MM/yyyy"),
      endDate: format(today, "dd/MM/yyyy"),
    })
    // Refetch with cleared search
    refetchJobOrder()
  }

  const handleSearchClick = async () => {
    try {
      // Update the searchQuery state which triggers the API call (isAllTimeCommitted derived from searchQuery)
      setSearchQuery(searchInput)

      // Change tab to "All" when searching
      setSelectedStatus("All")

      // Use enhanced search function from api-client.ts
      const searchParams = {
        searchString: searchInput, // Use the input value
        startDate: isAllTime ? "" : startDate,
        endDate: isAllTime ? "" : endDate,
      }

      await searchJobOrdersDirect(searchParams)
      refetchJobOrder()
      toast.success("Search completed successfully")
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Search failed. Please try again.")
    }
  }

  const handleRefresh = () => {
    refetchJobOrder()
    toast.success("Data refreshed successfully")
  }

  const handleAddNew = () => {
    const url = `/${companyId}/operations/checklist/new`
    window.open(url, "_blank")
  }

  // Use API data with proper error handling
  const apiData = useMemo(
    () => jobOrderResponse?.data || [],
    [jobOrderResponse?.data]
  )

  // Get status counts from the API data
  const getStatusCounts = useMemo(() => {
    const counts = {
      All: apiData.length,
      Pending: apiData.filter(
        (job: IJobOrderHd) =>
          job.jobStatusName === OperationsStatus.Pending.toString() &&
          job.isActive === true
      ).length,
      Confirmed: apiData.filter(
        (job: IJobOrderHd) =>
          job.jobStatusName === OperationsStatus.Confirmed.toString() &&
          job.isActive === true
      ).length,
      Completed: apiData.filter(
        (job: IJobOrderHd) =>
          job.jobStatusName === OperationsStatus.Completed.toString() &&
          job.isActive === true
      ).length,
      Cancelled: apiData.filter(
        (job: IJobOrderHd) =>
          job.jobStatusName === OperationsStatus.Cancelled.toString() &&
          job.isActive === true
      ).length,
      "Cancel With Service": apiData.filter(
        (job: IJobOrderHd) =>
          job.jobStatusName === OperationsStatus.CancelWithService.toString() &&
          job.isActive === true
      ).length,
      Posted: apiData.filter(
        (job: IJobOrderHd) =>
          job.jobStatusName === OperationsStatus.Confirmed.toString() &&
          job.isActive === true &&
          job.isPost === true
      ).length,
      InActive: apiData.filter((job: IJobOrderHd) => job.isActive === false)
        .length,
    }
    return counts
  }, [apiData])

  const statusCounts = getStatusCounts

  return (
    <div className="@container mx-auto flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] min-h-0 flex-col gap-1 overflow-hidden px-2 pt-2 pb-2 sm:px-4 lg:px-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                Checklist Management
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage job orders and checklists efficiently
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Total: {statusCounts.All}
          </Badge>
          {isRefetchingJobOrder && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div className="bg-card rounded-lg border p-2 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <Form {...dateFilterForm}>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  From
                </span>
                <CustomDateNew
                  form={dateFilterForm}
                  name="startDate"
                  onChangeEvent={handleStartDateChange}
                  className="w-full sm:w-[150px]"
                  isFutureShow={true}
                  isRequired={!isAllTime}
                  isDisabled={isAllTime}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  To
                </span>
                <CustomDateNew
                  form={dateFilterForm}
                  name="endDate"
                  onChangeEvent={handleEndDateChange}
                  isFutureShow={true}
                  className="w-full sm:w-[150px]"
                  isRequired={!isAllTime}
                  isDisabled={isAllTime}
                />
              </div>
            </Form>
            {/* All data checkbox */}
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={isAllTime}
                onCheckedChange={(checked) => setIsAllTime(checked === true)}
              />
              <span className="text-muted-foreground whitespace-nowrap">
                All data
              </span>
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="text"
                placeholder="Search Jobs..."
                value={searchInput}
                onChange={handleSearchInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchClick()
                  }
                }}
                className="w-full sm:w-[160px]"
              />
              <Button
                onClick={handleSearchClick}
                className="flex items-center gap-1 px-2 sm:px-3"
                size="sm"
              >
                <span>🔍</span>
                <span className="hidden sm:inline">Search</span>
              </Button>
              <Button
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex w-full items-center gap-1 px-2 sm:w-auto sm:px-3"
              size="sm"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="shrink-0">
        <Tabs
          value={selectedStatus}
          onValueChange={handleStatusChange}
          className="space-y-1"
        >
          <TabsList className="w-full">
            {[
              { value: "All", count: statusCounts.All, icon: "📋" },
              { value: "Pending", count: statusCounts.Pending, icon: "⏳" },
              { value: "Completed", count: statusCounts.Completed, icon: "✅" },
              { value: "Cancelled", count: statusCounts.Cancelled, icon: "❌" },
              {
                value: "Cancel With Service",
                count: statusCounts["Cancel With Service"],
                icon: "⚠️",
              },
              { value: "Confirmed", count: statusCounts.Confirmed, icon: "✔️" },
              { value: "Posted", count: statusCounts.Posted, icon: "📤" },
              { value: "InActive", count: statusCounts.InActive, icon: "🚫" },
            ].map(({ value, count, icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="relative flex flex-col items-center space-y-1 px-2 py-3 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">{icon}</span>
                  <span className="hidden sm:inline">{value}</span>
                  <span className="sm:hidden">{value.split(" ")[0]}</span>
                </div>
                <Badge
                  variant={
                    count > 0
                      ? value === "All"
                        ? "default"
                        : value === "Pending"
                          ? "secondary"
                          : value === "Confirmed"
                            ? "default"
                            : value === "Completed"
                              ? "default"
                              : value === "Cancelled"
                                ? "destructive"
                                : value === "Cancel With Service"
                                  ? "secondary"
                                  : value === "Posted"
                                    ? "default"
                                    : value === "InActive"
                                      ? "secondary"
                                      : "default"
                      : "outline"
                  }
                  className={cn(
                    "text-xs font-medium",
                    // Custom colors for different statuses
                    value === "Pending" &&
                      count > 0 &&
                      "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                    value === "Confirmed" &&
                      count > 0 &&
                      "bg-green-100 text-green-800 hover:bg-green-200",
                    value === "Completed" &&
                      count > 0 &&
                      "bg-blue-100 text-blue-800 hover:bg-blue-200",
                    value === "Cancelled" &&
                      count > 0 &&
                      "bg-red-100 text-red-800 hover:bg-red-200",
                    value === "Cancel With Service" &&
                      count > 0 &&
                      "bg-purple-100 text-purple-800 hover:bg-purple-200",
                    value === "Posted" &&
                      count > 0 &&
                      "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
                    value === "InActive" &&
                      count > 0 &&
                      "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  )}
                >
                  {count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Data Table */}
      <div className="bg-card flex min-h-0 flex-1 flex-col rounded-lg border shadow-sm">
        {isLoading || isLoadingJobOrder ? (
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">⏳</span>
              <span className="text-sm font-medium">Loading Data</span>
            </div>
            <DataTableSkeleton columnCount={13} />
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
              Unable to load job orders. Please check your connection and try
              again.
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
        ) : (
          <div className="flex min-h-0 flex-1 flex-col p-2">
            <ChecklistTable
              data={apiData}
              isLoading={isRefetchingJobOrder}
              selectedStatus={selectedStatus}
              moduleId={moduleId}
              transactionId={transactionId}
              onCreateAction={handleAddNew}
              onRefreshAction={handleRefresh}
            />
          </div>
        )}
      </div>
    </div>
  )
}
