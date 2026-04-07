"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IDocumentType, IDocumentTypeFilter } from "@/interfaces/documenttype"
import { DocumentTypeSchemaType } from "@/schemas/documenttype"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { DocumentType } from "@/lib/api-routes"
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

import { DocumentTypeForm } from "./components/document-type-form"
import { DocumentTypesTable } from "./components/document-type-table"

export default function DocumentTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.documentType

  const queryClient = useQueryClient()
  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  // Get user settings for default page size
  const { defaults } = useUserSettingDefaults()

  // Fetch document types from the API using useGet
  const [filters, setFilters] = useState<IDocumentTypeFilter>({})
  const [searchInput, setSearchInput] = useState("")
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
      setFilters(newFilters as IDocumentTypeFilter)
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
    data: documentTypesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IDocumentType>(
    `${DocumentType.get}`,
    "documentTypes",
    filters.search,
    currentPage,
    pageSize
  )

  // Destructure with fallback values
  const {
    result: documentTypesResult,
    data: documentTypesData,
    totalRecords,
  } = (documentTypesResponse as ApiResponse<IDocumentType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Define mutations for CRUD operations
  const saveMutation = usePersist<DocumentTypeSchemaType>(`${DocumentType.add}`)
  const updateMutation = usePersist<DocumentTypeSchemaType>(
    `${DocumentType.add}`
  )
  const deleteMutation = useDelete(`${DocumentType.delete}`)

  // State for modal and selected document type
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<IDocumentType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingDocumentType, setExistingDocumentType] =
    useState<IDocumentType | null>(null)

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    documentTypeId: string | null
    documentTypeName: string | null
  }>({
    isOpen: false,
    documentTypeId: null,
    documentTypeName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: DocumentTypeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Handler to Re-fetches data when called
  const handleRefresh = () => {
    refetch()
  }

  // Handler to open modal for creating a new document type
  const handleCreateDocumentType = () => {
    setModalMode("create")
    setSelectedDocumentType(null)
    setIsModalOpen(true)
  }

  // Handler to open modal for editing an document type
  const handleEditDocumentType = (documentType: IDocumentType) => {
    setModalMode("edit")
    setSelectedDocumentType(documentType)
    setIsModalOpen(true)
  }

  // Handler to open modal for viewing an document type
  const handleViewDocumentType = (documentType: IDocumentType | null) => {
    if (!documentType) return
    setModalMode("view")
    setSelectedDocumentType(documentType)
    setIsModalOpen(true)
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: DocumentTypeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: DocumentTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["documentTypes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedDocumentType) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["documentTypes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  // Handler for deleting an document type
  const handleDeleteDocumentType = (documentTypeId: string) => {
    const documentTypeToDelete = documentTypesData?.find(
      (at) => at.docTypeId.toString() === documentTypeId
    )
    if (!documentTypeToDelete) return

    // Open delete confirmation dialog with document type details
    setDeleteConfirmation({
      isOpen: true,
      documentTypeId,
      documentTypeName: documentTypeToDelete.docTypeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.documentTypeId) {
      deleteMutation.mutateAsync(deleteConfirmation.documentTypeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["documentTypes"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        documentTypeId: null,
        documentTypeName: null,
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
        const response = await getById(
          `${DocumentType.getByCode}/${trimmedCode}`
        )
        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const documentTypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (documentTypeData) {
            // Ensure all required fields are present
            const validDocumentTypeData: IDocumentType = {
              docTypeId: documentTypeData.docTypeId,
              docTypeCode: documentTypeData.docTypeCode,
              docTypeName: documentTypeData.docTypeName,
              remarks: documentTypeData.remarks || "",
              isActive: documentTypeData.isActive ?? true,
              companyId: documentTypeData.companyId,
              createBy: documentTypeData.createBy,
              editBy: documentTypeData.editBy,
              createDate: documentTypeData.createDate,
              editDate: documentTypeData.editDate,
            }
            setExistingDocumentType(validDocumentTypeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing document type
  const handleLoadExistingDocumentType = () => {
    if (existingDocumentType) {
      // Log the data we're about to set
      // Set the states
      setModalMode("edit")
      setSelectedDocumentType(existingDocumentType)
      setShowLoadDialog(false)
      setExistingDocumentType(null)
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
            Document Types
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage document type information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search document types..."
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

      {/* Document Types Table */}
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
      ) : documentTypesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <DocumentTypesTable
            data={[]}
            isLoading={false}
            onSelect={() => {}}
            onDeleteAction={() => {}}
            onEditAction={() => {}}
            onCreateAction={() => {}}
            onRefreshAction={() => {}}
            onFilterChange={() => {}}
            moduleId={moduleId}
            transactionId={transactionId}
            canEdit={false}
            canDelete={false}
            canView={false}
            canCreate={false}
          />
        </LockSkeleton>
      ) : (
        <DocumentTypesTable
          data={documentTypesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewDocumentType : undefined}
          onDeleteAction={canDelete ? handleDeleteDocumentType : undefined}
          onEditAction={canEdit ? handleEditDocumentType : undefined}
          onCreateAction={canCreate ? handleCreateDocumentType : undefined}
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
          // Pass permissions to table
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
      )}

      {/* Modal for Create, Edit, and View */}
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
              {modalMode === "create" && "Create Document Type"}
              {modalMode === "edit" && "Update Document Type"}
              {modalMode === "view" && "View Document Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new document type to the system database."
                : modalMode === "edit"
                  ? "Update document type information in the system database."
                  : "View document type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <DocumentTypeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedDocumentType || undefined
                : undefined
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Load Existing Document Type Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingDocumentType}
        onCancelAction={() => setExistingDocumentType(null)}
        code={existingDocumentType?.docTypeCode}
        name={existingDocumentType?.docTypeName}
        typeLabel="Document Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Document Type"
        description="This action cannot be undone. This will permanently delete the document type from our servers."
        itemName={deleteConfirmation.documentTypeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            documentTypeId: null,
            documentTypeName: null,
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
          modalMode === "create"
            ? "Create Document Type"
            : "Update Document Type"
        }
        itemName={saveConfirmation.data?.docTypeName || ""}
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
