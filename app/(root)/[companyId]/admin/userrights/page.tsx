"use client"

import { usePermissionStore } from "@/stores/permission-store"

import { AdminTransactionId, ModuleId } from "@/lib/utils"

import { UserRightsTable } from "./components/userrights-table"

export default function AdminUserRightsPage() {
  const moduleId = ModuleId.admin
  const transactionIdRights = AdminTransactionId.userRights

  const { hasPermission } = usePermissionStore()

  const _canEdit = hasPermission(moduleId, transactionIdRights, "isEdit")
  const _canDelete = hasPermission(moduleId, transactionIdRights, "isDelete")
  const _canView = hasPermission(moduleId, transactionIdRights, "isRead")
  const _canCreate = hasPermission(moduleId, transactionIdRights, "isCreate")

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          User Rights
        </h1>
        <p className="text-muted-foreground text-sm">Manage user rights</p>
      </div>
      <UserRightsTable />
    </div>
  )
}
