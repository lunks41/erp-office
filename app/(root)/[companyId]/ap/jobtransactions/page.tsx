"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { IJobTransaction } from "@/interfaces"
import { useQueryClient } from "@tanstack/react-query"
import { lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { Search, X } from "lucide-react"
import { useForm } from "react-hook-form"

import { ApJobTransaction } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import CustomInput from "@/components/custom/custom-input"
import { CustomDateNew } from "@/components/custom/custom-date-new"

import { JobTransactionForm } from "./components/job-transaction-form"
import { JobTransactionTable } from "./components/job-transaction-table"

interface FilterForm extends Record<string, unknown> {
  fromDate: Date | null
  toDate: Date | null
  search: string
}

export default function JobTransactionsPage() {
  const params = useParams()
  const companyId = params?.companyId as string
  const queryClient = useQueryClient()

  const [editRow, setEditRow] = useState<IJobTransaction | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(2000)

  const today = useMemo(() => new Date(), [])
  const defaultStartDate = useMemo(
    () => startOfMonth(subMonths(today, 1)),
    [today]
  )
  const defaultEndDate = useMemo(() => lastDayOfMonth(today), [today])

  const form = useForm<FilterForm>({
    defaultValues: {
      fromDate: defaultStartDate,
      toDate: defaultEndDate,
      search: "",
    },
  })

  const fromDate = form.watch("fromDate")
  const toDate = form.watch("toDate")
  const searchQuery = form.watch("search")

  const fromDateStr = useMemo(
    () => formatDateForApi(fromDate) ?? "",
    [fromDate]
  )
  const toDateStr = useMemo(() => formatDateForApi(toDate) ?? "", [toDate])

  const { data: response, isLoading } =
    useGetWithDatesAndPagination<IJobTransaction>(
      ApJobTransaction.getList,
      `job-transactions-${companyId}`,
      searchQuery?.trim() || undefined,
      fromDateStr,
      toDateStr,
      currentPage,
      pageSize,
      false,
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
    form.reset({
      fromDate: defaultStartDate,
      toDate: defaultEndDate,
      search: "",
    })
  }, [defaultStartDate, defaultEndDate, form])

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

      <Form {...form}>
        <form
          className="bg-muted/30 mb-4 flex flex-wrap items-end gap-3 rounded-lg border p-3"
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
        >
          <CustomDateNew
            form={form}
            name="fromDate"
            label="From Date"
            className="w-[160px]"
          />
          <CustomDateNew
            form={form}
            name="toDate"
            label="To Date"
            className="w-[160px]"
          />
          <CustomInput
            form={form}
            name="search"
            label="Search"
            placeholder="Search..."
            className="w-[200px]"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
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
        </form>
      </Form>

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
