export interface ILoan {
  id: number
  applicationId: number
  employeeId: number
  employeeName?: string
  employeeCode?: string
  loanType: string
  loanAmount: number
  interestRate: number
  termMonths: number
  monthlyPayment: number
  totalInterest: number
  totalAmount: number
  startDate: string | Date
  endDate: string | Date
  status: string
  approvedBy?: string
  approvedDate?: string | Date
  remarks?: string
  createdById: number
  createdDate: string | Date
  editedById?: number
  editedDate?: string | Date
  createdBy?: string
  editedBy?: string
}

export interface ILoanApplication {
  id: number
  employeeId: number
  employeeName?: string
  employeeCode?: string
  loanType: string
  requestedAmount: number
  purpose: string
  status: string
  submittedDate?: string | Date
  approvedBy?: string
  approvedDate?: string | Date
  rejectedBy?: string
  rejectedDate?: string | Date
  rejectionReason?: string
  remarks?: string
  createdById: number
  createdDate: string | Date
  editedById?: number
  editedDate?: string | Date
  createdBy?: string
  editedBy?: string
}

export interface ILoanApplicationFilter {
  employeeId?: number
  loanType?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface ILoanApplicationFormData {
  employeeId: number
  loanType: string
  requestedAmount: number
  purpose: string
  remarks?: string
}

// Matches api-core SaveLoanApprovalViewModel (POST hr/loan/saveapproval).
// decisionId: 1502 = Approved, 1503 = Rejected (M_ServiceType category 15).
export interface ILoanApprovalFormData {
  approvalId: number
  loanRequestId: number
  approverId: number
  approvalDate?: string | Date
  approvedAmount: number
  revisedEMIStartDate?: string | Date
  revisedEMIAmount?: number
  comments?: string
  decisionId: number
}

export interface ILoanFilter {
  employeeId?: number
  loanType?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface ILoanRepayment {
  id: number
  loanId: number
  employeeId: number
  employeeName?: string
  paymentDate: string | Date
  amount: number
  principalAmount: number
  interestAmount: number
  remainingBalance: number
  paymentMethod: string
  referenceNumber?: string
  remarks?: string
  createdById: number
  createdDate: string | Date
  editedById?: number
  editedDate?: string | Date
  createdBy?: string
  editedBy?: string
}

export interface ILoanRepaymentFilter {
  loanId?: number
  employeeId?: number
  dateFrom?: string
  dateTo?: string
}

export interface ILoanRepaymentFormData {
  loanId: number
  paymentDate: string | Date
  amount: number
  paymentMethod: string
  referenceNumber?: string
  remarks?: string
}

export interface ILoanDashboard {
  totalLoans: number
  activeLoans: number
  totalAmount: number
  totalOutstanding: number
  totalRepaid: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  monthlyRepayments: number
  overdueLoans: number
  overdueAmount: number
}

// LoanRequests.ts
export interface ILoanRequest {
  loanRequestId: number
  employeeId: number
  employeeName?: string
  employeeCode?: string
  loanTypeId: number
  loanTypeName?: string
  requestedAmount: number
  requestDate: string | Date
  emiStartDate: string
  desiredEMIAmount: number
  calculatedTermMonths: number
  statusId: number
  statusName: string
  createdById: number
  createdDate: string | Date
  editedById?: number
  editedDate?: string | Date
  createdBy: string
  editedBy?: string
  remarks?: string
}

// LoanApprovals.ts
export interface ILoanApproval {
  approvalId: number
  loanRequestId: number
  approverId: number
  approvalDate: string | Date
  approvedAmount: number
  revisedEMIStartDate?: string
  revisedEMIAmount?: number
  comments?: string
  decisionId: number
  createdById: number
  createdDate: string | Date
  createdBy: string
}

// LoanDisbursements.ts
export interface ILoanDisbursement {
  disbursementId: number
  loanRequestId: number
  disbursementDate: string
  amount: number
  transactionReference?: string
  methodId: number
  methodName: string
  createdById: number
  createdDate: string | Date
  createdBy: string
  editedById?: number
  editedDate?: string | Date
  editedBy?: string
}

// LoanRepaymentSchedule.ts
export interface ILoanRepayment {
  repaymentId: number
  loanRequestId: number
  installmentNumber: number
  dueDate: string
  emiAmount: number
  principalComponent: number
  interestComponent: number
  outstandingBalance: number
  statusId: number
  statusName: string
  paidDate?: string | Date
  totalRepaid?: number
  createdById: number
  createdDate: string | Date
  createdBy?: string
  editedById?: number
  editedDate?: string | Date
  editedBy?: string
}

// LoanSkipRequests.ts
export interface ILoanSkipRequest {
  skipRequestId: number
  repaymentId: number
  loanRequestId: number
  employeeId: number
  skipRequestDate: string
  intendedResumeDate: string
  approverId: number
  approvalDate?: string | Date
  statusId: number
  statusName: string
  comments?: string
  createdById: number
  createdDate: string | Date
  createdBy: string
  editedById?: number
  editedDate?: string | Date
  editedBy?: string
}
// LoanType.ts
export interface ILoanType {
  loanTypeId: number
  loanTypeCode?: string
  loanTypeName: string
  interestRatePct: number
  maxTermMonths: number
  minTermMonths: number
  createById: number
  createDate?: string
}

export interface LoanRequestSchedule {
  loanRequestId: number
  employeeId: number
  employeeCode: string
  employeeName: string
  loanTypeId: number
  loanTypeName: string
  requestDate: string
  requestedAmount: number
  emiStartDate: string
  desiredEMIAmount: number
  calculatedTermMonths: number
  statusId: number
  requestStatus: string
  remarks: string
  disbursementDate: string
  closingDate?: string
  loanStatus: string
  nextInstallmentDueDate: string

  dueDate: string // ISO date string
  paidDate?: string | null // Optional ISO date string
  emi: number
  totalAmountRepaid: number
  remaining_Amount: number
  installmentStatusId: number
  installmentStatus: string

  // Aggregates
  pendingInstallments: number
  totalRepaidAmount: number
  totalRemainingAmount: number
}
