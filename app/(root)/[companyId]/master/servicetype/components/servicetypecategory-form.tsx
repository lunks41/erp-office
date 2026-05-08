"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect, useMemo } from "react"
import { IServiceTypeCategory } from "@/interfaces/servicetype"
import {
  ServiceTypeCategorySchemaType,
  serviceTypeCategorySchema,
} from "@/schemas/servicetype"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface ServiceTypeCategoryFormProps {
  initialData?: IServiceTypeCategory
  submitAction: (data: ServiceTypeCategorySchemaType) => Promise<void>
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function ServiceTypeCategoryForm({
  initialData,
  submitAction,
  onCancelAction: _onCancelAction,
  isSubmitting: _isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: ServiceTypeCategoryFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const defaultValues = useMemo(
    () => ({
      serviceTypeCategoryId: 0,
      serviceTypeCategoryCode: "",
      serviceTypeCategoryName: "",
      isActive: true,
      remarks: "",
    }),
    []
  )

  const form = useForm<ServiceTypeCategorySchemaType>({
    resolver: zodResolver(serviceTypeCategorySchema),
    defaultValues: initialData
      ? {
          serviceTypeCategoryId: initialData.serviceTypeCategoryId ?? 0,
          serviceTypeCategoryCode: initialData.serviceTypeCategoryCode ?? "",
          serviceTypeCategoryName: initialData.serviceTypeCategoryName ?? "",
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
            serviceTypeCategoryId: initialData.serviceTypeCategoryId ?? 0,
            serviceTypeCategoryCode: initialData.serviceTypeCategoryCode ?? "",
            serviceTypeCategoryName: initialData.serviceTypeCategoryName ?? "",
            isActive: initialData.isActive ?? true,
            remarks: initialData.remarks ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form, defaultValues])

  const onSubmit = async (data: ServiceTypeCategorySchemaType) => {
    await submitAction(data)
  }

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("serviceTypeCategoryCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="serviceTypeCategoryCode"
                label="ServiceType Category Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="serviceTypeCategoryName"
                label="ServiceType Category Name"
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
