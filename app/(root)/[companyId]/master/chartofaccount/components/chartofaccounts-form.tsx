"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IChartOfAccount } from "@/interfaces/chartofaccount"
import {
  ChartOfAccountSchemaType,
  chartofAccountSchema,
} from "@/schemas/chartofaccount"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  useAccountGroupLookup,
  useAccountTypeLookup,
  useCOACategory1Lookup,
  useCOACategory2Lookup,
  useCOACategory3Lookup,
} from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import {
  AccountGroupAutocomplete,
  AccountTypeAutocomplete,
  COACategory1Autocomplete,
  COACategory2Autocomplete,
  COACategory3Autocomplete,
} from "@/components/autocomplete"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues = {
  glId: 0,
  glCode: "",
  glName: "",
  accTypeId: 0,
  accGroupId: 0,
  coaCategoryId1: 0,
  coaCategoryId2: 0,
  coaCategoryId3: 0,
  isSysControl: false,
  isDeptMandatory: false,
  isBargeMandatory: false,
  isBankAccount: false,
  isJobSpecific: false,
  isOperational: false,
  isPayableAccount: false,
  isReceivableAccount: false,
  isUniversal: false,
  seqNo: 0,
  remarks: "",
  isActive: true,
}
interface ChartOfAccountFormProps {
  initialData?: IChartOfAccount | null
  submitAction: (data: ChartOfAccountSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onCodeBlur?: (code: string) => void
}

export function ChartOfAccountForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onCodeBlur,
}: ChartOfAccountFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<ChartOfAccountSchemaType>({
    resolver: zodResolver(chartofAccountSchema),
    defaultValues: initialData
      ? {
          glId: initialData.glId ?? 0,
          glCode: initialData.glCode ?? "",
          glName: initialData.glName ?? "",
          accTypeId: initialData.accTypeId ?? 0,
          accGroupId: initialData.accGroupId ?? 0,
          coaCategoryId1: initialData.coaCategoryId1 ?? 0,
          coaCategoryId2: initialData.coaCategoryId2 ?? 0,
          coaCategoryId3: initialData.coaCategoryId3 ?? 0,
          isSysControl: initialData.isSysControl ?? false,
          isDeptMandatory: initialData.isDeptMandatory ?? false,
          isBargeMandatory: initialData.isBargeMandatory ?? false,
          isBankAccount: initialData.isBankAccount ?? false,
          isJobSpecific: initialData.isJobSpecific ?? false,
          isOperational: initialData.isOperational ?? false,
          isPayableAccount: initialData.isPayableAccount ?? false,
          isReceivableAccount: initialData.isReceivableAccount ?? false,
          isUniversal: initialData.isUniversal ?? false,
          seqNo: initialData.seqNo ?? 0,
          remarks: initialData.remarks ?? "",
          isActive: initialData.isActive ?? true,
        }
      : {
          ...defaultValues,
        },
  })

  useAccountTypeLookup()
  useAccountGroupLookup()
  useCOACategory1Lookup()
  useCOACategory2Lookup()
  useCOACategory3Lookup()

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    } else {
      form.reset({
        glId: 0,
        glCode: "",
        glName: "",
        accTypeId: 0,
        accGroupId: 0,
        coaCategoryId1: 0,
        coaCategoryId2: 0,
        coaCategoryId3: 0,
        isSysControl: false,
        isDeptMandatory: false,
        isBargeMandatory: false,
        isBankAccount: false,
        isJobSpecific: false,
        isOperational: false,
        isPayableAccount: false,
        isReceivableAccount: false,
        isUniversal: false,
        seqNo: 0,
        remarks: "",
        isActive: true,
      })
    }
  }, [initialData, form])

  const handleCodeBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    const code = form.getValues("glCode")
    if (code) {
      onCodeBlur?.(code)
    }
  }

  const onSubmit = (data: ChartOfAccountSchemaType) => {
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
                name="glCode"
                label="GL Code"
                isRequired
                isDisabled={isReadOnly || Boolean(initialData)}
                onBlurEvent={handleCodeBlur}
              />
              <CustomInput
                form={form}
                name="glName"
                label="GL Name"
                isRequired
                isDisabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                form={form}
                name="seqNo"
                label="Seq No"
                type="number"
                isRequired
                isDisabled={isReadOnly}
              />{" "}
              <AccountTypeAutocomplete
                form={form}
                name="accTypeId"
                label="Account Type"
                isRequired={true}
                isDisabled={isReadOnly}
              />
              <AccountGroupAutocomplete
                form={form}
                name="accGroupId"
                label="Account Group"
                isRequired={true}
                isDisabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {" "}
              <COACategory1Autocomplete
                form={form}
                name="coaCategoryId1"
                label="Category 1"
                isRequired={true}
                isDisabled={isReadOnly}
              />
              <COACategory2Autocomplete
                form={form}
                name="coaCategoryId2"
                label="Category 2"
                isDisabled={isReadOnly}
              />
              <COACategory3Autocomplete
                form={form}
                name="coaCategoryId3"
                label="Category 3"
                isDisabled={isReadOnly}
              />
            </div>
            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly}
            />
            <div className="grid grid-cols-3 gap-2">
              <CustomCheckbox
                form={form}
                name="isSysControl"
                label="System Control"
                isDisabled={isReadOnly}
              />
              <CustomCheckbox
                form={form}
                name="isJobSpecific"
                label="Job Control"
                isDisabled={isReadOnly}
              />{" "}
              <CustomCheckbox
                form={form}
                name="isBankAccount"
                label="Bank Control"
                isDisabled={isReadOnly}
              />
              <CustomCheckbox
                form={form}
                name="isDeptMandatory"
                label="Dep. Mandatory"
                isDisabled={isReadOnly}
              />{" "}
              <CustomCheckbox
                form={form}
                name="isBargeMandatory"
                label="Barge Mandatory"
                isDisabled={isReadOnly}
              />{" "}
              <CustomCheckbox
                form={form}
                name="isOperational"
                label="Operational"
                isDisabled={isReadOnly}
              />{" "}
              <CustomCheckbox
                form={form}
                name="isPayableAccount"
                label="Payable Account"
                isDisabled={isReadOnly}
              />{" "}
              <CustomCheckbox
                form={form}
                name="isReceivableAccount"
                label="Receivable Account"
                isDisabled={isReadOnly}
              />{" "}
              <CustomCheckbox
                form={form}
                name="isUniversal"
                label="Universal"
                isDisabled={isReadOnly}
              />{" "}
            </div>
            <CustomSwitch
              form={form}
              name="isActive"
              label="Active Status"
              activeColor="success"
              isDisabled={isReadOnly}
            />{" "}
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
