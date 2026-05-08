"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useCallback, useMemo } from "react"
import { IDocType } from "@/interfaces/lookup"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { FileText } from "lucide-react"

import { TableName } from "@/lib/utils"

import { DocumentOperationsTable } from "../table/table-document-operations"

type DocRow = IDocType & {
  selectionId: string
}

interface DocumentOperationsManagerTableProps {
  data: DocRow[]
  isLoading?: boolean
  onPreview?: (doc: IDocType) => void
  onDownload?: (doc: IDocType) => void
  onDeleteAction?: (doc: IDocType) => void
  onRefreshAction?: () => void
  onBulkSelectionChange?: (selectedIds: string[]) => void
  onBulkDeleteAction?: (selectedIds: string[]) => void
}

export default function DocumentOperationsManagerTable({
  data,
  isLoading = false,
  onPreview,
  onDownload,
  onDeleteAction,
  onRefreshAction,
  onBulkSelectionChange,
  onBulkDeleteAction,
}: DocumentOperationsManagerTableProps) {
  const decimals = useCompanyStore((state) => state.decimals)
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"

  // Memoize columns to prevent re-creation on every render
  const columns: ColumnDef<DocRow>[] = useMemo(
    () => [
      {
        accessorKey: "itemNo",
        header: "Item No",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("itemNo") || "-"}</div>
        ),
        size: 60,
      },
      {
        accessorKey: "docTypeName",
        header: "Document Type",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("docTypeName")}</div>
        ),
      },
      {
        accessorKey: "docPath",
        header: "File Name",
        size: 500,
        cell: ({ row }) => {
          const docPath = row.getValue("docPath") as string
          // Access documentNo directly from row.original since it's not a column
          const documentNo = (row.original as { documentNo?: string })
            .documentNo
          return (
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span className="min-w-0 text-sm wrap-break-word whitespace-normal">
                {docPath?.split("/").pop() || documentNo || "-"}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 200,
        cell: ({ row }) => (
          <div className="text-muted-foreground min-w-0 text-sm wrap-break-word whitespace-normal">
            {row.getValue("remarks") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "createDate",
        header: "Created Date",
        cell: ({ row }) => {
          const date = row.getValue("createDate") as string
          return date ? format(new Date(date), dateFormat) : "-"
        },
      },
      {
        accessorKey: "createBy",
        header: "Created By",
        cell: ({ row }) => <div>{row.getValue("createBy") || "-"}</div>,
      },
      {
        accessorKey: "editDate",
        header: "Edit Date",
        cell: ({ row }) => {
          const date = row.getValue("editDate") as string
          return date ? format(new Date(date), dateFormat) : "-"
        },
      },
      {
        accessorKey: "editBy",
        header: "Edit By",
        cell: ({ row }) => <div>{row.getValue("editBy") || "-"}</div>,
      },
    ],
    [dateFormat]
  )

  // Memoize callbacks to prevent re-creation on every render
  const handleSelect = useCallback(
    (item: DocRow | null) => {
      if (item) {
        onPreview?.(item)
      }
    },
    [onPreview]
  )

  const handleDataReorder = useCallback((_newData: DocRow[]) => {
    // Handle data reorder - this will update the parent component
    // The itemNo will be automatically updated in the table component
  }, [])

  const handleSaveOrder = useCallback((_newData: DocRow[]) => {
    // Handle save order - this should save the new order to the backend
    console.log("Save order:", _newData)
  }, [])

  return (
    <DocumentOperationsTable<DocRow>
      data={data}
      columns={columns}
      isLoading={isLoading}
      tableName={TableName.document}
      emptyMessage="No documents uploaded yet"
      accessorId="selectionId"
      onSelect={handleSelect}
      onDataReorder={handleDataReorder}
      onSaveOrder={handleSaveOrder}
      onDownload={onDownload}
      onDeleteAction={onDeleteAction}
      onRefreshAction={onRefreshAction}
      onBulkSelectionChange={onBulkSelectionChange}
      onBulkDeleteAction={onBulkDeleteAction}
      showHeader={true}
      showActions={true}
      hideView={false}
      hideDownload={false}
      hideDelete={true}
      hideCheckbox={false}
    />
  )
}
