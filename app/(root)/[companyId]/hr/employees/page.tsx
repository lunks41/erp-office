"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { IEmployeeBasic } from "@/interfaces/employee"

import { toast } from "sonner"

import { useDeleteEmployee, useGetEmployees } from "@/hooks/use-employee"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { EmployeeListTable } from "./components/employee-list-table"

export default function EmployeePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] =
    useState<IEmployeeBasic | null>(null)

  const companyId = params.companyId as string

  // Use hooks for data fetching and mutations
  const { data, isLoading, isError, error, refetch } = useGetEmployees()
  const deleteMutation = useDeleteEmployee()

  useEffect(() => {
    if (isError && error) {
      toast.error("Failed to load employees. Please try again.")
      return
    }

    if (!data || isLoading) return

    if (data.result === -2) {
      toast.error(data.message || "You do not have permission to view employees.")
      return
    }

    if (data.result < 0 && data.result !== -1 && data.message) {
      toast.error(data.message)
    }
  }, [data, error, isError, isLoading])

  // Check for refresh parameter and trigger refetch
  useEffect(() => {
    const refreshParam = searchParams.get("refresh")
    if (refreshParam) {
      refetch()
      // Remove the refresh parameter from URL after refetch
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("refresh")
      const newUrl = newSearchParams.toString()
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname
      router.replace(newUrl)
    }
  }, [searchParams, refetch, router])

  const handleEdit = useCallback(
    (employee: IEmployeeBasic) => {
      // Navigate to individual employee page using the correct path with company ID
      router.push(`/${companyId}/hr/employees/${employee.employeeId}`)
    },
    [router, companyId]
  )

  const _handleDelete = useCallback((employee: IEmployeeBasic) => {
    setEmployeeToDelete(employee)
    setDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (employeeToDelete) {
      deleteMutation.mutate(employeeToDelete.employeeId.toString())
      setDeleteConfirmOpen(false)
      setEmployeeToDelete(null)
    }
  }, [deleteMutation, employeeToDelete])

  // Show employee list table
  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight sm:text-3xl">
            Employees
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage employee information and records
          </p>
        </div>
      </div>
      {isLoading ? (
        <DataTableSkeleton columnCount={5} />
      ) : (
        <EmployeeListTable
          data={(data?.data as unknown as IEmployeeBasic[]) || []}
          onEditAction={handleEdit}
          onRefreshAction={refetch}
        />
      )}

      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={(isOpen) => setDeleteConfirmOpen(isOpen)}
        title="Delete Employee"
        description="This action cannot be undone. This will permanently delete the employee from our servers."
        itemName={employeeToDelete?.employeeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() => setDeleteConfirmOpen(false)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
