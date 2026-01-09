"use client"

import { useEffect } from "react"
import { IGeoLocation } from "@/interfaces/geolocation"
import { GeoLocationSchemaType, geolocationSchema } from "@/schemas/geolocation"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { PortAutocomplete } from "@/components/autocomplete"
import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"
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

            {/* Audit Information Section */}
            {initialData &&
              (initialData.createBy ||
                initialData.createDate ||
                initialData.editBy ||
                initialData.editDate) && (
                <div className="space-y-2">
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onCancelAction}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : initialData
                    ? "Update GeoLocation"
                    : "Create GeoLocation"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
