"use client"

import * as React from "react"
import { useAuthStore } from "@/stores/auth-store"
import {
  endOfYear,
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  startOfToday,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { Control, FieldValues, Path, useWatch } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ---- CalendarWithPresets (merged from calendar-with-presets.tsx) ----

export interface CalendarWithPresetsProps {
  selected?: Date
  onSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  className?: string
  hidePresets?: boolean
  month?: Date
  onMonthChange?: (date: Date) => void
  fromYear?: number
  toYear?: number
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
}

const PRESETS = [
  { label: "Today", getDate: () => startOfToday() },
  { label: "Last week", getDate: () => subDays(startOfToday(), 7) },
  { label: "Last 1 month", getDate: () => subMonths(startOfToday(), 1) },
  { label: "Last 3 period", getDate: () => subMonths(startOfToday(), 3) },
  { label: "Last 6 period", getDate: () => subMonths(startOfToday(), 6) },
  {
    label: "Previous year",
    getDate: () => endOfYear(subYears(startOfToday(), 1)),
  },
] as const

function isPresetInRange(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (!date || !isValid(date)) return false
  if (minDate && isValid(minDate) && isBefore(date, minDate)) return false
  if (maxDate && isValid(maxDate) && isAfter(date, maxDate)) return false
  return true
}

export function CalendarWithPresets({
  selected,
  onSelect,
  minDate,
  maxDate,
  className,
  hidePresets = false,
  month,
  onMonthChange,
  fromYear,
  toYear,
  disabled,
  initialFocus,
}: CalendarWithPresetsProps) {
  const handlePresetClick = React.useCallback(
    (presetDate: Date) => {
      if (isPresetInRange(presetDate, minDate, maxDate)) {
        onSelect(presetDate)
      }
    },
    [onSelect, minDate, maxDate]
  )

  return (
    <Card
      className={cn(
        "mx-auto w-fit max-w-[300px] gap-0 border-0 py-0 shadow-none",
        className
      )}
    >
      <CardContent className="p-0 [--cell-size:--spacing(9.5)]">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => date && onSelect(date)}
          month={month}
          onMonthChange={onMonthChange}
          fromYear={fromYear}
          toYear={toYear}
          captionLayout="dropdown"
          disabled={disabled}
          initialFocus={initialFocus}
          fixedWeeks
          className="p-3"
        />
      </CardContent>
      {!hidePresets && (
        <CardFooter className="grid grid-cols-2 gap-2 border-t px-3 py-3 [.border-t]:pt-3">
          {PRESETS.map((preset) => {
            const presetDate = preset.getDate()
            const inRange = isPresetInRange(presetDate, minDate, maxDate)
            return (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                className="min-w-0"
                onClick={() => handlePresetClick(presetDate)}
                disabled={!inRange}
              >
                {preset.label}
              </Button>
            )
          })}
        </CardFooter>
      )}
    </Card>
  )
}

// ---- CustomDateWithPresets ----

interface CustomDateWithPresetsProps<T extends FieldValues = FieldValues> {
  form: { control: Control<T> }
  label?: string
  name: Path<T>
  className?: string
  onBlurEvent?: (e: React.FocusEvent<HTMLInputElement>) => void
  onChangeEvent?: (date: Date | null) => void
  isDisabled?: boolean
  isRequired?: boolean
  placeholder?: string
  minDate?: Date | string
  maxDate?: Date | string
  dateFormat?: string
  size?: "default" | "sm" | "lg"
  isFutureShow?: boolean
}

