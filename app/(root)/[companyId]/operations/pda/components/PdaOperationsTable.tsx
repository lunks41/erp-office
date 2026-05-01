"use client"

import { useMemo } from "react"
import { IPdaHd, PDA_STATUS } from "@/interfaces/IPda"
import { ColumnDef } from "@tanstack/react-table"

import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaskTable } from "@/components/table/table-task"

import { PdaStatusBadge } from "./PdaStatusBadge"

interface PdaOperationsTableProps {
  data: IPdaHd[]
  isLoading?: boolean
  onSelectAction: (row: IPdaHd | undefined) => void
  onEditAction: (row: IPdaHd) => void
  onCloneAction: (row: IPdaHd) => void
  onApproveAction: (row: IPdaHd) => void
  onDeleteAction: (pdaId: string) => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0))

export function PdaOperationsTable({
  data,
  isLoading = false,
  onSelectAction,
  onEditAction,
  onCloneAction,
  onApproveAction,
  onDeleteAction,
}: PdaOperationsTableProps) {
  const columns: ColumnDef<IPdaHd>[] = useMemo(
    () => [
      {
        accessorKey: "pdaNo",
        header: "PDA No",
        size: 160,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "jobOrderNo",
        header: "Job Order",
        size: 170,
        minSize: 130,
        enableColumnFilter: true,
      },
      {
        accessorKey: "vesselName",
        header: "Vessel",
        size: 160,
        minSize: 120,
      },
      {
        accessorKey: "portName",
        header: "Port",
        size: 140,
        minSize: 110,
      },
      {
        accessorKey: "typeOfCall",
        header: "Type Of Call",
        size: 230,
        minSize: 180,
      },
      {
        accessorKey: "currencyCode",
        header: "Currency",
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "grandTotal",
        header: "Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {fmt(Number(row.original.grandTotal || row.original.totalAmount || 0))}
          </div>
        ),
        size: 130,
        minSize: 100,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <PdaStatusBadge status={row.original.status} />,
        size: 120,
        minSize: 100,
      },
      {
        id: "approve",
        header: "Approve",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="outline"
              className="h-6 border-green-200 px-2 text-xs text-green-700 hover:bg-green-50"
              disabled={row.original.status !== PDA_STATUS.DRAFT}
              onClick={(e) => {
                e.stopPropagation()
                onApproveAction(row.original)
              }}
            >
              Approve
            </Button>
          </div>
        ),
        size: 100,
        minSize: 90,
      },
      {
        accessorKey: "status",
        header: "State",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
        size: 110,
        minSize: 90,
        hidden: true,
      },
    ],
    [onApproveAction]
  )

  return (
    <TaskTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      moduleId={1}
      transactionId={OperationsTransactionId.pda}
      tableName={TableName.notDefine}
      emptyMessage="No PDA records found."
      accessorId="pdaId"
      onSelect={(row) => onSelectAction(row || undefined)}
      onEditAction={onEditAction}
      onDeleteAction={onDeleteAction}
      onCloneRow={onCloneAction}
      showHeader={false}
      showActions={true}
      canDebitNote={false}
    />
  )
}
