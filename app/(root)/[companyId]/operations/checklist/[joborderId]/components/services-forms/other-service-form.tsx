"use client"

import { useCallback, useEffect, useMemo } from "react"
import { IJobOrderHd, IOtherService } from "@/interfaces/checklist"
import { IChargeLookup } from "@/interfaces/lookup"
import { OtherServiceSchema, OtherServiceSchemaType } from "@/schemas/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { Task } from "@/lib/operations-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  ChargeAutocomplete,
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
import CustomTextarea from "@/components/custom/custom-textarea"

interface OtherServiceFormProps {
  jobData: IJobOrderHd
  initialData?: IOtherService
  taskDefaults?: Record<string, number> // Add taskDefaults prop
  submitAction: (data: OtherServiceSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
}

export function OtherServiceForm({
  jobData,
  initialData,
  taskDefaults = {}, // Default to empty object
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
}: OtherServiceFormProps) {
  const { decimals } = useAuthStore()
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

  const form = useForm<OtherServiceSchemaType>({
    resolver: zodResolver(OtherServiceSchema),
    defaultValues: {
      otherServiceId: initialData?.otherServiceId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.OtherService,
      date: initialData?.date
        ? format(
            parseWithFallback(initialData.date as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,

      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      uomId: initialData?.uomId ?? taskDefaults.uomId ?? 0,
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      serviceProvider: initialData?.serviceProvider ?? "",
      quantity: initialData?.quantity ?? 1,
      amount: initialData?.amount ?? 0,
      remarks: initialData?.remarks ?? "",
      description: initialData?.description ?? "",
      editVersion: initialData?.editVersion ?? 0,
    },
  })

  // Handle charge selection change
  const handleChargeChange = (charge: IChargeLookup | null) => {
    if (charge) {
      // Check if charge name contains "Cash to master" (case-insensitive)
      const isCashToMasterCharge = charge.chargeName
        .toLowerCase()
        .includes("cash to master")
      // If it's a "Cash to master" charge, set quantity to 1 and clear amount
      if (isCashToMasterCharge) {
        form.setValue("quantity", 1)
        form.setValue("amount", 0)
      } else {
        // For other charges, set amount to 0 and keep quantity as is
        form.setValue("amount", 0)
      }
    }
  }

  useEffect(() => {
    form.reset({
      otherServiceId: initialData?.otherServiceId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.OtherService,
      date: initialData?.date
        ? format(
            parseWithFallback(initialData.date as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,

      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      uomId: initialData?.uomId ?? taskDefaults.uomId ?? 0,
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      serviceProvider: initialData?.serviceProvider ?? "",
      quantity: initialData?.quantity ?? 1,
      amount: initialData?.amount ?? 0,
      remarks: initialData?.remarks ?? "",
      description: initialData?.description ?? "",
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

  const onSubmit = (data: OtherServiceSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                form={form}
                name="serviceProvider"
                label="Service Provider"
                isRequired
                isDisabled={isConfirmed}
              />
              <ChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge"
                isRequired={true}
                isDisabled={isConfirmed}
                onChangeEvent={handleChargeChange}
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
                name="date"
                label="Service Date"
                isRequired={true}
                isDisabled={isConfirmed}
                isFutureShow={true}
              />

              <CustomNumberInput
                form={form}
                name="quantity"
                label="Quantity"
                isRequired
                isDisabled={isConfirmed}
              />
              <CustomNumberInput
                form={form}
                name="amount"
                label="CTM|Amount"
                round={amtDec}
                isRequired
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
                    ? "Update Other Service"
                    : "Add Other Service"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
