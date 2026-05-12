"use client"

//copy-rate-form.tsx

import { useCallback, useEffect, useState } from "react"
import { ICustomerLookup, IPortLookup } from "@/interfaces/lookup"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, XIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { copyRateDirect } from "@/hooks/use-tariff"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import {
  CustomerAutocomplete,
  PortAutocomplete,
  TaskAutocomplete,
} from "@/components/autocomplete"
import { CustomCheckbox } from "@/components/custom"

const copyRateSchema = z
  .object({
    fromCustomerId: z.number().min(1, "From Customer is required"),
    fromPortId: z.number().min(0),
    toCustomerId: z.number().min(1, "To Customer is required"),
    toPortId: z.number().min(0),
    fromTaskId: z.number().min(0),
    multipleId: z.string().optional(),
    isOverwrite: z.boolean(),
    isDelete: z.boolean(),
    isAllTasks: z.boolean(),
    isAllPorts: z.boolean(),
  })
  .refine(
    (data) => {
      // If isAllPorts is false, fromPortId is required
      if (!data.isAllPorts && data.fromPortId < 1) {
        return false
      }
      return true
    },
    {
      message: "From Port is required",
      path: ["fromPortId"],
    }
  )
  .refine(
    (data) => {
      // If isAllTasks is false, fromTaskId is required
      if (!data.isAllTasks && data.fromTaskId < 1) {
        return false
      }
      return true
    },
    {
      message: "From Task is required",
      path: ["fromTaskId"],
    }
  )
  .refine(
    (data) => {
      // If isAllPorts is false, toPortId is required
      if (!data.isAllPorts && data.toPortId < 1) {
        return false
      }
      return true
    },
    {
      message: "To Port is required",
      path: ["toPortId"],
    }
  )
  .refine(
    (data) => {
      // Allow same customer when port is different; disallow only when same customer AND same port
      if (data.fromCustomerId > 0 && data.toCustomerId > 0) {
        if (data.fromCustomerId !== data.toCustomerId) return true // different customer is valid
        if (data.isAllPorts) return true // same customer, copy to all ports is valid
        return data.fromPortId !== data.toPortId // same customer: must be different port
      }
      return true
    },
    {
      message:
        "From and To must differ: use a different customer or a different port",
      path: ["toCustomerId"],
    }
  )

type CopyRateSchemaType = z.infer<typeof copyRateSchema>

interface CopyRateFormProps {
  onCancelAction: () => void
  onSaveConfirmation?: (data: Record<string, unknown>) => void
}

