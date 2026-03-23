"use client"

import { useEffect, useState } from "react"
import { IUser } from "@/interfaces/admin"
import { UserSchemaType, userSchema } from "@/schemas/admin"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Key } from "lucide-react"
import { useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import {
  EmployeeAutocomplete,
  UserGroupAutocomplete,
  UserRoleAutocomplete,
} from "@/components/autocomplete"
import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

import { ResetPassword } from "./reset-password"

const defaultValues = {
  userId: 0,
  userCode: "",
  userName: "",
  userEmail: "",
  userGroupId: 0,
  userRoleId: 0,
  employeeId: 0,
  isActive: true,
  isLocked: false,
  remarks: "",
}
interface UserFormProps {
  initialData?: IUser
  submitAction: (data: UserSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onSaveConfirmation?: (data: UserSchemaType) => void
  onCodeBlur?: (code: string) => void
}

export function UserForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onSaveConfirmation,
  onCodeBlur,
}: UserFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)

  const form = useForm<UserSchemaType>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData
      ? {
          userId: initialData.userId ?? 0,
          userCode: initialData.userCode ?? "",
          userName: initialData.userName ?? "",
          userEmail: initialData.userEmail ?? "",
          userGroupId: initialData.userGroupId ?? 0,
          userRoleId: initialData.userRoleId ?? 0,
          employeeId: initialData.employeeId ?? 0,
          isActive: initialData.isActive ?? true,
          isLocked: initialData.isLocked ?? false,
          remarks: initialData.remarks ?? "",
        }
      : {
          ...defaultValues,
        },
  })

  useEffect(() => {
    form.reset(
      initialData
        ? {
            userId: initialData.userId ?? 0,
            userCode: initialData.userCode ?? "",
            userName: initialData.userName ?? "",
            userEmail: initialData.userEmail ?? "",
            userGroupId: initialData.userGroupId ?? 0,
            userRoleId: initialData.userRoleId ?? 0,
            employeeId: initialData.employeeId ?? 0,
            isActive: initialData.isActive ?? true,
            isLocked: initialData.isLocked ?? false,
            remarks: initialData.remarks ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const onSubmit = (data: UserSchemaType) => {
    if (onSaveConfirmation) {
      onSaveConfirmation(data)
    } else {
      submitAction(data)
    }
  }

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("userCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const handleCancelReset = () => setIsResetPasswordOpen(false)
  const handleResetSuccess = () => setIsResetPasswordOpen(false)

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
          <fieldset className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <CustomInput
                  form={form}
                  name="userCode"
                  label="User Code"
                  isRequired
                  isDisabled={isReadOnly || Boolean(initialData)}
                  onBlurEvent={handleCodeBlur}
                />
              </div>
              <div>
                <CustomInput
                  form={form}
                  name="userName"
                  label="Username"
                  isRequired
                  isDisabled={isReadOnly}
                />
              </div>
              <div>
                <CustomInput
                  form={form}
                  name="userEmail"
                  label="Email"
                  type="email"
                  isRequired
                  isDisabled={isReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <UserGroupAutocomplete
                  form={form}
                  name="userGroupId"
                  label="Group"
                  isRequired={true}
                />
              </div>
              <div>
                <UserRoleAutocomplete
                  form={form}
                  name="userRoleId"
                  label="Role"
                  isRequired={true}
                />
              </div>
              <div>
                <EmployeeAutocomplete
                  form={form}
                  name="employeeId"
                  label="Employee"
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <CustomSwitch
                  form={form}
                  name="isActive"
                  label="Active Status"
                  activeColor="success"
                  isDisabled={isReadOnly}
                />
              </div>
              <div>
                <CustomSwitch
                  form={form}
                  name="isLocked"
                  label="Lock Status"
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
                <div className="space-y-6">
                  <div className="border-border border-b pb-4"></div>

                  <CustomAccordion
                    type="single"
                    collapsible
                    className="border-border bg-muted/50 rounded-lg border"
                  >
                    <CustomAccordionItem
                      value="audit-info"
                      className="border-none"
                    >
                      <CustomAccordionTrigger className="hover:bg-muted rounded-lg px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">View Audit Trail</span>
                          <Badge variant="secondary" className="text-xs">
                            {initialData.createDate ? "Created" : ""}
                            {initialData.editDate ? " • Modified" : ""}
                          </Badge>
                        </div>
                      </CustomAccordionTrigger>
                      <CustomAccordionContent className="px-6 pb-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          {initialData.createDate && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-foreground text-sm font-medium">
                                  Created By
                                </span>
                                <Badge
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {initialData.createBy}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {format(
                                  new Date(initialData.createDate),
                                  datetimeFormat
                                )}
                              </div>
                            </div>
                          )}
                          {initialData.editBy && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-foreground text-sm font-medium">
                                  Last Modified By
                                </span>
                                <Badge
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {initialData.editBy}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {initialData.editDate
                                  ? format(
                                      new Date(initialData.editDate),
                                      datetimeFormat
                                    )
                                  : "-"}
                              </div>
                            </div>
                          )}
                        </div>
                      </CustomAccordionContent>
                    </CustomAccordionItem>
                  </CustomAccordion>
                </div>
              )}
          </fieldset>
          {/* Action Buttons Section */}
          <div className="border-border border-t pt-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-3 sm:flex-row">
                {initialData && !isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsResetPasswordOpen(true)}
                    className="flex items-center gap-2 border-orange-200 text-orange-700 hover:border-orange-300 hover:bg-orange-50"
                  >
                    <Key className="h-4 w-4" />
                    Reset Password
                  </Button>
                )}
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
                        {initialData ? "Updating..." : "Creating..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {initialData ? "Update User" : "Create User"}
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Reset Password Dialog */}
      <Dialog
        open={isResetPasswordOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsResetPasswordOpen(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for user: {initialData?.userName}
            </DialogDescription>
          </DialogHeader>
          {initialData && (
            <ResetPassword
              userId={initialData.userId}
              userCode={initialData.userCode}
              onCancelAction={handleCancelReset}
              onSuccessAction={handleResetSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
