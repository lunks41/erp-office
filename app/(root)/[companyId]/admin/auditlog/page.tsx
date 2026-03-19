"use client"

import { useCallback, useState } from "react"
import { IAuditLog } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"

import { AuditLog } from "@/lib/api-routes"
import { AdminTransactionId, ModuleId } from "@/lib/utils"
import { useGet } from "@/hooks/use-common"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { AuditLogTable } from "../components/auditlog-table"

export default function AdminAuditLogPage() {
  const moduleId = ModuleId.admin
  const transactionId = AdminTransactionId.notDefine

  const [auditLogFilters, setAuditLogFilters] = useState<{ search?: string }>(
    {}
  )

  const {
    data: auditLogsResponse,
    refetch: refetchAuditLogs,
    isLoading: isLoadingAuditLogs,
  } = useGet<IAuditLog>(
    `${AuditLog.getauditlog}`,
    "auditlogs",
    auditLogFilters.search
  )

  const { data: auditLogsData } =
    (auditLogsResponse as ApiResponse<IAuditLog>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  const handleFilterChange = useCallback(
    (filters: { search?: string; sortOrder?: string }) => {
      setAuditLogFilters(filters)
    },
    []
  )

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm">
            View system audit logs
          </p>
        </div>
      </div>

      {isLoadingAuditLogs ? (
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
        <AuditLogTable
          data={auditLogFilters.search ? [] : auditLogsData || []}
          isLoading={isLoadingAuditLogs}
          onRefreshAction={refetchAuditLogs}
          onFilterChange={handleFilterChange}
          moduleId={moduleId}
          transactionId={transactionId}
        />
      )}
    </div>
  )
}
