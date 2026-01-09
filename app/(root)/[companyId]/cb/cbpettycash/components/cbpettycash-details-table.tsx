import { useEffect, useState } from "react"
import { ICbPettyCashDt } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { CellContext, ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import { AccountBaseTable } from "@/components/table/table-account"

// Use flexible data type that can work with form data
interface CbPettyCashDetailsTableProps {
  data: ICbPettyCashDt[]
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onEditAction?: (template: ICbPettyCashDt) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: ICbPettyCashDt[]) => void
  visible: IVisibleFields
  isCancelled?: boolean
}

export default function CbPettyCashDetailsTable({
  data,
  onDeleteAction,
  onBulkDeleteAction,
  onEditAction,
  onRefreshAction,
  onFilterChange,
  onDataReorder,
  visible,
  isCancelled = false,
}: CbPettyCashDetailsTableProps) {
  const [mounted, setMounted] = useState(false)
  const { decimals } = useAuthStore()
  const amtDec = decimals?.[0]?.amtDec || 2
  const locAmtDec = decimals?.[0]?.locAmtDec || 2
  const dateFormat = decimals?.[0]?.dateFormat || "dd/MM/yyyy"

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
  const columns: ColumnDef<ICbPettyCashDt>[] = [
    {
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
      cell: ({ row }: { row: { original: ICbPettyCashDt } }) => (
        <div className="text-right">{row.original.itemNo}</div>
      ),
    },
    {
      accessorKey: "seqNo",
      header: "Seq No",
      size: 60,
      cell: ({ row }: { row: { original: ICbPettyCashDt } }) => (
        <div className="text-right">{row.original.seqNo}</div>
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
    ...(visible?.m_InvoiceDate
      ? [
          {
            accessorKey: "invoiceDate",
            header: "Invoice Date",
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => {
              const dateValue = row.getValue("invoiceDate")
              if (!dateValue) return "-"

              let date: Date | null = null
              if (typeof dateValue === "string") {
                date = parseDate(dateValue)
              } else if (dateValue instanceof Date) {
                date = dateValue
              }

              if (date && isValid(date)) {
                return format(date, dateFormat)
              }
              return "-"
            },
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_InvoiceNo
      ? [
          {
            accessorKey: "invoiceNo",
            header: "Invoice No",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_SupplierName
      ? [
          {
            accessorKey: "supplierName",
            header: "Supplier Name",
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
      cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
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
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstPercentage"), 2)}
              </div>
            ),
          },
          {
            accessorKey: "gstAmt",
            header: "VAT Amount",
            size: 100,
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstAmt"), amtDec)}
              </div>
            ),
          },
        ]
      : []),

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
    ...(visible?.m_GstNo
      ? [
          {
            accessorKey: "supplierRegNo",
            header: "TRN No",
            size: 100,
          },
        ]
      : []),
    {
      accessorKey: "totLocalAmt",
      header: "Local Amount",
      size: 100,
      cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
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
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("totCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<ICbPettyCashDt>,
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
            header: "GST Local Amount",
            size: 100,
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
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
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
              <div className="text-right">
                {formatNumber(row.getValue("gstCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<ICbPettyCashDt>,
        ]
      : []),

    ...(visible?.m_ServiceCategoryId
      ? [
          {
            accessorKey: "serviceCategoryName",
            header: "Service Category",
            size: 100,
          },
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
        transactionId={CBTransactionId.cbpettycash}
        tableName={TableName.cbPettyCashDt}
        emptyMessage="No cbPettyCash details found."
        accessorId="itemNo"
        onRefreshAction={onRefreshAction}
        onFilterChange={onFilterChange}
        onBulkDeleteAction={handleBulkDelete}
        onBulkSelectionChange={() => {}}
        onDataReorder={onDataReorder}
        onEditAction={onEditAction}
        onDeleteAction={handleDelete}
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
