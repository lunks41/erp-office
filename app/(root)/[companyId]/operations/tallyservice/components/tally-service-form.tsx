"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ITallyService } from "@/interfaces"
import { IBankAddress, IBankContact } from "@/interfaces/bank"
import { ICustomerAddress, ICustomerContact } from "@/interfaces/customer"
import {
  ICurrencyLookup,
  ICustomerLookup,
  IVesselLookup,
} from "@/interfaces/lookup"
import { ISupplierAddress, ISupplierContact } from "@/interfaces/supplier"
import { tallyServiceSchema, TallyServiceSchemaType } from "@/schemas"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { differenceInMinutes, format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getData } from "@/lib/api-client"
import { BasicSetting } from "@/lib/api-routes"
import {
  clientDateFormat,
  formatDateForApi,
  formatDateTimeForApi,
  parseDate,
} from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  BargeAutocomplete,
  ChargeAutocomplete,
  CountryAutocomplete,
  CurrencyAutocomplete,
  CustomerAutocomplete,
  GSTAutocomplete,
  JobStatusAutocomplete,
  PortAutocomplete,
  UomAutocomplete,
  VesselAutocomplete,
} from "@/components/autocomplete"
import DynamicAddressAutocomplete, {
  EntityType as AddressEntityType,
} from "@/components/autocomplete/autocomplete-address-dynamic"
import DynamicContactAutocomplete, {
  EntityType as ContactEntityType,
} from "@/components/autocomplete/autocomplete-contact-dynamic"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { CustomDateTimePicker } from "@/components/custom/custom-date-time-picker"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

const SECTION_CARD_CLASS = "rounded-lg border px-4 pb-4 pt-5"
const SECTION_HEADER_ROW_CLASS = "mb-1 flex flex-wrap items-center gap-2"
const SECTION_BODY_CLASS = "pt-1"
const SECTION_HEADER_BADGE_CLASS =
  "px-3 py-1.5 text-xs font-semibold leading-none shadow-sm transition-colors duration-200"

interface TallyServiceFormProps {
  companyId: number
  initialData?: ITallyService
  mode: "create" | "edit" | "view"
  submitAction: (data: ITallyService) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  formId?: string
  hideActions?: boolean
}

function formatDurationToHhMm(value?: number | null): string {
  if (!value) return "00:00"
  const [hours = "00", minutes = "00"] = value.toString().split(".")
  return `${hours.padStart(2, "0")}:${minutes.padEnd(2, "0").slice(0, 2)}`
}

