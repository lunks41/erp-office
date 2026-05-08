"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IServiceMode } from "@/interfaces/service-mode"
import { ServiceModeSchemaType, serviceModeSchema } from "@/schemas/service-mode"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  serviceModeId: 0,
  serviceModeName: "",
  serviceModeCode: "",
  seqNo: 0,
  remarks: "",
  isActive: true,
}
interface ServiceModeFormProps {
  initialData?: IServiceMode | null
  submitAction: (data: ServiceModeSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function ServiceModeForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: ServiceModeFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<ServiceModeSchemaType>({
    resolver: zodResolver(serviceModeSchema),
    defaultValues: initialData
      ? {
          serviceModeId: initialData.serviceModeId ?? 0,
          serviceModeName: initialData.serviceModeName ?? "",
          serviceModeCode: initialData.serviceModeCode ?? "",
          seqNo: initialData.seqNo ?? 0,
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
            serviceModeId: initialData.serviceModeId ?? 0,
            serviceModeName: initialData.serviceModeName ?? "",
            serviceModeCode: initialData.serviceModeCode ?? "",
            seqNo: initialData.seqNo ?? 0,
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("serviceModeCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: ServiceModeSchemaType) => {
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
                name="serviceModeCode"
                label="Service Mode Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="serviceModeName"
                label="Service Mode Name"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>

            <CustomInput
              form={form}
              name="seqNo"
              label="Service Mode Order"
              type="number"
              isDisabled={isReadOnly}
            />

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly}
            />
            <div className="grid grid-cols-2 gap-2">
              <CustomSwitch
                form={form}
                name="isActive"
                label="Active Status"
                activeColor="success"
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

