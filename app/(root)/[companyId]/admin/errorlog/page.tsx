"use client"

import { useCallback, useState } from "react"
import { IErrorLog } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"

import { AuditLog } from "@/lib/api-routes"
import { AdminTransactionId, ModuleId } from "@/lib/utils"
import { useGet } from "@/hooks/use-common"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { ErrorLogTable } from "../components/errorlog-table"

export default function AdminErrorLogPage() {
  const moduleId = ModuleId.admin
  const transactionId = AdminTransactionId.notDefine

  const [errorLogFilters, setErrorLogFilters] = useState<{ search?: string }>(
    {}
  )

  const {
    data: errorLogsResponse,
    refetch: refetchErrorLogs,
    isLoading: isLoadingErrorLogs,
  } = useGet<IErrorLog>(
    `${AuditLog.geterrorlog}`,
    "errorlogs",
    errorLogFilters.search
  )

  const { data: errorLogsData } =
    (errorLogsResponse as ApiResponse<IErrorLog>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  const handleFilterChange = useCallback(
    (filters: { search?: string; sortOrder?: string }) => {
      setErrorLogFilters(filters)
    },
    []
  )

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Error Logs
          </h1>
          <p className="text-muted-foreground text-sm">
            View system error logs
          </p>
        </div>
      </div>

      {isLoadingErrorLogs ? (
        <DataTableSkeleton
          columnCount={7}
          filterCount={2}
          cellWidths={[
            "10rem",
            "30rem",
            "10rem",
            "10rem",
            "10rem",
            "10rem",
            "6rem",
          ]}
          shrinkZero
        />
      ) : (
        <ErrorLogTable
          data={errorLogFilters.search ? [] : errorLogsData || []}
          isLoading={isLoadingErrorLogs}
          onRefreshAction={refetchErrorLogs}
          onFilterChange={handleFilterChange}
          moduleId={moduleId}
          transactionId={transactionId}
        />
      )}
    </div>
  )
}
