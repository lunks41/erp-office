"use client"

import { useCallback, useEffect, useMemo } from "react"
import { IEquipmentUsed, IJobOrderHd } from "@/interfaces/checklist"
import {
  EquipmentUsedSchema,
  EquipmentUsedSchemaType,
} from "@/schemas/checklist"
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
} from "@/components/autocomplete"
import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface EquipmentUsedFormProps {
  jobData: IJobOrderHd
  initialData?: IEquipmentUsed
  taskDefaults?: Record<string, number> // Add taskDefaults prop
  submitAction: (data: EquipmentUsedSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
}

export function EquipmentUsedForm({
  jobData,
  initialData,
  taskDefaults = {}, // Default to empty object
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
}: EquipmentUsedFormProps) {
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

  const form = useForm<EquipmentUsedSchemaType>({
    resolver: zodResolver(EquipmentUsedSchema),
    defaultValues: {
      equipmentUsedId: initialData?.equipmentUsedId ?? 0,
      date: initialData?.date
        ? format(
            parseWithFallback(initialData.date as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.EquipmentUsed,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,

      referenceNo: initialData?.referenceNo ?? "",
      mafi: initialData?.mafi ?? "",
      others: initialData?.others ?? "",
      forkliftChargeId:
        initialData?.forkliftChargeId ?? taskDefaults.forkliftChargeId ?? 0,
      craneChargeId:
        initialData?.craneChargeId ?? taskDefaults.craneChargeId ?? 0,
      stevedoreChargeId:
        initialData?.stevedoreChargeId ?? taskDefaults.stevedoreChargeId ?? 0,
      loadingRefNo: initialData?.loadingRefNo ?? "",
      craneloading: initialData?.craneloading ?? 0,
      forkliftloading: initialData?.forkliftloading ?? 0,
      stevedoreloading: initialData?.stevedoreloading ?? 0,
      offloadingRefNo: initialData?.offloadingRefNo ?? "",
      craneOffloading: initialData?.craneOffloading ?? 0,
      forkliftOffloading: initialData?.forkliftOffloading ?? 0,
      stevedoreOffloading: initialData?.stevedoreOffloading ?? 0,
      remarks: initialData?.remarks ?? "",
      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      isNotes: initialData?.isNotes ?? false,
      notes:
        initialData?.notes ?? "Minimum 3 Hours, including mob -demob charges",
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      editVersion: initialData?.editVersion ?? 0,
    },
  })

  // Watch the isNotes field to control notes field disabled state
  const isNotes = form.watch("isNotes")

  useEffect(() => {
    form.reset({
      equipmentUsedId: initialData?.equipmentUsedId ?? 0,
      date: initialData?.date
        ? format(
            parseWithFallback(initialData.date as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.EquipmentUsed,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,

      referenceNo: initialData?.referenceNo ?? "",
      mafi: initialData?.mafi ?? "",
      others: initialData?.others ?? "",
      forkliftChargeId:
        initialData?.forkliftChargeId ?? taskDefaults.forkliftChargeId ?? 0,
      craneChargeId:
        initialData?.craneChargeId ?? taskDefaults.craneChargeId ?? 0,
      stevedoreChargeId:
        initialData?.stevedoreChargeId ?? taskDefaults.stevedoreChargeId ?? 0,
      loadingRefNo: initialData?.loadingRefNo ?? "",
      craneloading: initialData?.craneloading ?? 0,
      forkliftloading: initialData?.forkliftloading ?? 0,
      stevedoreloading: initialData?.stevedoreloading ?? 0,
      offloadingRefNo: initialData?.offloadingRefNo ?? "",
      craneOffloading: initialData?.craneOffloading ?? 0,
      forkliftOffloading: initialData?.forkliftOffloading ?? 0,
      stevedoreOffloading: initialData?.stevedoreOffloading ?? 0,
      remarks: initialData?.remarks ?? "",
      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      isNotes: initialData?.isNotes ?? false,
      notes:
        initialData?.notes ?? "Minimum 3 Hours, including mob -demob charges",
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
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

  const onSubmit = (data: EquipmentUsedSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <div className="grid grid-cols-4 gap-2">
              <CustomDateNew
                form={form}
                name="date"
                label="Date"
                isRequired={true}
                isDisabled={isConfirmed}
                isFutureShow={true}
              />
              <CustomInput
                form={form}
                name="referenceNo"
                label="Reference Number"
                isRequired
                isDisabled={isConfirmed}
              />
              <ChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge Name"
                isRequired={true}
                isDisabled={isConfirmed}
              />

              <CustomInput
                form={form}
                name="mafi"
                label="MAFI"
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="others"
                label="Others"
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

            {/* Updated Charges Section - Matches your image */}
            <div className="grid grid-cols-4 gap-4">
              {/*   TallySheet No Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-center font-bold">TallySheet No</h3>

                <CustomInput
                  form={form}
                  name="loadingRefNo"
                  label="Loading TallySheet No"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="offloadingRefNo"
                  label="Offloading TallySheet No"
                  isDisabled={isConfirmed}
                />
              </div>
              {/* Crane Charge Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-center font-bold">Crane Hire Charges</h3>
                <ChargeAutocomplete
                  form={form}
                  name="craneChargeId"
                  label="Crane Charge"
                  isDisabled={isConfirmed}
                />
                <CustomNumberInput
                  form={form}
                  name="craneloading"
                  label="Crane Loading (hr)"
                  isDisabled={isConfirmed}
                />
                <CustomNumberInput
                  form={form}
                  name="craneOffloading"
                  label="Crane Offloading (hr)"
                  isDisabled={isConfirmed}
                />
              </div>

              {/* Forklift Charge Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-center font-bold">ForkLift Charge</h3>
                <ChargeAutocomplete
                  form={form}
                  name="forkliftChargeId"
                  label="ForkLift Charge"
                  isDisabled={isConfirmed}
                />
                <CustomNumberInput
                  form={form}
                  name="forkliftloading"
                  label="ForkLift Loading (hr)"
                  isDisabled={isConfirmed}
                />
                <CustomNumberInput
                  form={form}
                  name="forkliftOffloading"
                  label="ForkLift OffLoading (hr)"
                  isDisabled={isConfirmed}
                />
              </div>

              {/* Stevedore Charge Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-center font-bold">Stevedor Charge</h3>
                <ChargeAutocomplete
                  form={form}
                  name="stevedoreChargeId"
                  label="Stevedore Charge"
                  isDisabled={isConfirmed}
                />
                <CustomNumberInput
                  form={form}
                  name="stevedoreloading"
                  label="Stevedor Loading (Nos)"
                  isDisabled={isConfirmed}
                />
                <CustomNumberInput
                  form={form}
                  name="stevedoreOffloading"
                  label="Stevedor OffLoad (Nos)"
                  isDisabled={isConfirmed}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <CustomTextarea
                  form={form}
                  name="remarks"
                  label="Remarks"
                  isDisabled={isConfirmed}
                />
              </div>
              <div className="col-span-2 flex w-full gap-2">
                <div className="w-1/3">
                  <CustomCheckbox
                    form={form}
                    name="isNotes"
                    label="Is Notes"
                    isDisabled={isConfirmed}
                  />
                </div>
                <div className="w-2/3">
                  <CustomTextarea
                    form={form}
                    name="notes"
                    label="Notes"
                    isDisabled={isConfirmed || !isNotes}
                  />
                </div>
              </div>
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
                    ? "Update Equipment Used"
                    : "Add Equipment Used"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
