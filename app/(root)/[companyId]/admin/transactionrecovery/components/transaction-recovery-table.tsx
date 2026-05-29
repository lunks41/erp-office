"use client"

import { IActiveDocument } from "@/interfaces/admin"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"
import { CheckCircle } from "lucide-react"

import { TableName } from "@/lib/utils"
import { MainTable } from "@/components/table/table-main"
import { Button } from "@/components/ui/button"

interface TransactionRecoveryTableProps {
  data: IActiveDocument[]
  isLoading?: boolean
  onActivate?: (doc: IActiveDocument) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  initialSearchValue?: string
  isActivating?: boolean
}

export function TransactionRecoveryTable({
  data,
  isLoading = false,
  onActivate,
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
  isActivating = false,
}: TransactionRecoveryTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yy"

  const columns: ColumnDef<IActiveDocument>[] = [
    {
      id: "action",
      header: "Action",
      enableHiding: false,
      size: 100,
      minSize: 80,
      cell: ({ row }) => (
        <Button
          variant="default"
          size="sm"
          className="gap-1"
          disabled={isActivating}
          onClick={() => onActivate?.(row.original)}
        >
          <CheckCircle className="h-4 w-4" />
          Active
        </Button>
      ),
    },
    {
      accessorKey: "documentType",
      header: "Type",
      size: 140,
      minSize: 80,
      maxSize: 200,
    },
    {
      accessorKey: "documentNo",
      header: "Document NO",
      size: 140,
      minSize: 80,
      maxSize: 200,
    },
    {
      accessorKey: "accountDate",
      header: "AccountDate",
      size: 140,
      minSize: 100,
      maxSize: 180,
      cell: ({ row }) => {
        const raw = row.getValue("accountDate")
        if (!raw) return "-"
        const date =
          typeof raw === "string"
            ? new Date(raw)
            : raw instanceof Date
              ? raw
              : null
        return date && isValid(date) ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "referenceNo",
      header: "RefNO",
      size: 140,
      minSize: 80,
      maxSize: 200,
    },
    {
      accessorKey: "totAmt",
      header: "TotAmt",
      size: 120,
      minSize: 80,
      cell: ({ row }) => {
        const val = row.getValue("totAmt") as number
        return typeof val === "number"
          ? val.toLocaleString(undefined, { minimumFractionDigits: 2 })
          : "-"
      },
    },
    {
      accessorKey: "gstAmt",
      header: "VAT Amt",
      size: 120,
      minSize: 80,
      cell: ({ row }) => {
        const val = row.getValue("gstAmt") as number
        return typeof val === "number"
          ? val.toLocaleString(undefined, { minimumFractionDigits: 2 })
          : "-"
      },
    },
    {
      accessorKey: "totAmtAftGst",
      header: "Tot Amt VAT",
      size: 120,
      minSize: 80,
      cell: ({ row }) => {
        const val = row.getValue("totAmtAftGst") as number
        return typeof val === "number"
          ? val.toLocaleString(undefined, { minimumFractionDigits: 2 })
          : "-"
      },
    },
    {
      accessorKey: "cancelBy",
      header: "CancelBy",
      size: 120,
      minSize: 80,
    },
    {
      accessorKey: "cancelDate",
      header: "CancelDate",
      size: 160,
      minSize: 120,
      cell: ({ row }) => {
        const raw = row.getValue("cancelDate")
        if (!raw) return "-"
        const date =
          typeof raw === "string"
            ? new Date(raw)
            : raw instanceof Date
              ? raw
              : null
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
    },
    {
      accessorKey: "createBy",
      header: "CreateBy",
      size: 120,
      minSize: 80,
    },
    {
      accessorKey: "createDate",
      header: "CreateDate",
      size: 160,
      minSize: 120,
      cell: ({ row }) => {
        const raw = row.getValue("createDate")
        if (!raw) return "-"
        const date =
          typeof raw === "string"
            ? new Date(raw)
            : raw instanceof Date
              ? raw
              : null
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
    },
    {
      accessorKey: "editBy",
      header: "EditBy",
      size: 120,
      minSize: 80,
    },
    {
      accessorKey: "editDate",
      header: "EditDate",
      size: 160,
      minSize: 120,
      cell: ({ row }) => {
        const raw = row.getValue("editDate")
        if (!raw) return "-"
        const date =
          typeof raw === "string"
            ? new Date(raw)
            : raw instanceof Date
              ? raw
              : null
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
    },
  ]

  return (
    <MainTable<IActiveDocument>
      data={data}
      columns={columns}
      isLoading={isLoading}
      tableName={TableName.user}
      emptyMessage="No cancelled documents found."
      accessorId="documentId"
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      showHeader={true}
      showFooter={true}
      showActions={false}
    />
  )
}
