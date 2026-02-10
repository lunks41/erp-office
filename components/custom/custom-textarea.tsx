"use client"

import { Path, UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

interface CustomTextareaProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name?: Path<T>
  label?: string
  className?: string
  placeholder?: string
  onBlurEvent?: () => void
  onChangeEvent?: () => void
  isDisabled?: boolean
  isRequired?: boolean
  maxLength?: number
  showCharacterCount?: boolean
  minRows?: number
  maxRows?: number
}

export default function CustomTextarea<T extends Record<string, unknown>>({
  form,
  label,
  name,
  className,
  placeholder,
  onBlurEvent,
  onChangeEvent,
  isDisabled = false,
  isRequired = false,
  maxLength,
  showCharacterCount = false,
  minRows = 1,
  maxRows = 6,
}: CustomTextareaProps<T>) {
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
        name={name || ("" as Path<T>)}
        render={({ field, fieldState }) => {
          const { error } = fieldState
          const showError = !!error
          const value = field.value as string

          return (
            <FormItem className={cn("flex flex-col", className)}>
              <div className="relative">
                <textarea
                  {...field}
                  value={value || ""}
                  placeholder={placeholder}
                  disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : undefined}
                  maxLength={maxLength}
                  onBlur={() => {
                    field.onBlur()
                    onBlurEvent?.()
                  }}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    onChangeEvent?.()
                  }}
                  rows={minRows}
                  style={{
                    minHeight: `${minRows * 1.5}rem`,
                    maxHeight: `${maxRows * 1.5}rem`,
                    resize: "vertical",
                  }}
                  className={cn(
                    "ring-offset-background flex w-full rounded-md border px-3 py-2 text-sm",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    showError && "border-destructive",
                    isDisabled
                      ? "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-500 opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      : "bg-muted/5 border-gray-400 dark:border-gray-500"
                  )}
                />
              </div>

              <div className="mt-1 flex items-center justify-between">
                {showError && (
                  <p className="text-destructive text-xs">{error.message}</p>
                )}
                {showCharacterCount && maxLength && (
                  <span className="text-sm text-gray-500">
                    {value?.length || 0}/{maxLength}
                  </span>
                )}
              </div>
            </FormItem>
          )
        }}
      />
    </div>
  )
}
