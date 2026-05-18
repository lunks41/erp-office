"use client"

import type { IUserGroupHierarchy } from "@/interfaces/admin"
import { ColumnDef } from "@tanstack/react-table"
import { TableName } from "@/lib/utils"
import { MainTable } from "@/components/table/table-main"
import { IconArrowRight } from "@tabler/icons-react"

interface HierarchyTableProps {
  data: IUserGroupHierarchy[]
  isLoading?: boolean
  onEditAction?: (item: IUserGroupHierarchy) => void
  onRefreshAction?: () => void
  moduleId?: number
  transactionId?: number
  canEdit?: boolean
}

export function HierarchyTable({
  data,
  isLoading = false,
  onEditAction,
  onRefreshAction,
  moduleId,
  transactionId,
  canEdit = true,
}: HierarchyTableProps) {
  const columns: ColumnDef<IUserGroupHierarchy>[] = [
    {
      accessorKey: "groupCode",
      header: "Group Code",
      size: 130,
      minSize: 80,
    },
    {
      accessorKey: "groupName",
      header: "Group Name",
      size: 220,
      minSize: 120,
    },
    {
      id: "arrow",
      header: "",
      size: 40,
      cell: () => (
        <div className="flex justify-center">
          <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      ),
    },
    {
      accessorKey: "parentGroupCode",
      header: "Notifies (Code)",
      size: 130,
      minSize: 80,
    },
    {
      accessorKey: "parentGroupName",
      header: "Notifies Group",
      size: 220,
      minSize: 120,
    },
  ]

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.company}
      emptyMessage="No group hierarchy configured."
      accessorId="id"
      onRefreshAction={onRefreshAction}
      onEditAction={onEditAction}
      showHeader
      showFooter
      showActions
      canEdit={canEdit}
      canDelete={false}
      canView={false}
      canCreate={false}
    />
  )
}
