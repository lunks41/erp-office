"use client"

import { useCompanyStore } from "@/stores/company-store"

import { ITemplateFilter, ITemplateHd } from "@/interfaces/template"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface TemplateTableProps {
  data: ITemplateHd[]
  isLoading?: boolean
  totalRecords?: number
  onDeleteAction?: (template: ITemplateHd) => void
  onEditAction?: (template: ITemplateHd) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: ITemplateFilter) => void
  initialSearchValue?: string // Initial search value to sync with parent filters
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  currentPage?: number
  pageSize?: number
  serverSidePagination?: boolean
  moduleId?: number
  transactionId?: number
  // Permission props
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
  onSelect?: (template: ITemplateHd | null) => void
  onCreateAction?: () => void
}

export function TemplateTable({
  data,
  isLoading = false,
  totalRecords,
  onDeleteAction,
  onEditAction,
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
  onPageChange,
  onPageSizeChange,
  currentPage,
  pageSize,
  serverSidePagination = false,
  moduleId,
  transactionId,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
  onSelect,
  onCreateAction,
}: TemplateTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Define columns for the table
  const columns: ColumnDef<ITemplateHd>[] = [
    {
      accessorKey: "templateName",
      header: "Template Name",
      cell: ({ row }) => <div>{row.getValue("templateName")}</div>,
      size: 200,
    },
    {
      accessorKey: "taskName",
      header: "Task",
      cell: ({ row }) => <div>{row.getValue("taskName") || "-"}</div>,
      size: 150,
    },
    {
      accessorKey: "chargeName",
      header: "Charge",
      cell: ({ row }) => <div>{row.getValue("chargeName") || "-"}</div>,
      size: 200,
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <div className="flex justify-center overflow-hidden">
          {row.getValue("isActive") ? (
            <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
          ) : (
            <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "data_details",
      header: "Details Count",
      cell: ({ row }) => {
        const details = row.original.data_details || []
        return (
          <div className="text-center">
            <Badge variant="outline">{details.length}</Badge>
          </div>
        )
      },
      size: 100,
    },
    {
      accessorKey: "createBy",
      header: "Created By",
      cell: ({ row }) => <div>{row.getValue("createBy") || "-"}</div>,
      size: 120,
    },
    {
      accessorKey: "createDate",
      header: "Created Date",
      cell: ({ row }) => {
        const date = row.original.createDate
          ? new Date(row.original.createDate)
          : null
        return date ? format(date, datetimeFormat) : "-"
      },
      size: 150,
    },
    {
      accessorKey: "editBy",
      header: "Edited By",
      cell: ({ row }) => <div>{row.getValue("editBy") || "-"}</div>,
      size: 120,
    },
    {
      accessorKey: "editDate",
      header: "Edited Date",
      cell: ({ row }) => {
        const date = row.original.editDate
          ? new Date(row.original.editDate)
          : null
        return date ? format(date, datetimeFormat) : "-"
      },
      size: 150,
    },
  ]

  // Handle delete with template object
  const handleDelete = (templateId: string) => {
    if (onDeleteAction) {
      const template = data.find((t) => t.templateId?.toString() === templateId)
      if (template) {
        onDeleteAction(template)
      }
    }
  }

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      totalRecords={totalRecords}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.template}
      emptyMessage="No templates found."
      accessorId="templateId"
      // Add handlers if provided
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      currentPage={currentPage}
      pageSize={pageSize}
      serverSidePagination={serverSidePagination}
      //handler column props
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      onEditAction={onEditAction}
      onDeleteAction={handleDelete}
      //show props
      showHeader={true}
      showFooter={true}
      showActions={true}
      // Permission props
      canEdit={canEdit}
      canDelete={canDelete}
      canView={canView}
      canCreate={canCreate}
    />
  )
}
