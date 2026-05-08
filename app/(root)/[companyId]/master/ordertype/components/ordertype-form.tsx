"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IOrderType } from "@/interfaces/ordertype"
import { OrderTypeSchemaType, orderTypeSchema } from "@/schemas/ordertype"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { OrderTypeCategoryAutocomplete } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  orderTypeId: 0,
  orderTypeCode: "",
  orderTypeName: "",
  orderTypeCategoryId: 0,
  isActive: true,
  remarks: "",
}
interface OrderTypeFormProps {
  initialData?: IOrderType
  submitAction: (data: OrderTypeSchemaType) => void
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function OrderTypeForm({
  initialData,
  submitAction,
  onCancelAction: _onCancelAction,
  isSubmitting: _isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: OrderTypeFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<OrderTypeSchemaType>({
    resolver: zodResolver(orderTypeSchema),
    defaultValues: initialData
      ? {
          orderTypeId: initialData.orderTypeId ?? 0,
          orderTypeCode: initialData.orderTypeCode ?? "",
          orderTypeName: initialData.orderTypeName ?? "",
          orderTypeCategoryId: initialData.orderTypeCategoryId ?? 0,
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
            orderTypeId: initialData.orderTypeId ?? 0,
            orderTypeCode: initialData.orderTypeCode ?? "",
            orderTypeName: initialData.orderTypeName ?? "",
            orderTypeCategoryId: initialData.orderTypeCategoryId ?? 0,
            isActive: initialData.isActive ?? true,
            remarks: initialData.remarks ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const onSubmit = (data: OrderTypeSchemaType) => {
    submitAction(data)
  }

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("orderTypeCode")
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
              <OrderTypeCategoryAutocomplete
                form={form}
                name="orderTypeCategoryId"
                label="OrderType Category"
                isDisabled={isReadOnly || _isSubmitting}
                isRequired={true}
              />

              <CustomInput
                form={form}
                name="orderTypeCode"
                label="OrderType Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="orderTypeName"
                label="OrderType Name"
                isRequired
                isDisabled={isReadOnly || _isSubmitting}
              />

              <CustomSwitch
                form={form}
                name="isActive"
                label="Active Status"
                activeColor="success"
                isDisabled={isReadOnly || _isSubmitting}
              />
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
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
