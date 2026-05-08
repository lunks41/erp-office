"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IChargeGLMapping } from "@/interfaces/chargeglmapping"
import { IChargeLookup, IChartOfAccountLookup } from "@/interfaces/lookup"
import {
  ChargeGLMappingSchemaType,
  chargeGLMappingSchema,
} from "@/schemas/chargeglmapping"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { useChargeLookup, useChartOfAccountLookup } from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import {
  ChargeAutocomplete,
  ChartOfAccountAutocomplete,
} from "@/components/autocomplete"
import CustomSwitch from "@/components/custom/custom-switch"

const defaultValues = {
  chargeId: 0,
  glId: 0,
  isActive: true,
}

interface ChargeGLMappingFormProps {
  initialData?: IChargeGLMapping
  submitAction: (data: ChargeGLMappingSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  companyId: string
}

export function ChargeGLMappingForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  companyId,
}: ChargeGLMappingFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Fetch lookup data for populating code/name fields
  const { data: charges, refetch: refetchCharges } = useChargeLookup()
  const { data: chartOfAccounts } = useChartOfAccountLookup(Number(companyId))

  // Ensure charges are loaded when form opens (refetch on mount)
  useEffect(() => {
    refetchCharges()
  }, [refetchCharges])

  const form = useForm<ChargeGLMappingSchemaType>({
    resolver: zodResolver(chargeGLMappingSchema),
    defaultValues: initialData
      ? {
          chargeId: initialData.chargeId ?? 0,
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
            chargeId: initialData.chargeId ?? 0,
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
    formData: ChargeGLMappingSchemaType
  ): ChargeGLMappingSchemaType & {
    chargeName?: string
    glCode?: string
    glName?: string
  } => {
    const populatedData = {
      ...formData,
      chargeName: "",
      glCode: "",
      glName: "",
    }

    // Populate charge name if chargeId is set
    if (populatedData.chargeId && populatedData.chargeId > 0) {
      const chargeData = charges?.find(
        (charge: IChargeLookup) => charge.chargeId === populatedData.chargeId
      )
      if (chargeData) {
        populatedData.chargeName = chargeData.chargeName || ""
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

  const onSubmit = (data: ChargeGLMappingSchemaType) => {
    const populatedData = populateData(data)
    // Submit with populated data (chargeName, glCode, glName will be included)
    // The submitAction accepts the base schema type, but backend may use the additional fields
    submitAction(populatedData as ChargeGLMappingSchemaType)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <ChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge"
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
