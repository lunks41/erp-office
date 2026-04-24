import React from "react"
import { useAuthStore } from "@/stores/auth-store"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { FieldValues, Path, UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import { FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"

import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { TimePicker } from "../ui/time-picker-demo"

interface CustomDateTimePickerProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>
  label?: string
  name: Path<T>
  className?: string
  onChangeEvent?: (date: Date | null) => void
  onBlurEvent?: (date: Date | null) => void
  isDisabled?: boolean
  isRequired?: boolean
  placeholder?: string
  size?: "default" | "sm" | "lg"
  isFutureShow?: boolean
}

export const CustomDateTimePicker = <T extends FieldValues = FieldValues>({
  form,
  label,
  name,
  className,
  onChangeEvent,
  onBlurEvent,
  isDisabled = false,
  isRequired = false,
  placeholder = "Pick a date and time",
  size = "sm",
  isFutureShow = false,
}: CustomDateTimePickerProps<T>) => {
  const { decimals } = useAuthStore()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const [isOpen, setIsOpen] = React.useState(false)

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (onChangeEvent) {
      onChangeEvent(date || null)
    }
  }

  // Handle popover close (blur equivalent)
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open && onBlurEvent) {
      // Popover closed, trigger blur event with current value
      const currentValue = form.getValues(name)
      onBlurEvent(currentValue || null)
    }
  }

  // Handle clear date
  const handleClear = (
    field: { onChange: (value: Date | null) => void },
    event: React.MouseEvent
  ) => {
    event.stopPropagation()
    field.onChange(null)
    handleDateChange(undefined)
  }

  // Get button size classes based on size prop
  const getButtonSizeClasses = () => {
    switch (size) {
      case "lg":
        return "h-12 px-4 text-base"
      case "default":
        return "h-7.5 px-2 text-xs"
      case "sm":
      default:
        return "h-7.5 px-2 text-xs"
    }
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label && (
        <Label htmlFor={name} className="text-xs font-medium">
          {label}
          {isRequired && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <div className="relative w-full">
              <Popover open={isOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isDisabled}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      getButtonSizeClasses(),
                      !field.value && "text-muted-foreground",
                      field.value && "pr-8"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, `${dateFormat} HH:mm`)
                    ) : (
                      <span>{placeholder}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date)
                      handleDateChange(date)
                    }}
                    disabled={(date) => {
                      const isFutureDate = date > new Date()
                      const isTooPast = date < new Date("1900-01-01")
                      return (!isFutureShow && isFutureDate) || isTooPast
                    }}
                  />
                  {field.value && (
                    <div className="border-t p-3">
                      <TimePicker
                        setDate={(date) => {
                          field.onChange(date)
                          handleDateChange(date)
                        }}
                        date={field.value}
                      />
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              {field.value && !isDisabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full rounded-l-none hover:bg-transparent"
                  onClick={(e) => handleClear(field, e)}
                >
                  <X className="text-muted-foreground hover:text-foreground h-4 w-4" />
                </Button>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
