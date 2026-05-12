"use client"

import { ILoanRepayment, ILoanRequest } from "@/interfaces/loan"
import { ColumnDef } from "@tanstack/react-table"
import { Trash2 } from "lucide-react"

import { HrLoan } from "@/lib/api-routes"
import { useGetById } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export const columns: ColumnDef<ILoanRepayment>[] = [
  {
    accessorKey: "dueDate",
    header: "INSTALMENT DATE",
    cell: ({ row }) => {
      const date = row.getValue("dueDate") as string
      return <span>{new Date(date).toLocaleDateString()}</span>
    },
  },
  {
    accessorKey: "emiAmount",
    header: "EMI",
    cell: ({ row }) => {
      const emi = row.getValue("emiAmount") as number
      const status = row.original.statusName
      return (
        <div>
          <div>AED {emi.toLocaleString()}</div>
          {status === "PartPayment" && (
            <div className="text-xs font-medium text-orange-600">
              PART PAYMENT
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "totalRepaid",
    header: "TOTAL AMOUNT REPAID",
    cell: ({ row }) => {
      // This will be calculated and passed from the parent component
      const repaid = row.original.totalRepaid || 0
      return (
        <span className="font-medium text-green-600">
          AED {repaid.toLocaleString()}
        </span>
      )
    },
  },
  {
    accessorKey: "outstandingBalance",
    header: "REMAINING AMOUNT",
    cell: ({ row }) => {
      const outstanding = row.getValue("outstandingBalance") as number
      return (
        <div className="flex items-center justify-between">
          <span className="font-medium text-red-600">
            AED {outstanding.toLocaleString()}
          </span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  },
]

interface LoanRepaymentTableProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loanId: number | null
}

export function LoanRepaymentTable({
  open,
  onOpenChange,
  loanId,
}: LoanRepaymentTableProps) {
  // Fetch loan repayments and loan details
  const { data: repaymentsData } = useGetById<ILoanRepayment[]>(
    `${HrLoan.getById}`,
    "loan-repayments",
    loanId?.toString() || ""
  )
  const { data: loanDetailsData } = useGetById<ILoanRequest[]>(
    `${HrLoan.getById}`,
    "loan-details",
    loanId?.toString() || ""
  )

  // Helper function to extract repayments safely
  const extractRepayments = (data: ILoanRepayment[]): ILoanRepayment[] => {
    if (!data) return []
    if (Array.isArray(data)) {
      if (data.length > 0 && Array.isArray(data[0])) {
        return data[0] as ILoanRepayment[]
      }
      return data as ILoanRepayment[]
    }
    return []
  }

  const repayments = extractRepayments(
    repaymentsData?.data as unknown as ILoanRepayment[]
  )

  const loanDetails: ILoanRequest =
    loanDetailsData?.data as unknown as ILoanRequest

  // Calculate summary statistics
  const totalRepaid = repayments.reduce((sum, repayment) => {
    return repayment.paidDate ? sum + repayment.emiAmount : sum
  }, 0)

  const totalLoanAmount = loanDetails?.requestedAmount || 0
  const remainingAmount = totalLoanAmount - totalRepaid
  const installmentsRemaining = repayments.filter((r) => !r.paidDate).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Loan Repayment History</DialogTitle>
        </DialogHeader>

        {loanId && (
          <>
            {/* Summary */}
            <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  AED {totalRepaid.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Amount Repaid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  AED {remainingAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Remaining Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {installmentsRemaining}
                </div>
                <div className="text-sm text-gray-600">
                  Instalment(s) Remaining
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
