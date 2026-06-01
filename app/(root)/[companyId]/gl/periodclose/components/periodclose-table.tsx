"use client"

import { useMemo } from "react"
import { IGLPeriodClose } from "@/interfaces/gl-periodclose"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { Checkbox } from "@/components/ui/checkbox"
import { SettingTable } from "@/components/table/table-setting"

interface PeriodCloseTableProps {
  data: IGLPeriodClose[]
  isLoading: boolean
  onFieldChange: (field: IGLPeriodClose, key: string, checked: boolean) => void
}

export function PeriodCloseTable({
  data,
  isLoading,
  onFieldChange,
}: PeriodCloseTableProps) {
  const { decimals } = useCompanyStore()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<IGLPeriodClose>[] = useMemo(
    () => [
      {
        accessorKey: "finYear",
        header: "Year",
        size: 56,
      },
      {
        accessorKey: "finMonth",
        header: "Month",
        size: 56,
      },
      {
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ row }) => {
          const date = row.getValue("startDate") as string
          return date ? format(new Date(date), dateFormat) : ""
        },
        size: 96,
      },
      {
        accessorKey: "endDate",
        header: "End Date",
        cell: ({ row }) => {
          const date = row.getValue("endDate") as string
          return date ? format(new Date(date), dateFormat) : ""
        },
        size: 96,
      },
      {
        accessorKey: "isArClose",
        header: "AR Close",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={row.getValue("isArClose")}
              onCheckedChange={(checked) =>
                onFieldChange(row.original, "isArClose", checked as boolean)
              }
            />
          </div>
        ),
        size: 72,
      },
      {
        accessorKey: "arCloseBy",
        header: "AR Close By",
        size: 100,
      },
      {
        accessorKey: "arCloseDate",
        header: "AR Close Date",
        cell: ({ row }) => {
          const date = row.getValue("arCloseDate") as string
          return date ? format(new Date(date), datetimeFormat) : ""
        },
        size: 158,
      },
      {
        accessorKey: "isApClose",
        header: "AP Close",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={row.getValue("isApClose")}
              onCheckedChange={(checked) =>
                onFieldChange(row.original, "isApClose", checked as boolean)
              }
            />
          </div>
        ),
        size: 72,
      },
      {
        accessorKey: "apCloseBy",
        header: "AP Close By",
        size: 100,
      },
      {
        accessorKey: "apCloseDate",
        header: "AP Close Date",
        cell: ({ row }) => {
          const date = row.getValue("apCloseDate") as string
          return date ? format(new Date(date), datetimeFormat) : ""
        },
        size: 158,
      },
      {
        accessorKey: "isCbClose",
        header: "CB Close",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={row.getValue("isCbClose")}
              onCheckedChange={(checked) =>
                onFieldChange(row.original, "isCbClose", checked as boolean)
              }
            />
          </div>
        ),
        size: 72,
      },
      {
        accessorKey: "cbCloseBy",
        header: "CB Close By",
        size: 100,
      },
      {
        accessorKey: "cbCloseDate",
        header: "CB Close Date",
        cell: ({ row }) => {
          const date = row.getValue("cbCloseDate") as string
          return date ? format(new Date(date), datetimeFormat) : ""
        },
        size: 158,
      },
      {
        accessorKey: "isGlClose",
        header: "GL Close",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={row.getValue("isGlClose")}
              onCheckedChange={(checked) =>
                onFieldChange(row.original, "isGlClose", checked as boolean)
              }
            />
          </div>
        ),
        size: 72,
      },
      {
        accessorKey: "glCloseBy",
        header: "GL Close By",
        size: 100,
      },
      {
        accessorKey: "glCloseDate",
        header: "GL Close Date",
        cell: ({ row }) => {
          const date = row.getValue("glCloseDate") as string
          return date ? format(new Date(date), datetimeFormat) : ""
        },
        size: 158,
      },
    ],
    [dateFormat, datetimeFormat, onFieldChange]
  )

  return (
    <SettingTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No period close data found."
      maxHeight="460px"
      stickyColumnCount={4}
    />
  )
}
