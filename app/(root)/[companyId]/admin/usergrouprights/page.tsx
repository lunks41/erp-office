"use client"

import { usePermissionStore } from "@/stores/permission-store"

import { AdminTransactionId, ModuleId } from "@/lib/utils"

import { UserGroupSettingTable } from "./components/usergrouprights-table"

export default function AdminGroupRightsPage() {
  const moduleId = ModuleId.admin
  const transactionIdGroup = AdminTransactionId.userGroupRights

  const { hasPermission } = usePermissionStore()

  const _canEdit = hasPermission(moduleId, transactionIdGroup, "isEdit")
  const _canDelete = hasPermission(moduleId, transactionIdGroup, "isDelete")
  const _canView = hasPermission(moduleId, transactionIdGroup, "isRead")
  const _canCreate = hasPermission(moduleId, transactionIdGroup, "isCreate")

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="mb-2 shrink-0 space-y-1 sm:mb-3">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          Group Rights
        </h1>
        <p className="text-muted-foreground text-sm">Manage group rights</p>
      </div>
      <UserGroupSettingTable />
    </div>
  )
}
