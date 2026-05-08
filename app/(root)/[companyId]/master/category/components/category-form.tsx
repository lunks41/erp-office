"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { ICategory } from "@/interfaces"
import { CategorySchemaType, categorySchema } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

// Default values for the category group form
const defaultValues: CategorySchemaType = {
  categoryId: 0,
  categoryName: "",
  categoryCode: "",
  remarks: "",
  isActive: true,
}
interface CategoryFormProps {
  initialData?: ICategory
  submitAction: (data: CategorySchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function CategoryForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: CategoryFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<CategorySchemaType>({
    resolver: zodResolver(categorySchema),
    mode: "onBlur", // Validate on blur for better UX
    defaultValues: initialData
      ? {
          categoryId: initialData.categoryId ?? 0,
          categoryCode: initialData.categoryCode ?? "",
          categoryName: initialData.categoryName ?? "",
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
            categoryId: initialData.categoryId ?? 0,
            categoryCode: initialData.categoryCode ?? "",
            categoryName: initialData.categoryName ?? "",
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("categoryCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (values: CategorySchemaType) => {
    console.log("Form submitted successfully:", values)
    submitAction(values)
  }

  const onError = (errors: Record<string, unknown>) => {
    console.log("Form validation errors:", errors)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className="space-y-2"
        >
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="categoryCode"
                label="Category Group Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="categoryName"
                label="Category Group Name"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>
            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly}
            />

            <div className="grid grid-cols-1 gap-2">
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
