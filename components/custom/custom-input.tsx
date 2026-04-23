"use client"

import { Path, UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { Label } from "../ui/label"

interface CustomInputProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: Path<T>
  label?: string
  placeholder?: string
  className?: string
  onBlurEvent?: (e: React.FocusEvent<HTMLInputElement>) => void
  onChangeEvent?: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  isRequired?: boolean
  isDisabled?: boolean
}

export default function CustomInput<T extends Record<string, unknown>>({
  form,
  name,
  label,
  placeholder,
  className,
  onBlurEvent,
  onChangeEvent,
  type = "text",
  isRequired = false,
  isDisabled = false,
}: CustomInputProps<T>) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (type === "number" && !/[0-9]/.test(e.key) && e.key !== "Tab") {
      e.preventDefault() // Block non-numeric keys except Tab
    }
  }

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
                onKeyDown={(e) => {
                  handleKeyPress(e)
                }}
                type={type}
                placeholder={placeholder}
                disabled={isDisabled}
                value={
                  type === "number"
                    ? field.value === undefined || field.value === null
                      ? ""
                      : String(field.value)
                    : String(field.value || "")
                }
                onChange={(e) => {
                  const value =
                    type === "number"
                      ? e.target.value === ""
                        ? 0
                        : Number(e.target.value)
                      : e.target.value
                  field.onChange(value)
                  if (onChangeEvent) {
                    onChangeEvent(e)
                  }
                }}
                onBlur={(e) => {
                  field.onBlur()
                  if (onBlurEvent) {
                    onBlurEvent(e)
                  }
                }}
                className={cn(
                  "h-8 min-h-8 px-2 py-1 text-xs",
                  isDisabled
                    ? "cursor-not-allowed border-gray-400! bg-gray-100! opacity-70 dark:border-gray-500! dark:bg-gray-800!"
                    : isRequired
                      ? "focus-visible:ring-primary border-gray-400! bg-yellow-50! focus-visible:ring-1 dark:border-gray-500! dark:bg-yellow-950/20!"
                      : "bg-muted/5 focus-visible:ring-primary border-gray-400! focus-visible:ring-1 dark:border-gray-500!"
                )}
                tabIndex={0}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
