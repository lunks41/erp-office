"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ILoanRequest, LoanRequestSchedule } from "@/interfaces/loan"
import { AlertTriangle, Edit, MoreHorizontal, Play } from "lucide-react"
import { toast } from "sonner"

import { HrLoan } from "@/lib/api-routes"
import { useGet, useGetById, usePersist } from "@/hooks/use-common"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

import { LoanRepaymentForm } from "../components/loan-repayment-form"
import { LoanSkipRequestForm } from "../components/loan-skip-request-form"

export default function LoanDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const loanId = Number(params.loanId)
  const companyId = params.companyId as string
  const [showRepaymentForm, setShowRepaymentForm] = useState(false)
  const [showSkipRequestForm, setShowSkipRequestForm] = useState(false)

  // Fetch loan data using hooks
  const { data: loanDetailData } = useGetById<LoanRequestSchedule>(
    `${HrLoan.getLoanDetails}`,
    "loan-detail",
    loanId.toString()
  )

  const { data: allLoansData } = useGet<ILoanRequest[]>(
    `${HrLoan.getActiveClosed}`,
    "all-loans"
  )

  // Mutation hooks for actions
  const resumeLoanMutation = usePersist<{ loanId: number }>(
    `/hr/loan/resumeinstalment`
  )

  // Helper functions to extract data safely
  const extractLoans = (
    data: { result: number; message: string; data: unknown } | undefined
  ): ILoanRequest[] => {
    if (!data?.data) return []
    if (Array.isArray(data.data)) {
      if (data.data.length > 0 && Array.isArray(data.data[0])) {
        return data.data[0] as ILoanRequest[]
      }
      return data.data as ILoanRequest[]
    }
    return []
  }

  const extractSingleLoan = (
    data: { result: number; message: string; data: unknown } | undefined
  ): LoanRequestSchedule | undefined => {
    if (!data?.data) return undefined

    console.log("Extracting loan data:", { loanId, data })

    // If data is an array, find the loan with matching loanRequestId
    if (Array.isArray(data.data)) {
      if (data.data.length > 0 && Array.isArray(data.data[0])) {
        const loans = data.data[0] as LoanRequestSchedule[]
        console.log("Found nested array of loans:", loans)
        return loans.find((loan) => loan.loanRequestId === loanId)
      }
      const loans = data.data as LoanRequestSchedule[]
      console.log("Found array of loans:", loans)
      return loans.find((loan) => loan.loanRequestId === loanId)
    }

    // If data is a single object
    if (typeof data.data === "object" && data.data !== null) {
      console.log("Found single loan object:", data.data)
      return data.data as LoanRequestSchedule
    }

    console.log("No valid loan data found")
    return undefined
  }

  const extractAllLoans = (
    data: { result: number; message: string; data: unknown } | undefined
  ): LoanRequestSchedule[] => {
    if (!data?.data) return []

    // Case 1: Nested array (e.g., [ [LoanRequestSchedule, ...] ])
    if (Array.isArray(data.data)) {
      if (data.data.length > 0 && Array.isArray(data.data[0])) {
        return data.data[0] as LoanRequestSchedule[]
      }
      return data.data as LoanRequestSchedule[]
    }

    // Case 2: Single object
    if (typeof data.data === "object" && data.data !== null) {
      return [data.data as LoanRequestSchedule]
    }

    // Case 3: Invalid format
    return []
  }

  const allLoans = extractLoans(allLoansData)
  const selectedLoan = extractSingleLoan(loanDetailData)
  const tabledata = extractAllLoans(loanDetailData)

  console.log("loanDetailData", loanDetailData)

  console.log("allLoans ", allLoans)

  // Sort loans: open loans first, then closed loans
  const sortedLoans = [...allLoans].sort((a, b) => {
    if (a.statusName === "Closed" && b.statusName !== "Closed") return 1
    if (a.statusName !== "Closed" && b.statusName === "Closed") return -1
    return 0
  })

  console.log("All Loans:", allLoans)
  console.log("Selected Loan:", selectedLoan)

  const handleLoanSelect = (loan: ILoanRequest) => {
    router.push(`/${companyId}/hr/loan/${loan.loanRequestId}`)
  }

  // Calculate loan statistics from selected loan data
  const totalRepaid = selectedLoan?.totalRepaidAmount || 0
  const remainingAmount = selectedLoan?.totalRemainingAmount || 0
  const installmentsRemaining = selectedLoan?.pendingInstallments || 0

  const handleRecordRepayment = () => {
    setShowRepaymentForm(true)
  }

  const handlePauseInstallment = () => {
    setShowSkipRequestForm(true)
  }

  const handleResumeNow = async () => {
    try {
      await resumeLoanMutation.mutateAsync({ loanId })
      toast.success("Loan instalment deduction resumed successfully")
    } catch {
      toast.error("Failed to resume loan")
    }
  }

  const handleViewReason = () => {
    toast.info("Viewing pause reason details")
  }

  const handleEditReason = () => {
    toast.info("Editing pause reason")
  }

  // Show loading state if no loan data
  if (!selectedLoan) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">
            {loanDetailData ? "Loan not found" : "Loading loan details..."}
          </div>
          {loanDetailData && (
            <div className="mt-2 text-sm text-gray-500">
              Loan ID: {loanId} not found in the data
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="@container flex h-screen">
      {/* Left Sidebar */}
      <div className="flex w-80 flex-col border-r border-gray-200">
        {/* Loan List */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {sortedLoans.map((loan) => (
            <div
              key={loan.loanRequestId}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                selectedLoan?.loanRequestId === loan.loanRequestId
                  ? "border-border bg-card"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => handleLoanSelect(loan)}
            >
              <div className="mb-1 flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-500">
                    {loan.employeeName || "Unknown Employee"}
                  </div>
                  <div className="text-sm text-gray-500">
                    (
                    {loan.employeeCode ||
                      `EMP${loan.employeeId.toString().padStart(6, "0")}`}
                    )
                  </div>
                </div>
                <Badge
                  variant={
                    loan.statusName === "Closed" ? "destructive" : "default"
                  }
                >
                  {loan.statusName === "Closed" ? "CLOSED" : "OPEN"}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <CurrencyFormatter amount={loan.requestedAmount} size="sm" />
              </div>
              <div className="text-sm text-gray-500">
                {loan.loanTypeName || "Unknown Type"} | LOAN-
                {loan.loanRequestId.toString().padStart(5, "0")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/${companyId}/hr/loan`)}
                className="mr-2"
              >
                ← Back to List
              </Button>
              <h1 className="text-xl font-bold">
                LOAN-{selectedLoan.loanRequestId.toString().padStart(5, "0")}
              </h1>
              <Badge
                variant={
                  selectedLoan.requestStatus === "Closed"
                    ? "secondary"
                    : "default"
                }
              >
                {selectedLoan.requestStatus}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleRecordRepayment}>Record Repayment</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Loan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePauseInstallment}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Pause Installment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        {/* Alert Banner */}
        {selectedLoan.requestStatus === "PAUSED" && (
          <div className="border-l-4 border-gray-400 bg-yellow-50 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-yellow-400" />
                <p className="text-yellow-800">
                  Loan instalment deduction will be paused from Aug 2025 and
                  will be resumed in Sep 2025.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <button
                  onClick={handleViewReason}
                  className="text-yellow-600 underline hover:text-yellow-800"
                >
                  View Reason
                </button>
                <span className="text-yellow-600">|</span>
                <button
                  onClick={handleEditReason}
                  className="text-yellow-600 underline hover:text-yellow-800"
                >
                  (Edit)
                </button>
                <span className="text-yellow-600">|</span>
                <button
                  onClick={handleResumeNow}
                  className="flex items-center text-yellow-600 underline hover:text-yellow-800"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Resume Now
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Main Content */}
        <div className="flex-1 space-y-4 p-4">
          {/* Loan Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedLoan?.loanTypeName || "Unknown Type"}</span>
                <span className="text-2xl font-bold">
                  <CurrencyFormatter
                    amount={selectedLoan?.requestedAmount || 0}
                    size="lg"
                  />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/default.png" />
                    <AvatarFallback>
                      {(selectedLoan?.employeeName || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {selectedLoan?.employeeName || "Unknown Employee"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedLoan?.employeeCode ||
                        `EMP${selectedLoan?.employeeId}`}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Instalment Amount</div>
                  <div className="font-medium">
                    <CurrencyFormatter
                      amount={selectedLoan?.desiredEMIAmount || 0}
                      size="md"
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {selectedLoan.requestedAmount > 0
                        ? `${((selectedLoan.totalRepaidAmount / selectedLoan.requestedAmount) * 100).toFixed(1)}%`
                        : "0%"}
                    </span>
                    <Progress
                      value={
                        selectedLoan
                          ? (selectedLoan.totalRepaidAmount /
                              selectedLoan.requestedAmount) *
                            100
                          : 50
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-500">
                    Next Instalment Date:{" "}
                    {selectedLoan?.nextInstallmentDueDate
                      ? new Date(
                          selectedLoan.nextInstallmentDueDate
                        ).toLocaleDateString()
                      : "Closed"}
                  </div>
                </div>

                <div className="text-right">
                  {allLoans.filter(
                    (loan) => loan.employeeId === selectedLoan.employeeId
                  ).length -
                    1 >
                    0 && (
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {allLoans.filter(
                        (loan) => loan.employeeId === selectedLoan.employeeId
                      ).length - 1}{" "}
                      more Loan(s) in progress
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Details */}
          <Card>
            <CardHeader>
              <CardTitle>Other Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Disbursement Date:</span>
                <span className="ml-2">
                  {selectedLoan?.disbursementDate
                    ? new Date(
                        selectedLoan.disbursementDate
                      ).toLocaleDateString()
                    : "Not available"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Loan closing Date:</span>
                <span className="ml-2">
                  {selectedLoan?.closingDate
                    ? new Date(selectedLoan.closingDate).toLocaleDateString()
                    : "Not available"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Reason:</span>
                <span className="ml-2">
                  {selectedLoan?.remarks || "Not specified"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Loan Repayment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Repayment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    <CurrencyFormatter amount={totalRepaid} size="md" />
                  </div>
                  <div className="text-sm text-gray-600">Amount Repaid</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    <CurrencyFormatter amount={remainingAmount} size="md" />
                  </div>
                  <div className="text-sm text-gray-600">Remaining Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-muted-foreground">
                    {installmentsRemaining}
                  </div>
                  <div className="text-sm text-gray-600">
                    Instalment(s) Remaining
                  </div>
                </div>
              </div>

              {/* Repayment Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Installement Date</th>
                      <th className="py-2 text-left">EMI</th>
                      <th className="py-2 text-left">Total Amount Repaid</th>
                      <th className="py-2 text-left">Remaining Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabledata && tabledata.length > 0 ? (
                      // Use the array data directly - showing loan requests
                      <>
                        {console.log(
                          "Rendering table with data:",
                          tabledata.length,
                          "items"
                        )}
                        {tabledata.map(
                          (loan: LoanRequestSchedule, index: number) => {
                            console.log("Rendering loan item:", index, loan)
                            return (
                              <tr key={index} className="border-b">
                                <td className="py-2">
                                  {loan.paidDate
                                    ? new Date(
                                        loan.paidDate
                                      ).toLocaleDateString()
                                    : new Date(
                                        loan.dueDate
                                      ).toLocaleDateString()}
                                </td>
                                <td className="py-2">
                                  <div className="text-xs text-gray-500">
                                    <CurrencyFormatter
                                      amount={loan.emi}
                                      size="sm"
                                    />
                                  </div>
                                  {loan.requestedAmount > 0
                                    ? `${((loan.emi / loan.requestedAmount) * 100).toFixed(1)}%`
                                    : "0%"}
                                  <Badge
                                    variant={
                                      loan.installmentStatus === "Auto Paid"
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {loan.installmentStatus}
                                  </Badge>
                                </td>
                                <td className="py-2 font-medium text-green-600">
                                  <div className="text-xs text-gray-500">
                                    <CurrencyFormatter
                                      amount={loan.totalAmountRepaid}
                                      size="sm"
                                    />
                                  </div>
                                  {loan.requestedAmount > 0
                                    ? `${((loan.totalAmountRepaid / loan.requestedAmount) * 100).toFixed(1)}%`
                                    : "0%"}
                                </td>
                                <td className="py-2">
                                  <div className="text-xs text-gray-500">
                                    <CurrencyFormatter
                                      amount={loan.remaining_Amount}
                                      size="sm"
                                    />
                                  </div>
                                  <span className="font-medium text-red-600">
                                    {loan.requestedAmount > 0
                                      ? `${((loan.remaining_Amount / loan.requestedAmount) * 100).toFixed(1)}%`
                                      : "0%"}
                                  </span>
                                </td>
                              </tr>
                            )
                          }
                        )}
                      </>
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-gray-500"
                        >
                          <div>
                            <div>No loan data available</div>
                            <div className="mt-1 text-xs">
                              Array length: {allLoans?.length || 0} | Is Array:{" "}
                              {Array.isArray(allLoans) ? "Yes" : "No"}
                            </div>
                            {allLoans && allLoans.length > 0 && (
                              <div className="text-xs">
                                Found {allLoans.length} loan(s) in the data
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Dialogs */}
      <LoanRepaymentForm
        open={showRepaymentForm}
        onOpenChange={setShowRepaymentForm}
        loanId={loanId}
        onSubmit={async () => {
          // Handle repayment submission
          setShowRepaymentForm(false)
          toast.success("Repayment recorded successfully")
        }}
      />

      <LoanSkipRequestForm
        open={showSkipRequestForm}
        onOpenChange={setShowSkipRequestForm}
        loanId={loanId}
        onSubmit={async () => {
          // Handle skip request submission
          setShowSkipRequestForm(false)
          toast.success("Skip request submitted successfully")
        }}
      />
    </div>
  )
}
