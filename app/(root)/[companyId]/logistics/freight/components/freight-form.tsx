"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { IFreight } from "@/interfaces/freight"
import { IJobOrderLookup, IVesselLookup } from "@/interfaces/lookup"
import { FreightSchema, FreightSchemaType } from "@/schemas/freight"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import {
  JobOrderAutocomplete,
  JobOrderTaskAutocomplete,
} from "@/components/autocomplete"
import CarrierAutocomplete from "@/components/autocomplete/autocomplete-carrier"
import ChargeAutocomplete from "@/components/autocomplete/autocomplete-charge"
import ConsignmentTypeAutocomplete from "@/components/autocomplete/autocomplete-consignmenttype"
import LandingTypeAutocomplete from "@/components/autocomplete/autocomplete-landingtype"
import ServiceModeAutocomplete from "@/components/autocomplete/autocomplete-servicemode"
import TaskStatusAutocomplete from "@/components/autocomplete/autocomplete-status-task"
import UomAutocomplete from "@/components/autocomplete/autocomplete-uom"
import VesselAutocomplete from "@/components/autocomplete/autocomplete-vessel"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface FreightFormProps {
  companyId: number
  initialData?: IFreight
  submitAction: (data: FreightSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
  isEditMode?: boolean
}

export function FreightForm({
  companyId,
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
  isEditMode = false,
}: FreightFormProps) {
  const { decimals } = useAuthStore()

  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const parseWithFallback = useCallback(
    (value: string | Date | null | undefined): Date | null => {
      if (!value) return null
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value
      }

      if (typeof value !== "string") return null

      const parsed = parse(value, dateFormat, new Date())
      if (isValid(parsed)) {
        return parsed
      }

      return parseDate(value)
    },
    [dateFormat]
  )

  const form = useForm<FreightSchemaType>({
    resolver: zodResolver(FreightSchema),
    defaultValues: {
      consignmentImportId: initialData?.consignmentImportId,
      companyId: companyId,
      companyCode: initialData?.companyCode,
      jobOrderId: initialData?.jobOrderId ?? 0,
      jobOrderNo: initialData?.jobOrderNo ?? "",
      referenceNo: initialData?.referenceNo ?? "",
      vesselName: initialData?.vesselName ?? "",
      vesselId: initialData?.vesselId ?? 0,
      awbNo: initialData?.awbNo ?? "",
      declarationNo: initialData?.declarationNo ?? "",
      billEntryNo: initialData?.billEntryNo ?? "",
      receiveDate: initialData?.receiveDate
        ? format(
            parseWithFallback(initialData.receiveDate as string) || new Date(),
            dateFormat
          )
        : undefined,
      arrivalDate: initialData?.arrivalDate
        ? format(
            parseWithFallback(initialData.arrivalDate as string) || new Date(),
            dateFormat
          )
        : undefined,
      deliverDate: initialData?.deliverDate
        ? format(
            parseWithFallback(initialData.deliverDate as string) || new Date(),
            dateFormat
          )
        : undefined,
      noOfPcs: initialData?.noOfPcs ?? null,
      weight: initialData?.weight ?? null,
      clearedBy: initialData?.clearedBy ?? "",
      amountDeposited: initialData?.amountDeposited ?? null,
      remarks: initialData?.remarks ?? "",
      description: initialData?.description ?? "",
      carrierId: initialData?.carrierId ?? null,
      carrierName: initialData?.carrierName ?? "",
      refundInstrumentNo: initialData?.refundInstrumentNo ?? "",
      taskId: initialData?.taskId ?? null,
      poNo: initialData?.poNo ?? "",
      chargeId: initialData?.chargeId ?? 0,
      chargeName: initialData?.chargeName ?? "",
      serviceModeId: initialData?.serviceModeId ?? null,
      serviceModeName: initialData?.serviceModeName ?? "",
      consignmentTypeId: initialData?.consignmentTypeId ?? null,
      consignmentTypeName: initialData?.consignmentTypeName ?? "",
      landingTypeId: initialData?.landingTypeId ?? null,
      landingTypeName: initialData?.landingTypeName ?? "",
      pickupLocation: initialData?.pickupLocation ?? "",
      deliveryLocation: initialData?.deliveryLocation ?? "",
      uomId: initialData?.uomId ?? null,
      uomName: initialData?.uomName ?? "",
      debitNoteId: initialData?.debitNoteId ?? null,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      taskStatusId: initialData?.taskStatusId ?? 0,
      taskStatusName: initialData?.taskStatusName ?? "",
      editVersion: initialData?.editVersion,
    },
  })

  useEffect(() => {
    form.reset({
      consignmentImportId: initialData?.consignmentImportId,
      companyId: companyId,
      companyCode: initialData?.companyCode,
      jobOrderId: initialData?.jobOrderId ?? 0,
      jobOrderNo: initialData?.jobOrderNo ?? "",
      referenceNo: initialData?.referenceNo ?? "",
      vesselName: initialData?.vesselName ?? "",
      vesselId: initialData?.vesselId ?? 0,
      awbNo: initialData?.awbNo ?? "",
      declarationNo: initialData?.declarationNo ?? "",
      billEntryNo: initialData?.billEntryNo ?? "",
      receiveDate: initialData?.receiveDate
        ? format(
            parseWithFallback(initialData.receiveDate as string) || new Date(),
            dateFormat
          )
        : undefined,
      arrivalDate: initialData?.arrivalDate
        ? format(
            parseWithFallback(initialData.arrivalDate as string) || new Date(),
            dateFormat
          )
        : undefined,
      deliverDate: initialData?.deliverDate
        ? format(
            parseWithFallback(initialData.deliverDate as string) || new Date(),
            dateFormat
          )
        : undefined,
      noOfPcs: initialData?.noOfPcs ?? null,
      weight: initialData?.weight ?? null,
      clearedBy: initialData?.clearedBy ?? "",
      amountDeposited: initialData?.amountDeposited ?? null,
      remarks: initialData?.remarks ?? "",
      description: initialData?.description ?? "",
      carrierId: initialData?.carrierId ?? null,
      carrierName: initialData?.carrierName ?? "",
      refundInstrumentNo: initialData?.refundInstrumentNo ?? "",
      taskId: initialData?.taskId ?? null,
      poNo: initialData?.poNo ?? "",
      chargeId: initialData?.chargeId ?? 0,
      chargeName: initialData?.chargeName ?? "",
      serviceModeId: initialData?.serviceModeId ?? null,
      serviceModeName: initialData?.serviceModeName ?? "",
      consignmentTypeId: initialData?.consignmentTypeId ?? null,
      consignmentTypeName: initialData?.consignmentTypeName ?? "",
      landingTypeId: initialData?.landingTypeId ?? null,
      landingTypeName: initialData?.landingTypeName ?? "",
      pickupLocation: initialData?.pickupLocation ?? "",
      deliveryLocation: initialData?.deliveryLocation ?? "",
      uomId: initialData?.uomId ?? null,
      uomName: initialData?.uomName ?? "",
      debitNoteId: initialData?.debitNoteId ?? null,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      taskStatusId: initialData?.taskStatusId ?? 0,
      taskStatusName: initialData?.taskStatusName ?? "",
      editVersion: initialData?.editVersion,
    })
  }, [dateFormat, form, initialData, companyId, parseWithFallback])


  const onSubmit = (data: FreightSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error("Form validation errors:", errors)
          })}
        >
          <div className="grid gap-4">
            {/* Section 1: JobOrder, Vessel, Task, Charges, UOM, TaskStatus - Display as Badges */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Basic Information</h3>
              {/* Hidden fields to preserve IDs for form submission */}
              <input type="hidden" {...form.register("jobOrderId")} />
              <input type="hidden" {...form.register("vesselId")} />
              <input type="hidden" {...form.register("taskId")} />
              <input type="hidden" {...form.register("chargeId")} />
              <input type="hidden" {...form.register("uomId")} />
              <input type="hidden" {...form.register("taskStatusId")} />
              
              <div className="grid grid-cols-6 gap-4">
                {/* Job Order */}
                <FormField
                  control={form.control}
                  name="jobOrderNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Order</FormLabel>
                      <div>
                        <Badge
                          variant="secondary"
                          className="w-full justify-center px-4 py-2 text-sm font-medium"
                        >
                          {field.value || "-"}
                        </Badge>
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* Vessel */}
                <FormField
                  control={form.control}
                  name="vesselName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vessel</FormLabel>
                      <div>
                        <Badge
                          variant="secondary"
                          className="w-full justify-center px-4 py-2 text-sm font-medium"
                        >
                          {field.value || "-"}
                        </Badge>
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* Task */}
                <FormField
                  control={form.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task</FormLabel>
                      <div>
                        <Badge
                          variant="secondary"
                          className="w-full justify-center px-4 py-2 text-sm font-medium"
                        >
                          {field.value || "-"}
                        </Badge>
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* Charges */}
                <FormField
                  control={form.control}
                  name="chargeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charges</FormLabel>
                      <div>
                        <Badge
                          variant="secondary"
                          className="w-full justify-center px-4 py-2 text-sm font-medium"
                        >
                          {field.value || "-"}
                        </Badge>
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* UOM */}
                <FormField
                  control={form.control}
                  name="uomName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UOM</FormLabel>
                      <div>
                        <Badge
                          variant="secondary"
                          className="w-full justify-center px-4 py-2 text-sm font-medium"
                        >
                          {field.value || "-"}
                        </Badge>
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* Task Status */}
                <FormField
                  control={form.control}
                  name="taskStatusName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Status</FormLabel>
                      <div>
                        <Badge
                          variant="secondary"
                          className="w-full justify-center px-4 py-2 text-sm font-medium"
                        >
                          {field.value || "-"}
                        </Badge>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Remaining Fields */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Additional Details</h3>
              <div className="grid grid-cols-5 gap-2">
                <CustomInput
                  form={form}
                  name="referenceNo"
                  label="Reference No"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="awbNo"
                  label="AWB No"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="declarationNo"
                  label="Declaration No"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="billEntryNo"
                  label="Bill Entry No"
                  isDisabled={isConfirmed}
                />
                <CustomDateNew
                  form={form}
                  name="receiveDate"
                  label="Receive Date"
                  isDisabled={isConfirmed}
                  isFutureShow={true}
                />
                <CustomDateNew
                  form={form}
                  name="arrivalDate"
                  label="Arrival Date"
                  isDisabled={isConfirmed}
                  isFutureShow={true}
                />
                <CustomDateNew
                  form={form}
                  name="deliverDate"
                  label="Delivery Date"
                  isDisabled={isConfirmed}
                  isFutureShow={true}
                />
                <CustomNumberInput
                  form={form}
                  name="noOfPcs"
                  label="No of Pcs"
                  isDisabled={isConfirmed}
                />
                <CustomNumberInput
                  form={form}
                  name="weight"
                  label="Weight"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="clearedBy"
                  label="Cleared By"
                  isDisabled={isConfirmed}
                />
                <CustomNumberInput
                  form={form}
                  name="amountDeposited"
                  label="Amount Deposited"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="poNo"
                  label="PO No"
                  isDisabled={isConfirmed}
                />
                <CarrierAutocomplete
                  form={form}
                  name="carrierId"
                  label="Carrier"
                  isDisabled={isConfirmed}
                />
                <ServiceModeAutocomplete
                  form={form}
                  name="serviceModeId"
                  label="Service Mode"
                  isDisabled={isConfirmed}
                />
                <ConsignmentTypeAutocomplete
                  form={form}
                  name="consignmentTypeId"
                  label="Consignment Type"
                  isDisabled={isConfirmed}
                />
                <LandingTypeAutocomplete
                  form={form}
                  name="landingTypeId"
                  label="Landing Type"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="pickupLocation"
                  label="Pickup Location"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="deliveryLocation"
                  label="Delivery Location"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="refundInstrumentNo"
                  label="Refund Instrument No"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="debitNoteNo"
                  label="Debit Note No"
                  isDisabled={isConfirmed}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
            <CustomTextarea
              form={form}
              name="description"
              label="Description"
              isDisabled={isConfirmed}
            />
            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isConfirmed}
            />
            </div>
          </div>
          {!isConfirmed && (
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancelAction}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
