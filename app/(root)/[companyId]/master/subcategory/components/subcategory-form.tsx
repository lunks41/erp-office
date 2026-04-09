"use client"

import { useEffect } from "react"
import { ISubCategory } from "@/interfaces"
import { SubCategorySchemaType, subcategorySchema } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

// Default values for the category group form
const defaultValues: SubCategorySchemaType = {
  subCategoryId: 0,
  subCategoryName: "",
  subCategoryCode: "",
  remarks: "",
  isActive: true,
}
interface SubCategoryFormProps {
  initialData?: ISubCategory
  submitAction: (data: SubCategorySchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function SubCategoryForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: SubCategoryFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<SubCategorySchemaType>({
    resolver: zodResolver(subcategorySchema),
    mode: "onBlur", // Validate on blur for better UX
    defaultValues: initialData
      ? {
          subCategoryId: initialData.subCategoryId ?? 0,
          subCategoryCode: initialData.subCategoryCode ?? "",
          subCategoryName: initialData.subCategoryName ?? "",
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
            subCategoryId: initialData.subCategoryId ?? 0,
            subCategoryCode: initialData.subCategoryCode ?? "",
            subCategoryName: initialData.subCategoryName ?? "",
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("subCategoryCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (values: SubCategorySchemaType) => {
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
                name="subCategoryCode"
                label="SubCategory Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="subCategoryName"
                label="SubCategory Name"
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
