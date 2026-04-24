"use client"

import { Path, UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
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

const buttonVariantClasses: Record<string, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive:
    "bg-destructive text-white hover:bg-destructive/90",
  outline:
    "bg-background border-l hover:bg-accent hover:text-accent-foreground dark:bg-input/30",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost:
    "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
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
      e.preventDefault()
    }
  }

  const hasButton = buttonText || buttonIcon

  const containerClass = cn(
    "flex h-7.5 w-full items-stretch overflow-hidden rounded-md border text-xs shadow-xs transition-[color,box-shadow]",
    "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
    isDisabled
      ? "cursor-not-allowed border-gray-300 bg-gray-200 opacity-60 dark:border-gray-600 dark:bg-gray-700"
      : isRequired
        ? "border-gray-400 bg-yellow-50 dark:border-gray-500 dark:bg-yellow-950/20"
        : "border-gray-400 bg-transparent dark:border-gray-500 dark:bg-input/30"
  )

  const inputClass =
    "flex-1 min-w-0 bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"

  const btnClass = cn(
    "flex shrink-0 items-center gap-1 px-2 text-xs font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3",
    buttonVariantClasses[buttonVariant ?? "outline"] ??
      buttonVariantClasses["outline"],
    buttonVariant === "outline" || buttonVariant === "ghost"
      ? "border-l border-gray-300 dark:border-gray-600"
      : ""
  )

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
          <FormItem className="flex flex-col">
            <FormControl>
              <div className={containerClass}>
                {hasButton && buttonPosition === "left" && (
                  <button
                    type="button"
                    className={cn(btnClass, "border-l-0 border-r border-gray-300 dark:border-gray-600")}
                    onClick={onButtonClick}
                    disabled={buttonDisabled || isDisabled}
                    tabIndex={-1}
                  >
                    {buttonIcon}
                    {buttonText}
                  </button>
                )}
                <input
                  id={name}
                  className={inputClass}
                  onKeyDown={handleKeyPress}
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
                {hasButton && buttonPosition === "right" && (
                  <button
                    type="button"
                    className={btnClass}
                    onClick={onButtonClick}
                    disabled={buttonDisabled || isDisabled}
                    tabIndex={-1}
                  >
                    {buttonIcon}
                    {buttonText}
                  </button>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
