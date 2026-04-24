"use client"

import { useCallback, useState } from "react"
import { IJobOrderStatus, ISaveJobOrderStatusRequest } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { AdminActivation } from "@/lib/api-routes"
import { useGet, usePersist } from "@/hooks/use-common"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { ChecklistOverrideFormDialog } from "./components/checklist-override-form-dialog"
import { ChecklistOverridesTable } from "./components/checklist-overrides-table"

export default function AdminChecklistOverridesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState<string>("")
  const [editJobOrder, setEditJobOrder] = useState<IJobOrderStatus | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const {
    data: jobOrdersResponse,
    refetch,
    isLoading,
  } = useGet<IJobOrderStatus>(
    AdminActivation.getJobOrdersByStatus,
    "admin-job-orders-by-status",
    search?.trim() || undefined
  )

  const { data: jobOrdersData = [] } =
    (jobOrdersResponse as ApiResponse<IJobOrderStatus>) ?? {}

  const updateMutation = usePersist<ISaveJobOrderStatusRequest>(
    AdminActivation.updateJobOrderStatus
  )

  const handleFilterChange = useCallback(
    (filters: { search?: string; sortOrder?: string }) => {
      setSearch(filters.search ?? "")
    },
    []
  )

  const handleEdit = (job: IJobOrderStatus) => {
    setEditJobOrder(job)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: ISaveJobOrderStatusRequest) => {
    try {
      const response = await updateMutation.mutateAsync(data)
      if (response?.result === 1) {
        toast.success("Job order status updated successfully.")
        queryClient.invalidateQueries({
          queryKey: ["admin-job-orders-by-status"],
        })
        refetch()
        setIsFormOpen(false)
        setEditJobOrder(null)
      } else {
        toast.error(response?.message ?? "Failed to update job order status.")
      }
    } catch {
      toast.error("Failed to update job order status.")
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Checklist Overrides
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage checklist job status overrides
          </p>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton
          columnCount={6}
          filterCount={1}
          cellWidths={["6rem", "10rem", "8rem", "8rem", "8rem", "8rem"]}
          shrinkZero
        />
      ) : (
        <ChecklistOverridesTable
          data={Array.isArray(jobOrdersData) ? jobOrdersData : []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onRefreshAction={refetch}
          onFilterChange={handleFilterChange}
        />
      )}

      <ChecklistOverrideFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        jobOrder={editJobOrder}
        onSubmit={handleFormSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  )
}
