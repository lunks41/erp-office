"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { formatDateForApi } from "@/lib/date-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { CustomDateNoPast } from "@/components/custom/custom-date-no-past"
import CustomTextarea from "@/components/custom/custom-textarea"

const loanSkipRequestSchema = z.object({
  skipRequestDate: z.string().min(1, "Skip request date is required"),
  intendedResumeDate: z.string().min(1, "Intended resume date is required"),
  comments: z.string().min(1, "Comments are required"),
})

type LoanSkipRequestFormData = z.infer<typeof loanSkipRequestSchema>

interface LoanSkipRequestFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loanId: number | null
  onSubmit: (data: LoanSkipRequestFormData) => Promise<void>
}

export function LoanSkipRequestForm({
  open,
  onOpenChange,
  loanId,
  onSubmit,
}: LoanSkipRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoanSkipRequestFormData>({
    resolver: zodResolver(loanSkipRequestSchema),
    defaultValues: {
      skipRequestDate: new Date().toISOString().split("T")[0],
      intendedResumeDate: "",
      comments: "",
    },
  })

  const handleSubmit = async (data: LoanSkipRequestFormData) => {
    setIsLoading(true)
    try {
      // Format dates for API submission
      const formattedData = {
        ...data,
        skipRequestDate: formatDateForApi(data.skipRequestDate) || "",
        intendedResumeDate: formatDateForApi(data.intendedResumeDate) || "",
      }
      await onSubmit(formattedData)
      form.reset()
    } catch (error) {
      console.error("Error submitting skip request:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pause Installment Deduction</DialogTitle>
        </DialogHeader>

        {loanId && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Loan ID:</span>
                <span className="ml-2">
                  LOAN-{String(loanId).padStart(5, "0")}
                </span>
              </div>
              <div>
                <span className="font-medium">Current EMI:</span>
                <span className="ml-2">AED 800.00</span>
              </div>
              <div>
                <span className="font-medium">Outstanding Balance:</span>
                <span className="ml-2">AED 2,500.00</span>
              </div>
              <div>
                <span className="font-medium">Next Due Date:</span>
                <span className="ml-2">30 Sep 2025</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <CustomDateNoPast
                form={form}
                name="skipRequestDate"
                label="Skip Request Date"
                isDisabled={isLoading}
                placeholder="Select skip request date"
                allowToday={true}
              />

              <CustomDateNoPast
                form={form}
                name="intendedResumeDate"
                label="Intended Resume Date"
                isDisabled={isLoading}
                placeholder="Select intended resume date"
                allowToday={true}
              />
            </div>

            <CustomTextarea
              form={form}
              name="comments"
              label="Comments"
              isDisabled={isLoading}
            />

            <div className="rounded-lg border border-gray-200 bg-yellow-50 p-4">
              <h4 className="mb-2 font-medium text-yellow-800">
                Important Notice
              </h4>
              <ul className="space-y-1 text-sm text-yellow-700">
                <li>
                  • Installment deduction will be paused from the specified date
                </li>
                <li>
                  • Interest will continue to accrue during the pause period
                </li>
                <li>• The loan term will be extended accordingly</li>
                <li>• This request requires approval from management</li>
              </ul>
            </div>

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
                {isLoading ? "Processing..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
