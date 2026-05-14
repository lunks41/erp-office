import React from "react"
import { format, isValid, parse, startOfDay } from "date-fns"
import { Control, FieldValues, Path } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useCompanyStore } from "@/stores/company-store"
interface CustomDateNoPastProps<T extends FieldValues = FieldValues> {
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
  allowToday?: boolean
}

export const CustomDateNoPast = <T extends FieldValues = FieldValues>({
  form,
  label,
  name,
  className,
  onBlurEvent,
  onChangeEvent,
  isDisabled = false,
  isRequired = false,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  dateFormat = "dd/MM/yyyy",
  size = "sm",
  isFutureShow = false,
  allowToday = true,
}: CustomDateNoPastProps<T>) => {
  const { decimals } = useCompanyStore()
  const decimalDateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"

  // Convert Date or string to "yyyy-MM-dd" format
  const parseDateInput = (value: Date | string | undefined) => {
    if (!value) return ""
    if (value instanceof Date) {
      return format(value, decimalDateFormat)
    }
    if (typeof value === "string") {
      const parsedDate = parse(value, dateFormat, new Date())
      return isValid(parsedDate) ? format(parsedDate, decimalDateFormat) : value
    }
    return ""
  }

  // Get today's date in yyyy-MM-dd format
  const today = format(new Date(), decimalDateFormat)

  // Calculate minimum date based on allowToday prop
  const getMinDate = () => {
    if (minDate) {
      return parseDateInput(minDate)
    }

    const today = new Date()
    if (!allowToday) {
      // If today is not allowed, set minimum to tomorrow
      today.setDate(today.getDate() + 1)
    }
    return format(today, decimalDateFormat)
  }

  // Determine max date based on isFutureShow prop
  const effectiveMaxDate = isFutureShow ? maxDate : today

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label && (
        <Label
          htmlFor={name}
          className={cn("text-xs font-medium", isRequired && "text-red-500")}
        >
          {label}
          {isRequired && <span className="ml-1">*</span>}
        </Label>
      )}
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                type="date"
                id={name}
                disabled={isDisabled}
                placeholder={placeholder}
                min={getMinDate()}
                max={parseDateInput(effectiveMaxDate)}
                className={cn(
                  "w-full",
                  isRequired &&
                    !isDisabled &&
                    "bg-yellow-50! dark:bg-yellow-950/20!",
                  {
                    "h-7.5 text-xs": size === "sm" || size === "default",
                    "h-10 text-sm": size === "lg",
                  }
                )}
                {...field}
                value={parseDateInput(field.value)}
                onChange={(e) => {
                  const value = e.target.value // Already in "yyyy-MM-dd"
                  const date = value ? new Date(value) : null

                  // Additional validation to prevent past dates
                  if (date) {
                    const today = startOfDay(new Date())
                    const selectedDate = startOfDay(date)

                    if (!allowToday && selectedDate <= today) {
                      // If today is not allowed and selected date is today or past, don't update
                      return
                    }

                    if (allowToday && selectedDate < today) {
                      // If today is allowed but selected date is past, don't update
                      return
                    }
                  }

                  field.onChange(value)
                  if (onChangeEvent) {
                    onChangeEvent(date)
                  }
                }}
                onBlur={(e) => {
                  field.onBlur()
                  onBlurEvent?.(e)
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
