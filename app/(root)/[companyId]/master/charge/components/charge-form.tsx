"use client"

import { useEffect } from "react"
import { ICharge } from "@/interfaces/charge"
import { ChargeSchemaType, chargeSchema } from "@/schemas/charge"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { useChartOfAccountLookup } from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { UomAutocomplete } from "@/components/autocomplete"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import CustomInput from "@/components/custom/custom-input"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  chargeId: 0,
  chargeName: "",
  chargeCode: "",
  uomId: 0,
  chargeOrder: 0,
  seqNo: 0,
  isTransport: false,
  remarks: "",
  isActive: true,
}
interface ChargeFormProps {
  initialData?: ICharge
  submitAction: (data: ChargeSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
  companyId: string
}

export function ChargeForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
  companyId,
}: ChargeFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals?.[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Get chart of account data to ensure it's loaded before setting form values
  useChartOfAccountLookup(Number(companyId))

  const form = useForm<ChargeSchemaType>({
    resolver: zodResolver(chargeSchema),
    defaultValues: initialData
      ? {
          chargeId: initialData.chargeId ?? 0,
          chargeName: initialData.chargeName ?? "",
          chargeCode: initialData.chargeCode ?? "",
          uomId: initialData.uomId ?? 0,
          seqNo: initialData.seqNo ?? 0,
          remarks: initialData.remarks ?? "",
          isActive: initialData.isActive ?? true,
          isTransport: initialData.isTransport ?? false,
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
            chargeId: initialData.chargeId ?? 0,
            chargeName: initialData.chargeName ?? "",
            chargeCode: initialData.chargeCode ?? "",
            uomId: initialData.uomId ?? 0,
            seqNo: initialData.seqNo ?? 0,
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
            isTransport: initialData.isTransport ?? false,
            isMultiple: initialData.isMultiple ?? false,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("chargeCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: ChargeSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <CustomInput
              form={form}
              name="chargeCode"
              label="Charge Code"
              isRequired
              isDisabled={isReadOnly || Boolean(initialData)}
              onBlurEvent={handleCodeBlur}
            />
            <CustomTextarea
              form={form}
              name="chargeName"
              label="Charge Name"
              isRequired
              isDisabled={isReadOnly}
            />
            <div className="grid grid-cols-2 gap-2">
              <UomAutocomplete
                form={form}
                name="uomId"
                label="UOM"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="seqNo"
                label="Seq No"
                type="number"
                isDisabled={isReadOnly}
              />
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly}
            />

            <CustomCheckbox
              form={form}
              name="isActive"
              label="Active Status"
              isDisabled={isReadOnly}
            />
            <CustomCheckbox
              form={form}
              name="isTransport"
              label="Transport"
              isDisabled={isReadOnly}
            />
            <CustomCheckbox
              form={form}
              name="isMultiple"
              label="Multiply?"
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
            <AuditTrailAccordion
              createBy={initialData?.createBy}
              createDate={initialData?.createDate}
              editBy={initialData?.editBy}
              editDate={initialData?.editDate}
              datetimeFormat={datetimeFormat}
            />
          </div>
        </form>
      </Form>
    </div>
  )
}
