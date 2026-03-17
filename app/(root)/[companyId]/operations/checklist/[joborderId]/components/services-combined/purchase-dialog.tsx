"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { IPurchaseData } from "@/interfaces/checklist"

import { JobOrder_Purchase } from "@/lib/api-routes"
import { useGet } from "@/hooks/use-common"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { JobTransactionForm } from "./job-transaction-form"
import { PurchaseTable } from "./purchase-table"

interface PurchaseDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  title?: string
  description?: string
  jobOrderId: number
  taskId: number
  serviceItemNo: number
  isConfirmed: boolean
}

export function PurchaseDialog({
  open,
  onOpenChangeAction,
  title = "Purchase",
  description = "Manage purchase details for this service.",
  jobOrderId,
  taskId,
  serviceItemNo,
  isConfirmed,
}: PurchaseDialogProps) {
  const queryClient = useQueryClient()
  const [purchaseData, setPurchaseData] = useState<IPurchaseData[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [initialSelectedIds, setInitialSelectedIds] = useState<string[]>([])
  const [editRow, setEditRow] = useState<IPurchaseData | null>(null)
  const [editFormOpen, setEditFormOpen] = useState(false)
  const isUpdatingRef = useRef(false)

  // Fetch purchase data when dialog opens
  const { data: purchaseResponse, isLoading } = useGet<IPurchaseData>(
    `${JobOrder_Purchase.getList}/${jobOrderId}/${taskId}/${serviceItemNo}`,
    `purchase-list-${jobOrderId}-${taskId}-${serviceItemNo}`,
    undefined,
    {
      enabled: open,
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: "always",
    }
  )

  useEffect(() => {
    if (!open) {
      queryClient.removeQueries({
        queryKey: [`purchase-list-${jobOrderId}-${taskId}-${serviceItemNo}`],
        exact: true,
      })
    }
  }, [open, queryClient, jobOrderId, taskId, serviceItemNo])

  // Update data when API response is received
  useEffect(() => {
    if (purchaseResponse) {
      // Check if result is -1 (error case)
      if (purchaseResponse.result === -1) {
        onOpenChangeAction(false)
        alert(purchaseResponse.message || "No purchase data available")
        return
      }

      // Check if we have valid data
      if (purchaseResponse.result === 1 && purchaseResponse.data) {
        // Set all purchase data
        setPurchaseData(purchaseResponse.data)

        // Pre-select all items that are already allocated
        const preSelectedIds = purchaseResponse.data
          .filter((item: IPurchaseData) => item.isAllocated === true)
          .map((item: IPurchaseData) => `${item.documentId}_${item.itemNo}`)

        setInitialSelectedIds(preSelectedIds)
        setSelectedIds(preSelectedIds)
      } else {
        // Set empty arrays if no data
        setPurchaseData([])
        setSelectedIds([])
        setInitialSelectedIds([])
      }
    }
  }, [purchaseResponse, onOpenChangeAction])

  // Handle bulk selection changes from table
  const handleBulkSelectionChange = useCallback((selectedIds: string[]) => {
    if (isUpdatingRef.current) return
    isUpdatingRef.current = true
    setSelectedIds(selectedIds)
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 0)
  }, [])

  const handleDocumentNoClick = useCallback((row: IPurchaseData) => {
    setEditRow(row)
    setEditFormOpen(true)
  }, [])

  const handleEditFormOpenChange = useCallback((open: boolean) => {
    setEditFormOpen(open)
    if (!open) {
      setEditRow(null)
    }
  }, [])

  const handleEditSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [`purchase-list-${jobOrderId}-${taskId}-${serviceItemNo}`],
    })
  }, [queryClient, jobOrderId, taskId, serviceItemNo])

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent
        className="max-h-[95vh] w-[95vw] !max-w-none overflow-y-auto"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <>
          {isLoading ? (
            <div className="mb-4 flex items-center justify-center py-8">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-4 text-sm text-gray-600">
                  Loading purchase data...
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Please wait while we fetch the purchase list
                </p>
              </div>
            </div>
          ) : purchaseData.length === 0 ? (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="h-1 w-1 rounded-full bg-gray-500"></div>
                <span className="text-sm font-medium">
                  No purchase data available for this service.
                </span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <PurchaseTable
                data={purchaseData}
                isLoading={isLoading}
                isConfirmed={isConfirmed}
                initialSelectedIds={initialSelectedIds}
                selectedIds={selectedIds}
                onBulkSelectionChange={handleBulkSelectionChange}
                onDocumentNoClick={handleDocumentNoClick}
              />
            </div>
          )}
        </>
        <JobTransactionForm
          open={editFormOpen}
          onOpenChangeAction={handleEditFormOpenChange}
          row={editRow}
          onSuccessAction={handleEditSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}

export default PurchaseDialog
