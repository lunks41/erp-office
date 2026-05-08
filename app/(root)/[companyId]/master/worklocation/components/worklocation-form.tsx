"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IWorkLocation } from "@/interfaces"
import { WorkLocationSchemaType, workLocationSchema } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { CountryAutocomplete } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"

const defaultValues = {
  workLocationId: 0,
  workLocationName: "",
  workLocationCode: "",
  address1: "",
  address2: "",
  city: "",
  postalCode: "",
  countryId: 0,
  isActive: true,
}
interface WorkLocationFormProps {
  initialData?: IWorkLocation | null
  submitAction: (data: WorkLocationSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function WorkLocationForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: WorkLocationFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<WorkLocationSchemaType>({
    resolver: zodResolver(workLocationSchema),
    defaultValues: initialData
      ? {
          workLocationId: initialData.workLocationId ?? 0,
          workLocationName: initialData.workLocationName ?? "",
          workLocationCode: initialData.workLocationCode ?? "",
          address1: initialData.address1 ?? "",
          address2: initialData.address2 ?? "",
          city: initialData.city ?? "",
          postalCode: initialData.postalCode ?? "",
          countryId: initialData.countryId ?? 0,
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
            workLocationId: initialData.workLocationId ?? 0,
            workLocationName: initialData.workLocationName ?? "",
            workLocationCode: initialData.workLocationCode ?? "",
            address1: initialData.address1 ?? "",
            address2: initialData.address2 ?? "",
            city: initialData.city ?? "",
            postalCode: initialData.postalCode ?? "",
            countryId: initialData.countryId ?? 0,
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("workLocationCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: WorkLocationSchemaType) => {
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
                name="workLocationCode"
                label="Work Location Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="workLocationName"
                label="Work Location Name"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="address1"
                label="Address 1"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="address2"
                label="Address 2"
                isDisabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="city"
                label="City"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="postalCode"
                label="Postal Code"
                isDisabled={isReadOnly}
              />
            </div>
            <CountryAutocomplete
              form={form}
              name="countryId"
              label="Country"
              isRequired
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
