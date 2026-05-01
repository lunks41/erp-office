"use client"

import { PdaHdFormValues } from "@/schemas/pdaSchema"
import { UseFormReturn } from "react-hook-form"

import {
  CurrencyAutocomplete,
  CustomerAutocomplete,
  JobOrderAutocomplete,
  JobStatusAutocomplete,
  PortAutocomplete,
  VesselAutocomplete,
} from "@/components/autocomplete"
import { CustomNumberInput, CustomTextarea } from "@/components/custom"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"

interface PdaHeaderFormProps {
  form: UseFormReturn<PdaHdFormValues>
  onJobOrderChange?: (jobOrderId: number) => void
}

export function PdaHeaderForm({
  form,
  onJobOrderChange,
}: PdaHeaderFormProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 md:grid-cols-6">
        <JobOrderAutocomplete
          form={form}
          name="jobOrderId"
          label="Job Order"
          isRequired
          onChangeEvent={(selected) =>
            onJobOrderChange?.(selected?.jobOrderId ?? 0)
          }
        />
        <CustomInput form={form} name="pdaNo" label="PDA Reference" isDisabled />
        <CustomInput form={form} name="pdaDate" label="PDA Date" isDisabled />
        <VesselAutocomplete form={form} name="vesselId" label="Vessel" />
        <PortAutocomplete form={form} name="portId" label="Port" />
        <CustomerAutocomplete form={form} name="customerId" label="Customer" />

        <JobStatusAutocomplete
          form={form}
          name="status"
          label="Status"
          isDisabled
        />

        <CustomInput
          form={form}
          name="typeOfCall"
          label="Type of Call"
          placeholder="Enter Type of Call"
          isRequired
        />
        <CustomDateNew form={form} name="etaDate" label="ETA Date" />
        <CustomDateNew form={form} name="etdDate" label="ETD Date" />
        <CurrencyAutocomplete form={form} name="currencyId" label="Currency" />
        <CustomNumberInput
          form={form}
          name="exchRate"
          label="Exchange Rate"
          isRequired
        />

        <CustomInput form={form} name="basisOfPda" label="Basis of PDA" />
        <CustomNumberInput
          form={form}
          name="advanceReceived"
          label="Advance Received"
          isRequired
        />
        <CustomTextarea form={form} name="remarks" label="Remarks" />
      </div>
    </div>
  )
}
