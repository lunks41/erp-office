import { useEffect, useState } from "react"
import { ICbGenPaymentDt } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { CellContext, ColumnDef } from "@tanstack/react-table"
import { formatNumber } from "@/lib/format-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import { AccountBaseTable } from "@/components/table/table-account"

// Use flexible data type that can work with form data
import { useCompanyStore } from "@/stores/company-store"
interface CbGenPaymentDetailsTableProps {
  data: ICbGenPaymentDt[]
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onEditAction?: (template: ICbGenPaymentDt) => void
  onCloneAction?: (template: ICbGenPaymentDt) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: ICbGenPaymentDt[]) => void
  visible: IVisibleFields
  isCancelled?: boolean
}

export default function CbGenPaymentDetailsTable({
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
}: CbGenPaymentDetailsTableProps) {
  const [mounted, setMounted] = useState(false)
  const { decimals } = useCompanyStore()
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
  const columns: ColumnDef<ICbGenPaymentDt>[] = [
    {
      accessorKey: "seqNo",
      header: "Seq No",
      size: 60,
      cell: ({ row }: { row: { original: ICbGenPaymentDt } }) => (
        <div className="truncate text-right">{row.original.seqNo}</div>
      ),
    },
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
      accessorKey: "totAmt",
      header: "Amount",
      size: 100,
      cell: ({ row }: CellContext<ICbGenPaymentDt, unknown>) => (
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
            cell: ({ row }: CellContext<ICbGenPaymentDt, unknown>) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("gstPercentage"), 2)}
              </div>
            ),
          },
          {
            accessorKey: "gstAmt",
            header: "VAT Amount",
            size: 100,
            cell: ({ row }: CellContext<ICbGenPaymentDt, unknown>) => (
              <div className="truncate text-right">
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
      cell: ({ row }: CellContext<ICbGenPaymentDt, unknown>) => (
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
            cell: ({ row }: CellContext<ICbGenPaymentDt, unknown>) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("totCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<ICbGenPaymentDt>,
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
            cell: ({ row }: CellContext<ICbGenPaymentDt, unknown>) => (
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
            cell: ({ row }: CellContext<ICbGenPaymentDt, unknown>) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("gstCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<ICbGenPaymentDt>,
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
            accessorKey: "voyageNo",
            header: "Voyage",
            size: 200,
          },
        ]
      : []),
    {
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
      cell: ({ row }: { row: { original: ICbGenPaymentDt } }) => (
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
        moduleId={ModuleId.cb}
        transactionId={CBTransactionId.cbgenpayment}
        tableName={TableName.cbGenPaymentDt}
        emptyMessage="No cbGenPayment details found."
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
