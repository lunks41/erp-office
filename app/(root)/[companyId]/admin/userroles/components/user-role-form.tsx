"use client"

import { useEffect } from "react"
import { IUserRole } from "@/interfaces/admin"
import { UserRoleSchemaType, userRoleSchema } from "@/schemas/admin"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  userRoleId: 0,
  userRoleCode: "",
  userRoleName: "",
  remarks: "",
  isActive: true,
}

interface UserRoleFormProps {
  initialData?: IUserRole
  submitAction: (data: UserRoleSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onSaveConfirmation?: (data: UserRoleSchemaType) => void
  onCodeBlur?: (code: string) => void
}

export function UserRoleForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onSaveConfirmation,
  onCodeBlur,
}: UserRoleFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const form = useForm<UserRoleSchemaType>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: initialData
      ? {
          userRoleId: initialData.userRoleId ?? 0,
          userRoleCode: initialData.userRoleCode ?? "",
          userRoleName: initialData.userRoleName ?? "",
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
            userRoleId: initialData.userRoleId ?? 0,
            userRoleCode: initialData.userRoleCode ?? "",
            userRoleName: initialData.userRoleName ?? "",
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
          }
        : { ...defaultValues }
    )
  }, [initialData, form])

  const onSubmit = (data: UserRoleSchemaType) => {
    if (onSaveConfirmation) {
      onSaveConfirmation(data)
    } else {
      submitAction(data)
    }
  }

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("userRoleCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
          <fieldset className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <CustomInput
                  form={form}
                  name="userRoleCode"
                  label="Role Code"
                  isRequired
                  isDisabled={isReadOnly || Boolean(initialData)}
                  onBlurEvent={handleCodeBlur}
                />
              </div>
              <div>
                <CustomInput
                  form={form}
                  name="userRoleName"
                  label="Role Name"
                  isRequired
                  isDisabled={isReadOnly}
                />
              </div>
            </div>

            <div>
              <CustomTextarea
                form={form}
                name="remarks"
                label="Remarks"
                isDisabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div>
                <CustomSwitch
                  form={form}
                  name="isActive"
                  label="Active Status"
                  activeColor="success"
                  isDisabled={isReadOnly}
                />
              </div>
            </div>

            {/* Audit Information Section */}
            {initialData &&
              (initialData.createBy ||
                initialData.createDate ||
                initialData.editBy ||
                initialData.editDate) && (
                <AuditTrailAccordion
                  createBy={initialData?.createBy}
                  createDate={initialData?.createDate}
                  editBy={initialData?.editBy}
                  editDate={initialData?.editDate}
                  datetimeFormat={datetimeFormat}
                />
              )}
          </fieldset>
          {/* Action Buttons Section */}
          <div className="border-border border-t pt-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-3 sm:flex-row">
                {/* Additional action buttons can be added here if needed */}
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  type="button"
                  onClick={onCancelAction}
                  className="w-full sm:w-auto"
                >
                  {isReadOnly ? "Close" : "Cancel"}
                </Button>
                {!isReadOnly && (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {initialData ? "Edit" : "Add"}
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
