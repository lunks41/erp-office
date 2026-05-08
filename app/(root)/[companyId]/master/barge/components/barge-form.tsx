"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IBarge } from "@/interfaces/barge"
import { BargeSchemaType, bargeSchema } from "@/schemas/barge"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  bargeId: 0,
  bargeName: "",
  bargeCode: "",
  callSign: "",
  imoCode: "",
  grt: "",
  licenseNo: "",
  bargeType: "",
  flag: "",
  remarks: "",
  isActive: true,
  isOwn: true,
}
interface BargeFormProps {
  initialData?: IBarge | null
  submitAction: (data: BargeSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function BargeForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: BargeFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<BargeSchemaType>({
    resolver: zodResolver(bargeSchema),
    defaultValues: initialData
      ? {
          bargeId: initialData.bargeId ?? 0,
          bargeName: initialData.bargeName ?? "",
          bargeCode: initialData.bargeCode ?? "",
          callSign: initialData.callSign ?? "",
          imoCode: initialData.imoCode ?? "",
          grt: initialData.grt ?? "",
          licenseNo: initialData.licenseNo ?? "",
          bargeType: initialData.bargeType ?? "",
          flag: initialData.flag ?? "",
          remarks: initialData.remarks ?? "",
          isActive: initialData.isActive ?? true,
          isOwn: initialData.isOwn ?? true,
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
            bargeId: initialData.bargeId ?? 0,
            bargeName: initialData.bargeName ?? "",
            bargeCode: initialData.bargeCode ?? "",
            callSign: initialData.callSign ?? "",
            imoCode: initialData.imoCode ?? "",
            grt: initialData.grt ?? "",
            licenseNo: initialData.licenseNo ?? "",
            bargeType: initialData.bargeType ?? "",
            flag: initialData.flag ?? "",
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
            isOwn: initialData.isOwn ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("bargeCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: BargeSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                form={form}
                name="bargeCode"
                label="Barge Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="bargeName"
                label="Barge Name"
                isRequired
                isDisabled={isReadOnly}
              />

              <CustomInput
                form={form}
                name="callSign"
                label="Call Sign"
                isDisabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                form={form}
                name="imoCode"
                label="IMO Code"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="grt"
                label="GRT"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="licenseNo"
                label="License Number"
                isDisabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                form={form}
                name="bargeType"
                label="Barge Type"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="flag"
                label="Flag"
                isDisabled={isReadOnly}
              />
            </div>

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
              <CustomSwitch
                form={form}
                name="isOwn"
                label="Own Status"
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
