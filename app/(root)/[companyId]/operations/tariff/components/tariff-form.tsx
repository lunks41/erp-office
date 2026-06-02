"use client"

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react"
import { IChargeLookup, ICustomerLookup } from "@/interfaces/lookup"
import { ITariffDt, ITariffHd } from "@/interfaces/tariff"
import { tariffHdSchema, TariffHdSchemaType } from "@/schemas/tariff"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getData } from "@/lib/api-client"
import { BasicSetting } from "@/lib/api-routes"
import { useCompanyCustomerLookup, useUomLookup } from "@/hooks/use-lookup"
import { Badge } from "@/components/ui/badge"
import { Form } from "@/components/ui/form"
import {
  ChargeAutocomplete,
  CurrencyAutocomplete,
  CustomerAutocomplete,
  PortAutocomplete,
  TaskAutocomplete,
  UomAutocomplete,
  VisaAutocomplete,
} from "@/components/autocomplete"
import TransportLocationAutocomplete from "@/components/autocomplete/autocomplete-transportlocation"
import { CustomCheckbox } from "@/components/custom"
import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"
import CustomNumberInput from "@/components/custom/custom-number-input"

import { TariffDetailsForm } from "./tariff-details-form"

interface TariffFormProps {
  initialData?: ITariffHd
  onSaveAction: (data: ITariffHd) => void
  onCloseAction: () => void
  mode: "create" | "edit" | "view"
  companyId: number
  customerId: number
  portId: number
  taskId: number
  onValidationError?: (hasErrors: boolean) => void
}

export interface TariffFormRef {
  submit: () => void
}

