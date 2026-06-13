// LoanRequests.schema.ts
import { z } from "zod"

export const loanRequestSchema = z.object({
  loanRequestId: z.number(),
  employeeId: z.number().min(1, "Employee is required"),
  loanTypeId: z.number().min(1, "Loan Type is required"),
  requestedAmount: z
    .number()
    .nonnegative()
    .min(1, "Requested Amount is required"),
  requestDate: z.union([z.string(), z.date()]).optional(),
  emiStartDate: z.union([z.string(), z.date()]).optional(),
  desiredEMIAmount: z
    .number()
    .nonnegative()
    .min(1, "Desired EMI Amount is required"),
  calculatedTermMonths: z
    .number()
    .int()
    .positive()
    .min(1, "Calculated Term Months is required"),
  statusId: z.number(),
  remarks: z.string().optional(),
})

export type LoanRequestFormData = z.infer<typeof loanRequestSchema>

// LoanApprovals.schema.ts
// Loan decision ids map to M_ServiceType category 15 (loan request statuses)
export const LOAN_DECISION = {
  APPROVED: 1502,
  REJECTED: 1503,
} as const

export const loanApprovalSchema = z.object({
  approvalId: z.number(),
  loanRequestId: z.number().min(1, "Loan request is required"),
  approverId: z.number(),
  approvalDate: z.union([z.string(), z.date()]).optional(),
  approvedAmount: z
    .number()
    .nonnegative()
    .min(1, "Approved amount is required"),
  revisedEMIStartDate: z.union([z.string(), z.date()]).optional(),
  revisedEMIAmount: z
    .number()
    .nonnegative()
    .min(1, "Revised EMI amount is required"),
  comments: z.string().max(1000).optional(),
  decisionId: z.union(
    [z.literal(LOAN_DECISION.APPROVED), z.literal(LOAN_DECISION.REJECTED)],
    { message: "Decision is required" }
  ),
})

export type LoanApprovalFormData = z.infer<typeof loanApprovalSchema>

// LoanDisbursements.schema.ts
export const loanDisbursementSchema = z.object({
  disbursementId: z.number(),
  loanRequestId: z.number(),
  disbursementDate: z.union([z.string(), z.date()]).optional(),
  amount: z.number().nonnegative(),
  transactionReference: z.string().max(100).optional(),
  methodId: z.number(),
})

export type LoanDisbursementFormData = z.infer<typeof loanDisbursementSchema>

// LoanRepaymentSchedule.schema.ts
export const loanRepaymentSchema = z.object({
  repaymentId: z.number(),
  loanRequestId: z.number(),
  installmentNumber: z.number().int().positive(),
  dueDate: z.union([z.string(), z.date()]).optional(),
  emiAmount: z.number().nonnegative().min(1, "Payment amount is required"),
  principalComponent: z
    .number()
    .nonnegative()
    .min(1, "Principal amount is required"),
  interestComponent: z
    .number()
    .nonnegative()
    .min(0, "Interest amount must be non-negative"),
  outstandingBalance: z.number().nonnegative(),
  statusId: z.number(),
  paymentMethod: z.string().optional(),
  transactionReference: z.string().optional(),
  comments: z.string().optional(),
})

export type LoanRepaymentFormData = z.infer<typeof loanRepaymentSchema>

// LoanSkipRequests.schema.ts
export const loanSkipRequestSchema = z.object({
  skipRequestId: z.number(),
  repaymentId: z.number(),
  loanRequestId: z.number(),
  employeeId: z.number(),
  skipRequestDate: z.union([z.string(), z.date()]).optional(),
  intendedResumeDate: z.union([z.string(), z.date()]).optional(),
  approverId: z.number(),
  approvalDate: z.union([z.string(), z.date()]).optional(),
  statusId: z.number(),
})

export type LoanSkipRequestFormData = z.infer<typeof loanSkipRequestSchema>

// LoanType.schema.ts
export const loanTypeSchema = z.object({
  loanTypeId: z.number(),
  loanTypeCode: z.string().max(50).optional(),
  loanTypeName: z.string().max(50),
  interestRatePct: z.number().min(0).max(100),
  maxTermMonths: z.number().int().positive(),
  minTermMonths: z.number().int().positive(),
})

export type LoanTypeFormData = z.infer<typeof loanTypeSchema>
