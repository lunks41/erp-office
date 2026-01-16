"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { IApOutTransaction } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { format, isValid, parse } from "date-fns"
import { RefreshCw } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getByBody } from "@/lib/api-client"
import { Account } from "@/lib/api-routes"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CustomNumberInput } from "@/components/custom"

import ApOutStandingTransactionsTable from "./ap-outstandingtransactions-table"

interface ApOutStandingTransactionsDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  supplierId?: number
  currencyId?: number
  accountDate?: string
  isRefund?: boolean
  documentId?: string
  transactionId?: number
  visible: IVisibleFields
  onAddSelected?: (transactions: IApOutTransaction[]) => void
  existingDocumentIds?: (string | number)[] // Array of already selected document IDs
}

export default function ApOutStandingTransactionsDialog({
  open,
  onOpenChangeAction,
  supplierId,
  currencyId,
  accountDate,
  isRefund,
  documentId,
  transactionId,
  visible,
  onAddSelected,
  existingDocumentIds = [],
}: ApOutStandingTransactionsDialogProps) {
  const [outTransactions, setOutTransactions] = useState<IApOutTransaction[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [tableKey, setTableKey] = useState(0)

  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat

  // Create a minimal form for the summary fields
  const summaryForm = useForm<{
    selectedTotAmt: number
    selectedTotLocalAmt: number
  }>({
    defaultValues: {
      selectedTotAmt: 0,
      selectedTotLocalAmt: 0,
    },
  })

  // Use ref to prevent duplicate API calls
  const isLoadingRef = useRef(false)
  const lastLoadParamsRef = useRef<string>("")

  // Extract loadTransactions function so it can be reused
  const loadTransactions = useCallback(async () => {
    if (!supplierId || !currencyId || !accountDate) {
      return
    }

    // Create a unique key for current params
    const paramsKey = `${supplierId}-${currencyId}-${accountDate}-${isRefund}-${documentId}`

    // Prevent duplicate calls with same parameters (only if actively loading)
    if (isLoadingRef.current && lastLoadParamsRef.current === paramsKey) {
      return
    }

    // Reset the flag for this new effect run
    if (lastLoadParamsRef.current !== paramsKey) {
      isLoadingRef.current = false
    }

    // Set loading flag and store params
    isLoadingRef.current = true
    lastLoadParamsRef.current = paramsKey

    setIsLoading(true)
    setSelectedTransactions([])

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error("API call timeout - taking too long")
      toast.error("Request timeout", {
        description:
          "Loading transactions is taking too long. Please try again.",
      })
      setIsLoading(false)
      isLoadingRef.current = false
      setOutTransactions([])
    }, 3000) // 30 second timeout

    try {
      const parsedAccountDate = (() => {
        if (!accountDate) return null
        const parsed = parse(accountDate, dateFormat, new Date())
        if (isValid(parsed)) return parsed
        return parseDate(accountDate)
      })()

      if (!parsedAccountDate) {
        clearTimeout(timeoutId)
        setIsLoading(false)
        isLoadingRef.current = false
        toast.error("Invalid account date")
        setOutTransactions([])
        return
      }

      const dt = format(parsedAccountDate, "yyyy-MM-dd")

      const payload: Record<string, unknown> = {
        supplierId: supplierId,
        currencyId: currencyId,
        accountDate: dt,
        isRefund: isRefund ?? false,
        documentId: documentId ?? "",
        transactionId: transactionId ?? "",
      }

      const response = await getByBody(
        Account.getApOutstandTransaction,
        payload
      )

      // Clear timeout since API call completed
      clearTimeout(timeoutId)

      if (response?.result === 1) {
        setOutTransactions(response.data || [])
      } else {
        setOutTransactions([])
        const errorMsg = response?.message || "Failed to load transactions"
        console.error("Failed to fetch outstanding transactions:", errorMsg)
        toast.error("Failed to load transactions", {
          description: errorMsg,
        })
      }
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId)

      console.error("Error fetching outstanding transactions:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      toast.error("Error loading transactions", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      })
      setOutTransactions([])
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [
    supplierId,
    currencyId,
    accountDate,
    isRefund,
    documentId,
    dateFormat,
    transactionId,
  ])

  // Load transactions when dialog opens
  useEffect(() => {
    if (!open) {
      return
    }
    loadTransactions()
  }, [open, loadTransactions])

  // Force remount of transactions table and clear selection whenever dialog opens
  useEffect(() => {
    if (open) {
      setTableKey((prev) => prev + 1)
      setSelectedTransactions([])
    }
  }, [open])

  // Function to calculate totals for selected transactions
  const calculateSelectedTotals = useCallback(
    (selectedIds: string[], transactions: IApOutTransaction[]) => {
      if (selectedIds.length === 0) {
        return { totAmt: 0, totLocalAmt: 0 }
      }

      let totAmt = 0
      let totLocalAmt = 0

      selectedIds.forEach((docId) => {
        const transaction = transactions.find(
          (t) => t.documentId.toString() === docId
        )
        if (transaction) {
          totAmt += transaction.balAmt || 0
          totLocalAmt += transaction.balLocalAmt || 0
        }
      })

      return { totAmt, totLocalAmt }
    },
    []
  )

  // Calculate totals when selection changes
  useEffect(() => {
    const { totAmt, totLocalAmt } = calculateSelectedTotals(
      selectedTransactions,
      outTransactions
    )
    // Update form values
    summaryForm.setValue("selectedTotAmt", totAmt)
    summaryForm.setValue("selectedTotLocalAmt", totLocalAmt)
  }, [
    selectedTransactions,
    outTransactions,
    calculateSelectedTotals,
    summaryForm,
  ])

  const handleBulkSelectionChange = useCallback((selectedIds: string[]) => {
    setSelectedTransactions(selectedIds)
  }, [])

  const handleAddSelected = useCallback(() => {
    if (selectedTransactions.length === 0) return

    // Get the selected transaction data from the current list
    const selectedTransactionsData = selectedTransactions
      .map((docId) => {
        return outTransactions.find(
          (t) => t.documentId.toString() === docId.toString()
        )
      })
      .filter((t): t is IApOutTransaction => t !== undefined)

    if (selectedTransactionsData.length === 0) {
      // No valid transactions found, reset selection
      setSelectedTransactions([])
      return
    }

    // Create a set of existing document IDs for efficient lookup
    // Convert all to strings for consistent comparison since documentId is stored as string
    const existingIdsSet = new Set(existingDocumentIds.map((id) => String(id)))

    // Filter out already added transactions
    const newTransactions = selectedTransactionsData.filter((t) => {
      const docId = String(t.documentId)
      return !existingIdsSet.has(docId)
    })

    if (newTransactions.length === 0) {
      // All selected transactions already exist
      setSelectedTransactions([])
      toast.info("Selected transactions are already added")
      return
    }

    // Add the new transactions
    if (onAddSelected) {
      onAddSelected(newTransactions)
    }

    // Remove added transactions from the displayed list
    const addedIdsSet = new Set(
      newTransactions.map((t) => t.documentId.toString())
    )
    const remainingTransactions = outTransactions.filter(
      (transaction) => !addedIdsSet.has(transaction.documentId.toString())
    )
    setOutTransactions(remainingTransactions)

    // Reset selection but keep dialog open so user can add more transactions
    setSelectedTransactions([])
    // Don't close dialog automatically - let user close it manually
  }, [
    selectedTransactions,
    outTransactions,
    onAddSelected,
    existingDocumentIds,
  ])

  const handleCancel = useCallback(() => {
    setSelectedTransactions([])
    onOpenChangeAction(false)
  }, [onOpenChangeAction])

  const handleRefresh = useCallback(() => {
    loadTransactions()
  }, [loadTransactions])

  const handleFilterChange = useCallback(() => {}, [])

  const handleSelect = useCallback((_transaction: IApOutTransaction | null) => {
    // Optional: handle single selection if needed
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="flex h-[80vh] w-[80vw] !max-w-none flex-col rounded-lg">
        <DialogHeader>
          <DialogTitle>AP Transaction List</DialogTitle>
          <DialogDescription>
            Select outstanding transactions to add to the receipt.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Input Fields and Action Buttons */}
        <div className="flex items-end justify-between gap-4 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh transactions"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <CustomNumberInput
              form={summaryForm}
              name="selectedTotAmt"
              label="Total Amount"
              isDisabled={true}
              round={amtDec}
              className="w-[150px]"
            />
            <CustomNumberInput
              form={summaryForm}
              name="selectedTotLocalAmt"
              label="Total Local Amount"
              isDisabled={true}
              round={locAmtDec}
              className="w-[150px]"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleAddSelected}>
              Add Selected (
              {
                selectedTransactions.filter(
                  (docId) => !existingDocumentIds.includes(Number(docId))
                ).length
              }
              )
            </Button>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-4 text-sm text-gray-600">
                  Loading outstanding transactions...
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Fetching available transactions for payment
                </p>
              </div>
            </div>
          ) : (
            <ApOutStandingTransactionsTable
              key={tableKey}
              data={outTransactions}
              visible={visible}
              onRefreshAction={handleRefresh}
              onFilterChange={handleFilterChange}
              onSelect={handleSelect}
              onBulkSelectionChange={handleBulkSelectionChange}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
