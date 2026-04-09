"use client"

import { useEffect } from "react"
import { IVoyage } from "@/interfaces/voyage"
import { VoyageSchemaType, voyageSchema } from "@/schemas/voyage"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import {
  BargeAutocomplete,
  VesselAutocomplete,
} from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  voyageId: 0,
  voyageNo: "",
  referenceNo: "",
  vesselId: 0,
  bargeId: 0,
  remarks: "",
  isActive: true,
}
interface VoyageFormProps {
  initialData?: IVoyage | null
  submitAction: (data: VoyageSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function VoyageForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: VoyageFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<VoyageSchemaType>({
    resolver: zodResolver(voyageSchema),
    mode: "onChange",
    defaultValues: initialData
      ? {
          voyageId: initialData.voyageId ?? 0,
          voyageNo: initialData.voyageNo ?? "",
          referenceNo: initialData.referenceNo ?? "",
          vesselId: initialData.vesselId ?? 0,
          bargeId: initialData.bargeId ?? 0,
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
            voyageId: initialData.voyageId ?? 0,
            voyageNo: initialData.voyageNo ?? "",
            referenceNo: initialData.referenceNo ?? "",
            vesselId: initialData.vesselId ?? 0,
            bargeId: initialData.bargeId ?? 0,
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("voyageNo")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: VoyageSchemaType) => {
    console.log("onSubmit :", data)
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
                name="voyageNo"
                label="Voyage No"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="referenceNo"
                label="Reference No"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <VesselAutocomplete
                form={form}
                name="vesselId"
                label="Vessel"
                isDisabled={isReadOnly}
                isRequired
              />
              <BargeAutocomplete
                form={form}
                name="bargeId"
                label="Barge"
                isDisabled={isReadOnly}
                isRequired
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
