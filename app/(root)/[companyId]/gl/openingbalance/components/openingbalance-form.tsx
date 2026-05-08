"use client"

import { useCompanyStore } from "@/stores/company-store"

import React, { useEffect, useImperativeHandle, useMemo, useRef } from "react"
import { setExchangeRateLocal } from "@/helpers/account"
import { ICurrencyLookup, IGLOpeningBalance } from "@/interfaces"
import { GLOpeningBalanceSchema, GLOpeningBalanceSchemaType } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { FormProvider, Resolver, UseFormReturn, useForm } from "react-hook-form"
import { clientDateFormat } from "@/lib/date-utils"
import { useChartOfAccountLookup } from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import {
  BargeAutocomplete,
  ChartOfAccountAutocomplete,
  CurrencyAutocomplete,
  CurrentYearAutocomplete,
  DepartmentAutocomplete,
  EmployeeAutocomplete,
  PortAutocomplete,
  ProductAutocomplete,
  VesselAutocomplete,
  VoyageAutocomplete,
} from "@/components/autocomplete"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"

import { getDefaultValues } from "./openingbalance-defaultvalues"

export interface OpeningBalanceFormRef {
  recalculateAmounts: () => void
}

interface OpeningBalanceFormProps {
  Hdform: UseFormReturn<GLOpeningBalanceSchemaType>
  onAddRowAction?: (rowData: IGLOpeningBalance) => void
  onCancelEdit?: () => void
  editingDetail?: GLOpeningBalanceSchemaType | null
  companyId: number
  existingDetails?: GLOpeningBalanceSchemaType[]
  defaultGlId?: number
  isCancelled?: boolean
}

const OpeningBalanceForm = React.forwardRef<
  OpeningBalanceFormRef,
  OpeningBalanceFormProps
