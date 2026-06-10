"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { IDebitNoteHd } from "@/interfaces/checklist"
import { ITallyService } from "@/interfaces"
import { IBankAddress, IBankContact } from "@/interfaces/bank"
import { ICustomerAddress, ICustomerContact } from "@/interfaces/customer"
import { ICurrencyLookup, ICustomerLookup } from "@/interfaces/lookup"
import { ISupplierAddress, ISupplierContact } from "@/interfaces/supplier"
import { tallyServiceSchema, TallyServiceSchemaType } from "@/schemas"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { differenceInMinutes, format, isValid, parse } from "date-fns"
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form"
import { toast } from "sonner"

import { getData, saveData } from "@/lib/api-client"
import { BasicSetting, TallyService, TallyService_DebitNote } from "@/lib/api-routes"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { useDelete } from "@/hooks/use-common"
import {
  useCustomerAddressLookup,
  useCustomerContactLookup,
} from "@/hooks/use-lookup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
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
import DebitNoteDialog from "./tally-service-debit-note-dialog"
import {
  buildFreshWaterLinesFromTally,
  buildLaunchLinesFromTally,
  hasTallyDocumentId,
  mapFormToTallyService,
  toTallyDocumentId,
} from "./tally-service-utils"

const SECTION_CARD_CLASS =
  "rounded-lg border border-border bg-card px-4 pb-4 pt-5 [&_.text-red-500]:dark:text-red-400"
const SECTION_HEADER_ROW_CLASS = "mb-2 flex flex-wrap items-center gap-2"
const SECTION_DIVIDER_CLASS =
  "mb-4 border-b border-gray-200 dark:border-gray-700"
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
  /** Lock most fields when invoice is posted (not when confirmed). */
  isFieldsLocked?: boolean
  /** Lock job status only when posted (IsPost or status Posted). */
  isJobStatusLocked?: boolean
}

interface ApiResponse<T> {
  result: number
  message?: string
  data?: T | T[]
  totalRecords?: number
}

function mapTallyDebitNoteResponse(data: IDebitNoteHd): IDebitNoteHd {
  return {
    ...data,
    tallyServiceId: data.tallyServiceId ?? 0,
  }
}

