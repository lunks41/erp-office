"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useCallback, useEffect, useMemo } from "react"
import { IConsignmentExport, IJobOrderHd } from "@/interfaces/checklist"
import {
  ConsignmentExportSchema,
  ConsignmentExportSchemaType,
} from "@/schemas/checklist"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { Task } from "@/lib/operations-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  CarrierAutocomplete,
  ChargeAutocomplete,
  ConsignmentTypeAutocomplete,
  LandingTypeAutocomplete,
  ServiceModeAutocomplete,
  TaskStatusAutocomplete,
  UomAutocomplete,
} from "@/components/autocomplete"
import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface ConsignmentExportFormProps {
  jobData: IJobOrderHd
  initialData?: IConsignmentExport
  taskDefaults?: Record<string, number> // Add taskDefaults prop
  submitAction: (data: ConsignmentExportSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
}

export function ConsignmentExportForm({
  jobData,
  initialData,
  taskDefaults = {}, // Default to empty object
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
}: ConsignmentExportFormProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

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

  const form = useForm<ConsignmentExportSchemaType>({
    resolver: zodResolver(ConsignmentExportSchema),
    defaultValues: {
      consignmentExportId: initialData?.consignmentExportId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.ConsignmentExport,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,

      awbNo: initialData?.awbNo ?? "",
      carrierId: initialData?.carrierId ?? taskDefaults.carrierId ?? 0,
      uomId: initialData?.uomId ?? taskDefaults.uomId ?? 0,
      serviceModeId:
        initialData?.serviceModeId ?? taskDefaults.serviceModeId ?? 0,
      consignmentTypeId:
        initialData?.consignmentTypeId ?? taskDefaults.consignmentTypeId ?? 0,
      landingTypeId:
        initialData?.landingTypeId ?? taskDefaults.landingTypeId ?? 0,
      noOfPcs: initialData?.noOfPcs ?? 1,
      weight: initialData?.weight ?? 0,
      pickupLocation: initialData?.pickupLocation ?? "",
      deliveryLocation: initialData?.deliveryLocation ?? "",
      clearedBy: initialData?.clearedBy ?? "",
      billEntryNo: initialData?.billEntryNo ?? "",
      declarationNo: initialData?.declarationNo ?? "",
      referenceNo: initialData?.referenceNo ?? "",
      receiveDate: initialData?.receiveDate
        ? format(
            parseWithFallback(initialData.receiveDate as string) || new Date(),
            dateFormat
          )
        : "",
      deliverDate: initialData?.deliverDate
        ? format(
            parseWithFallback(initialData.deliverDate as string) || new Date(),
            dateFormat
          )
        : "",
      arrivalDate: initialData?.arrivalDate
        ? format(
            parseWithFallback(initialData.arrivalDate as string) || new Date(),
            dateFormat
          )
        : "",
      amountDeposited: initialData?.amountDeposited ?? 0,
      refundInstrumentNo: initialData?.refundInstrumentNo ?? "",
      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      remarks: initialData?.remarks ?? "",
      description: initialData?.description ?? "",
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      isCleared: initialData?.isCleared ?? false,
      existPortCustom: initialData?.existPortCustom ?? "",
      editVersion: initialData?.editVersion ?? 0,
    },
  })

  useEffect(() => {
    form.reset({
      consignmentExportId: initialData?.consignmentExportId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.ConsignmentExport,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,

      awbNo: initialData?.awbNo ?? "",
      carrierId: initialData?.carrierId ?? taskDefaults.carrierId ?? 0,
      uomId: initialData?.uomId ?? taskDefaults.uomId ?? 0,
      serviceModeId:
        initialData?.serviceModeId ?? taskDefaults.serviceModeId ?? 0,
      consignmentTypeId:
        initialData?.consignmentTypeId ?? taskDefaults.consignmentTypeId ?? 0,
      landingTypeId:
        initialData?.landingTypeId ?? taskDefaults.landingTypeId ?? 0,
      noOfPcs: initialData?.noOfPcs ?? 1,
      weight: initialData?.weight ?? 0,
      pickupLocation: initialData?.pickupLocation ?? "",
      deliveryLocation: initialData?.deliveryLocation ?? "",
      clearedBy: initialData?.clearedBy ?? "",
      billEntryNo: initialData?.billEntryNo ?? "",
      declarationNo: initialData?.declarationNo ?? "",
      referenceNo: initialData?.referenceNo ?? "",
      receiveDate: initialData?.receiveDate
        ? format(
            parseWithFallback(initialData.receiveDate as string) || new Date(),
            dateFormat
          )
        : "",
      deliverDate: initialData?.deliverDate
        ? format(
            parseWithFallback(initialData.deliverDate as string) || new Date(),
            dateFormat
          )
        : "",
      arrivalDate: initialData?.arrivalDate
        ? format(
            parseWithFallback(initialData.arrivalDate as string) || new Date(),
            dateFormat
          )
        : "",
      amountDeposited: initialData?.amountDeposited ?? 0,
      refundInstrumentNo: initialData?.refundInstrumentNo ?? "",
      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      remarks: initialData?.remarks ?? "",
      description: initialData?.description ?? "",
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      isCleared: initialData?.isCleared ?? false,
      existPortCustom: initialData?.existPortCustom ?? "",
      editVersion: initialData?.editVersion ?? 0,
    })
  }, [
    dateFormat,
    form,
    initialData,
    jobData.jobOrderId,
    jobData.jobOrderNo,
    parseWithFallback,
    taskDefaults,
  ])

  // Show loading state while data is being fetched

  const onSubmit = (data: ConsignmentExportSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <div className="grid grid-cols-5 gap-2">
              <CustomInput
                form={form}
                name="awbNo"
                label="AWB Number"
                isRequired={true}
                isDisabled={isConfirmed}
              />

              <CarrierAutocomplete
                form={form}
                name="carrierId"
                label="Carrier"
                isRequired={true}
                isDisabled={isConfirmed}
              />

              <CustomNumberInput
                form={form}
                name="noOfPcs"
                label="Number of Pieces"
                isRequired={true}
                isDisabled={isConfirmed}
              />
              <CustomNumberInput
                form={form}
                name="weight"
                label="Weight"
                isRequired={true}
                isDisabled={isConfirmed}
              />
              <UomAutocomplete
                form={form}
                name="uomId"
                label="UOM"
                isRequired={true}
                isDisabled={isConfirmed}
              />
              <CustomDateNew
                form={form}
                name="arrivalDate"
                label="Date Arrived"
                isDisabled={isConfirmed}
                isFutureShow={true}
              />

              <CustomDateNew
                form={form}
                name="receiveDate"
                label="Date Received"
                isDisabled={isConfirmed}
                isFutureShow={true}
              />
              <ConsignmentTypeAutocomplete
                form={form}
                name="consignmentTypeId"
                label="Consignment Type"
                isRequired={true}
                isDisabled={isConfirmed}
              />
              <ServiceModeAutocomplete
                form={form}
                name="serviceModeId"
                label="service Mode"
                isDisabled={isConfirmed}
              />

              <LandingTypeAutocomplete
                form={form}
                name="landingTypeId"
                label="Landing Type"
                isDisabled={isConfirmed}
              />
              <ChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge"
                isRequired={true}
                isDisabled={isConfirmed}
              />

              <CustomInput
                form={form}
                name="referenceNo"
                label="Reference No"
                isRequired={false}
                isDisabled={isConfirmed}
              />

              <CustomInput
                form={form}
                name="poNo"
                label="PO No"
                isDisabled={isConfirmed}
              />
              <TaskStatusAutocomplete
                form={form}
                name="taskStatusId"
                label="Status"
                isRequired={true}
                isDisabled={isConfirmed}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
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
              <CustomTextarea
                form={form}
                name="pickupLocation"
                label="Pickup Location"
                isDisabled={isConfirmed}
              />
              <CustomTextarea
                form={form}
                name="deliveryLocation"
                label="Delivery Location"
                isDisabled={isConfirmed}
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              <CustomDateNew
                form={form}
                name="deliverDate"
                label="Date Delivered"
                isDisabled={isConfirmed}
                isFutureShow={true}
              />
              <CustomInput
                form={form}
                name="clearedBy"
                label="Cleared By"
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="billEntryNo"
                label="Bill Entry No"
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="declarationNo"
                label="Declaration No"
                isDisabled={isConfirmed}
              />

              <CustomNumberInput
                form={form}
                name="amountDeposited"
                label="Amount Deposited"
                round={amtDec}
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
                name="existPortCustom"
                label="Exist Port Custom"
                isDisabled={isConfirmed}
              />
            
              <CustomSwitch
                form={form}
                name="isCleared"
                label="Is Cleared"
                isDisabled={isConfirmed}
              />
            </div>

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
                      className="bg-muted/30 rounded-lg border-0"
                    >
                      <CustomAccordionItem
                        value="audit-info"
                        className="border-none"
                      >
                        <CustomAccordionTrigger className="hover:bg-muted/50 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                              Audit Trail
                            </span>
                            <div className="flex items-center gap-2">
                              {initialData.createDate && (
                                <Badge
                                  variant="secondary"
                                  className="px-2 py-1 text-xs"
                                >
                                  Created
                                </Badge>
                              )}
                              {initialData.editDate && (
                                <Badge
                                  variant="secondary"
                                  className="px-2 py-1 text-xs"
                                >
                                  Modified
                                </Badge>
                              )}
                              {initialData.editVersion > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="px-2 py-1 text-xs"
                                >
                                  Edit Version No. {initialData.editVersion}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CustomAccordionTrigger>
                        <CustomAccordionContent className="px-4 pb-4">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {initialData.createDate && (
                              <div className="bg-background rounded-md border p-2">
                                <div className="space-y-1">
                                  <p className="text-muted-foreground text-xs">
                                    Created By
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {initialData.createBy}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {format(
                                      new Date(initialData.createDate),
                                      datetimeFormat
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                            {initialData.editBy && (
                              <div className="bg-background rounded-md border p-2">
                                <div className="space-y-1">
                                  <p className="text-muted-foreground text-xs">
                                    Modified By
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {initialData.editBy}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {initialData.editDate
                                      ? format(
                                          new Date(initialData.editDate),
                                          datetimeFormat
                                        )
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CustomAccordionContent>
                      </CustomAccordionItem>
                    </CustomAccordion>
                  </div>
                </div>
              )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onCancelAction}>
              {isConfirmed ? "Close" : "Cancel"}
            </Button>
            {!isConfirmed && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className={
                  initialData
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
                }
              >
                {isSubmitting
                  ? "Saving..."
                  : initialData
                    ? "Update Consignment Export"
                    : "Add Consignment Export"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
