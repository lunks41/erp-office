"use client"

import { useEffect } from "react"
import { IPort } from "@/interfaces/port"
import { PortSchemaType, portSchema } from "@/schemas/port"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { PortRegionAutocomplete } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  portId: 0,
  portName: "",
  portCode: "",
  portShortName: "",
  portRegionId: 0,
  remarks: "",
  isActive: true,
}
interface PortFormProps {
  initialData?: IPort | null
  submitAction: (data: PortSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function PortForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: PortFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<PortSchemaType>({
    resolver: zodResolver(portSchema),
    defaultValues: initialData
      ? {
          portId: initialData.portId ?? 0,
          portName: initialData.portName ?? "",
          portCode: initialData.portCode ?? "",
          portShortName: initialData.portShortName ?? "",
          portRegionId: initialData.portRegionId ?? 0,
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
            portId: initialData.portId ?? 0,
            portName: initialData.portName ?? "",
            portCode: initialData.portCode ?? "",
            portShortName: initialData.portShortName ?? "",
            portRegionId: initialData.portRegionId ?? 0,
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("portCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: PortSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <PortRegionAutocomplete
              form={form}
              name="portRegionId"
              label="Port Region"
              isDisabled={isReadOnly}
              isRequired
            />
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="portCode"
                label="Port Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="portName"
                label="Port Name"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>
            <CustomInput
              form={form}
              name="portShortName"
              label="Port Short Name"
              isDisabled={isReadOnly}
            />
            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly}
            />
            <CustomSwitch
              form={form}
              name="isActive"
              label="Active Status"
              activeColor="success"
              isDisabled={isReadOnly}
            />

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