function extractDebitNoteHd(data: unknown): IDebitNoteHd | null {
  if (!data) return null
  if (Array.isArray(data)) {
    return data[0] ? mapTallyDebitNoteResponse(data[0] as IDebitNoteHd) : null
  }
  return mapTallyDebitNoteResponse(data as IDebitNoteHd)
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
  const tallyServiceNoManualRef = useRef(false)

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

    const seriesDate = initialData?.seriesDate
      ? format(
          parseWithFallback(initialData.seriesDate as string) || new Date(),
          dateFormat
        )
      : serviceDate

    return {
      tallyServiceId: toTallyDocumentId(initialData?.tallyServiceId),
      tallyServiceNo: initialData?.tallyServiceNo ?? "",
      tallyServiceNoSeq: initialData?.tallyServiceNoSeq ?? 0,
      referenceNo: initialData?.referenceNo ?? "",
      date: serviceDate,
      accountDate,
      seriesDate,
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
      freshWaterLines: buildFreshWaterLinesFromTally(initialData).map(
        (line) => ({
          ...line,
          tallyDate: line.tallyDate
            ? parseWithFallback(line.tallyDate as string) || undefined
            : parseWithFallback(serviceDate) || undefined,
        })
      ),
      launchServiceLines: buildLaunchLinesFromTally(initialData).map(
        (line) => ({
          ...line,
          tallyDate: line.tallyDate
            ? parseWithFallback(line.tallyDate as string) || undefined
            : parseWithFallback(serviceDate) || undefined,
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
      invoiceId: toTallyDocumentId(initialData?.invoiceId),
      invoiceNo: initialData?.invoiceNo ?? "",
      jobStatusId: initialData?.jobStatusId ?? 1,
      remarks: initialData?.remarks ?? "",
      editVersion: initialData?.editVersion ?? 0,
    }
  }, [dateFormat, initialData, parseWithFallback])

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
    tallyServiceNoManualRef.current =
      mode === "edit" && !!initialData?.tallyServiceNo
  }, [buildDefaultValues, form, initialData?.customerCode, initialData?.tallyServiceNo, mode])

  const customerId = form.watch("customerId")
  const accountDate = form.watch("accountDate")
  const currencyId = form.watch("currencyId")
  const gstId = form.watch("gstId")
  const isCancel = form.watch("isCancel")
  const serviceDate = form.watch("date")
  const portId = form.watch("portId")

  const queryClient = useQueryClient()
  const [showDebitNoteModal, setShowDebitNoteModal] = useState(false)
  const [debitNoteHd, setDebitNoteHd] = useState<IDebitNoteHd | null>(null)
  const [debitNoteNoLabel, setDebitNoteNoLabel] = useState(
    initialData?.debitNoteNo ?? ""
  )
  const [debitNoteIdLabel, setDebitNoteIdLabel] = useState(
    initialData?.debitNoteId && initialData?.debitNoteNo
      ? initialData.debitNoteId
      : 0
  )
  const [isDebitNoteLoading, setIsDebitNoteLoading] = useState(false)

  useEffect(() => {
    const hasDebitNote =
      (initialData?.debitNoteId ?? 0) > 0 &&
      Boolean(initialData?.debitNoteNo?.trim())
    setDebitNoteNoLabel(hasDebitNote ? (initialData?.debitNoteNo ?? "") : "")
    setDebitNoteIdLabel(hasDebitNote ? (initialData?.debitNoteId ?? 0) : 0)
  }, [initialData?.debitNoteId, initialData?.debitNoteNo])

  const hasExistingDebitNote =
    debitNoteIdLabel > 0 && Boolean(debitNoteNoLabel?.trim())

  const debitNoteDeleteMutation = useDelete(`${TallyService_DebitNote.delete}`)

  const hasServiceLines =
    freshWaterFields.length > 0 || launchFields.length > 0

  const tallyDebitNoteTaskId = useMemo(() => {
    const freshWaterCount = freshWaterFields.length
    const launchCount = launchFields.length
    if (launchCount > 0 && freshWaterCount === 0) return 2
    if (freshWaterCount > 0 && launchCount === 0) return 11
    if (launchCount > 0) return 2
    return 2
  }, [freshWaterFields.length, launchFields.length])

  const tallyServiceForDebitNote = useMemo((): ITallyService | undefined => {
    if (!initialData || !hasTallyDocumentId(initialData.tallyServiceId)) {
      return undefined
    }
    return {
      ...initialData,
      customerId: customerId || initialData.customerId,
      portId: portId || initialData.portId,
      currencyId: currencyId || initialData.currencyId,
      gstId: gstId || initialData.gstId,
    } as ITallyService
  }, [initialData, customerId, portId, currencyId, gstId])

  const handleDebitNote = useCallback(async () => {
    const tallyServiceId = toTallyDocumentId(initialData?.tallyServiceId)
    if (!hasServiceLines) return

    if (!hasTallyDocumentId(tallyServiceId)) {
      toast.error("Save the tally service before creating a debit note.")
      return
    }

    setIsDebitNoteLoading(true)
    try {
      const existingResponse = (await getData(
        `${TallyService_DebitNote.getByTallyServiceId}/${tallyServiceId}`
      )) as ApiResponse<IDebitNoteHd>

      if (existingResponse.result === 1 && existingResponse.data) {
        const existing = extractDebitNoteHd(existingResponse.data)
        if (existing) {
          setDebitNoteHd(existing)
          setDebitNoteNoLabel(existing.debitNoteNo ?? "")
          setDebitNoteIdLabel(existing.debitNoteId ?? 0)
          setShowDebitNoteModal(true)
          return
        }
      }

      const generateResponse = (await saveData(
        TallyService_DebitNote.generate,
        { tallyServiceId: Number(tallyServiceId), debitNoteNo: "" }
      )) as ApiResponse<IDebitNoteHd>

      if (generateResponse.result > 0) {
        const createdFromGenerate = extractDebitNoteHd(generateResponse.data)
        if (createdFromGenerate) {
          setDebitNoteHd(createdFromGenerate)
          setDebitNoteNoLabel(createdFromGenerate.debitNoteNo ?? "")
          setDebitNoteIdLabel(createdFromGenerate.debitNoteId ?? 0)
          setShowDebitNoteModal(true)
          await queryClient.invalidateQueries({ queryKey: ["tallyService"] })
          return
        }

        const debitNoteId =
          generateResponse.totalRecords ?? generateResponse.result
        const debitNoteResponse = (await getData(
          `${TallyService_DebitNote.getById}/${tallyServiceId}/${debitNoteId}`
        )) as ApiResponse<IDebitNoteHd>

        if (debitNoteResponse.result === 1 && debitNoteResponse.data) {
          const created = extractDebitNoteHd(debitNoteResponse.data)
          if (created) {
            setDebitNoteHd(created)
            setDebitNoteNoLabel(created.debitNoteNo ?? "")
            setDebitNoteIdLabel(created.debitNoteId ?? 0)
            setShowDebitNoteModal(true)
            await queryClient.invalidateQueries({ queryKey: ["tallyService"] })
            return
          }
        }
      }

      toast.error(generateResponse.message || "Failed to generate debit note.")
    } catch {
      toast.error("Failed to open debit note.")
    } finally {
      setIsDebitNoteLoading(false)
    }
  }, [hasServiceLines, initialData?.tallyServiceId, queryClient])

  const handleOpenDebitNote = useCallback(async () => {
    const tallyServiceId = toTallyDocumentId(initialData?.tallyServiceId)
    const debitNoteId =
      debitNoteHd?.debitNoteId ?? debitNoteIdLabel ?? initialData?.debitNoteId ?? 0

    if (!hasTallyDocumentId(tallyServiceId)) return

    setIsDebitNoteLoading(true)
    try {
      const response = (await getData(
        debitNoteId > 0
          ? `${TallyService_DebitNote.getById}/${tallyServiceId}/${debitNoteId}`
          : `${TallyService_DebitNote.getByTallyServiceId}/${tallyServiceId}`
      )) as ApiResponse<IDebitNoteHd>

      if (response.result === 1 && response.data) {
        const existing = extractDebitNoteHd(response.data)
        if (existing) {
          setDebitNoteHd(existing)
          setDebitNoteNoLabel(existing.debitNoteNo ?? "")
          setDebitNoteIdLabel(existing.debitNoteId ?? 0)
          setShowDebitNoteModal(true)
          return
        }
      }

      toast.error(response.message || "Debit note not found.")
    } catch {
      toast.error("Failed to open debit note.")
    } finally {
      setIsDebitNoteLoading(false)
    }
  }, [
    debitNoteHd?.debitNoteId,
    debitNoteIdLabel,
    initialData?.debitNoteId,
    initialData?.tallyServiceId,
  ])

  const handleDeleteDebitNote = useCallback(
    async (debitNoteId: number) => {
      const tallyServiceId = toTallyDocumentId(initialData?.tallyServiceId)
      if (!hasTallyDocumentId(tallyServiceId) || debitNoteId <= 0) return

      try {
        await debitNoteDeleteMutation.mutateAsync(
          `${tallyServiceId}/${debitNoteId}`
        )
        setShowDebitNoteModal(false)
        setDebitNoteHd(null)
        setDebitNoteNoLabel("")
        setDebitNoteIdLabel(0)
        await queryClient.invalidateQueries({ queryKey: ["tallyService"] })
        await queryClient.invalidateQueries({ queryKey: ["tallyServices"] })
        toast.success("Debit note deleted.")
      } catch {
        toast.error("Failed to delete debit note.")
      }
    },
    [debitNoteDeleteMutation, initialData?.tallyServiceId, queryClient]
  )

  const { data: customerAddresses = [] } = useCustomerAddressLookup(customerId)
  const { data: customerContacts = [] } = useCustomerContactLookup(customerId)

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
    if (mode !== "create" || isReadOnly) return
    if (tallyServiceNoManualRef.current) return
    if (!portId || portId <= 0 || !serviceDate) return

    const fetchNextTallyServiceNo = async () => {
      try {
        const parsedServiceDate = parseWithFallback(serviceDate)
        if (!parsedServiceDate) return
        const apiDate = format(parsedServiceDate, "yyyy-MM-dd")
        const res = await getData(
          `${TallyService.nextNo}?portId=${portId}&serviceDate=${apiDate}`
        )
        const payload = res?.data as
          | { tallyServiceNo?: string; TallyServiceNo?: string; tallyServiceNoSeq?: number; TallyServiceNoSeq?: number }
          | undefined
        const nextNo = payload?.tallyServiceNo ?? payload?.TallyServiceNo
        const nextSeq =
          payload?.tallyServiceNoSeq ?? payload?.TallyServiceNoSeq ?? 0
        if (nextNo) {
          form.setValue("tallyServiceNo", nextNo)
          form.setValue("tallyServiceNoSeq", nextSeq)
        }
      } catch {
        /* ignore preview failures */
      }
    }

    fetchNextTallyServiceNo()
  }, [form, isReadOnly, mode, parseWithFallback, portId, serviceDate])

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

  const handleAddressSelect = useCallback(
    (address: ICustomerAddress | ISupplierAddress | IBankAddress | null) => {
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
        form.setValue("countryId", 0)
        setSelectedAddress(null)
      }
    },
    [form]
  )

  const handleContactSelect = useCallback(
    (contact: ICustomerContact | ISupplierContact | IBankContact | null) => {
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
    },
    [form]
  )

  useEffect(() => {
    if (!customerId || customerId <= 0) return
    if ((form.getValues("addressId") ?? 0) > 0) return
    if (customerAddresses.length === 0) return

    const defaultAddress =
      customerAddresses.find((address) => address.isDefaultAdd && address.isActive) ??
      customerAddresses.find((address) => address.isActive)

    if (defaultAddress) {
      handleAddressSelect(defaultAddress)
    }
  }, [customerId, customerAddresses, form, handleAddressSelect])

  useEffect(() => {
    if (!customerId || customerId <= 0) return
    if ((form.getValues("contactId") ?? 0) > 0) return
    if (customerContacts.length === 0) return

    const defaultContact =
      customerContacts.find((contact) => contact.isDefault && contact.isActive) ??
      customerContacts.find((contact) => contact.isActive)

    if (defaultContact) {
      handleContactSelect(defaultContact)
    }
  }, [customerId, customerContacts, form, handleContactSelect])

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
      form.setValue("seriesDate", format(selectedDate, dateFormat))
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
      e:
        | FieldErrors<TallyServiceSchemaType>
        | Record<string, unknown>
        | undefined
    ): string | undefined => {
      if (!e || typeof e !== "object") return undefined
      for (const v of Object.values(e)) {
        if (!v) continue
        if (
          typeof v === "object" &&
          "message" in v &&
          typeof v.message === "string"
        ) {
          return v.message
        }
        const nested = collectFirst(v as Record<string, unknown>)
        if (nested) return nested
      }
      return undefined
    }
    const msg =
      collectFirst(errors) || "Please fix validation errors before saving."
    toast.error(msg)
  }

  return (
    <div className="flex flex-col gap-2">
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)}
          className="space-y-4"
        >
          <div className="space-y-4">
            {/* Job details + accounts sidebar (checklist-new pattern) */}
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className={`w-full lg:w-[75%] ${SECTION_CARD_CLASS}`}>
                <div className={SECTION_HEADER_ROW_CLASS}>
                  <Badge
                    variant="outline"
                    className={`${SECTION_HEADER_BADGE_CLASS} border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100`}
                  >
                    ⚓ Tally Service Details
                  </Badge>
                </div>
                <div className={SECTION_DIVIDER_CLASS} />
                <div
                  className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${SECTION_BODY_CLASS}`}
                >
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
                    name="tallyServiceNo"
                    label="Tally Service No"
                    isDisabled={isReadOnly || mode === "create"}
                    onChangeEvent={() => {
                      tallyServiceNoManualRef.current = true
                    }}
                  />
                  <CustomInput
                    form={form}
                    name="referenceNo"
                    label="Reference No"
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
                    className="col-span-2 sm:col-span-2"
                  />
                </div>
              </div>

              <div className={`w-full lg:w-[25%] ${SECTION_CARD_CLASS}`}>
                <div className={SECTION_HEADER_ROW_CLASS}>
                  <Badge
                    variant="outline"
                    className={`${SECTION_HEADER_BADGE_CLASS} border-green-300 bg-green-100 text-green-800 hover:bg-green-200 dark:border-green-800/50 dark:bg-green-950/40 dark:text-green-100 dark:hover:bg-green-950/60`}
                  >
                    💰 Accounts
                  </Badge>
                </div>
                <div className={SECTION_DIVIDER_CLASS} />
                <div className={`grid grid-cols-1 gap-2 ${SECTION_BODY_CLASS}`}>
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <CustomDateNew
                      form={form}
                      name="accountDate"
                      label="Account Date"
                      isRequired
                      isDisabled={isReadOnly}
                      isFutureShow
                    />
                    <CustomDateNew
                      form={form}
                      name="seriesDate"
                      label="Series Date"
                      isRequired
                      isDisabled={isReadOnly}
                      isFutureShow
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                  <div className="flex flex-row flex-wrap items-center gap-4 pt-1">
                    <CustomCheckbox
                      form={form}
                      name="isActive"
                      label="Active"
                      labelPosition="top"
                      isDisabled={isReadOnly}
                    />
                    <CustomCheckbox
                      form={form}
                      name="isPost"
                      label="Posted"
                      labelPosition="top"
                      isDisabled
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
                    />
                  )}
                </div>
              </div>
            </div>

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
              hasServiceLines={hasServiceLines}
              debitNoteNo={debitNoteNoLabel}
              hasExistingDebitNote={hasExistingDebitNote}
              onDebitNote={mode !== "create" ? handleDebitNote : undefined}
              onOpenDebitNote={
                mode !== "create" && debitNoteNoLabel
                  ? handleOpenDebitNote
                  : undefined
              }
              isDebitNoteLoading={isDebitNoteLoading}
            />

            {/* Bill-to: address + contact (pickers co-located with fields) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className={SECTION_CARD_CLASS}>
                <div className={SECTION_HEADER_ROW_CLASS}>
                  <Badge
                    variant="outline"
                    className={`${SECTION_HEADER_BADGE_CLASS} border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-100`}
                  >
                    📍 Address Details
                  </Badge>
                </div>
                <div className={SECTION_DIVIDER_CLASS} />
                <div className={`grid gap-2 ${SECTION_BODY_CLASS}`}>
                  <DynamicAddressAutocomplete
                    form={form}
                    name="addressId"
                    label="Address"
                    entityId={customerId}
                    entityType={AddressEntityType.CUSTOMER}
                    onChangeEvent={handleAddressSelect}
                    isDisabled={isReadOnly}
                    isRequired
                  />
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <CountryAutocomplete
                      form={form}
                      name="countryId"
                      label="Country"
                      isDisabled={isReadOnly}
                      isRequired
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
                <div className={SECTION_DIVIDER_CLASS} />
                <div className={`grid gap-2 ${SECTION_BODY_CLASS}`}>
                  <DynamicContactAutocomplete
                    form={form}
                    name="contactId"
                    label="Contact"
                    entityId={customerId}
                    entityType={ContactEntityType.CUSTOMER}
                    onChangeEvent={handleContactSelect}
                    isDisabled={isReadOnly}
                    isRequired
                  />
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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

      {tallyServiceForDebitNote && (
        <DebitNoteDialog
          open={showDebitNoteModal}
          taskId={tallyDebitNoteTaskId}
          debitNoteHd={debitNoteHd ?? undefined}
          isConfirmed={isReadOnly}
          title="Tally Service Debit Note"
          onOpenChangeAction={setShowDebitNoteModal}
          onDeleteAction={isReadOnly ? undefined : handleDeleteDebitNote}
          onUpdateHeader={(header) => {
            setDebitNoteHd(header)
            setDebitNoteNoLabel(header.debitNoteNo ?? "")
            setDebitNoteIdLabel(header.debitNoteId ?? 0)
          }}
          tallyService={tallyServiceForDebitNote}
        />
      )}
    </div>
  )
}
