import { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { NumericFormat } from "react-number-format"

import { cn } from "@/lib/utils"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

// Get default decimal places from environment variable
const DECIMAL_PLACES = Number(process.env.NEXT_PUBLIC_DEFAULT_AMT_DEC || "2")

interface CustomNumberInputProps<TSchemaType extends FieldValues> {
  form: UseFormReturn<TSchemaType>
  label?: string
  name: Path<TSchemaType>
  className?: string
  onBlurEvent?: (e: React.FocusEvent<HTMLInputElement>) => void
  onFocusEvent?: (e: React.FocusEvent<HTMLInputElement>) => void
  onChangeEvent?: (value: number) => void
  isRequired?: boolean
  isDisabled?: boolean
  round?: number
}

export default function CustomNumberInput<TSchemaType extends FieldValues>({
  form,
  label,
  name,
  className,
  onBlurEvent,
  onFocusEvent,
  onChangeEvent,
  isRequired = false,
  isDisabled = false,
  round = DECIMAL_PLACES,
}: CustomNumberInputProps<TSchemaType>) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {isRequired && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}
      <FormField
        control={form.control}
        name={name}
        render={({ field, fieldState }) => {
          const { error } = fieldState
          const showError = !!error
          const value = field.value as number | undefined

          return (
            <FormItem className={cn("flex flex-col", className)}>
              <NumericFormat
                id={name}
                value={value ?? ""}
                onFocus={(e) => {
                  e.target.select()
                  if (onFocusEvent) {
                    onFocusEvent(e)
                  }
                }}
                onValueChange={(values) => {
                  const { floatValue } = values
                  const roundedValue =
                    floatValue !== null && floatValue !== undefined
                      ? Number(floatValue.toFixed(round))
                      : undefined
                  field.onChange(roundedValue)
                  if (onChangeEvent && roundedValue !== undefined) {
                    onChangeEvent(roundedValue)
                  }
                }}
                onBlur={(e) => {
                  if (typeof value === "number" && !isNaN(value)) {
                    const roundedValue = Number(value.toFixed(round))
                    field.onChange(roundedValue)
                  } else if (value === undefined || value === null) {
                    field.onChange(undefined)
                  }
                  field.onBlur()
                  if (onBlurEvent) {
                    onBlurEvent(e)
                  }
                }}
                decimalScale={round}
                fixedDecimalScale={true}
                allowLeadingZeros={true}
                thousandSeparator={true}
                allowNegative={true}
                disabled={isDisabled}
                tabIndex={isDisabled ? -1 : undefined}
                className={cn(
                  "ring-offset-background flex h-9 w-full rounded-md border px-3 py-1.5 text-right text-sm",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  showError && "border-destructive",
                  isDisabled
                    ? "cursor-not-allowed border-gray-300 bg-gray-200 opacity-60 dark:border-gray-600 dark:bg-gray-700"
                    : "bg-muted/5 border-gray-400 dark:border-gray-500",
                  "hide-number-spinners"
                )}
              />

              {showError && (
                <p className="text-destructive mt-1 text-xs">{error.message}</p>
              )}
            </FormItem>
          )
        }}
      />
    </div>
  )
}
