"use client"

import { useCallback, useEffect, useMemo } from "react"
import { IJobOrderHd, IPortExpenses } from "@/interfaces/checklist"
import { PortExpensesSchema, PortExpensesSchemaType } from "@/schemas/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { useSupplierLookup } from "@/hooks/use-lookup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  ChargeAutocomplete,
  SupplierAutocomplete,
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

interface PortExpensesFormProps {
  jobData: IJobOrderHd
  initialData?: IPortExpenses
  taskDefaults?: Record<string, number> // Add taskDefaults prop
  submitAction: (data: PortExpensesSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
}

export function PortExpensesForm({
  jobData,
  initialData,
  taskDefaults = {}, // Default to empty object
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
}: PortExpensesFormProps) {
  const { decimals } = useAuthStore()
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

  // Get supplier data to ensure it's loaded before setting form values
  const { isLoading: isSupplierLoading } = useSupplierLookup()

  const form = useForm<PortExpensesSchemaType>({
    resolver: zodResolver(PortExpensesSchema),
    defaultValues: {
      portExpenseId: initialData?.portExpenseId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      quantity: initialData?.quantity ?? 1,
      supplierId: initialData?.supplierId ?? 0,
      // Use task defaults when no initial data
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,
      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      uomId: initialData?.uomId ?? taskDefaults.uomId ?? 0,

      deliverDate: initialData?.deliverDate
        ? format(
            parseWithFallback(initialData.deliverDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      remarks: initialData?.remarks ?? "",
      editVersion: initialData?.editVersion ?? 0,
    },
  })

  useEffect(() => {
    // Only reset form when data is loaded to prevent race conditions
    if (!isSupplierLoading) {
      form.reset({
        portExpenseId: initialData?.portExpenseId ?? 0,
        jobOrderId: jobData.jobOrderId,
        jobOrderNo: jobData.jobOrderNo,
        quantity: initialData?.quantity ?? 1,
        supplierId: initialData?.supplierId ?? 0,
        // Use task defaults when no initial data
        chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,
        taskStatusId:
          initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
        uomId: initialData?.uomId ?? taskDefaults.uomId ?? 0,
        deliverDate: initialData?.deliverDate
          ? format(
              parseWithFallback(initialData.deliverDate as string) ||
                new Date(),
              dateFormat
            )
          : format(new Date(), dateFormat),
        debitNoteId: initialData?.debitNoteId ?? 0,
        debitNoteNo: initialData?.debitNoteNo ?? "",
        poNo: initialData?.poNo ?? "",
        remarks: initialData?.remarks ?? "",
        editVersion: initialData?.editVersion ?? 0,
      })
    }
  }, [
    dateFormat,
    form,
    initialData,
    isSupplierLoading,
    jobData.jobOrderId,
    jobData.jobOrderNo,
    parseWithFallback,
    taskDefaults,
  ])

  const onSubmit = (data: PortExpensesSchemaType) => {
    submitAction(data)
  }

  // // Show loading state while data is being fetched
  // if (isSupplierLoading) {
  //   return (
  //     <div className="max-w flex flex-col gap-2">
  //       <FormLoadingSpinner text="Loading form data..." />
  //     </div>
  //   )
  // }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <SupplierAutocomplete
                form={form}
                name="supplierId"
                label="Supplier Name"
                isRequired={true}
                isDisabled={isConfirmed}
              />
              <ChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge Name"
                isRequired={true}
                isDisabled={isConfirmed}
              />

              <UomAutocomplete
                key={`uom-${jobData.companyId}`}
                form={form}
                name="uomId"
                label="UOM"
                isRequired={true}
                isDisabled={isConfirmed}
              />
              <CustomNumberInput
                form={form}
                name="quantity"
                label="Quantity"
                isRequired
                isDisabled={isConfirmed}
              />
              <CustomDateNew
                form={form}
                name="deliverDate"
                label="Deliver Date"
                isRequired={true}
                isDisabled={isConfirmed}
                isFutureShow={true}
              />
              <CustomInput
                form={form}
                name="poNo"
                label="PO No"
                isDisabled={isConfirmed}
              />
              <TaskStatusAutocomplete
                key={`status-${jobData.companyId}`}
                form={form}
                name="taskStatusId"
                label="Status"
                isRequired={true}
                isDisabled={isConfirmed}
              />
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isConfirmed}
            />

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
                    ? "Update Port Expense"
                    : "Add Port Expense"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
