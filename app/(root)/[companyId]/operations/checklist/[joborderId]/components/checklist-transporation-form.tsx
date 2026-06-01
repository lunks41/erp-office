"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import {
  IJobOrderHd,
  ISerTransportationDt,
  ISerTransportationHd,
} from "@/interfaces/checklist"
import { IServiceItemNoLookup, ITaskLookup } from "@/interfaces/lookup"
import {
  SerTransportationHdFormSchema,
  SerTransportationHdFormSchemaType,
  SerTransportationHdSchemaType,
} from "@/schemas/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { buildTransportationDetailsFromServiceItemNos } from "@/lib/transportation-service-items"
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

interface TransportationFormProps {
  jobData: IJobOrderHd
  initialData?: ISerTransportationHd
  taskDefaults?: Record<string, number>
  submitAction: (data: SerTransportationHdSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
}

type TransportationFormValues = SerTransportationHdFormSchemaType

export function TransportationForm({
  jobData,
  initialData,
  taskDefaults = {},
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
}: TransportationFormProps) {
  const { user } = useAuthStore()
  const { decimals } = useCompanyStore()

  const getServiceItemNoString = useCallback((data?: ISerTransportationHd) => {
    if (!data) return ""
    if (data.serviceItemNo?.trim()) return data.serviceItemNo.trim()
    if (data.data_details && data.data_details.length > 0) {
      return data.data_details
        .map((detail) => String(detail.serviceItemNo))
        .filter((id) => id && id !== "0")
        .join(",")
    }
    return ""
  }, [])

  const getServiceItemNoNameString = useCallback(
    (data?: ISerTransportationHd) => data?.serviceItemNoName?.trim() ?? "",
    []
  )

  const buildDetailsForForm = useCallback(
    (data?: ISerTransportationHd): ISerTransportationDt[] => {
      const serviceItemNo = getServiceItemNoString(data)
      if (!serviceItemNo) return []
      return buildTransportationDetailsFromServiceItemNos(
        serviceItemNo,
        getServiceItemNoNameString(data),
        data?.data_details
      )
    },
    [getServiceItemNoString, getServiceItemNoNameString]
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

  const initialServiceItemNo = getServiceItemNoString(initialData)
  const initialServiceItemNoName = getServiceItemNoNameString(initialData)
  const initialDataDetails = buildDetailsForForm(initialData)

  const form = useForm<TransportationFormValues>({
    resolver: zodResolver(SerTransportationHdFormSchema),
    defaultValues: {
      transportationId: initialData?.transportationId ?? 0,
      companyId: jobData.companyId,
      jobOrderId: jobData.jobOrderId,
      taskId: initialData?.taskId ?? taskDefaults.taskId ?? 0,
      serviceItemNo: initialServiceItemNo,
      serviceItemNoName: initialServiceItemNoName,
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
      cargoWeight: initialData?.cargoWeight ?? 0,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? null,
      cargoTypeId: initialData?.cargoTypeId ?? 0,
      remarks: initialData?.remarks ?? null,
      refNo: initialData?.refNo ?? null,
      vendor: initialData?.vendor ?? null,
      createById: initialData?.createById ?? (Number(user?.userId) || 1),
      editVersion: initialData?.editVersion,
      data_details: initialDataDetails,
    },
  })

  const lastJobOrderIdRef = useRef<number>(jobData.jobOrderId)
  const lastTaskIdRef = useRef<number>(
    initialData?.taskId ?? taskDefaults.taskId ?? 0
  )

  useEffect(() => {
    const serviceItemNo = getServiceItemNoString(initialData)
    const serviceItemNoName = getServiceItemNoNameString(initialData)
    const data_details = buildDetailsForForm(initialData)
    const taskId = initialData?.taskId ?? taskDefaults.taskId ?? 0

    lastJobOrderIdRef.current = jobData.jobOrderId
    lastTaskIdRef.current = taskId

    form.reset({
      transportationId: initialData?.transportationId ?? 0,
      companyId: jobData.companyId,
      jobOrderId: jobData.jobOrderId,
      taskId,
      serviceItemNo,
      serviceItemNoName,
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
      cargoWeight: initialData?.cargoWeight ?? 0,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? null,
      cargoTypeId: initialData?.cargoTypeId ?? 0,
      remarks: initialData?.remarks ?? null,
      refNo: initialData?.refNo ?? null,
      vendor: initialData?.vendor ?? null,
      createById: initialData?.createById ?? (Number(user?.userId) || 1),
      editVersion: initialData?.editVersion,
      data_details,
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
    buildDetailsForForm,
    taskDefaults,
    user?.userId,
  ])

  // Watch form values to trigger re-renders when they change
  const watchedJobOrderId = Number(form.watch("jobOrderId") ?? 0)
  const watchedTaskId = Number(form.watch("taskId") ?? 0)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const clearServiceItems = useCallback(() => {
    form.setValue("serviceItemNo", "", { shouldValidate: true })
    form.setValue("serviceItemNoName", "", { shouldValidate: false })
    form.setValue("data_details", [], { shouldValidate: false })
  }, [form])

  // Handle task selection — only clear services when the task actually changes
  // (autocomplete can fire onChange on mount with the same task and was wiping edit data).
  const handleTaskChange = (selectedOption: ITaskLookup | null) => {
    const nextTaskId = selectedOption?.taskId ?? 0
    const taskChanged = nextTaskId !== lastTaskIdRef.current
    lastTaskIdRef.current = nextTaskId

    if (selectedOption) {
      form.setValue("taskId", nextTaskId, {
        shouldValidate: true,
        shouldDirty: true,
      })
      if (taskChanged) {
        clearServiceItems()
      }
    } else {
      form.setValue("taskId", 0, { shouldValidate: true })
      if (taskChanged) {
        clearServiceItems()
      }
    }
  }

  // Keep data_details in sync when serviceItemNo is set but details were cleared (e.g. after edit load).
  useEffect(() => {
    const serviceItemNo = String(form.getValues("serviceItemNo") ?? "").trim()
    const details = form.getValues("data_details") ?? []
    if (!serviceItemNo || details.length > 0) return

    const rebuilt = buildTransportationDetailsFromServiceItemNos(
      serviceItemNo,
      String(form.getValues("serviceItemNoName") ?? "").trim()
    )
    if (rebuilt.length > 0) {
      form.setValue("data_details", rebuilt, { shouldValidate: true })
    }
  }, [form, watchedTaskId, watchedJobOrderId, initialData])

  // Handle service selection (multiple)
  const handleServiceItemNoChange = (
    selectedOptions: IServiceItemNoLookup[]
  ) => {
    const serviceItemNos = selectedOptions
      .map((option) => option.serviceItemNo.toString())
      .join(",")

    const serviceItemNoNames = selectedOptions
      .map((option) => option.serviceItemNoName)
      .join(", ")

    form.setValue("serviceItemNo", serviceItemNos || "", {
      shouldValidate: true,
      shouldDirty: true,
    })

    if (serviceItemNoNames) {
      form.setValue("serviceItemNoName", serviceItemNoNames, {
        shouldValidate: false,
        shouldDirty: true,
      })
    }

    form.setValue(
      "data_details",
      selectedOptions.map((option, index) => ({
        itemNo: index + 1,
        serviceItemNo: option.serviceItemNo,
        serviceItemNoName: option.serviceItemNoName,
      })),
      { shouldValidate: false, shouldDirty: true }
    )
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

    const fromFormDetails = (
      data.data_details?.length
        ? data.data_details
        : form.getValues("data_details")
    ) as ISerTransportationDt[] | undefined

    const detailRows: ISerTransportationDt[] =
      fromFormDetails && fromFormDetails.length > 0
        ? fromFormDetails.map((detail, index) => ({
            itemNo: detail.itemNo ?? index + 1,
            serviceItemNo: detail.serviceItemNo,
            serviceItemNoName: detail.serviceItemNoName ?? "",
          }))
        : buildTransportationDetailsFromServiceItemNos(
            serviceItemNoString,
            serviceItemNoNameString
          )

    if (detailRows.length === 0) {
      form.setError("serviceItemNo", {
        type: "manual",
        message: "Service Item No is required",
      })
      toast.error("Service Item No is required")
      return
    }

    const formattedData: SerTransportationHdSchemaType = {
      ...(data as SerTransportationHdSchemaType),
      passengerCount: data.passengerCount ?? 0,
      cargoWeight: data.cargoWeight ?? 0,
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
                label="Number of Passengers"
                isDisabled={isConfirmed}
              />
              <CustomNumberInput
                form={form}
                name="cargoWeight"
                label="Cargo Weight (Ton)"
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
