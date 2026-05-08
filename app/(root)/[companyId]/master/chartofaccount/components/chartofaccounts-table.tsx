"use client"

import { useCompanyStore } from "@/stores/company-store"

import { IChartOfAccount } from "@/interfaces/chartofaccount"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface ChartOfAccountsTableProps {
  data: IChartOfAccount[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (chartOfAccount: IChartOfAccount | null) => void
  onDeleteAction?: (chartOfAccountId: string) => void
  onEditAction?: (chartOfAccount: IChartOfAccount) => void
  onCreateAction?: () => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  currentPage?: number
  pageSize?: number
  serverSidePagination?: boolean
  initialSearchValue?: string // Initial search value to sync with parent filters
  moduleId?: number
  transactionId?: number
  // Permission props
  canView?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export function ChartOfAccountsTable({
  data,
  isLoading = false,
  totalRecords = 0,
  onSelect,
  onDeleteAction,
  onEditAction,
  onCreateAction,
  onRefreshAction,
  onFilterChange,
  onPageChange,
  onPageSizeChange,
  currentPage = 1,
  pageSize = 50,
  serverSidePagination = false,
  initialSearchValue,
  moduleId,
  transactionId,
  // Permission props
  canView = true,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: ChartOfAccountsTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<IChartOfAccount>[] = [
    {
      accessorKey: "glCode",
      header: "GL Code",
      size: 120,
      minSize: 100,
      enableColumnFilter: true,
    },
    {
      accessorKey: "glName",
      header: "GL Name",
      size: 200,
      minSize: 150,
      enableColumnFilter: true,
    },
    {
      accessorKey: "accTypeName",
      header: "Account Type",
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "accGroupName",
      header: "Account Group",
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "coaCategoryName1",
      header: "Category 1",

      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "coaCategoryName2",
      header: "Category 2",

      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "coaCategoryName3",
      header: "Category 3",

      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "isJobSpecific",
      header: "Job Control",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isJobSpecific") ? "default" : "destructive"}
        >
          {row.getValue("isJobSpecific") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isJobSpecific") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "isBankAccount",
      header: "Bank Control",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isBankAccount") ? "default" : "destructive"}
        >
          {row.getValue("isBankAccount") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isBankAccount") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "isOperational",
      header: "Operational",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isOperational") ? "default" : "destructive"}
        >
          {row.getValue("isOperational") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isOperational") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "isPayableAccount",
      header: "Payable Account",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isPayableAccount") ? "default" : "destructive"}
        >
          {row.getValue("isPayableAccount") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isPayableAccount") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "isReceivableAccount",
      header: "Receivable Account",
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue("isReceivableAccount") ? "default" : "destructive"
          }
        >
          {row.getValue("isReceivableAccount") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isReceivableAccount") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },

    {
      accessorKey: "isUniversal",
      header: "Universal",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isUniversal") ? "default" : "destructive"}
        >
          {row.getValue("isUniversal") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isUniversal") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "isSysControl",
      header: "System Control",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isSysControl") ? "default" : "destructive"}
        >
          {row.getValue("isSysControl") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isSysControl") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "isHeading",
      header: "Heading",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isHeading") ? "default" : "destructive"}>
          {row.getValue("isHeading") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isHeading") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "isDeptMandatory",
      header: "Dept Mandatory",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isDeptMandatory") ? "default" : "destructive"}
        >
          {row.getValue("isDeptMandatory") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isDeptMandatory") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "isBargeMandatory",
      header: "Barge Mandatory",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isBargeMandatory") ? "default" : "destructive"}
        >
          {row.getValue("isBargeMandatory") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isBargeMandatory") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 100,
    },

    {
      accessorKey: "seqNo",
      header: "Seq No",
      cell: ({ row }) => (
        <div className="truncate" title={String(row.getValue("seqNo"))}>
          {row.getValue("seqNo")}
        </div>
      ),
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",

      size: 200,
      minSize: 150,
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
      minSize: 100,
    },
    {
      accessorKey: "createBy",
      header: "Create By",

      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "createDate",
      header: "Create Date",
      cell: ({ row }) => {
        const raw = row.getValue("createDate")
        let date: Date | null = null
        if (typeof raw === "string") date = new Date(raw)
        else if (raw instanceof Date) date = raw
        const formattedDate =
          date && isValid(date) ? format(date, datetimeFormat) : "-"
        return (
          <div className="truncate" title={formattedDate}>
            {formattedDate}
          </div>
        )
      },
      size: 180,
      minSize: 150,
    },
    {
      accessorKey: "editBy",
      header: "Edit By",

      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "editDate",
      header: "Edit Date",
      cell: ({ row }) => {
        const raw = row.getValue("editDate")
        let date: Date | null = null
        if (typeof raw === "string") date = new Date(raw)
        else if (raw instanceof Date) date = raw
        const formattedDate =
          date && isValid(date) ? format(date, datetimeFormat) : "-"
        return (
          <div className="truncate" title={formattedDate}>
            {formattedDate}
          </div>
        )
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
      totalRecords={totalRecords}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.chartOfAccount}
      emptyMessage="No chart of accounts found."
      accessorId="glId"
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
      onDeleteAction={onDeleteAction}
      //show props
      showHeader={true}
      showFooter={true}
      showActions={true}
      hideSearch={true}
      // Permission props
      canView={canView}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  )
}
