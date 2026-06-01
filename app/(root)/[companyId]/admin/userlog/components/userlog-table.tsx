"use client"

import { useMemo, useState } from "react"
import { IUserLog } from "@/interfaces/admin"
import { useCompanyStore } from "@/stores/company-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"

import { AuditLog } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { useGetWithDates } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import { BasicTable } from "@/components/table/table-basic"

interface UserLogTableProps {
  moduleId?: number
  transactionId?: number
}

export function UserLogTable({
  moduleId,
  transactionId,
}: UserLogTableProps) {
  const { decimals } = useCompanyStore()
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
  const { data: userLogsResponse, isLoading, isRefetching, refetch } =
    useGetWithDates<IUserLog>(
      `${AuditLog.getuserlog}`,
      TableName.userlog,
      searchQuery,
      searchStartDate,
      searchEndDate,
      undefined,
      true,
      isAllTimeCommitted
    )
  const data = useMemo(() => userLogsResponse?.data || [], [userLogsResponse?.data])
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

  const columns: ColumnDef<IUserLog>[] = [
    {
      accessorKey: "userName",
      header: "User",
      size: 200,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "isLogin",
      header: "Login",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isLogin") ? "default" : "destructive"}>
          {row.getValue("isLogin") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isLogin") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "loginDate",
      header: "Login Date",
      cell: ({ row }) => {
        const raw = row.getValue("loginDate")
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
    {
      accessorKey: "remarks",
      header: "Remarks",
      size: 250,
      minSize: 50,
      enableColumnFilter: true,
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
                  isFutureShow={true}
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
                  isFutureShow={true}
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
        tableName={TableName.userlog}
        emptyMessage="No user log found."
        onRefreshAction={refetch}
      />
    </div>
  )
}
