"use client"

import React, { useImperativeHandle } from "react"
import {
  GLYearEndProcessRequestSchema,
  GLYearEndProcessRequestSchemaType,
} from "@/schemas/gl-yearendprocess"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, Resolver, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { CurrentYearAutocomplete } from "@/components/autocomplete"
import { CustomSwitch } from "@/components/custom"

export interface YearEndProcessFormRef {
  recalculateAmounts: () => void
  submit: () => void
}

interface YearEndProcessFormProps {
  onGenerateAction?: (requestData: GLYearEndProcessRequestSchemaType) => void
  onResetAction?: () => void
  companyId: number
  defaultDocumentId?: number
}

const YearEndProcessForm = React.forwardRef<
  YearEndProcessFormRef,
  YearEndProcessFormProps
>(
  (
    {
      onGenerateAction,
      onResetAction,
      companyId: _companyId,
      defaultDocumentId = 0,
    },
    ref
  ) => {
    const { decimals: _decimals } = useAuthStore()

    const form = useForm<GLYearEndProcessRequestSchemaType>({
      resolver: zodResolver(
        GLYearEndProcessRequestSchema
      ) as Resolver<GLYearEndProcessRequestSchemaType>,
      mode: "onSubmit",
      reValidateMode: "onChange",
      defaultValues: {
        documentId: defaultDocumentId || 0,
        isCurrency: false,
        isDepartment: false,
        isEmployee: false,
        isProduct: false,
        isPort: false,
        isVessel: false,
        isBarge: false,
        isVoyage: false,
        isCustomer: false,
        isSupplier: false,
      },
    })

    useImperativeHandle(ref, () => ({
      recalculateAmounts: () => {
        // No calculations needed for this form
      },
      submit: () => {
        form.handleSubmit(onSubmit)()
      },
    }))

    const onSubmit = async (data: GLYearEndProcessRequestSchemaType) => {
      if (onGenerateAction) {
        onGenerateAction(data)
      }
    }

    return (
      <FormProvider {...form}>
        <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
            <h3 className="mb-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
              Year End Process Options
            </h3>
            <div className="space-y-2">
              <div className="col-span-1 grid grid-cols-12 gap-1">
                <div className="col-span-2">
                  <CurrentYearAutocomplete
                    form={form}
                    name="documentId"
                    label="Document Year"
                    isRequired
                    className="w-full"
                    onChangeEvent={(selectedOption) => {
                      if (selectedOption) {
                        // documentId should be the yearId (number)
                        form.setValue("documentId", selectedOption.yearId)
                        form.trigger("documentId")
                      } else {
                        form.setValue("documentId", 0)
                      }
                    }}
                  />
                </div>

                <CustomSwitch
                  form={form}
                  name="isCurrency"
                  label="Currency"
                  isRequired={false}
                />
                <CustomSwitch
                  form={form}
                  name="isDepartment"
                  label="Department"
                  isRequired={false}
                />
                <CustomSwitch
                  form={form}
                  name="isEmployee"
                  label="Employee"
                  isRequired={false}
                />
                <CustomSwitch
                  form={form}
                  name="isProduct"
                  label="Product"
                  isRequired={false}
                />
                <CustomSwitch
                  form={form}
                  name="isPort"
                  label="Port"
                  isRequired={false}
                />
                <CustomSwitch
                  form={form}
                  name="isVessel"
                  label="Vessel"
                  isRequired={false}
                />
                <CustomSwitch
                  form={form}
                  name="isBarge"
                  label="Barge"
                  isRequired={false}
                />
                <CustomSwitch
                  form={form}
                  name="isVoyage"
                  label="Voyage"
                  isRequired={false}
                />
                <CustomSwitch
                  form={form}
                  name="isCustomer"
                  label="Customer"
                  isRequired={false}
                />
                <CustomSwitch
                  form={form}
                  name="isSupplier"
                  label="Supplier"
                  isRequired={false}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                size="sm"
                variant="default"
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={form.formState.isSubmitting}
                title="Generate"
              >
                {form.formState.isSubmitting ? "Generating..." : "Generate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                title="Reset"
                size="sm"
                onClick={() => {
                  form.reset({
                    documentId: defaultDocumentId || 0,
                    isCurrency: false,
                    isDepartment: false,
                    isEmployee: false,
                    isProduct: false,
                    isPort: false,
                    isVessel: false,
                    isBarge: false,
                    isVoyage: false,
                    isCustomer: false,
                    isSupplier: false,
                  })
                  // Clear table data when reset is clicked
                  if (onResetAction) {
                    onResetAction()
                  }
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    )
  }
)

YearEndProcessForm.displayName = "YearEndProcessForm"

export default YearEndProcessForm
