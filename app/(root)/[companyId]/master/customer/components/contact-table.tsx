"use client"

import { ICustomerContact, ICustomerContactFilter } from "@/interfaces/customer"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface ContactsTableProps {
  data: ICustomerContact[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (contact: ICustomerContact | null) => void
  onDeleteAction?: (contactId: string) => Promise<void>
  onEditAction?: (contact: ICustomerContact | null) => void
  onCreateAction?: () => void
  onFilterChange?: (filters: ICustomerContactFilter) => void
  onRefreshAction?: () => void
  initialSearchValue?: string // Initial search value to sync with parent filters
  moduleId: number
  transactionId: number
  // Permission props
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
}

export function ContactsTable({
  data,
  isLoading = false,
  totalRecords = 0,
  onSelect,
  onDeleteAction,
  onEditAction,
  onCreateAction,
  onFilterChange,
  onRefreshAction,
  initialSearchValue,
  moduleId,
  transactionId,
  // Permission props
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
}: ContactsTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<ICustomerContact>[] = [
    {
      accessorKey: "isDefault",
      header: "Def Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isDefault") ? "default" : "secondary"}>
          {row.getValue("isDefault") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isDefault") ? "Active" : "Inactive"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "contactName",
      header: "Conatact Name",
      size: 200,
      minSize: 50,

      enableColumnFilter: true,
    },
    {
      accessorKey: "otherName",
      header: "Other Name",

      size: 120,
      minSize: 50,

      enableColumnFilter: true,
    },
    {
      accessorKey: "mobileNo",
      header: "Mobile",

      size: 120,
      minSize: 50,

      enableColumnFilter: true,
    },
    {
      accessorKey: "offNo",
      header: "Office",

      size: 120,
      minSize: 50,

      enableColumnFilter: true,
    },
    {
      accessorKey: "emailAdd",
      header: "Email",

      size: 120,
      minSize: 50,

      enableColumnFilter: true,
    },

    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex justify-center overflow-hidden">
          {row.getValue("isActive") ? (
            <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
          ) : (
            <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "isFinance",
      header: "Fin Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isFinance") ? "default" : "secondary"}>
          {row.getValue("isFinance") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isFinance") ? "Active" : "Inactive"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "isSales",
      header: "Sale Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isSales") ? "default" : "secondary"}>
          {row.getValue("isSales") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isSales") ? "Active" : "Inactive"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",

      size: 200,
      minSize: 50,
    },
    {
      accessorKey: "createBy",
      header: "Create By",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "createDate",
      header: "Create Date",
      cell: ({ row }) => {
        const raw = row.getValue("createDate")
        let date: Date | null = null
        if (typeof raw === "string") {
          date = new Date(raw)
        } else if (raw instanceof Date) {
          date = raw
        }
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
      size: 180,
      minSize: 150,
    },
    {
      accessorKey: "editBy",
      header: "Edit By",

      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "editDate",
      header: "Edit Date",
      cell: ({ row }) => {
        const raw = row.getValue("editDate")
        let date: Date | null = null
        if (typeof raw === "string") {
          date = new Date(raw)
        } else if (raw instanceof Date) {
          date = raw
        }
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
      size: 180,
      minSize: 150,
    },
  ]

  // Handle filter change for dialog table - convert generic filters to ICustomerFilter
  const handleDialogFilterChange = (filters: {
    search?: string
    sortOrder?: string
  }) => {
    if (onFilterChange) {
      const newFilters: ICustomerContactFilter = {
        search: filters.search,
        sortOrder: filters.sortOrder as "asc" | "desc" | undefined,
      }
      onFilterChange(newFilters)
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
      tableName={TableName.customerContact}
      emptyMessage="No contacts found."
      accessorId="contactId"
      // Add handlers if provided
      onRefreshAction={onRefreshAction}
      onFilterChange={handleDialogFilterChange}
      initialSearchValue={initialSearchValue}
      //handler column props
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      onEditAction={onEditAction}
      onDeleteAction={onDeleteAction}
      //show props
      showHeader={true}
      showFooter={false}
      showActions={true}
      hideSearch={true}
      // Permission props
      canEdit={canEdit}
      canDelete={canDelete}
      canView={canView}
      canCreate={canCreate}
    />
  )
}
