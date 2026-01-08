// main-tab.tsx - IMPROVED VERSION
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { recalculateAndSetHeaderTotals } from "@/helpers/ap-invoice-calculations"
import { IApInvoiceDt } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { ApInvoiceDtSchemaType, ApInvoiceHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { UseFormReturn } from "react-hook-form"

import { useUserSettingDefaults } from "@/hooks/use-settings"
import { DeleteConfirmation } from "@/components/confirmation"

import InvoiceDetailsForm, {
  InvoiceDetailsFormRef,
} from "./invoice-details-form"
import InvoiceDetailsTable from "./invoice-details-table"
import InvoiceForm from "./invoice-form"

interface MainProps {
  form: UseFormReturn<ApInvoiceHdSchemaType>
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
    useState<ApInvoiceDtSchemaType | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [selectedItemsToDelete, setSelectedItemsToDelete] = useState<number[]>(
    []
  )
  const [tableKey, setTableKey] = useState(0)
  const [showSingleDeleteConfirmation, setShowSingleDeleteConfirmation] =
    useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const previousInvoiceKeyRef = useRef<string>("")
  const detailsFormRef = useRef<InvoiceDetailsFormRef>(null)

  // Watch data_details for reactive updates
  const watchedDataDetails = form.watch("data_details")
  const dataDetails = useMemo(
    () => watchedDataDetails || [],
    [watchedDataDetails]
  )
  const currentInvoiceId = form.watch("invoiceId")
  const currentInvoiceNo = form.watch("invoiceNo")

  useEffect(() => {
    const currentKey = `${currentInvoiceId ?? ""}::${currentInvoiceNo ?? ""}`
    if (previousInvoiceKeyRef.current === currentKey) {
      return
    }

    previousInvoiceKeyRef.current = currentKey
    setEditingDetail(null)
    setSelectedItemsToDelete([])
    setItemToDelete(null)
    setShowDeleteConfirmation(false)
    setShowSingleDeleteConfirmation(false)
    setTableKey((prev) => prev + 1)
  }, [currentInvoiceId, currentInvoiceNo])

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

    const details = (dataDetails as unknown as IApInvoiceDt[]) || []
    const editingExists = details.some((detail) => {
      const detailInvoiceId = `${detail.invoiceId ?? ""}`
      const editingInvoiceId = `${editingDetail.invoiceId ?? ""}`
      const detailInvoiceNo = detail.invoiceNo ?? ""
      const editingInvoiceNo = editingDetail.invoiceNo ?? ""
      return (
        detail.itemNo === editingDetail.itemNo &&
        detailInvoiceId === editingInvoiceId &&
        detailInvoiceNo === editingInvoiceNo
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
      currentDetails as unknown as IApInvoiceDt[],
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

  const handleAddRow = (rowData: IApInvoiceDt) => {
    const currentData = form.getValues("data_details") || []

    if (editingDetail) {
      // Update existing row by itemNo (unique identifier)
      const updatedData = currentData.map((item) =>
        item.itemNo === editingDetail.itemNo ? rowData : item
      )
      form.setValue(
        "data_details",
        updatedData as unknown as ApInvoiceDtSchemaType[],
        { shouldDirty: true, shouldTouch: true }
      )

      setEditingDetail(null)
    } else {
      // Add new row
      const updatedData = [...currentData, rowData]
      form.setValue(
        "data_details",
        updatedData as unknown as ApInvoiceDtSchemaType[],
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

  const handleEdit = (detail: IApInvoiceDt) => {
    // Convert IApInvoiceDt to ApInvoiceDtSchemaType and set for editing
    setEditingDetail(detail as unknown as ApInvoiceDtSchemaType)
  }

  const handleCancelEdit = () => {
    setEditingDetail(null)
  }

  const handleDataReorder = (newData: IApInvoiceDt[]) => {
    // Update itemNo sequentially after reordering
    const reorderedData = newData.map((item, index) => ({
      ...item,
      itemNo: index + 1,
    }))
    form.setValue(
      "data_details",
      reorderedData as unknown as ApInvoiceDtSchemaType[]
    )
    
    // Recalculate header totals after reordering (in case amounts were affected)
    recalculateHeaderTotals()
  }

  return (
    <div className="w-full">
      <InvoiceForm
        form={form}
        onSuccessAction={onSuccessAction}
        isEdit={isEdit}
        visible={visible}
        required={required}
        companyId={companyId}
        defaultCurrencyId={defaults.ap.currencyId}
        detailsFormRef={detailsFormRef}
      />

      <InvoiceDetailsForm
        ref={detailsFormRef}
        Hdform={form}
        onAddRowAction={handleAddRow}
        onCancelEdit={editingDetail ? handleCancelEdit : undefined}
        editingDetail={editingDetail}
        companyId={companyId}
        visible={visible}
        required={required}
        existingDetails={dataDetails as ApInvoiceDtSchemaType[]}
        defaultGlId={defaults.ap.invoiceGlId}
        defaultUomId={defaults.common.uomId}
        defaultGstId={defaults.common.gstId}
        isCancelled={isCancelled}
      />

      <InvoiceDetailsTable
        key={tableKey}
        data={(dataDetails as unknown as IApInvoiceDt[]) || []}
        visible={visible}
        onDeleteAction={handleDelete}
        onBulkDeleteAction={handleBulkDelete}
        onEditAction={handleEdit as (template: IApInvoiceDt) => void}
        onRefreshAction={() => {}} // Add refresh logic if needed
        onFilterChange={() => {}} // Add filter logic if needed
        onDataReorder={handleDataReorder as (newData: IApInvoiceDt[]) => void}
        isCancelled={isCancelled}
        maxHeight={300}
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
