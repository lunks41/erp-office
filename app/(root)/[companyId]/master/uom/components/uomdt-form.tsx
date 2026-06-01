"use client"

import { useEffect } from "react"
import { IUomDt } from "@/interfaces/uom"
import { UomDtSchemaType, uomDtSchema } from "@/schemas/uom"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { UomAutocomplete } from "@/components/autocomplete"
import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"
import CustomNumberInput from "@/components/custom/custom-number-input"

const defaultValues = {
  uomId: 0,
  packUomId: 0,
  uomFactor: 1,
}
interface UomDtFormProps {
  initialData?: IUomDt
  submitAction: (data: UomDtSchemaType) => void
  onCancelAction: () => void
  isSubmitting: boolean
  isReadOnly?: boolean
}

export function UomDtForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
}: UomDtFormProps) {
  console.log("initialData", initialData)
  const { decimals } = useCompanyStore()
  const qtyDec = decimals[0]?.qtyDec || 2
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<UomDtSchemaType>({
    resolver: zodResolver(uomDtSchema),
    defaultValues: initialData
      ? {
          uomId: initialData.uomId ?? 0,
          packUomId: initialData.packUomId ?? 0,
          uomFactor: initialData.uomFactor ?? 1,
        }
      : {
          ...defaultValues,
        },
  })

  useEffect(() => {
    form.reset(
      initialData
        ? {
            uomId: initialData.uomId ?? 0,
            packUomId: initialData.packUomId ?? 0,
            uomFactor: initialData.uomFactor ?? 1,
          }
        : {
            ...defaultValues,
          }
    )
  }, [form, initialData])

  const onSubmit = (data: UomDtSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <UomAutocomplete
              form={form}
              name="uomId"
              label="UOM"
              isRequired={true}
              isDisabled={isReadOnly || isSubmitting}
            />

            <UomAutocomplete
              form={form}
              name="packUomId"
              label="Pack UOM"
              isRequired={true}
            />

            <CustomNumberInput
              form={form}
              name="uomFactor"
              label="UOM Factor"
              isRequired
              isDisabled={isReadOnly}
              round={qtyDec}
              className="text-right"
            />
          </div>
          {initialData &&
            (initialData.createBy ||
              initialData.createDate ||
              initialData.editBy ||
              initialData.editDate) && (
              <CustomAccordion
                type="single"
                collapsible
                className="rounded-md border"
              >
                <CustomAccordionItem value="audit-info">
                  <CustomAccordionTrigger className="px-4">
                    Audit Information
                  </CustomAccordionTrigger>
                  <CustomAccordionContent className="px-2">
                    <div className="grid grid-cols-2 gap-4">
                      {initialData.createDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Created By
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-normal">
                              {initialData.createBy}
                            </Badge>
                            <span className="text-muted-foreground text-sm">
                              {format(
                                new Date(initialData.createDate),
                                datetimeFormat
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                      {initialData.editBy && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Last Edited By
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-normal">
                              {initialData.editBy}
                            </Badge>
                            <span className="text-muted-foreground text-sm">
                              {initialData.editDate
                                ? format(
                                    new Date(initialData.editDate),
                                    datetimeFormat
                                  )
                                : "-"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CustomAccordionContent>
                </CustomAccordionItem>
              </CustomAccordion>
            )}

          {!isReadOnly && (
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelAction}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
