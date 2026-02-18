// main-tab.tsx - IMPROVED VERSION
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { recalculateAndSetHeaderTotals } from "@/helpers/gl-journal-calculations"
import { IGLJournalDt } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { GLJournalDtSchemaType, GLJournalHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { UseFormReturn } from "react-hook-form"

import { useUserSettingDefaults } from "@/hooks/use-settings"
import { DeleteConfirmation } from "@/components/confirmation"

import GLJournalDetailsForm, {
  GLJournalDetailsFormRef,
} from "./glJournal-details-form"
import GLJournalDetailsTable from "./glJournal-details-table"
import GLJournalForm from "./glJournal-form"

interface MainProps {
  form: UseFormReturn<GLJournalHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  isCancelled?: boolean
}

export default function Main({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId,
  isCancelled = false,
}: MainProps) {
  const { decimals } = useAuthStore()

  // Get user settings with defaults for all modules
  const { defaults } = useUserSettingDefaults()

  const [editingDetail, setEditingDetail] =
    useState<GLJournalDtSchemaType | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [selectedItemsToDelete, setSelectedItemsToDelete] = useState<number[]>(
    []
  )
  const [tableKey, setTableKey] = useState(0)
  const [showSingleDeleteConfirmation, setShowSingleDeleteConfirmation] =
    useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const previousGLJournalKeyRef = useRef<string>("")
  const detailsFormRef = useRef<GLJournalDetailsFormRef>(null)

  // Watch data_details for reactive updates
  const watchedDataDetails = form.watch("data_details")
  const dataDetails = useMemo(
    () => watchedDataDetails || [],
    [watchedDataDetails]
  )
  const currentGLjournalId = form.watch("journalId")
  const currentGLJournalNo = form.watch("journalNo")

  useEffect(() => {
    const currentKey = `${currentGLjournalId ?? ""}::${currentGLJournalNo ?? ""}`
    if (previousGLJournalKeyRef.current === currentKey) {
      return
    }

    previousGLJournalKeyRef.current = currentKey
    setEditingDetail(null)
    setSelectedItemsToDelete([])
    setItemToDelete(null)
    setShowDeleteConfirmation(false)
    setShowSingleDeleteConfirmation(false)
    setTableKey((prev) => prev + 1)
  }, [currentGLjournalId, currentGLJournalNo])

  // Helper function to recalculate header totals
  const recalculateHeaderTotals = () => {
    const currentDetails = form.getValues("data_details") || []
    recalculateAndSetHeaderTotals(
      form,
      currentDetails as unknown as IGLJournalDt[],
      decimals[0],
      visible
    )

    // Trigger form validation to update UI
    form.trigger([
      "totAmt",
      "gstAmt",
      "totAmtAftGst",
      "totLocalAmt",
      "gstLocalAmt",
      "totLocalAmtAftGst",
      "totCtyAmt",
      "gstCtyAmt",
      "totCtyAmtAftGst",
    ])
  }

  // Clear editingDetail when data_details is reset/cleared
  useEffect(() => {
    if (dataDetails.length === 0 && editingDetail) {
      setEditingDetail(null)
    }
  }, [dataDetails.length, editingDetail])

  // Note: Balance check is only done in handleSaveGLJournal in page.tsx
  // We don't show warning dialog here, only the visual indicator in the header

  useEffect(() => {
    if (!editingDetail) {
      return
    }

    const details = (dataDetails as unknown as IGLJournalDt[]) || []
    const editingExists = details.some((detail) => {
      const detailGLjournalId = `${detail.journalId ?? ""}`
      const editingGLjournalId = `${editingDetail.journalId ?? ""}`
      const detailGLJournalNo = detail.journalNo ?? ""
      const editingGLJournalNo = editingDetail.journalNo ?? ""
      return (
        detail.itemNo === editingDetail.itemNo &&
        detailGLjournalId === editingGLjournalId &&
        detailGLJournalNo === editingGLJournalNo
      )
    })

    if (!editingExists) {
      setEditingDetail(null)
    }
  }, [dataDetails, editingDetail])

  const handleAddRow = (rowData: IGLJournalDt) => {
    const currentData = form.getValues("data_details") || []

    let updatedData: GLJournalDtSchemaType[]
    if (editingDetail) {
      // Update existing row by itemNo (unique identifier)
      updatedData = currentData.map((item) =>
        item.itemNo === editingDetail.itemNo ? rowData : item
      ) as unknown as GLJournalDtSchemaType[]
      setEditingDetail(null)
    } else {
      // Add new row
      updatedData = [
        ...currentData,
        rowData,
      ] as unknown as GLJournalDtSchemaType[]
    }

    // Update form with new data
    form.setValue("data_details", updatedData, {
      shouldDirty: true,
      shouldTouch: true,
    })

    // Trigger form validation
    form.trigger("data_details")

    // Recalculate header totals after adding/updating row
    recalculateHeaderTotals()
  }

  const handleDelete = (itemNo: number) => {
    setItemToDelete(itemNo)
    setShowSingleDeleteConfirmation(true)
  }

  const confirmSingleDelete = () => {
    if (itemToDelete === null) return

    const currentData = form.getValues("data_details") || []
    const updatedData = currentData.filter(
      (item) => item.itemNo !== itemToDelete
    )
    form.setValue("data_details", updatedData)
    form.trigger("data_details")
    setShowSingleDeleteConfirmation(false)
    setItemToDelete(null)

    // Recalculate header totals after deleting row
    recalculateHeaderTotals()

    // Force table to re-render and clear selection by changing the key
    setTableKey((prev) => prev + 1)
  }

  const handleBulkDelete = (selectedItemNos: number[]) => {
    setSelectedItemsToDelete(selectedItemNos)
    setShowDeleteConfirmation(true)
  }

  const confirmBulkDelete = () => {
    const currentData = form.getValues("data_details") || []
    const updatedData = currentData.filter(
      (item) => !selectedItemsToDelete.includes(item.itemNo)
    )
    form.setValue("data_details", updatedData)
    form.trigger("data_details")
    setShowDeleteConfirmation(false)
    setSelectedItemsToDelete([])

    // Recalculate header totals after bulk deleting rows
    recalculateHeaderTotals()

    // Force table to re-render and clear selection by changing the key
    setTableKey((prev) => prev + 1)
  }

  const handleEdit = (detail: IGLJournalDt) => {
    // Convert IGLJournalDt to GLJournalDtSchemaType and set for editing
    setEditingDetail(detail as unknown as GLJournalDtSchemaType)
  }

  const handleCancelEdit = () => {
    setEditingDetail(null)
  }

  const handleDataReorder = (newData: IGLJournalDt[]) => {
    // Update seqNo sequentially after reordering
    const reorderedData = newData.map((item, index) => ({
      ...item,
      seqNo: index + 1,
    }))
    form.setValue(
      "data_details",
      reorderedData as unknown as GLJournalDtSchemaType[]
    )

    // Recalculate header totals after reordering (in case amounts were affected)
    recalculateHeaderTotals()
  }

  return (
    <div className="w-full">
      <GLJournalForm
        form={form}
        onSuccessAction={onSuccessAction}
        isEdit={isEdit}
        visible={visible}
        required={required}
        companyId={companyId}
        defaultCurrencyId={defaults.gl.currencyId}
        detailsFormRef={detailsFormRef}
      />

      <GLJournalDetailsForm
        ref={detailsFormRef}
        Hdform={form}
        onAddRowAction={handleAddRow}
        onCancelEdit={editingDetail ? handleCancelEdit : undefined}
        editingDetail={editingDetail}
        companyId={companyId}
        visible={visible}
        required={required}
        existingDetails={dataDetails as GLJournalDtSchemaType[]}
        defaultGlId={defaults.ap.invoiceGlId}
        defaultGstId={defaults.common.gstId || 0}
        isCancelled={isCancelled}
      />

      <GLJournalDetailsTable
        key={tableKey}
        data={(dataDetails as unknown as IGLJournalDt[]) || []}
        visible={visible}
        onDeleteAction={handleDelete}
        onBulkDeleteAction={handleBulkDelete}
        onEditAction={handleEdit as (template: IGLJournalDt) => void}
        onRefreshAction={() => {}} // Add refresh logic if needed
        onFilterChange={() => {}} // Add filter logic if needed
        onDataReorder={handleDataReorder as (newData: IGLJournalDt[]) => void}
        isCancelled={isCancelled}
      />

      <DeleteConfirmation
        title="Delete Selected Items"
        description="Are you sure you want to delete the selected items? This action cannot be undone."
        itemName={`${selectedItemsToDelete.length} item(s)`}
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={confirmBulkDelete}
        onCancelAction={() => {
          setShowDeleteConfirmation(false)
          setSelectedItemsToDelete([])
        }}
      />

      <DeleteConfirmation
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        itemName={`Item No. ${itemToDelete}`}
        open={showSingleDeleteConfirmation}
        onOpenChange={setShowSingleDeleteConfirmation}
        onConfirm={confirmSingleDelete}
        onCancelAction={() => {
          setShowSingleDeleteConfirmation(false)
          setItemToDelete(null)
        }}
      />
    </div>
  )
}
