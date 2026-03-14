"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ApiResponse } from "@/interfaces/auth"
import { IFreight } from "@/interfaces/freight"
import { FreightSchemaType } from "@/schemas/freight"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"
import { Eraser, Search } from "lucide-react"

import { Freight } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { LogisticsTransactionId, ModuleId } from "@/lib/utils"
import { useGet, useGetById, usePersist } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"

import { FreightForm } from "./components/freight-form"
import { FreightTable } from "./components/freight-table"

export default function FreightManagementPage() {
  const params = useParams()
  const companyId = Number(params.companyId) || 0
  const moduleId = ModuleId.logistics
  const transactionId = LogisticsTransactionId.freight

  const _queryClient = useQueryClient()
  const { hasPermission } = usePermissionStore()
  const { decimals: _decimals } = useAuthStore()

  const _canView = hasPermission(moduleId, transactionId, "isRead")
  const _canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const _canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const _canCreate = hasPermission(moduleId, transactionId, "isCreate")

  // States
  const [selectedItem, setSelectedItem] = useState<IFreight | undefined>(
    undefined
  )
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Local search state
  const [searchInput, setSearchInput] = useState("")
  const [committedSearch, setCommittedSearch] = useState("")

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    formData: Partial<FreightSchemaType> | null
    operationType: "create" | "update"
  }>({
    isOpen: false,
    formData: null,
    operationType: "create",
  })

  // Data fetching: pass committedSearch so Search button triggers API call with searchString
  const {
    data: response,
    refetch,
    isLoading: _isLoadingFreight,
  } = useGet<IFreight>(
    `${Freight.get}`,
    "freight",
    committedSearch.trim() || undefined
  )

  const { data } = (response as ApiResponse<IFreight>) ?? {
    result: 0,
    message: "",
    data: [],
  }

  // Mutations
  const saveMutation = usePersist<FreightSchemaType>(`${Freight.add}`)
  const updateMutation = usePersist<FreightSchemaType>(`${Freight.add}`)

  // Fetch individual freight by ID
  const selectedItemId = selectedItem?.consignmentImportId?.toString() || ""
  const {
    data: itemResponse,
    refetch: _refetchItem,
    isLoading: _isLoadingItem,
  } = useGetById<IFreight>(
    `${Freight.getById}`,
    "freightById",
    selectedItemId,
    {
      enabled:
        !!selectedItemId && (modalMode === "view" || modalMode === "edit"),
    }
  )

  // Update selected item when item data is fetched
  useEffect(() => {
    if (itemResponse?.result === 1 && itemResponse.data) {
      const itemData = Array.isArray(itemResponse.data)
        ? itemResponse.data[0]
        : itemResponse.data
      if (itemData) {
        setSelectedItem(itemData)
      }
    }
  }, [itemResponse])

  // Handlers
  const handleSelect = useCallback((item: IFreight | null) => {
    if (!item) return
    setSelectedItem(item)
    setModalMode("view")
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback((item: IFreight) => {
    setSelectedItem(item)
    setModalMode("edit")
    setIsModalOpen(true)
  }, [])

  const handleSubmit = useCallback(
    (formData: FreightSchemaType) => {
      // Show save confirmation instead of directly submitting
      setSaveConfirmation({
        isOpen: true,
        formData,
        operationType: modalMode === "edit" ? "update" : "create",
      })
    },
    [modalMode]
  )

  // Actual save function that gets called after confirmation
  const handleConfirmSave = useCallback(async () => {
    console.log("saveConfirmation.formData", saveConfirmation.formData)
    if (!saveConfirmation.formData) return

    try {
      const processedData: Partial<FreightSchemaType> = {
        ...saveConfirmation.formData,
        companyId: companyId,
        receiveDate:
          formatDateForApi(saveConfirmation.formData.receiveDate) || undefined,
        arrivalDate:
          formatDateForApi(saveConfirmation.formData.arrivalDate) || undefined,
        deliverDate:
          formatDateForApi(saveConfirmation.formData.deliverDate) || undefined,
        chargeId: saveConfirmation.formData.chargeId ?? undefined,
        carrierId: saveConfirmation.formData.carrierId ?? undefined,
        serviceModeId: saveConfirmation.formData.serviceModeId ?? undefined,
        consignmentTypeId:
          saveConfirmation.formData.consignmentTypeId ?? undefined,
        landingTypeId: saveConfirmation.formData.landingTypeId ?? undefined,
        uomId: saveConfirmation.formData.uomId ?? undefined,
        debitNoteId: saveConfirmation.formData.debitNoteId ?? undefined,
        taskId: saveConfirmation.formData.taskId ?? undefined,
        taskStatusId: saveConfirmation.formData.taskStatusId ?? undefined,
        vesselId: saveConfirmation.formData.vesselId ?? undefined,
      }

      let response
      if (saveConfirmation.operationType === "update" && selectedItem) {
        response = await updateMutation.mutateAsync({
          ...processedData,
          consignmentImportId: selectedItem.consignmentImportId,
        })
      } else {
        response = await saveMutation.mutateAsync(processedData)
      }

      // Check if API response indicates success (result=1)
      if (response && response.result === 1) {
        // Only close modal and reset state on successful submission
        setIsModalOpen(false)
        setSelectedItem(undefined)
        setModalMode("create")
        refetch()
      } else {
        // If result !== 1, don't close the modal - let user see the error
        console.error(
          "API returned error result:",
          response?.result,
          response?.message
        )
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      // Don't close the modal on error - let user fix the issue and retry
    } finally {
      // Close the save confirmation dialog
      setSaveConfirmation({
        isOpen: false,
        formData: null,
        operationType: "create",
      })
    }
  }, [
    saveConfirmation.formData,
    saveConfirmation.operationType,
    companyId,
    selectedItem,
    updateMutation,
    saveMutation,
    refetch,
  ])

  const handleCreateFreight = useCallback(() => {
    setSelectedItem(undefined)
    setModalMode("create")
    setIsModalOpen(true)
  }, [])

  const handleRefreshFreight = useCallback(() => {
    refetch()
  }, [refetch])

  // Handlers for search box
  const handleSearchClick = useCallback(() => {
    setCommittedSearch(searchInput.trim())
  }, [searchInput])

  const handleClearSearch = useCallback(() => {
    setSearchInput("")
    setCommittedSearch("")
  }, [])

  // API returns filtered data when searchString is sent; no client-side filter needed
  const tableData = data || []

  return (
    <>
      <div className="@container flex flex-1 flex-col p-4">
        {/* Header Section */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
              Freight Management
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage freight entries and consignment details
            </p>
          </div>
        </div>

        {/* Search box + actions */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="w-full max-w-xs sm:max-w-sm">
            <Input
              type="text"
              placeholder="Search by Ref / AWB / Job Order..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSearchClick()
                }
              }}
            />
          </div>
          <Button
            type="button"
            onClick={handleSearchClick}
            className="flex items-center gap-1 px-2 sm:px-3"
            size="sm"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClearSearch}
            className="flex items-center gap-1 px-2 sm:px-3"
            size="sm"
            disabled={!searchInput && !committedSearch}
          >
            <Eraser className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <FreightTable
            data={tableData}
            onFreightSelect={handleSelect}
            onEditActionFreight={handleEdit}
            onCreateActionFreight={handleCreateFreight}
            onRefreshAction={handleRefreshFreight}
            moduleId={moduleId}
            transactionId={transactionId}
          />
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-h-[90vh] w-[90vw] !max-w-none overflow-y-auto"
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>Freight Management</DialogTitle>
              <Badge
                variant={
                  modalMode === "create"
                    ? "default"
                    : modalMode === "edit"
                      ? "secondary"
                      : "outline"
                }
                className={
                  modalMode === "create"
                    ? "border-green-200 bg-green-100 text-green-800"
                    : modalMode === "edit"
                      ? "border-orange-200 bg-orange-100 text-orange-800"
                      : "border-blue-200 bg-blue-100 text-blue-800"
                }
              >
                {modalMode === "create"
                  ? "New"
                  : modalMode === "edit"
                    ? "Edit"
                    : "View"}

                <Badge variant="destructive" className="px-2 py-1 text-xs">
                  Edit Version No. {selectedItem?.editVersion ?? 0}
                </Badge>
              </Badge>
            </div>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new freight entry."
                : modalMode === "edit"
                  ? "Update the freight details."
                  : "View freight details (read-only)."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <FreightForm
            companyId={companyId}
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedItem
                : undefined
            }
            submitAction={handleSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isConfirmed={modalMode === "view"}
            isEditMode={modalMode === "edit"}
          />
        </DialogContent>
      </Dialog>
      {/* Save Confirmation */}
      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Confirm Save"
        itemName={
          saveConfirmation.operationType === "update"
            ? `Freight ${selectedItem?.referenceNo || selectedItem?.jobOrderNo || ""}`
            : "New Freight"
        }
        operationType={saveConfirmation.operationType}
        onConfirm={handleConfirmSave}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            formData: null,
            operationType: "create",
          })
        }
        isSaving={saveMutation.isPending || updateMutation.isPending}
      />
    </>
  )
}
