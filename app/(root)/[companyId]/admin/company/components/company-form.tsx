"use client"

import { useEffect } from "react"
import { ICompany } from "@/interfaces/admin"
import { CompanySchemaType, companySchema } from "@/schemas/admin"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CurrencyAutocomplete from "@/components/autocomplete/autocomplete-currency"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

const defaultValues: CompanySchemaType = {
  companyId: 0,
  companyCode: "",
  companyName: "",
  registrationNo: "",
  taxRegistrationNo: "",
  molId: "",
  address: "",
  email: "",
  phoneNo: "",
  remarks: "",
  isActive: true,
  currencyId: 0,
  peppolId: "",
}

interface CompanyFormProps {
  initialData?: ICompany
  submitAction: (data: CompanySchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
}

export function CompanyForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
}: CompanyFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<CompanySchemaType>({
    resolver: zodResolver(companySchema),
    defaultValues: initialData
      ? {
          companyId: initialData.companyId ?? 0,
          companyCode: initialData.companyCode ?? "",
          companyName: initialData.companyName ?? "",
          registrationNo: initialData.registrationNo ?? "",
          taxRegistrationNo: initialData.taxRegistrationNo ?? "",
          molId: initialData.molId ?? "",
          address: initialData.address ?? "",
          email: initialData.email ?? "",
          phoneNo: initialData.phoneNo ?? "",
          remarks: initialData.remarks ?? "",
          isActive: initialData.isActive ?? true,
          currencyId: initialData.currencyId ?? 0,
          peppolId: initialData.peppolId ?? "",
        }
      : defaultValues,
  })

  useEffect(() => {
    form.reset(
      initialData
        ? {
            companyId: initialData.companyId ?? 0,
            companyCode: initialData.companyCode ?? "",
            companyName: initialData.companyName ?? "",
            registrationNo: initialData.registrationNo ?? "",
            taxRegistrationNo: initialData.taxRegistrationNo ?? "",
            molId: initialData.molId ?? "",
            address: initialData.address ?? "",
            email: initialData.email ?? "",
            phoneNo: initialData.phoneNo ?? "",
            remarks: initialData.remarks ?? "",
            isActive: initialData.isActive ?? true,
            currencyId: initialData.currencyId ?? 0,
            peppolId: initialData.peppolId ?? "",
          }
        : defaultValues
    )
  }, [initialData, form])

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitAction)}
          className="space-y-2 pt-1 sm:space-y-3"
        >
          <div className="grid gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <CustomNumberInput
                form={form}
                name="companyId"
                label="Company ID"
                round={0}
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
              />
              <CustomInput
                form={form}
                name="companyCode"
                label="Company Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
              />
              <CustomInput
                form={form}
                name="companyName"
                label="Company Name"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <CustomInput
                form={form}
                name="registrationNo"
                label="Registration No"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="taxRegistrationNo"
                label="Tax Registration No"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="molId"
                label="MOL ID"
                isDisabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <CustomInput
                form={form}
                name="email"
                label="Email"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="phoneNo"
                label="Phone No"
                isDisabled={isReadOnly}
              />
              <CurrencyAutocomplete
                form={form}
                name="currencyId"
                label="Currency"
                isDisabled={isReadOnly}
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <CustomInput
                form={form}
                name="peppolId"
                label="Peppol ID"
                isDisabled={isReadOnly}
              />
              <CustomSwitch
                form={form}
                name="isActive"
                label="Active Status"
                activeColor="success"
                isDisabled={isReadOnly}
              />
            </div>

            <CustomTextarea
              form={form}
              name="address"
              label="Address"
              isDisabled={isReadOnly}
            />
            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly}
            />

            {initialData && (
              <AuditTrailAccordion
                createBy={initialData.createBy}
                createDate={initialData.createDate}
                editBy={initialData.editBy}
                editDate={initialData.editDate}
                datetimeFormat={datetimeFormat}
              />
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" type="button" onClick={onCancelAction}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : initialData ? "Edit" : "Add"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
