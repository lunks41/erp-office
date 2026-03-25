"use client"

import { useMemo, useState } from "react"
import { IErrorLog } from "@/interfaces/admin"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"

import { AuditLog } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { useGetWithDates } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import { BasicTable } from "@/components/table/table-basic"

interface ErrorLogTableProps {
  moduleId?: number
  transactionId?: number
}

export function ErrorLogTable({
  moduleId,
  transactionId,
}: ErrorLogTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const today = useMemo(() => new Date(), [])
  const defaultStartDate = useMemo(
    () => format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd"),
    [today]
  )
  const defaultEndDate = useMemo(
    () => format(lastDayOfMonth(today), "yyyy-MM-dd"),
    [today]
  )
  const form = useForm({
    defaultValues: {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      filterSearch: "",
    },
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [searchStartDate, setSearchStartDate] = useState(defaultStartDate)
  const [searchEndDate, setSearchEndDate] = useState(defaultEndDate)
  const [isAllTime, setIsAllTime] = useState(false)
  const [isAllTimeCommitted, setIsAllTimeCommitted] = useState(false)

  const { data: errorLogsResponse, isLoading, isRefetching, refetch } =
    useGetWithDates<IErrorLog>(
      `${AuditLog.geterrorlog}`,
      TableName.errorlog,
      searchQuery,
      searchStartDate,
      searchEndDate,
      undefined,
      true,
      isAllTimeCommitted
    )
  const data = useMemo(() => errorLogsResponse?.data || [], [errorLogsResponse?.data])
  const isLoadingData = isLoading || isRefetching

  const handleSearch = () => {
    const filterSearchValue = form.getValues("filterSearch") ?? ""
    setSearchQuery(filterSearchValue)
    setIsAllTimeCommitted(isAllTime)

    const startDate = form.getValues("startDate")
    const endDate = form.getValues("endDate")

    setSearchStartDate(isAllTime ? "" : formatDateForApi(startDate) || "")
    setSearchEndDate(isAllTime ? "" : formatDateForApi(endDate) || "")
    refetch()
  }

  const handleClear = () => {
    form.setValue("startDate", defaultStartDate)
    form.setValue("endDate", defaultEndDate)
    form.setValue("filterSearch", "")
    setSearchQuery("")
    setIsAllTime(false)
    setIsAllTimeCommitted(false)
    setSearchStartDate(defaultStartDate)
    setSearchEndDate(defaultEndDate)
    refetch()
  }

  const columns: ColumnDef<IErrorLog>[] = [
    {
      accessorKey: "companyName",
      header: "Company",
      size: 200,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "moduleName",
      header: "Module",
      size: 100,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "transactionName",
      header: "Transaction",
      size: 120,
      minSize: 50,
      enableColumnFilter: true,
    },

    {
      accessorKey: "documentNo",
      header: "Document No",
      size: 120,
      minSize: 50,
      enableColumnFilter: true,
    },

    {
      accessorKey: "tblName",
      header: "Table",
      size: 120,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "modeName",
      header: "Mode",
      size: 100,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      size: 250,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "createBy",
      header: "Create By",

      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "createDate",
      header: "Create Date",
      cell: ({ row }) => {
        const raw = row.getValue("createDate")
        let date: Date | null = null
        if (typeof raw === "string") {
          date = new Date(raw)
        } else if (raw instanceof Date) {
          date = raw
        }
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
      size: 180,
      minSize: 150,
    },
  ]

  return (
    <div className="w-full overflow-auto">
      <div className="bg-card mb-2 rounded-lg border p-3">
        <FormProvider {...form}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <span className="text-muted-foreground text-sm font-medium">
                  From:
                </span>
                <CustomDateNew
                  form={form}
                  name="startDate"
                  isRequired={!isAllTime}
                  size="sm"
                  isDisabled={isAllTime}
                />
              </div>
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <span className="text-muted-foreground text-sm font-medium">
                  To:
                </span>
                <CustomDateNew
                  form={form}
                  name="endDate"
                  isRequired={!isAllTime}
                  size="sm"
                  isDisabled={isAllTime}
                />
              </div>
            </div>
            <CustomInput
              form={form}
              name="filterSearch"
              placeholder="Search..."
              className="w-48"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={isAllTime}
                onCheckedChange={(checked) => setIsAllTime(checked === true)}
              />
              <span className="text-muted-foreground whitespace-nowrap">
                All data
              </span>
            </label>
            <Button
              variant="default"
              size="sm"
              onClick={handleSearch}
              disabled={isLoadingData}
            >
              {isLoadingData ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Loading...
                </>
              ) : (
                "Search"
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </FormProvider>
      </div>
      <BasicTable
        data={data}
        columns={columns}
        isLoading={isLoadingData}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.errorlog}
        emptyMessage="No error log found."
        onRefreshAction={refetch}
      />
    </div>
  )
}
