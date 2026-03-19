"use client"

import { usePermissionStore } from "@/stores/permission-store"

import { AdminTransactionId, ModuleId } from "@/lib/utils"

import { ShareDataTable } from "../components/sharedata-table"

export default function AdminShareDataPage() {
  const moduleId = ModuleId.admin
  const transactionIdShareData = AdminTransactionId.shareData

  const { hasPermission } = usePermissionStore()

  const _canEdit = hasPermission(moduleId, transactionIdShareData, "isEdit")
  const _canDelete = hasPermission(moduleId, transactionIdShareData, "isDelete")
  const _canView = hasPermission(moduleId, transactionIdShareData, "isRead")
  const _canCreate = hasPermission(moduleId, transactionIdShareData, "isCreate")

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {<ShareDataTable />}
    </div>
  )
}
