"use client"

import { motion } from "framer-motion"
import { UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SelectCommonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  name: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
  label?: string
  className?: string
  isRequired?: boolean
  isDisabled?: boolean
  onValueChange?: (value: string) => void
}

export default function SelectCommon({
  form,
  name,
  options,
  placeholder = "Select...",
  label,
  className,
  isRequired = false,
  isDisabled = false,
  onValueChange,
}: SelectCommonProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState: { error, isDirty, isTouched } }) => {
        const showError = error && (isTouched || isDirty)

        const handleSelect = (value: string) => {
          field.onChange(value)
          if (onValueChange) {
            onValueChange(value)
          }
        }

        return (
          <div className={cn("flex flex-col gap-0.5", className)}>
            {label && (
              <FormLabel
                className={cn(
                  "text-xs font-medium",
                  isDisabled && "text-muted-foreground opacity-70",
                  showError && "text-destructive"
                )}
              >
                {label}
                {isRequired && (
                  <span className="text-destructive ml-1" aria-hidden="true">
                    *
                  </span>
                )}
              </FormLabel>
            )}

            <FormItem>
              <Select
                onValueChange={handleSelect}
                value={String(field.value || "")}
                disabled={isDisabled}
              >
                <FormControl>
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-destructive mt-1 flex items-center gap-1 text-xs"
                >
                  <span>{error.message}</span>
                </motion.div>
              )}
            </FormItem>
          </div>
        )
      }}
    />
  )
}
