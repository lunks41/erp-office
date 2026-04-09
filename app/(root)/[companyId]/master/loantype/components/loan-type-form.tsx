"use client"

import { useEffect } from "react"
import { ILoanType } from "@/interfaces/loantype"
import { LoanTypeSchemaType, loanTypeSchema } from "@/schemas/loantype"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"

const defaultValues = {
  loanTypeId: 0,
  loanTypeCode: "",
  loanTypeName: "",
  interestRatePct: 0,
  maxTermMonths: 0,
  minTermMonths: 0,
}
interface LoanTypeFormProps {
  initialData?: ILoanType
  submitAction: (data: LoanTypeSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function LoanTypeForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: LoanTypeFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<LoanTypeSchemaType>({
    resolver: zodResolver(loanTypeSchema),
    defaultValues: initialData
      ? {
          loanTypeId: initialData.loanTypeId ?? 0,
          loanTypeCode: initialData.loanTypeCode ?? "",
          loanTypeName: initialData.loanTypeName ?? "",
          interestRatePct: initialData.interestRatePct ?? 0,
          maxTermMonths: initialData.maxTermMonths ?? 0,
          minTermMonths: initialData.minTermMonths ?? 0,
        }
      : {
          ...defaultValues,
        },
  })

  // Reset form when initialData changes
  useEffect(() => {
    form.reset(
      initialData
        ? {
            loanTypeId: initialData.loanTypeId ?? 0,
            loanTypeCode: initialData.loanTypeCode ?? "",
            loanTypeName: initialData.loanTypeName ?? "",
            interestRatePct: initialData.interestRatePct ?? 0,
            maxTermMonths: initialData.maxTermMonths ?? 0,
            minTermMonths: initialData.minTermMonths ?? 0,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("loanTypeCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: LoanTypeSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="loanTypeCode"
                label="Loan Type Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="loanTypeName"
                label="Loan Type Name"
                isRequired
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="interestRatePct"
                label="Interest Rate %"
                type="number"
                isRequired
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="maxTermMonths"
                label="Max Term Months"
                type="number"
                isRequired
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="minTermMonths"
                label="Min Term Months"
                type="number"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>

                        <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={onCancelAction}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : initialData ? "Edit" : "Add"}
                </Button>
              )}
            </div>

            {/* Audit Information Section */}
            <AuditTrailAccordion createBy={initialData?.createBy} createDate={initialData?.createDate} editBy={initialData?.editBy} editDate={initialData?.editDate} datetimeFormat={datetimeFormat} />
          </div>
        </form>
      </Form>
    </div>
  )
}
