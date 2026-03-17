import React, { useEffect, useState } from "react"
import { IApInvoiceDt } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { CellContext, ColumnDef } from "@tanstack/react-table"

import { formatNumber } from "@/lib/format-utils"
import { APTransactionId, ModuleId, TableName } from "@/lib/utils"
import { AccountBaseTable } from "@/components/table/table-account"

// Use flexible data type that can work with form data
interface InvoiceDetailsTableProps {
  data: IApInvoiceDt[]
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onEditAction?: (template: IApInvoiceDt) => void
  onCloneAction?: (template: IApInvoiceDt) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: IApInvoiceDt[]) => void
  visible: IVisibleFields
  isCancelled?: boolean
  maxHeight?: number | string
  visibleRows?: number
  rowHeight?: number
}

export default function InvoiceDetailsTable({
  data,
  onDeleteAction,
  onBulkDeleteAction,
  onEditAction,
  onCloneAction,
  onRefreshAction,
  onFilterChange,
  onDataReorder,
  visible,
  isCancelled = false,
  maxHeight = 480,
  visibleRows,
  rowHeight = 36,
}: InvoiceDetailsTableProps) {
  const [mounted, setMounted] = useState(false)
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2

  const headerHeight = 44
  const computedMaxHeight =
    typeof visibleRows === "number"
      ? headerHeight + visibleRows * rowHeight
      : maxHeight
  const resolvedMaxHeight =
    typeof computedMaxHeight === "number"
      ? `${computedMaxHeight}px`
      : computedMaxHeight

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wrapper functions to convert string to number
  const handleDelete = (itemId: string) => {
    if (onDeleteAction) {
      onDeleteAction(Number(itemId))
    }
  }

  const handleBulkDelete = (selectedIds: string[]) => {
    if (onBulkDeleteAction) {
      onBulkDeleteAction(selectedIds.map((id) => Number(id)))
    }
  }

  // Define columns with visible prop checks
  const columns: ColumnDef<IApInvoiceDt>[] = [
    {
      accessorKey: "itemNo",
      header: "Item No.",
      size: 110,
      cell: ({ row }: { row: { original: IApInvoiceDt } }) => (
        <div className="text-right">{row.original.itemNo}</div>
      ),
    },
    {
      accessorKey: "seqNo",
      header: "Seq. No.",
      size: 110,
      cell: ({ row }: { row: { original: IApInvoiceDt } }) => (
        <div className="text-right">{row.original.seqNo}</div>
      ),
    },
    ...(visible?.m_ProductId
      ? [
          {
            accessorKey: "productName",
            header: "Product",
            size: 105,
          },
        ]
      : []),
    {
      accessorKey: "glCode",
      header: "Code",
      size: 90,
    },
    {
      accessorKey: "glName",
      header: "Account",
      size: 110,
    },
    ...(visible?.m_DepartmentId
      ? [
          {
            accessorKey: "departmentName",
            header: "Department",
            size: 130,
          },
        ]
      : []),
    ...(visible?.m_JobOrderId
      ? [
          {
            accessorKey: "jobOrderNo",
            header: "Job Order",
            size: 120,
          },

          {
            accessorKey: "taskName",
            header: "Task",
            size: 90,
          },

          {
            accessorKey: "serviceItemNoName",
            header: "Service",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_Remarks
      ? [
          {
            accessorKey: "remarks",
            header: "Remarks",
            size: 150,
          },
        ]
      : []),
    ...(visible?.m_QTY
      ? [
          {
            accessorKey: "qty",
            header: "Qty",
            size: 80,
            cell: ({ row }: { row: { original: IApInvoiceDt } }) => (
              <div className="text-right">{row.original.qty}</div>
            ),
          },
        ]
      : []),

    ...(visible?.m_UomId
      ? [
          {
            accessorKey: "uomName",
            header: "UOM",
            size: 95,
          },
        ]
      : []),
    ...(visible?.m_UnitPrice
      ? [
          {
            accessorKey: "unitPrice",
            header: "Price",
            size: 100,
            cell: ({ row }: CellContext<IApInvoiceDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("unitPrice"), amtDec)}
              </div>
            ),
          } as ColumnDef<IApInvoiceDt>,
        ]
      : []),
    {
      accessorKey: "totAmt",
      header: "Amount",
      size: 105,
      cell: ({ row }: CellContext<IApInvoiceDt, unknown>) => (
        <div className="text-right">
          {formatNumber(row.getValue("totAmt"), amtDec)}
        </div>
      ),
    },

    ...(visible?.m_GstId
      ? [
          {
            accessorKey: "gstPercentage",
            header: "VAT %",
            size: 95,
            cell: ({ row }: CellContext<IApInvoiceDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstPercentage"), 2)}
              </div>
            ),
          },
          {
            accessorKey: "gstAmt",
            header: "VAT Amount",
            size: 130,
            cell: ({ row }: CellContext<IApInvoiceDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstAmt"), amtDec)}
              </div>
            ),
          },
        ]
      : []),
    ...(visible?.m_BillQTY
      ? [
          {
            accessorKey: "billQTY",
            header: "Bill Qty",
            size: 60,
            cell: ({ row }: { row: { original: IApInvoiceDt } }) => (
              <div className="text-right">{row.original.billQTY}</div>
            ),
          },
        ]
      : []),
    {
      accessorKey: "totLocalAmt",
      header: "Local Amount",
      size: 135,
      cell: ({ row }: CellContext<IApInvoiceDt, unknown>) => (
        <div className="text-right">
          {formatNumber(row.getValue("totLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    ...(visible?.m_CtyCurr
      ? [
          {
            accessorKey: "totCtyAmt",
            header: "Country Amount",
            size: 100,
            cell: ({ row }: CellContext<IApInvoiceDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("totCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<IApInvoiceDt>,
        ]
      : []),
    ...(visible?.m_GstId
      ? [
          {
            accessorKey: "gstName",
            header: "Gst",
            size: 80,
          },
        ]
      : []),
    ...(visible?.m_GstId
      ? [
          {
            accessorKey: "gstLocalAmt",
            header: "VAT Local Amount",
            size: 170,
            cell: ({ row }: CellContext<IApInvoiceDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstLocalAmt"), locAmtDec)}
              </div>
            ),
          },
        ]
      : []),
    ...(visible?.m_CtyCurr && visible?.m_GstId
      ? [
          {
            accessorKey: "gstCtyAmt",
            header: "GST Country Amount",
            size: 100,
            cell: ({ row }: CellContext<IApInvoiceDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<IApInvoiceDt>,
        ]
      : []),

    ...(visible?.m_EmployeeId
      ? [
          {
            accessorKey: "employeeName",
            header: "Employee",
            size: 200,
          },
        ]
      : []),
    ...(visible?.m_PortId
      ? [
          {
            accessorKey: "portName",
            header: "Port",
            size: 200,
          },
        ]
      : []),
    ...(visible?.m_VesselId
      ? [
          {
            accessorKey: "vesselName",
            header: "Vessel",
            size: 90,
          },
        ]
      : []),
    ...(visible?.m_BargeId
      ? [
          {
            accessorKey: "bargeName",
            header: "Barge",
            size: 200,
          },
        ]
      : []),
    ...(visible?.m_VoyageId
      ? [
          {
            accessorKey: "voyageName",
            header: "Voyage",
            size: 200,
          },
        ]
      : []),
    {
      accessorKey: "docItemNo",
      header: "Doc Item No",
      size: 100,
      cell: ({ row }: { row: { original: IApInvoiceDt } }) => (
        <div className="text-right">{row.original.docItemNo}</div>
      ),
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full px-2 pt-1 pb-2">
      <div className="overflow-hidden">
        <AccountBaseTable
          data={data}
          columns={columns}
          moduleId={ModuleId.ap}
          transactionId={APTransactionId.invoice}
          tableName={TableName.apInvoiceDt}
          emptyMessage="No invoice details found."
          accessorId="itemNo"
          onRefreshAction={onRefreshAction}
          onFilterChange={onFilterChange}
          onBulkDeleteAction={handleBulkDelete}
          onBulkSelectionChange={() => {}}
          onDataReorder={onDataReorder}
          onEditAction={onEditAction}
          onDeleteAction={handleDelete}
          onCloneAction={onCloneAction}
          showHeader={true}
          showActions={true}
          hideEdit={isCancelled}
          hideDelete={isCancelled}
          hideCheckbox={isCancelled}
          disableOnAccountExists={false}
          maxHeight={resolvedMaxHeight}
        />
      </div>
    </div>
  )
}
