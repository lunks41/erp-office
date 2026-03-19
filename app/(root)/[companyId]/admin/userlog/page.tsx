"use client"

import { useCallback, useState } from "react"
import { IUserLog } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"

import { AuditLog } from "@/lib/api-routes"
import { AdminTransactionId, ModuleId } from "@/lib/utils"
import { useGet } from "@/hooks/use-common"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { UserLogTable } from "../components/userlog-table"

export default function AdminUserLogPage() {
  const moduleId = ModuleId.admin
  const transactionId = AdminTransactionId.notDefine

  const [userLogFilters, setUserLogFilters] = useState<{ search?: string }>({})

  const {
    data: userLogsResponse,
    refetch: refetchUserLogs,
    isLoading: isLoadingUserLogs,
  } = useGet<IUserLog>(
    `${AuditLog.getuserlog}`,
    "userlogs",
    userLogFilters.search
  )

  const { data: userLogsData } =
    (userLogsResponse as ApiResponse<IUserLog>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  const handleFilterChange = useCallback(
    (filters: { search?: string; sortOrder?: string }) => {
      setUserLogFilters(filters)
    },
    []
  )

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            User Logs
          </h1>
          <p className="text-muted-foreground text-sm">View system user logs</p>
        </div>
      </div>

      {isLoadingUserLogs ? (
        <DataTableSkeleton
          columnCount={8}
          filterCount={2}
          cellWidths={[
            "10rem",
            "30rem",
            "10rem",
            "10rem",
            "10rem",
            "10rem",
            "6rem",
            "6rem",
          ]}
          shrinkZero
        />
      ) : (
        <UserLogTable
          data={userLogFilters.search ? [] : userLogsData || []}
          isLoading={isLoadingUserLogs}
          onRefreshAction={refetchUserLogs}
          onFilterChange={handleFilterChange}
          initialSearchValue={userLogFilters.search}
          moduleId={moduleId}
          transactionId={transactionId}
        />
      )}
    </div>
  )
}
