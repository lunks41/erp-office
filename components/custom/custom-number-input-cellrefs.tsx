import { forwardRef } from "react"
import { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { NumericFormat } from "react-number-format"

import { cn } from "@/lib/utils"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

// Get default decimal places from environment variable
const DECIMAL_PLACES = Number(process.env.NEXT_PUBLIC_DEFAULT_AMT_DEC || "2")
interface CustomNumberInputCellRefsProps<TSchemaType extends FieldValues> {
  form: UseFormReturn<TSchemaType>
  label?: string
  name: Path<TSchemaType>
  className?: string
  onBlurEvent?: (e: React.FocusEvent<HTMLInputElement>) => void
  onChangeEvent?: (value: number) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  isRequired?: boolean
  isDisabled?: boolean
  round?: number
}
const CustomNumberInputCellRefs = forwardRef<
  HTMLInputElement,
  CustomNumberInputCellRefsProps<FieldValues>
>(
  <TSchemaType extends FieldValues>(
    {
      form,
      label,
      name,
      className,
      onBlurEvent,
      onChangeEvent,
      onKeyDown,
      onFocus,
      isRequired = false,
      isDisabled = false,
      round = DECIMAL_PLACES,
    }: CustomNumberInputCellRefsProps<TSchemaType>,
    ref: React.Ref<HTMLInputElement>
  ) => {
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
          render={({ field, fieldState }) => {
            const { error } = fieldState
            const showError = !!error
            const value = field.value as number | undefined
            return (
              <FormItem className="flex flex-col">
                <NumericFormat
                  onFocus={(e) => {
                    if (onFocus) onFocus(e)
                  }}
                  value={value ?? ""}
                  onValueChange={(values) => {
                    const { floatValue } = values
                    const roundedValue = floatValue
                      ? Number(floatValue.toFixed(round))
                      : 0
                    field.onChange(roundedValue)
                    if (onChangeEvent) {
                      onChangeEvent(roundedValue)
                    }
                  }}
                  onBlur={(e) => {
                    let roundedValue = 0
                    if (typeof value === "number" && !isNaN(value)) {
                      roundedValue = Number(value.toFixed(round))
                      field.onChange(roundedValue)
                    } else if (value === undefined || value === null) {
                      field.onChange(0)
                    }
                    field.onBlur()
                    if (onBlurEvent) {
                      onBlurEvent(e)
                    }
                  }}
                  onKeyDown={onKeyDown}
                  decimalScale={round}
                  fixedDecimalScale={true}
                  allowLeadingZeros={true}
                  thousandSeparator={true}
                  allowNegative={false}
                  disabled={isDisabled}
                  className={cn(
                    "ring-offset-background flex h-7.5 min-h-7.5 w-full rounded-md border px-2 py-0.5 text-right text-xs",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    showError
                      ? "border-destructive"
                      : isRequired && !isDisabled
                        ? "border-gray-400 dark:border-gray-500"
                        : "border-input",
                    isDisabled
                      ? "bg-background cursor-not-allowed opacity-50"
                      : isRequired
                        ? "bg-yellow-50 dark:bg-yellow-950/20"
                        : "bg-background",
                    "hide-number-spinners"
                  )}
                  getInputRef={ref}
                  tabIndex={0}
                />
                {showError && (
                  <p className="text-destructive mt-1 text-xs">
                    {error.message}
                  </p>
                )}
              </FormItem>
            )
          }}
        />
      </div>
    )
  }
)
CustomNumberInputCellRefs.displayName = "CustomNumberInputCellRefs"
export default CustomNumberInputCellRefs
