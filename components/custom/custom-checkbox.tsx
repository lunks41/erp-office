import { useState } from "react"
import { IconAlertCircle } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"

import { Checkbox } from "../ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form"

export default function CustomCheckbox({
  form,
  label,
  name,
  onBlurEvent,
  className,
  size = "default", // "sm", "default", "lg"
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
  isRequired?: boolean
  isDisabled?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState: { error, isDirty, isTouched } }) => {
        const showError = error && (isTouched || isDirty)

        return (
          <div className={cn("flex flex-col gap-0.5", className)}>
            <FormItem className="flex flex-row items-center gap-3">
              <FormControl>
                <div
                  className="flex h-8 min-h-8 items-center gap-2"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    animate={isDisabled ? {} : { scale: isHovered ? 1.02 : 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(value) => {
                        field.onChange(value)
                        if (onBlurEvent) onBlurEvent()
                      }}
                      disabled={isDisabled}
                      className={cn(
                        // Size variations - larger sizes to match form elements
                        size === "sm",
                        size === "default",
                        size === "lg",
                        isDisabled && "cursor-not-allowed opacity-70",
                        "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                        "focus-visible:ring-primary border-2 focus-visible:ring-2 focus-visible:ring-offset-2"
                      )}
                    />
                  </motion.div>

                  {field.value && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="text-primary-foreground bg-primary rounded px-1.5 py-0.5 text-xs"
                    >
                      On
                    </motion.span>
                  )}

                  {!field.value && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs"
                    >
                      Off
                    </motion.span>
                  )}
                </div>
              </FormControl>

              {label && (
                <FormLabel
                  className={cn(
                    "cursor-pointer text-xs font-medium",
                    isRequired && "text-red-500",
                    isDisabled && "text-muted-foreground opacity-70",
                    showError && "text-destructive"
                  )}
                  onClick={() => !isDisabled && field.onChange(!field.value)}
                >
                  {label}
                  {isRequired && (
                    <span className="text-destructive ml-1" aria-hidden="true">
                      *
                    </span>
                  )}
                </FormLabel>
              )}
            </FormItem>

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
