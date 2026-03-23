"use client"

import { AdminTransactionId, ModuleId } from "@/lib/utils"

import { UserLogTable } from "./components/userlog-table"

export default function AdminUserLogPage() {
  const moduleId = ModuleId.admin
  const transactionId = AdminTransactionId.notDefine

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

      <UserLogTable moduleId={moduleId} transactionId={transactionId} />
    </div>
  )
}
