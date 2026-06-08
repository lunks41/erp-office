"use client"

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

const sectionCardClass =
  "rounded-lg border border-border bg-card px-4 pb-4 pt-5 [&_.text-red-500]:dark:text-red-400"

const freshWaterRowClass =
  "rounded-md border border-cyan-200 bg-cyan-50/40 p-3 dark:border-cyan-800/50 dark:bg-cyan-950/25"

const launchRowClass =
  "rounded-md border border-sky-200 bg-sky-50/40 p-3 dark:border-sky-800/50 dark:bg-sky-950/25"

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

function LineSectionHeader({
  badgeLabel,
  badgeClassName,
  count,
  countLabel,
  addLabel,
  onAdd,
  isReadOnly,
}: {
  badgeLabel: string
  badgeClassName: string
  count: number
  countLabel: string
  addLabel: string
  onAdd: () => void
  isReadOnly: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={badgeClassName}>
          {badgeLabel}
        </Badge>
        <span className="text-muted-foreground text-xs">
          {count} {countLabel}
          {count === 1 ? "" : "s"}
        </span>
      </div>
      {!isReadOnly && (
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" />
          {addLabel}
        </Button>
      )}
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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-cyan-900 dark:text-cyan-100">
          Fresh water line {index + 1}
        </span>
        {!isReadOnly && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => duplicateFreshWater(index)}
              title="Duplicate line"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeFreshWater(index)}
              title="Remove line"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
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
  )

  const renderLaunchRow = (index: number) => (
    <div
      key={launchFields[index]?.id ?? `launch-${index}`}
      className={launchRowClass}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-sky-900 dark:text-sky-100">
          Launch line {index + 1}
        </span>
        {!isReadOnly && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => duplicateLaunch(index)}
              title="Duplicate line"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeLaunch(index)}
              title="Remove line"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-2">
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
  )

  return (
    <div className={cn(sectionCardClass, "space-y-4")}>
      <div>
        <Badge
          variant="outline"
          className="border-cyan-200 bg-cyan-100 px-3 py-1.5 text-xs font-semibold text-cyan-900 shadow-sm dark:border-cyan-800/50 dark:bg-cyan-950/40 dark:text-cyan-100"
        >
          🚢 Service Lines
        </Badge>
        <p className="text-muted-foreground mt-2 text-xs">
          Add at least one fresh water line (charge + UOM) or one launch line
          (charge) to save.
        </p>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <LineSectionHeader
          badgeLabel="💧 Fresh Water"
          badgeClassName="border-cyan-200 bg-cyan-100 text-cyan-900 dark:border-cyan-800/50 dark:bg-cyan-950/40 dark:text-cyan-100"
          count={freshWaterFields.length}
          countLabel="line"
          addLabel="Add line"
          onAdd={() => appendFreshWater(createEmptyFreshWaterLine())}
          isReadOnly={isReadOnly}
        />
        {freshWaterFields.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
            No fresh water lines yet.
          </p>
        ) : (
          <div className="space-y-2">
            {freshWaterFields.map((_, index) => renderFreshWaterRow(index))}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <LineSectionHeader
          badgeLabel="🚤 Launch"
          badgeClassName="border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-100"
          count={launchFields.length}
          countLabel="line"
          addLabel="Add line"
          onAdd={() => appendLaunch(createEmptyLaunchLine())}
          isReadOnly={isReadOnly}
        />
        {launchFields.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
            No launch lines yet.
          </p>
        ) : (
          <div className="space-y-2">
            {launchFields.map((_, index) => renderLaunchRow(index))}
          </div>
        )}
      </div>
    </div>
  )
}
