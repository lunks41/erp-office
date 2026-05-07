import * as React from "react"
import { useAuthStore } from "@/stores/auth-store"
import {
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  startOfToday,
} from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { Control, FieldValues, Path, useWatch } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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

interface CustomDateNewProps<T extends FieldValues = FieldValues> {
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

export const CustomDateNew = <T extends FieldValues = FieldValues>({
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
}: CustomDateNewProps<T>) => {
  const { decimals } = useAuthStore()
  const decimalDateFormat =
    decimals[0]?.dateFormat || dateFormat || "dd/MM/yyyy"

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [month, setMonth] = React.useState<Date | undefined>(undefined)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Format date for display
  const formatDateForDisplay = React.useCallback(
    (date: Date | undefined): string => {
      if (!date || !isValid(date)) return ""
      return format(date, decimalDateFormat)
    },
    [decimalDateFormat]
  )

  // Parse user input string to Date
  const parseUserInput = React.useCallback(
    (input: string | Date | null | undefined): Date | undefined => {
      // Handle null/undefined
      if (!input) return undefined

      // Handle Date objects - return as-is if valid
      if (input instanceof Date) {
        return isValid(input) ? input : undefined
      }

      // Handle non-string values
      if (typeof input !== "string") return undefined

      // Handle empty strings
      if (input.trim() === "") return undefined

      // Array of possible date formats to try
      const formats = [
        decimalDateFormat, // Primary configured format (e.g., dd/MM/yyyy or dd/MMM/yyyy)
        "dd/MMM/yyyy", // Support for short month names with slashes
        "dd-MMM-yyyy", // Support for short month names with hyphen
        "dd MMM yyyy", // Support for short month names with spaces
        "dd/MM/yy", // Alternative: 15/10/25
        "dd-MM-yy", // Alternative: 15-10-25
        "dd-MM-yyyy", // Alternative: 15-10-2025
        "yyyy-MM-dd", // ISO format: 2025-10-15
        "yyyy-MMM-dd", // API format: 2025-Oct-15
        "MM/dd/yyyy", // US format: 10/15/2025
        "yyyy/MM/dd", // Alternative ISO: 2025/10/15
      ]

      // Try each format
      for (const formatStr of formats) {
        const parsedDate = parse(input, formatStr, new Date())
        if (isValid(parsedDate)) {
          // Fix 2-digit year parsing: if year is less than 100, assume 2000s
          const year = parsedDate.getFullYear()
          if (year < 100) {
            parsedDate.setFullYear(2000 + year)
          }
          return parsedDate
        }
      }

      // If all formats fail, try native Date constructor
      const nativeDate = new Date(input)
      if (isValid(nativeDate)) {
        return nativeDate
      }

      return undefined
    },
    [decimalDateFormat]
  )

  // Check if date is valid
  const isValidDateValue = React.useCallback(
    (date: Date | undefined): boolean => {
      if (!date || !isValid(date)) return false
      return true
    },
    []
  )

  // Validate date against min/max constraints
  const validateDateConstraints = React.useCallback(
    (date: Date | undefined): boolean => {
      if (!date || !isValid(date)) return false

      // Check max date (including isFutureShow logic)
      let effectiveMaxDate: Date | undefined
      if (isFutureShow) {
        // If isFutureShow is true, allow future dates
        // If maxDate is provided, use it; otherwise allow 2 years into the future
        if (maxDate) {
          effectiveMaxDate =
            maxDate instanceof Date ? maxDate : new Date(maxDate)
        } else {
          // Set max date to 2 years from now to allow future dates
          const futureDate = new Date()
          futureDate.setFullYear(futureDate.getFullYear() + 2)
          effectiveMaxDate = futureDate
        }
      } else {
        // If isFutureShow is false, limit to today
        effectiveMaxDate = new Date()
      }

      if (
        effectiveMaxDate &&
        isValid(effectiveMaxDate) &&
        isAfter(date, effectiveMaxDate)
      ) {
        return false
      }

      // Check min date
      if (minDate) {
        const minDateObj = minDate instanceof Date ? minDate : new Date(minDate)
        if (isValid(minDateObj) && isBefore(date, minDateObj)) {
          return false
        }
      }

      return true
    },
    [isFutureShow, maxDate, minDate]
  )

  // Watch the field value
  const fieldValue = useWatch({ control: form.control, name })

  // Sync local value with form field value
  React.useEffect(() => {
    const parsedFieldDate = parseUserInput(fieldValue as string)
    const displayValue = formatDateForDisplay(parsedFieldDate)

    // Only update if input is not focused (to preserve typing)
    if (
      displayValue &&
      displayValue !== value &&
      document.activeElement !== inputRef.current
    ) {
      setValue(displayValue)
      if (parsedFieldDate) {
        setMonth(parsedFieldDate)
      }
    } else if (!fieldValue) {
      setValue("")
    }
  }, [fieldValue, formatDateForDisplay, parseUserInput, value])

  // Calculate min/max dates for calendar
  const calendarMinDate = React.useMemo(() => {
    return minDate
      ? minDate instanceof Date
        ? minDate
        : new Date(minDate)
      : undefined
  }, [minDate])

  const calendarMaxDate = React.useMemo(() => {
    if (isFutureShow) {
      // If isFutureShow is true, allow future dates
      // If maxDate is provided, use it; otherwise allow 2 years into the future
      if (maxDate) {
        return maxDate instanceof Date ? maxDate : new Date(maxDate)
      }
      // Set max date to 2 years from now
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 2)
      return futureDate
    }
    // If isFutureShow is false, limit to today
    return new Date()
  }, [isFutureShow, maxDate])

