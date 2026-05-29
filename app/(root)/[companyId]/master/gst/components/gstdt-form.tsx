"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IGstDt } from "@/interfaces/gst"
import { GstDtSchemaType, gstDtSchema } from "@/schemas/gst"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  clientDateFormat,
  formatDateForApi,
  parseDate,
} from "@/lib/date-utils"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { GSTAutocomplete } from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomNumberInput from "@/components/custom/custom-number-input"
import { format } from "date-fns"

const defaultValues = {
  gstId: 0,
  gstPercentage: 0,
  validFrom: new Date(),
}
interface GstDtFormProps {
  initialData?: IGstDt | null
  submitAction: (data: GstDtSchemaType) => void
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
}

export function GstDtForm({
  initialData,
  submitAction,
  onCancelAction: _onCancelAction,
  isSubmitting: _isSubmitting = false,
  isReadOnly = false,
}: GstDtFormProps) {
  const { decimals } = useCompanyStore()
  const priceDec = decimals[0]?.priceDec || 2
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  console.log("initialData GstDtForm", initialData)

  const form = useForm<GstDtSchemaType>({
    resolver: zodResolver(gstDtSchema),
    defaultValues: initialData
      ? {
          gstId: initialData.gstId ?? 0,
          gstPercentage: initialData.gstPercentage ?? 0,
          validFrom: initialData.validFrom
            ? format(
                parseDate(initialData.validFrom as string) || new Date(),
                clientDateFormat
              )
            : clientDateFormat,
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
            gstId: initialData.gstId ?? 0,
            gstPercentage: initialData.gstPercentage ?? 0,
            validFrom: initialData.validFrom
              ? format(
                  parseDate(initialData.validFrom as string) || new Date(),
                  clientDateFormat
                )
              : clientDateFormat,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const onSubmit = (data: GstDtSchemaType) => {
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
              <GSTAutocomplete
                form={form}
                name="gstId"
                label="VAT"
                isRequired={true}
                isDisabled={isReadOnly || _isSubmitting}
              />

              <CustomNumberInput
                form={form}
                name="gstPercentage"
                label="VAT Percentage"
                isRequired
                isDisabled={isReadOnly || _isSubmitting}
                round={priceDec}
              />

              <CustomDateNew
                form={form}
                name="validFrom"
                label="Valid From"
                isDisabled={isReadOnly || _isSubmitting}
                isRequired
              />
            </div>
            {/* Audit Information Section */}
            <AuditTrailAccordion createBy={initialData?.createBy} createDate={initialData?.createDate} editBy={initialData?.editBy} editDate={initialData?.editDate} datetimeFormat={datetimeFormat} />
          </div>
        </form>
      </Form>
    </div>
  )
}

