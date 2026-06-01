"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect, useMemo } from "react"
import { ITaxDt } from "@/interfaces/tax"
import { TaxDtSchemaType, taxDtSchema } from "@/schemas/tax"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { formatDateForApi, parseDate } from "@/lib/date-utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { TaxAutocomplete } from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomNumberInput from "@/components/custom/custom-number-input"
import { format } from "date-fns"

interface TaxDtFormProps {
  initialData?: ITaxDt | null
  submitAction: (data: TaxDtSchemaType) => void
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
}

export function TaxDtForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
}: TaxDtFormProps) {
  const { decimals } = useCompanyStore()
  const priceDec = decimals[0]?.priceDec || 2
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  console.log("initialData TaxDtForm", initialData)
  const defaultValues = useMemo(
    () => ({
      taxId: 0,
      taxPercentage: 0,
      validFrom: new Date(),
    }),
    []
  )

  const form = useForm<TaxDtSchemaType>({
    resolver: zodResolver(taxDtSchema),
    defaultValues: initialData
      ? {
          taxId: initialData.taxId ?? 0,
          taxPercentage: initialData.taxPercentage ?? 0,
          validFrom: initialData.validFrom
            ? format(
                parseDate(initialData.validFrom as string) || new Date(),
                dateFormat
              )
            : new Date(),
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
            taxId: initialData.taxId ?? 0,
            taxPercentage: initialData.taxPercentage ?? 0,
            validFrom: initialData.validFrom
              ? format(
                  parseDate(initialData.validFrom as string) || new Date(),
                  dateFormat
                )
              : new Date(),
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form, dateFormat, defaultValues])

  const onSubmit = (data: TaxDtSchemaType) => {
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
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-2">
              <TaxAutocomplete
                form={form}
                name="taxId"
                label="Tax"
                isRequired={true}
                isDisabled={isReadOnly || isSubmitting}
              />

              <CustomNumberInput
                form={form}
                name="taxPercentage"
                label="Tax Percentage"
                isRequired
                isDisabled={isReadOnly || isSubmitting}
                round={priceDec}
              />

              <CustomDateNew
                form={form}
                name="validFrom"
                label="Valid From"
                isDisabled={isReadOnly || isSubmitting}
                isRequired
              />
            </div>
            {/* Audit Information Section */}
            <AuditTrailAccordion createBy={initialData?.createBy} createDate={initialData?.createDate} editBy={initialData?.editBy} editDate={initialData?.editDate} datetimeFormat={datetimeFormat} />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelAction}
                disabled={isSubmitting}
              >
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : initialData ? "Save" : "Add"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

