// main-tab.tsx - IMPROVED VERSION
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { recalculateAndSetHeaderTotals } from "@/helpers/ar-debitNote-calculations"
import { IArDebitNoteDt } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { ArDebitNoteDtSchemaType, ArDebitNoteHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { UseFormReturn } from "react-hook-form"

import { useUserSettingDefaults } from "@/hooks/use-settings"
import { DeleteConfirmation } from "@/components/confirmation"

import DebitNoteDetailsForm, {
  DebitNoteDetailsFormRef,
} from "./debitnote-details-form"
import DebitNoteDetailsTable from "./debitnote-details-table"
import DebitNoteForm from "./debitnote-form"

interface MainProps {
  form: UseFormReturn<ArDebitNoteHdSchemaType>
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
    useState<ArDebitNoteDtSchemaType | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [selectedItemsToDelete, setSelectedItemsToDelete] = useState<number[]>(
    []
  )
  const [tableKey, setTableKey] = useState(0)
  const [showSingleDeleteConfirmation, setShowSingleDeleteConfirmation] =
    useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const previousDebitNoteKeyRef = useRef<string>("")
  const detailsFormRef = useRef<DebitNoteDetailsFormRef>(null)

  // Watch data_details for reactive updates
  const watchedDataDetails = form.watch("data_details")
  const dataDetails = useMemo(
    () => watchedDataDetails || [],
    [watchedDataDetails]
  )
  const currentDebitNoteId = form.watch("debitNoteId")
  const currentDebitNoteNo = form.watch("debitNoteNo")

  useEffect(() => {
    const currentKey = `${currentDebitNoteId ?? ""}::${currentDebitNoteNo ?? ""}`
    if (previousDebitNoteKeyRef.current === currentKey) {
      return
    }

    previousDebitNoteKeyRef.current = currentKey
    setEditingDetail(null)
    setSelectedItemsToDelete([])
    setItemToDelete(null)
    setShowDeleteConfirmation(false)
    setShowSingleDeleteConfirmation(false)
    setTableKey((prev) => prev + 1)
  }, [currentDebitNoteId, currentDebitNoteNo])

  // Clear editingDetail when data_details is reset/cleared
  useEffect(() => {
    if (dataDetails.length === 0 && editingDetail) {
      setEditingDetail(null)
    }
  }, [dataDetails.length, editingDetail])

  useEffect(() => {
    if (!editingDetail) {
      return
    }

    const details = (dataDetails as unknown as IArDebitNoteDt[]) || []
    const editingExists = details.some((detail) => {
      const detailDebitNoteId = `${detail.debitNoteId ?? ""}`
      const editingDebitNoteId = `${editingDetail.debitNoteId ?? ""}`
      const detailDebitNoteNo = detail.debitNoteNo ?? ""
      const editingDebitNoteNo = editingDetail.debitNoteNo ?? ""
      return (
        detail.itemNo === editingDetail.itemNo &&
        detailDebitNoteId === editingDebitNoteId &&
        detailDebitNoteNo === editingDebitNoteNo
      )
    })

    if (!editingExists) {
      setEditingDetail(null)
    }
  }, [dataDetails, editingDetail])

  // Helper function to recalculate header totals
  const recalculateHeaderTotals = () => {
    const currentDetails = form.getValues("data_details") || []
    recalculateAndSetHeaderTotals(
      form,
      currentDetails as unknown as IArDebitNoteDt[],
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

  const handleAddRow = (rowData: IArDebitNoteDt) => {
    const currentData = form.getValues("data_details") || []

    if (editingDetail) {
      // Update existing row by itemNo (unique identifier)
      const updatedData = currentData.map((item) =>
        item.itemNo === editingDetail.itemNo ? rowData : item
      )
      form.setValue(
        "data_details",
        updatedData as unknown as ArDebitNoteDtSchemaType[],
        { shouldDirty: true, shouldTouch: true }
      )

      setEditingDetail(null)
    } else {
      // Add new row
      const updatedData = [...currentData, rowData]
      form.setValue(
        "data_details",
        updatedData as unknown as ArDebitNoteDtSchemaType[],
        { shouldDirty: true, shouldTouch: true }
      )
    }

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

  const handleEdit = (detail: IArDebitNoteDt) => {
    // Convert IArDebitNoteDt to ArDebitNoteDtSchemaType and set for editing
    setEditingDetail(detail as unknown as ArDebitNoteDtSchemaType)
  }

  const handleCancelEdit = () => {
    setEditingDetail(null)
  }

  const handleClone = (detail: IArDebitNoteDt) => {
    const currentData =
      (form.getValues("data_details") as unknown as IArDebitNoteDt[]) || []

    const nextItemNo =
      currentData.length === 0
        ? 1
        : Math.max(...currentData.map((d) => d.itemNo || 0)) + 1

    const clonedDetail: IArDebitNoteDt = {
      ...detail,
      itemNo: nextItemNo,
      seqNo: nextItemNo,
      docItemNo: nextItemNo,
    }

    const updatedData = [...currentData, clonedDetail]

    form.setValue(
      "data_details",
      updatedData as unknown as ArDebitNoteDtSchemaType[],
      { shouldDirty: true, shouldTouch: true }
    )
    form.trigger("data_details")
    recalculateHeaderTotals()

    setEditingDetail(clonedDetail as unknown as ArDebitNoteDtSchemaType)
    setTableKey((prev) => prev + 1)
  }

  const handleDataReorder = (newData: IArDebitNoteDt[]) => {
    // Update seqNo sequentially after reordering
    const reorderedData = newData.map((item, index) => ({
      ...item,
      seqNo: index + 1,
    }))
    form.setValue(
      "data_details",
      reorderedData as unknown as ArDebitNoteDtSchemaType[]
    )

    // Recalculate header totals after reordering (in case amounts were affected)
    recalculateHeaderTotals()
  }

  return (
    <div className="w-full">
      <DebitNoteForm
        form={form}
        onSuccessAction={onSuccessAction}
        isEdit={isEdit}
        visible={visible}
        required={required}
        companyId={companyId}
        defaultCurrencyId={defaults.ar.currencyId}
        detailsFormRef={detailsFormRef}
      />

      <DebitNoteDetailsForm
        ref={detailsFormRef}
        Hdform={form}
        onAddRowAction={handleAddRow}
        onCancelEdit={editingDetail ? handleCancelEdit : undefined}
        editingDetail={editingDetail}
        companyId={companyId}
        visible={visible}
        required={required}
        existingDetails={dataDetails as ArDebitNoteDtSchemaType[]}
        defaultGlId={defaults.ar.debitNoteGlId}
        defaultUomId={defaults.common.uomId}
        defaultGstId={defaults.common.gstId || 0}
        isCancelled={isCancelled}
      />

      <DebitNoteDetailsTable
        key={tableKey}
        data={(dataDetails as unknown as IArDebitNoteDt[]) || []}
        visible={visible}
        onDeleteAction={handleDelete}
        onBulkDeleteAction={handleBulkDelete}
        onEditAction={handleEdit as (template: IArDebitNoteDt) => void}
        onCloneAction={handleClone as (template: IArDebitNoteDt) => void}
        onRefreshAction={() => {}} // Add refresh logic if needed
        onFilterChange={() => {}} // Add filter logic if needed
        onDataReorder={handleDataReorder as (newData: IArDebitNoteDt[]) => void}
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
