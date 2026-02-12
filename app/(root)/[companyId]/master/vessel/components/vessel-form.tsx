"use client"

import { useEffect } from "react"
import { IVessel } from "@/interfaces/vessel"
import { VesselSchemaType, vesselSchema } from "@/schemas/vessel"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { VesselTypeAutocomplete } from "@/components/autocomplete"
import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  vesselId: 0,
  vesselName: "",
  vesselCode: "",
  callSign: "",
  imoCode: "",
  grt: "",
  licenseNo: "",
  flag: "",
  nrt: "",
  loa: "",
  dwt: "",
  remarks: "",
  isActive: true,
  vesselTypeId: 0,
}
interface VesselFormProps {
  initialData?: IVessel | null
  submitAction: (data: VesselSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function VesselForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: VesselFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<VesselSchemaType>({
    resolver: zodResolver(vesselSchema),
    defaultValues: initialData
      ? {
          vesselId: initialData.vesselId ?? 0,
          vesselName: initialData.vesselName ?? "",
          vesselCode: initialData.vesselCode ?? "",
          callSign: initialData.callSign ?? "",
          imoCode: initialData.imoCode ?? "",
          grt: initialData.grt ?? "",
          licenseNo: initialData.licenseNo ?? "",
          flag: initialData.flag ?? "",
          nrt: initialData.nrt ?? "",
          loa: initialData.loa ?? "",
          dwt: initialData.dwt ?? "",
          remarks: initialData.remarks ?? "",
          isActive: initialData.isActive ?? true,
          vesselTypeId: initialData.vesselTypeId ?? 0,
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
            vesselId: initialData.vesselId ?? 0,
            vesselName: initialData.vesselName ?? "",
            vesselCode: initialData.vesselCode ?? "",
            callSign: initialData.callSign ?? "",
            imoCode: initialData.imoCode ?? "",
            grt: initialData.grt ?? "",
            licenseNo: initialData.licenseNo ?? "",
            flag: initialData.flag ?? "",
            nrt: initialData.nrt ?? "",
            loa: initialData.loa ?? "",
            dwt: initialData.dwt ?? "",
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
            vesselTypeId: initialData.vesselTypeId ?? 0,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("vesselCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: VesselSchemaType) => {
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
                name="vesselCode"
                label="Vessel Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="vesselName"
                label="Vessel Name"
                isRequired
                isDisabled={isReadOnly}
              />

              <CustomInput
                form={form}
                name="callSign"
                label="Call Sign"
                isRequired
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="imoCode"
                label="IMO Code"
                isRequired
                isDisabled={isReadOnly}
              />

              <CustomInput
                form={form}
                name="grt"
                label="GRT"
                isDisabled={isReadOnly}
                isRequired
              />
              <VesselTypeAutocomplete
                form={form}
                name="vesselTypeId"
                label="Vessel Type"
                isDisabled={isReadOnly}
                isRequired
              />

              <CustomInput
                form={form}
                name="licenseNo"
                label="License No"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="flag"
                label="Flag"
                isDisabled={isReadOnly}
              />

              <CustomInput
                form={form}
                name="nrt"
                label="NRT"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="loa"
                label="LOA"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="dwt"
                label="DWT"
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
                    ? "Update Vessel"
                    : "Create Vessel"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
