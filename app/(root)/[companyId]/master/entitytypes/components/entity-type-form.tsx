"use client"

import { useEffect } from "react"
import { IEntityType } from "@/interfaces/entitytype"
import { EntityTypeSchemaType, entityTypeSchema } from "@/schemas/entitytype"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"

const defaultValues = {
  entityTypeId: 0,
  entityTypeCode: "",
  entityTypeName: "",
}
interface EntityTypeFormProps {
  initialData?: IEntityType
  submitAction: (data: EntityTypeSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function EntityTypeForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: EntityTypeFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<EntityTypeSchemaType>({
    resolver: zodResolver(entityTypeSchema),
    defaultValues: initialData
      ? {
          entityTypeId: initialData.entityTypeId ?? 0,
          entityTypeCode: initialData.entityTypeCode ?? "",
          entityTypeName: initialData.entityTypeName ?? "",
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
            entityTypeId: initialData.entityTypeId ?? 0,
            entityTypeCode: initialData.entityTypeCode ?? "",
            entityTypeName: initialData.entityTypeName ?? "",
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("entityTypeCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: EntityTypeSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="entityTypeCode"
                label="Entity Type Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="entityTypeName"
                label="Entity Type Name"
                isRequired
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
