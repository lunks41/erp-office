"use client"

import { useMemo } from "react"
import { UseFormReturn } from "react-hook-form"

import { SaveDocumentDto } from "@/interfaces/document-expiry"
import CompanyAutocomplete from "@/components/autocomplete/autocomplete-company"
import CustomerAutocomplete from "@/components/autocomplete/autocomplete-customer"
import EmployeeAutocomplete from "@/components/autocomplete/autocomplete-employee"
import PortAutocomplete from "@/components/autocomplete/autocomplete-port"
import SupplierAutocomplete from "@/components/autocomplete/autocomplete-supplier"
import VesselAutocomplete from "@/components/autocomplete/autocomplete-vessel"
import CustomNumberInput from "@/components/custom/custom-number-input"
import { useDocExpiryReferenceTypeLookup } from "@/hooks/use-lookup"

const ENTITY_BY_CODE: Record<
  string,
  "employee" | "company" | "customer" | "supplier" | "vessel" | "port" | "number"
> = {
  EMPLOYEE: "employee",
  COMPANY: "company",
  CUSTOMER: "customer",
  SUPPLIER: "supplier",
  VESSEL: "vessel",
  PORT: "port",
}

export function DocExpiryReferenceEntityField({
  form,
}: {
  form: UseFormReturn<SaveDocumentDto>
}) {
  const referenceTypeId = form.watch("referenceTypeId")
  const { data: referenceTypes = [] } = useDocExpiryReferenceTypeLookup()

  const entityKind = useMemo(() => {
    const code = referenceTypes.find(
      (r) => r.referenceTypeId === referenceTypeId
    )?.referenceTypeCode
    if (!code) return "number"
    return ENTITY_BY_CODE[code.toUpperCase()] ?? "number"
  }, [referenceTypes, referenceTypeId])

  const label = "Reference"

  switch (entityKind) {
    case "employee":
      return (
        <EmployeeAutocomplete
          form={form}
          name="referenceId"
          label={label}
          isRequired
        />
      )
    case "company":
      return (
        <CompanyAutocomplete
          form={form}
          name="referenceId"
          label={label}
          isRequired
        />
      )
    case "customer":
      return (
        <CustomerAutocomplete
          form={form}
          name="referenceId"
          label={label}
          isRequired
        />
      )
    case "supplier":
      return (
        <SupplierAutocomplete
          form={form}
          name="referenceId"
          label={label}
          isRequired
        />
      )
    case "vessel":
      return (
        <VesselAutocomplete
          form={form}
          name="referenceId"
          label={label}
          isRequired
        />
      )
    case "port":
      return (
        <PortAutocomplete
          form={form}
          name="referenceId"
          label={label}
          isRequired
        />
      )
    default:
      return (
        <CustomNumberInput
          form={form}
          name="referenceId"
          label="Reference ID"
          isRequired
          round={0}
        />
      )
  }
}
