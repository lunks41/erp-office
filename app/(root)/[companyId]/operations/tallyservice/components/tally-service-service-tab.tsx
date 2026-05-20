"use client"

import { useMemo, useState } from "react"
import { TallyServiceSchemaType } from "@/schemas"
import { Copy, Plus, Trash2 } from "lucide-react"
import { UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChargeAutocomplete, UomAutocomplete } from "@/components/autocomplete"
import { CustomDateTimePicker } from "@/components/custom/custom-date-time-picker"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"

import {
  createEmptyFreshWaterLine,
  createEmptyLaunchLine,
} from "./tally-service-utils"

type LineFilter = "all" | "freshwater" | "launch"

type DisplayRow =
  | { kind: "freshwater"; index: number; id: string }
  | { kind: "launch"; index: number; id: string }

interface TallyServiceServiceTabProps {
  form: UseFormReturn<TallyServiceSchemaType>
  isReadOnly: boolean
  freshWaterFields: { id: string }[]
  appendFreshWater: (line: ReturnType<typeof createEmptyFreshWaterLine>) => void
  insertFreshWater: (
    index: number,
    line: ReturnType<typeof createEmptyFreshWaterLine>
  ) => void
  removeFreshWater: (index: number) => void
  launchFields: { id: string }[]
  appendLaunch: (line: ReturnType<typeof createEmptyLaunchLine>) => void
  insertLaunch: (
    index: number,
    line: ReturnType<typeof createEmptyLaunchLine>
  ) => void
  removeLaunch: (index: number) => void
  formatDurationToHhMm: (value?: number | null) => string
  calculateWaitingTime: (index: number) => void
  calculateTimeDiff: (index: number) => void
}

const lineFieldClass = "min-w-0 w-full"

const serviceLinesSectionClass =
  "space-y-2 rounded-lg border border-border bg-card p-2 [&_.text-red-500]:dark:text-red-400"

const freshWaterRowClass =
  "flex flex-col gap-2 rounded-md border border-cyan-200 bg-cyan-50/40 p-2 dark:border-cyan-800/50 dark:bg-cyan-950/25"

const launchRowClass =
  "flex flex-col gap-2 rounded-md border border-sky-200 bg-sky-50/40 p-2 dark:border-sky-800/50 dark:bg-sky-950/25"

const freshWaterBadgeClass =
  "h-9 w-full justify-center bg-cyan-100 px-2 text-xs text-cyan-900 dark:bg-cyan-900/50 dark:text-cyan-100"

const launchBadgeClass =
  "h-9 w-full justify-center bg-sky-100 px-2 text-xs text-sky-900 dark:bg-sky-900/50 dark:text-sky-100"

function ComputedDurationField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}>
      <label className="text-muted-foreground text-xs font-medium">
        {label}
      </label>
      <div
        className="border-input bg-muted/60 text-foreground dark:bg-background flex h-9 w-full items-center rounded-md border px-2 text-xs font-medium tabular-nums"
        aria-readonly
      >
        {value || "—"}
      </div>
    </div>
  )
}

