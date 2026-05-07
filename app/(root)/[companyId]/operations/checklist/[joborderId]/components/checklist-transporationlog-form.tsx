"use client"

import { useCallback, useEffect, useMemo } from "react"
import {
  IJobOrderHd,
  ISerTransportationDt,
  ISerTransportationHd,
} from "@/interfaces/checklist"
import { IServiceItemNoLookup, ITaskLookup } from "@/interfaces/lookup"
import {
  SerTransportationHdSchema,
  SerTransportationHdSchemaType,
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
  initialData?: ISerTransportationHd
  taskDefaults?: Record<string, number>
  submitAction: (data: SerTransportationHdSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
}

type TransportationFormValues = SerTransportationHdSchemaType & {
  serviceItemNo?: string
  serviceItemNoName?: string
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

  const getServiceItemNoString = useCallback(
    (data?: ISerTransportationHd) => {
      if (!data) return ""
      const withLegacy = data as ISerTransportationHd & { serviceItemNo?: string }
      if (withLegacy.serviceItemNo) return withLegacy.serviceItemNo
      if (data.data_details && data.data_details.length > 0) {
        return data.data_details.map((detail) => detail.serviceItemNo).join(",")
      }
      return ""
    },
    []
  )

  const getServiceItemNoNameString = useCallback(
    (data?: ISerTransportationHd) => {
      if (!data) return ""
      const withLegacy = data as ISerTransportationHd & { serviceItemNoName?: string }
      return withLegacy.serviceItemNoName ?? ""
    },
    []
  )

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

  const form = useForm<TransportationFormValues>({
    resolver: zodResolver(SerTransportationHdSchema) as never,
    defaultValues: {
      transportationId: initialData?.transportationId ?? 0,
      itemNo: initialData?.itemNo ?? 1,
      companyId: jobData.companyId,
      jobOrderId: jobData.jobOrderId,
      taskId: initialData?.taskId ?? taskDefaults.taskId ?? 0,
      serviceItemNo: getServiceItemNoString(initialData),
      serviceItemNoName: getServiceItemNoNameString(initialData),
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
      cargoWeight: 0,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? null,
      cargoTypeId: initialData?.cargoTypeId ?? 0,
      remarks: initialData?.remarks ?? null,
      refNo: initialData?.refNo ?? null,
      vendor: initialData?.vendor ?? null,
      createById: initialData?.createById ?? (Number(user?.userId) || 1),
      editVersion: initialData?.editVersion,
      data_details: [],
    },
  })

  useEffect(() => {
    form.reset({
      transportationId: initialData?.transportationId ?? 0,
      itemNo: initialData?.itemNo ?? 1,
      companyId: jobData.companyId,
      jobOrderId: jobData.jobOrderId,
      taskId: initialData?.taskId ?? taskDefaults.taskId ?? 0,
      serviceItemNo: getServiceItemNoString(initialData),
      serviceItemNoName: getServiceItemNoNameString(initialData),
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
      cargoWeight: 0,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? null,
      cargoTypeId: initialData?.cargoTypeId ?? 0,
      remarks: initialData?.remarks ?? null,
      refNo: initialData?.refNo ?? null,
      vendor: initialData?.vendor ?? null,
      createById: initialData?.createById ?? (Number(user?.userId) || 1),
      editVersion: initialData?.editVersion,
      data_details: [],
    })
  }, [
    dateFormat,
    form,
    initialData,
    jobData.companyId,
    jobData.jobOrderId,
    parseWithFallback,
    getServiceItemNoString,
    getServiceItemNoNameString,
    taskDefaults,
    user?.userId,
  ])

  // Watch form values to trigger re-renders when they change
  const watchedJobOrderId = Number(form.watch("jobOrderId") ?? 0)
  const watchedTaskId = Number(form.watch("taskId") ?? 0)

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
      form.setValue("serviceItemNoName", "", { shouldValidate: false })
    } else {
      form.setValue("taskId", 0, { shouldValidate: true })
      form.setValue("serviceItemNo", "", { shouldValidate: true })
      form.setValue("serviceItemNoName", "", { shouldValidate: false })
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
      form.setValue("serviceItemNoName", serviceItemNoNames, {
        shouldValidate: false,
        shouldDirty: true,
      })
    }
  }

  const onSubmit = (data: TransportationFormValues) => {
    const rawServiceItemNo = form.getValues("serviceItemNo" as never) as unknown
    const rawServiceItemNoName = form.getValues(
      "serviceItemNoName" as never
    ) as unknown

    // Ensure serviceItemNo is a comma-separated string
    let serviceItemNoString = ""
    const serviceItemNo = rawServiceItemNo ?? data.serviceItemNo
    if (typeof serviceItemNo === "string") {
      serviceItemNoString = serviceItemNo.trim()
    } else if (serviceItemNo) {
      serviceItemNoString = String(serviceItemNo).trim()
    }

    // Ensure serviceItemNoName is a comma-separated string
    let serviceItemNoNameString = ""
    const serviceItemNoName = rawServiceItemNoName ?? data.serviceItemNoName
    if (typeof serviceItemNoName === "string") {
      serviceItemNoNameString = serviceItemNoName.trim()
    } else if (serviceItemNoName) {
      serviceItemNoNameString = String(serviceItemNoName).trim()
    }

    const detailRows: ISerTransportationDt[] = serviceItemNoString
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
      .map((serviceNo, index) => ({
        itemNo: index + 1,
        serviceItemNo: serviceNo,
        serviceItemNoName:
          serviceItemNoNameString
            .split(",")
            .map((name) => name.trim())[index] ?? "",
      }))

    const formattedData: SerTransportationHdSchemaType = {
      ...(data as SerTransportationHdSchemaType),
      data_details: detailRows,
      createById:
        (data.createById as number | undefined) ?? (Number(user?.userId) || 1),
    }
    void serviceItemNoNameString
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
                jobOrderId={watchedJobOrderId}
                label="Task"
                isRequired
                isDisabled={isConfirmed}
                onChangeEvent={handleTaskChange}
              />
              <div className="col-span-3">
                <JobOrderServiceItemNoMultiSelect
                  key={`service-${watchedJobOrderId}-${watchedTaskId}`}
                  form={form}
                  name={"serviceItemNo" as never}
                  jobOrderId={watchedJobOrderId}
                  taskId={watchedTaskId}
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
                label="Slip No | Tally No"
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
                label="Passenger Count | Service Count"
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
