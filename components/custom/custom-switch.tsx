import { useState } from "react"
import { IconAlertCircle } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { Path, UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"

import { FormControl, FormField, FormItem, FormLabel } from "../ui/form"
import { Switch } from "../ui/switch"

interface CustomSwitchProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  label?: string
  name: Path<T>
  onBlurEvent?: () => void
  className?: string
  size?: "sm" | "default" | "lg"
  isRequired?: boolean
  isDisabled?: boolean
  activeColor?: "primary" | "success" | "danger" | "warning" | "info"
}

export default function CustomSwitch<T extends Record<string, unknown>>({
  form,
  label,
  name,
  onBlurEvent,
  className,
  size = "default", // "sm", "default", "lg"
  isRequired = false,
  isDisabled = false,
  activeColor: _activeColor = "primary",
}: CustomSwitchProps<T>) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState: { error, isDirty, isTouched } }) => {
        const showError = error && (isTouched || isDirty)
        const isChecked = Boolean(field.value)

        return (
          <FormItem className={cn("flex flex-col", className)}>
            {label && (
              <FormLabel
                className={cn(
                  "text-sm font-medium",
                  isRequired && "text-red-500",
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

            <FormControl>
              <div
                className="flex items-center gap-2"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  animate={isDisabled ? {} : { scale: isHovered ? 1.02 : 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <Switch
                    checked={isChecked}
                    onCheckedChange={(value) => {
                      field.onChange(value)
                      if (onBlurEvent) onBlurEvent()
                    }}
                    disabled={isDisabled}
                    className={cn(
                      // Size variations
                      size === "sm" &&
                        "h-[18px] w-[34px] [&>span]:h-[14px] [&>span]:w-[14px]",
                      size === "default" &&
                        "h-[22px] w-[40px] [&>span]:h-[18px] [&>span]:w-[18px]",
                      size === "lg" &&
                        "h-[26px] w-[48px] [&>span]:h-[22px] [&>span]:w-[22px]",
                      isDisabled && "cursor-not-allowed opacity-70",
                      !isChecked && "bg-red-500/50 dark:bg-red-700/50",
                      "data-[state=checked]:bg-primary dark:data-[state=checked]:bg-blue-400"
                    )}
                  />
                </motion.div>

                {isChecked && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="text-primary-foreground dark:text-primary-foreground bg-primary rounded px-1.5 py-0.5 text-xs dark:bg-blue-400"
                  >
                    On
                  </motion.span>
                )}

                {!isChecked && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="text-muted-foreground dark:text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs dark:bg-slate-700"
                  >
                    Off
                  </motion.span>
                )}
              </div>
            </FormControl>

            {showError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-destructive mt-1 flex items-center gap-1 text-xs"
              >
                <IconAlertCircle size={12} />
                <span>{error.message}</span>
              </motion.div>
            )}
          </FormItem>
        )
      }}
    />
  )
}
