"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IGst } from "@/interfaces/gst"
import { GstSchemaType, gstSchema } from "@/schemas/gst"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { GstCategoryAutocomplete } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  gstId: 0,
  gstCode: "",
  gstName: "",
  gstCategoryId: 0,
  isActive: true,
  remarks: "",
}
interface GstFormProps {
  initialData?: IGst | null
  submitAction: (data: GstSchemaType) => void
  onCancelAction: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function GstForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: GstFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<GstSchemaType>({
    resolver: zodResolver(gstSchema),
    defaultValues: initialData
      ? {
          gstId: initialData.gstId ?? 0,
          gstCode: initialData.gstCode ?? "",
          gstName: initialData.gstName ?? "",
          gstCategoryId: initialData.gstCategoryId ?? 0,
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
            gstId: initialData.gstId ?? 0,
            gstCode: initialData.gstCode ?? "",
            gstName: initialData.gstName ?? "",
            gstCategoryId: initialData.gstCategoryId ?? 0,
            isActive: initialData.isActive ?? true,
            remarks: initialData.remarks ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("gstCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: GstSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <GstCategoryAutocomplete
                form={form}
                name="gstCategoryId"
                label="VAT Category"
                isDisabled={isReadOnly || isSubmitting}
                isRequired={true}
              />

              <CustomInput
                form={form}
                name="gstCode"
                label="VAT Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="gstName"
                label="VAT Name"
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
