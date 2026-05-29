"use client"

import { IGlTransactionDetails } from "@/interfaces/history"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { formatNumber } from "@/lib/format-utils"
import { Badge } from "@/components/ui/badge"

type ExtendedColumnDef<T> = ColumnDef<T> & {
  hidden?: boolean
}

/**
 * Returns GL Post Details columns in the standard order:
 * documentNo, referenceNo, accountDate, bankCode, currencyCode, glCode, glName,
 * totalAmount, totLocalAmt, vatCode, vatAmt, vatLocalAmt, then rest of columns.
 */
export function getGlPostDetailsColumns(
  amtDec: number,
  locAmtDec: number,
  exhRateDec: number,
  dateFormat: string
): ExtendedColumnDef<IGlTransactionDetails>[] {
  return [
    // Primary columns in specified order
    {
      accessorKey: "documentNo",
      header: "Document No",
    },

    {
      accessorKey: "accountDate",
      header: "Acc. Date",
      cell: ({ row }) => {
        const date = row.original.accountDate
          ? new Date(row.original.accountDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "bankCode",
      header: "Bank Code",
    },
    {
      accessorKey: "currencyCode",
      header: "Currency Code",
    },
    {
      accessorKey: "glCode",
      header: "GL Code",
    },
    {
      accessorKey: "isDebit",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={row.original.isDebit ? "default" : "destructive"}
          className="py-0 leading-4"
        >
          {row.original.isDebit ? "Debit" : "Credit"}
        </Badge>
      ),
    },
    {
      accessorKey: "glName",
      header: "GL Name",
    },
    {
      accessorKey: "totAmt",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totAmt
            ? formatNumber(row.original.totAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "totLocalAmt",
      header: "Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totLocalAmt
            ? formatNumber(row.original.totLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "gstCode",
      header: "VAT Code",
    },
    {
      accessorKey: "gstAmt",
      header: "VAT Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.gstAmt
            ? formatNumber(row.original.gstAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "gstLocalAmt",
      header: "VAT Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.gstLocalAmt
            ? formatNumber(row.original.gstLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    // Rest of columns after primary order
    {
      accessorKey: "referenceNo",
      header: "Reference No",
    },
    {
      accessorKey: "supplierName",
      header: "Supplier Name",
    },
    {
      accessorKey: "customerName",
      header: "Customer Name",
    },
    {
      accessorKey: "moduleFrom",
      header: "Module",
    },
    {
      accessorKey: "exhRate",
      header: "Exh. Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.exhRate
            ? formatNumber(row.original.exhRate, exhRateDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "ctyExhRate",
      header: "Country Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.ctyExhRate
            ? formatNumber(row.original.ctyExhRate, exhRateDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "bankName",
      header: "Bank",
    },

    {
      accessorKey: "totCtyAmt",
      header: "Total Country Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totCtyAmt
            ? formatNumber(row.original.totCtyAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "gstName",
      header: "VAT Name",
    },
    {
      accessorKey: "gstCtyAmt",
      header: "VAT Country Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.gstCtyAmt
            ? formatNumber(row.original.gstCtyAmt, locAmtDec)
            : "-"}
        </div>
      ),
      hidden: true,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
    },
    {
      accessorKey: "departmentCode",
      header: "Department Code",
      hidden: true,
    },
    {
      accessorKey: "departmentName",
      header: "Department Name",
    },
    {
      accessorKey: "employeeCode",
      header: "Employee Code",
      hidden: true,
    },
    {
      accessorKey: "employeeName",
      header: "Employee Name",
    },
    {
      accessorKey: "portCode",
      header: "Port Code",
    },
    {
      accessorKey: "portName",
      header: "Port Name",
    },
    {
      accessorKey: "vesselCode",
      header: "Vessel Code",
    },
    {
      accessorKey: "vesselName",
      header: "Vessel Name",
    },
    {
      accessorKey: "voyageNo",
      header: "Voyage No",
    },
    {
      accessorKey: "bargeCode",
      header: "Barge Code",
    },
    {
      accessorKey: "bargeName",
      header: "Barge Name",
    },
    {
      accessorKey: "productCode",
      header: "Product Code",
    },
    {
      accessorKey: "productName",
      header: "Product Name",
    },
    {
      accessorKey: "supplierCode",
      header: "Supplier Code",
    },
    {
      accessorKey: "createBy",
      header: "Created By",
    },
    {
      accessorKey: "createDate",
      header: "Created Date",
      cell: ({ row }) => {
        const date = row.original.createDate
          ? new Date(row.original.createDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
  ]
}
