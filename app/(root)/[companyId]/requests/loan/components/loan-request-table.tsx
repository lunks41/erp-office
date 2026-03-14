"use client"

import { useState } from "react"
import { ILoanRequest } from "@/interfaces/loan"
import {
  CheckCircle,
  Clock as ClockIcon,
  DollarSign,
  Eye,
  MoreHorizontal,
  SkipForward,
  XCircle,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

import LoanDetailsTable from "./loan-details-table"
import { LoanSkipRequestForm } from "./loan-skip-request-form"

interface LoanRequestTableProps {
  loans: ILoanRequest[]
  onSaveAction?: (
    loanId: string,
    action: "approve" | "reject" | "cancel",
    notes?: string
  ) => void
  showActions?: boolean
}

interface ApprovalDialogData {
  loan: ILoanRequest | null
  action: "approve" | "reject" | "cancel" | null
  notes: string
}

export function LoanRequestTable({
  loans,
  onSaveAction,
  showActions = true,
}: LoanRequestTableProps) {
  const [selectedLoan, setSelectedLoan] = useState<ILoanRequest | null>(null)
  const [showLoanDetails, setShowLoanDetails] = useState(false)
  const [showSkipRequestForm, setShowSkipRequestForm] = useState(false)
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogData>({
    loan: null,
    action: null,
    notes: "",
  })

  const handleViewLoan = (loan: ILoanRequest) => {
    setSelectedLoan(loan)
    setShowLoanDetails(true)
  }

  const handleSkipInstallment = (loan: ILoanRequest) => {
    setSelectedLoan(loan)
    setShowSkipRequestForm(true)
  }

  const handleApprovalAction = (
    loan: ILoanRequest,
    action: "approve" | "reject" | "cancel"
  ) => {
    setApprovalDialog({
      loan,
      action,
      notes: "",
    })
  }

  const handleApprovalSubmit = () => {
    if (!approvalDialog.loan || !approvalDialog.action) return

    const { loan, action, notes } = approvalDialog

    // Call the single onSaveAction function with action and notes
    onSaveAction?.(loan.loanRequestId.toString(), action, notes)

    // Close dialog and reset
    setApprovalDialog({
      loan: null,
      action: null,
      notes: "",
    })
  }

  const handleApprovalCancel = () => {
    setApprovalDialog({
      loan: null,
      action: null,
      notes: "",
    })
  }

  const handleSkipRequestSubmit = async (_data: unknown) => {
    try {
      setShowSkipRequestForm(false)
      setSelectedLoan(null)
    } catch (error) {
      console.error("Error submitting skip request:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <ClockIcon className="h-4 w-4" />
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />
      case "REJECTED":
        return <XCircle className="h-4 w-4" />
      case "CANCELLED":
        return <ClockIcon className="h-4 w-4" />
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const getLoanTypeColor = (type: string) => {
    switch (type) {
      case "Personal Loan":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Home Loan":
        return "bg-green-100 text-green-800 border-green-200"
      case "Vehicle Loan":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Education Loan":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Emergency Loan":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const _formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Invalid Date"
    }
  }

  const getActionButtonColor = (action: string) => {
    switch (action) {
      case "approve":
        return "bg-green-600 hover:bg-green-700"
      case "reject":
        return "bg-red-600 hover:bg-red-700"
      case "cancel":
        return "bg-gray-600 hover:bg-gray-700"
      default:
        return "bg-blue-600 hover:bg-blue-700"
    }
  }

  const getActionButtonText = (action: string) => {
    switch (action) {
      case "approve":
        return "Approve"
      case "reject":
        return "Reject"
      case "cancel":
        return "Cancel"
      default:
        return "Action"
    }
  }

  // Handle empty or invalid data
  if (!loans || loans.length === 0) {
    return (
      <div className="py-8 text-center">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No loan requests found
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          There are no loan requests to display.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Simple Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Loan Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Installments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan, index) => (
              <TableRow key={loan.loanRequestId || `loan-${index}`}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {loan.employeeName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {loan.employeeName || "Unknown Employee"}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {loan.employeeCode || "No Code"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getLoanTypeColor(loan.loanTypeName || "")}
                  >
                    {loan.loanTypeName || "Unknown Type"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">
                      <CurrencyFormatter amount={loan.requestedAmount || 0} />
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {loan.calculatedTermMonths || 0}
                  </span>
                  <span className="text-muted-foreground text-sm"> months</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`flex items-center space-x-1 ${getStatusColor(loan.statusName || "")}`}
                  >
                    {getStatusIcon(loan.statusName)}
                    <span>{loan.statusName || "UNKNOWN"}</span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate text-sm">
                    {loan.remarks || "No purpose provided"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewLoan(loan)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {loan.statusName === "APPROVED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSkipInstallment(loan)}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    )}
                    {showActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewLoan(loan)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {loan.statusName === "PENDING" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApprovalAction(loan, "approve")
                                }
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApprovalAction(loan, "reject")
                                }
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApprovalAction(loan, "cancel")
                                }
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          {loan.statusName === "APPROVED" && (
                            <DropdownMenuItem
                              onClick={() => handleSkipInstallment(loan)}
                            >
                              <SkipForward className="mr-2 h-4 w-4" />
                              Skip Installment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Approval Dialog */}
      <Dialog
        open={!!approvalDialog.loan}
        onOpenChange={() => handleApprovalCancel()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.action === "approve" && "Approve Loan Request"}
              {approvalDialog.action === "reject" && "Reject Loan Request"}
              {approvalDialog.action === "cancel" && "Cancel Loan Request"}
            </DialogTitle>
          </DialogHeader>
          {approvalDialog.loan && (
            <div className="space-y-4">
              {/* Loan Request Info */}
              <div className="rounded-lg border p-3">
                <div className="mb-3 flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {approvalDialog.loan.employeeName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {approvalDialog.loan.employeeName || "Unknown Employee"}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {approvalDialog.loan.loanTypeName || "Unknown Type"}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>
                      <CurrencyFormatter
                        amount={approvalDialog.loan.requestedAmount || 0}
                      />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Installments:</span>
                    <span>
                      {approvalDialog.loan.calculatedTermMonths || 0} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose:</span>
                    <span className="max-w-xs truncate">
                      {approvalDialog.loan.remarks || "No purpose"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  {approvalDialog.action === "approve" &&
                    "Approval Notes (Optional)"}
                  {approvalDialog.action === "reject" && "Rejection Reason"}
                  {approvalDialog.action === "cancel" && "Cancellation Reason"}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    approvalDialog.action === "approve"
                      ? "Add any notes for approval..."
                      : approvalDialog.action === "reject"
                        ? "Please provide a reason for rejection..."
                        : "Please provide a reason for cancellation..."
                  }
                  value={approvalDialog.notes}
                  onChange={(e) =>
                    setApprovalDialog((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleApprovalCancel}>
                  Cancel
                </Button>
                <Button
                  className={getActionButtonColor(approvalDialog.action || "")}
                  onClick={handleApprovalSubmit}
                  disabled={
                    (approvalDialog.action === "reject" ||
                      approvalDialog.action === "cancel") &&
                    !approvalDialog.notes.trim()
                  }
                >
                  {getActionButtonText(approvalDialog.action || "")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Loan Details Dialog */}
      <Dialog open={showLoanDetails} onOpenChange={setShowLoanDetails}>
        <DialogContent className="max-h-[90vh] w-[70vw] !max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <LoanDetailsTable loanId={selectedLoan.loanRequestId} />
          )}
        </DialogContent>
      </Dialog>

      {/* Skip Request Form Dialog */}
      <LoanSkipRequestForm
        open={showSkipRequestForm}
        onOpenChange={setShowSkipRequestForm}
        loanId={selectedLoan?.loanRequestId || null}
        onSubmit={handleSkipRequestSubmit}
      />
    </div>
  )
}
