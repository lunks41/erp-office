"use client"

import { useCallback, useEffect, useMemo } from "react"
import { ITallyService } from "@/interfaces"
import { tallyServiceSchema, TallyServiceSchemaType } from "@/schemas"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { differenceInMinutes, format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"

import {
  clientDateFormat,
  formatDateForApi,
  formatDateTimeForApi,
  parseDate,
} from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  BargeAutocomplete,
  ChargeAutocomplete,
  TaskStatusAutocomplete,
  UomAutocomplete,
} from "@/components/autocomplete"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { CustomDateTimePicker } from "@/components/custom/custom-date-time-picker"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface TallyServiceFormProps {
  companyId: number
  initialData?: ITallyService
  mode: "create" | "edit" | "view"
  submitAction: (data: ITallyService) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
}

function formatDurationToHhMm(value?: number | null): string {
  if (!value) return "00:00"
  const [hours = "00", minutes = "00"] = value.toString().split(".")
  return `${hours.padStart(2, "0")}:${minutes.padEnd(2, "0").slice(0, 2)}`
}

export function TallyServiceForm({
  companyId,
  initialData,
  mode,
  submitAction,
  onCancelAction,
  isSubmitting = false,
}: TallyServiceFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )
  const isReadOnly = mode === "view"

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

  const buildDefaultValues = useCallback((): TallyServiceSchemaType => {
    const serviceDate =
      initialData?.date || initialData?.serviceDate
        ? format(
            parseWithFallback(
              (initialData?.date || initialData?.serviceDate) as string
            ) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat)

    const accountDate = initialData?.accountDate
      ? format(
          parseWithFallback(initialData.accountDate as string) || new Date(),
          dateFormat
        )
      : serviceDate

    return {
      tallyServiceId: initialData?.tallyServiceId ?? 0,
      date: serviceDate,
      accountDate,
      chargeId: initialData?.chargeId ?? 0,
      bargeId: initialData?.bargeId ?? 0,
      uomId: initialData?.uomId ?? 0,
      operatorName: initialData?.operatorName ?? "",
      supplyBarge: initialData?.supplyBarge ?? "",
      quantity: initialData?.quantity ?? 1,
      receiptNo: initialData?.receiptNo ?? "",
      ameTally: initialData?.ameTally ?? "",
      boatopTally: initialData?.boatopTally ?? "",
      boatOperator: initialData?.boatOperator ?? "",
      distance: initialData?.distance ?? 0,
      loadingTime: initialData?.loadingTime
        ? parseWithFallback(initialData.loadingTime as string) || undefined
        : undefined,
      leftJetty: initialData?.leftJetty
        ? parseWithFallback(initialData.leftJetty as string) || undefined
        : undefined,
      waitingTime: initialData?.waitingTime ?? 0,
      alongsideVessel: initialData?.alongsideVessel
        ? parseWithFallback(initialData.alongsideVessel as string) || undefined
        : undefined,
      departedFromVessel: initialData?.departedFromVessel
        ? parseWithFallback(initialData.departedFromVessel as string) ||
          undefined
        : undefined,
      timeDiff: initialData?.timeDiff ?? 0,
      arrivedAtJetty: initialData?.arrivedAtJetty
        ? parseWithFallback(initialData.arrivedAtJetty as string) || undefined
        : undefined,
      deliveredWeight: initialData?.deliveredWeight ?? 0,
      landedWeight: initialData?.landedWeight ?? 0,
      annexure: initialData?.annexure ?? "",
      invoiceId: initialData?.invoiceId ?? 0,
      invoiceNo: initialData?.invoiceNo ?? "",
      poNo: initialData?.poNo ?? "",
      isPost: initialData?.isPost ?? false,
      taskStatusId: initialData?.taskStatusId ?? 1,
      remarks: initialData?.remarks ?? "",
      editVersion: initialData?.editVersion ?? 0,
    }
  }, [dateFormat, initialData, parseWithFallback])

  const form = useForm<TallyServiceSchemaType>({
    resolver: zodResolver(tallyServiceSchema),
    defaultValues: buildDefaultValues(),
  })

  useEffect(() => {
    form.reset(buildDefaultValues())
  }, [buildDefaultValues, form])

  const calculateWaitingTime = useCallback(() => {
    const start = form.getValues("loadingTime")
    const end = form.getValues("leftJetty")
    if (!start || !end) return

    const startDate = new Date(start)
    const endDate = new Date(end)
    if (!isValid(startDate) || !isValid(endDate)) return

    const diffMinutes = differenceInMinutes(endDate, startDate)
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    form.setValue("waitingTime", hours + minutes / 100)
  }, [form])

  const calculateTimeDiff = useCallback(() => {
    const start = form.getValues("alongsideVessel")
    const end = form.getValues("departedFromVessel")
    if (!start || !end) return

    const startDate = new Date(start)
    const endDate = new Date(end)
    if (!isValid(startDate) || !isValid(endDate)) return

    const diffMinutes = differenceInMinutes(endDate, startDate)
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    form.setValue("timeDiff", hours + minutes / 100)
  }, [form])

  const syncServiceDateToTimes = useCallback(
    (selectedDate: Date | null) => {
      if (!selectedDate) return

      const keepTime = (value: Date | string | undefined) => {
        const existing =
          value instanceof Date
            ? value
            : value
              ? parseWithFallback(value)
              : null

        if (!existing || !isValid(existing)) {
          return new Date(selectedDate)
        }

        return new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          existing.getHours(),
          existing.getMinutes(),
          existing.getSeconds(),
          existing.getMilliseconds()
        )
      }

      const accountDateString = format(selectedDate, dateFormat)
      form.setValue("accountDate", accountDateString)
      form.setValue("loadingTime", keepTime(form.getValues("loadingTime")))
      form.setValue("leftJetty", keepTime(form.getValues("leftJetty")))
      form.setValue(
        "alongsideVessel",
        keepTime(form.getValues("alongsideVessel"))
      )
      form.setValue(
        "departedFromVessel",
        keepTime(form.getValues("departedFromVessel"))
      )
      form.setValue(
        "arrivedAtJetty",
        keepTime(form.getValues("arrivedAtJetty"))
      )

      calculateWaitingTime()
      calculateTimeDiff()
    },
    [calculateTimeDiff, calculateWaitingTime, dateFormat, form, parseWithFallback]
  )

  const onSubmit = (data: TallyServiceSchemaType) => {
    const formattedDate = formatDateForApi(data.date) || data.date
    const formattedAccountDate =
      formatDateForApi(data.accountDate) || data.accountDate

    submitAction({
      companyId,
      tallyServiceId: data.tallyServiceId,
      date: formattedDate,
      serviceDate: formattedDate,
      accountDate: formattedAccountDate,
      chargeId: data.chargeId,
      bargeId: data.bargeId,
      uomId: data.uomId,
      operatorName: data.operatorName || "",
      supplyBarge: data.supplyBarge || "",
      quantity: data.quantity,
      receiptNo: data.receiptNo || "",
      ameTally: data.ameTally,
      boatopTally: data.boatopTally || "",
      boatOperator: data.boatOperator || "",
      distance: data.distance ?? 0,
      loadingTime: formatDateTimeForApi(data.loadingTime),
      leftJetty: formatDateTimeForApi(data.leftJetty),
      waitingTime: data.waitingTime ?? 0,
      alongsideVessel: formatDateTimeForApi(data.alongsideVessel),
      departedFromVessel: formatDateTimeForApi(data.departedFromVessel),
      timeDiff: data.timeDiff ?? 0,
      arrivedAtJetty: formatDateTimeForApi(data.arrivedAtJetty),
      deliveredWeight: data.deliveredWeight ?? 0,
      landedWeight: data.landedWeight ?? 0,
      annexure: data.annexure || "",
      invoiceId: data.invoiceId ?? 0,
      invoiceNo: data.invoiceNo || "",
      poNo: data.poNo || "",
      isPost: data.isPost,
      taskStatusId: data.taskStatusId,
      remarks: data.remarks || "",
      createById: initialData?.createById ?? 0,
      createDate: initialData?.createDate ?? new Date(),
      editById: initialData?.editById ?? 0,
      editDate: initialData?.editDate ?? new Date(),
      createBy: initialData?.createBy ?? "",
      editBy: initialData?.editBy ?? "",
      editVersion: data.editVersion || initialData?.editVersion || 0,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
              <CustomDateNew
                form={form}
                name="date"
                label="Service Date"
                isRequired
                isDisabled={isReadOnly}
                isFutureShow={true}
                onChangeEvent={syncServiceDateToTimes}
              />
              <CustomDateNew
                form={form}
                name="accountDate"
                label="Account Date"
                isRequired
                isDisabled={isReadOnly}
                isFutureShow={true}
              />
              <ChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge"
                isRequired={true}
                isDisabled={isReadOnly}
              />
              <BargeAutocomplete
                form={form}
                name="bargeId"
                label="Barge"
                isRequired={true}
                isDisabled={isReadOnly}
              />
              <UomAutocomplete
                form={form}
                name="uomId"
                label="UOM"
                isRequired={true}
                isDisabled={isReadOnly}
              />
              <TaskStatusAutocomplete
                form={form}
                name="taskStatusId"
                label="Task Status"
                isRequired={true}
                isDisabled={isReadOnly}
              />

              <CustomNumberInput
                form={form}
                name="quantity"
                label="Quantity"
                isRequired
                isDisabled={isReadOnly}
                round={0}
              />
              <CustomNumberInput
                form={form}
                name="distance"
                label="Distance"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="operatorName"
                label="Operator Name"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="supplyBarge"
                label="Supply Barge"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="receiptNo"
                label="Receipt No"
                isDisabled={isReadOnly}
              />

              <CustomInput
                form={form}
                name="ameTally"
                label="AME Tally"
                isRequired
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="boatopTally"
                label="Boat Operator Tally"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="boatOperator"
                label="Boat Operator"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="invoiceNo"
                label="Invoice No"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="poNo"
                label="PO No"
                isDisabled={isReadOnly}
              />

              <CustomNumberInput
                form={form}
                name="deliveredWeight"
                label="Delivered Weight"
                isDisabled={isReadOnly}
                round={3}
              />
              <CustomNumberInput
                form={form}
                name="landedWeight"
                label="Landed Weight"
                isDisabled={isReadOnly}
                round={3}
              />
              <CustomInput
                form={form}
                name="annexure"
                label="Annexure"
                isDisabled={isReadOnly}
                className="md:col-span-2"
              />
              <CustomNumberInput
                form={form}
                name="invoiceId"
                label="Invoice Id"
                isDisabled={isReadOnly}
                round={0}
              />
              <CustomSwitch
                form={form}
                name="isPost"
                label="Is Post"
                isDisabled={isReadOnly}
              />
            </div>

            <div className="rounded-md border p-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">Timing Details</Badge>
                <span className="text-muted-foreground text-xs">
                  Waiting Time = Left Jetty - Loading Time, Time Difference =
                  Departed Vessel - Alongside Vessel
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                <CustomDateTimePicker
                  form={form}
                  name="loadingTime"
                  label="Loading Time"
                  isDisabled={isReadOnly}
                  isFutureShow={true}
                  onChangeEvent={() => calculateWaitingTime()}
                />
                <CustomDateTimePicker
                  form={form}
                  name="leftJetty"
                  label="Left Jetty"
                  isDisabled={isReadOnly}
                  isFutureShow={true}
                  onChangeEvent={() => calculateWaitingTime()}
                />
                <div className="space-y-1">
                  <label className="text-xs font-medium">Waiting Time</label>
                  <input
                    type="text"
                    value={formatDurationToHhMm(form.watch("waitingTime"))}
                    disabled
                    className="border-input bg-background text-muted-foreground flex h-7.5 min-h-7.5 w-full rounded-md border px-2 py-0.5 text-xs"
                  />
                </div>
                <CustomDateTimePicker
                  form={form}
                  name="alongsideVessel"
                  label="Alongside Vessel"
                  isDisabled={isReadOnly}
                  isFutureShow={true}
                  onChangeEvent={() => calculateTimeDiff()}
                />
                <CustomDateTimePicker
                  form={form}
                  name="departedFromVessel"
                  label="Departed Vessel"
                  isDisabled={isReadOnly}
                  isFutureShow={true}
                  onChangeEvent={() => calculateTimeDiff()}
                />

                <div className="space-y-1">
                  <label className="text-xs font-medium">Time Difference</label>
                  <input
                    type="text"
                    value={formatDurationToHhMm(form.watch("timeDiff"))}
                    disabled
                    className="border-input bg-background text-muted-foreground flex h-7.5 min-h-7.5 w-full rounded-md border px-2 py-0.5 text-xs"
                  />
                </div>
                <CustomDateTimePicker
                  form={form}
                  name="arrivedAtJetty"
                  label="Arrived at Jetty"
                  isDisabled={isReadOnly}
                  isFutureShow={true}
                />
              </div>
            </div>

            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isReadOnly}
              maxLength={500}
              showCharacterCount={true}
              minRows={3}
            />

            <AuditTrailAccordion
              createBy={initialData?.createBy}
              createDate={initialData?.createDate}
              editBy={initialData?.editBy}
              editDate={initialData?.editDate}
              datetimeFormat={datetimeFormat}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" type="button" onClick={onCancelAction}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : mode === "edit"
                    ? "Update Tally Service"
                    : "Add Tally Service"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
