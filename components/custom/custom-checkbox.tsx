import { useState } from "react"
import { IconAlertCircle } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"

import { Checkbox } from "../ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form"
import { Label } from "../ui/label"

export type CustomCheckboxLabelPosition = "side" | "top"

export default function CustomCheckbox({
  form,
  label,
  name,
  onBlurEvent,
  className,
  size = "default", // "sm", "default", "lg"
  labelPosition = "side",
  isRequired = false,
  isDisabled = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  name: string
  label?: string
  onBlurEvent?: () => void
  className?: string
  size?: "sm" | "default" | "lg"
  labelPosition?: CustomCheckboxLabelPosition
  isRequired?: boolean
  isDisabled?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const isTopLabel = labelPosition === "top"

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState: { error, isDirty, isTouched } }) => {
        const showError = error && (isTouched || isDirty)

        const labelClasses = cn(
          "cursor-pointer text-xs font-medium",
          isRequired && "text-red-500 dark:text-red-400",
          isDisabled && "text-muted-foreground opacity-70",
          showError && "text-destructive"
        )

        const checkboxControl = (
          <FormControl>
            <div
              className="flex h-6 min-h-6 items-center"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                animate={isDisabled ? {} : { scale: isHovered ? 1.02 : 1 }}
                transition={{ duration: 0.15 }}
              >
                <Checkbox
                  id={isTopLabel ? name : undefined}
                  checked={field.value}
                  onCheckedChange={(value) => {
                    field.onChange(value)
                    if (onBlurEvent) onBlurEvent()
                  }}
                  disabled={isDisabled}
                  className={cn(
                    size === "sm",
                    size === "default",
                    size === "lg",
                    isDisabled && "cursor-not-allowed opacity-70",
                    "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                    "focus-visible:ring-primary border-2 focus-visible:ring-2 focus-visible:ring-offset-2"
                  )}
                />
              </motion.div>
            </div>
          </FormControl>
        )

        return (
          <div className={cn("flex flex-col gap-0.5", className)}>
            {isTopLabel ? (
              <FormItem className="flex flex-col gap-1 space-y-0">
                {label && (
                  <Label
                    htmlFor={name}
                    className={labelClasses}
                    onClick={() => !isDisabled && field.onChange(!field.value)}
                  >
                    {label}
                    {isRequired && (
                      <span className="ml-1" aria-hidden="true">
                        *
                      </span>
                    )}
                  </Label>
                )}
                {checkboxControl}
              </FormItem>
            ) : (
              <FormItem className="flex flex-row items-center gap-3 space-y-0">
                {checkboxControl}
                {label && (
                  <FormLabel
                    className={labelClasses}
                    onClick={() => !isDisabled && field.onChange(!field.value)}
                  >
                    {label}
                    {isRequired && (
                      <span
                        className="text-destructive ml-1"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    )}
                  </FormLabel>
                )}
              </FormItem>
            )}

            {showError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-destructive flex items-center gap-1 text-xs"
              >
                <IconAlertCircle size={12} />
                <span>{error.message}</span>
              </motion.div>
            )}
          </div>
        )
      }}
    />
  )
}
