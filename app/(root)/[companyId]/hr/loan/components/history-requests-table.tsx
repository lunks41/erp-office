"use client"

import { ILoanRequest } from "@/interfaces/loan"
import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

export const columns: ColumnDef<ILoanRequest>[] = [
  {
    accessorKey: "loanRequestId",
    header: "Request ID",
    cell: ({ row }) => {
      const loanId = row.original.loanRequestId
      return (
        <span className="font-medium">
          REQ-{String(loanId).padStart(5, "0")}
        </span>
      )
    },
  },
  {
    accessorKey: "employeeName",
    header: "Employee",
    cell: ({ row }) => {
      const employeeName = row.original.employeeName
      const employeeCode = row.original.employeeCode
      return (
        <div>
          <div className="font-medium">
            {employeeName || "Unknown Employee"}
          </div>
          <div className="text-muted-foreground text-sm">
            {employeeCode ||
              `EMP${String(row.original.employeeId).padStart(6, "0")}`}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "requestedAmount",
    header: "Requested Amount",
    cell: ({ row }) => {
      const amount = row.original.requestedAmount
      return (
        <span className="font-medium">
          <CurrencyFormatter amount={amount} size="sm" />
        </span>
      )
    },
  },
  {
    accessorKey: "loanTypeName",
    header: "Loan Type",
    cell: ({ row }) => {
      const loanTypeName = row.original.loanTypeName
      return <span>{loanTypeName || "Unknown"}</span>
    },
  },
  {
    accessorKey: "statusName",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.statusName
      let variant: "secondary" | "default" | "destructive" = "secondary"
      let className = ""

      switch (status) {
        case "Approved":
          variant = "default"
          className =
            "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
          break
        case "Rejected":
          variant = "destructive"
          break
        case "Pending":
          variant = "secondary"
          className =
            "bg-yellow-100 text-yellow-800 border-gray-200 hover:bg-yellow-200"
          break
        case "Completed":
          variant = "default"
          className =
            "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
          break
        default:
          variant = "secondary"
          className =
            "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
      }

      return (
        <Badge variant={variant} className={className}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "requestDate",
    header: "Request Date",
    cell: ({ row }) => {
      const date = row.original.requestDate
      return <span>{new Date(date).toLocaleDateString()}</span>
    },
  },
  {
    accessorKey: "createdDate",
    header: "Processed Date",
    cell: ({ row }) => {
      const date = row.original.createdDate
      return <span>{new Date(date).toLocaleDateString()}</span>
    },
  },
]
