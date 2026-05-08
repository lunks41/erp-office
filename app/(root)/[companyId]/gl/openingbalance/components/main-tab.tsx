"use client"

import { useCompanyStore } from "@/stores/company-store"
// main-tab.tsx - GL Opening Balance

import { useEffect, useRef, useState } from "react"
import { IGLOpeningBalance } from "@/interfaces"
import { GLOpeningBalanceSchemaType } from "@/schemas"
import { UseFormReturn } from "react-hook-form"
import { GLOpeningBalance } from "@/lib/api-routes"
import { useGetById } from "@/hooks/use-common"
import { DeleteConfirmation } from "@/components/confirmation"

import OpeningBalanceForm, {
  OpeningBalanceFormRef,
} from "./openingbalance-form"
import OpeningBalanceTable from "./openingbalance-table"

export interface OpeningBalanceTotals {
  totDebitLocalAmt: number
  totCreditLocalAmt: number
}

interface MainProps {
  form: UseFormReturn<GLOpeningBalanceSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  companyId: number
  isCancelled?: boolean
  onTotalsChange?: (totals: OpeningBalanceTotals) => void
}

export default function Main({
  form,
  onSuccessAction: _onSuccessAction,
  isEdit: _isEdit,
  companyId,
  isCancelled = false,
  onTotalsChange,
}: MainProps) {
  const { decimals: _decimals } = useCompanyStore()

  const [dataDetails, setDataDetails] = useState<IGLOpeningBalance[]>([])
  const [editingDetail, setEditingDetail] =
    useState<GLOpeningBalanceSchemaType | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [selectedItemsToDelete, setSelectedItemsToDelete] = useState<number[]>(
    []
  )
  const [tableKey, setTableKey] = useState(0)
  const [showSingleDeleteConfirmation, setShowSingleDeleteConfirmation] =
    useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const previousDocKeyRef = useRef<string>("")
  const detailsFormRef = useRef<OpeningBalanceFormRef>(null)

  const currentDocumentId = form.watch("documentId")
  const currentDocumentNo = form.watch("documentNo")

  // Fetch GetGLOpeningBalance/{documentId} when documentId changes and set table data
  const { data: fetchedDetailsResponse } = useGetById<
    IGLOpeningBalance | IGLOpeningBalance[]
  >(GLOpeningBalance.getById, "gl-opening-balance", currentDocumentId ?? "", {
    enabled: !!currentDocumentId?.trim() && currentDocumentId !== "0",
  })

  // When API returns data for current documentId, set table and header totals
  useEffect(() => {
    if (
      !fetchedDetailsResponse?.data ||
      fetchedDetailsResponse.result !== 1 ||
      !currentDocumentId
    ) {
      return
    }
    const raw = fetchedDetailsResponse.data
    const arr = Array.isArray(raw) ? raw : ([raw] as IGLOpeningBalance[])
    const details = arr as IGLOpeningBalance[]
    const firstDocId =
      details.length > 0
        ? String((details[0] as IGLOpeningBalance).documentId ?? "")
        : ""
    if (firstDocId !== currentDocumentId) {
      return
    }
    setDataDetails(details)
    const totAmt = details.reduce((sum, d) => sum + (Number(d.totAmt) || 0), 0)
    const totLocalAmt = details.reduce(
      (sum, d) => sum + (Number(d.totLocalAmt) || 0),
      0
    )
    form.setValue("totAmt", totAmt)
    form.setValue("totLocalAmt", totLocalAmt)
    form.trigger(["totAmt", "totLocalAmt"])
  }, [fetchedDetailsResponse, currentDocumentId, form])

  useEffect(() => {
    const currentKey = `${currentDocumentId ?? ""}::${currentDocumentNo ?? ""}`
    if (previousDocKeyRef.current === currentKey) {
      return
    }

    previousDocKeyRef.current = currentKey
    setEditingDetail(null)
    setSelectedItemsToDelete([])
    setItemToDelete(null)
    setShowDeleteConfirmation(false)
    setShowSingleDeleteConfirmation(false)
    setDataDetails([]) // Reset details when document changes
    setTableKey((prev) => prev + 1)
  }, [currentDocumentId, currentDocumentNo])

  // Clear editingDetail when details are reset/cleared
  useEffect(() => {
    if (dataDetails.length === 0 && editingDetail) {
      setEditingDetail(null)
    }
  }, [dataDetails.length, editingDetail])

  useEffect(() => {
    if (!editingDetail) {
      return
    }

    const details = (dataDetails as unknown as IGLOpeningBalance[]) || []
    const editingExists = details.some(
      (detail) =>
        detail.itemNo === editingDetail.itemNo &&
        detail.documentId === editingDetail.documentId
    )

    if (!editingExists) {
      setEditingDetail(null)
    }
  }, [dataDetails, editingDetail])

  // Helper function to recalculate header totals
  const recalculateHeaderTotals = (details: IGLOpeningBalance[]) => {
    const totAmt = details.reduce((sum, d) => sum + (d.totAmt || 0), 0)
    const totLocalAmt = details.reduce(
      (sum, d) => sum + (d.totLocalAmt || 0),
      0
    )

    form.setValue("totAmt", totAmt)
    form.setValue("totLocalAmt", totLocalAmt)
    form.trigger(["totAmt", "totLocalAmt"])
  }

  const handleAddRow = (rowData: IGLOpeningBalance) => {
    let updatedData: IGLOpeningBalance[]
    if (editingDetail) {
      updatedData = dataDetails.map((item: IGLOpeningBalance) =>
        item.itemNo === editingDetail.itemNo ? rowData : item
      )
      setEditingDetail(null)
    } else {
      updatedData = [...dataDetails, rowData]
    }

    setDataDetails(updatedData)
    recalculateHeaderTotals(updatedData)
  }

  const handleDelete = (itemNo: number) => {
    setItemToDelete(itemNo)
    setShowSingleDeleteConfirmation(true)
  }

  const confirmSingleDelete = () => {
    if (itemToDelete === null) return

    const updatedData = dataDetails.filter(
      (item: IGLOpeningBalance) => item.itemNo !== itemToDelete
    )
    setDataDetails(updatedData)
    setShowSingleDeleteConfirmation(false)
    setItemToDelete(null)

    recalculateHeaderTotals(updatedData)
    setTableKey((prev) => prev + 1)
  }

  const handleBulkDelete = (selectedItemNos: number[]) => {
    setSelectedItemsToDelete(selectedItemNos)
    setShowDeleteConfirmation(true)
  }

  const confirmBulkDelete = () => {
    const updatedData = dataDetails.filter(
      (item: IGLOpeningBalance) => !selectedItemsToDelete.includes(item.itemNo)
    )
    setDataDetails(updatedData)
    setShowDeleteConfirmation(false)
    setSelectedItemsToDelete([])

    recalculateHeaderTotals(updatedData)
    setTableKey((prev) => prev + 1)
  }

  const handleEdit = (detail: IGLOpeningBalance) => {
    setEditingDetail(detail as unknown as GLOpeningBalanceSchemaType)
  }

  const handleCancelEdit = () => {
    setEditingDetail(null)
  }

  const handleDataReorder = (newData: IGLOpeningBalance[]) => {
    const reorderedData = newData.map((item, index) => ({
      ...item,
      itemNo: index + 1,
    }))
    setDataDetails(reorderedData)
    recalculateHeaderTotals(reorderedData)
  }

  // Report debit/credit totals (local amount only) to page for header badges
  useEffect(() => {
    if (!onTotalsChange) return
    const totDebitLocalAmt = dataDetails.reduce(
      (sum, d) => sum + (d.isDebit ? Number(d.totLocalAmt) || 0 : 0),
      0
    )
    const totCreditLocalAmt = dataDetails.reduce(
      (sum, d) => sum + (!d.isDebit ? Number(d.totLocalAmt) || 0 : 0),
      0
    )
    onTotalsChange({ totDebitLocalAmt, totCreditLocalAmt })
  }, [dataDetails, onTotalsChange])

  return (
    <div className="w-full">
      <OpeningBalanceForm
        ref={detailsFormRef}
        Hdform={form}
        onAddRowAction={handleAddRow}
        onCancelEdit={editingDetail ? handleCancelEdit : undefined}
        editingDetail={editingDetail}
        companyId={companyId}
        existingDetails={dataDetails as GLOpeningBalanceSchemaType[]}
        defaultGlId={0}
        isCancelled={isCancelled}
      />

      <OpeningBalanceTable
        key={tableKey}
        data={(dataDetails as unknown as IGLOpeningBalance[]) || []}
        onDeleteAction={handleDelete}
        onBulkDeleteAction={handleBulkDelete}
        onEditAction={handleEdit as (template: IGLOpeningBalance) => void}
        onRefreshAction={() => {}}
        onFilterChange={() => {}}
        onDataReorder={
          handleDataReorder as (newData: IGLOpeningBalance[]) => void
        }
        isCancelled={isCancelled}
      />

      <DeleteConfirmation
        title="Delete Selected Items"
        description="Are you sure you want to delete the selected items? This action cannot be undone."
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={confirmBulkDelete}
      />

      <DeleteConfirmation
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        open={showSingleDeleteConfirmation}
        onOpenChange={setShowSingleDeleteConfirmation}
        onConfirm={confirmSingleDelete}
      />
    </div>
  )
}
