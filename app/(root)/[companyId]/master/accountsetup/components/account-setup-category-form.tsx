"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect, useMemo } from "react"
import { IAccountSetupCategory } from "@/interfaces/accountsetup"
import {
  AccountSetupCategorySchemaType,
  accountSetupCategorySchema,
} from "@/schemas/accountsetup"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface AccountSetupCategoryFormProps {
  initialData?: IAccountSetupCategory | null
  submitAction: (data: AccountSetupCategorySchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function AccountSetupCategoryForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: AccountSetupCategoryFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const defaultValues = useMemo(
    () => ({
      accSetupCategoryId: 0,
      accSetupCategoryCode: "",
      accSetupCategoryName: "",
      isActive: true,
      remarks: "",
    }),
    []
  )

  const form = useForm<AccountSetupCategorySchemaType>({
    resolver: zodResolver(accountSetupCategorySchema),
    defaultValues: initialData
      ? {
          accSetupCategoryId: initialData.accSetupCategoryId ?? 0,
          accSetupCategoryCode: initialData.accSetupCategoryCode ?? "",
          accSetupCategoryName: initialData.accSetupCategoryName ?? "",
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
            accSetupCategoryId: initialData.accSetupCategoryId ?? 0,
            accSetupCategoryCode: initialData.accSetupCategoryCode ?? "",
            accSetupCategoryName: initialData.accSetupCategoryName ?? "",
            isActive: initialData.isActive ?? true,
            remarks: initialData.remarks ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form, defaultValues])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("accSetupCategoryCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: AccountSetupCategorySchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w mt-4 flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="accSetupCategoryCode"
                label="Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="accSetupCategoryName"
                label="Name"
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
