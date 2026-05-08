"use client"

import { ICompany } from "@/interfaces/admin"
import { useCompanyStore } from "@/stores/company-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { MainTable } from "@/components/table/table-main"

interface CompanyTableProps {
  data: ICompany[]
  isLoading?: boolean
  onSelect?: (company: ICompany | null) => void
  onDeleteAction?: (companyId: string) => void
  onEditAction?: (company: ICompany) => void
  onCreateAction?: () => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  initialSearchValue?: string
  moduleId?: number
  transactionId?: number
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
}

export function CompanyTable({
  data,
  isLoading = false,
  onSelect,
  onDeleteAction,
  onEditAction,
  onCreateAction,
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
  moduleId,
  transactionId,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
}: CompanyTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<ICompany>[] = [
    { accessorKey: "companyCode", header: "Code", size: 120, minSize: 60 },
    { accessorKey: "companyName", header: "Name", size: 220, minSize: 120 },
    { accessorKey: "registrationNo", header: "Registration No", size: 150 },
    { accessorKey: "taxRegistrationNo", header: "Tax Registration No", size: 170 },
    { accessorKey: "email", header: "Email", size: 180 },
    { accessorKey: "phoneNo", header: "Phone No", size: 120 },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.getValue("isActive") ? (
          <div className="flex justify-center">
            <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
          </div>
        ) : (
          <div className="flex justify-center">
            <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
          </div>
        ),
      size: 80,
    },
    { accessorKey: "createBy", header: "Create By", size: 120 },
    {
      accessorKey: "createDate",
      header: "Create Date",
      cell: ({ row }) => {
        const raw = row.getValue("createDate")
        const date =
          typeof raw === "string" ? new Date(raw) : raw instanceof Date ? raw : null
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
      size: 180,
      minSize: 150,
    },
    { accessorKey: "editBy", header: "Edit By", size: 120 },
    {
      accessorKey: "editDate",
      header: "Edit Date",
      cell: ({ row }) => {
        const raw = row.getValue("editDate")
        const date =
          typeof raw === "string" ? new Date(raw) : raw instanceof Date ? raw : null
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
      size: 180,
      minSize: 150,
    },
  ]

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.company}
      emptyMessage="No companies found."
      accessorId="companyId"
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      onEditAction={onEditAction}
      onDeleteAction={onDeleteAction}
      showHeader={true}
      showFooter={true}
      showActions={true}
      canEdit={canEdit}
      canDelete={canDelete}
      canView={canView}
      canCreate={canCreate}
    />
  )
}
