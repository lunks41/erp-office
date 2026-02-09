import { ApiResponse } from "@/interfaces/auth"
import { IPaymentDetails } from "@/interfaces/history"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { ARTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetPaymentDetails } from "@/hooks/use-histoy"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BasicTable } from "@/components/table/table-basic"

interface PaymentDetailsProps {
  receiptId: string
}

export default function PaymentDetails({ receiptId }: PaymentDetailsProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.receipt

  const { data: paymentDetails, refetch: refetchPayment } =
    //useGetPaymentDetails<IPaymentDetails>(25, 1, "14120250100024")
    useGetPaymentDetails<IPaymentDetails>(
      Number(moduleId),
      Number(transactionId),
      receiptId
    )

  const { data: paymentDetailsData } =
    (paymentDetails as ApiResponse<IPaymentDetails>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  const columns: ColumnDef<IPaymentDetails>[] = [
    {
      accessorKey: "DocumentNO",
      header: "Document No",
    },
    {
      accessorKey: "ReferenceNo",
      header: "Reference No",
    },
    {
      accessorKey: "AccountDate",
      header: "Account Date",
      cell: ({ row }) => {
        const date = row.original.AccountDate
          ? new Date(row.original.AccountDate.toString())
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "TotAmt",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.TotAmt
            ? formatNumber(row.original.TotAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "TotLocalAmt",
      header: "Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.TotLocalAmt
            ? formatNumber(row.original.TotLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "AllAmt",
      header: "Allocated Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.AllAmt
            ? formatNumber(row.original.AllAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "AllLocalAmt",
      header: "Allocated Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.AllLocalAmt
            ? formatNumber(row.original.AllLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "ExGainLoss",
      header: "Exchange Gain/Loss",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.ExGainLoss
            ? formatNumber(Number(row.original.ExGainLoss), amtDec)
            : "-"}
        </div>
      ),
    },
  ]

  const handleRefresh = async () => {
    try {
      await refetchPayment()
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <BasicTable
          data={paymentDetailsData || []}
          columns={columns}
          isLoading={false}
          moduleId={moduleId}
          transactionId={transactionId}
          tableName={TableName.paymentDetails}
          onRefreshAction={handleRefresh}
          showHeader={true}
          showFooter={false}
          emptyMessage="No results."
          maxHeight="200px"
          pageSizeOption={5}
        />
      </CardContent>
    </Card>
  )
}
