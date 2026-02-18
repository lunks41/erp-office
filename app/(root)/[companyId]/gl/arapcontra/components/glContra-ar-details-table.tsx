import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { IGLContraDt } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import {
  ARTransactionId,
  GLTransactionId,
  ModuleId,
  TableName,
} from "@/lib/utils"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { AccountReceiptBaseTable } from "@/components/table/table-account-receipt"

// Extended column definition with hide property
type ExtendedColumnDef<T> = ColumnDef<T> & {
  hidden?: boolean
}

// Use flexible data type that can work with form data
interface ArGLContraDetailsTableProps {
  data: IGLContraDt[]
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onDataReorder?: (newData: IGLContraDt[]) => void
  onCellEdit?: (itemNo: number, field: string, value: number) => number | void
  visible: IVisibleFields
  isCancelled?: boolean
}

export default function ArGLContraDetailsTable({
  data,
  onDeleteAction,
  onBulkDeleteAction,
  onDataReorder,
  onCellEdit,
  visible: _visible,
  isCancelled = false,
}: ArGLContraDetailsTableProps) {
  const [mounted, setMounted] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState<{
    itemNo: number
    label: string
  } | null>(null)
  const { decimals } = useAuthStore()
  const { hasPermission } = usePermissionStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )
  const params = useParams()
  const companyId = useMemo(() => {
    const value = params?.companyId
    return typeof value === "string" && value.trim() ? value.trim() : null
  }, [params])

  const formatDateValue = useCallback(
    (value: string | Date | null | undefined) => {
      if (!value) return ""
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? "" : format(value, dateFormat)
      }
      const parsed = parseDate(value)
      if (!parsed) return value || ""
      return format(parsed, dateFormat)
    },
    [dateFormat]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const EditableNumberInput = ({
    value,
    decimals,
    onChange,
  }: {
    value: number
    decimals: number
    onChange: (value: number) => number | void
  }) => {
    const [displayValue, setDisplayValue] = useState(
      formatNumber(value, decimals)
    )

    useEffect(() => {
      setDisplayValue(formatNumber(value, decimals))
    }, [value, decimals])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayValue(e.target.value)
    }

    const handleBlur = () => {
      const cleanedValue = displayValue.replace(/,/g, "").trim()
      const numValue = Number(cleanedValue) || 0
      const roundedValue = Number(numValue.toFixed(decimals))

      const tolerance = Math.pow(10, -decimals) / 2
      if (Math.abs(roundedValue - value) <= tolerance) {
        setDisplayValue(formatNumber(value, decimals))
        return
      }

      const result = onChange(roundedValue)
      const finalValue = typeof result === "number" ? result : roundedValue
      setDisplayValue(formatNumber(finalValue, decimals))
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select()
    }

    return (
      <input
        type="text"
        className="w-full rounded border px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
        style={{ textAlign: "right" }}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="0.00"
      />
    )
  }

  const canNavigateToTransaction = useCallback(
    (transactionIdValue: number) => {
      if (!Number.isFinite(transactionIdValue)) return false
      return hasPermission(ModuleId.ar, transactionIdValue, "isRead")
    },
    [hasPermission]
  )

  const getTargetPath = useCallback(
    (transactionIdValue: number): string | null => {
      if (!companyId) return null

      switch (transactionIdValue) {
        case ARTransactionId.receipt:
          return `/${companyId}/ar/receipt`
        case ARTransactionId.refund:
          return `/${companyId}/ar/refund`
        case ARTransactionId.docsetoff:
          return `/${companyId}/ar/docsetoff`

        case ARTransactionId.invoice:
          return `/${companyId}/ar/invoice`
        case ARTransactionId.debitNote:
          return `/${companyId}/ar/debitnote`
        case ARTransactionId.creditNote:
          return `/${companyId}/ar/creditnote`
        case ARTransactionId.adjustment:
          return `/${companyId}/ar/adjustment`
        default:
          return null
      }
    },
    [companyId]
  )

  const getStorageKey = useCallback((targetPath: string | null) => {
    return targetPath ? `history-doc:${targetPath}` : null
  }, [])

  const handleDeleteRequest = useCallback(
    (itemId: string) => {
      if (isCancelled || !onDeleteAction) return

      const itemNo = Number(itemId)
      if (!Number.isFinite(itemNo)) return

      const detail = data.find((record) => record.itemNo === itemNo)
      const docNo = detail?.documentNo
        ? detail.documentNo.toString().trim()
        : ""
      const label = docNo ? `Document ${docNo}` : `Item No ${itemNo}`

      setPendingDeleteTarget({
        itemNo,
        label,
      })
      setDeleteDialogOpen(true)
    },
    [data, isCancelled, onDeleteAction]
  )

  const handleDeleteConfirm = useCallback(() => {
    if (!pendingDeleteTarget || !onDeleteAction) return

    onDeleteAction(pendingDeleteTarget.itemNo)
    setPendingDeleteTarget(null)
  }, [onDeleteAction, pendingDeleteTarget])

  const handleDeleteCancel = useCallback(() => {
    setPendingDeleteTarget(null)
  }, [])

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    setDeleteDialogOpen(open)
    if (!open) {
      setPendingDeleteTarget(null)
    }
  }, [])

  const handleDocumentNavigation = useCallback(
    (detail: IGLContraDt) => {
      const transactionIdValue = Number(detail.transactionId)
      const documentId = detail.documentId?.toString().trim()
      if (
        !documentId ||
        !Number.isFinite(transactionIdValue) ||
        !canNavigateToTransaction(transactionIdValue)
      ) {
        return
      }

      const targetPath = getTargetPath(transactionIdValue)
      if (!targetPath) return

      if (typeof window !== "undefined") {
        const storageKey = getStorageKey(targetPath)
        if (storageKey) {
          window.localStorage.setItem(storageKey, documentId)
        }
        window.open(targetPath, "_blank", "noopener,noreferrer")
      }
    },
    [canNavigateToTransaction, getStorageKey, getTargetPath]
  )

  // Define columns with visible prop checks - DocSetOff specific fields
  // Note: visible prop is part of the API for consistency with other detail tables
  // but IGLContraDt doesn't have fields that require conditional visibility
  const columns: ExtendedColumnDef<IGLContraDt>[] = [
    {
      accessorKey: "itemNo",
      header: "Item",
      size: 40,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">{row.original.itemNo}</div>
      ),
    },

    {
      accessorKey: "documentNo",
      header: "Document No",
      size: 150,
      cell: ({ row }: { row: { original: IGLContraDt } }) => {
        const docNo = row.original.documentNo?.toString().trim() || ""
        const isClickable = !!docNo
        const transactionIdValue = Number(row.original.transactionId)
        const canViewDocument =
          isClickable && canNavigateToTransaction(transactionIdValue)

        const handleActivate = () => {
          if (canViewDocument) {
            handleDocumentNavigation(row.original)
          }
        }

        const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
          if (!canViewDocument) return

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleActivate()
          }
        }

        return canViewDocument ? (
          <button
            type="button"
            onDoubleClick={handleActivate}
            onKeyDown={handleKeyDown}
            className="text-primary underline decoration-dotted underline-offset-2 hover:decoration-solid"
          >
            {docNo}
          </button>
        ) : docNo ? (
          <span className="text-muted-foreground">{docNo}</span>
        ) : (
          "-"
        )
      },
    },
    {
      accessorKey: "docRefNo",
      header: "Reference No",
      size: 120,
    },

    {
      accessorKey: "docCurrencyCode",
      header: "Currency Code",
      size: 60,
    },
    {
      accessorKey: "docExhRate",
      header: "Ex. Rate",
      size: 100,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.docExhRate, exhRateDec)}
        </div>
      ),
    },
    {
      accessorKey: "docAccountDate",
      header: "Account Date",
      size: 120,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-center">
          {formatDateValue(row.original.docAccountDate)}
        </div>
      ),
    },
    {
      accessorKey: "docBalAmt",
      header: "Balance Amt",
      size: 120,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.docBalAmt, amtDec)}
        </div>
      ),
    },

    {
      accessorKey: "allocAmt",
      header: "Alloc Amt",
      size: 150,
      cell: ({ row }: { row: { original: IGLContraDt } }) => {
        const docBalAmt = row.original.docBalAmt || 0
        const isNegative = docBalAmt < 0

        return (
          <EditableNumberInput
            value={row.original.allocAmt || 0}
            decimals={amtDec}
            onChange={(value) => {
              let numValue = Number(value) || 0

              if (isNegative && numValue > 0) numValue = -Math.abs(numValue)
              if (!isNegative && numValue < 0) numValue = Math.abs(numValue)

              if (isNegative) {
                if (numValue < docBalAmt) numValue = docBalAmt
              } else {
                if (numValue > docBalAmt) numValue = docBalAmt
              }

              if (onCellEdit) {
                const result = onCellEdit(
                  row.original.itemNo,
                  "allocAmt",
                  numValue
                )
                return typeof result === "number" ? result : numValue
              }

              return numValue
            }}
          />
        )
      },
    },
    {
      accessorKey: "docBalLocalAmt",
      header: "Balance Local Amt",
      size: 140,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.docBalLocalAmt, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "allocLocalAmt",
      header: "Alloc Local Amt",
      size: 170,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.allocLocalAmt, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "exhGainLoss",
      header: "Exh Gain/Loss",
      size: 100,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.exhGainLoss, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "docDueDate",
      header: "Due Date",
      size: 120,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-center">
          {formatDateValue(row.original.docDueDate)}
        </div>
      ),
    },
    {
      accessorKey: "docTotAmt",
      header: "Doc Total Amt",
      size: 100,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.docTotAmt, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "docTotLocalAmt",
      header: "Doc Total Local Amt",
      size: 120,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.docTotLocalAmt, locAmtDec)}
        </div>
      ),
    },

    {
      accessorKey: "docAllocAmt",
      header: "Doc Alloc Amt",
      size: 120,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.docAllocAmt, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "docAllocLocalAmt",
      header: "Doc Alloc Local Amt",
      size: 140,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.docAllocLocalAmt, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "centDiff",
      header: "Cent Diff",
      size: 80,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">
          {formatNumber(row.original.centDiff, locAmtDec)}
        </div>
      ),
    },

    {
      accessorKey: "transactionId",
      header: "Transaction",
      size: 100,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">{row.original.transactionId}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "docCurrencyId",
      header: "Currency ID",
      size: 100,
      cell: ({ row }: { row: { original: IGLContraDt } }) => (
        <div className="text-right">{row.original.docCurrencyId}</div>
      ),
      hidden: true,
    },
  ]

  // Filter out columns with hidden: true
  const visibleColumns = columns.filter((column) => !column.hidden)

  if (!mounted) {
    return null
  }

  return (
    <div>
      <AccountReceiptBaseTable
        data={data}
        columns={visibleColumns as ColumnDef<IGLContraDt>[]}
        moduleId={ModuleId.gl}
        transactionId={GLTransactionId.arapcontra}
        tableName={TableName.glContraDt}
        emptyMessage="No GL Contra details found."
        accessorId="itemNo"
        onBulkDeleteAction={
          isCancelled
            ? undefined
            : (selectedIds: string[]) =>
                onBulkDeleteAction?.(selectedIds.map((id) => Number(id)))
        }
        onBulkSelectionChange={() => {}}
        onDataReorder={isCancelled ? undefined : onDataReorder}
        onDeleteAction={isCancelled ? undefined : handleDeleteRequest}
        showHeader={true}
        showActions={true}
        hideEdit={true}
        hideDelete={isCancelled}
        hideCheckbox={isCancelled}
        disableOnAccountExists={false}
        maxHeight="380px"
        pageSizeOption={10}
      />
      <DeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleDeleteConfirm}
        onCancelAction={handleDeleteCancel}
        itemName={pendingDeleteTarget?.label}
        description="This detail will be removed from the GL Contra. This action cannot be undone."
      />
    </div>
  )
}
