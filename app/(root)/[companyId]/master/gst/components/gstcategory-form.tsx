"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IGstCategory } from "@/interfaces/gst"
import { GstCategorySchemaType, gstCategorySchema } from "@/schemas/gst"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  gstCategoryId: 0,
  gstCategoryCode: "",
  gstCategoryName: "",
  remarks: "",
  isActive: true,
}
interface GstCategoryFormProps {
  initialData?: IGstCategory | null
  submitAction: (data: GstCategorySchemaType) => void
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function GstCategoryForm({
  initialData,
  submitAction,
  onCancelAction: _onCancelAction,
  isSubmitting: _isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: GstCategoryFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<GstCategorySchemaType>({
    resolver: zodResolver(gstCategorySchema),
    defaultValues: initialData
      ? {
          gstCategoryId: initialData.gstCategoryId ?? 0,
          gstCategoryCode: initialData.gstCategoryCode ?? "",
          gstCategoryName: initialData.gstCategoryName ?? "",
          remarks: initialData.remarks ?? "",
          isActive: initialData.isActive ?? true,
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
            gstCategoryId: initialData.gstCategoryId ?? 0,
            gstCategoryCode: initialData.gstCategoryCode ?? "",
            gstCategoryName: initialData.gstCategoryName ?? "",
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("gstCategoryCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: GstCategorySchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="gstCategoryCode"
                label="Gst Category Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="gstCategoryName"
                label="Gst Category Name"
                isRequired
                isDisabled={isReadOnly || _isSubmitting}
              />
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly || _isSubmitting}
            />

            <CustomSwitch
              form={form}
              name="isActive"
              label="Active Status"
              activeColor="success"
              isDisabled={isReadOnly || _isSubmitting}
            />

            {/* Audit Information Section */}
            <AuditTrailAccordion createBy={initialData?.createBy} createDate={initialData?.createDate} editBy={initialData?.editBy} editDate={initialData?.editDate} datetimeFormat={datetimeFormat} />
          </div>
        </form>
      </Form>
    </div>
  )
}