>(
  (
    {
      Hdform,
      onAddRowAction,
      onCancelEdit: _onCancelEdit,
      editingDetail,
      companyId,
      existingDetails = [],
      defaultGlId = 0,
    },
    ref
  ) => {
    const { decimals } = useCompanyStore()
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2
    const exhRateDec = decimals[0]?.exhRateDec || 2

    const dateFormat = useMemo(
      () => decimals[0]?.dateFormat || clientDateFormat,
      [decimals]
    )

    const defaultOpeningBalance = useMemo(
      () =>
        getDefaultValues(
          Hdform.getValues("companyId") || companyId || 0,
          Hdform.getValues("createById") || 0,
          dateFormat
        ).defaultOpeningBalanceDetails,
      [Hdform, companyId, dateFormat]
    )

    const submitAttemptedRef = useRef(false)

    const getNextItemNo = () => {
      if (!existingDetails || existingDetails.length === 0) return 1
      const maxItemNo = Math.max(...existingDetails.map((d) => d.itemNo || 0))
      return maxItemNo + 1
    }

    const createDefaultValues = (
      itemNo: number
    ): GLOpeningBalanceSchemaType => ({
      ...defaultOpeningBalance,
      itemNo,
      glId:
        defaultGlId && defaultGlId > 0
          ? defaultGlId
          : defaultOpeningBalance.glId,
    })

    const form = useForm<GLOpeningBalanceSchemaType>({
      resolver: zodResolver(
        GLOpeningBalanceSchema
      ) as Resolver<GLOpeningBalanceSchemaType>,
      mode: "onSubmit",
      reValidateMode: "onChange",
      defaultValues: editingDetail ?? createDefaultValues(getNextItemNo()),
    })

    // When Edit is clicked, populate form with the selected row; when cancelled, reset to add-new defaults
    useEffect(() => {
      if (editingDetail) {
        form.reset(editingDetail)
      } else {
        form.reset(createDefaultValues(getNextItemNo()))
      }
      // Intentionally only react to editingDetail: reset when user clicks Edit or Cancel
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingDetail])

    // Lookup for GL account display (optional, keeps hook behavior consistent)
    useChartOfAccountLookup(companyId)

    useImperativeHandle(ref, () => ({
      recalculateAmounts: () => {
        const values = form.getValues()
        const totLocalAmt = (values.totAmt || 0) * (values.exhRate || 1)
        form.setValue("totLocalAmt", totLocalAmt)
      },
    }))

    const onSubmit = async (data: GLOpeningBalanceSchemaType) => {
      const details: IGLOpeningBalance = {
        ...(data as unknown as IGLOpeningBalance),
        customerId: data.customerId || 0,
        supplierId: data.supplierId ?? 0,
        departmentId: data.departmentId ?? 0,
        employeeId: data.employeeId ?? 0,
        productId: data.productId ?? 0,
        portId: data.portId ?? 0,
        vesselId: data.vesselId ?? 0,
        bargeId: data.bargeId ?? 0,
        voyageId: data.voyageId ?? 0,
      }

      if (onAddRowAction) {
        onAddRowAction(details)
      }

      form.reset(createDefaultValues(getNextItemNo()))
      submitAttemptedRef.current = false
    }

    // NOTE: form submission is handled via onSubmit on the <form> element.
    // handleFormSubmit and handleCancel kept only if needed in future.

    const handleCurrencyChange = React.useCallback(
      async (selectedCurrency: ICurrencyLookup | null) => {
        // Additional logic when currency changes
        const currencyId = selectedCurrency?.currencyId || 0
        const accountDate = form.getValues("accountDate")

        if (currencyId && accountDate) {
          // Update local exchange rate (doesn't require visible parameter)
          await setExchangeRateLocal(form, exhRateDec)
        }
      },
      [form, exhRateDec]
    )

    // Calculate Local Amount = Amount * Exchange Rate
    const handleTotAmtBlur = React.useCallback(() => {
      const totAmt = form.getValues("totAmt") || 0
      const exhRate = form.getValues("exhRate") || 0
      const totLocalAmt = totAmt * exhRate
      form.setValue("totLocalAmt", totLocalAmt, {
        shouldValidate: false,
        shouldDirty: true,
      })
    }, [form])

    const handleExhRateBlur = React.useCallback(() => {
      const totAmt = form.getValues("totAmt") || 0
      const exhRate = form.getValues("exhRate") || 0
      const totLocalAmt = totAmt * exhRate
      form.setValue("totLocalAmt", totLocalAmt, {
        shouldValidate: false,
        shouldDirty: true,
      })
    }, [form])

    return (
      <FormProvider {...form}>
        <form
          className="grid gap-4 rounded-md p-2 lg:grid-cols-12"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* Section 1 - 60% */}
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 lg:col-span-7 dark:border-blue-700 dark:bg-blue-900/20">
            <h3 className="mb-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
              Main Details
            </h3>
            <div className="grid gap-2 lg:grid-cols-4">
              <CurrentYearAutocomplete
                form={form}
                name="documentId"
                label="Document"
                isRequired
                className="w-full"
                onChangeEvent={(selectedOption) => {
                  if (selectedOption) {
                    const year = selectedOption.yearId
                    const docId = String(year)
                    const docNo = `OP${year}01`
                    const accountDateString = format(
                      new Date(year, 0, 1),
                      dateFormat
                    )

                    form.setValue("documentId", docId)
                    form.setValue("documentNo", docNo)
                    form.setValue("accountDate", accountDateString)
                    form.trigger(["documentId", "documentNo", "accountDate"])
                    // Sync header form so main-tab fetches GetGLOpeningBalance/{documentId} and sets table
                    Hdform.setValue("documentId", docId)
                    Hdform.setValue("documentNo", docNo)
                    Hdform.setValue("accountDate", accountDateString)
                    Hdform.trigger(["documentId", "documentNo", "accountDate"])
                  } else {
                    form.setValue("documentId", "0")
                    form.setValue("documentNo", "")
                    Hdform.setValue("documentId", "0")
                    Hdform.setValue("documentNo", "")
                  }
                }}
              />

              <CustomInput
                form={form}
                name="documentNo"
                label="Document No"
                isRequired={true}
              />

              <CustomDateNew
                form={form}
                name="accountDate"
                label="Account Date"
                isRequired={true}
              />

              <CustomInput
                form={form}
                name="itemNo"
                label="Item No"
                isRequired={true}
              />

              <CurrencyAutocomplete
                form={form}
                name="currencyId"
                label="Currency"
                isRequired={true}
                onChangeEvent={handleCurrencyChange}
              />

              {/* Exchange Rate */}
              <CustomNumberInput
                form={form}
                name="exhRate"
                label="Exchange Rate"
                isRequired={true}
                round={exhRateDec}
                className="text-right"
                onBlurEvent={handleExhRateBlur}
              />

              <ChartOfAccountAutocomplete
                form={form}
                name="glId"
                label="Chart Of Account"
                isRequired={true}
                companyId={companyId}
              />

              <CustomCheckbox
                form={form}
                name="isDebit"
                label="Is Debit"
                isRequired={true}
              />

              <CustomNumberInput
                form={form}
                name="totAmt"
                label="Amount"
                round={amtDec}
                isDisabled={false}
                onBlurEvent={handleTotAmtBlur}
              />

              <CustomNumberInput
                form={form}
                name="totLocalAmt"
                label="Local Amount"
                round={locAmtDec}
                isDisabled={false}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                variant="default"
                className={
                  editingDetail
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }
                disabled={form.formState.isSubmitting}
                title="Update | Add"
              >
                {editingDetail ? "Update" : "Add"}
              </Button>

              <Button
                type="button"
                variant="outline"
                title="Cancel"
                size="sm"
                //onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Section 2 - 40% */}
          <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 lg:col-span-5 dark:border-green-700 dark:bg-green-900/20">
            <h3 className="mb-1 text-sm font-semibold text-green-700 dark:text-green-300">
              Other Details
            </h3>
            <div className="grid gap-2 lg:grid-cols-3">
              <DepartmentAutocomplete
                form={form}
                name="departmentId"
                label="Department"
                isRequired={false}
              />

              <EmployeeAutocomplete
                form={form}
                name="employeeId"
                label="Employee"
                isRequired={false}
              />

              <ProductAutocomplete
                form={form}
                name="productId"
                label="Product"
                isRequired={false}
              />

              <PortAutocomplete
                form={form}
                name="portId"
                label="Port"
                isRequired={false}
              />

              <VesselAutocomplete
                form={form}
                name="vesselId"
                label="Vessel"
                isRequired={false}
              />

              <BargeAutocomplete
                form={form}
                name="bargeId"
                label="Barge"
                isRequired={false}
              />

              <VoyageAutocomplete
                form={form}
                name="voyageId"
                label="Voyage"
                isRequired={false}
              />

              <CustomCheckbox
                form={form}
                name="isSystem"
                label="Is System"
                isRequired={false}
              />
            </div>
          </div>
        </form>
      </FormProvider>
    )
  }
)

OpeningBalanceForm.displayName = "OpeningBalanceForm"

export default OpeningBalanceForm
