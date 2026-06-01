"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IOrderTypeCategory } from "@/interfaces/ordertype"
import {
  OrderTypeCategorySchemaType,
  orderTypeCategorySchema,
} from "@/schemas/ordertype"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  orderTypeCategoryId: 0,
  orderTypeCategoryCode: "",
  orderTypeCategoryName: "",
  isActive: true,
  remarks: "",
}
interface OrderTypeCategoryFormProps {
  initialData?: IOrderTypeCategory
  submitAction: (data: OrderTypeCategorySchemaType) => void
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function OrderTypeCategoryForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: OrderTypeCategoryFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<OrderTypeCategorySchemaType>({
    resolver: zodResolver(orderTypeCategorySchema),
    defaultValues: initialData
      ? {
          orderTypeCategoryId: initialData.orderTypeCategoryId ?? 0,
          orderTypeCategoryCode: initialData.orderTypeCategoryCode ?? "",
          orderTypeCategoryName: initialData.orderTypeCategoryName ?? "",
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
            orderTypeCategoryId: initialData.orderTypeCategoryId ?? 0,
            orderTypeCategoryCode: initialData.orderTypeCategoryCode ?? "",
            orderTypeCategoryName: initialData.orderTypeCategoryName ?? "",
            isActive: initialData.isActive ?? true,
            remarks: initialData.remarks ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const onSubmit = (data: OrderTypeCategorySchemaType) => {
    submitAction(data)
  }

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("orderTypeCategoryCode")
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
                name="orderTypeCategoryCode"
                label="OrderType Category Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="orderTypeCategoryName"
                label="OrderType Category Name"
                isRequired
                isDisabled={isReadOnly || isSubmitting}
              />
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly || isSubmitting}
            />

            <CustomSwitch
              form={form}
              name="isActive"
              label="Active Status"
              activeColor="success"
              isDisabled={isReadOnly || isSubmitting}
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
