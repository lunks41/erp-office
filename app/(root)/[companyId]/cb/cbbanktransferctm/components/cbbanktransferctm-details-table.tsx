import React, { useEffect, useState } from "react"
import { ICbBankTransferCtmDt } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"

import { TableName } from "@/lib/utils"
import { AccountBaseTable } from "@/components/table/table-account"

// Use flexible data type that can work with form data
interface CbBankTransferCtmDetailsTableProps {
  data: ICbBankTransferCtmDt[]
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onEditAction?: (template: ICbBankTransferCtmDt) => void
  onCloneAction?: (template: ICbBankTransferCtmDt) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: ICbBankTransferCtmDt[]) => void
  visible: IVisibleFields
  isCancelled?: boolean
}

export default function CbBankTransferCtmDetailsTable({
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
}: CbBankTransferCtmDetailsTableProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Define columns - ALL fields from ICbBankTransferCtmDt interface
  const columns: ColumnDef<ICbBankTransferCtmDt>[] = [
    // TO Bank Fields
    {
      accessorKey: "toBankCode",
      header: "To Bank",
      size: 100,
    },
    {
      accessorKey: "toCurrencyCode",
      header: "To Currency",
      size: 80,
    },
    {
      accessorKey: "toExhRate",
      header: "To Ex. Rate",
      size: 100,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toExhRate.toLocaleString(undefined, {
            minimumFractionDigits: exhRateDec,
            maximumFractionDigits: exhRateDec,
          })}
        </div>
      ),
    },

    {
      accessorKey: "toTotAmt",
      header: "To Total Amount",
      size: 130,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toTotAmt.toLocaleString(undefined, {
            minimumFractionDigits: amtDec,
            maximumFractionDigits: amtDec,
          })}
        </div>
      ),
    },
    {
      accessorKey: "toTotLocalAmt",
      header: "To Total Local",
      size: 130,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toTotLocalAmt.toLocaleString(undefined, {
            minimumFractionDigits: locAmtDec,
            maximumFractionDigits: locAmtDec,
          })}
        </div>
      ),
    },
    // To Bank Charge Fields

    {
      accessorKey: "toBankChgGLCode" as const,
      header: "To Bank Charge GL",
      size: 120,
    },

    {
      accessorKey: "toBankChgAmt",
      header: "To Bank Charge",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toBankChgAmt.toLocaleString(undefined, {
            minimumFractionDigits: amtDec,
            maximumFractionDigits: amtDec,
          })}
        </div>
      ),
    },
    {
      accessorKey: "toBankChgLocalAmt",
      header: "To Bank Charge Local",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toBankChgLocalAmt.toLocaleString(undefined, {
            minimumFractionDigits: locAmtDec,
            maximumFractionDigits: locAmtDec,
          })}
        </div>
      ),
    },

    // Bank Exchange Fields
    {
      accessorKey: "toBankExhRate",
      header: "To Bank Ex. Rate",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toBankExhRate.toLocaleString(undefined, {
            minimumFractionDigits: exhRateDec,
            maximumFractionDigits: exhRateDec,
          })}
        </div>
      ),
    },

    {
      accessorKey: "toBankTotAmt",
      header: "To Bank Total",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toBankTotAmt.toLocaleString(undefined, {
            minimumFractionDigits: amtDec,
            maximumFractionDigits: amtDec,
          })}
        </div>
      ),
    },
    {
      accessorKey: "toBankTotLocalAmt",
      header: "To Bank Total Local",
      size: 130,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toBankTotLocalAmt.toLocaleString(undefined, {
            minimumFractionDigits: locAmtDec,
            maximumFractionDigits: locAmtDec,
          })}
        </div>
      ),
    },
    // Job Order Fields
    ...(visible?.m_JobOrderId
      ? [
          {
            accessorKey: "jobOrderNo" as const,
            header: "Job Order",
            size: 120,
          },
          {
            accessorKey: "taskName" as const,
            header: "Task",
            size: 150,
          },
          {
            accessorKey: "serviceItemNoName" as const,
            header: "Service",
            size: 150,
          },
        ]
      : []),
    {
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
      cell: ({ row }) => (
        <div className="text-right">{row.original.itemNo}</div>
      ),
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full p-2">
      <AccountBaseTable
        data={data as unknown[]}
        columns={columns as ColumnDef<unknown>[]}
        tableName={TableName.cbBankTransferCtmDt}
        emptyMessage="No transfer details found. Add transfer destinations."
        accessorId={"itemNo" as keyof unknown}
        enableSorting={false}
        onRefreshAction={onRefreshAction}
        onFilterChange={onFilterChange}
        onBulkDeleteAction={handleBulkDelete}
        onBulkSelectionChange={() => {}}
        onDataReorder={(newData) =>
          onDataReorder?.(newData as ICbBankTransferCtmDt[])
        }
        onEditAction={(row) => onEditAction?.(row as ICbBankTransferCtmDt)}
        onCloneAction={(row) => onCloneAction?.(row as ICbBankTransferCtmDt)}
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