export const TariffForm = forwardRef<TariffFormRef, TariffFormProps>(
  (
    {
      initialData,
      onSaveAction,
      onCloseAction: _onCloseAction,
      mode,
      companyId,
      customerId,
      portId,
      taskId,
      onValidationError,
    },
    ref
  ) => {
    const { decimals } = useCompanyStore()
    const amtDec = decimals[0]?.amtDec || 2
    const exhRateDec = decimals[0]?.exhRateDec || 6
    const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

    const { data: customers = [] } = useCompanyCustomerLookup(companyId)
    const { data: uoms = [] } = useUomLookup()

    // Currency from the selected customer (customerId / initialData.customerId), not from first customer
    const defaultCurrencyId = useMemo(() => {
      const selectedCustomerId = initialData?.customerId ?? customerId
      if (selectedCustomerId && customers.length > 0) {
        const customer = customers.find(
          (c) => c.customerId === selectedCustomerId
        )
        return customer?.currencyId ?? 0
      }
      return 0
    }, [initialData?.customerId, customerId, customers])

    const form = useForm<TariffHdSchemaType>({
      resolver: zodResolver(tariffHdSchema),
      defaultValues: {
        tariffId: initialData?.tariffId || 0,
        companyId: initialData?.companyId || companyId,
        taskId: initialData?.taskId || taskId,
        chargeId: initialData?.chargeId || 0,
        portId: initialData?.portId || portId,
        customerId: initialData?.customerId || customerId,
        currencyId: initialData?.currencyId || defaultCurrencyId,
        exhRate: 1, // UI only - fetched from DB based on current date
        uomId: initialData?.uomId || 0,
        visaId: initialData?.visaId || null,
        fromLocationId: initialData?.fromLocationId || null,
        toLocationId: initialData?.toLocationId || null,
        prepaymentPercentage: initialData?.prepaymentPercentage || 0,
        isPrepayment: initialData?.isPrepayment || false,
        isViceVersa: initialData?.isViceVersa || false,
        seqNo: initialData?.seqNo ?? 0,
        remarks: initialData?.remarks || null,
        isActive: initialData?.isActive ?? true,
        editVersion: initialData?.editVersion || 0,
        data_details: Array.isArray(initialData?.data_details)
          ? initialData.data_details
          : [],
      },
    })

    // Track if form has been initialized to prevent resetting when initialData changes after user edits
    const isInitializedRef = useRef(false)
    const lastInitialDataRef = useRef<ITariffHd | undefined>(undefined)

    // Handle exchange rate fetch when currency changes
    const handleExchangeRateChange = React.useCallback(
      async (currencyId: number) => {
        if (!currencyId || currencyId === 0) {
          return
        }

        try {
          // Use current date in yyyy-MM-dd format
          const currentDate = format(new Date(), "yyyy-MM-dd")

          const res = await getData(
            `${BasicSetting.getExchangeRate}/${currencyId}/${currentDate}`
          )

          const exhRate = res?.data

          if (exhRate) {
            form.setValue("exhRate", +Number(exhRate).toFixed(exhRateDec))
            form.trigger("exhRate")
          }
        } catch (error) {
          console.error("Error fetching exchange rate:", error)
        }
      },
      [form, exhRateDec]
    )

    useEffect(() => {
      // Only reset if initialData actually changed (not just a reference change)
      // and if we haven't initialized yet, or if it's a completely new record
      const isNewRecord =
        !initialData ||
        (initialData.tariffId === 0 && !isInitializedRef.current)
      const hasInitialDataChanged =
        !lastInitialDataRef.current ||
        !initialData ||
        lastInitialDataRef.current.tariffId !== initialData.tariffId ||
        lastInitialDataRef.current.chargeId !== initialData.chargeId ||
        lastInitialDataRef.current.editVersion !== initialData.editVersion

      if (
        initialData &&
        (isNewRecord || (hasInitialDataChanged && !isInitializedRef.current))
      ) {
        form.reset({
          tariffId: initialData.tariffId || 0,
          companyId: initialData.companyId || companyId,
          taskId: initialData.taskId || taskId,
          chargeId: initialData.chargeId || 0,
          portId: initialData.portId || portId,
          customerId: initialData.customerId || customerId,
          currencyId: initialData.currencyId || defaultCurrencyId,
          exhRate: 1, // Will be fetched from DB based on current date
          uomId: initialData.uomId || 0,
          visaId: initialData.visaId || null,
          fromLocationId: initialData.fromLocationId || null,
          toLocationId: initialData.toLocationId || null,
          prepaymentPercentage: initialData.prepaymentPercentage || 0,
          isPrepayment: initialData.isPrepayment || false,
          isViceVersa: initialData.isViceVersa || false,
          seqNo: initialData.seqNo ?? 0,
          remarks: initialData.remarks || null,
          isActive: initialData.isActive ?? true,
          editVersion: initialData.editVersion || 0,
          data_details:
            Array.isArray(initialData.data_details) &&
            initialData.data_details.length > 0
              ? initialData.data_details
              : [],
        })
        // Trigger validation after setting data_details to clear any stale errors
        // Use requestAnimationFrame to ensure form state is updated
        requestAnimationFrame(() => {
          const currentDetails = form.getValues("data_details")
          if (Array.isArray(currentDetails) && currentDetails.length > 0) {
            form.trigger("data_details")
          }
        })
        lastInitialDataRef.current = initialData
        isInitializedRef.current = true
      } else if (!initialData && mode === "create") {
        form.reset({
          tariffId: 0,
          companyId: companyId,
          taskId: taskId,
          chargeId: 0,
          portId: portId,
          customerId: customerId,
          currencyId: defaultCurrencyId,
          exhRate: 1,
          uomId: 0,
          visaId: null,
          fromLocationId: null,
          toLocationId: null,
          prepaymentPercentage: 0,
          isPrepayment: false,
          isViceVersa: false,
          seqNo: 0,
          remarks: null,
          isActive: true,
          editVersion: 0,
          data_details: [],
        })
        isInitializedRef.current = true
      }
    }, [
      initialData,
      form,
      companyId,
      customerId,
      portId,
      taskId,
      mode,
      defaultCurrencyId,
    ])

    // Fetch exchange rate when currency is set
    useEffect(() => {
      const currencyId = form.getValues("currencyId")
      if (currencyId && currencyId > 0) {
        handleExchangeRateChange(currencyId)
      }
    }, [defaultCurrencyId, handleExchangeRateChange, form])

    // Watch form values
    const watchedCustomerId = form.watch("customerId")
    const watchedDetails = form.watch("data_details") || []
    const watchedExhRate = form.watch("exhRate") || 1
    const watchedUomId = form.watch("uomId")

    // Get uomCode from uomId
    const uomCode = useMemo(() => {
      const selectedUom = uoms.find((uom) => uom.uomId === watchedUomId)
      return selectedUom?.uomCode || ""
    }, [uoms, watchedUomId])

    // Check if details exist - if so, Task and Charge should be read-only
    const hasDetails =
      Array.isArray(watchedDetails) && watchedDetails.length > 0

    // Watch switch states for conditional field editing
    const isPrepayment = form.watch("isPrepayment")

    // Get form errors for display
    const formErrors = form.formState.errors

    // Expose submit function via ref
    useImperativeHandle(ref, () => ({
      submit: () => {
        // Get current data_details value
        const currentDetails = form.getValues("data_details")
        // Ensure it's an array
        if (!Array.isArray(currentDetails)) {
          form.setValue("data_details", [], { shouldValidate: true })
        }
        // Trigger validation for all fields including data_details
        form.trigger()
        // Then handle submit - validation will prevent submission if data_details is empty
        form.handleSubmit(onSubmit)()
      },
    }))

    function onSubmit(data: TariffHdSchemaType) {
      // Get all form values to ensure we have the latest data
      const formValues = form.getValues()

      const tariffData: ITariffHd = {
        tariffId: formValues.tariffId ?? data.tariffId,
        companyId: formValues.companyId ?? data.companyId,
        taskId: formValues.taskId ?? data.taskId,
        chargeId: formValues.chargeId ?? data.chargeId,
        portId: formValues.portId ?? data.portId,
        customerId: formValues.customerId ?? data.customerId,
        currencyId: formValues.currencyId ?? data.currencyId,
        // exhRate is NOT saved to DB - it's UI only for calculations
        uomId: formValues.uomId ?? data.uomId,
        visaId: formValues.visaId ?? data.visaId ?? null,
        fromLocationId:
          formValues.fromLocationId ?? data.fromLocationId ?? null,
        toLocationId: formValues.toLocationId ?? data.toLocationId ?? null,
        isPrepayment: formValues.isPrepayment ?? data.isPrepayment,
        isViceVersa: formValues.isViceVersa ?? data.isViceVersa,
        prepaymentPercentage:
          formValues.prepaymentPercentage ?? data.prepaymentPercentage,
        seqNo: formValues.seqNo ?? data.seqNo ?? 0,
        remarks: formValues.remarks ?? data.remarks ?? null,
        isActive: formValues.isActive ?? data.isActive,
        editVersion: formValues.editVersion ?? data.editVersion,
        createBy: initialData?.createBy || "",
        createDate: initialData?.createDate || new Date(),
        editBy: initialData?.editBy || null,
        editDate: initialData?.editDate || null,
        // Use form.getValues() to get the latest data_details from form state
        data_details: (formValues.data_details ||
          data.data_details ||
          []) as ITariffDt[],
      }

      onSaveAction(tariffData)
    }

    // Handle customer selection
    const handleCustomerChange = React.useCallback(
      async (selectedCustomer: ICustomerLookup | null) => {
        const newCurrencyId = selectedCustomer?.currencyId || 0
        form.setValue("currencyId", newCurrencyId)

        // Fetch exchange rate when currency changes
        if (newCurrencyId > 0) {
          await handleExchangeRateChange(newCurrencyId)
        }

        form.trigger()
      },
      [form, handleExchangeRateChange]
    )

    const handleChargeChange = React.useCallback(
      (selectedCharge: IChargeLookup | null) => {
        const newUomId = selectedCharge?.uomId || 0
        form.setValue("uomId", newUomId)
        form.trigger("uomId")
      },
      [form]
    )

    return (
      <div className="flex w-full min-w-0 flex-col gap-2">
        {/* Validation Status */}
        {Object.keys(formErrors).length > 0 && (
          <div className="bg-destructive/10 border-destructive/20 mb-4 rounded-md border p-3">
            <h4 className="text-destructive mb-2 text-sm font-medium">
              Please fix the following errors:
            </h4>
            <ul className="text-destructive space-y-1 text-sm">
              {Object.entries(formErrors).map(([field, error]) => {
                const errorObj = error as { message?: string } | undefined
                return (
                  <li key={field}>
                    • {errorObj?.message || `${field} is required`}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (data) => {
                // Ensure data_details is always an array, never undefined
                const formData = {
                  ...data,
                  data_details: Array.isArray(data.data_details)
                    ? data.data_details
                    : [],
                }
                onValidationError?.(false)
                onSubmit(formData)
              },
              (errors) => {
                onValidationError?.(true)
                const errorMessages = Object.values(errors)
                  .map((error) => {
                    const errorObj = error as { message?: string } | undefined
                    return errorObj?.message
                  })
                  .filter(Boolean)
                if (errorMessages.length > 0) {
                  toast.error(
                    `Please fix the following errors: ${errorMessages.join(", ")}`
                  )
                } else {
                  toast.error("Please fill in all required fields")
                }
              }
            )}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
              <CustomerAutocomplete
                key={`customer-autocomplete-${mode}-${customerId}`}
                form={form}
                name="customerId"
                label="Customer"
                isRequired={true}
                isDisabled={mode === "view"}
                onChangeEvent={handleCustomerChange}
              />

              {watchedCustomerId > 0 && (
                <CurrencyAutocomplete
                  form={form}
                  name="currencyId"
                  label="Currency"
                  isRequired
                  isDisabled={true}
                />
              )}
              <PortAutocomplete
                key={`port-${mode}-${portId}`}
                form={form}
                name="portId"
                label="Port"
                isRequired
                isDisabled={mode === "view"}
              />
              <TaskAutocomplete
                form={form}
                name="taskId"
                label="Task"
                isRequired
                isDisabled={mode === "view" || hasDetails}
              />
              <div className="col-span-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <CustomCheckbox
                  form={form}
                  name="isPrepayment"
                  label="Is Prepay"
                  labelPosition="top"
                  isDisabled={mode === "view"}
                />
                <CustomNumberInput
                  form={form}
                  name="prepaymentPercentage"
                  label="Prepay Rate"
                  isRequired={isPrepayment}
                  isDisabled={mode === "view" || !isPrepayment}
                  round={amtDec}
                  className="w-28 shrink-0"
                />
              </div>

              <div className="col-span-1 grid grid-cols-2 items-end gap-2">
                <CustomNumberInput
                  form={form}
                  name="seqNo"
                  label="Seq No"
                  isDisabled={mode === "view"}
                  round={0}
                  className="min-w-0"
                />
                <CustomCheckbox
                  form={form}
                  name="isViceVersa"
                  label="Vice Versa"
                  labelPosition="top"
                  isDisabled={mode === "view"}
                  className="min-w-0"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
                <ChargeAutocomplete
                  form={form}
                  name="chargeId"
                  label="Charge"
                  isRequired
                  isDisabled={mode === "view"}
                  onChangeEvent={handleChargeChange}
                />
              </div>
              <div className="col-span-1">
                <UomAutocomplete
                  form={form}
                  name="uomId"
                  label="Unit"
                  isRequired
                  isDisabled={mode === "view"}
                />
              </div>

              <div className="col-span-1">
                <VisaAutocomplete
                  form={form}
                  name="visaId"
                  label="Visa Type"
                  isRequired={false}
                  isDisabled={mode === "view"}
                />
              </div>
              <div className="col-span-1">
                <TransportLocationAutocomplete
                  form={form}
                  name="fromLocationId"
                  label="From Location"
                  isDisabled={mode === "view"}
                />
              </div>
              <div className="col-span-1">
                <TransportLocationAutocomplete
                  form={form}
                  name="toLocationId"
                  label="To Location"
                  isDisabled={mode === "view"}
                />
              </div>
            </div>

            {/* Details Section */}
            {mode !== "view" && (
              <TariffDetailsForm
                form={form}
                tariffId={form.watch("tariffId") || 0}
                companyId={companyId}
                exhRate={watchedExhRate}
                uomCode={uomCode}
              />
            )}

            {/* View Details Section */}
            {mode === "view" && watchedDetails && watchedDetails.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tariff Details</h4>
                <div className="bg-muted/50 rounded-lg border p-4">
                  <div className="space-y-2">
                    {watchedDetails.map((detail: ITariffDt, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{detail.itemNo}</Badge>
                          <span className="text-sm">
                            Display: {detail.displayRate} | Basic:{" "}
                            {detail.basicRate} | Min: {detail.minUnit} | Max:{" "}
                            {detail.maxUnit}
                          </span>
                        </div>
                        {detail.isAdditional && (
                          <span className="text-muted-foreground text-xs">
                            Additional: {detail.additionalUnit} @{" "}
                            {detail.additionalRate}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <>
              {/* Audit Information Section */}
              {initialData &&
                (initialData.createBy ||
                  initialData.createDate ||
                  initialData.editBy ||
                  initialData.editDate) && (
                  <div className="space-y-3 pt-4">
                    <div className="border-t pt-4">
                      <CustomAccordion
                        type="single"
                        collapsible
                        className="rounded-md border border-slate-200"
                      >
                        <CustomAccordionItem
                          value="audit-info"
                          className="border-none"
                        >
                          <CustomAccordionTrigger className="hover:bg-muted/30 rounded-t-md px-4 py-2">
                            <div className="mr-2 flex flex-1 items-center justify-between gap-3">
                              <span className="text-sm font-medium text-slate-600">
                                View Audit Trail
                              </span>
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <span>Created</span>
                                <span>&bull;</span>
                                <span>Modified</span>
                              </div>
                            </div>
                          </CustomAccordionTrigger>
                          <CustomAccordionContent className="px-4 pb-0">
                            <div className="grid grid-cols-1 gap-4 border-t py-2 md:grid-cols-2">
                              <div className="space-y-1">
                                <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                                  Created By
                                </p>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                  <span className="font-semibold text-slate-700">
                                    {initialData.createBy || "-"}
                                  </span>
                                  <span className="text-xs">
                                    {initialData.createDate
                                      ? format(
                                          new Date(initialData.createDate),
                                          datetimeFormat
                                        )
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                                  Last Modified By
                                </p>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                  <span className="font-semibold text-slate-700">
                                    {initialData.editBy || "-"}
                                  </span>
                                  <span className="text-xs">
                                    {initialData.editDate
                                      ? format(
                                          new Date(initialData.editDate),
                                          datetimeFormat
                                        )
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CustomAccordionContent>
                        </CustomAccordionItem>
                      </CustomAccordion>
                    </div>
                  </div>
                )}
            </>
          </form>
        </Form>
      </div>
    )
  }
)

TariffForm.displayName = "TariffForm"
