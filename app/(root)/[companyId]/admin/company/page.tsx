"use client"

import { useCallback, useState } from "react"
import { ICompany, ICompanyFilter } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { CompanySchemaType } from "@/schemas/admin"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { Company } from "@/lib/api-routes"
import { AdminTransactionId, ModuleId } from "@/lib/utils"
import { useDelete, useGet, usePersist } from "@/hooks/use-common"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

import { CompanyForm } from "./components/company-form"
import { CompanyTable } from "./components/company-table"

export default function AdminCompanyPage() {
  const moduleId = ModuleId.admin
  const transactionId = AdminTransactionId.company

  const { hasPermission } = usePermissionStore()
  const queryClient = useQueryClient()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const [filters, setFilters] = useState<ICompanyFilter>({})

  const {
    data: companiesResponse,
    refetch,
    isLoading,
  } = useGet<ICompany>(`${Company.get}`, "companies", filters.search)

  const { data: companiesData } = (companiesResponse as ApiResponse<ICompany>) ?? {
    result: 0,
    message: "",
    data: [],
  }

  const saveMutation = usePersist(`${Company.add}`)
  const updateMutation = usePersist(`${Company.add}`)
  const deleteMutation = useDelete(`${Company.delete}`)

  const [selectedCompany, setSelectedCompany] = useState<ICompany | undefined>(
    undefined
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    companyId: string | null
    companyName: string | null
  }>({
    isOpen: false,
    companyId: null,
    companyName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: CompanySchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleFilterChange = useCallback(
    (nextFilters: { search?: string; sortOrder?: string }) => {
      setFilters(nextFilters as ICompanyFilter)
    },
    []
  )

  const handleCreate = () => {
    setModalMode("create")
    setSelectedCompany(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (company: ICompany) => {
    setModalMode("edit")
    setSelectedCompany(company)
    setIsModalOpen(true)
  }

  const handleView = (company: ICompany | null) => {
    if (!company) return
    setModalMode("view")
    setSelectedCompany(company)
    setIsModalOpen(true)
  }

  const handleDelete = (companyId: string) => {
    const company = companiesData?.find(
      (c) => c.companyId.toString() === companyId
    )
    if (!company) return
    setDeleteConfirmation({
      isOpen: true,
      companyId,
      companyName: company.companyName,
    })
  }

  const submitCompany = async (data: CompanySchemaType) => {
    try {
      if (modalMode === "create") {
        await saveMutation.mutateAsync(data)
      } else {
        await updateMutation.mutateAsync(data)
      }
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error saving company:", error)
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Company</h1>
        <p className="text-muted-foreground text-sm">
          Manage company setup and registration details
        </p>
      </div>

      {isLoading ? (
        <DataTableSkeleton
          columnCount={10}
          filterCount={2}
          cellWidths={[
            "8rem",
            "16rem",
            "12rem",
            "12rem",
            "12rem",
            "10rem",
            "8rem",
            "8rem",
            "12rem",
            "12rem",
          ]}
          shrinkZero
        />
      ) : (companiesResponse as ApiResponse<ICompany>)?.result === -2 ? (
        <LockSkeleton locked={true}>
          <CompanyTable
            data={[]}
            isLoading={false}
            onSelect={canView ? handleView : undefined}
            onDeleteAction={canDelete ? handleDelete : undefined}
            onEditAction={canEdit ? handleEdit : undefined}
            onCreateAction={canCreate ? handleCreate : undefined}
            onRefreshAction={refetch}
            onFilterChange={handleFilterChange}
            initialSearchValue={filters.search}
            moduleId={moduleId}
            transactionId={transactionId}
            canEdit={canEdit}
            canDelete={canDelete}
            canView={canView}
            canCreate={canCreate}
          />
        </LockSkeleton>
      ) : (
        <CompanyTable
          data={filters.search ? [] : companiesData || []}
          isLoading={isLoading}
          onSelect={canView ? handleView : undefined}
          onDeleteAction={canDelete ? handleDelete : undefined}
          onEditAction={canEdit ? handleEdit : undefined}
          onCreateAction={canCreate ? handleCreate : undefined}
          onRefreshAction={refetch}
          onFilterChange={handleFilterChange}
          initialSearchValue={filters.search}
          moduleId={moduleId}
          transactionId={transactionId}
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-4xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Company"}
              {modalMode === "edit" && "Update Company"}
              {modalMode === "view" && "View Company"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new company record."
                : modalMode === "edit"
                  ? "Update company information."
                  : "View company details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <CompanyForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedCompany
                : undefined
            }
            submitAction={(formData) =>
              setSaveConfirmation({ isOpen: true, data: formData })
            }
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Company"
        description="This action cannot be undone. This will permanently delete the company record."
        itemName={deleteConfirmation.companyName || ""}
        onConfirm={async () => {
          if (!deleteConfirmation.companyId) return
          await deleteMutation.mutateAsync(deleteConfirmation.companyId)
          queryClient.invalidateQueries({ queryKey: ["companies"] })
          setDeleteConfirmation({
            isOpen: false,
            companyId: null,
            companyName: null,
          })
        }}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            companyId: null,
            companyName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={modalMode === "create" ? "Create Company" : "Update Company"}
        itemName={saveConfirmation.data?.companyName || ""}
        operationType={modalMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmation.data) {
            void submitCompany(saveConfirmation.data)
          }
          setSaveConfirmation({ isOpen: false, data: null })
        }}
        onCancelAction={() => setSaveConfirmation({ isOpen: false, data: null })}
        isSaving={saveMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
