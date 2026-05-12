"use client"

import { PayrollComponentFormData, componentSchema } from "@/schemas/payroll"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconInfoCircle } from "@tabler/icons-react"
import { FormProvider, useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import CustomInput from "@/components/custom/custom-input"
import CustomSelect from "@/components/custom/custom-select"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface Props {
  initialData?: PayrollComponentFormData
  onSaveAction(data: PayrollComponentFormData): void
}

export function PayrollComponentForm({ initialData, onSaveAction }: Props) {
  const form = useForm<PayrollComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      componentId: initialData?.componentId ?? 0,
      componentCode: initialData?.componentCode ?? "",
      componentName: initialData?.componentName ?? "",
      componentType: initialData?.componentType ?? "Earning",
      isBonus: initialData?.isBonus ?? false,
      isLeave: initialData?.isLeave ?? false,
      isSalaryComponent: initialData?.isSalaryComponent ?? false,
      sortOrder: initialData?.sortOrder ?? 10,
      remarks: initialData?.remarks ?? "",
      isActive: initialData?.isActive ?? true,
    },
    mode: "onChange",
  })

  const handleSubmit = (data: PayrollComponentFormData) => {
    console.log("Form data being submitted:", data)
    console.log("Form validation state:", form.formState)

    if (form.formState.isValid) {
      console.log("Form is valid, calling onSaveAction")
      onSaveAction(data)
    } else {
      console.log("Form validation errors:", form.formState.errors)
    }
  }

  // Monitor form state for debugging
  console.log("Form state:", {
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
    values: form.getValues(),
  })

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          id="payroll-component-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <CustomInput
              form={form}
              name="componentCode"
              label="Component Code"
              isRequired
            />
            <CustomInput
              form={form}
              name="componentName"
              label="Component Name"
              isRequired
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              name="componentType"
              label="Component Type"
              isRequired
              options={[
                { value: "Earning", label: "Earning" },
                { value: "Deduction", label: "Deduction" },
              ]}
            />
            <CustomInput
              form={form}
              name="sortOrder"
              label="Sort Order"
              type="number"
              isRequired
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSwitch
              form={form}
              name="isBonus"
              label="Is Bonus Component"
            />
            <CustomSwitch
              form={form}
              name="isLeave"
              label="Is Leave Component"
            />
          </div>
          <div className="rounded-lg border border-border bg-card p-3 dark:border-blue-800 dark:bg-blue-950/30">
            <CustomSwitch
              form={form}
              name="isSalaryComponent"
              label="Is Salary Component"
            />
            <p className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
              <IconInfoCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              This component will be used to calculate the salary of the
              employee. Enable this for components that directly affect the base
              salary calculation.
            </p>
          </div>

          <CustomTextarea form={form} name="remarks" label="Remarks" />

          <CustomSwitch form={form} name="isActive" label="Active" />
        </form>
      </Form>
    </FormProvider>
  )
}
