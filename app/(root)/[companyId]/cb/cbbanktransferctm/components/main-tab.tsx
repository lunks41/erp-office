// main-tab.tsx - IMPROVED VERSION
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { validateFromTotLocalAmt } from "@/helpers/cb-banktransferctm-calculations"
import { ICbBankTransferCtmDt } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  CbBankTransferCtmDtSchemaType,
  CbBankTransferCtmHdSchemaType,
} from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { UseFormReturn } from "react-hook-form"

import { useUserSettingDefaults } from "@/hooks/use-settings"
import { DeleteConfirmation } from "@/components/confirmation"

import CbBankTransferCtmDetailsForm, {
  CbBankTransferCtmDetailsFormRef,
} from "./cbbanktransferctm-details-form"
import CbBankTransferCtmDetailsTable from "./cbbanktransferctm-details-table"
import CbBankTransferCtmForm from "./cbbanktransferctm-form"

interface MainProps {
  form: UseFormReturn<CbBankTransferCtmHdSchemaType>
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
  const { defaults: _defaults } = useUserSettingDefaults()

  const [editingDetail, setEditingDetail] =
    useState<CbBankTransferCtmDtSchemaType | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [selectedItemsToDelete, setSelectedItemsToDelete] = useState<number[]>(
    []
  )
  const [tableKey, setTableKey] = useState(0)
  const [showSingleDeleteConfirmation, setShowSingleDeleteConfirmation] =
    useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const previousBankTransferCtmKeyRef = useRef<string>("")
  const detailsFormRef = useRef<CbBankTransferCtmDetailsFormRef>(null)

  // Watch data_details for reactive updates
  const watchedDataDetails = form.watch("data_details")
  const dataDetails = useMemo(
    () => watchedDataDetails || [],
    [watchedDataDetails]
  )
  const currentTransferId = form.watch("transferId")
  const currentTransferNo = form.watch("transferNo")
  const fromTotLocalAmt = form.watch("fromTotLocalAmt")

  // Validate fromTotLocalAmt against details sum whenever details or fromTotLocalAmt changes
  useEffect(() => {
    if (dataDetails.length === 0) {
      // Clear validation error if no details
      form.clearErrors("fromTotLocalAmt")
      return
    }

    // Validate after a short delay to allow form state to settle
    const timeoutId = setTimeout(() => {
      validateHeaderTotals()
    }, 100)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataDetails, fromTotLocalAmt])

  useEffect(() => {
    const currentKey = `${currentTransferId ?? ""}::${currentTransferNo ?? ""}`
    if (previousBankTransferCtmKeyRef.current === currentKey) {
      return
    }

    previousBankTransferCtmKeyRef.current = currentKey
    setEditingDetail(null)
    setSelectedItemsToDelete([])
    setItemToDelete(null)
    setShowDeleteConfirmation(false)
    setShowSingleDeleteConfirmation(false)
    setTableKey((prev) => prev + 1)
  }, [currentTransferId, currentTransferNo])

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

    const details = (dataDetails as unknown as ICbBankTransferCtmDt[]) || []
    const editingExists = details.some((detail) => {
      const detailTransferId = `${detail.transferId ?? ""}`
      const editingTransferId = `${editingDetail.transferId ?? ""}`
      const detailTransferNo = detail.transferNo ?? ""
      const editingTransferNo = editingDetail.transferNo ?? ""
      return (
        detail.itemNo === editingDetail.itemNo &&
        detailTransferId === editingTransferId &&
        detailTransferNo === editingTransferNo
      )
    })

