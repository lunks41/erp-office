"use client"

import { UserWiseSettingTable } from "./components/userwiserights-table"

export default function AdminUserWiseRightsPage() {
  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          User Wise Rights
        </h1>
        <p className="text-muted-foreground text-sm">Manage user-wise rights</p>
      </div>
      <UserWiseSettingTable />
    </div>
  )
}