export function CopyRateForm({
  onCancelAction,
  onSaveConfirmation,
}: CopyRateFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CopyRateSchemaType>({
    resolver: zodResolver(copyRateSchema),
    defaultValues: {
      fromCustomerId: 0,
      fromPortId: 0,
      fromTaskId: 0,
      toCustomerId: 0,
      toPortId: 0,
      multipleId: "",
      isOverwrite: true,
      isDelete: false,
      isAllTasks: false,
      isAllPorts: false,
    },
  })

  // Watch key fields to drive validation-side effects
  const watchedValues = form.watch([
    "fromCustomerId",
    "fromPortId",
    "fromTaskId",
    "isAllPorts",
    "isAllTasks",
  ])
  const watchedFromCustomerId = watchedValues[0]
  const watchedFromPortId = watchedValues[1]
  const watchedFromTaskId = watchedValues[2]
  const watchedIsAllPorts = watchedValues[3]
  const watchedIsAllTasks = watchedValues[4]

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        watchedFromCustomerId > 0 &&
        (watchedIsAllPorts || watchedFromPortId > 0) &&
        watchedFromTaskId > 0
      ) {
        // valid combination – nothing to do here currently,
        // but keep this placeholder if additional side-effects are needed later
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [
    watchedFromCustomerId,
    watchedFromPortId,
    watchedFromTaskId,
    watchedIsAllPorts,
    watchedIsAllTasks,
  ])

  const handleSubmit = async (data: CopyRateSchemaType) => {
    const copyRateData = {
      fromCompanyId: 0,
      toCompanyId: 0,
      fromTaskId: data.fromTaskId,
      fromPortId: data.fromPortId,
      toPortId: data.isAllPorts ? 0 : data.toPortId,
      fromCustomerId: data.fromCustomerId,
      toCustomerId: data.toCustomerId,
      multipleId: data.multipleId || "",
      isOverwrite: data.isOverwrite,
      isDelete: data.isDelete,
      isAllTasks: data.isAllTasks,
      isAllPorts: data.isAllPorts,
    }

    if (onSaveConfirmation) {
      console.log("copyRateData", copyRateData)
      onSaveConfirmation(copyRateData)
    } else {
      // Fallback to direct execution if no confirmation handler
      setIsLoading(true)
      try {
        const response = await copyRateDirect(copyRateData)
        if (response?.result === 1) {
          toast.success(response.message || "Rates copied successfully")
          onCancelAction()
          form.reset()
        } else {
          const errorMessage = response?.message || "Failed to copy rates"
          toast.error(errorMessage)
        }
      } catch (error) {
        console.error("Error copying rates:", error)
        toast.error("Failed to copy rates")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCustomerChange = useCallback(
    (field: "fromCustomerId" | "toCustomerId") =>
      (selectedCustomer: ICustomerLookup | null) => {
        const customerId = selectedCustomer?.customerId || 0
        form.setValue(field, customerId)
      },
    [form]
  )

  const handlePortChange = useCallback(
    (field: "fromPortId" | "toPortId") =>
      (selectedPort: IPortLookup | null) => {
        form.setValue(field, selectedPort?.portId || 0)
      },
    [form]
  )

  // Watch checkbox values to control field states
  const isAllPorts = form.watch("isAllPorts")
  const isAllTasks = form.watch("isAllTasks")

  // Handle All Ports checkbox change - clear fromPortId and toPortId when checked
  useEffect(() => {
    if (isAllPorts) {
      form.setValue("fromPortId", 0)
      form.setValue("toPortId", 0)
    }
  }, [isAllPorts, form])

  // Handle All Tasks checkbox change - clear fromTaskId when checked
  useEffect(() => {
    if (isAllTasks) {
      form.setValue("fromTaskId", 0)
    }
  }, [isAllTasks, form])

  // Get form errors for display
  const formErrors = form.formState.errors

  return (
    <div className="w-full space-y-4">
      <Form {...form}>
        {/* Validation Error Display */}
        {Object.keys(formErrors).length > 0 && (
          <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
            <h4 className="text-destructive mb-2 text-sm font-medium">
              Please fix the following errors:
            </h4>
            <ul className="text-destructive space-y-1 text-sm">
              {Object.entries(formErrors).map(([field, error]) => (
                <li key={field}>
                  • {error?.message || `${field} is required`}
                </li>
              ))}
            </ul>
          </div>
        )}
        <form
          onSubmit={form.handleSubmit(handleSubmit, (errors) => {
            console.error("Form validation failed:", errors)
            // Scroll to first error
            const firstErrorField = Object.keys(errors)[0]
            if (firstErrorField) {
              const element = document.querySelector(
                `[name="${firstErrorField}"]`
              )
              element?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          })}
          className="w-full space-y-4"
        >
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            {/* From Section */}
            <div className="bg-card space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-card0"></div>
                <h3 className="text-lg font-semibold text-blue-700">From</h3>
              </div>
              <div className="space-y-3">
                <CustomerAutocomplete
                  form={form}
                  name="fromCustomerId"
                  label="Customer"
                  isRequired
                  onChangeEvent={handleCustomerChange("fromCustomerId")}
                />
                <div className="grid grid-cols-2 gap-2">
                  <PortAutocomplete
                    form={form}
                    name="fromPortId"
                    label="Port"
                    isRequired={!isAllPorts}
                    isDisabled={isAllPorts}
                    onChangeEvent={handlePortChange("fromPortId")}
                  />
                  <div className="flex items-end pb-2">
                    <CustomCheckbox
                      form={form}
                      name="isAllPorts"
                      label="All Ports"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TaskAutocomplete
                    form={form}
                    name="fromTaskId"
                    label="Task"
                    isRequired={!isAllTasks}
                    isDisabled={isAllTasks}
                  />
                  <div className="flex items-end pb-2">
                    <CustomCheckbox
                      form={form}
                      name="isAllTasks"
                      label="All Tasks"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* To Section */}
            <div className="bg-card space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <h3 className="text-lg font-semibold text-green-700">To</h3>
              </div>
              <div className="space-y-3">
                <CustomerAutocomplete
                  form={form}
                  name="toCustomerId"
                  label="Customer"
                  isRequired
                  onChangeEvent={handleCustomerChange("toCustomerId")}
                />
                <PortAutocomplete
                  form={form}
                  name="toPortId"
                  label="Port"
                  isRequired={!isAllPorts}
                  isDisabled={isAllPorts}
                  onChangeEvent={handlePortChange("toPortId")}
                />
              </div>
            </div>
          </div>

          {/* Options Section */}
          <div className="bg-muted/30 w-full space-y-3 rounded-lg border p-3">
            <h3 className="text-lg font-semibold">Copy Options</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isOverwrite"
                  checked={form.watch("isOverwrite")}
                  onCheckedChange={(c) => {
                    const isChecked = c as boolean
                    form.setValue("isOverwrite", isChecked)
                    // If overwrite is checked, uncheck delete
                    if (isChecked) {
                      form.setValue("isDelete", false)
                    }
                  }}
                />
                <label htmlFor="isOverwrite" className="text-sm font-medium">
                  Overwrite existing rates
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDelete"
                  checked={form.watch("isDelete")}
                  onCheckedChange={(c) => {
                    const isChecked = c as boolean
                    form.setValue("isDelete", isChecked)
                    // If delete is checked, uncheck overwrite
                    if (isChecked) {
                      form.setValue("isOverwrite", false)
                    }
                  }}
                />
                <label htmlFor="isDelete" className="text-sm font-medium">
                  Delete source after copy
                </label>
              </div>
            </div>
          </div>

          {/* Information Note */}
          <div className="w-full rounded-lg border border-amber-200/60 bg-amber-50/80 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Important Note
                </p>
                <p className="text-xs leading-relaxed text-amber-800/80 dark:text-amber-200/70">
                  You can copy between different customers or the same customer
                  with different ports. From and To must differ by customer and/or
                  port (e.g. same customer, different port).
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancelAction}
              className="flex items-center gap-2"
            >
              <XIcon className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Copying..." : "Copy Rates"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