export function TallyServiceServiceTab({
  form,
  isReadOnly,
  freshWaterFields,
  appendFreshWater,
  insertFreshWater,
  removeFreshWater,
  launchFields,
  appendLaunch,
  insertLaunch,
  removeLaunch,
  formatDurationToHhMm,
  calculateWaitingTime,
  calculateTimeDiff,
}: TallyServiceServiceTabProps) {
  const [lineFilter, setLineFilter] = useState<LineFilter>("all")

  const allRows = useMemo<DisplayRow[]>(() => {
    const rows: DisplayRow[] = []
    freshWaterFields.forEach((field, index) => {
      rows.push({ kind: "freshwater", index, id: field.id })
    })
    launchFields.forEach((field, index) => {
      rows.push({ kind: "launch", index, id: field.id })
    })
    return rows
  }, [freshWaterFields, launchFields])

  const visibleRows = useMemo(() => {
    if (lineFilter === "freshwater") {
      return allRows.filter((row) => row.kind === "freshwater")
    }
    if (lineFilter === "launch") {
      return allRows.filter((row) => row.kind === "launch")
    }
    return allRows
  }, [allRows, lineFilter])

  const duplicateFreshWater = (index: number) => {
    const line = form.getValues(`freshWaterLines.${index}`)
    insertFreshWater(index + 1, { ...line, itemNo: 0 })
  }

  const duplicateLaunch = (index: number) => {
    const line = form.getValues(`launchServiceLines.${index}`)
    insertLaunch(index + 1, { ...line, itemNo: 0 })
  }

  const renderFreshWaterRow = (index: number) => (
    <div
      key={freshWaterFields[index]?.id ?? `fw-${index}`}
      className={freshWaterRowClass}
    >
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end">
        <div className="flex shrink-0 items-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 shrink-0"
            disabled={isReadOnly}
            onClick={() => removeFreshWater(index)}
            title="Remove line"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 shrink-0"
            disabled={isReadOnly}
            onClick={() => duplicateFreshWater(index)}
            title="Duplicate line"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <div className="flex w-22 shrink-0 flex-col gap-0.5">
            <span className="text-muted-foreground text-xs font-medium">
              Type
            </span>
            <Badge variant="secondary" className={freshWaterBadgeClass}>
              Fresh water
            </Badge>
          </div>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
          <CustomInput
            form={form}
            name={`freshWaterLines.${index}.tallyNo`}
            label="Tally No"
            isDisabled={isReadOnly}
            className={lineFieldClass}
          />
          <CustomNumberInput
            form={form}
            name={`freshWaterLines.${index}.distance`}
            label="Distance"
            isDisabled={isReadOnly}
            round={2}
            className={lineFieldClass}
          />

          <ChargeAutocomplete
            form={form}
            name={`freshWaterLines.${index}.chargeId`}
            label="Charge"
            isRequired
            isDisabled={isReadOnly}
          />
          <UomAutocomplete
            form={form}
            name={`freshWaterLines.${index}.uomId`}
            label="UOM"
            isRequired
            isDisabled={isReadOnly}
          />
          <CustomNumberInput
            form={form}
            name={`freshWaterLines.${index}.quantity`}
            label="Quantity"
            isRequired
            isDisabled={isReadOnly}
            round={0}
            className={lineFieldClass}
          />
        </div>
      </div>
    </div>
  )

  const renderLaunchRow = (index: number) => (
    <div
      key={launchFields[index]?.id ?? `launch-${index}`}
      className={launchRowClass}
    >
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-start">
        <div className="flex shrink-0 items-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 shrink-0"
            disabled={isReadOnly}
            onClick={() => removeLaunch(index)}
            title="Remove line"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 shrink-0"
            disabled={isReadOnly}
            onClick={() => duplicateLaunch(index)}
            title="Duplicate line"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <div className="flex w-22 shrink-0 flex-col gap-0.5">
            <span className="text-muted-foreground text-xs font-medium">
              Type
            </span>
            <Badge variant="secondary" className={launchBadgeClass}>
              Launch
            </Badge>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
            <CustomInput
              form={form}
              name={`launchServiceLines.${index}.tallyNo`}
              label="Tally No"
              isDisabled={isReadOnly}
              className={lineFieldClass}
            />
            <CustomNumberInput
              form={form}
              name={`launchServiceLines.${index}.distance`}
              label="Distance"
              isDisabled={isReadOnly}
              round={2}
              className={lineFieldClass}
            />
            <ChargeAutocomplete
              form={form}
              name={`launchServiceLines.${index}.chargeId`}
              label="Charge"
              isRequired
              isDisabled={isReadOnly}
            />
            <CustomNumberInput
              form={form}
              name={`launchServiceLines.${index}.deliveredWeight`}
              label="Delivered"
              isDisabled={isReadOnly}
              round={3}
              className={lineFieldClass}
            />
            <CustomNumberInput
              form={form}
              name={`launchServiceLines.${index}.landedWeight`}
              label="Landed"
              isDisabled={isReadOnly}
              round={3}
              className={lineFieldClass}
            />
            <CustomDateTimePicker
              form={form}
              name={`launchServiceLines.${index}.loadingTime`}
              label="Loading"
              isDisabled={isReadOnly}
              isFutureShow
              className={lineFieldClass}
              onChangeEvent={() => calculateWaitingTime(index)}
            />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
            <CustomDateTimePicker
              form={form}
              name={`launchServiceLines.${index}.leftJetty`}
              label="Left jetty"
              isDisabled={isReadOnly}
              isFutureShow
              className={lineFieldClass}
              onChangeEvent={() => calculateWaitingTime(index)}
            />
            <ComputedDurationField
              label="Waiting"
              className={lineFieldClass}
              value={formatDurationToHhMm(
                form.watch(`launchServiceLines.${index}.waitingTime`)
              )}
            />
            <CustomDateTimePicker
              form={form}
              name={`launchServiceLines.${index}.alongsideVessel`}
              label="Alongside"
              isDisabled={isReadOnly}
              isFutureShow
              className={lineFieldClass}
              onChangeEvent={() => calculateTimeDiff(index)}
            />
            <CustomDateTimePicker
              form={form}
              name={`launchServiceLines.${index}.departedFromVessel`}
              label="Departed"
              isDisabled={isReadOnly}
              isFutureShow
              className={lineFieldClass}
              onChangeEvent={() => calculateTimeDiff(index)}
            />
            <ComputedDurationField
              label="Time diff"
              className={lineFieldClass}
              value={formatDurationToHhMm(
                form.watch(`launchServiceLines.${index}.timeDiff`)
              )}
            />
            <CustomDateTimePicker
              form={form}
              name={`launchServiceLines.${index}.arrivedAtJetty`}
              label="Arrived jetty"
              isDisabled={isReadOnly}
              isFutureShow
              className={lineFieldClass}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={serviceLinesSectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Service lines</p>
          <p className="text-muted-foreground text-xs">
            {freshWaterFields.length} fresh water · {launchFields.length} launch
          </p>
        </div>
        {allRows.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["all", "All"],
                ["freshwater", "Fresh water"],
                ["launch", "Launch"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={lineFilter === value ? "default" : "outline"}
                disabled={isReadOnly}
                onClick={() => setLineFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {allRows.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No service lines yet. Add a fresh water or launch line below.
        </p>
      ) : visibleRows.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No lines match this filter.
        </p>
      ) : (
        <div className="space-y-2">
          {visibleRows.map((row) =>
            row.kind === "freshwater"
              ? renderFreshWaterRow(row.index)
              : renderLaunchRow(row.index)
          )}
        </div>
      )}

      {!isReadOnly ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendFreshWater(createEmptyFreshWaterLine())}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add fresh water line
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendLaunch(createEmptyLaunchLine())}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add launch line
          </Button>
        </div>
      ) : null}
    </div>
  )
}
