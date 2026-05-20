"use client"

//copy-company-rate-form.tsx

import { useCallback, useEffect, useState } from "react"
import { ICustomerLookup, IPortLookup } from "@/interfaces/lookup"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, XIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { copyCompanyTariffDirect } from "@/hooks/use-tariff"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import {
  CompanyAutocomplete,
  CompanyCustomerAutocomplete,
  PortAutocomplete,
  TaskAutocomplete,
} from "@/components/autocomplete"
import { CustomCheckbox } from "@/components/custom"

const copyCompanyRateSchema = z
  .object({
    fromCompanyId: z.number().min(1, "From Company is required"),
    fromCustomerId: z.number().min(1, "From Customer is required"),
    fromPortId: z.number().min(0),
    toCompanyId: z.number().min(1, "To Company is required"),
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
      // Prevent selecting the same company in both fields
      if (data.fromCompanyId > 0 && data.toCompanyId > 0) {
        return data.fromCompanyId !== data.toCompanyId
      }
      return true
    },
    {
      message: "From Company and To Company cannot be the same",
      path: ["toCompanyId"],
    }
  )

type CopyCompanyRateSchemaType = z.infer<typeof copyCompanyRateSchema>

interface CopyCompanyRateFormProps {
  onCancelAction: () => void
  onSaveConfirmation?: (data: Record<string, unknown>) => void
}

export function CopyCompanyRateForm({
  onCancelAction,
  onSaveConfirmation,
}: CopyCompanyRateFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFromCompanyId, setSelectedFromCompanyId] = useState<number>(0)
  const [selectedToCompanyId, setSelectedToCompanyId] = useState<number>(0)

  const form = useForm<CopyCompanyRateSchemaType>({
    resolver: zodResolver(copyCompanyRateSchema),
    defaultValues: {
      fromCompanyId: 0,
      fromCustomerId: 0,
      fromPortId: 0,
      fromTaskId: 0,
      toCompanyId: 0,
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
    "fromCompanyId",
    "fromCustomerId",
    "fromPortId",
    "fromTaskId",
    "isAllPorts",
    "isAllTasks",
  ])
  const watchedFromCompanyId = watchedValues[0]
  const watchedFromCustomerId = watchedValues[1]
  const watchedFromPortId = watchedValues[2]
  const watchedFromTaskId = watchedValues[3]
  const watchedIsAllPorts = watchedValues[4]
  const watchedIsAllTasks = watchedValues[5]

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        watchedFromCompanyId > 0 &&
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
    watchedFromCompanyId,
    watchedFromCustomerId,
    watchedFromPortId,
    watchedFromTaskId,
    watchedIsAllPorts,
    watchedIsAllTasks,
  ])

  const handleSubmit = async (data: CopyCompanyRateSchemaType) => {
    const copyRateData = {
      fromCompanyId: data.fromCompanyId,
      toCompanyId: data.toCompanyId,
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
        const response = await copyCompanyTariffDirect(copyRateData)
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

  const handleCompanyChange = useCallback(
    (field: "fromCompanyId" | "toCompanyId") => {
      return (selectedCompany: { companyId?: number; id?: number } | null) => {
        if (selectedCompany) {
          const companyId = selectedCompany.companyId || selectedCompany.id || 0

          // Check if the same company is already selected in the other field
          const fromCompanyId = form.getValues("fromCompanyId")
          const toCompanyId = form.getValues("toCompanyId")

          if (companyId > 0) {
            if (field === "fromCompanyId" && companyId === toCompanyId) {
              toast.error("From Company and To Company cannot be the same")
              form.setValue(field, 0)
              setSelectedFromCompanyId(0)
              return
            }
            if (field === "toCompanyId" && companyId === fromCompanyId) {
              toast.error("From Company and To Company cannot be the same")
              form.setValue(field, 0)
              setSelectedToCompanyId(0)
              return
            }
          }

          form.setValue(field, companyId)

          // Update the selected company ID state
          if (field === "fromCompanyId") {
            setSelectedFromCompanyId(companyId)
          } else {
            setSelectedToCompanyId(companyId)
          }

          // Clear customer when company changes
          if (field === "fromCompanyId") {
            form.setValue("fromCustomerId", 0)
          } else {
            form.setValue("toCustomerId", 0)
          }
        } else {
          form.setValue(field, 0)
          if (field === "fromCompanyId") {
            setSelectedFromCompanyId(0)
          } else {
            setSelectedToCompanyId(0)
          }
        }
      }
    },
    [form]
  )

  const handleCustomerChange = useCallback(
    (field: "fromCustomerId" | "toCustomerId") =>
      (selectedCustomer: ICustomerLookup | null) => {
        form.setValue(field, selectedCustomer?.customerId || 0)
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

  // Watch both company IDs to prevent same selection
  const fromCompanyId = form.watch("fromCompanyId")
  const toCompanyId = form.watch("toCompanyId")

  // Clear the other field if same company is selected (backup check)
  useEffect(() => {
    if (fromCompanyId > 0 && toCompanyId > 0 && fromCompanyId === toCompanyId) {
      // Clear the "to" field if it matches "from"
      form.setValue("toCompanyId", 0)
      setSelectedToCompanyId(0)
    }
  }, [fromCompanyId, toCompanyId, form])

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
                <CompanyAutocomplete
                  form={form}
                  name="fromCompanyId"
                  label="Company"
                  isRequired
                  onChangeEvent={handleCompanyChange("fromCompanyId")}
                />
                <CompanyCustomerAutocomplete
                  form={form}
                  name="fromCustomerId"
                  label="Customer"
                  companyId={selectedFromCompanyId}
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
                <CompanyAutocomplete
                  form={form}
                  name="toCompanyId"
                  label="Company"
                  isRequired
                  onChangeEvent={handleCompanyChange("toCompanyId")}
                />
                <CompanyCustomerAutocomplete
                  form={form}
                  name="toCustomerId"
                  label="Customer"
                  companyId={selectedToCompanyId}
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
                  Clear destination before copy
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
                  Important Notes
                </p>
                <ul className="space-y-1 text-xs leading-relaxed text-amber-800/80 dark:text-amber-200/70">
                  <li>
                    • The same company cannot be selected for both
                    &quot;From&quot; and &quot;To&quot; fields.
                  </li>
                  <li>
                    • The same customer cannot be selected for both
                    &quot;From&quot; and &quot;To&quot; fields.
                  </li>
                  <li>
                    • You must select different companies and customers to copy
                    rates between them.
                  </li>
                </ul>
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
