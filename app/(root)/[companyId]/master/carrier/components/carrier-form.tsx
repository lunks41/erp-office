"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { ICarrier } from "@/interfaces/carrier"
import { CarrierSchemaType, carrierSchema } from "@/schemas/carrier"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  carrierId: 0,
  carrierName: "",
  carrierCode: "",
  seqNo: 0,
  remarks: "",
  isActive: true,
}
interface CarrierFormProps {
  initialData?: ICarrier | null
  submitAction: (data: CarrierSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function CarrierForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: CarrierFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<CarrierSchemaType>({
    resolver: zodResolver(carrierSchema),
    defaultValues: initialData
      ? {
          carrierId: initialData.carrierId ?? 0,
          carrierName: initialData.carrierName ?? "",
          carrierCode: initialData.carrierCode ?? "",
          seqNo: initialData.seqNo ?? 0,
          remarks: initialData.remarks ?? "",
          isActive: initialData.isActive ?? true,
        }
      : {
          ...defaultValues,
        },
  })

  useEffect(() => {
    form.reset(
      initialData
        ? {
            carrierId: initialData.carrierId ?? 0,
            carrierName: initialData.carrierName ?? "",
            carrierCode: initialData.carrierCode ?? "",
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
    const code = form.getValues("carrierCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: CarrierSchemaType) => {
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
                name="carrierCode"
                label="Carrier Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="carrierName"
                label="Carrier Name"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>

            <CustomInput
              form={form}
              name="seqNo"
              label="Carrier Order"
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

