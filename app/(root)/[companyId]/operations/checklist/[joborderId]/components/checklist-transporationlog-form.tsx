"use client"

import { useCallback, useEffect, useMemo } from "react"
import { IJobOrderHd, ITransportationLog } from "@/interfaces/checklist"
import { IServiceItemNoLookup, ITaskLookup } from "@/interfaces/lookup"
import {
  TransportationLogSchema,
  TransportationLogSchemaType,
} from "@/schemas/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { JobOrderTaskAutocomplete } from "@/components/autocomplete"
import CargoTypeAutocomplete from "@/components/autocomplete/autocomplete-cargotype"
import TransportChargeAutocomplete from "@/components/autocomplete/autocomplete-transportcharge"
import TransportLocationAutocomplete from "@/components/autocomplete/autocomplete-transportlocation"
import TransportModeAutocomplete from "@/components/autocomplete/autocomplete-transportmode"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"
import JobOrderServiceItemNoMultiSelect from "@/components/multiselection-joborderserviceitemno"

interface TransportationLogFormProps {
  jobData: IJobOrderHd
  initialData?: ITransportationLog
  taskDefaults?: Record<string, number>
  submitAction: (data: TransportationLogSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
}

export function TransportationLogForm({
  jobData,
  initialData,
  taskDefaults = {},
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
}: TransportationLogFormProps) {
  const { decimals, user } = useAuthStore()

  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const parseWithFallback = useCallback(
    (value: string | Date | null | undefined): Date | null => {
      if (!value) return null
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value
      }

      if (typeof value !== "string") return null

      const parsed = parse(value, dateFormat, new Date())
      if (isValid(parsed)) {
        return parsed
      }

      return parseDate(value)
    },
    [dateFormat]
  )

  const form = useForm<TransportationLogSchemaType>({
    resolver: zodResolver(TransportationLogSchema),
    defaultValues: {
      itemNo: initialData?.itemNo,
      companyId: jobData.companyId,
      jobOrderId: jobData.jobOrderId,
      taskId: initialData?.taskId ?? taskDefaults.taskId ?? 0,
      serviceItemNo: initialData?.serviceItemNo ?? "",
      serviceItemNoName: initialData?.serviceItemNoName ?? "",
      transportDate: initialData?.transportDate
        ? format(
            parseWithFallback(initialData.transportDate as string) ||
              new Date(),
            dateFormat
          )
        : undefined,
      fromLocationId: initialData?.fromLocationId ?? 0,
      toLocationId: initialData?.toLocationId ?? 0,
      transportModeId: initialData?.transportModeId ?? 0,
      vehicleNo: initialData?.vehicleNo ?? null,
      driverName: initialData?.driverName ?? null,
      passengerCount: initialData?.passengerCount ?? 0,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? null,
      cargoTypeId: initialData?.cargoTypeId ?? 0,
      remarks: initialData?.remarks ?? null,
      refNo: initialData?.refNo ?? null,
      vendor: initialData?.vendor ?? null,
      editVersion: initialData?.editVersion,
    },
  })

  useEffect(() => {
    form.reset({
      itemNo: initialData?.itemNo,
      companyId: jobData.companyId,
      jobOrderId: jobData.jobOrderId,
      taskId: initialData?.taskId ?? taskDefaults.taskId ?? 0,
      serviceItemNo: initialData?.serviceItemNo ?? "",
      serviceItemNoName: initialData?.serviceItemNoName ?? "",
      transportDate: initialData?.transportDate
        ? format(
            parseWithFallback(initialData.transportDate as string) ||
              new Date(),
            dateFormat
          )
        : undefined,
      fromLocationId: initialData?.fromLocationId ?? 0,
      toLocationId: initialData?.toLocationId ?? 0,
      transportModeId: initialData?.transportModeId ?? 0,
      vehicleNo: initialData?.vehicleNo ?? null,
      driverName: initialData?.driverName ?? null,
      passengerCount: initialData?.passengerCount ?? 0,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? null,
      cargoTypeId: initialData?.cargoTypeId ?? 0,
      remarks: initialData?.remarks ?? null,
      refNo: initialData?.refNo ?? null,
      vendor: initialData?.vendor ?? null,
      editVersion: initialData?.editVersion,
    })
  }, [
    dateFormat,
    form,
    initialData,
    jobData.companyId,
    jobData.jobOrderId,
    parseWithFallback,
    taskDefaults,
    user?.userId,
  ])

