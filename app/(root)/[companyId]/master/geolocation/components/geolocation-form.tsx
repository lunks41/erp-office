"use client"

import { useEffect } from "react"
import { IGeoLocation } from "@/interfaces/geolocation"
import { GeoLocationSchemaType, geolocationSchema } from "@/schemas/geolocation"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { PortAutocomplete } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  geoLocationId: 0,
  geoLocationCode: "",
  geoLocationName: "",
  portId: 0,
  latitude: "",
  longitude: "",
  remarks: "",
  isActive: true,
}

interface GeoLocationFormProps {
  initialData?: IGeoLocation | null
  submitAction: (data: GeoLocationSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function GeoLocationForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: GeoLocationFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<GeoLocationSchemaType>({
    resolver: zodResolver(geolocationSchema),
    defaultValues: initialData
      ? {
          geoLocationId: initialData.geoLocationId ?? 0,
          geoLocationCode: initialData.geoLocationCode ?? "",
          geoLocationName: initialData.geoLocationName ?? "",
          portId: initialData.portId ?? 0,
          latitude: initialData.latitude ?? "",
          longitude: initialData.longitude ?? "",
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
            geoLocationId: initialData.geoLocationId ?? 0,
            geoLocationCode: initialData.geoLocationCode ?? "",
            geoLocationName: initialData.geoLocationName ?? "",
            portId: initialData.portId ?? 0,
            latitude: initialData.latitude ?? "",
            longitude: initialData.longitude ?? "",
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("geoLocationCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: GeoLocationSchemaType) => {
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
                name="geoLocationCode"
                label="Calling Location Code"
                isRequired
                //isDisabled={isReadOnly || Boolean(initialData)}
                isDisabled={isReadOnly}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="geoLocationName"
                label="Calling Location Name"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>

            <PortAutocomplete
              form={form}
              name="portId"
              label="Port"
              isRequired
              isDisabled={isReadOnly}
            />

            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                form={form}
                name="latitude"
                label="Latitude"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="longitude"
                label="Longitude"
                isDisabled={isReadOnly}
              />
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly}
            />

            <div className="grid grid-cols-2 gap-2">
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
