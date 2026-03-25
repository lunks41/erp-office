import React, { useEffect, useState } from "react"
import { IArCreditNoteDt } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef, Row } from "@tanstack/react-table"

import { formatNumber } from "@/lib/format-utils"
import { ARTransactionId, ModuleId, TableName } from "@/lib/utils"
import { AccountBaseTable } from "@/components/table/table-account"

// Use flexible data type that can work with form data
interface CreditNoteDetailsTableProps {
  data: IArCreditNoteDt[]
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onEditAction?: (template: IArCreditNoteDt) => void
  onCloneAction?: (template: IArCreditNoteDt) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: IArCreditNoteDt[]) => void
  visible: IVisibleFields
  isCancelled?: boolean
}

export default function CreditNoteDetailsTable({
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
}: CreditNoteDetailsTableProps) {
  const [mounted, setMounted] = useState(false)
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2

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
  const columns: ColumnDef<IArCreditNoteDt>[] = [
    {
      accessorKey: "seqNo",
      header: "Seq No",
      size: 60,
      cell: ({ row }: { row: { original: IArCreditNoteDt } }) => (
        <div className="truncate text-right">{row.original.seqNo}</div>
      ),
    },
    ...(visible?.m_ProductId
      ? [
          {
            accessorKey: "productName",
            header: "Product",
            size: 100,
          },
        ]
      : []),
    {
      accessorKey: "glCode",
      header: "Code",
      size: 100,
    },
    {
      accessorKey: "glName",
      header: "Account",
      size: 100,
    },
    ...(visible?.m_DepartmentId
      ? [
          {
            accessorKey: "departmentName",
            header: "Department",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_Remarks
      ? [
          {
            accessorKey: "remarks",
            header: "Remarks",
            size: 200,
          },
        ]
      : []),
    ...(visible?.m_QTY
      ? [
          {
            accessorKey: "qty",
            header: "Qty",
            size: 60,
            cell: ({ row }: { row: { original: IArCreditNoteDt } }) => (
              <div className="truncate text-right">{row.original.qty}</div>
            ),
          },
        ]
      : []),

    ...(visible?.m_UomId
      ? [
          {
            accessorKey: "uomName",
            header: "UOM",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_UnitPrice
      ? [
          {
            accessorKey: "unitPrice",
            header: "Price",
            size: 100,
            cell: ({ row }: { row: Row<IArCreditNoteDt> }) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("unitPrice"), amtDec)}
              </div>
            ),
          } as ColumnDef<IArCreditNoteDt>,
        ]
      : []),
    {
      accessorKey: "totAmt",
      header: "Amount",
      size: 100,
      cell: ({ row }: { row: Row<IArCreditNoteDt> }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totAmt"), amtDec)}
        </div>
      ),
    },

    ...(visible?.m_GstId
      ? [
          {
            accessorKey: "gstPercentage",
            header: "VAT %",
            size: 50,
            cell: ({ row }: { row: { original: IArCreditNoteDt } }) => (
              <div className="truncate text-right">
                {formatNumber(row.original.gstPercentage, 2)}
              </div>
            ),
          },
          {
            accessorKey: "gstAmt",
            header: "VAT Amount",
            size: 100,
            cell: ({ row }: { row: Row<IArCreditNoteDt> }) => (
              <div className="truncate text-right">
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
            cell: ({ row }: { row: { original: IArCreditNoteDt } }) => (
              <div className="truncate text-right">{row.original.billQTY}</div>
            ),
          },
        ]
      : []),
    {
      accessorKey: "totLocalAmt",
      header: "Local Amount",
      size: 100,
      cell: ({ row }: { row: Row<IArCreditNoteDt> }) => (
        <div className="truncate text-right">
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
            cell: ({ row }: { row: Row<IArCreditNoteDt> }) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("totCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<IArCreditNoteDt>,
        ]
      : []),
    ...(visible?.m_GstId
      ? [
          {
            accessorKey: "gstName",
            header: "Gst",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_GstId
      ? [
          {
            accessorKey: "gstLocalAmt",
            header: "VAT Local Amount",
            size: 100,
            cell: ({ row }: { row: Row<IArCreditNoteDt> }) => (
              <div className="truncate text-right">
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
            cell: ({ row }: { row: Row<IArCreditNoteDt> }) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("gstCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<IArCreditNoteDt>,
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
            size: 200,
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
      size: 80,
      cell: ({ row }: { row: { original: IArCreditNoteDt } }) => (
        <div className="truncate text-right">{row.original.docItemNo}</div>
      ),
    },
    {
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
      cell: ({ row }: { row: { original: IArCreditNoteDt } }) => (
        <div className="truncate text-right">{row.original.itemNo}</div>
      ),
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full px-2 pt-1 pb-2">
      <AccountBaseTable
        data={data}
        columns={columns}
        moduleId={ModuleId.ar}
        transactionId={ARTransactionId.creditNote}
        tableName={TableName.arCreditNoteDt}
        emptyMessage="No creditNote details found."
        accessorId="itemNo"
        enableSorting={false}
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
      />
    </div>
  )
}
