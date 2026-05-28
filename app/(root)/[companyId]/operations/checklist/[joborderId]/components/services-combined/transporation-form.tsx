"use client"

import { useCallback, useEffect, useMemo } from "react"
import {
  IJobOrderHd,
  ISerTransportationDt,
  ISerTransportationHd,
} from "@/interfaces/checklist"
import {
  SerTransportationHdSchema,
  SerTransportationHdSchemaType,
} from "@/schemas/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import CargoTypeAutocomplete from "@/components/autocomplete/autocomplete-cargotype"
import TransportChargeAutocomplete from "@/components/autocomplete/autocomplete-transportcharge"
import TransportLocationAutocomplete from "@/components/autocomplete/autocomplete-transportlocation"
import TransportModeAutocomplete from "@/components/autocomplete/autocomplete-transportmode"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface TransportationFormProps {
  jobData: IJobOrderHd
  initialData?: ISerTransportationHd
  taskId: number
  serviceItemNo: number
  formId?: string
  taskDefaults?: Record<string, number>
  submitAction: (data: SerTransportationHdSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
  compactMode?: boolean
  showFooterActions?: boolean
}

export function TransportationForm({
  jobData,
  initialData,
  taskId,
  serviceItemNo,
  formId,
  taskDefaults = {},
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
  compactMode = false,
  showFooterActions = true,
}: TransportationFormProps) {
  const { user } = useAuthStore()
  const { decimals } = useCompanyStore()

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

  const form = useForm<SerTransportationHdSchemaType>({
    resolver: zodResolver(SerTransportationHdSchema),
    defaultValues: {
      transportationId: initialData?.transportationId ?? 0,
      companyId: jobData.companyId,
      jobOrderId: jobData.jobOrderId,
      taskId: initialData?.taskId ?? taskId ?? taskDefaults.taskId ?? 0,
      transportDate: initialData?.transportDate
        ? format(
            parseWithFallback(initialData.transportDate as string) ||
              new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
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
      createById:
        initialData?.createById ??
        (user?.userId && Number(user.userId) > 0 ? Number(user.userId) : 1),
      editVersion: initialData?.editVersion,
      data_details:
        initialData?.data_details && initialData.data_details.length > 0
          ? initialData.data_details
          : ([
              { itemNo: 1, serviceItemNo, serviceItemNoName: "" },
            ] as ISerTransportationDt[]),
    },
  })

  useEffect(() => {
    form.reset({
      transportationId: initialData?.transportationId ?? 0,
      companyId: jobData.companyId,
      jobOrderId: jobData.jobOrderId,
      taskId: initialData?.taskId ?? taskId ?? taskDefaults.taskId ?? 0,
      transportDate: initialData?.transportDate
        ? format(
            parseWithFallback(initialData.transportDate as string) ||
              new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
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
      createById:
        initialData?.createById ??
        (user?.userId && Number(user.userId) > 0 ? Number(user.userId) : 1),
      editVersion: initialData?.editVersion,
      data_details:
        initialData?.data_details && initialData.data_details.length > 0
          ? initialData.data_details
          : ([
              { itemNo: 1, serviceItemNo, serviceItemNoName: "" },
            ] as ISerTransportationDt[]),
    })
  }, [
    dateFormat,
    form,
    initialData,
    jobData.companyId,
    jobData.jobOrderId,
    parseWithFallback,
    taskId,
    serviceItemNo,
    taskDefaults,
    user?.userId,
  ])

  const onSubmit = (data: SerTransportationHdSchemaType) => {
    const userId = Number(user?.userId ?? 0)
    const resolvedCreateById =
      data.createById && data.createById > 0 ? data.createById : userId > 0 ? userId : 1

    const resolvedDetails: ISerTransportationDt[] | undefined =
      data.data_details && data.data_details.length > 0
        ? data.data_details.map((detail, index) => ({
            itemNo: detail.itemNo ?? index + 1,
            serviceItemNo: detail.serviceItemNo,
            serviceItemNoName: detail.serviceItemNoName ?? "",
          }))
        : serviceItemNo > 0
          ? [{ itemNo: 1, serviceItemNo, serviceItemNoName: "" }]
          : undefined

    const formattedData: SerTransportationHdSchemaType = {
      ...data,
      companyId: data.companyId ?? jobData.companyId,
      jobOrderId: data.jobOrderId ?? jobData.jobOrderId,
      taskId: data.taskId ?? taskId,
      createById: resolvedCreateById,
      data_details: resolvedDetails,
    }
    submitAction(formattedData)
  }

  return (
    <div className="w-full max-w-full">
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error("Form validation errors:", errors)
            const firstError = Object.values(errors)[0]
            if (firstError?.message) {
              toast.error(String(firstError.message))
            }
          })}
        >
          <div className="grid gap-2">
            <div
              className={
                compactMode
                  ? "grid grid-cols-1 gap-2 md:grid-cols-5"
                  : "grid grid-cols-1 gap-2 md:grid-cols-5 xl:grid-cols-4"
              }
            >
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
              <CustomTextarea
                form={form}
                name="remarks"
                label="Remarks"
                className="col-span-2"
                isDisabled={isConfirmed}
              />
            </div>
          </div>
          {!isConfirmed && showFooterActions && (
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
