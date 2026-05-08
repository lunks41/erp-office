"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect, useMemo } from "react"
import { ICurrencyLocalDt } from "@/interfaces/currency"
import {
  CurrencyLocalDtSchemaType,
  currencyLocalDtSchema,
} from "@/schemas/currency"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  clientDateFormat,
  formatDateForApi,
  parseDate,
} from "@/lib/date-utils"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { CurrencyAutocomplete } from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomNumberInput from "@/components/custom/custom-number-input"
import { format } from "date-fns"

interface CurrencyLocalDtFormProps {
  initialData?: ICurrencyLocalDt | null
  submitAction: (data: CurrencyLocalDtSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
}

export function CurrencyLocalDtForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
}: CurrencyLocalDtFormProps) {
  const { decimals } = useCompanyStore()
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const defaultValues = useMemo(
    () => ({
      currencyId: 0,
      exhRate: exhRateDec || 9,
      validFrom: format(new Date(), clientDateFormat),
    }),
    [exhRateDec]
  )

  const form = useForm<CurrencyLocalDtSchemaType>({
    resolver: zodResolver(currencyLocalDtSchema),
    defaultValues: initialData
      ? {
          currencyId: initialData.currencyId ?? 0,
          exhRate: initialData.exhRate ?? exhRateDec ?? 9,
          validFrom: format(
            parseDate(initialData?.validFrom as string) || new Date(),
            clientDateFormat
          ),
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
            currencyId: initialData.currencyId ?? 0,
            exhRate: initialData.exhRate ?? exhRateDec ?? 9,
            validFrom: format(
              parseDate(initialData?.validFrom as string) || new Date(),
              clientDateFormat
            ),
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form, exhRateDec, defaultValues])

  const onSubmit = (data: CurrencyLocalDtSchemaType) => {
    // Format date to yyyy-MM-dd format before submission
    const formattedData = {
      ...data,
      validFrom: formatDateForApi(data.validFrom) || "",
    }
    submitAction(formattedData)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <CurrencyAutocomplete
                form={form}
                name="currencyId"
                label="Currency"
                isRequired
                isDisabled={isReadOnly}
              />

              <CustomNumberInput
                form={form}
                name="exhRate"
                label="Exchange Rate"
                round={exhRateDec}
                className="text-right"
                isRequired
                isDisabled={isReadOnly}
              />

              <CustomDateNew
                form={form}
                name="validFrom"
                label="Valid From"
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

