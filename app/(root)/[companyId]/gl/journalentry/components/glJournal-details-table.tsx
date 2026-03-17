import React, { useEffect, useState } from "react"
import { IGLJournalDt } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { CellContext, ColumnDef } from "@tanstack/react-table"

import { formatNumber } from "@/lib/format-utils"
import { GLTransactionId, ModuleId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AccountBaseTable } from "@/components/table/table-account"

// Use flexible data type that can work with form data
interface GLJournalDetailsTableProps {
  data: IGLJournalDt[]
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onEditAction?: (template: IGLJournalDt) => void
  onCloneAction?: (template: IGLJournalDt) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: IGLJournalDt[]) => void
  visible: IVisibleFields
  isCancelled?: boolean
}

export default function GLJournalDetailsTable({
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
}: GLJournalDetailsTableProps) {
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
  const columns: ColumnDef<IGLJournalDt>[] = [
    {
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
      cell: ({ row }: { row: { original: IGLJournalDt } }) => (
        <div className="text-right">{row.original.itemNo}</div>
      ),
    },
    {
      accessorKey: "seqNo",
      header: "Seq No",
      size: 60,
      cell: ({ row }: { row: { original: IGLJournalDt } }) => (
        <div className="text-right">{row.original.seqNo}</div>
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
    {
      accessorKey: "isDebit",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.isDebit ? "default" : "destructive"}>
          {row.original.isDebit ? "Debit" : "Credit"}
        </Badge>
      ),
    },
    {
      accessorKey: "totAmt",
      header: "Amount",
      size: 100,
      cell: ({ row }: CellContext<IGLJournalDt, unknown>) => (
        <div className="text-right">
          {formatNumber(row.getValue("totAmt"), amtDec)}
        </div>
      ),
    },
    ...(visible?.m_JobOrderId
      ? [
          {
            accessorKey: "jobOrderNo",
            header: "Job Order",
            size: 100,
          },

          {
            accessorKey: "taskName",
            header: "Task",
            size: 100,
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
            size: 200,
          },
        ]
      : []),
    {
      accessorKey: "isDebit",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.isDebit ? "default" : "destructive"}>
          {row.original.isDebit ? "Debit" : "Credit"}
        </Badge>
      ),
    },
    {
      accessorKey: "totAmt",
      header: "Amount",
      size: 100,
      cell: ({ row }: CellContext<IGLJournalDt, unknown>) => (
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
            size: 50,
            cell: ({ row }: CellContext<IGLJournalDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstPercentage"), 2)}
              </div>
            ),
          },
          {
            accessorKey: "gstAmt",
            header: "VAT Amount",
            size: 100,
            cell: ({ row }: CellContext<IGLJournalDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstAmt"), amtDec)}
              </div>
            ),
          },
        ]
      : []),

    {
      accessorKey: "totLocalAmt",
      header: "Local Amount",
      size: 100,
      cell: ({ row }: CellContext<IGLJournalDt, unknown>) => (
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
            cell: ({ row }: CellContext<IGLJournalDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("totCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<IGLJournalDt>,
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
            cell: ({ row }: CellContext<IGLJournalDt, unknown>) => (
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
            cell: ({ row }: CellContext<IGLJournalDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<IGLJournalDt>,
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
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full px-2 pt-1 pb-2">
      <AccountBaseTable
        data={data}
        columns={columns}
        moduleId={ModuleId.gl}
        transactionId={GLTransactionId.journalentry}
        tableName={TableName.glJournalDt}
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
      />
    </div>
  )
}
