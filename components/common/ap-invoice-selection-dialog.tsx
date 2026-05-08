"use client"

import { useCompanyStore } from "@/stores/company-store"

import * as React from "react"
import { IApSupplierInvoice } from "@/interfaces"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { APTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetSupplierInvoices } from "@/hooks/use-histoy"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogDataTable } from "@/components/table/table-dialog"

interface InvoiceSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId?: number
  currencyId?: number
  onSelect?: (invoice: IApSupplierInvoice) => void
}

const moduleId = ModuleId.ap
const transactionId = APTransactionId.invoice

export default function InvoiceSelectionDialog({
  open,
  onOpenChange,
  supplierId,
  currencyId,
  onSelect,
}: InvoiceSelectionDialogProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat

  const canLoadData =
    !!supplierId && supplierId > 0 && !!currencyId && currencyId > 0

  const {
    data: invoiceResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetSupplierInvoices<IApSupplierInvoice[]>(supplierId, currencyId, {
    enabled: open && canLoadData,
  })

  React.useEffect(() => {
    if (open && canLoadData) {
      refetch()
    }
  }, [open, canLoadData, refetch])

  const invoices = React.useMemo(
    () => (invoiceResponse?.data as IApSupplierInvoice[]) || [],
    [invoiceResponse?.data]
  )

  const formatDateValue = React.useCallback(
    (value?: string | Date | null) => {
      if (!value) {
        return "-"
      }

      const parsed =
        value instanceof Date
          ? value
          : (parseDate(value) ??
            (typeof value === "string" ? new Date(value) : null))

      if (!parsed || Number.isNaN(parsed.getTime())) {
        return "-"
      }

      return format(parsed, dateFormat)
    },
    [dateFormat]
  )

  const columns = React.useMemo<ColumnDef<IApSupplierInvoice>[]>(() => {
    return [
      {
        accessorKey: "invoiceNo",
        header: "Invoice No",
        cell: ({ row }) => row.original.invoiceNo || "-",
      },
      {
        accessorKey: "referenceNo",
        header: "Reference No",
        cell: ({ row }) => row.original.referenceNo || "-",
      },
      {
        accessorKey: "accountDate",
        header: "Account Date",
        cell: ({ row }) => formatDateValue(row.original.accountDate ?? null),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => formatDateValue(row.original.dueDate ?? null),
      },
      {
        accessorKey: "currencyCode",
        header: "Currency",
        cell: ({ row }) => row.original.currencyCode || "-",
      },
      {
        accessorKey: "exhRate",
        header: "Exchange Rate",
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.exhRate ?? 0, amtDec)}
          </div>
        ),
      },
      {
        accessorKey: "totAmt",
        header: "Total Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.totAmt ?? 0, amtDec)}
          </div>
        ),
      },
      {
        accessorKey: "totLocalAmt",
        header: "Total Local Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.totLocalAmt ?? 0, locAmtDec)}
          </div>
        ),
      },
      {
        accessorKey: "gstAmt",
        header: "VAT Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.gstAmt ?? 0, amtDec)}
          </div>
        ),
      },
      {
        accessorKey: "gstLocalAmt",
        header: "VAT Local Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.gstLocalAmt ?? 0, locAmtDec)}
          </div>
        ),
      },
      {
        accessorKey: "gstCtyAmt",
        header: "GST Country Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.gstCtyAmt ?? 0, amtDec)}
          </div>
        ),
      },
      {
        accessorKey: "totAmtAftGst",
        header: "Total Amount After GST",
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.totAmtAftGst ?? 0, amtDec)}
          </div>
        ),
      },
      {
        accessorKey: "totLocalAmtAftGst",
        header: "Total Local Amount After GST",
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.totLocalAmtAftGst ?? 0, locAmtDec)}
          </div>
        ),
      },
      {
        accessorKey: "totCtyAmtAftGst",
        header: "Total Country Amount After GST",
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.totCtyAmtAftGst ?? 0, amtDec)}
          </div>
        ),
      },
    ]
  }, [amtDec, locAmtDec, formatDateValue])

  const handleRowSelect = React.useCallback(
    (invoice: IApSupplierInvoice | null) => {
      if (!invoice) {
        return
      }
      onSelect?.(invoice)
      onOpenChange(false)
    },
    [onOpenChange, onSelect]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="@container flex h-[70vh] w-[80vw] max-w-none! flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-xl font-semibold">
            Select Invoice
          </DialogTitle>
          <DialogDescription>
            Choose an invoice to populate the credit note. Click a row to select
            it.
          </DialogDescription>
        </DialogHeader>

        {!canLoadData ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center px-6 py-10 text-sm">
            Select both supplier and currency before choosing an invoice.
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden px-4 py-3">
            <DialogDataTable<IApSupplierInvoice>
              data={invoices}
              columns={columns}
              isLoading={isLoading || isFetching}
              moduleId={moduleId}
              transactionId={transactionId}
              tableName={TableName.arInvoice}
              emptyMessage="No invoices found for the selected supplier and currency."
              onRefreshAction={() => refetch()}
              onRowSelect={handleRowSelect}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
