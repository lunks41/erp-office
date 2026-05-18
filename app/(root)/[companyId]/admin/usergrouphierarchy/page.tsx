"use client"

import { useCallback, useMemo, useState } from "react"
import type { IUserGroupHierarchy } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { UserGroupHierarchy } from "@/lib/api-routes"
import { AdminTransactionId, ModuleId } from "@/lib/utils"
import { useGet, usePersist } from "@/hooks/use-common"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { HierarchyTable } from "./components/hierarchy-table"
import { HierarchyForm } from "./components/hierarchy-form"
import { HierarchyTree } from "./components/hierarchy-tree"

const QUERY_KEY = "user-group-hierarchy"

export default function UserGroupHierarchyPage() {
  const moduleId = ModuleId.admin
  const transactionId = AdminTransactionId.userGroupHierarchy

  const { hasPermission } = usePermissionStore()
  const queryClient = useQueryClient()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")

  const {
    data: listResponse,
    refetch,
    isLoading,
  } = useGet<IUserGroupHierarchy>(UserGroupHierarchy.get, QUERY_KEY)

  const { data: listRaw } =
    (listResponse as ApiResponse<IUserGroupHierarchy>) ?? { data: [] }

  const gridData: IUserGroupHierarchy[] = useMemo(
    () => listRaw ?? [],
    [listRaw],
  )

  const saveMutation = usePersist(UserGroupHierarchy.save)

  const [selectedItem, setSelectedItem] = useState<
    IUserGroupHierarchy | undefined
  >(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleEdit = useCallback((item: IUserGroupHierarchy) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }, [])

  const handleSubmit = async (groupId: number, parentGroupId: number) => {
    try {
      const response = await saveMutation.mutateAsync({ groupId, parentGroupId })
      if (response.result === 1) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
        setIsModalOpen(false)
      }
    } catch {
      // mutation handles toast
    }
  }

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          User Group Notification Hierarchy
        </h1>
        <p className="text-muted-foreground text-sm">
          Define which groups receive notifications when a lower-level group
          performs an action (e.g. unpost invoice). Notifications flow upward
          through the hierarchy to ADMIN.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Table — 2/3 width on xl */}
        <div className="xl:col-span-2 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Group Parent Assignments
          </p>
          {isLoading ? (
            <DataTableSkeleton
              columnCount={5}
              filterCount={1}
              cellWidths={["8rem", "14rem", "3rem", "8rem", "14rem"]}
              shrinkZero
            />
          ) : (
            <HierarchyTable
              data={gridData}
              isLoading={isLoading}
              onEditAction={canEdit ? handleEdit : undefined}
              onRefreshAction={refetch}
              moduleId={moduleId}
              transactionId={transactionId}
              canEdit={canEdit}
            />
          )}
        </div>

        {/* Tree — 1/3 width on xl */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hierarchy Tree
          </p>
          {isLoading ? (
            <div className="h-64 animate-pulse rounded-md border bg-muted" />
          ) : (
            <HierarchyTree data={gridData} />
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              Edit Notification Route —{" "}
              {selectedItem?.groupCode}
            </DialogTitle>
            <DialogDescription>
              Choose which parent group receives notifications from{" "}
              <strong>{selectedItem?.groupName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          {selectedItem && (
            <HierarchyForm
              item={selectedItem}
              allGroups={gridData}
              isSubmitting={saveMutation.isPending}
              onSubmit={handleSubmit}
              onCancel={() => setIsModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
