"use client"

import { Path, UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"

interface CustomInputGroupProps<T extends Record<string, unknown>> {
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
  // Button props
  buttonText?: string
  buttonIcon?: React.ReactNode
  buttonPosition?: "left" | "right"
  onButtonClick?: () => void
  buttonVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
  buttonDisabled?: boolean
}

export default function CustomInputGroup<T extends Record<string, unknown>>({
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
  buttonText,
  buttonIcon,
  buttonPosition = "right",
  onButtonClick,
  buttonVariant = "outline",
  buttonDisabled = false,
}: CustomInputGroupProps<T>) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (type === "number" && !/[0-9]/.test(e.key) && e.key !== "Tab") {
      e.preventDefault() // Block non-numeric keys except Tab
    }
  }

  const hasButton = buttonText || buttonIcon

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <Label
          htmlFor={name}
          className={cn("text-sm font-medium", isRequired && "text-red-500")}
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
              {hasButton ? (
                <InputGroup
                  data-disabled={isDisabled}
                  className={cn(
                    isDisabled
                      ? "cursor-not-allowed border-gray-300 bg-gray-200 opacity-60 dark:border-gray-600 dark:bg-gray-700"
                      : isRequired &&
                          "border-gray-400 bg-yellow-50 dark:border-gray-500 dark:bg-yellow-950/20"
                  )}
                >
                  {buttonPosition === "left" && (
                    <InputGroupAddon align="inline-start">
                      <InputGroupButton
                        onClick={onButtonClick}
                        disabled={buttonDisabled}
                        variant={buttonVariant}
                      >
                        {buttonIcon}
                        {buttonText}
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                  <InputGroupInput
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
                    tabIndex={0}
                  />
                  {buttonPosition === "right" && (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        onClick={onButtonClick}
                        disabled={buttonDisabled}
                        variant={buttonVariant}
                      >
                        {buttonIcon}
                        {buttonText}
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                </InputGroup>
              ) : (
                <InputGroupInput
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
                    isDisabled
                      ? "cursor-not-allowed border-gray-300 bg-gray-200 opacity-60 dark:border-gray-600 dark:bg-gray-700"
                      : isRequired &&
                          "border-gray-400 bg-yellow-50 dark:border-gray-500 dark:bg-yellow-950/20"
                  )}
                  tabIndex={0}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