  // Watch form values to trigger re-renders when they change
  const watchedJobOrderId = form.watch("jobOrderId")
  const watchedTaskId = form.watch("taskId")

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Handle task selection
  const handleTaskChange = (selectedOption: ITaskLookup | null) => {
    if (selectedOption) {
      form.setValue("taskId", selectedOption.taskId, {
        shouldValidate: true,
        shouldDirty: true,
      })
      // Reset service when task changes
      form.setValue("serviceItemNo", "", { shouldValidate: true })
      form.setValue(
        "serviceItemNoName" as keyof TransportationLogSchemaType,
        "",
        { shouldValidate: false }
      )
    } else {
      form.setValue("taskId", 0, { shouldValidate: true })
      form.setValue("serviceItemNo", "", { shouldValidate: true })
      form.setValue(
        "serviceItemNoName" as keyof TransportationLogSchemaType,
        "",
        { shouldValidate: false }
      )
    }
  }

  // Handle service selection (multiple)
  const handleServiceItemNoChange = (
    selectedOptions: IServiceItemNoLookup[]
  ) => {
    // Convert array of selected options to comma-separated string
    const serviceItemNos = selectedOptions
      .map((option) => option.serviceItemNo.toString())
      .join(",")

    // Also create comma-separated names for serviceItemNoName
    const serviceItemNoNames = selectedOptions
      .map((option) => option.serviceItemNoName)
      .join(",")

    form.setValue("serviceItemNo", serviceItemNos || "", {
      shouldValidate: true,
      shouldDirty: true,
    })

    // Set serviceItemNoName if schema requires it
    if (serviceItemNoNames) {
      form.setValue(
        "serviceItemNoName" as keyof TransportationLogSchemaType,
        serviceItemNoNames,
        {
          shouldValidate: false,
          shouldDirty: true,
        }
      )
    }
  }

  const onSubmit = (data: TransportationLogSchemaType) => {
    // Ensure serviceItemNo is a comma-separated string
    let serviceItemNoString = ""
    if (typeof data.serviceItemNo === "string") {
      serviceItemNoString = data.serviceItemNo.trim()
    } else if (data.serviceItemNo) {
      serviceItemNoString = String(data.serviceItemNo).trim()
    }

    // Ensure serviceItemNoName is a comma-separated string
    let serviceItemNoNameString = ""
    if (typeof data.serviceItemNoName === "string") {
      serviceItemNoNameString = data.serviceItemNoName.trim()
    } else if (data.serviceItemNoName) {
      serviceItemNoNameString = String(data.serviceItemNoName).trim()
    }

    const formattedData = {
      ...data,
      serviceItemNo: serviceItemNoString,
      serviceItemNoName: serviceItemNoNameString,
    }
    submitAction(formattedData)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error("Form validation errors:", errors)
          })}
        >
          <div className="grid gap-2">
            <div className="grid grid-cols-4 gap-2">
              <JobOrderTaskAutocomplete
                key={`task-${watchedJobOrderId}`}
                form={form}
                name="taskId"
                jobOrderId={watchedJobOrderId || 0}
                label="Task"
                isRequired
                isDisabled={isConfirmed}
                onChangeEvent={handleTaskChange}
              />
              <div className="col-span-3">
                <JobOrderServiceItemNoMultiSelect
                  key={`service-${watchedJobOrderId}-${watchedTaskId}`}
                  form={form}
                  name="serviceItemNo"
                  jobOrderId={watchedJobOrderId || 0}
                  taskId={watchedTaskId || 0}
                  label="Service Item No"
                  isRequired
                  isDisabled={isConfirmed}
                  onChangeEvent={handleServiceItemNoChange}
                  className="min-h-[80px] w-full"
                />
              </div>
              <TransportChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge"
                isDisabled={isConfirmed}
                isRequired={true}
              />

              <CustomDateNew
                form={form}
                name="transportDate"
                label="Transport Date"
                isRequired
                isDisabled={isConfirmed}
                isFutureShow={true}
              />
              <TransportLocationAutocomplete
                form={form}
                name="fromLocationId"
                label="From Location"
                isRequired
                isDisabled={isConfirmed}
              />
              <TransportLocationAutocomplete
                form={form}
                name="toLocationId"
                label="To Location"
                isRequired
                isDisabled={isConfirmed}
              />
              <TransportModeAutocomplete
                form={form}
                name="transportModeId"
                label="Transport Mode"
                isRequired
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="refNo"
                label="Slip No"
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="vendor"
                label="Vendor"
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="vehicleNo"
                label="Vehicle No"
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="driverName"
                label="Driver Name"
                isDisabled={isConfirmed}
              />
              <CustomNumberInput
                form={form}
                name="passengerCount"
                label="Passenger Count"
                isDisabled={isConfirmed}
              />
              <CargoTypeAutocomplete
                form={form}
                name="cargoTypeId"
                label="Vehicle Type"
                isDisabled={isConfirmed}
              />
            </div>
            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isDisabled={isConfirmed}
            />
          </div>
          {!isConfirmed && (
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancelAction}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
