"use client"

import { useMemo } from "react"
import { ITemplateDt } from "@/interfaces/template"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { ModuleId, OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DebitNoteBaseTable } from "@/components/table/table-debitnote"

interface TemplateDetailsTableProps {
  data: ITemplateDt[]
  isLoading?: boolean
  onDeleteAction?: (detail: ITemplateDt) => void
  onEditAction?: (detail: ITemplateDt) => void
  onRefreshAction?: () => void
  onDataReorder?: (newData: ITemplateDt[]) => void
  // Permission props
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
  onSelect?: (detail: ITemplateDt | null) => void
  onCreateAction?: () => void
  createButtonText?: string // Custom text for create button
}

export function TemplateDetailsTable({
  data,
  isLoading = false,
  onDeleteAction,
  onEditAction,
  onRefreshAction,
  onDataReorder,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
  onSelect,
  onCreateAction,
  createButtonText = "Add Detail",
}: TemplateDetailsTableProps) {
  const columns: ColumnDef<ITemplateDt>[] = useMemo(
    () => [
      {
        accessorKey: "itemNo",
        header: ({ column }) => (
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <span>Item No</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="outline">{row.original.itemNo}</Badge>
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "chargeName",
        header: "Charge",
        cell: ({ row }) => (
          <div>
            {row.getValue("chargeName") ||
              `Charge ID: ${row.original.chargeId}`}
          </div>
        ),
        size: 250,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <div className="max-w-md truncate">
            {row.getValue("remarks") || "-"}
          </div>
        ),
        size: 300,
      },
    ],
    []
  )

  const handleDeleteByItemNo = (itemNo: string) => {
    if (!onDeleteAction) return
    const detail = data.find((d) => d.itemNo?.toString() === itemNo)
    if (detail) {
      onDeleteAction(detail)
    }
  }

  return (
    <DebitNoteBaseTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      moduleId={ModuleId.operations}
      transactionId={OperationsTransactionId.template}
      tableName={TableName.template}
      emptyMessage="No template details found."
      accessorId="itemNo"
      onRefreshAction={onRefreshAction}
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      createButtonText={createButtonText}
      onEditAction={onEditAction}
      onDeleteAction={handleDeleteByItemNo}
      onDataReorder={onDataReorder}
      isConfirmed={false}
      showHeader={true}
      showActions={true}
      hideView={!canView}
      hideEdit={!canEdit}
      hideDelete={!canDelete}
      hideCreate={!canCreate}
      hideCheckbox
      disableOnDebitNoteExists={false}
    />
  )
}
