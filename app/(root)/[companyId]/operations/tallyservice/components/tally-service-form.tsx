"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ITallyService } from "@/interfaces"
import { IBankAddress, IBankContact } from "@/interfaces/bank"
import { ICustomerAddress, ICustomerContact } from "@/interfaces/customer"
import { ICurrencyLookup, ICustomerLookup } from "@/interfaces/lookup"
import { ISupplierAddress, ISupplierContact } from "@/interfaces/supplier"
import { tallyServiceSchema, TallyServiceSchemaType } from "@/schemas"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { differenceInMinutes, format, isValid, parse } from "date-fns"
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form"
import { toast } from "sonner"

import { getData } from "@/lib/api-client"
import { BasicSetting } from "@/lib/api-routes"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BargeAutocomplete,
  CountryAutocomplete,
  CurrencyAutocomplete,
  CustomerAutocomplete,
  GSTAutocomplete,
  JobStatusAutocomplete,
  PortAutocomplete,
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
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

import { TallyServiceServiceTab } from "./tally-service-service-tab"
import {
  buildFreshWaterLinesFromTally,
  buildLaunchLinesFromTally,
  createEmptyFreshWaterLine,
  mapFormToTallyService,
} from "./tally-service-utils"

const SECTION_CARD_CLASS =
  "rounded-lg border border-border bg-card px-4 pb-4 pt-5 [&_.text-red-500]:dark:text-red-400"
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
  /** Lock most fields when confirmed or posted (not job status). */
  isFieldsLocked?: boolean
  /** Lock job status only when posted (IsPost or status Posted). */
  isJobStatusLocked?: boolean
  /** Fires when freshwater/launch line eligibility for save changes (at least one valid line). */
  onSaveEligibilityChange?: (hasRequiredServiceLine: boolean) => void
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
  isFieldsLocked = false,
  isJobStatusLocked = false,
  onSaveEligibilityChange,
}: TallyServiceFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )
  const isReadOnly = mode === "view" || isFieldsLocked
  const isJobStatusDisabled = mode === "view" || isJobStatusLocked
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
      bargeId: initialData?.bargeId ?? 0,
      portId: initialData?.portId ?? 0,
      addressId: initialData?.addressId ?? 0,
      contactId: initialData?.contactId ?? 0,
      gstId: Number(initialData?.gstId) || 1,
      gstPercentage: initialData?.gstPercentage ?? 0,
      isActive: initialData?.isActive ?? true,
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
      freshWaterLines: (() => {
        const lines = buildFreshWaterLinesFromTally(initialData)
        if (lines.length > 0) return lines
        return mode === "create" ? [createEmptyFreshWaterLine()] : []
      })(),
      launchServiceLines: buildLaunchLinesFromTally(initialData).map(
        (line) => ({
          ...line,
          loadingTime: line.loadingTime
            ? parseWithFallback(line.loadingTime as string) || undefined
            : undefined,
          leftJetty: line.leftJetty
            ? parseWithFallback(line.leftJetty as string) || undefined
            : undefined,
          alongsideVessel: line.alongsideVessel
            ? parseWithFallback(line.alongsideVessel as string) || undefined
            : undefined,
          departedFromVessel: line.departedFromVessel
            ? parseWithFallback(line.departedFromVessel as string) || undefined
            : undefined,
          arrivedAtJetty: line.arrivedAtJetty
            ? parseWithFallback(line.arrivedAtJetty as string) || undefined
            : undefined,
        })
      ),
      invoiceId: initialData?.invoiceId ?? 0,
      invoiceNo: initialData?.invoiceNo ?? "",
      jobStatusId: initialData?.jobStatusId ?? 1,
      remarks: initialData?.remarks ?? "",
      editVersion: initialData?.editVersion ?? 0,
    }
  }, [dateFormat, initialData, mode, parseWithFallback])

  const form = useForm<TallyServiceSchemaType>({
    resolver: zodResolver(tallyServiceSchema),
    defaultValues: buildDefaultValues(),
  })

  const {
    fields: freshWaterFields,
    append: appendFreshWater,
    insert: insertFreshWater,
    remove: removeFreshWater,
  } = useFieldArray({
    control: form.control,
    name: "freshWaterLines",
  })

  const {
    fields: launchFields,
    append: appendLaunch,
    insert: insertLaunch,
    remove: removeLaunch,
  } = useFieldArray({
    control: form.control,
    name: "launchServiceLines",
  })

  useEffect(() => {
    form.reset(buildDefaultValues())
    setCustomerCode(initialData?.customerCode ?? "")
  }, [buildDefaultValues, form, initialData?.customerCode])

  const customerId = form.watch("customerId")
  const accountDate = form.watch("accountDate")
  const currencyId = form.watch("currencyId")
  const gstId = form.watch("gstId")
  const isCancel = form.watch("isCancel")

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
      if (gstId && accountDate) {
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
      } else if (!gstId) {
        form.setValue("gstPercentage", 0)
      }
    }
    fetchGstPercentage()
  }, [gstId, accountDate, form, parseWithFallback])

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

  const calculateWaitingTime = useCallback(
    (index: number) => {
      const start = form.getValues(`launchServiceLines.${index}.loadingTime`)
      const end = form.getValues(`launchServiceLines.${index}.leftJetty`)
      if (!start || !end) return
      const startDate = new Date(start)
      const endDate = new Date(end)
      if (!isValid(startDate) || !isValid(endDate)) return
      const diffMinutes = differenceInMinutes(endDate, startDate)
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      form.setValue(
        `launchServiceLines.${index}.waitingTime`,
        hours + minutes / 100
      )
    },
    [form]
  )

  const calculateTimeDiff = useCallback(
    (index: number) => {
      const start = form.getValues(
        `launchServiceLines.${index}.alongsideVessel`
      )
      const end = form.getValues(
        `launchServiceLines.${index}.departedFromVessel`
      )
      if (!start || !end) return
      const startDate = new Date(start)
      const endDate = new Date(end)
      if (!isValid(startDate) || !isValid(endDate)) return
      const diffMinutes = differenceInMinutes(endDate, startDate)
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      form.setValue(
        `launchServiceLines.${index}.timeDiff`,
        hours + minutes / 100
      )
    },
    [form]
  )

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
      const launchLines = form.getValues("launchServiceLines") ?? []
      launchLines.forEach((line, index) => {
        form.setValue(
          `launchServiceLines.${index}.loadingTime`,
          keepTime(line.loadingTime)
        )
        form.setValue(
          `launchServiceLines.${index}.leftJetty`,
          keepTime(line.leftJetty)
        )
        form.setValue(
          `launchServiceLines.${index}.alongsideVessel`,
          keepTime(line.alongsideVessel)
        )
        form.setValue(
          `launchServiceLines.${index}.departedFromVessel`,
          keepTime(line.departedFromVessel)
        )
        form.setValue(
          `launchServiceLines.${index}.arrivedAtJetty`,
          keepTime(line.arrivedAtJetty)
        )
        calculateWaitingTime(index)
        calculateTimeDiff(index)
      })
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
    submitAction(mapFormToTallyService(data, companyId, initialData))
  }

  const onSubmitInvalid = (errors: FieldErrors<TallyServiceSchemaType>) => {
    const collectFirst = (
      e: FieldErrors<TallyServiceSchemaType> | Record<string, unknown> | undefined
    ): string | undefined => {
      if (!e || typeof e !== "object") return undefined
      for (const v of Object.values(e)) {
        if (!v) continue
        if (typeof v === "object" && "message" in v && typeof v.message === "string") {
          return v.message
        }
        const nested = collectFirst(v as Record<string, unknown>)
        if (nested) return nested
      }
      return undefined
    }
    const msg =
      collectFirst(errors) ||
      "Please fix validation errors before saving."
    toast.error(msg)
  }

  const watchedFresh = form.watch("freshWaterLines")
  const watchedLaunch = form.watch("launchServiceLines")

  const hasRequiredServiceLine = useMemo(
    () =>
      (watchedFresh ?? []).some((l) => l.chargeId > 0 && l.uomId > 0) ||
      (watchedLaunch ?? []).some((l) => l.chargeId > 0),
    [watchedFresh, watchedLaunch]
  )

  useEffect(() => {
    onSaveEligibilityChange?.(hasRequiredServiceLine)
  }, [hasRequiredServiceLine, onSaveEligibilityChange])

  return (
    <div className="flex flex-col gap-2">
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)}
          className="space-y-3"
        >
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="mt-0 space-y-3">
              <div className={SECTION_CARD_CLASS}>
                <div className={SECTION_HEADER_ROW_CLASS}>
                  <Badge
                    variant="outline"
                    className={`${SECTION_HEADER_BADGE_CLASS} border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100`}
                  >
                    ⚓ Tally Service Details
                  </Badge>
                </div>
                <div className={`grid grid-cols-4 gap-2 ${SECTION_BODY_CLASS}`}>
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
                  <VesselAutocomplete
                    form={form}
                    name="vesselId"
                    label="Vessel"
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

                  <JobStatusAutocomplete
                    form={form}
                    name="jobStatusId"
                    label="Job Status"
                    isRequired
                    isDisabled={isJobStatusDisabled}
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
              </div>

              {/* Row 2: Accounts | Address + Contact */}
              <div className="grid grid-cols-12 gap-4">
                <div className={`col-span-4 ${SECTION_CARD_CLASS}`}>
                  <div className={SECTION_HEADER_ROW_CLASS}>
                    <Badge
                      variant="outline"
                      className={`${SECTION_HEADER_BADGE_CLASS} border-green-300 bg-green-100 text-green-800 hover:bg-green-200 dark:border-green-800/50 dark:bg-green-950/40 dark:text-green-100 dark:hover:bg-green-950/60`}
                    >
                      💰 Accounts
                    </Badge>
                  </div>
                  <div
                    className={`grid grid-cols-2 gap-2 ${SECTION_BODY_CLASS}`}
                  >
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
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <div className="col-span-2 flex flex-row flex-wrap items-center gap-6">
                        <CustomCheckbox
                          form={form}
                          name="isActive"
                          label="Active"
                          isDisabled={isReadOnly}
                        />
                        <CustomCheckbox
                          form={form}
                          name="isPost"
                          label="Posted"
                          isDisabled
                        />
                      </div>
                      <CustomCheckbox
                        form={form}
                        name="isCancel"
                        label="Cancel"
                        isDisabled={isReadOnly}
                        className="col-span-2"
                      />
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
                        className={`${SECTION_HEADER_BADGE_CLASS} border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-100`}
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
                        className={`${SECTION_HEADER_BADGE_CLASS} border-indigo-200 bg-indigo-100 text-indigo-800 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-100`}
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
            </TabsContent>

            <TabsContent value="service" className="mt-0">
              <TallyServiceServiceTab
                form={form}
                isReadOnly={isReadOnly}
                freshWaterFields={freshWaterFields}
                appendFreshWater={appendFreshWater}
                insertFreshWater={insertFreshWater}
                removeFreshWater={removeFreshWater}
                launchFields={launchFields}
                appendLaunch={appendLaunch}
                insertLaunch={insertLaunch}
                removeLaunch={removeLaunch}
                formatDurationToHhMm={formatDurationToHhMm}
                calculateWaitingTime={calculateWaitingTime}
                calculateTimeDiff={calculateTimeDiff}
              />
            </TabsContent>
          </Tabs>

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
