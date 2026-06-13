"use client"

import { useEffect, useState } from "react"
import { ILoanRequest } from "@/interfaces/loan"
import {
  LOAN_DECISION,
  LoanApprovalFormData,
  loanApprovalSchema,
} from "@/schemas/loan"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CustomDateNoPast } from "@/components/custom/custom-date-no-past"
import CustomInput from "@/components/custom/custom-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface LoanApprovalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loanRequest: ILoanRequest | null
  onSubmit: (data: LoanApprovalFormData) => Promise<void>
}

export function LoanApprovalForm({
  open,
  onOpenChange,
  loanRequest,
  onSubmit,
}: LoanApprovalFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoanApprovalFormData>({
    resolver: zodResolver(loanApprovalSchema),
    defaultValues: {
      approvalId: 0,
      loanRequestId: loanRequest?.loanRequestId || 0,
      approverId: 0,
      approvalDate: new Date(),
      approvedAmount: loanRequest?.requestedAmount || 0,
      revisedEMIStartDate: loanRequest?.emiStartDate || new Date(),
      revisedEMIAmount: loanRequest?.desiredEMIAmount || 0,
      comments: "",
      decisionId: LOAN_DECISION.APPROVED,
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open && loanRequest) {
      form.reset({
        approvalId: 0,
        loanRequestId: loanRequest.loanRequestId,
        approverId: 0,
        approvalDate: new Date(),
        approvedAmount: loanRequest.requestedAmount,
        revisedEMIStartDate: loanRequest.emiStartDate,
        revisedEMIAmount: loanRequest.desiredEMIAmount,
        comments: "",
        decisionId: LOAN_DECISION.APPROVED,
      })
    }
  }, [open, loanRequest, form])

  const handleSubmit = async (data: LoanApprovalFormData) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      console.error("Error submitting loan approval:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!loanRequest) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Loan Approval</DialogTitle>
        </DialogHeader>

        {/* Loan Request Details */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Loan Request Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Request ID:</span>
              <span className="ml-2">
                REQ-{String(loanRequest.loanRequestId).padStart(5, "0")}
              </span>
            </div>
            <div>
              <span className="font-medium">Employee ID:</span>
              <span className="ml-2">
                EMP{String(loanRequest.employeeId).padStart(6, "0")}
              </span>
            </div>
            <div>
              <span className="font-medium">Requested Amount:</span>
              <span className="ml-2">
                AED {loanRequest.requestedAmount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Desired EMI:</span>
              <span className="ml-2">
                AED {loanRequest.desiredEMIAmount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Term:</span>
              <span className="ml-2">
                {loanRequest.calculatedTermMonths} months
              </span>
            </div>
            <div>
              <span className="font-medium">EMI Start Date:</span>
              <span className="ml-2">
                {new Date(loanRequest.emiStartDate).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="decisionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approval Decision</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={String(LOAN_DECISION.APPROVED)}>
                        Approve
                      </SelectItem>
                      <SelectItem value={String(LOAN_DECISION.REJECTED)}>
                        Reject
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("decisionId") === LOAN_DECISION.APPROVED && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <CustomInput
                    form={form}
                    name="approvedAmount"
                    label="Approved Amount (AED)"
                    type="number"
                    placeholder="Enter approved amount"
                    isDisabled={isLoading}
                  />

                  <CustomInput
                    form={form}
                    name="revisedEMIAmount"
                    label="Revised EMI (AED)"
                    type="number"
                    placeholder="Enter revised EMI"
                    isDisabled={isLoading}
                  />
                </div>

                <CustomDateNoPast
                  form={form}
                  name="revisedEMIStartDate"
                  label="Revised EMI Start Date"
                  isDisabled={isLoading}
                  placeholder="Select revised EMI start date"
                  allowToday={true}
                />
              </>
            )}

            <CustomTextarea
              form={form}
              name="comments"
              label="Comments"
              isDisabled={isLoading}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Submit Decision"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