export function TallyServiceForm({
  companyId,
  initialData,
  mode,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  formId,
  hideActions = false,
}: TallyServiceFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )
  const isReadOnly = mode === "view"
  const [customerCode, setCustomerCode] = useState(
    initialData?.customerCode ?? ""
  )
  const [selectedAddress, setSelectedAddress] =
    useState<ICustomerAddress | null>(null)
  const [selectedContact, setSelectedContact] =
    useState<ICustomerContact | null>(null)

  const parseWithFallback = useCallback(
    (value: string | Date | null | undefined): Date | null => {
      if (!value) return null
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value
      }
      if (typeof value !== "string") return null
      const parsed = parse(value, dateFormat, new Date())
      if (isValid(parsed)) return parsed
      return parseDate(value)
    },
    [dateFormat]
  )

  const buildDefaultValues = useCallback((): TallyServiceSchemaType => {
    const serviceDate =
      initialData?.date || initialData?.serviceDate
        ? format(
            parseWithFallback(
              (initialData?.date || initialData?.serviceDate) as string
            ) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat)

    const accountDate = initialData?.accountDate
      ? format(
          parseWithFallback(initialData.accountDate as string) || new Date(),
          dateFormat
        )
      : serviceDate

    return {
      tallyServiceId: initialData?.tallyServiceId ?? 0,
      date: serviceDate,
      accountDate,
      customerId: initialData?.customerId ?? 0,
      currencyId: initialData?.currencyId ?? 0,
      exhRate: initialData?.exhRate ?? 0,
      vesselId: initialData?.vesselId ?? 0,
      imoCode: initialData?.imoCode ?? "",
      vesselDistance: initialData?.vesselDistance ?? 0,
      portId: initialData?.portId ?? 0,
      addressId: initialData?.addressId ?? 0,
      contactId: initialData?.contactId ?? 0,
      isTaxable: initialData?.isTaxable ?? false,
      gstId: initialData?.gstId ?? 0,
      gstPercentage: initialData?.gstPercentage ?? 0,
      isActive: initialData?.isActive ?? true,
      isClose: initialData?.isClose ?? false,
      isPost: initialData?.isPost ?? false,
      isCancel: initialData?.isCancel ?? false,
      cancelRemarks: initialData?.cancelRemarks ?? "",
      billName: initialData?.billName ?? "",
      address1: initialData?.address1 ?? "",
      address2: initialData?.address2 ?? "",
      address3: initialData?.address3 ?? "",
      address4: initialData?.address4 ?? "",
      pinCode: initialData?.pinCode ?? "",
      countryId: initialData?.countryId ?? 0,
      phoneNo: initialData?.phoneNo ?? "",
      faxNo: initialData?.faxNo ?? "",
      contactName: initialData?.contactName ?? "",
      mobileNo: initialData?.mobileNo ?? "",
      emailAdd: initialData?.emailAdd ?? "",
      chargeId: initialData?.chargeId ?? 0,
      bargeId: initialData?.bargeId ?? 0,
      uomId: initialData?.uomId ?? 0,
      operatorName: initialData?.operatorName ?? "",
      supplyBarge: initialData?.supplyBarge ?? "",
      quantity: initialData?.quantity ?? 1,
      receiptNo: initialData?.receiptNo ?? "",
      ameTally: initialData?.ameTally ?? "",
      boatopTally: initialData?.boatopTally ?? "",
      boatOperator: initialData?.boatOperator ?? "",
      loadingTime: initialData?.loadingTime
        ? parseWithFallback(initialData.loadingTime as string) || undefined
        : undefined,
      leftJetty: initialData?.leftJetty
        ? parseWithFallback(initialData.leftJetty as string) || undefined
        : undefined,
      waitingTime: initialData?.waitingTime ?? 0,
      alongsideVessel: initialData?.alongsideVessel
        ? parseWithFallback(initialData.alongsideVessel as string) || undefined
        : undefined,
      departedFromVessel: initialData?.departedFromVessel
        ? parseWithFallback(initialData.departedFromVessel as string) ||
          undefined
        : undefined,
      timeDiff: initialData?.timeDiff ?? 0,
      arrivedAtJetty: initialData?.arrivedAtJetty
        ? parseWithFallback(initialData.arrivedAtJetty as string) || undefined
        : undefined,
      deliveredWeight: initialData?.deliveredWeight ?? 0,
      landedWeight: initialData?.landedWeight ?? 0,
      annexure: initialData?.annexure ?? "",
      invoiceId: initialData?.invoiceId ?? 0,
      invoiceNo: initialData?.invoiceNo ?? "",
      jobStatusId: initialData?.jobStatusId ?? 201,
      remarks: initialData?.remarks ?? "",
      editVersion: initialData?.editVersion ?? 0,
    }
  }, [dateFormat, initialData, parseWithFallback])

  const form = useForm<TallyServiceSchemaType>({
    resolver: zodResolver(tallyServiceSchema),
    defaultValues: buildDefaultValues(),
  })

  useEffect(() => {
    form.reset(buildDefaultValues())
    setCustomerCode(initialData?.customerCode ?? "")
  }, [buildDefaultValues, form, initialData?.customerCode])

  const isTaxable = form.watch("isTaxable")
  const customerId = form.watch("customerId")
  const accountDate = form.watch("accountDate")
  const currencyId = form.watch("currencyId")
  const gstId = form.watch("gstId")
  const isCancel = form.watch("isCancel")

  useEffect(() => {
    if (!isTaxable) {
      form.setValue("gstId", 1, { shouldValidate: false })
      form.setValue("gstPercentage", 0, { shouldValidate: false })
    }
  }, [isTaxable, form])

  useEffect(() => {
    const updateExchangeRate = async () => {
      if (accountDate && currencyId) {
        try {
          const parsedAccountDate = parseWithFallback(accountDate)
          if (!parsedAccountDate) return
          const dt = format(parsedAccountDate, "yyyy-MM-dd")
          const res = await getData(
            `${BasicSetting.getExchangeRate}/${currencyId}/${dt}`
          )
          const exhRate = res?.data
          if (exhRate) {
            form.setValue("exhRate", +Number(exhRate).toFixed(exhRateDec))
          }
        } catch {
          /* ignore */
        }
      }
    }
    updateExchangeRate()
  }, [accountDate, currencyId, exhRateDec, form, parseWithFallback])

  useEffect(() => {
    const fetchGstPercentage = async () => {
      if (isTaxable && gstId && accountDate) {
        try {
          const parsedAccountDate = parseWithFallback(accountDate)
          if (!parsedAccountDate) return
          const dt = format(parsedAccountDate, "yyyy-MM-dd")
          const res = await getData(
            `${BasicSetting.getGstPercentage}/${gstId}/${dt}`
          )
          const gstPercentage = res?.data as number
          if (gstPercentage !== undefined && gstPercentage !== null) {
            form.setValue("gstPercentage", gstPercentage)
          }
        } catch {
          /* ignore */
        }
      } else if (!isTaxable || !gstId) {
        form.setValue("gstPercentage", 0)
      }
    }
    fetchGstPercentage()
  }, [gstId, accountDate, isTaxable, form, parseWithFallback])

  const handleCurrencyChange = useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      const selectedCurrencyId = selectedCurrency?.currencyId || 0
      const dateValue = form.getValues("accountDate") || form.getValues("date")
      if (selectedCurrencyId && dateValue) {
        const parsedAccountDate = parseWithFallback(dateValue)
        if (!parsedAccountDate) return
        const dt = format(parsedAccountDate, "yyyy-MM-dd")
        const res = await getData(
          `${BasicSetting.getExchangeRate}/${selectedCurrencyId}/${dt}`
        )
        const exhRate = res?.data
        if (exhRate) {
          form.setValue("exhRate", +Number(exhRate).toFixed(exhRateDec))
        }
      }
    },
    [exhRateDec, form, parseWithFallback]
  )

  const handleCustomerChange = useCallback(
    (selectedCustomer: ICustomerLookup | null) => {
      if (selectedCustomer?.customerId !== customerId) {
        form.setValue("addressId", 0)
        form.setValue("contactId", 0)
        setSelectedAddress(null)
        setSelectedContact(null)
        form.setValue("currencyId", selectedCustomer?.currencyId ?? 0)
        setCustomerCode(selectedCustomer?.customerCode ?? "")
        if (selectedCustomer?.currencyId) {
          handleCurrencyChange({
            currencyId: selectedCustomer.currencyId,
            currencyCode: "",
            currencyName: "",
            isMultiply: false,
          })
        }
        toast.info("Address and contact have been reset for the new customer.")
      }
    },
    [customerId, form, handleCurrencyChange]
  )

  const handleVesselChange = useCallback(
    (selectedVessel: IVesselLookup | null) => {
      form.setValue("imoCode", selectedVessel?.imoCode ?? "")
    },
    [form]
  )

  const handleAddressSelect = (
    address: ICustomerAddress | ISupplierAddress | IBankAddress | null
  ) => {
    const customerAddress = address as ICustomerAddress | null
    setSelectedAddress(customerAddress)
    if (customerAddress) {
      form.setValue("addressId", customerAddress.addressId)
      form.setValue("billName", customerAddress.billName || "")
      form.setValue("address1", customerAddress.address1 || "")
      form.setValue("address2", customerAddress.address2 || "")
      form.setValue("address3", customerAddress.address3 || "")
      form.setValue("address4", customerAddress.address4 || "")
      form.setValue("pinCode", customerAddress.pinCode?.toString() || "")
      form.setValue("phoneNo", customerAddress.phoneNo || "")
      form.setValue("faxNo", customerAddress.faxNo || "")
      form.setValue("countryId", customerAddress.countryId || 0)
    } else {
      form.setValue("addressId", 0)
      setSelectedAddress(null)
    }
  }

  const handleContactSelect = (
    contact: ICustomerContact | ISupplierContact | IBankContact | null
  ) => {
    const customerContact = contact as ICustomerContact | null
    setSelectedContact(customerContact)
    if (customerContact) {
      form.setValue("contactId", customerContact.contactId)
      form.setValue("contactName", customerContact.contactName || "")
      form.setValue("mobileNo", customerContact.mobileNo || "")
      form.setValue("emailAdd", customerContact.emailAdd || "")
    } else {
      form.setValue("contactId", 0)
      setSelectedContact(null)
    }
  }

  const calculateWaitingTime = useCallback(() => {
    const start = form.getValues("loadingTime")
    const end = form.getValues("leftJetty")
    if (!start || !end) return
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (!isValid(startDate) || !isValid(endDate)) return
    const diffMinutes = differenceInMinutes(endDate, startDate)
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    form.setValue("waitingTime", hours + minutes / 100)
  }, [form])

  const calculateTimeDiff = useCallback(() => {
    const start = form.getValues("alongsideVessel")
    const end = form.getValues("departedFromVessel")
    if (!start || !end) return
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (!isValid(startDate) || !isValid(endDate)) return
    const diffMinutes = differenceInMinutes(endDate, startDate)
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    form.setValue("timeDiff", hours + minutes / 100)
  }, [form])

  const syncServiceDateToTimes = useCallback(
    (selectedDate: Date | null) => {
      if (!selectedDate) return
      const keepTime = (value: Date | string | undefined) => {
        const existing =
          value instanceof Date
            ? value
            : value
              ? parseWithFallback(value)
              : null
        if (!existing || !isValid(existing)) return new Date(selectedDate)
        return new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          existing.getHours(),
          existing.getMinutes(),
          existing.getSeconds(),
          existing.getMilliseconds()
        )
      }
      form.setValue("accountDate", format(selectedDate, dateFormat))
      form.setValue("loadingTime", keepTime(form.getValues("loadingTime")))
      form.setValue("leftJetty", keepTime(form.getValues("leftJetty")))
      form.setValue(
        "alongsideVessel",
        keepTime(form.getValues("alongsideVessel"))
      )
      form.setValue(
        "departedFromVessel",
        keepTime(form.getValues("departedFromVessel"))
      )
      form.setValue(
        "arrivedAtJetty",
        keepTime(form.getValues("arrivedAtJetty"))
      )
      calculateWaitingTime()
      calculateTimeDiff()
    },
    [
      calculateTimeDiff,
      calculateWaitingTime,
      dateFormat,
      form,
      parseWithFallback,
    ]
  )

  const onSubmit = (data: TallyServiceSchemaType) => {
    const formattedDate = formatDateForApi(data.date) || data.date
    const formattedAccountDate =
      formatDateForApi(data.accountDate) || data.accountDate

    submitAction({
      companyId,
      tallyServiceId: data.tallyServiceId,
      date: formattedDate,
      serviceDate: formattedDate,
      accountDate: formattedAccountDate,
      customerId: data.customerId,
      currencyId: data.currencyId,
      exhRate: data.exhRate,
      vesselId: data.vesselId,
      imoCode: data.imoCode || "",
      vesselDistance: data.vesselDistance,
      portId: data.portId,
      addressId: data.addressId || 0,
      contactId: data.contactId || 0,
      isTaxable: data.isTaxable,
      gstId: data.gstId,
      gstPercentage: data.gstPercentage,
      isActive: data.isActive,
      isClose: data.isClose,
      isPost: data.isPost,
      isCancel: data.isCancel,
      cancelRemarks: data.cancelRemarks || "",
      billName: data.billName || "",
      address1: data.address1 || "",
      address2: data.address2 || "",
      address3: data.address3 || "",
      address4: data.address4 || "",
      pinCode: data.pinCode || "",
      countryId: data.countryId,
      phoneNo: data.phoneNo || "",
      faxNo: data.faxNo || "",
      contactName: data.contactName || "",
      mobileNo: data.mobileNo || "",
      emailAdd: data.emailAdd || "",
      chargeId: data.chargeId,
      bargeId: data.bargeId,
      uomId: data.uomId,
      operatorName: data.operatorName || "",
      supplyBarge: data.supplyBarge || "",
      quantity: data.quantity,
      receiptNo: data.receiptNo || "",
      ameTally: data.ameTally,
      boatopTally: data.boatopTally || "",
      boatOperator: data.boatOperator || "",
      loadingTime: formatDateTimeForApi(data.loadingTime),
      leftJetty: formatDateTimeForApi(data.leftJetty),
      waitingTime: data.waitingTime ?? 0,
      alongsideVessel: formatDateTimeForApi(data.alongsideVessel),
      departedFromVessel: formatDateTimeForApi(data.departedFromVessel),
      timeDiff: data.timeDiff ?? 0,
      arrivedAtJetty: formatDateTimeForApi(data.arrivedAtJetty),
      deliveredWeight: data.deliveredWeight ?? 0,
      landedWeight: data.landedWeight ?? 0,
      annexure: data.annexure || "",
      invoiceId: data.invoiceId ?? 0,
      invoiceNo: data.invoiceNo || "",
      jobStatusId: data.jobStatusId ?? 201,
      remarks: data.remarks || "",
      createById: initialData?.createById ?? 0,
      createDate: initialData?.createDate ?? new Date(),
      editById: initialData?.editById ?? 0,
      editDate: initialData?.editDate ?? new Date(),
      createBy: initialData?.createBy ?? "",
      editBy: initialData?.editBy ?? "",
      editVersion: data.editVersion || initialData?.editVersion || 0,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3"
        >
          {/* Row 1: Tally Service Details — full width, 8 columns */}
          <div className={SECTION_CARD_CLASS}>
            <div className={SECTION_HEADER_ROW_CLASS}>
              <Badge
                variant="outline"
                className={`${SECTION_HEADER_BADGE_CLASS} border-amber-200 bg-amber-100 text-amber-900`}
              >
                ⚓ Tally Service Details
              </Badge>
            </div>
            <div className={`grid grid-cols-8 gap-2 ${SECTION_BODY_CLASS}`}>
              <CustomDateNew
                form={form}
                name="date"
                label="Service Date"
                isRequired
                isDisabled={isReadOnly}
                isFutureShow
                onChangeEvent={syncServiceDateToTimes}
              />
              <CustomerAutocomplete
                form={form}
                name="customerId"
                label={`Customer${customerCode ? ` (${customerCode})` : ""}`}
                isRequired
                isDisabled={isReadOnly}
                onChangeEvent={handleCustomerChange}
              />
              <PortAutocomplete
                form={form}
                name="portId"
                label="Port"
                isRequired
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="receiptNo"
                label="Receipt No"
                isDisabled={isReadOnly}
              />
              <VesselAutocomplete
                form={form}
                name="vesselId"
                label="Vessel"
                isRequired
                isDisabled={isReadOnly}
                onChangeEvent={handleVesselChange}
              />
              <CustomInput
                form={form}
                name="imoCode"
                label="IMO No"
                isDisabled={isReadOnly}
              />
              <CustomNumberInput
                form={form}
                name="vesselDistance"
                label="Vessel Distance (NM)"
                isRequired
                isDisabled={isReadOnly}
              />
              <JobStatusAutocomplete
                form={form}
                name="jobStatusId"
                label="Job Status"
                isRequired
                isDisabled={isReadOnly}
              />
              <ChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge"
                isRequired
                isDisabled={isReadOnly}
              />
              <BargeAutocomplete
                form={form}
                name="bargeId"
                label="Barge"
                isRequired
                isDisabled={isReadOnly}
              />
              <UomAutocomplete
                form={form}
                name="uomId"
                label="UOM"
                isRequired
                isDisabled={isReadOnly}
              />
              <CustomNumberInput
                form={form}
                name="quantity"
                label="Quantity"
                isRequired
                isDisabled={isReadOnly}
                round={0}
              />
              <CustomInput
                form={form}
                name="operatorName"
                label="Operator Name"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="supplyBarge"
                label="Supply Barge"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="ameTally"
                label="AME Tally"
                isRequired
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="boatopTally"
                label="Boat Operator Tally"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="boatOperator"
                label="Boat Operator"
                isDisabled={isReadOnly}
              />
              <CustomNumberInput
                form={form}
                name="deliveredWeight"
                label="Delivered Weight"
                isDisabled={isReadOnly}
                round={3}
              />
              <CustomNumberInput
                form={form}
                name="landedWeight"
                label="Landed Weight"
                isDisabled={isReadOnly}
                round={3}
              />
              <CustomInput
                form={form}
                name="annexure"
                label="Annexure"
                isDisabled={isReadOnly}
              />
              <CustomTextarea
                form={form}
                name="remarks"
                label="Remarks"
                showCharacterCount
                minRows={1}
                isDisabled={isReadOnly}
                className="col-span-2"
              />
            </div>
            <div className="mt-3 rounded-md border p-3">
              <Badge variant="outline" className="mb-3">
                Timing Details
              </Badge>
              <div className="grid grid-cols-8 gap-2">
                <CustomDateTimePicker
                  form={form}
                  name="loadingTime"
                  label="Loading Time"
                  isDisabled={isReadOnly}
                  isFutureShow
                  onChangeEvent={calculateWaitingTime}
                />
                <CustomDateTimePicker
                  form={form}
                  name="leftJetty"
                  label="Left Jetty"
                  isDisabled={isReadOnly}
                  isFutureShow
                  onChangeEvent={calculateWaitingTime}
                />
                <div className="space-y-1">
                  <label className="text-xs font-medium">Waiting Time</label>
                  <input
                    type="text"
                    value={formatDurationToHhMm(form.watch("waitingTime"))}
                    disabled
                    className="border-input bg-background text-muted-foreground flex h-7.5 w-full rounded-md border px-2 text-xs"
                  />
                </div>
                <CustomDateTimePicker
                  form={form}
                  name="alongsideVessel"
                  label="Alongside Vessel"
                  isDisabled={isReadOnly}
                  isFutureShow
                  onChangeEvent={calculateTimeDiff}
                />
                <CustomDateTimePicker
                  form={form}
                  name="departedFromVessel"
                  label="Departed Vessel"
                  isDisabled={isReadOnly}
                  isFutureShow
                  onChangeEvent={calculateTimeDiff}
                />
                <div className="space-y-1">
                  <label className="text-xs font-medium">Time Difference</label>
                  <input
                    type="text"
                    value={formatDurationToHhMm(form.watch("timeDiff"))}
                    disabled
                    className="border-input bg-background text-muted-foreground flex h-7.5 w-full rounded-md border px-2 text-xs"
                  />
                </div>
                <CustomDateTimePicker
                  form={form}
                  name="arrivedAtJetty"
                  label="Arrived at Jetty"
                  isDisabled={isReadOnly}
                  isFutureShow
                />
              </div>
            </div>
          </div>

          {/* Row 2: Accounts | Address + Contact */}
          <div className="grid grid-cols-12 gap-4">
            <div className={`col-span-4 ${SECTION_CARD_CLASS}`}>
              <div className={SECTION_HEADER_ROW_CLASS}>
                <Badge
                  variant="outline"
                  className={`${SECTION_HEADER_BADGE_CLASS} border-green-300 bg-green-100 text-green-800 hover:bg-green-200`}
                >
                  💰 Accounts
                </Badge>
              </div>
              <div className={`grid grid-cols-2 gap-2 ${SECTION_BODY_CLASS}`}>
                <CurrencyAutocomplete
                  form={form}
                  name="currencyId"
                  label="Currency"
                  isRequired
                  isDisabled={isReadOnly}
                  onChangeEvent={handleCurrencyChange}
                />
                <CustomNumberInput
                  form={form}
                  name="exhRate"
                  label="Exchange Rate"
                  isRequired
                  isDisabled
                  round={exhRateDec}
                  className="text-right"
                />
                <CustomDateNew
                  form={form}
                  name="accountDate"
                  label="Account | Debit Note Date"
                  isRequired
                  isDisabled={isReadOnly}
                  isFutureShow
                  className="col-span-2"
                />
                <DynamicAddressAutocomplete
                  form={form}
                  name="addressId"
                  label="Address"
                  entityId={customerId}
                  entityType={AddressEntityType.CUSTOMER}
                  onChangeEvent={handleAddressSelect}
                  isDisabled={isReadOnly}
                />
                <DynamicContactAutocomplete
                  form={form}
                  name="contactId"
                  label="Contact"
                  entityId={customerId}
                  entityType={ContactEntityType.CUSTOMER}
                  onChangeEvent={handleContactSelect}
                  isDisabled={isReadOnly}
                />
                <div className="col-span-2 grid grid-cols-3 gap-2">
                  <CustomCheckbox
                    form={form}
                    name="isActive"
                    label="Active"
                    isDisabled={isReadOnly}
                  />
                  <CustomCheckbox
                    form={form}
                    name="isClose"
                    label="Close"
                    isDisabled={isReadOnly}
                  />
                  <CustomCheckbox
                    form={form}
                    name="isPost"
                    label="Post"
                    isDisabled={isReadOnly}
                  />

                  <CustomCheckbox
                    form={form}
                    name="isCancel"
                    label="Cancel"
                    isDisabled={isReadOnly}
                  />
                  <CustomCheckbox
                    form={form}
                    name="isTaxable"
                    label="Taxable"
                    isDisabled={isReadOnly}
                  />
                  {isTaxable && (
                    <>
                      <GSTAutocomplete
                        form={form}
                        name="gstId"
                        label="VAT"
                        isRequired
                        isDisabled={isReadOnly}
                      />
                      <CustomNumberInput
                        form={form}
                        name="gstPercentage"
                        label="VAT %"
                        isRequired
                        isDisabled={isReadOnly}
                      />
                    </>
                  )}
                </div>

                {isCancel && (
                  <CustomTextarea
                    form={form}
                    name="cancelRemarks"
                    label="Cancel Remarks"
                    isDisabled={isReadOnly}
                    maxLength={500}
                    minRows={2}
                    className="col-span-2"
                  />
                )}
              </div>
            </div>

            <div className="col-span-8 grid grid-cols-2 gap-4">
              <div className={SECTION_CARD_CLASS}>
                <div className={SECTION_HEADER_ROW_CLASS}>
                  <Badge
                    variant="outline"
                    className={`${SECTION_HEADER_BADGE_CLASS} border-purple-200 bg-purple-100 text-purple-800`}
                  >
                    📍 Address Details
                  </Badge>
                </div>

                <div className={`grid gap-2 ${SECTION_BODY_CLASS}`}>
                  <CustomInput
                    form={form}
                    name="billName"
                    label="Bill Name"
                    isDisabled={!selectedAddress || isReadOnly}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <CustomTextarea
                      form={form}
                      name="address1"
                      label="Address Line 1"
                      isDisabled={!selectedAddress || isReadOnly}
                    />
                    <CustomTextarea
                      form={form}
                      name="address2"
                      label="Address Line 2"
                      isDisabled={!selectedAddress || isReadOnly}
                    />
                    <CustomTextarea
                      form={form}
                      name="address3"
                      label="Address Line 3"
                      isDisabled={!selectedAddress || isReadOnly}
                    />
                    <CustomTextarea
                      form={form}
                      name="address4"
                      label="Address Line 4"
                      isDisabled={!selectedAddress || isReadOnly}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <CountryAutocomplete
                      form={form}
                      name="countryId"
                      label="Country"
                      isDisabled={isReadOnly}
                    />
                    <CustomInput
                      form={form}
                      name="pinCode"
                      label="Pin Code"
                      isDisabled={!selectedAddress || isReadOnly}
                    />
                    <CustomInput
                      form={form}
                      name="phoneNo"
                      label="Phone No"
                      isDisabled={!selectedAddress || isReadOnly}
                    />
                    <CustomInput
                      form={form}
                      name="faxNo"
                      label="Fax No"
                      isDisabled={!selectedAddress || isReadOnly}
                    />
                  </div>
                </div>
              </div>
              <div className={SECTION_CARD_CLASS}>
                <div className={SECTION_HEADER_ROW_CLASS}>
                  <Badge
                    variant="outline"
                    className={`${SECTION_HEADER_BADGE_CLASS} border-indigo-200 bg-indigo-100 text-indigo-800`}
                  >
                    👤 Contact Details
                  </Badge>
                </div>

                <div className={`grid gap-2 ${SECTION_BODY_CLASS}`}>
                  <CustomInput
                    form={form}
                    name="contactName"
                    label="Contact Name"
                    isDisabled={!selectedContact || isReadOnly}
                  />
                  <CustomInput
                    form={form}
                    name="emailAdd"
                    label="Email"
                    isDisabled={!selectedContact || isReadOnly}
                  />
                  <CustomInput
                    form={form}
                    name="mobileNo"
                    label="Mobile No"
                    isDisabled={!selectedContact || isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>

          <AuditTrailAccordion
            createBy={initialData?.createBy}
            createDate={initialData?.createDate}
            editBy={initialData?.editBy}
            editDate={initialData?.editDate}
            datetimeFormat={datetimeFormat}
          />
          {!hideActions && (
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" type="button" onClick={onCancelAction}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : mode === "edit"
                      ? "Update Tally Service"
                      : "Add Tally Service"}
                </Button>
              )}
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
