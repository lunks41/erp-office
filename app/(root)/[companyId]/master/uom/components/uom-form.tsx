"use client"

import { useEffect } from "react"
import { IUom } from "@/interfaces/uom"
import { UomSchemaType, uomSchema } from "@/schemas/uom"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  uomId: 0,
  uomCode: "",
  uomName: "",
  remarks: "",
  isActive: true,
}
interface UomFormProps {
  initialData?: IUom | null
  submitAction: (data: z.infer<typeof uomSchema>) => void
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function UomForm({
  initialData,
  submitAction,
  _onCancelAction,
  _isSubmitting,
  isReadOnly = false,
  onCodeBlur,
}: UomFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<z.infer<typeof uomSchema>>({
    resolver: zodResolver(uomSchema),
    defaultValues: initialData
      ? {
          uomId: initialData.uomId ?? 0,
          uomCode: initialData.uomCode ?? "",
          uomName: initialData.uomName ?? "",
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
            uomId: initialData.uomId ?? 0,
            uomCode: initialData.uomCode ?? "",
            uomName: initialData.uomName ?? "",
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("uomCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: UomSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CustomInput
                form={form}
                name="uomCode"
                label="UOM Code"
                placeholder="Enter UOM Code"
                isRequired={true}
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="uomName"
                label="UOM Name"
                placeholder="Enter UOM Name"
                isRequired={true}
                isDisabled={isReadOnly}
              />
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Description"
              isDisabled={isReadOnly}
            />

            <CustomSwitch
              form={form}
              name="isActive"
              label="Active Status"
              activeColor="success"
              isDisabled={isReadOnly}
            />

            {/* Audit Information Section */}
            <AuditTrailAccordion createBy={initialData?.createBy} createDate={initialData?.createDate} editBy={initialData?.editBy} editDate={initialData?.editDate} datetimeFormat={datetimeFormat} />
          </div>
        </form>
      </Form>
    </div>
  )
}
