"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { IJobTransaction } from "@/interfaces"
import { useQueryClient } from "@tanstack/react-query"
import { format, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { Search, X } from "lucide-react"

import { ApJobTransaction } from "@/lib/api-routes"
import { useGetWithDates } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { JobTransactionForm } from "./components/job-transaction-form"
import { JobTransactionTable } from "./components/job-transaction-table"

export default function JobTransactionsPage() {
  const params = useParams()
  const companyId = params?.companyId as string
  const queryClient = useQueryClient()

  const [editRow, setEditRow] = useState<IJobTransaction | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const today = useMemo(() => new Date(), [])
  const defaultStartDate = useMemo(
    () => format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd"),
    [today]
  )
  const defaultEndDate = useMemo(
    () => format(lastDayOfMonth(today), "yyyy-MM-dd"),
    [today]
  )

  const [fromDate, setFromDate] = useState(defaultStartDate)
  const [toDate, setToDate] = useState(defaultEndDate)

  const { data: response, isLoading } = useGetWithDates<IJobTransaction>(
    ApJobTransaction.getList,
    `job-transactions-${companyId}`,
    searchQuery.trim() || undefined,
    fromDate,
    toDate,
    undefined,
    !!companyId && hasSearched
  )

  const list: IJobTransaction[] =
    response?.result === 1 && Array.isArray(response?.data) ? response.data : []

  const handleSearch = useCallback(() => {
    setHasSearched(true)
  }, [])

  const handleCancel = useCallback(() => {
    setHasSearched(false)
    setFromDate(defaultStartDate)
    setToDate(defaultEndDate)
    setSearchQuery("")
  }, [defaultStartDate, defaultEndDate])

  const handleEdit = useCallback((row: IJobTransaction) => {
    setEditRow(row)
    setFormOpen(true)
  }, [])

  const handleFormSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [`job-transactions-${companyId}`],
    })
  }, [queryClient, companyId])

  const handleFormOpenChange = useCallback((open: boolean) => {
    setFormOpen(open)
    if (!open) setEditRow(null)
  }, [])

  return (
    <div className="@container flex flex-1 flex-col p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Job Transactions
        </h1>
        <p className="text-muted-foreground text-sm">
          Update Job Order, Task, Service and Remarks for invoice lines (AP, CB,
          GL). Edit only; no new records.
        </p>
      </div>

      <div className="bg-muted/30 mb-4 flex flex-wrap items-end gap-3 rounded-lg border p-3">
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">
            From Date
          </label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 w-[160px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">
            To Date
          </label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 w-[160px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">
            Search
          </label>
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-9 w-[200px]"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={handleSearch}>
            <Search className="mr-1 h-4 w-4" />
            Search
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
          >
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>

      <JobTransactionTable
        data={list}
        isLoading={isLoading}
        onEdit={handleEdit}
      />
      <JobTransactionForm
        open={formOpen}
        onOpenChangeAction={handleFormOpenChange}
        row={editRow}
        onSuccessAction={handleFormSuccess}
      />
    </div>
  )
}
