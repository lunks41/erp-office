"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IDepartment, IDepartmentFilter } from "@/interfaces/department"
import { DepartmentSchemaType } from "@/schemas/department"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { Department } from "@/lib/api-routes"
import { MasterTransactionId, ModuleId } from "@/lib/utils"
import { useDelete, useGetWithPagination, usePersist } from "@/hooks/use-common"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { LoadConfirmation } from "@/components/confirmation/load-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

import { DepartmentForm } from "./components/department-form"
import { DepartmentsTable } from "./components/department-table"

export default function DepartmentPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.department

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IDepartmentFilter>({})
  const [searchInput, setSearchInput] = useState("")
  const { defaults } = useUserSettingDefaults()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )

  // Update page size when user settings change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Filter handler wrapper
  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as IDepartmentFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleSearchSubmit = useCallback(() => {
    const normalizedSearch = searchInput.trim() || undefined
    handleFilterChange({
      search: normalizedSearch,
      sortOrder: filters.sortOrder,
    })
  }, [filters.sortOrder, handleFilterChange, searchInput])

  // Page change handler
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Page size change handler
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const {
    data: departmentsResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IDepartment>(
    `${Department.get}`,
    "departments",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: departmentsResult,
    data: departmentsData,
    totalRecords,
  } = (departmentsResponse as ApiResponse<IDepartment>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  useEffect(() => {
    if (departmentsData?.length > 0) {
      refetch()
    }
  }, [filters, departmentsData?.length, refetch])

  const saveMutation = usePersist<DepartmentSchemaType>(`${Department.add}`)
  const updateMutation = usePersist<DepartmentSchemaType>(`${Department.add}`)
  const deleteMutation = useDelete(`${Department.delete}`)

  const [selectedDepartment, setSelectedDepartment] =
    useState<IDepartment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingDepartment, setExistingDepartment] =
    useState<IDepartment | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    departmentId: string | null
    departmentName: string | null
  }>({
    isOpen: false,
    departmentId: null,
    departmentName: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateDepartment = () => {
    setModalMode("create")
    setSelectedDepartment(null)
    setIsModalOpen(true)
  }

  const handleEditDepartment = (department: IDepartment) => {
    setModalMode("edit")
    setSelectedDepartment(department)
    setIsModalOpen(true)
  }

  const handleViewDepartment = (department: IDepartment | null) => {
    if (!department) return
    setModalMode("view")
    setSelectedDepartment(department)
    setIsModalOpen(true)
  }

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: DepartmentSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: DepartmentSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: DepartmentSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["departments"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedDepartment) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["departments"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteDepartment = (departmentId: string) => {
    const departmentToDelete = departmentsData?.find(
      (d) => d.departmentId.toString() === departmentId
    )
    if (!departmentToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      departmentId,
      departmentName: departmentToDelete.departmentName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.departmentId) {
      deleteMutation.mutateAsync(deleteConfirmation.departmentId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["departments"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        departmentId: null,
        departmentName: null,
      })
    }
  }

  // Handler for code availability check
  const handleCodeBlur = useCallback(
    async (code: string) => {
      // Skip if:
      // 1. In edit mode
      // 2. In read-only mode
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(`${Department.getByCode}/${trimmedCode}`)
        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const departmentData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (departmentData) {
            // Ensure all required fields are present
            const validDepartmentData: IDepartment = {
              departmentId: departmentData.departmentId,
              companyId: departmentData.companyId,
              departmentCode: departmentData.departmentCode,
              departmentName: departmentData.departmentName,
              remarks: departmentData.remarks || "",
              isActive: departmentData.isActive ?? true,
              createBy: departmentData.createBy,
              editBy: departmentData.editBy,
              createDate: departmentData.createDate,
              editDate: departmentData.editDate,
            }
            setExistingDepartment(validDepartmentData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing department
  const handleLoadExistingDepartment = () => {
    if (existingDepartment) {
      // Log the data we're about to set
      // Set the states
      setModalMode("edit")
      setSelectedDepartment(existingDepartment)
      setShowLoadDialog(false)
      setExistingDepartment(null)
    }
  }

  useEffect(() => {
    setSearchInput(filters.search || "")
  }, [filters.search])

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Departments
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage department information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search departments..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit()
                }
                if (e.key === "Escape") {
                  setSearchInput("")
                  handleFilterChange({
                    search: undefined,
                    sortOrder: filters.sortOrder,
                  })
                }
              }}
              className="h-7 rounded-md pr-8"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("")
                  handleFilterChange({
                    search: undefined,
                    sortOrder: filters.sortOrder,
                  })
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSearchSubmit}
            className="h-9 rounded-md px-4"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton
          columnCount={7}
          filterCount={2}
          cellWidths={[
            "10rem",
            "30rem",
            "10rem",
            "10rem",
            "6rem",
            "6rem",
            "6rem",
          ]}
          shrinkZero
        />
      ) : departmentsResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <DepartmentsTable
            data={[]}
            onSelect={() => {}}
            onDeleteAction={() => {}}
            onEditAction={() => {}}
            onCreateAction={() => {}}
            onRefreshAction={() => {}}
            onFilterChange={() => {}}
            moduleId={moduleId}
            transactionId={transactionId}
            isLoading={false}
            canEdit={false}
            canDelete={false}
            canView={false}
            canCreate={false}
          />
        </LockSkeleton>
      ) : departmentsResult ? (
        <DepartmentsTable
          data={filters.search ? [] : departmentsData || []}
          onSelect={canView ? handleViewDepartment : undefined}
          onDeleteAction={canDelete ? handleDeleteDepartment : undefined}
          onEditAction={canEdit ? handleEditDepartment : undefined}
          onCreateAction={canCreate ? handleCreateDepartment : undefined}
          onRefreshAction={handleRefresh}
          onFilterChange={handleFilterChange}
          initialSearchValue={filters.search}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          currentPage={currentPage}
          pageSize={pageSize}
          serverSidePagination={true}
          moduleId={moduleId}
          transactionId={transactionId}
          isLoading={isLoading}
          totalRecords={totalRecords}
          // Pass permissions to table
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
      ) : (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            {departmentsResult === 0 ? "No data available" : "Loading..."}
          </p>
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Department"}
              {modalMode === "edit" && "Update Department"}
              {modalMode === "view" && "View Department"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new department to the system database."
                : modalMode === "edit"
                  ? "Update department information in the system database."
                  : "View department details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <DepartmentForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedDepartment
                : null
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Load Existing Department Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingDepartment}
        onCancelAction={() => setExistingDepartment(null)}
        code={existingDepartment?.departmentCode}
        name={existingDepartment?.departmentName}
        typeLabel="Department"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Department"
        description="This action cannot be undone. This will permanently delete the department from our servers."
        itemName={deleteConfirmation.departmentName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            departmentId: null,
            departmentName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      {/* Save Confirmation Dialog */}
      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={
          modalMode === "create" ? "Create Department" : "Update Department"
        }
        itemName={saveConfirmation.data?.departmentName || ""}
        operationType={modalMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmation.data) {
            handleConfirmedFormSubmit(saveConfirmation.data)
          }
          setSaveConfirmation({
            isOpen: false,
            data: null,
          })
        }}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            data: null,
          })
        }
        isSaving={saveMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
