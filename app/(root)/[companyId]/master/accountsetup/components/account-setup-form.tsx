"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect, useMemo } from "react"
import { IAccountSetup } from "@/interfaces/accountsetup"
import {
  AccountSetupSchemaType,
  accountSetupSchema,
} from "@/schemas/accountsetup"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { AccountSetupCategoryAutocomplete } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface AccountSetupFormProps {
  initialData?: IAccountSetup | null
  submitAction: (data: AccountSetupSchemaType) => void
  onCancelAction: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function AccountSetupForm({
  initialData,
  submitAction,
  onCancelAction: _onCancelAction,
  isSubmitting: _isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: AccountSetupFormProps) {
  console.log("initialData AccountSetupForm", initialData)
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const defaultValues = useMemo(
    () => ({
      accSetupId: 0,
      accSetupCode: "",
      accSetupName: "",
      accSetupCategoryId: 0,
      isActive: true,
      remarks: "",
    }),
    []
  )

  const form = useForm<AccountSetupSchemaType>({
    resolver: zodResolver(accountSetupSchema),
    defaultValues: initialData
      ? {
          accSetupId: initialData.accSetupId ?? 0,
          accSetupCode: initialData.accSetupCode ?? "",
          accSetupName: initialData.accSetupName ?? "",
          accSetupCategoryId: initialData.accSetupCategoryId ?? 0,
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
            accSetupId: initialData.accSetupId ?? 0,
            accSetupCode: initialData.accSetupCode ?? "",
            accSetupName: initialData.accSetupName ?? "",
            accSetupCategoryId: initialData.accSetupCategoryId ?? 0,
            isActive: initialData.isActive ?? true,
            remarks: initialData.remarks ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form, defaultValues])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("accSetupCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: AccountSetupSchemaType) => {
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
                name="accSetupCode"
                label="Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />

              <CustomInput
                form={form}
                name="accSetupName"
                label="Name"
                isRequired
                isDisabled={isReadOnly}
              />

              <AccountSetupCategoryAutocomplete
                form={form}
                name="accSetupCategoryId"
                label="Category"
                isRequired={true}
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

            {/* Audit Information Section */}
            <AuditTrailAccordion createBy={initialData?.createBy} createDate={initialData?.createDate} editBy={initialData?.editBy} editDate={initialData?.editDate} datetimeFormat={datetimeFormat} />
          </div>
        </form>
      </Form>
    </div>
  )
}
