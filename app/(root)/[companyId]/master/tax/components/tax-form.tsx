"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { ITax } from "@/interfaces/tax"
import { TaxSchemaType, taxSchema } from "@/schemas/tax"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { TaxCategoryAutocomplete } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  taxId: 0,
  taxCode: "",
  taxName: "",
  taxCategoryId: 0,
  isActive: true,
  remarks: "",
}
interface TaxFormProps {
  initialData?: ITax | null
  submitAction: (data: TaxSchemaType) => void
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function TaxForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: TaxFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  console.log("initialData TaxForm", initialData)

  const form = useForm<TaxSchemaType>({
    resolver: zodResolver(taxSchema),
    defaultValues: initialData
      ? {
          taxId: initialData.taxId ?? 0,
          taxCode: initialData.taxCode ?? "",
          taxName: initialData.taxName ?? "",
          taxCategoryId: initialData.taxCategoryId ?? 0,
          isActive: initialData.isActive ?? true,
          remarks: initialData.remarks ?? "",
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
            taxCode: initialData.taxCode ?? "",
            taxName: initialData.taxName ?? "",
            taxCategoryId: initialData.taxCategoryId ?? 0,
            isActive: initialData.isActive ?? true,
            remarks: initialData.remarks ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("taxCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: TaxSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <TaxCategoryAutocomplete
                form={form}
                name="taxCategoryId"
                label="Tax Category"
                isDisabled={isReadOnly || isSubmitting}
                isRequired={true}
              />

              <CustomInput
                form={form}
                name="taxCode"
                label="Tax Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="taxName"
                label="Tax Name"
                isRequired
                isDisabled={isReadOnly || isSubmitting}
              />
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly || isSubmitting}
            />
            <CustomSwitch
              form={form}
              name="isActive"
              label="Active Status"
              activeColor="success"
              isDisabled={isReadOnly || isSubmitting}
            />
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
