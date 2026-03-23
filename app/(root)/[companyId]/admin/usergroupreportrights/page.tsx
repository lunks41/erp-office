"use client"

import { usePermissionStore } from "@/stores/permission-store"

import { AdminTransactionId, ModuleId } from "@/lib/utils"

import { UserGroupReportSettingTable } from "./components/usergroupreportrights-table"

export default function AdminGroupReportRightsPage() {
  const moduleId = ModuleId.admin
  const transactionIdGroup = AdminTransactionId.userGroupReportRights

  const { hasPermission } = usePermissionStore()

  const _canEdit = hasPermission(moduleId, transactionIdGroup, "isEdit")
  const _canDelete = hasPermission(moduleId, transactionIdGroup, "isDelete")
  const _canView = hasPermission(moduleId, transactionIdGroup, "isRead")
  const _canCreate = hasPermission(moduleId, transactionIdGroup, "isCreate")

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          Group Report Rights
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage group report rights
        </p>
      </div>
      <UserGroupReportSettingTable />
    </div>
  )
}
