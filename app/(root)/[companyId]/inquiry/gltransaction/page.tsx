"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { IGlTransactionDetails } from "@/interfaces/history"
import { useCompanyStore } from "@/stores/company-store"
import { usePermissionStore } from "@/stores/permission-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { CellContext, ColumnDef } from "@tanstack/react-table"
import { z } from "zod"

import { formatDateForApi } from "@/lib/date-utils"
import { GLTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetGlTransactionInquiry } from "@/hooks/use-inquiry"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import ChartOfAccountMultiSelect from "@/components/multiselection-chartofaccountv1"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { BasicTable } from "@/components/table/table-basic"

type ExtendedColumnDef<T> = ColumnDef<T> & {
  hidden?: boolean
}

// Schema for filter form
const filterSchema = z.object({
  glIds: z.array(z.number()).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

type FilterFormType = z.infer<typeof filterSchema>

export default function GlTransactionInquiryPage() {
  const params = useParams()
  const companyId = Number(params.companyId) || 0
  const moduleId = ModuleId.gl
  const transactionId = GLTransactionId.journalentry

  const { hasPermission } = usePermissionStore()
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const { decimals } = useCompanyStore()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"

  const [hasSearched, setHasSearched] = useState(false)

  const today = new Date()
  const defaultFromDate = new Date(today)
  defaultFromDate.setMonth(today.getMonth() - 2)

  const formatDate = (date: Date) => formatDateForApi(date) || ""

  const [fromDate, setFromDate] = useState(formatDate(defaultFromDate))
  const [toDate, setToDate] = useState(formatDate(today))

  const filterForm = useForm<FilterFormType>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      glIds: undefined,
      fromDate: format(defaultFromDate, "dd/MM/yyyy"),
      toDate: format(today, "dd/MM/yyyy"),
    },
  })

  const glIds = filterForm.watch("glIds") as number[] | undefined

  // API hook for GL transaction inquiry
  const {
    data: glTransactionResponse,
    refetch: refetchGlTransaction,
    isLoading: isLoadingGlTransaction,
    isRefetching: isRefetchingGlTransaction,
    error: glTransactionError,
  } = useGetGlTransactionInquiry(
    undefined,
    glIds,
    fromDate,
    toDate,
    hasSearched
  )

  useEffect(() => {
    if (glTransactionError) {
      console.error("Error fetching GL transactions:", glTransactionError)
      toast.error("Failed to load GL transactions. Please try again.")
    }
  }, [glTransactionError])

  const handleFromDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = formatDate(date)
      setFromDate(formattedDate)
    }
  }

  const handleToDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = formatDate(date)
      setToDate(formattedDate)
    }
  }

  const handleClear = () => {
    setFromDate(formatDate(defaultFromDate))
    setToDate(formatDate(today))
    setHasSearched(false)
    filterForm.reset({
      glIds: undefined,
      fromDate: format(defaultFromDate, "dd/MM/yyyy"),
      toDate: format(today, "dd/MM/yyyy"),
    })
  }

  const handleSearchClick = () => {
    setHasSearched(true)
    refetchGlTransaction()
    toast.success("Search initiated")
  }

  const handleRefresh = () => {
    if (hasSearched) {
      refetchGlTransaction()
      toast.success("Data refreshed successfully")
    } else {
      toast.info("Please perform a search first")
    }
  }

  const apiData = useMemo(
    () => glTransactionResponse?.data || [],
    [glTransactionResponse?.data]
  )

  const totalCount = apiData.length

  // Define columns for GL transaction table
  const columns: ExtendedColumnDef<IGlTransactionDetails>[] = useMemo(
    () => [
      {
        accessorKey: "documentNo",
        header: "Document No",
      },
      {
        accessorKey: "referenceNo",
        header: "Reference No",
      },
      {
        accessorKey: "accountDate",
        header: "Account Date",
        cell: ({ row }: CellContext<IGlTransactionDetails, unknown>) => {
          const date = row.original.accountDate
            ? new Date(row.original.accountDate)
            : null
          return date ? format(date, dateFormat) : "-"
        },
      },
      {
        accessorKey: "glCode",
        header: "GL Code",
      },
      {
        accessorKey: "glName",
        header: "GL Name",
      },
      {
        accessorKey: "isDebit",
        header: "Type",
        cell: ({ row }: CellContext<IGlTransactionDetails, unknown>) => (
          <Badge variant={row.original.isDebit ? "default" : "secondary"}>
            {row.original.isDebit ? "Debit" : "Credit"}
          </Badge>
        ),
      },
      {
        accessorKey: "totAmt",
        header: "Amount",
        cell: ({ row }: CellContext<IGlTransactionDetails, unknown>) => {
          const amount = row.original.totAmt || 0
          return amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        },
      },
      {
        accessorKey: "totLocalAmt",
        header: "Local Amount",
        cell: ({ row }: CellContext<IGlTransactionDetails, unknown>) => {
          const amount = row.original.totLocalAmt || 0
          return amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        },
      },
      {
        accessorKey: "currencyCode",
        header: "Currency",
      },
      {
        accessorKey: "exhRate",
        header: "Exchange Rate",
        cell: ({ row }: CellContext<IGlTransactionDetails, unknown>) => {
          const rate = row.original.exhRate || 0
          return rate.toLocaleString(undefined, {
            minimumFractionDigits: 6,
            maximumFractionDigits: 6,
          })
        },
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
      },
      {
        accessorKey: "moduleFrom",
        header: "Module",
      },
      {
        accessorKey: "createBy",
        header: "Created By",
      },
      {
        accessorKey: "createDate",
        header: "Created Date",
        cell: ({ row }: CellContext<IGlTransactionDetails, unknown>) => {
          const date = row.original.createDate
            ? new Date(row.original.createDate)
            : null
          return date ? format(date, dateFormat) : "-"
        },
      },
    ],
    [dateFormat]
  )

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
                GL Transaction Inquiry
              </h1>
              <p className="text-muted-foreground text-sm">
                Search GL transactions across all companies
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
          {isRefetchingGlTransaction && (
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ChartOfAccountMultiSelect
                form={filterForm}
                name="glIds"
                label="GL Code (Multi Selection)"
                companyId={companyId}
                isRequired={false}
              />
              <CustomDateNew
                form={filterForm}
                name="fromDate"
                label="From Date"
                onChangeEvent={handleFromDateChange}
              />
              <CustomDateNew
                form={filterForm}
                name="toDate"
                label="To Date"
                onChangeEvent={handleToDateChange}
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
        <div className="rounded-lg border border-border bg-card p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-foreground dark:text-blue-100">
                Cross-Company Search
              </h3>
              <p className="text-sm text-primary dark:text-blue-200">
                Select GL codes and date range, then click &quot;Search&quot; to
                view GL transactions across all companies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="bg-card rounded-lg border shadow-sm">
        {isLoadingGlTransaction && hasSearched ? (
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">⏳</span>
              <span className="text-sm font-medium">Loading Data</span>
            </div>
            <DataTableSkeleton columnCount={14} />
          </div>
        ) : glTransactionError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-600">
              Loading Failed
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Unable to load GL transactions. Please check your connection and
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
              Select GL codes and date range above, then click
              &quot;Search&quot; to find GL transactions across all companies.
            </p>
          </div>
        ) : (
          <div className="p-4">
            <BasicTable
              data={apiData}
              columns={columns}
              isLoading={isRefetchingGlTransaction}
              moduleId={moduleId}
              transactionId={transactionId}
              tableName={TableName.glPostDetails}
              emptyMessage="No GL transactions found."
              onRefreshAction={handleRefresh}
              showHeader={true}
              showFooter={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}
