// main-tab.tsx - GL Year End Process
"use client"

import React, { useEffect, useRef, useState } from "react"
import { IGLOpeningBalance } from "@/interfaces"
import { ApiResponse } from "@/interfaces/auth"
import { GLYearEndProcessRequestSchemaType } from "@/schemas/gl-yearendprocess"
import { useAuthStore } from "@/stores/auth-store"

import { DeleteConfirmation } from "@/components/confirmation"

import YearEndProcessForm, {
  YearEndProcessFormRef,
} from "./yearendprocess-form"
import YearEndProcessTable from "./yearendprocess-table"

export interface YearEndProcessTotals {
  totDebitLocalAmt: number
  totCreditLocalAmt: number
}

interface MainProps {
  onGenerateAction?: (requestData: GLYearEndProcessRequestSchemaType) => void
  companyId: number
  documentIdToFetch?: string | undefined
  fetchedData?: ApiResponse<IGLOpeningBalance | IGLOpeningBalance[]>
  onTotalsChange?: (totals: YearEndProcessTotals) => void
  formRef?: React.RefObject<YearEndProcessFormRef>
}

export default function Main({
  onGenerateAction,
  companyId,
  documentIdToFetch,
  fetchedData,
  onTotalsChange,
  formRef,
}: MainProps) {
  const { decimals: _decimals } = useAuthStore()

  const [dataDetails, setDataDetails] = useState<IGLOpeningBalance[]>([])
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [selectedItemsToDelete, setSelectedItemsToDelete] = useState<number[]>(
    []
  )
  const [tableKey, setTableKey] = useState(0)
  const [showSingleDeleteConfirmation, setShowSingleDeleteConfirmation] =
    useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const internalFormRef = useRef<YearEndProcessFormRef>(null)
  const formRefToUse = formRef ?? internalFormRef

  // Update table data when fetched data changes
  useEffect(() => {
    if (!fetchedData?.data || fetchedData.result !== 1 || !documentIdToFetch) {
      setDataDetails([])
      return
    }

    const raw = fetchedData.data
    const arr = Array.isArray(raw) ? raw : ([raw] as IGLOpeningBalance[])
    const details = arr as IGLOpeningBalance[]

    // Verify documentId matches
    const firstDocId =
      details.length > 0
        ? String((details[0] as IGLOpeningBalance).documentId ?? "")
        : ""
    if (firstDocId !== documentIdToFetch) {
      return
    }

    setDataDetails(details)
  }, [fetchedData, documentIdToFetch])

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
    setTableKey((prev) => prev + 1)
  }

  const handleDataReorder = (newData: IGLOpeningBalance[]) => {
    const reorderedData = newData.map((item, index) => ({
      ...item,
      itemNo: index + 1,
    }))
    setDataDetails(reorderedData)
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
      <YearEndProcessForm
        ref={formRefToUse}
        onGenerateAction={onGenerateAction}
        companyId={companyId}
        defaultDocumentId={documentIdToFetch ? Number(documentIdToFetch) : 0}
      />

      {dataDetails.length > 0 && (
        <div className="mt-4">
          <YearEndProcessTable
            key={tableKey}
            data={(dataDetails as unknown as IGLOpeningBalance[]) || []}
            onDeleteAction={handleDelete}
            onBulkDeleteAction={handleBulkDelete}
            onRefreshAction={() => {}}
            onFilterChange={() => {}}
            onDataReorder={
              handleDataReorder as (newData: IGLOpeningBalance[]) => void
            }
            isCancelled={false}
          />
        </div>
      )}

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