export function CustomDateWithPresets<T extends FieldValues = FieldValues>({
  form,
  label,
  name,
  className,
  onBlurEvent,
  onChangeEvent,
  isDisabled = false,
  isRequired = false,
  placeholder,
  minDate,
  maxDate,
  dateFormat = "dd/MM/yyyy",
  size = "sm",
  isFutureShow = false,
}: CustomDateWithPresetsProps<T>) {
  const { decimals } = useAuthStore()
  const decimalDateFormat =
    decimals[0]?.dateFormat || dateFormat || "dd/MM/yyyy"

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [month, setMonth] = React.useState<Date | undefined>(undefined)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const formatDateForDisplay = React.useCallback(
    (date: Date | undefined): string => {
      if (!date || !isValid(date)) return ""
      return format(date, decimalDateFormat)
    },
    [decimalDateFormat]
  )

  const parseUserInput = React.useCallback(
    (input: string | Date | null | undefined): Date | undefined => {
      if (!input) return undefined
      if (input instanceof Date) {
        return isValid(input) ? input : undefined
      }
      if (typeof input !== "string") return undefined
      if (input.trim() === "") return undefined
      const formats = [
        decimalDateFormat,
        "dd/MMM/yyyy",
        "dd-MMM-yyyy",
        "dd MMM yyyy",
        "dd/MM/yy",
        "dd-MM-yy",
        "dd-MM-yyyy",
        "yyyy-MM-dd",
        "yyyy-MMM-dd",
        "MM/dd/yyyy",
        "yyyy/MM/dd",
      ]
      for (const formatStr of formats) {
        const parsedDate = parse(input, formatStr, new Date())
        if (isValid(parsedDate)) {
          const year = parsedDate.getFullYear()
          if (year < 100) parsedDate.setFullYear(2000 + year)
          return parsedDate
        }
      }
      const nativeDate = new Date(input)
      return isValid(nativeDate) ? nativeDate : undefined
    },
    [decimalDateFormat]
  )

  const isValidDateValue = React.useCallback(
    (date: Date | undefined): boolean => {
      return !!(date && isValid(date))
    },
    []
  )

  const validateDateConstraints = React.useCallback(
    (date: Date | undefined): boolean => {
      if (!date || !isValid(date)) return false
      let effectiveMaxDate: Date | undefined
      if (isFutureShow) {
        if (maxDate) {
          effectiveMaxDate =
            maxDate instanceof Date ? maxDate : new Date(maxDate)
        } else {
          const futureDate = new Date()
          futureDate.setFullYear(futureDate.getFullYear() + 2)
          effectiveMaxDate = futureDate
        }
      } else {
        effectiveMaxDate = new Date()
      }
      if (
        effectiveMaxDate &&
        isValid(effectiveMaxDate) &&
        isAfter(date, effectiveMaxDate)
      ) {
        return false
      }
      if (minDate) {
        const minDateObj = minDate instanceof Date ? minDate : new Date(minDate)
        if (isValid(minDateObj) && isBefore(date, minDateObj)) return false
      }
      return true
    },
    [isFutureShow, maxDate, minDate]
  )

  const fieldValue = useWatch({ control: form.control, name })

  React.useEffect(() => {
    const parsedFieldDate = parseUserInput(fieldValue as string)
    const displayValue = formatDateForDisplay(parsedFieldDate)
    if (
      displayValue &&
      displayValue !== value &&
      document.activeElement !== inputRef.current
    ) {
      setValue(displayValue)
      if (parsedFieldDate) setMonth(parsedFieldDate)
    } else if (!fieldValue) {
      setValue("")
    }
  }, [fieldValue, formatDateForDisplay, parseUserInput, value])

  const calendarMinDate = React.useMemo(() => {
    return minDate
      ? minDate instanceof Date
        ? minDate
        : new Date(minDate)
      : undefined
  }, [minDate])

  const calendarMaxDate = React.useMemo(() => {
    if (isFutureShow) {
      if (maxDate) return maxDate instanceof Date ? maxDate : new Date(maxDate)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 2)
      return futureDate
    }
    return new Date()
  }, [isFutureShow, maxDate])

  const fromYear = React.useMemo(() => {
    if (minDate) {
      const minDateObj = minDate instanceof Date ? minDate : new Date(minDate)
      return minDateObj.getFullYear()
    }
    return new Date().getFullYear() - 100
  }, [minDate])

  const toYear = React.useMemo(() => {
    if (isFutureShow) {
      if (maxDate) {
        const maxDateObj = maxDate instanceof Date ? maxDate : new Date(maxDate)
        return maxDateObj.getFullYear()
      }
      return new Date().getFullYear() + 2
    }
    return new Date().getFullYear()
  }, [isFutureShow, maxDate])

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label && (
        <Label
          htmlFor={name}
          className={cn(
            "px-1 text-xs font-medium",
            isRequired && "text-red-500"
          )}
        >
          {label}
          {isRequired && <span className="ml-1">*</span>}
        </Label>
      )}
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => {
          const currentDate = parseUserInput(value)

          const handleInputChange = (
            e: React.ChangeEvent<HTMLInputElement>
          ) => {
            const inputValue = e.target.value
            setValue(inputValue)
            const parsedDate = parseUserInput(inputValue)
            if (
              isValidDateValue(parsedDate) &&
              validateDateConstraints(parsedDate)
            ) {
              const formattedDate = formatDateForDisplay(parsedDate)
              field.onChange(formattedDate)
              setMonth(parsedDate!)
              onChangeEvent?.(parsedDate!)
            } else if (inputValue === "") {
              field.onChange("")
              onChangeEvent?.(null)
            }
          }

          const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const parsedDate = parseUserInput(value)
            if (
              isValidDateValue(parsedDate) &&
              validateDateConstraints(parsedDate)
            ) {
              const formattedDate = formatDateForDisplay(parsedDate)
              setValue(formattedDate)
              field.onChange(formattedDate)
            } else if (value === "") {
              field.onChange("")
            } else {
              setValue("")
              field.onChange("")
            }
            field.onBlur()
            onBlurEvent?.(e)
          }

          const handleCalendarSelect = (date: Date) => {
            const formattedDate = formatDateForDisplay(date)
            setValue(formattedDate)
            field.onChange(formattedDate)
            setMonth(date)
            onChangeEvent?.(date)
            setOpen(false)
          }

          const handleClear = () => {
            setValue("")
            field.onChange("")
            onChangeEvent?.(null)
          }

          return (
            <FormItem>
              <FormControl>
                <div className="relative flex gap-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    id={name}
                    disabled={isDisabled}
                    placeholder={placeholder || decimalDateFormat}
                    className={cn(
                      isRequired && !isDisabled
                        ? "border-gray-400 bg-yellow-50 dark:border-gray-500 dark:bg-yellow-950/20"
                        : "bg-background",
                      "pr-10",
                      {
                        "h-7.5 text-xs": size === "sm",
                        "h-7.5 text-xs": size === "default",
                        "h-10 text-sm": size === "lg",
                      }
                    )}
                    value={value}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onClick={(e) => e.currentTarget.select()}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault()
                        setOpen(true)
                      }
                      if (e.key === "Escape") setOpen(false)
                    }}
                  />
                  {value && !isDisabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClear}
                      tabIndex={-1}
                      className={cn(
                        "absolute top-1/2 right-10 size-6 -translate-y-1/2 p-0",
                        {
                          "right-9": size === "sm",
                          "right-10": size === "default" || size === "lg",
                        }
                      )}
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Clear date</span>
                    </Button>
                  )}
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isDisabled}
                        tabIndex={-1}
                        className={cn(
                          "absolute top-1/2 right-2 size-6 -translate-y-1/2 p-0",
                          {
                            "size-5": size === "sm",
                            "size-6": size === "default" || size === "lg",
                          }
                        )}
                      >
                        <CalendarIcon
                          className={cn({
                            "size-3.5": size === "sm" || size === "default",
                            "size-4": size === "lg",
                          })}
                        />
                        <span className="sr-only">Select date</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="end"
                      alignOffset={-8}
                      side="bottom"
                      sideOffset={8}
                      collisionPadding={12}
                    >
                      <CalendarWithPresets
                        selected={currentDate}
                        onSelect={handleCalendarSelect}
                        minDate={calendarMinDate}
                        maxDate={calendarMaxDate}
                        month={month}
                        onMonthChange={setMonth}
                        fromYear={fromYear}
                        toYear={toYear}
                        disabled={(date) => {
                          if (
                            calendarMinDate &&
                            isBefore(date, calendarMinDate)
                          )
                            return true
                          if (calendarMaxDate && isAfter(date, calendarMaxDate))
                            return true
                          return false
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }}
      />
    </div>
  )
}