    if (!editingExists) {
      setEditingDetail(null)
    }
  }, [dataDetails, editingDetail])

  // Helper function to validate header totals match details
  // Note: FROM and TO are separate entities, so we only validate, not calculate
  const validateHeaderTotals = () => {
    const currentDetails = form.getValues("data_details") || []
    const currentFromTotLocalAmt = form.getValues("fromTotLocalAmt") || 0
    const locAmtDec = decimals[0]?.locAmtDec || 2

    if (currentDetails.length === 0) {
      form.clearErrors("fromTotLocalAmt")
      return
    }

    const validation = validateFromTotLocalAmt(
      currentFromTotLocalAmt,
      currentDetails as unknown as ICbBankTransferCtmDt[],
      locAmtDec
    )

    if (!validation.isValid) {
      // Set error on fromTotLocalAmt field
      form.setError("fromTotLocalAmt", {
        type: "validation",
        message: `Must equal sum of details: ${validation.expectedTotal.toFixed(
          locAmtDec
        )}`,
      })
    } else {
      // Clear error if validation passes
      form.clearErrors("fromTotLocalAmt")
    }

    // Trigger form validation to update UI
    form.trigger(["fromTotLocalAmt"])
  }

  const handleAddRow = (rowData: ICbBankTransferCtmDt) => {
    const currentData = form.getValues("data_details") || []

    if (editingDetail) {
      // Update existing row by itemNo (unique identifier)
      const updatedData = currentData.map((item) =>
        item.itemNo === editingDetail.itemNo ? rowData : item
      )
      form.setValue(
        "data_details",
        updatedData as unknown as CbBankTransferCtmDtSchemaType[],
        { shouldDirty: true, shouldTouch: true }
      )

      setEditingDetail(null)
    } else {
      // Add new row
      const updatedData = [...currentData, rowData]
      form.setValue(
        "data_details",
        updatedData as unknown as CbBankTransferCtmDtSchemaType[],
        { shouldDirty: true, shouldTouch: true }
      )
    }

    // Trigger form validation
    form.trigger("data_details")

    // Validate header totals match details after adding/updating row
    validateHeaderTotals()
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

    // Validate header totals match details after deleting row
    validateHeaderTotals()

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

    // Validate header totals match details after bulk deleting rows
    validateHeaderTotals()

    // Force table to re-render and clear selection by changing the key
    setTableKey((prev) => prev + 1)
  }

  const handleEdit = (detail: ICbBankTransferCtmDt) => {
    // Convert ICbBankTransferCtmDt to CbBankTransferCtmDtSchemaType and set for editing
    setEditingDetail(detail as unknown as CbBankTransferCtmDtSchemaType)
  }

  const handleCancelEdit = () => {
    setEditingDetail(null)
  }

  const handleClone = (detail: ICbBankTransferCtmDt) => {
    const currentData =
      (form.getValues("data_details") as unknown as ICbBankTransferCtmDt[]) ||
      []

    const nextItemNo =
      currentData.length === 0
        ? 1
        : Math.max(...currentData.map((d) => d.itemNo || 0)) + 1

    const clonedDetail: ICbBankTransferCtmDt = {
      ...detail,
      itemNo: nextItemNo,
      seqNo: nextItemNo,
    }

    const updatedData = [...currentData, clonedDetail]

    form.setValue(
      "data_details",
      updatedData as unknown as CbBankTransferCtmDtSchemaType[],
      { shouldDirty: true, shouldTouch: true }
    )
    form.trigger("data_details")

    validateHeaderTotals()

    setEditingDetail(clonedDetail as unknown as CbBankTransferCtmDtSchemaType)
    setTableKey((prev) => prev + 1)
  }

  const handleDataReorder = (newData: ICbBankTransferCtmDt[]) => {
    // Update seqNo sequentially after reordering
    const reorderedData = newData.map((item, index) => ({
      ...item,
      seqNo: index + 1,
    }))
    form.setValue(
      "data_details",
      reorderedData as unknown as CbBankTransferCtmDtSchemaType[]
    )

    // Validate header totals match details after reordering
    validateHeaderTotals()
  }

  // Get form errors for display
  const formErrors = form.formState.errors

  return (
    <div className="w-full">
      {/* Display form errors summary */}
      {Object.keys(formErrors).length > 0 && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
          <p className="mb-2 font-semibold text-red-800 dark:text-red-300">
            Please fix the following errors:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-400">
            {Object.entries(formErrors).map(([field, error]) => {
              const errorMessage =
                typeof error === "object" &&
                error !== null &&
                "message" in error
                  ? error.message
                  : "Invalid value"
              return (
                <li key={field}>
                  <span className="font-medium capitalize">{field}:</span>{" "}
                  {String(errorMessage)}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <CbBankTransferCtmForm
        form={form}
        onSuccessAction={onSuccessAction}
        isEdit={isEdit}
        visible={visible}
        required={required}
        companyId={companyId}
        detailsFormRef={detailsFormRef}
      />

      <CbBankTransferCtmDetailsForm
        ref={detailsFormRef}
        Hdform={form}
        onAddRowAction={handleAddRow}
        onCancelEdit={editingDetail ? handleCancelEdit : undefined}
        editingDetail={editingDetail}
        companyId={companyId}
        visible={visible}
        required={required}
        existingDetails={dataDetails as CbBankTransferCtmDtSchemaType[]}
        isCancelled={isCancelled}
      />

      <CbBankTransferCtmDetailsTable
        key={tableKey}
        data={(dataDetails as unknown as ICbBankTransferCtmDt[]) || []}
        visible={visible}
        onDeleteAction={handleDelete}
        onBulkDeleteAction={handleBulkDelete}
        onEditAction={handleEdit as (template: ICbBankTransferCtmDt) => void}
        onCloneAction={handleClone as (template: ICbBankTransferCtmDt) => void}
        onRefreshAction={() => {}} // Add refresh logic if needed
        onFilterChange={() => {}} // Add filter logic if needed
        onDataReorder={
          handleDataReorder as (newData: ICbBankTransferCtmDt[]) => void
        }
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
