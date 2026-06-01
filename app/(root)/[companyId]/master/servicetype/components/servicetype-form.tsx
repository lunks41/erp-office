"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IServiceType } from "@/interfaces/servicetype"
import { ServiceTypeSchemaType, serviceTypeSchema } from "@/schemas/servicetype"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { ServiceTypeCategoryAutocomplete } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  serviceTypeId: 0,
  serviceTypeCode: "",
  serviceTypeName: "",
  serviceTypeCategoryId: 0,
  isActive: true,
  remarks: "",
}
interface ServiceTypeFormProps {
  initialData?: IServiceType
  submitAction: (data: ServiceTypeSchemaType) => Promise<void>
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function ServiceTypeForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: ServiceTypeFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<ServiceTypeSchemaType>({
    resolver: zodResolver(serviceTypeSchema),
    defaultValues: initialData
      ? {
          serviceTypeId: initialData.serviceTypeId ?? 0,
          serviceTypeCode: initialData.serviceTypeCode ?? "",
          serviceTypeName: initialData.serviceTypeName ?? "",
          serviceTypeCategoryId: initialData.serviceTypeCategoryId ?? 0,
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
            serviceTypeId: initialData.serviceTypeId ?? 0,
            serviceTypeCode: initialData.serviceTypeCode ?? "",
            serviceTypeName: initialData.serviceTypeName ?? "",
            serviceTypeCategoryId: initialData.serviceTypeCategoryId ?? 0,
            isActive: initialData.isActive ?? true,
            remarks: initialData.remarks ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const onSubmit = async (data: ServiceTypeSchemaType) => {
    await submitAction(data)
  }

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("serviceTypeCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <ServiceTypeCategoryAutocomplete
                form={form}
                name="serviceTypeCategoryId"
                label="ServiceType Category"
                isDisabled={isReadOnly || Boolean(initialData)}
                isRequired={true}
              />

              <CustomInput
                form={form}
                name="serviceTypeCode"
                label="ServiceType Code"
                isRequired={true}
                isDisabled={isReadOnly}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="serviceTypeName"
                label="ServiceType Name"
                isRequired={true}
                isDisabled={isReadOnly}
              />

              <CustomSwitch
                form={form}
                name="isActive"
                label="Active Status"
                activeColor="success"
                isDisabled={isReadOnly}
              />
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly}
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
