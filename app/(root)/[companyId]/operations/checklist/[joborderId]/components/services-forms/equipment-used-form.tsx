"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  applyLegacySummaryFromDetails,
  buildEquipmentUsedDetailsFromApi,
  countEquipmentUsedLinesByType,
} from "@/helpers/equipment-used-details"
import { IEquipmentUsed, IJobOrderHd } from "@/interfaces/checklist"
import {
  EquipmentUsedSchema,
  EquipmentUsedSchemaType,
} from "@/schemas/checklist"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { Plus, Trash2 } from "lucide-react"
import { Resolver, useFieldArray, useForm } from "react-hook-form"

import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { Task } from "@/lib/operations-utils"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  BargeAutocomplete,
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
  const { decimals } = useCompanyStore()
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
    resolver: zodResolver(EquipmentUsedSchema) as Resolver<
      EquipmentUsedSchemaType,
      unknown,
      EquipmentUsedSchemaType
    >,
    defaultValues: {
      equipmentUsedId: initialData?.equipmentUsedId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.EquipmentUsed,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,
      others: initialData?.others ?? "",
      providerName: initialData?.providerName ?? "",
      bargeId: initialData?.bargeId ?? 0,
      ameTally: initialData?.ameTally ?? "",
      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      isNotes: initialData?.isNotes ?? false,
      notes:
        initialData?.notes ?? "Minimum 3 Hours, including mob -demob charges",
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      editVersion: initialData?.editVersion ?? 0,
      details: buildEquipmentUsedDetailsFromApi(initialData),
      isLoading: false,
      isOffloading: false,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "details",
  })

  const [lineFilter, setLineFilter] = useState<
    "all" | "loading" | "offloading"
  >("all")

  const isNotes = form.watch("isNotes")
  const watchedDetails = form.watch("details")

  const visibleDetailRows = useMemo(() => {
    const details = watchedDetails ?? []
    return details
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (lineFilter === "loading") return !row.isOffloading
        if (lineFilter === "offloading") return row.isOffloading
        return true
      })
      .sort(
        (a, b) =>
          Number(a.row.isOffloading) - Number(b.row.isOffloading) ||
          a.index - b.index
      )
  }, [watchedDetails, lineFilter])

  const lineCounts = useMemo(
    () => countEquipmentUsedLinesByType(watchedDetails ?? []),
    [watchedDetails]
  )

  const detailsError = form.formState.errors.details?.message

  useEffect(() => {
    const details = buildEquipmentUsedDetailsFromApi(initialData)
    form.reset({
      equipmentUsedId: initialData?.equipmentUsedId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.EquipmentUsed,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,
      others: initialData?.others ?? "",
      providerName: initialData?.providerName ?? "",
      bargeId: initialData?.bargeId ?? 0,
      ameTally: initialData?.ameTally ?? "",
      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      isNotes: initialData?.isNotes ?? false,
      notes:
        initialData?.notes ?? "Minimum 3 Hours, including mob -demob charges",
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      editVersion: initialData?.editVersion ?? 0,
      details,
      isLoading: details.some((d) => !d.isOffloading),
      isOffloading: details.some((d) => d.isOffloading),
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
    const details = data.details ?? []
    submitAction(
      applyLegacySummaryFromDetails({
        ...data,
        isLoading: details.some((d) => !d.isOffloading),
        isOffloading: details.some((d) => d.isOffloading),
        details: details.map((d) => ({
          ...d,
          date: formatDateForApi(d.date) ?? "",
        })),
      })
    )
  }

  const getNewDetailLineDefaults = (isOffloading: boolean) => {
    const details = form.getValues("details") ?? []
    const sameType = [...details]
      .reverse()
      .find((d) => d.isOffloading === isOffloading)
    const template = sameType ?? details[details.length - 1]
    return {
      date: template?.date ?? format(new Date(), dateFormat),
      referenceNo: template?.referenceNo ?? "",
      mafi: template?.mafi ?? "",
      gear: template?.gear ?? 0,
      remarks: template?.remarks ?? "",
    }
  }

  const appendLoadingRow = () => {
    const defaults = getNewDetailLineDefaults(false)
    const equipmentUsedId = form.getValues("equipmentUsedId") ?? 0
    append({
      itemNo: 0,
      equipmentUsedId,
      isOffloading: false,
      date: defaults.date,
      referenceNo: defaults.referenceNo,
      tallySheetNo: "",
      crane: 0,
      forklift: 0,
      stevedore: 0,
      mafi: defaults.mafi,
      gear: defaults.gear,
      remarks: defaults.remarks,
    })
  }

  const appendOffloadingRow = () => {
    const defaults = getNewDetailLineDefaults(true)
    const equipmentUsedId = form.getValues("equipmentUsedId") ?? 0
    append({
      itemNo: 0,
      equipmentUsedId,
      isOffloading: true,
      date: defaults.date,
      referenceNo: defaults.referenceNo,
      tallySheetNo: "",
      crane: 0,
      forklift: 0,
      stevedore: 0,
      mafi: defaults.mafi,
      gear: defaults.gear,
      remarks: defaults.remarks,
    })
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <ChargeAutocomplete
                  form={form}
                  name="chargeId"
                  label="Charge Name"
                  isRequired={true}
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="providerName"
                  label="Provider Name"
                  isDisabled={isConfirmed}
                />
                <BargeAutocomplete
                  form={form}
                  name="bargeId"
                  label="Barge"
                  isRequired={true}
                  isDisabled={isConfirmed}
                />

                <CustomInput
                  form={form}
                  name="ameTally"
                  label="AME Tally / Launch"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="poNo"
                  label="PO No"
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="others"
                  label="Others"
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

              <div className="space-y-2 rounded-lg border p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Tally lines</p>
                    <p className="text-muted-foreground text-xs">
                      {lineCounts.loading} loading · {lineCounts.offloading}{" "}
                      offloading
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        ["all", "All"],
                        ["loading", "Loading"],
                        ["offloading", "Offloading"],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={lineFilter === value ? "default" : "outline"}
                        disabled={isConfirmed}
                        onClick={() => setLineFilter(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {detailsError ? (
                  <p className="text-destructive text-xs">{detailsError}</p>
                ) : null}

                {fields.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No tally lines yet. Add a loading or offloading line below.
                  </p>
                ) : visibleDetailRows.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No lines match this filter.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {visibleDetailRows.map(({ row, index }) => (
                      <div
                        key={fields[index]?.id ?? `detail-${index}`}
                        className={cn(
                          "flex flex-col gap-2 rounded-md border p-2",
                          row.isOffloading
                            ? "border-purple-200 bg-purple-50/40"
                            : "border-blue-200 bg-blue-50/40"
                        )}
                      >
                        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end">
                          {/* 1. Name (type + remove) */}
                          <div className="flex shrink-0 items-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 shrink-0"
                              disabled={isConfirmed}
                              onClick={() => remove(index)}
                              title="Remove line"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex min-w-22 flex-col gap-0.5">
                              <span className="text-xs font-medium">Name</span>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "h-9 w-full justify-center px-2 text-xs",
                                  row.isOffloading
                                    ? "bg-purple-100 text-purple-800"
                                    : "text-primary bg-blue-100"
                                )}
                              >
                                {row.isOffloading ? "Offloading" : "Loading"}
                              </Badge>
                            </div>
                          </div>

                          {/* 2. Date */}
                          <div className="shrink-0">
                            <CustomDateNew
                              form={form}
                              name={`details.${index}.date`}
                              label="Date"
                              isRequired
                              isDisabled={isConfirmed}
                              isFutureShow={true}
                              className="w-35"
                            />
                          </div>

                          {/* 3. Reference, tally, equipment counts */}
                          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                            <CustomInput
                              form={form}
                              name={`details.${index}.referenceNo`}
                              label="Reference No"
                              isDisabled={isConfirmed}
                            />
                            <CustomInput
                              form={form}
                              name={`details.${index}.tallySheetNo`}
                              label="Tally Sheet No"
                              isDisabled={isConfirmed}
                            />
                            <CustomNumberInput
                              form={form}
                              name={`details.${index}.crane`}
                              label="Crane"
                              isDisabled={isConfirmed}
                              className="min-w-0 max-w-22"
                            />
                            <CustomNumberInput
                              form={form}
                              name={`details.${index}.forklift`}
                              label="ForkLift"
                              isDisabled={isConfirmed}
                              className="min-w-0 max-w-22"
                            />
                            <CustomNumberInput
                              form={form}
                              name={`details.${index}.stevedore`}
                              label="Stevedore"
                              isDisabled={isConfirmed}
                              className="min-w-0 max-w-22"
                            />
                            <CustomInput
                              form={form}
                              name={`details.${index}.mafi`}
                              label="MAFI"
                              isDisabled={isConfirmed}
                              className="min-w-0 max-w-22"
                            />
                            <CustomNumberInput
                              form={form}
                              name={`details.${index}.gear`}
                              label="Gear"
                              isDisabled={isConfirmed}
                              className="min-w-0 max-w-22"
                            />
                          </div>

                          {/* 4. Remarks (2-col width) */}
                          <div className="min-w-0 xl:w-56 xl:shrink-0 2xl:w-64">
                            <CustomTextarea
                              form={form}
                              name={`details.${index}.remarks`}
                              label="Remarks"
                              isDisabled={isConfirmed}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isConfirmed}
                    onClick={appendLoadingRow}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add loading line
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isConfirmed}
                    onClick={appendOffloadingRow}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add offloading line
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-4 flex w-full gap-2">
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
