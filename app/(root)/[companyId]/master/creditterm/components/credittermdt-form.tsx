"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { ICreditTermDt } from "@/interfaces/creditterm"
import {
  CreditTermDtSchemaType,
  credittermDtSchema,
} from "@/schemas/creditterm"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { CreditTermAutocomplete } from "@/components/autocomplete"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomSwitch from "@/components/custom/custom-switch"

const defaultValues = {
  creditTermId: 0,
  fromDay: 0,
  toDay: 0,
  dueDay: 0,
  noMonth: 0,
  isEndOfMonth: false,
}
interface CreditTermDtFormProps {
  initialData?: ICreditTermDt | null
  submitAction: (data: CreditTermDtSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
}

export function CreditTermDtForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
}: CreditTermDtFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const amtDec = decimals[0]?.amtDec || 2

  const form = useForm<CreditTermDtSchemaType>({
    resolver: zodResolver(credittermDtSchema),
    defaultValues: initialData
      ? {
          creditTermId: initialData.creditTermId ?? 0,
          fromDay: initialData.fromDay ?? 0,
          toDay: initialData.toDay ?? 0,
          dueDay: initialData.dueDay ?? 0,
          noMonth: initialData.noMonth ?? 0,
          isEndOfMonth: initialData.isEndOfMonth ?? false,
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
            creditTermId: initialData.creditTermId ?? 0,
            fromDay: initialData.fromDay ?? 0,
            toDay: initialData.toDay ?? 0,
            dueDay: initialData.dueDay ?? 0,
            noMonth: initialData.noMonth ?? 0,
            isEndOfMonth: initialData.isEndOfMonth ?? false,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const onSubmit = (data: CreditTermDtSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <CreditTermAutocomplete
                form={form}
                name="creditTermId"
                label="Credit Term"
                isRequired={true}
                isDisabled={isReadOnly}
              />

              <CustomNumberInput
                form={form}
                name="fromDay"
                label="From Day"
                isRequired
                isDisabled={isReadOnly}
                round={amtDec}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CustomNumberInput
                form={form}
                name="toDay"
                label="To Day"
                isRequired
                isDisabled={isReadOnly}
                round={amtDec}
              />
              <CustomNumberInput
                form={form}
                name="dueDay"
                label="Due Day"
                isRequired
                isDisabled={isReadOnly}
                round={amtDec}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CustomNumberInput
                form={form}
                name="noMonth"
                label="No. of Months"
                isRequired
                isDisabled={isReadOnly}
                round={amtDec}
              />

              <CustomSwitch
                form={form}
                name="isEndOfMonth"
                label="End of Month"
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
