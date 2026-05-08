"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IBargeGLMapping } from "@/interfaces"
import { IBargeLookup, IChartOfAccountLookup } from "@/interfaces/lookup"
import { BargeGLMappingSchemaType, bargeGLMappingSchema } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useBargeLookup, useChartOfAccountLookup } from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import {
  BargeAutocomplete,
  ChartOfAccountAutocomplete,
} from "@/components/autocomplete"
import CustomSwitch from "@/components/custom/custom-switch"

const defaultValues = {
  bargeId: 0,
  glId: 0,
  isActive: true,
}

interface BargeGLMappingFormProps {
  initialData?: IBargeGLMapping
  submitAction: (data: BargeGLMappingSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  companyId: string
}

export function BargeGLMappingForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  companyId,
}: BargeGLMappingFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Fetch lookup data for populating code/name fields
  const { data: barges, refetch: refetchBarges } = useBargeLookup()
  const { data: chartOfAccounts } = useChartOfAccountLookup(Number(companyId))

  // Ensure barges are loaded when form opens (refetch on mount)
  useEffect(() => {
    refetchBarges()
  }, [refetchBarges])

  const form = useForm<BargeGLMappingSchemaType>({
    resolver: zodResolver(bargeGLMappingSchema),
    defaultValues: initialData
      ? {
          bargeId: initialData.bargeId ?? 0,
          glId: initialData.glId ?? 0,
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
            bargeId: initialData.bargeId ?? 0,
            glId: initialData.glId ?? 0,
            isActive: initialData.isActive ?? true,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form])

  // Function to populate code/name fields from lookup data
  const populateData = (
    formData: BargeGLMappingSchemaType
  ): BargeGLMappingSchemaType & {
    bargeName?: string
    glCode?: string
    glName?: string
  } => {
    const populatedData = {
      ...formData,
      bargeName: "",
      glCode: "",
      glName: "",
    }

    // Populate barge name if bargeId is set
    if (populatedData.bargeId && populatedData.bargeId > 0) {
      const bargeData = barges?.find(
        (barge: IBargeLookup) => barge.bargeId === populatedData.bargeId
      )
      if (bargeData) {
        populatedData.bargeName = bargeData.bargeName || ""
      }
    }

    // Populate GL code/name if glId is set
    if (populatedData.glId && populatedData.glId > 0) {
      const glData = chartOfAccounts?.find(
        (gl: IChartOfAccountLookup) => gl.glId === populatedData.glId
      )
      if (glData) {
        populatedData.glCode = glData.glCode || ""
        populatedData.glName = glData.glName || ""
      }
    }

    return populatedData
  }

  const onSubmit = (data: BargeGLMappingSchemaType) => {
    const populatedData = populateData(data)
    // Submit with populated data (bargeName, glCode, glName will be included)
    // The submitAction accepts the base schema type, but backend may use the additional fields
    submitAction(populatedData as BargeGLMappingSchemaType)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <BargeAutocomplete
                form={form}
                name="bargeId"
                label="Barge"
                isRequired={true}
                isDisabled={isReadOnly}
              />
              <ChartOfAccountAutocomplete
                form={form}
                name="glId"
                label="GL Account"
                isRequired={true}
                isDisabled={isReadOnly}
                companyId={Number(companyId)}
              />
            </div>

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
