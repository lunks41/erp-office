"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect, useMemo } from "react"
import { IAccountSetupDt } from "@/interfaces/accountsetup"
import {
  AccountSetupDtSchemaType,
  accountSetupDtSchema,
} from "@/schemas/accountsetup"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { useChartOfAccountLookup } from "@/hooks/use-lookup"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import {
  AccountSetupAutocomplete,
  ChartOfAccountAutocomplete,
  CurrencyAutocomplete,
} from "@/components/autocomplete"
import CustomSwitch from "@/components/custom/custom-switch"

interface AccountSetupDtFormProps {
  initialData?: IAccountSetupDt | null
  submitAction: (data: AccountSetupDtSchemaType) => void
  onCancelAction: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  companyId?: string
}

export function AccountSetupDtForm({
  initialData,
  submitAction,
  onCancelAction: _onCancelAction,
  isSubmitting: _isSubmitting = false,
  isReadOnly = false,
  companyId,
}: AccountSetupDtFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const defaultValues = useMemo(
    () => ({
      accSetupId: 0,
      currencyId: 0,
      glId: 0,
      applyAllCurr: false,
    }),
    []
  )

  const form = useForm<AccountSetupDtSchemaType>({
    resolver: zodResolver(accountSetupDtSchema),
    defaultValues: initialData
      ? {
          accSetupId: initialData.accSetupId ?? 0,
          currencyId: initialData.currencyId ?? 0,
          glId: initialData.glId ?? 0,
          applyAllCurr: initialData.applyAllCurr ?? false,
        }
      : {
          ...defaultValues,
        },
  })

  useChartOfAccountLookup(Number(companyId || 0))

  // Reset form when initialData changes
  useEffect(() => {
    form.reset(
      initialData
        ? {
            accSetupId: initialData.accSetupId ?? 0,
            currencyId: initialData.currencyId ?? 0,
            glId: initialData.glId ?? 0,
            applyAllCurr: initialData.applyAllCurr ?? false,
          }
        : {
            ...defaultValues,
          }
    )
  }, [initialData, form, defaultValues])

  const onSubmit = (data: AccountSetupDtSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <AccountSetupAutocomplete
                form={form}
                name="accSetupId"
                label="Account Setup"
                isRequired={true}
              />

              <CurrencyAutocomplete
                form={form}
                name="currencyId"
                label="Currency"
                isRequired={true}
              />

              <ChartOfAccountAutocomplete
                form={form}
                name="glId"
                label="Chart of Account"
                isRequired={true}
                companyId={Number(companyId || 0)}
              />
            </div>

            <CustomSwitch
              form={form}
              name="applyAllCurr"
              label="Apply All Currency"
              activeColor="success"
              isDisabled={isReadOnly}
            />

            {/* Audit Information Section */}
            <AuditTrailAccordion createBy={initialData?.createBy} createDate={initialData?.createDate} editBy={initialData?.editBy} editDate={initialData?.editDate} datetimeFormat={datetimeFormat} />
          </div>
        </form>
      </Form>
    </div>
  )
}
