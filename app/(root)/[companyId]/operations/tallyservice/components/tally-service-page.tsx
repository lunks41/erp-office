"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react"
import { useParams } from "next/navigation"
import { ITallyService } from "@/interfaces"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { TallyService } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { cn, ModuleId, OperationsTransactionId } from "@/lib/utils"
import { useDelete, useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

import { TallyServiceTable } from "./tally-service-table"
import {
  extractRows,
  getTallyStatusCounts,
  normalizeTallyService,
  openTallyServiceTab,
  TALLY_STATUS_BADGE_CLASSNAME,
  TALLY_STATUS_TAB_CLASSNAME,
  TALLY_STATUS_TABS,
  type TallyStatusTab,
} from "./tally-service-utils"

const dateFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isAllTime: z.boolean().optional(),
})

type DateFilterFormType = z.infer<typeof dateFilterSchema>

export function TallyServicePage() {
  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.tallyService

  const params = useParams()
  const companyId = params.companyId as string
  const numericCompanyId = Number(companyId) || 0
  const queryClient = useQueryClient()
  const { hasPermission } = usePermissionStore()

  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<TallyStatusTab>("All")
  const [isLocked, setIsLocked] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(2000)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    item: ITallyService | null
  }>({
    isOpen: false,
    item: null,
  })

  const isAllTimeCommitted = (searchQuery ?? "").trim().length > 0

  const today = new Date()
  const defaultStartDate = new Date(today)
  defaultStartDate.setMonth(today.getMonth() - 6)

  const formatDateForInput = (date: Date) => formatDateForApi(date) || ""

  const [startDate, setStartDate] = useState(
    formatDateForInput(defaultStartDate)
  )
  const [endDate, setEndDate] = useState(formatDateForInput(today))

  const dateFilterForm = useForm<DateFilterFormType>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: {
      startDate: format(defaultStartDate, "dd/MM/yyyy"),
      endDate: format(today, "dd/MM/yyyy"),
      isAllTime: false,
    },
  })

  const isAllTime = dateFilterForm.watch("isAllTime") ?? false
  const isAllTimeForApi = isAllTimeCommitted || isAllTime

  const {
    data: tallyServicesResponse,
    refetch,
    isLoading,
    isRefetching,
    error: tallyServicesError,
  } = useGetWithDatesAndPagination<ITallyService>(
    TallyService.get,
    "tallyServices",
    searchQuery,
    isAllTimeForApi ? "" : startDate,
    isAllTimeForApi ? "" : endDate,
    currentPage,
    pageSize,
    isAllTimeForApi,
    undefined,
    true
  )

  useEffect(() => {
    if (!tallyServicesResponse) return

    if (tallyServicesResponse.result === -1) {
      setSearchQuery("")
      setSearchInput("")
    } else if (tallyServicesResponse.result === -2 && !isLocked) {
      setIsLocked(true)
    } else if (tallyServicesResponse.result !== -2) {
      setIsLocked(false)
    }
  }, [isLocked, tallyServicesResponse])

  useEffect(() => {
    if (tallyServicesError) {
      console.error("Error fetching tally services:", tallyServicesError)
      toast.error(
        "Failed to load tally services. Please try refreshing the page."
      )
    }
  }, [tallyServicesError])

  const listData = useMemo(() => {
    const rows = extractRows(tallyServicesResponse?.data)
    return rows
      .map((item) => normalizeTallyService(item, numericCompanyId))
      .filter((item): item is ITallyService => !!item)
  }, [numericCompanyId, tallyServicesResponse?.data])

  const statusCounts = useMemo(() => getTallyStatusCounts(listData), [listData])
  const deleteMutation = useDelete(TallyService.delete)

  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(formatDateForInput(date))
    }
  }

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setEndDate(formatDateForInput(date))
    }
  }

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as TallyStatusTab)
  }

  const handleClear = () => {
    setStartDate(formatDateForInput(defaultStartDate))
    setEndDate(formatDateForInput(today))
    setSearchQuery("")
    setSearchInput("")
    setSelectedStatus("All")
    setCurrentPage(1)
    dateFilterForm.reset({
      startDate: format(defaultStartDate, "dd/MM/yyyy"),
      endDate: format(today, "dd/MM/yyyy"),
      isAllTime: false,
    })
    refetch()
  }

  const handleSearchClick = () => {
    setSearchQuery(searchInput)
    setSelectedStatus("All")
    setCurrentPage(1)
    refetch()
    toast.success("Search completed successfully")
  }

  const handleRefresh = () => {
    refetch()
    toast.success("Data refreshed successfully")
  }

  const handleCreate = useCallback(() => {
    openTallyServiceTab(companyId)
  }, [companyId])

  const handleOpenRecord = useCallback(
    (item: ITallyService) => {
      openTallyServiceTab(companyId, item.tallyServiceId)
    },
    [companyId]
  )

  const handleDeleteRequest = (item: ITallyService) => {
    setDeleteConfirmation({
      isOpen: true,
      item,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.item) return

    await deleteMutation.mutateAsync(
      deleteConfirmation.item.tallyServiceId.toString()
    )
    await queryClient.invalidateQueries({ queryKey: ["tallyServices"] })
    setDeleteConfirmation({ isOpen: false, item: null })
  }

  const isAccessDenied =
    tallyServicesResponse?.result === -2 ||
    (!canView && !canEdit && !canDelete && !canCreate)

  return (
    <div className="@container mx-auto flex min-h-[calc(100dvh-7rem)] flex-col gap-1 overflow-hidden px-2 pt-2 pb-2 sm:px-4 lg:px-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-lg">🧾</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                Tally Service
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage standalone tally service records and related service
                timings.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Total: {statusCounts.All}
          </Badge>
          {isRefetching && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      {!isAccessDenied && (
        <div className="bg-card rounded-lg border p-2 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Form {...dateFilterForm}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
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
                  <CustomCheckbox
                    form={dateFilterForm}
                    name="isAllTime"
                    label="All data"
                    labelPosition="side"
                  />
                </div>
              </Form>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  placeholder="Search Tally Services..."
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
      )}

      {/* Status Tabs */}
      {!isLoading && !isAccessDenied && (
        <div className="shrink-0">
          <Tabs
            value={selectedStatus}
            onValueChange={handleStatusChange}
            className="space-y-1"
          >
            <TabsList className="w-full">
              {TALLY_STATUS_TABS.map(({ value, icon }) => {
                const count = statusCounts[value]

                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={cn(
                      "relative flex flex-col items-center space-y-1 px-2 py-3 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm",
                      TALLY_STATUS_TAB_CLASSNAME[value]
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{icon}</span>
                      <span className="hidden sm:inline">{value}</span>
                      <span className="sm:hidden">{value.split(" ")[0]}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium",
                        count > 0
                          ? TALLY_STATUS_BADGE_CLASSNAME[value]
                          : "border-border bg-background text-muted-foreground"
                      )}
                    >
                      {count}
                    </Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">⏳</span>
              <span className="text-sm font-medium">Loading Data</span>
            </div>
            <DataTableSkeleton columnCount={8} />
          </div>
        ) : isAccessDenied ? (
          <LockSkeleton locked={true}>
            <div className="p-2">
              <TallyServiceTable
                companyId={companyId}
                data={[]}
                isLoading={false}
                selectedStatus={selectedStatus}
                onOpenRecord={() => {}}
                onDeleteAction={() => {}}
                onEditAction={() => {}}
                onCreateAction={() => {}}
                onRefreshAction={() => {}}
                moduleId={moduleId}
                transactionId={transactionId}
                canView={false}
                canCreate={false}
                canEdit={false}
                canDelete={false}
              />
            </div>
          </LockSkeleton>
        ) : tallyServicesError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-600">
              Loading Failed
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Unable to load tally services. Please check your connection and try
              again.
            </p>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <span>🔄</span>
              Refresh Page
            </Button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">
            <TallyServiceTable
              companyId={companyId}
              data={listData}
              isLoading={isRefetching}
              selectedStatus={selectedStatus}
              onOpenRecord={canView ? handleOpenRecord : undefined}
              onDeleteAction={canDelete ? handleDeleteRequest : undefined}
              onEditAction={canEdit ? handleOpenRecord : undefined}
              onCreateAction={canCreate ? handleCreate : undefined}
              onRefreshAction={handleRefresh}
              moduleId={moduleId}
              transactionId={transactionId}
              canView={canView}
              canCreate={canCreate}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </div>
        )}
      </div>

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Cancel Tally Service"
        itemName={
          deleteConfirmation.item?.chargeName ||
          (deleteConfirmation.item
            ? `Tally Service #${deleteConfirmation.item.tallyServiceId}`
            : "")
        }
        description="This will mark the tally service as cancelled. It cannot be cancelled if an invoice has already been generated."
        onConfirm={handleDeleteConfirm}
        onCancelAction={() =>
          setDeleteConfirmation({ isOpen: false, item: null })
        }
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