  // Calculate year range for calendar dropdown
  const fromYear = React.useMemo(() => {
    if (minDate) {
      const minDateObj = minDate instanceof Date ? minDate : new Date(minDate)
      return minDateObj.getFullYear()
    }
    // Default to 100 years ago
    return new Date().getFullYear() - 100
  }, [minDate])

  const toYear = React.useMemo(() => {
    if (isFutureShow) {
      if (maxDate) {
        const maxDateObj = maxDate instanceof Date ? maxDate : new Date(maxDate)
        return maxDateObj.getFullYear()
      }
      // Show 2 years into the future when isFutureShow is true
      return new Date().getFullYear() + 2
    }
    // If isFutureShow is false, limit to current year
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
              setMonth(parsedDate)
              if (onChangeEvent) {
                onChangeEvent(parsedDate!)
              }
            } else if (inputValue === "") {
              field.onChange("")
              if (onChangeEvent) {
                onChangeEvent(null)
              }
            }
          }

          const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const parsedDate = parseUserInput(value)

            if (
              isValidDateValue(parsedDate) &&
              validateDateConstraints(parsedDate)
            ) {
              const formattedDate = formatDateForDisplay(parsedDate)
              if (formattedDate !== value) setValue(formattedDate)
              if (formattedDate !== field.value) field.onChange(formattedDate)
            } else if (value === "") {
              if (field.value !== "") field.onChange("")
            } else {
              setValue("")
              field.onChange("")
            }

            field.onBlur()
            onBlurEvent?.(e)
          }

          const handleCalendarSelect = (date: Date | undefined) => {
            if (date) {
              const formattedDate = formatDateForDisplay(date)
              setValue(formattedDate)
              field.onChange(formattedDate)
              setMonth(date)
              if (onChangeEvent) {
                onChangeEvent(date)
              }
              setOpen(false)
              // Radix returns focus to PopoverTrigger (tabIndex=-1) on close;
              // redirect it to the text input so Tab moves to the next field.
              setTimeout(() => inputRef.current?.focus(), 0)
            }
          }

          const handleClear = () => {
            setValue("")
            field.onChange("")
            if (onChangeEvent) {
              onChangeEvent(null)
            }
          }

          const handleTodayClick = () => {
            const today = startOfToday()
            if (validateDateConstraints(today)) {
              const formattedDate = formatDateForDisplay(today)
              setValue(formattedDate)
              field.onChange(formattedDate)
              setMonth(today)
              if (onChangeEvent) {
                onChangeEvent(today)
              }
              setOpen(false)
            }
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
                        "h-8 text-xs": size === "default",
                        "h-10 text-sm": size === "lg",
                      }
                    )}
                    value={value}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onClick={(e) => {
                      e.currentTarget.select()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault()
                        setOpen(true)
                      }
                      if (e.key === "Escape") {
                        setOpen(false)
                      }
                    }}
                  />

                  {/* Clear Button */}
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

                  {/* Calendar Popover */}
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
                      sideOffset={10}
                      avoidCollisions={false}
                    >
                      <Calendar
                        mode="single"
                        selected={currentDate}
                        captionLayout="dropdown"
                        month={month}
                        onMonthChange={setMonth}
                        onSelect={handleCalendarSelect}
                        fromYear={fromYear}
                        toYear={toYear}
                        disabled={(date) => {
                          if (
                            calendarMinDate &&
                            isBefore(date, calendarMinDate)
                          ) {
                            return true
                          }
                          if (
                            calendarMaxDate &&
                            isAfter(date, calendarMaxDate)
                          ) {
                            return true
                          }
                          return false
                        }}
                        initialFocus
                      />
                      {/* Footer with Today button */}
                      <div className="border-t p-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleTodayClick}
                          disabled={!validateDateConstraints(startOfToday())}
                        >
                          Today
                        </Button>
                      </div>
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
