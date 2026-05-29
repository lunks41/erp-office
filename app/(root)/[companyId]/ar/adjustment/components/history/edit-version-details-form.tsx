"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useMemo } from "react"
import { format } from "date-fns"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface EditVersionDetailsFormProps {
  headerData: Record<string, unknown>
  detailsData: Array<Record<string, unknown>>
  summaryData?: {
    transactionAmount?: number
    localAmount?: number
    gstAmount?: number
    localGstAmount?: number
    totalAmount?: number
    localTotalAmount?: number
    paymentAmount?: number
    localPaymentAmount?: number
    balanceAmount?: number
    localBalanceAmount?: number
  }
}

export function EditVersionDetailsForm({
  headerData,
  detailsData,
  summaryData,
}: EditVersionDetailsFormProps) {
  const { decimals } = useCompanyStore()
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  // Format currency values
  const formatCurrency = (value: unknown, decimals: number = 2) => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value)
    }
    return String(value || "0.00")
  }

  // Format date values
  const formatDate = (value: unknown) => {
    if (!value) return ""

    if (value instanceof Date) {
      return format(value, dateFormat)
    }

    if (typeof value === "string") {
      const parsed = parseDate(value)
      if (parsed) {
        return format(parsed, dateFormat)
      }
      const native = new Date(value)
      if (!isNaN(native.getTime())) {
        return format(native, dateFormat)
      }
      return value
    }

    return String(value)
  }

  // Get field value safely
  const getFieldValue = (key: string, fallback: string = "") => {
    const value = headerData[key]
    if (value === null || value === undefined || value === "") {
      return fallback
    }
    return String(value)
  }

  return (
    <div className="grid grid-cols-12 rounded-md p-2">
      {/* Main Content - 10 columns */}
      <div className="col-span-10 grid grid-cols-6 gap-1 gap-y-1">
        {/* Account Date */}
        <div className="flex flex-col">
          <label className="text-muted-foreground mb-1 text-xs font-medium">
            Account Date
          </label>
          <div className="text-sm font-medium">
            {formatDate(headerData.accountDate)}
          </div>
        </div>

        {/* Customer */}
        <div className="flex flex-col">
          <label className="text-muted-foreground mb-1 text-xs font-medium">
            Customer
          </label>
          <div className="text-sm font-medium">
            {getFieldValue("customerName", "N/A")}
          </div>
        </div>

        {/* Credit Terms */}
        <div className="flex flex-col">
          <label className="text-muted-foreground mb-1 text-xs font-medium">
            Credit Terms
          </label>
          <div className="text-sm font-medium">
            {getFieldValue("creditTermName", "N/A")}
          </div>
        </div>

        {/* Due Date */}
        <div className="flex flex-col">
          <label className="text-muted-foreground mb-1 text-xs font-medium">
            Due Date
          </label>
          <div className="text-sm font-medium">
            {formatDate(headerData.dueDate)}
          </div>
        </div>

        {/* Bank */}
        <div className="flex flex-col">
          <label className="text-muted-foreground mb-1 text-xs font-medium">
            Bank
          </label>
          <div className="text-sm font-medium">
            {getFieldValue("bankName", "N/A")}
          </div>
        </div>

        {/* Currency */}
        <div className="flex flex-col">
          <label className="text-muted-foreground mb-1 text-xs font-medium">
            Currency
          </label>
          <div className="text-sm font-medium">
            {getFieldValue("currencyCode", "N/A")} -{" "}
            {getFieldValue("currencyName", "")}
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="flex flex-col">
          <label className="text-muted-foreground mb-1 text-xs font-medium">
            Exchange Rate
          </label>
          <div className="text-right text-sm font-medium">
            {formatCurrency(headerData.exhRate, 6)}
          </div>
        </div>

        {/* Remarks */}
        <div className="col-span-2 flex flex-col">
          <label className="text-muted-foreground mb-1 text-xs font-medium">
            Remarks
          </label>
          <div className="text-sm font-medium">
            {getFieldValue("remarks", "N/A")}
          </div>
        </div>
      </div>

      {/* Summary Box - 2 columns */}
      <div className="col-span-2 ml-2 flex flex-col justify-start">
        <div className="w-full rounded-md border border-border bg-card p-3 shadow-sm">
          {/* Header Row */}
          <div className="mb-2 grid grid-cols-3 gap-x-4 border-b border-border pb-2 text-sm">
            <div className="text-right font-bold text-primary">Trns</div>
            <div className="text-center"></div>
            <div className="text-right font-bold text-primary">Local</div>
          </div>

          {/* 3-column grid: [Amt] [Label] [Local] */}
          <div className="grid grid-cols-3 gap-x-4 text-sm">
            {/* Column 1: Foreign Amounts (Amt) */}
            <div className="space-y-1 text-right">
              <div className="font-medium text-gray-700">
                {formatCurrency(summaryData?.transactionAmount, 2)}
              </div>
              <div className="font-medium text-gray-700">
                {formatCurrency(summaryData?.gstAmount, 2)}
              </div>
              <hr className="my-1 border-border" />
              <div className="font-bold text-foreground">
                {formatCurrency(summaryData?.totalAmount, 2)}
              </div>
              <div className="font-bold text-foreground">
                {formatCurrency(summaryData?.paymentAmount, 2)}
              </div>
              <div className="font-bold text-foreground">
                {formatCurrency(summaryData?.balanceAmount, 2)}
              </div>
            </div>

            {/* Column 2: Labels */}
            <div className="space-y-1 text-center">
              <div className="font-medium text-muted-foreground">Amt</div>
              <div className="font-medium text-muted-foreground">VAT</div>
              <div></div>
              <div className="font-bold text-primary">Total</div>
              <div className="font-bold text-primary">Payment</div>
              <div className="font-bold text-primary">Balance</div>
            </div>

            {/* Column 3: Local Amounts */}
            <div className="space-y-1 text-right">
              <div className="font-medium text-gray-700">
                {formatCurrency(summaryData?.localAmount, 2)}
              </div>
              <div className="font-medium text-gray-700">
                {formatCurrency(summaryData?.localGstAmount, 2)}
              </div>
              <hr className="my-1 border-border" />
              <div className="font-bold text-foreground">
                {formatCurrency(summaryData?.localTotalAmount, 2)}
              </div>
              <div className="font-bold text-foreground">
                {formatCurrency(summaryData?.localPaymentAmount, 2)}
              </div>
              <div className="font-bold text-foreground">
                {formatCurrency(summaryData?.localBalanceAmount, 2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Table - Full width below */}
      <div className="col-span-12 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Adjustment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailsData && detailsData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="font-semibold">Item No.</TableCell>
                      <TableCell className="font-semibold">Seq No.</TableCell>
                      <TableCell className="font-semibold">Account</TableCell>
                      <TableCell className="font-semibold">
                        Department
                      </TableCell>
                      <TableCell className="font-semibold">Remarks</TableCell>
                      <TableCell className="text-right font-semibold">
                        Qty
                      </TableCell>
                      <TableCell className="font-semibold">UOM</TableCell>
                      <TableCell className="text-right font-semibold">
                        Price
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Amount
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        VAT
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        VAT Amount
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Local Amount
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailsData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {String(item.itemNo || item.item_no || index + 1)}
                        </TableCell>
                        <TableCell>
                          {String(item.seqNo || item.seq_no || index + 1)}
                        </TableCell>
                        <TableCell>
                          {String(item.glName || item.accountName || "N/A")}
                        </TableCell>
                        <TableCell>
                          {String(item.departmentName || "N/A")}
                        </TableCell>
                        <TableCell>{String(item.remarks || "N/A")}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.qty, 2)}
                        </TableCell>
                        <TableCell>
                          {String(item.uomName || item.uom || "N/A")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice, 2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.totAmt, 2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.gstPercentage, 2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.gstAmt, 2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.totLocalAmt, 2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No details available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
