"use client"

import { useMemo } from "react"
import { IJobTransaction } from "@/interfaces"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface JobTransactionTableProps {
  data: IJobTransaction[]
  isLoading?: boolean
  onEdit: (row: IJobTransaction) => void
}

export function JobTransactionTable({
  data,
  isLoading,
  onEdit,
}: JobTransactionTableProps) {
  const columns: ColumnDef<IJobTransaction>[] = useMemo(
    () => [
      {
        id: "actions",
        header: "Actions",
        size: 90,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(row.original)}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "moduleId",
        header: "Module Id",
        size: 90,
        meta: { hidden: true },
      },
      {
        accessorKey: "transactionId",
        header: "Transaction Id",
        size: 110,
        meta: { hidden: true },
      },
      {
        accessorKey: "invoiceId",
        header: "Invoice Id",
        size: 140,
        meta: { hidden: true },
      },
      { accessorKey: "itemNo", header: "Item No", size: 80 },
      { accessorKey: "seqNo", header: "Seq No", size: 80 },
      { accessorKey: "invoiceNo", header: "Invoice No", size: 130 },
      {
        accessorKey: "accountDate",
        header: "Account Date",
        size: 110,
        cell: ({ row }) =>
          row.original.accountDate
            ? new Date(row.original.accountDate).toLocaleDateString()
            : "-",
      },
      { accessorKey: "suppInvoiceNo", header: "Supp Invoice No", size: 160 },
      { accessorKey: "supplierName", header: "Supplier Name", size: 180 },
      {
        accessorKey: "jobOrderId",
        header: "Job Order Id",
        size: 100,
        meta: { hidden: true },
      },
      { accessorKey: "jobOrderNo", header: "Job Order No", size: 160 },
      {
        accessorKey: "taskId",
        header: "Task Id",
        size: 80,
        meta: { hidden: true },
      },
      { accessorKey: "taskName", header: "Task Name", size: 140 },
      {
        accessorKey: "serviceItemNo",
        header: "Service Item No",
        size: 120,
        meta: { hidden: true },
      },
      { accessorKey: "serviceName", header: "Service Name", size: 180 },
      { accessorKey: "remarks", header: "Remarks", size: 200 },
    ],
    [onEdit]
  )

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) =>
      `${row.invoiceId}-${row.itemNo}-${row.seqNo}`,
    initialState: {
      columnVisibility: {
        moduleId: false,
        transactionId: false,
        invoiceId: false,
        jobOrderId: false,
        taskId: false,
        serviceItemNo: false,
      },
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="rounded-lg border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        No job transactions found.
      </div>
    )
  }

  return (
    <div className="max-h-[calc(100vh-260px)] overflow-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
