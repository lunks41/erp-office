"use client"

import { useCallback, useEffect, useMemo } from "react"
import { IJobOrderHd, ILaunchService } from "@/interfaces/checklist"
import {
  LaunchServiceSchema,
  LaunchServiceSchemaType,
} from "@/schemas/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { differenceInMinutes, format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"

import {
  clientDateFormat,
  formatDateTimeForApi,
  parseDate,
} from "@/lib/date-utils"
import { Task } from "@/lib/operations-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  BargeAutocomplete,
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
import { CustomDateTimePicker } from "@/components/custom/custom-date-time-picker"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface LaunchServiceFormProps {
  jobData: IJobOrderHd
  initialData?: ILaunchService
  taskDefaults?: Record<string, number> // Add taskDefaults prop
  submitAction: (data: LaunchServiceSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
}

export function LaunchServiceForm({
  jobData,
  initialData,
  taskDefaults = {}, // Default to empty object
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
}: LaunchServiceFormProps) {
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

  const form = useForm<LaunchServiceSchemaType>({
    resolver: zodResolver(LaunchServiceSchema),
    defaultValues: {
      launchServiceId: initialData?.launchServiceId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.LaunchServices,
      date: initialData?.date
        ? format(
            parseWithFallback(initialData.date as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),

      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,
      uomId: initialData?.uomId ?? taskDefaults.uomId ?? 0,
      ameTally: initialData?.ameTally ?? "",
      boatopTally: initialData?.boatopTally ?? "",
      distance: initialData?.distance ?? 0,
      loadingTime: initialData?.loadingTime
        ? parseWithFallback(initialData.loadingTime as string) || undefined
        : undefined,
      leftJetty: initialData?.leftJetty
        ? parseWithFallback(initialData.leftJetty as string) || undefined
        : undefined,
      alongsideVessel: initialData?.alongsideVessel
        ? parseWithFallback(initialData.alongsideVessel as string) || undefined
        : undefined,
      departedFromVessel: initialData?.departedFromVessel
        ? parseWithFallback(initialData.departedFromVessel as string) ||
          undefined
        : undefined,
      arrivedAtJetty: initialData?.arrivedAtJetty
        ? parseWithFallback(initialData.arrivedAtJetty as string) || undefined
        : undefined,
      waitingTime: initialData?.waitingTime ?? 0,
      timeDiff: initialData?.timeDiff ?? 0,
      deliveredWeight: initialData?.deliveredWeight ?? 0,
      landedWeight: initialData?.landedWeight ?? 0,
      boatOperator: initialData?.boatOperator ?? "",
      annexure: initialData?.annexure ?? "",
      invoiceNo: initialData?.invoiceNo ?? "",
      bargeId: initialData?.bargeId ?? 0,
      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      remarks: initialData?.remarks ?? "",
      editVersion: initialData?.editVersion ?? 0,
    },
  })

  useEffect(() => {
    // Only reset form when data is loaded to prevent race conditions
    form.reset({
      launchServiceId: initialData?.launchServiceId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.LaunchServices,
      date: initialData?.date
        ? format(
            parseWithFallback(initialData.date as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),

      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,
      uomId: initialData?.uomId ?? taskDefaults.uomId ?? 0,
      ameTally: initialData?.ameTally ?? "",
      boatopTally: initialData?.boatopTally ?? "",
      distance: initialData?.distance ?? 0,
      loadingTime: initialData?.loadingTime
        ? parseWithFallback(initialData.loadingTime as string) || undefined
        : undefined,
      leftJetty: initialData?.leftJetty
        ? parseWithFallback(initialData.leftJetty as string) || undefined
        : undefined,
      alongsideVessel: initialData?.alongsideVessel
        ? parseWithFallback(initialData.alongsideVessel as string) || undefined
        : undefined,
      departedFromVessel: initialData?.departedFromVessel
        ? parseWithFallback(initialData.departedFromVessel as string) ||
          undefined
        : undefined,
      arrivedAtJetty: initialData?.arrivedAtJetty
        ? parseWithFallback(initialData.arrivedAtJetty as string) || undefined
        : undefined,
      waitingTime: initialData?.waitingTime ?? 0,
      timeDiff: initialData?.timeDiff ?? 0,
      deliveredWeight: initialData?.deliveredWeight ?? 0,
      landedWeight: initialData?.landedWeight ?? 0,
      boatOperator: initialData?.boatOperator ?? "",
      annexure: initialData?.annexure ?? "",
      invoiceNo: initialData?.invoiceNo ?? "",
      bargeId: initialData?.bargeId ?? 0,
      remarks: initialData?.remarks ?? "",
      taskStatusId: initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 1,
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
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

  // Convert decimal hours to HH:mm format (e.g., 1.14 -> "01:14")
  const formatDecimalHoursToHhMm = (decimalHours: number): string => {
    if (decimalHours < 0) return "00:00"

    const hours = Math.floor(decimalHours)
    const minutes = Math.round((decimalHours % 1) * 100)

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  // Calculate waiting time and time diff when form data is loaded
  useEffect(() => {
    if (initialData) {
      setTimeout(() => {
        // Waiting Time
        const loadingTime = form.getValues("loadingTime")
        const leftJetty = form.getValues("leftJetty")
        if (loadingTime && leftJetty) {
          const start = new Date(loadingTime)
          const end = new Date(leftJetty)
          if (isValid(start) && isValid(end)) {
            const diff = differenceInMinutes(end, start)
            const hours = Math.floor(diff / 60)
            const minutes = diff % 60
            const decimalHours = hours + minutes / 100 // Convert to decimal hours format
            form.setValue("waitingTime", decimalHours)
          }
        }

        // Time Diff
        const departedFromVessel = form.getValues("departedFromVessel")
        const alongSideVessel = form.getValues("alongsideVessel")
        if (departedFromVessel && alongSideVessel) {
          const start = new Date(alongSideVessel)
          const end = new Date(departedFromVessel)
          if (isValid(start) && isValid(end)) {
            const diff = differenceInMinutes(end, start)
            const hours = Math.floor(diff / 60)
            const minutes = diff % 60
            const decimalHours = hours + minutes / 100 // Convert to decimal hours format
            form.setValue("timeDiff", decimalHours)
          }
        }
      }, 100)
    }
  }, [initialData, form])

  const calculateWaitingTime = () => {
    const loadingTime = form.getValues("loadingTime")
    const leftJetty = form.getValues("leftJetty")

    if (loadingTime && leftJetty) {
      const start = new Date(loadingTime)
      const end = new Date(leftJetty)

      if (isValid(start) && isValid(end)) {
        const diffMinutes = differenceInMinutes(end, start)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        const decimalHours = hours + minutes / 100 // Convert to decimal hours format
        form.setValue("waitingTime", decimalHours)
      }
    }
  }

  const calculateTimeDiff = () => {
    const departedFromVessel = form.getValues("departedFromVessel")
    const alongSideVessel = form.getValues("alongsideVessel")

    if (departedFromVessel && alongSideVessel) {
      const start = new Date(alongSideVessel)
      const end = new Date(departedFromVessel)

      if (isValid(start) && isValid(end)) {
        const diffMinutes = differenceInMinutes(end, start)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        const decimalHours = hours + minutes / 100 // Convert to decimal hours format
        form.setValue("timeDiff", decimalHours)
      }
    }
  }

  const syncServiceDateToTimes = (selectedDate: Date | null) => {
    if (!selectedDate) return

    const updateDateOnly = (dateToUpdate: Date | null | undefined) => {
      if (!dateToUpdate || !isValid(dateToUpdate)) {
        return new Date(selectedDate)
      }

      return new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        dateToUpdate.getHours(),
        dateToUpdate.getMinutes(),
        dateToUpdate.getSeconds(),
        dateToUpdate.getMilliseconds()
      )
    }

    const loadingTime = form.getValues("loadingTime") as Date | null | undefined
    const leftJetty = form.getValues("leftJetty") as Date | null | undefined
    const alongsideVessel = form.getValues("alongsideVessel") as
      | Date
      | null
      | undefined
    const departedFromVessel = form.getValues("departedFromVessel") as
      | Date
      | null
      | undefined
    const arrivedAtJetty = form.getValues("arrivedAtJetty") as
      | Date
      | null
      | undefined

    form.setValue("loadingTime", updateDateOnly(loadingTime))
    form.setValue("leftJetty", updateDateOnly(leftJetty))
    form.setValue("alongsideVessel", updateDateOnly(alongsideVessel))
    form.setValue("departedFromVessel", updateDateOnly(departedFromVessel))
    form.setValue("arrivedAtJetty", updateDateOnly(arrivedAtJetty))

    calculateWaitingTime()
    calculateTimeDiff()
  }

  const onSubmit = (data: LaunchServiceSchemaType) => {
    // Format DateTime fields for API using formatDateTimeForApi
    // This converts Date objects to ISO 8601 format (yyyy-MM-ddTHH:mm:ss.SSSZ)
    const formData: LaunchServiceSchemaType = {
      ...data,
      loadingTime: formatDateTimeForApi(data.loadingTime),
      leftJetty: formatDateTimeForApi(data.leftJetty),
      alongsideVessel: formatDateTimeForApi(data.alongsideVessel),
      departedFromVessel: formatDateTimeForApi(data.departedFromVessel),
      arrivedAtJetty: formatDateTimeForApi(data.arrivedAtJetty),
    }

    console.log(formData)

    submitAction(formData)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-3">
            <div className="grid grid-cols-5 gap-2">
              <CustomDateNew
                form={form}
                name="date"
                label="Service Date"
                isRequired={true}
                isDisabled={isConfirmed}
                isFutureShow={true}
                onChangeEvent={syncServiceDateToTimes}
              />
              <ChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge Name"
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
                label="AME Tally"
                isRequired
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="boatopTally"
                label="Boat Operator Tally"
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="boatOperator"
                label="Boat Operator"
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="annexure"
                label="Annexure"
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="invoiceNo"
                label="Invoice Number"
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

            {/* Distance, Timing, Cargo Section */}
            <div className="grid grid-cols-5 gap-2 rounded border p-2">
              <div className="col-span-5 mb-1 flex gap-2">
                <Badge
                  variant="outline"
                  className="border-green-200 bg-green-50 text-green-700 transition-all duration-300 hover:bg-green-100"
                >
                  Distance, Timing & Cargo Information
                </Badge>

                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="animate-pulse cursor-help border-blue-200 bg-blue-50 text-blue-700 transition-all duration-300 hover:bg-blue-100"
                      >
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3 animate-bounce"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium">Time Rules</span>
                        </div>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <div className="space-y-2">
                        <p className="font-semibold">Time Sequence Rules:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Launch Hire Time ≤ Left Jetty Time</li>
                          <li>• Left Jetty Time ≤ Along Side Vessel</li>
                          <li>• Along Side Vessel ≤ Departed From Vessel</li>
                          <li>• Departed From Vessel ≤ Back To Base Time</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <CustomNumberInput
                form={form}
                name="distance"
                label="Distance (NM)"
                isDisabled={isConfirmed}
              />
              <CustomNumberInput
                form={form}
                name="deliveredWeight"
                label="Cargo Delivered Weight (Tons)"
                isDisabled={isConfirmed}
                round={3}
              />
              <CustomNumberInput
                form={form}
                name="landedWeight"
                label="Cargo Landed Weight (Tons)"
                isDisabled={isConfirmed}
                round={3}
              />
              <CustomDateTimePicker
                form={form}
                name="loadingTime"
                label="Loading Time (1)"
                isDisabled={false}
                isFutureShow={true}
                onChangeEvent={() => calculateWaitingTime()}
              />
              <CustomDateTimePicker
                form={form}
                name="leftJetty"
                label="Left Jetty Time (2)"
                isDisabled={false}
                isFutureShow={true}
                onChangeEvent={() => calculateWaitingTime()}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Launch Waiting Time (2-1) (HH:MM)
                </label>
                <input
                  type="text"
                  value={formatDecimalHoursToHhMm(
                    form.watch("waitingTime") || 0
                  )}
                  disabled={true}
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="00:00"
                />
              </div>
              <CustomDateTimePicker
                form={form}
                name="alongsideVessel"
                label="Alongside Vessel Time (3)"
                isDisabled={false}
                isFutureShow={true}
                onChangeEvent={() => calculateTimeDiff()}
              />
              <CustomDateTimePicker
                form={form}
                name="departedFromVessel"
                label="Departed Vessel Time (4)"
                isDisabled={false}
                isFutureShow={true}
                onChangeEvent={() => calculateTimeDiff()}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Time Difference (4-3) (HH:MM)
                </label>
                <input
                  type="text"
                  value={formatDecimalHoursToHhMm(form.watch("timeDiff") || 0)}
                  disabled={true}
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="00:00"
                />
              </div>
              <CustomDateTimePicker
                form={form}
                name="arrivedAtJetty"
                label="Arrived at Jetty Time (5)"
                isDisabled={false}
                isFutureShow={true}
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
          <div className="flex justify-end gap-2 pt-1">
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
                    ? "Update Launch Service"
                    : "Add Launch Service"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
