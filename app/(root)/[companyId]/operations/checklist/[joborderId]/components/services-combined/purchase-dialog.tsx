"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { IPurchaseData } from "@/interfaces/checklist"

import { JobOrder_Purchase } from "@/lib/api-routes"
import {
  APTransactionId,
  ARTransactionId,
  CBTransactionId,
  GLTransactionId,
  ModuleId,
} from "@/lib/utils"
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
  const params = useParams()
  const companyId = params?.companyId as string
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

  const getTargetPath = useCallback(
    (row: IPurchaseData): string | null => {
      const moduleId = Number(row.moduleId)
      const transactionId = Number(row.transactionId)

      if (!companyId || !Number.isFinite(moduleId) || !Number.isFinite(transactionId)) {
        return null
      }

      if (moduleId === ModuleId.ap) {
        switch (transactionId) {
          case APTransactionId.invoice:
            return `/${companyId}/ap/invoice`
          case APTransactionId.debitNote:
            return `/${companyId}/ap/debitnote`
          case APTransactionId.creditNote:
            return `/${companyId}/ap/creditnote`
          case APTransactionId.adjustment:
            return `/${companyId}/ap/adjustment`
          case APTransactionId.payment:
            return `/${companyId}/ap/payment`
          case APTransactionId.refund:
            return `/${companyId}/ap/refund`
          case APTransactionId.docsetoff:
            return `/${companyId}/ap/docsetoff`
          default:
            return null
        }
      }

      if (moduleId === ModuleId.ar) {
        switch (transactionId) {
          case ARTransactionId.invoice:
            return `/${companyId}/ar/invoice`
          case ARTransactionId.invoicectm:
            return `/${companyId}/ar/invoicectm`
          case ARTransactionId.debitNote:
            return `/${companyId}/ar/debitnote`
          case ARTransactionId.creditNote:
            return `/${companyId}/ar/creditnote`
          case ARTransactionId.adjustment:
            return `/${companyId}/ar/adjustment`
          case ARTransactionId.receipt:
            return `/${companyId}/ar/receipt`
          case ARTransactionId.refund:
            return `/${companyId}/ar/refund`
          case ARTransactionId.docsetoff:
            return `/${companyId}/ar/docsetoff`
          default:
            return null
        }
      }

      if (moduleId === ModuleId.cb) {
        switch (transactionId) {
          case CBTransactionId.cbgenpayment:
            return `/${companyId}/cb/cbgenpayment`
          case CBTransactionId.cbgenreceipt:
            return `/${companyId}/cb/cbgenreceipt`
          case CBTransactionId.cbbanktransfer:
            return `/${companyId}/cb/cbbanktransfer`
          case CBTransactionId.cbbankrecon:
            return `/${companyId}/cb/cbbankrecon`
          case CBTransactionId.cbbanktransferctm:
            return `/${companyId}/cb/cbbanktransferctm`
          case CBTransactionId.cbpettycash:
            return `/${companyId}/cb/cbpettycash`
          default:
            return null
        }
      }

      if (moduleId === ModuleId.gl) {
        switch (transactionId) {
          case GLTransactionId.journalentry:
            return `/${companyId}/gl/journalentry`
          case GLTransactionId.arapcontra:
            return `/${companyId}/gl/arapcontra`
          default:
            return null
        }
      }

      return null
    },
    [companyId]
  )

  const handlePreviewClick = useCallback(
    (row: IPurchaseData) => {
      const targetPath = getTargetPath(row)
      const documentId = String(row.documentId || "").trim()

      // Preferred behavior: open source accounting document in preview/edit screen
      if (targetPath && documentId && typeof window !== "undefined") {
        const storageKey = `history-doc:${targetPath}`
        window.localStorage.setItem(storageKey, documentId)
        window.open(targetPath, "_blank", "noopener,noreferrer")
        return
      }

      // If mapping is unavailable, keep existing edit behavior
      setEditRow(row)
      setEditFormOpen(true)
    },
    [getTargetPath]
  )

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
                onPreviewClick={handlePreviewClick}
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
