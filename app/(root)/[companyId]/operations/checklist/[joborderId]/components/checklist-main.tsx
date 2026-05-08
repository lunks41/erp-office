"use client"

import { useCompanyStore } from "@/stores/company-store"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { IBankAddress, IBankContact } from "@/interfaces/bank"
import { IJobOrderHd } from "@/interfaces/checklist"
import { ICustomerAddress, ICustomerContact } from "@/interfaces/customer"
import {
  ICurrencyLookup,
  ICustomerLookup,
  IGeoLocationLookup,
  IVesselLookup,
} from "@/interfaces/lookup"
import { ISupplierAddress, ISupplierContact } from "@/interfaces/supplier"
import { JobOrderHdSchema, JobOrderHdSchemaType } from "@/schemas/checklist"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { getData } from "@/lib/api-client"
import { BasicSetting } from "@/lib/api-routes"
import {
  clientDateFormat,
  formatDateForApi,
  formatDateTimeForApi,
  parseDate,
} from "@/lib/date-utils"
import { updateJobOrderDirect } from "@/hooks/use-checklist"
import { Badge } from "@/components/ui/badge"
import { Form } from "@/components/ui/form"
import {
  CountryAutocomplete,
  CurrencyAutocomplete,
  CustomerAutocomplete,
  GSTAutocomplete,
  GeoLocationAutocomplete,
  JobStatusAutocomplete,
  PortAutocomplete,
  VesselAutocomplete,
  VoyageAutocomplete,
} from "@/components/autocomplete"
import DynamicAddressAutocomplete, {
  EntityType as AddressEntityType,
} from "@/components/autocomplete/autocomplete-address-dynamic"
import DynamicContactAutocomplete, {
  EntityType as ContactEntityType,
} from "@/components/autocomplete/autocomplete-contact-dynamic"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { CustomDateTimePicker } from "@/components/custom/custom-date-time-picker"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface ChecklistMainProps {
  jobData?: IJobOrderHd | null
  setFormRef?: (ref: HTMLFormElement | null) => void
  isConfirmed?: boolean
  onUpdateSuccess?: () => void
}

export function ChecklistMain({
  jobData,
  setFormRef,
  isConfirmed,
  onUpdateSuccess,
}: ChecklistMainProps) {
  const params = useParams()
  const companyId = params?.companyId as string | undefined
  const { decimals } = useCompanyStore()
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const handleInvoiceNoDoubleClick = useCallback(() => {
    const invoiceId = jobData?.invoiceId
    if (
      !companyId ||
      invoiceId === undefined ||
      invoiceId === null ||
      Number(invoiceId) <= 0
    )
      return
    const docId = String(invoiceId).trim()
    if (!docId) return
    const targetPath = `/${companyId}/ar/invoice`
    const storageKey = `history-doc:${targetPath}`
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, docId)
      window.open(targetPath, "_blank", "noopener,noreferrer")
    }
  }, [companyId, jobData?.invoiceId])

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

  // State to track customer code for label display
  const [customerCode, setCustomerCode] = useState<string>("")

  // State for address and contact
  const [selectedAddress, setSelectedAddress] =
    useState<ICustomerAddress | null>(null)
  const [selectedContact, setSelectedContact] =
    useState<ICustomerContact | null>(null)

  // Ref to track if we just updated to prevent useEffect from overwriting response data
  const justUpdatedRef = React.useRef(false)

  type JobOrderSchemaType = z.infer<typeof JobOrderHdSchema>

  // Direct API functions using api-client.ts for save, update operations

  const form = useForm<JobOrderHdSchemaType>({
    resolver: zodResolver(JobOrderHdSchema),
    defaultValues: {
      jobOrderId: jobData?.jobOrderId ?? 0,
      jobOrderNo: jobData?.jobOrderNo ?? "",
      jobOrderDate: jobData?.jobOrderDate
        ? format(
            parseWithFallback(jobData.jobOrderDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      imoCode: jobData?.imoCode ?? "",
      vesselDistance: jobData?.vesselDistance ?? 10,
      portId: jobData?.portId ?? 0,
      customerId: jobData?.customerId ?? 0,
      currencyId: jobData?.currencyId ?? 0,
      exhRate: jobData?.exhRate ?? 0,
      vesselId: jobData?.vesselId ?? 0,
      voyageId: jobData?.voyageId ?? 0,
      geoLocationId: jobData?.geoLocationId ?? 0,
      latitude: jobData?.latitude ?? "",
      longitude: jobData?.longitude ?? "",
      lastPortId: jobData?.lastPortId ?? 0,
      nextPortId: jobData?.nextPortId ?? 0,
      etaDate: jobData?.etaDate
        ? parseDate(jobData.etaDate as string) || undefined
        : undefined,
      etdDate: jobData?.etdDate
        ? parseDate(jobData.etdDate as string) || undefined
        : undefined,
      etbDate: jobData?.etbDate
        ? parseDate(jobData.etbDate as string) || undefined
        : undefined,
      ownerName: jobData?.ownerName ?? "",
      ownerAgent: jobData?.ownerAgent ?? "",
      masterName: jobData?.masterName ?? "",
      charters: jobData?.charters ?? "",
      chartersAgent: jobData?.chartersAgent ?? "",
      accountDate: jobData?.accountDate
        ? format(
            parseWithFallback(jobData.accountDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      seriesDate: jobData?.seriesDate
        ? format(
            parseWithFallback(jobData.seriesDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      addressId: jobData?.addressId ?? 0,
      billName: jobData?.billName ?? "",
      address1: jobData?.address1 ?? "",
      address2: jobData?.address2 ?? "",
      address3: jobData?.address3 ?? "",
      address4: jobData?.address4 ?? "",
      pinCode: jobData?.pinCode ?? "",
      countryId: jobData?.countryId ?? 0,
      phoneNo: jobData?.phoneNo ?? "",
      faxNo: jobData?.faxNo ?? "",
      contactId: jobData?.contactId ?? 0,
      contactName: jobData?.contactName ?? "",
      mobileNo: jobData?.mobileNo ?? "",
      emailAdd: jobData?.emailAdd ?? "",
      natureOfCall: jobData?.natureOfCall ?? "",
      isps: jobData?.isps ?? "",
      isTaxable: jobData?.isTaxable ?? false,
      isClose: jobData?.isClose ?? false,
      isPost: jobData?.isPost ?? false,
      isActive: jobData?.isActive ?? true,
      remarks: jobData?.remarks ?? "",
      jobStatusId: jobData?.jobStatusId ?? 1,
      gstId: jobData?.gstId ?? 0,
      gstPercentage: jobData?.gstPercentage ?? 0,
      editVersion: jobData?.editVersion ?? 0,
    },
  })

  // Watch isTaxable to conditionally show GST field
  const isTaxable = form.watch("isTaxable")

  // Watch customerId to reset address and contact when customer changes
  const customerId = form.watch("customerId")

  // Watch accountDate to update exchange rate
  const accountDate = form.watch("accountDate")

  // Watch currencyId to update exchange rate when date or currency changes
  const currencyId = form.watch("currencyId")

  // Watch gstId to fetch GST percentage
  const gstId = form.watch("gstId")

  // Set gstId to 1 when isTaxable is false
  useEffect(() => {
    if (!isTaxable) {
      form.setValue("gstId", 1, { shouldValidate: false })
      form.setValue("gstPercentage", 0, { shouldValidate: false })
    }
  }, [isTaxable, form])

  // Handler for ETA Date blur - validate against ETD when user finishes selecting
  const handleEtaDateBlur = useCallback(
    (date: Date | null) => {
      if (!date) {
        // Rule 1: If etaDate is empty, then etdDate should be empty
        const currentEtdDate = form.getValues("etdDate")
        if (currentEtdDate) {
          form.setValue("etdDate", undefined, { shouldValidate: false })
          toast.info("ETD Date has been cleared because ETA Date is empty")
        }
        return
      }

      // Rule 2: Validate ETA against existing ETD only when user finishes selecting
      const etdDate = form.getValues("etdDate")
      if (etdDate) {
        const eta = date instanceof Date ? date : new Date(date)
        const etd = etdDate instanceof Date ? etdDate : new Date(etdDate)

        // Clear ETD if ETA >= ETD (invalid - ETD must be after ETA)
        if (eta.getTime() >= etd.getTime()) {
          form.setValue("etdDate", undefined, { shouldValidate: false })
          toast.error(
            "ETD Date must be greater than ETA Date (with time). ETD Date has been cleared."
          )
        }
      }
    },
    [form]
  )

  // Handler for ETD Date blur - validate against ETA when user finishes selecting
  const handleEtdDateBlur = useCallback(
    (date: Date | null) => {
      if (!date) {
        return // ETD can be empty
      }

      // Validate ETD against existing ETA only when user finishes selecting
      const etaDate = form.getValues("etaDate")
      if (etaDate) {
        const eta = etaDate instanceof Date ? etaDate : new Date(etaDate)
        const etd = date instanceof Date ? date : new Date(date)

        // Clear ETD if ETA >= ETD (invalid - ETD must be after ETA)
        if (eta.getTime() >= etd.getTime()) {
          form.setValue("etdDate", undefined, { shouldValidate: false })
          toast.error(
            "ETD Date must be greater than ETA Date (with time). ETD Date has been cleared."
          )
        }
      }
    },
    [form]
  )

  useEffect(() => {
    // Skip reset if we just updated (to prevent overwriting response data)
    if (justUpdatedRef.current) {
      justUpdatedRef.current = false
      return
    }

    form.reset({
      jobOrderId: jobData?.jobOrderId ?? 0,
      jobOrderNo: jobData?.jobOrderNo ?? "",
      jobOrderDate: jobData?.jobOrderDate
        ? format(
            parseWithFallback(jobData.jobOrderDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      portId: jobData?.portId ?? 0,
      customerId: jobData?.customerId ?? 0,
      currencyId: jobData?.currencyId ?? 0,
      exhRate: jobData?.exhRate ?? 0,
      vesselId: jobData?.vesselId ?? 0,
      voyageId: jobData?.voyageId ?? 0,
      geoLocationId: jobData?.geoLocationId ?? 0,
      latitude: jobData?.latitude ?? "",
      longitude: jobData?.longitude ?? "",
      lastPortId: jobData?.lastPortId ?? 0,
      nextPortId: jobData?.nextPortId ?? 0,
      etaDate: jobData?.etaDate
        ? parseDate(jobData.etaDate as string) || undefined
        : undefined,
      etdDate: jobData?.etdDate
        ? parseDate(jobData.etdDate as string) || undefined
        : undefined,
      etbDate: jobData?.etbDate
        ? parseDate(jobData.etbDate as string) || undefined
        : undefined,
      ownerName: jobData?.ownerName ?? "",
      ownerAgent: jobData?.ownerAgent ?? "",
      masterName: jobData?.masterName ?? "",
      charters: jobData?.charters ?? "",
      chartersAgent: jobData?.chartersAgent ?? "",
      accountDate: jobData?.accountDate
        ? format(
            parseWithFallback(jobData.accountDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      seriesDate: jobData?.seriesDate
        ? format(
            parseWithFallback(jobData.seriesDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      addressId: jobData?.addressId ?? 0,
      billName: jobData?.billName ?? "",
      address1: jobData?.address1 ?? "",
      address2: jobData?.address2 ?? "",
      address3: jobData?.address3 ?? "",
      address4: jobData?.address4 ?? "",
      pinCode: jobData?.pinCode ?? "",
      countryId: jobData?.countryId ?? 0,
      phoneNo: jobData?.phoneNo ?? "",
      faxNo: jobData?.faxNo ?? "",
      contactId: jobData?.contactId ?? 0,
      contactName: jobData?.contactName ?? "",
      mobileNo: jobData?.mobileNo ?? "",
      emailAdd: jobData?.emailAdd ?? "",
      natureOfCall: jobData?.natureOfCall ?? "",
      isps: jobData?.isps ?? "",
      imoCode: jobData?.imoCode ?? "",
      isTaxable: jobData?.isTaxable ?? false,
      isClose: jobData?.isClose ?? false,
      isPost: jobData?.isPost ?? false,
      isActive: jobData?.isActive ?? true,
      remarks: jobData?.remarks ?? "",
      jobStatusId: jobData?.jobStatusId ?? 1,
      gstId: jobData?.gstId ?? 0,
      gstPercentage: jobData?.gstPercentage ?? 0,
      editVersion: jobData?.editVersion ?? 0,
      vesselDistance: jobData?.vesselDistance ?? 10,
    })
  }, [jobData, form, dateFormat, parseWithFallback])

  // Initialize address and contact from form values only on initial load or when customer changes
  useEffect(() => {
    // Only initialize if we have form values but no selected address/contact yet
    // This prevents overwriting when user selects a new address/contact
    const addressId = form.getValues("addressId") || 0
    const contactId = form.getValues("contactId") || 0

    if (addressId > 0 && !selectedAddress) {
      const address: ICustomerAddress = {
        customerId: customerId,
        addressId: addressId,
        billName: form.getValues("billName") || "",
        address1: form.getValues("address1") || "",
        address2: form.getValues("address2") || "",
        address3: form.getValues("address3") || "",
        address4: form.getValues("address4") || "",
        pinCode: form.getValues("pinCode") || "",
        countryId: form.getValues("countryId") || 0,
        phoneNo: form.getValues("phoneNo") || "",
        faxNo: form.getValues("faxNo") || "",
        emailAdd: "",
        webUrl: "",
        isDefaultAdd: false,
        isDeliveryAdd: false,
        isFinAdd: false,
        isSalesAdd: false,
        isActive: true,
        createById: 0,
        createDate: new Date(),
        editById: 0,
        editDate: new Date(),
        createBy: "",
        editBy: "",
      }
      setSelectedAddress(address)
    } else if (addressId === 0) {
      setSelectedAddress(null)
    }

    if (contactId > 0 && !selectedContact) {
      const contact: ICustomerContact = {
        contactId: contactId,
        customerId: customerId,
        customerCode: "",
        customerName: "",
        contactName: form.getValues("contactName") || "",
        otherName: form.getValues("emailAdd") || "",
        mobileNo: form.getValues("mobileNo") || "",
        offNo: "",
        faxNo: "",
        emailAdd: "",
        messId: "",
        contactMessType: "",
        isDefault: false,
        isFinance: false,
        isSales: false,
        isActive: true,
        createById: 0,
        createDate: new Date(),
        editById: 0,
        editDate: new Date(),
        createBy: "",
        editBy: "",
      }
      setSelectedContact(contact)
    } else if (contactId === 0) {
      setSelectedContact(null)
    }
  }, [customerId, form, selectedAddress, selectedContact])

  // Reset address and contact when customer changes (only for new selections, not initial load)
  useEffect(() => {
    const currentAddressId = form.getValues("addressId")
    const currentContactId = form.getValues("contactId")

    // Only reset if we have a customer change and there were previously selected address/contact
    if (
      customerId &&
      customerId !== jobData?.customerId &&
      (currentAddressId || currentContactId)
    ) {
      form.setValue("addressId", 0)
      form.setValue("contactId", 0)
      setSelectedAddress(null)
      setSelectedContact(null)
      toast.info("Address and contact have been reset for the new customer.")
    }
  }, [customerId, jobData?.customerId, form])

  // Update exchange rate when accountDate or currencyId changes
  useEffect(() => {
    const updateExchangeRate = async () => {
      if (accountDate && currencyId) {
        try {
          // Format date to yyyy-MM-dd (matching account.ts pattern)
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
        } catch (_error) {
          // console.error("Error fetching exchange rate:", error)
        }
      }
    }

    updateExchangeRate()
  }, [accountDate, currencyId, exhRateDec, form, parseWithFallback])

  // Fetch GST percentage when gstId or accountDate changes
  useEffect(() => {
    const fetchGstPercentage = async () => {
      // Only fetch if taxable is true and both gstId and accountDate are available
      if (isTaxable && gstId && accountDate) {
        try {
          // Format date to yyyy-MM-dd (matching account.ts pattern)
          const parsedAccountDate = parseWithFallback(accountDate)
          if (!parsedAccountDate) return

          const dt = format(parsedAccountDate, "yyyy-MM-dd")
          const res = await getData(
            `${BasicSetting.getGstPercentage}/${gstId}/${dt}`
          )
          const gstPercentage = res?.data as number

          if (gstPercentage !== undefined && gstPercentage !== null) {
            form.setValue("gstPercentage", gstPercentage)
            form.trigger("gstPercentage")
          }
        } catch (error) {
          console.error("Error fetching GST percentage:", error)
        }
      } else if (!isTaxable || !gstId) {
        // Reset GST percentage when not taxable or no GST selected
        form.setValue("gstPercentage", 0)
      }
    }

    fetchGstPercentage()
  }, [gstId, accountDate, isTaxable, form, parseWithFallback])

  // Initialize customer code when jobData is loaded
  useEffect(() => {
    if (jobData?.customerCode) {
      setCustomerCode(jobData.customerCode)
    }
  }, [jobData?.customerCode])

  // Helper function to transform IJobOrderHd to JobOrderHdSchemaType
  const transformToSchemaType = (
    apiJobOrder: IJobOrderHd
  ): JobOrderHdSchemaType => {
    return {
      jobOrderId: apiJobOrder.jobOrderId ?? 0,
      jobOrderNo: apiJobOrder.jobOrderNo ?? "",
      jobOrderDate: apiJobOrder.jobOrderDate
        ? format(
            parseWithFallback(apiJobOrder.jobOrderDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      portId: apiJobOrder.portId ?? 0,
      customerId: apiJobOrder.customerId ?? 0,
      currencyId: apiJobOrder.currencyId ?? 0,
      exhRate: apiJobOrder.exhRate ?? 0,
      vesselId: apiJobOrder.vesselId ?? 0,
      voyageId: apiJobOrder.voyageId ?? 0,
      geoLocationId: apiJobOrder.geoLocationId ?? 0,
      latitude: apiJobOrder.latitude ?? "",
      longitude: apiJobOrder.longitude ?? "",
      lastPortId: apiJobOrder.lastPortId ?? 0,
      nextPortId: apiJobOrder.nextPortId ?? 0,
      etaDate: apiJobOrder.etaDate
        ? parseDate(apiJobOrder.etaDate as string) || undefined
        : undefined,
      etdDate: apiJobOrder.etdDate
        ? parseDate(apiJobOrder.etdDate as string) || undefined
        : undefined,
      etbDate: apiJobOrder.etbDate
        ? parseDate(apiJobOrder.etbDate as string) || undefined
        : undefined,
      ownerName: apiJobOrder.ownerName ?? "",
      ownerAgent: apiJobOrder.ownerAgent ?? "",
      masterName: apiJobOrder.masterName ?? "",
      charters: apiJobOrder.charters ?? "",
      chartersAgent: apiJobOrder.chartersAgent ?? "",
      accountDate: apiJobOrder.accountDate
        ? format(
            parseWithFallback(apiJobOrder.accountDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      seriesDate: apiJobOrder.seriesDate
        ? format(
            parseWithFallback(apiJobOrder.seriesDate as string) || new Date(),
            dateFormat
          )
        : format(new Date(), dateFormat),
      addressId: apiJobOrder.addressId ?? 0,
      contactId: apiJobOrder.contactId ?? 0,
      billName: apiJobOrder.billName ?? "",
      address1: apiJobOrder.address1 ?? "",
      address2: apiJobOrder.address2 ?? "",
      address3: apiJobOrder.address3 ?? "",
      address4: apiJobOrder.address4 ?? "",
      pinCode: apiJobOrder.pinCode ?? "",
      countryId: apiJobOrder.countryId ?? 0,
      phoneNo: apiJobOrder.phoneNo ?? "",
      faxNo: apiJobOrder.faxNo ?? "",
      contactName: apiJobOrder.contactName ?? "",
      mobileNo: apiJobOrder.mobileNo ?? "",
      emailAdd: apiJobOrder.emailAdd ?? "",
      natureOfCall: apiJobOrder.natureOfCall ?? "",
      isps: apiJobOrder.isps ?? "",
      imoCode: apiJobOrder.imoCode ?? "",
      isTaxable: apiJobOrder.isTaxable ?? false,
      isClose: apiJobOrder.isClose ?? false,
      isPost: apiJobOrder.isPost ?? false,
      isActive: apiJobOrder.isActive ?? true,
      remarks: apiJobOrder.remarks ?? "",
      jobStatusId: apiJobOrder.jobStatusId ?? 1,
      gstId: apiJobOrder.gstId ?? 0,
      gstPercentage: apiJobOrder.gstPercentage ?? 0,
      editVersion: apiJobOrder.editVersion ?? 0,
      vesselDistance: apiJobOrder.vesselDistance ?? 10,
    }
  }

  const onSubmit = async (data: JobOrderSchemaType) => {
    // console.log("Form data:", data)
    try {
      // Validate etaDate < etdDate before submission (with time)
      if (data.etaDate && data.etdDate) {
        const eta =
          data.etaDate instanceof Date ? data.etaDate : new Date(data.etaDate)
        const etd =
          data.etdDate instanceof Date ? data.etdDate : new Date(data.etdDate)

        // Compare dates with time (full timestamp comparison)
        // ETD must be greater than ETA (invalid if ETA >= ETD)
        if (eta >= etd) {
          toast.error("ETD Date must be greater than ETA Date (with time)")
          return
        }
      }

      // Format dates - following ar-invoice pattern
      // Use transformToSchemaType to ensure dates are properly formatted as strings
      // Date-only fields (accountDate, seriesDate, jobOrderDate) should be strings in "dd/MM/yyyy" format
      // DateTime fields (etaDate, etdDate) should include time using formatDateTimeForApi
      const formValues = transformToSchemaType(data as unknown as IJobOrderHd)

      // Format DateTime fields - use formatDateTimeForApi for fields with time
      const etaDateFormatted = formatDateTimeForApi(data.etaDate)
      const etdDateFormatted = formatDateTimeForApi(data.etdDate)
      const etbDateFormatted = formatDateTimeForApi(data.etbDate)

      const formData: Partial<IJobOrderHd> = {
        ...formValues,
        // Date-only fields: format to yyyy-MM-dd using formatDateForApi
        jobOrderDate: formatDateForApi(formValues.jobOrderDate) || "",
        accountDate: formatDateForApi(formValues.accountDate) || "",
        seriesDate: formatDateForApi(formValues.seriesDate) || "",
        // DateTime fields: format with time using formatDateTimeForApi
        // Converts to ISO 8601 format (yyyy-MM-ddTHH:mm:ss.SSSZ)
        etaDate: etaDateFormatted,
        etdDate: etdDateFormatted,
        etbDate: etbDateFormatted,

        invoiceId: jobData?.invoiceId ?? "",
        invoiceNo: jobData?.invoiceNo ?? "",
      }

      console.log("Formatted form data:", formData)

      // console.log("Calling updateJobOrder API using api-client.ts...")
      const response = await updateJobOrderDirect(formData)
      // console.log("Update API call completed:", response)
      if (response.result === 1) {
        // Extract job order data from response (handle array or object)
        const jobOrderData = Array.isArray(response.data)
          ? response.data[0]
          : response.data

        // Transform API response back to form values
        if (jobOrderData) {
          const updatedSchemaType = transformToSchemaType(
            jobOrderData as unknown as IJobOrderHd
          )

          // Update customer code if available
          const responseData = jobOrderData as IJobOrderHd & {
            customerCode?: string
          }
          if (responseData.customerCode) {
            setCustomerCode(responseData.customerCode)
          }

          // Set flag to prevent useEffect from overwriting this reset
          justUpdatedRef.current = true

          // Reset form with updated data from server response
          // This ensures form reflects the latest server state (including editVersion, timestamps, etc.)
          // Use reset with keepDefaultValues: false to ensure all fields are updated
          form.reset(updatedSchemaType, {
            keepDefaultValues: false,
            keepDirty: false,
            keepErrors: false,
          })

          // Wait a tick to ensure form state is updated before triggering validation
          await new Promise((resolve) => setTimeout(resolve, 0))
          form.trigger()

          // Trigger parent refetch to update page.tsx data (including editVersion in header)
          // This will update jobData prop, but we've already reset the form with response data
          if (onUpdateSuccess) {
            onUpdateSuccess()
          }
        }

        toast.success(response.message || "Job order updated successfully!")
      } else {
        toast.error(response.message || "Update failed")
      }
    } catch (_error) {
      // console.error("Error saving job order:", _error)
      toast.error("Failed to save job order. Please try again.")
      // Don't call onSuccess on failure - keep dialog open
    }
  }

  // Handle currency selection
  const handleCurrencyChange = React.useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      // Additional logic when currency changes
      // console.log("Selected currency:", selectedCurrency)
      const selectedCurrencyId = selectedCurrency?.currencyId || 0
      const accountDate =
        form.getValues("accountDate") || form.getValues("jobOrderDate")

      if (selectedCurrencyId && accountDate) {
        // Format date to yyyy-MM-dd (matching account.ts pattern)
        const parsedAccountDate = parseWithFallback(accountDate)
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

  // Handle customer selection
  const handleCustomerChange = React.useCallback(
    (selectedCustomer: ICustomerLookup | null) => {
      // Reset address and contact when customer changes
      if (selectedCustomer?.customerId !== customerId) {
        form.setValue("addressId", 0)
        form.setValue("contactId", 0)
        form.setValue("currencyId", selectedCustomer?.currencyId ?? 0)

        // Store customer code for label display
        if (selectedCustomer?.customerCode) {
          setCustomerCode(selectedCustomer.customerCode)
        } else {
          setCustomerCode("")
        }

        // Trigger currency change to update exchange rate
        if (selectedCustomer?.currencyId) {
          // Create a minimal currency object for the API call
          const currencyObj = {
            currencyId: selectedCustomer.currencyId,
            currencyCode: "",
            currencyName: "",
            isMultiply: false,
          }
          handleCurrencyChange(currencyObj)
        }

        toast.info("Address and contact have been reset for the new customer.")
      }
    },
    [customerId, form, setCustomerCode, handleCurrencyChange]
  )

  // Handle vessel selection
  const handleVesselChange = React.useCallback(
    (selectedVessel: IVesselLookup | null) => {
      // console.log("Selected vessel:", selectedVessel)
      // console.log("Selected vessel IMO code:", selectedVessel?.imoCode)
      // console.log("All vessel data:", selectedVessel)

      // Populate IMO code when vessel changes
      if (selectedVessel?.imoCode) {
        // console.log("Setting IMO code to:", selectedVessel.imoCode)
        form.setValue("imoCode", selectedVessel.imoCode)
        toast.info(`IMO code has been populated: ${selectedVessel.imoCode}`)
      } else {
        // console.log("No IMO code found, clearing field")
        form.setValue("imoCode", "")
        if (selectedVessel) {
          toast.info("Selected vessel has no IMO code")
        }
      }
    },
    [form]
  )

  // Handle geo location selection
  const handleGeoLocationChange = React.useCallback(
    (selectedGeoLocation: IGeoLocationLookup | null) => {
      // Populate latitude and longitude when geo location changes
      if (selectedGeoLocation?.latitude && selectedGeoLocation?.longitude) {
        form.setValue("latitude", selectedGeoLocation.latitude)
        form.setValue("longitude", selectedGeoLocation.longitude)
        toast.info(
          `Latitude and Longitude have been populated: ${selectedGeoLocation.latitude}, ${selectedGeoLocation.longitude}`
        )
      } else {
        form.setValue("latitude", "")
        form.setValue("longitude", "")
        if (selectedGeoLocation) {
          toast.info("Selected geo location has no latitude/longitude")
        }
      }
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
      form.setValue("billName", "")
      form.setValue("address1", "")
      form.setValue("address2", "")
      form.setValue("address3", "")
      form.setValue("address4", "")
      form.setValue("pinCode", "")
      form.setValue("phoneNo", "")
      form.setValue("faxNo", "")
      form.setValue("countryId", 0)
    }
  }

  const handleContactSelect = (
    contact: ICustomerContact | ISupplierContact | IBankContact | null
  ) => {
    const customerContact = contact as ICustomerContact | null

    // Update selected contact state
    setSelectedContact(customerContact)

    if (customerContact) {
      // Clear old values first, then set new ones
      form.setValue("contactId", customerContact.contactId, {
        shouldValidate: false,
      })
      form.setValue("contactName", customerContact.contactName || "", {
        shouldValidate: false,
      })
      form.setValue("emailAdd", customerContact.otherName || "", {
        shouldValidate: false,
      })
      form.setValue("mobileNo", customerContact.mobileNo || "", {
        shouldValidate: false,
      })
    } else {
      // Clear all contact fields when contact is cleared
      form.setValue("contactId", 0, { shouldValidate: false })
      form.setValue("contactName", "", { shouldValidate: false })
      form.setValue("emailAdd", "", { shouldValidate: false })
      form.setValue("mobileNo", "", { shouldValidate: false })
    }
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            // console.log("Form submit event triggered")
            form.handleSubmit(
              (data) => {
                // console.log("Form validation passed, calling onSubmit")
                onSubmit(data)
              },
              (errors) => {
                // console.error("Form validation failed:", errors)
                // console.error("Form values:", form.getValues())
                // console.error(
                //   "Form errors details:",
                //   JSON.stringify(errors, null, 2)
                // )

                // Extract error messages from react-hook-form error structure
                const errorMessages: string[] = []

                // Handle react-hook-form error structure: { fieldName: { message: string, type: string } }
                Object.entries(errors).forEach(([fieldName, error]) => {
                  if (error) {
                    // Handle FieldError object with message property
                    if (error.message && typeof error.message === "string") {
                      errorMessages.push(`${fieldName}: ${error.message}`)
                    }
                    // Handle nested errors (for array fields)
                    else if (error.root?.message) {
                      errorMessages.push(`${fieldName}: ${error.root.message}`)
                    }
                    // Fallback for unknown error structure
                    else {
                      errorMessages.push(`${fieldName}: Invalid value`)
                    }
                  }
                })

                if (errorMessages.length > 0) {
                  const errorText =
                    errorMessages.length === 1
                      ? errorMessages[0]
                      : `Validation errors:\n${errorMessages.map((msg) => `• ${msg}`).join("\n")}`

                  // console.log("Showing toast with errors:", errorText)
                  toast.error(errorText, {
                    duration: 5000, // Show for 5 seconds
                  })
                } else {
                  // console.log(
                  //   "No error messages extracted, showing generic error"
                  // )
                  toast.error("Please fill in all required fields")
                }
              }
            )(e)
          }}
          className="space-y-3"
          ref={(ref) => {
            // console.log("Form ref callback called:", ref)
            if (setFormRef) {
              setFormRef(ref)
            }
          }}
        >
          {/* Main Content - Side by Side Layout */}
          <div className="flex gap-4">
            {/* Operation Card - 75% */}
            <div className="w-[75%] rounded-lg border p-4">
              <div className="mb-2 flex">
                <Badge
                  variant="secondary"
                  className="border-blue-200 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm transition-colors duration-200 hover:bg-blue-200"
                >
                  🔧 Operation
                </Badge>
              </div>
              <div className="mb-4 border-b border-gray-200"></div>
              <div className="grid grid-cols-4 gap-2">
                <CustomDateNew
                  form={form}
                  name="jobOrderDate"
                  isFutureShow={true}
                  label="Job Order Date"
                  isRequired={true}
                  isDisabled={isConfirmed}
                />
                <CustomerAutocomplete
                  form={form}
                  name="customerId"
                  label={`Customer${customerCode ? ` (${customerCode})` : ""}`}
                  isRequired={true}
                  isDisabled={isConfirmed}
                  onChangeEvent={handleCustomerChange}
                />

                <PortAutocomplete
                  form={form}
                  name="portId"
                  label="Port"
                  isRequired={true}
                  isDisabled={isConfirmed}
                />

                <CustomInput
                  form={form}
                  name="jobOrderNo"
                  label="Job Order No"
                  isDisabled={isConfirmed}
                />
                <VesselAutocomplete
                  form={form}
                  name="vesselId"
                  label="Vessel"
                  isRequired={true}
                  onChangeEvent={handleVesselChange}
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="imoCode"
                  label="IMO No"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />

                <CustomNumberInput
                  form={form}
                  name="vesselDistance"
                  label="Vessel Distance (NM)"
                  isRequired={true}
                  isDisabled={isConfirmed}
                />
                <PortAutocomplete
                  form={form}
                  name="lastPortId"
                  label="Last Port"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
                <GeoLocationAutocomplete
                  form={form}
                  name="geoLocationId"
                  label="Calling Location"
                  isRequired={false}
                  isDisabled={isConfirmed}
                  onChangeEvent={handleGeoLocationChange}
                />
                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    form={form}
                    name="latitude"
                    label="Latitude"
                    isRequired={false}
                    isDisabled={true}
                  />
                  <CustomInput
                    form={form}
                    name="longitude"
                    label="Longitude"
                    isRequired={false}
                    isDisabled={true}
                  />
                </div>

                <PortAutocomplete
                  form={form}
                  name="nextPortId"
                  label="Next Port"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
                <VoyageAutocomplete
                  form={form}
                  name="voyageId"
                  label="Voyage"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />

                <CustomDateTimePicker
                  form={form}
                  name="etaDate"
                  label="ETA Date"
                  isRequired={false}
                  isDisabled={isConfirmed}
                  isFutureShow={true}
                  onBlurEvent={handleEtaDateBlur}
                />
                <CustomDateTimePicker
                  form={form}
                  name="etdDate"
                  label="ETD Date"
                  isRequired={false}
                  isDisabled={isConfirmed}
                  isFutureShow={true}
                  onBlurEvent={handleEtdDateBlur}
                />
                <CustomDateTimePicker
                  form={form}
                  name="etbDate"
                  label="ETB Date"
                  isRequired={false}
                  isDisabled={isConfirmed}
                  isFutureShow={true}
                />
                <CustomInput
                  form={form}
                  name="ownerName"
                  label="Owner Name"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="ownerAgent"
                  label="Owner Agent"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="masterName"
                  label="Master Name"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="charters"
                  label="Charters"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="chartersAgent"
                  label="Charters Agent"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="natureOfCall"
                  label="Nature of Call"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
                <CustomInput
                  form={form}
                  name="isps"
                  label="ISPS"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
                <JobStatusAutocomplete
                  form={form}
                  name="jobStatusId"
                  label="Job Status"
                  isRequired={true}
                  isDisabled={isConfirmed}
                />
                <div className="col-span-2">
                  <CustomTextarea
                    form={form}
                    name="remarks"
                    label="Remarks"
                    isRequired={false}
                    isDisabled={isConfirmed}
                  />
                </div>
              </div>
            </div>

            {/* Accounts Card - 25% */}
            <div className="w-[25%] rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-green-300 bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 shadow-sm transition-colors duration-200 hover:bg-green-200"
                >
                  💰 Accounts
                </Badge>
                {jobData?.invoiceNo && (
                  <Badge
                    variant="outline"
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm transition-colors hover:bg-blue-100"
                    title="Double-click to open AR Invoice"
                    onDoubleClick={handleInvoiceNoDoubleClick}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleInvoiceNoDoubleClick()
                      }
                    }}
                  >
                    <span className="text-xs">
                      Invoice No: {jobData.invoiceNo}
                    </span>
                  </Badge>
                )}
              </div>
              <div className="mb-4 border-b border-gray-200"></div>
              <div className="grid grid-cols-1 gap-2">
                {/* Currency and Exchange Rate in one row */}
                <div className="grid grid-cols-2 gap-2">
                  <CurrencyAutocomplete
                    form={form}
                    name="currencyId"
                    label="Currency"
                    isRequired={true}
                    // isDisabled={true}
                    onChangeEvent={handleCurrencyChange}
                  />
                  {/* Exchange Rate */}
                  <CustomNumberInput
                    form={form}
                    name="exhRate"
                    label="Exchange Rate"
                    isRequired={true}
                    isDisabled={true}
                    round={exhRateDec}
                    className="text-right"
                  />
                </div>
                <CustomDateNew
                  form={form}
                  name="accountDate"
                  label="Account | Debit Note Date"
                  isDisabled={isConfirmed}
                  isFutureShow={true}
                />
                <CustomDateNew
                  form={form}
                  name="seriesDate"
                  label="Series Date"
                  isFutureShow={true}
                  isDisabled={isConfirmed}
                />

                <DynamicAddressAutocomplete
                  form={form}
                  name="addressId"
                  label="Address"
                  entityId={customerId}
                  entityType={AddressEntityType.CUSTOMER}
                  onChangeEvent={handleAddressSelect}
                  isDisabled={isConfirmed}
                />

                <DynamicContactAutocomplete
                  form={form}
                  name="contactId"
                  label="Contact"
                  entityId={customerId}
                  entityType={ContactEntityType.CUSTOMER}
                  onChangeEvent={handleContactSelect}
                  isDisabled={isConfirmed}
                />

                {/* <AddressAutocomplete
                  form={form}
                  name="addressId"
                  label="Address"
                  isRequired={false}
                  customerId={customerId || 0}
                  isDisabled={isConfirmed}
                />
                <ContactAutocomplete
                  form={form}
                  name="contactId"
                  label="Contact"
                  isRequired={false}
                  customerId={customerId || 0}
                  isDisabled={isConfirmed}
                /> */}

                <div className="grid grid-cols-3 gap-2">
                  <CustomCheckbox
                    form={form}
                    name="isClose"
                    label="Close"
                    isRequired={false}
                    isDisabled={isConfirmed}
                  />
                  <CustomCheckbox
                    form={form}
                    name="isPost"
                    label="Post"
                    isRequired={false}
                    isDisabled={isConfirmed}
                  />
                  <CustomCheckbox
                    form={form}
                    name="isTaxable"
                    label="Taxable"
                    isRequired={false}
                    isDisabled={isConfirmed}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {isTaxable && (
                    <GSTAutocomplete
                      form={form}
                      name="gstId"
                      label="VAT"
                      isRequired={true}
                      isDisabled={isConfirmed}
                    />
                  )}
                  {isTaxable && (
                    <CustomNumberInput
                      form={form}
                      name="gstPercentage"
                      label="VAT Percentage"
                      isRequired={true}
                      isDisabled={isConfirmed}
                    />
                  )}
                </div>
                <CustomCheckbox
                  form={form}
                  name="isActive"
                  label="Active"
                  isRequired={false}
                  isDisabled={isConfirmed}
                />
              </div>
            </div>
          </div>
          <div className="mt-1 mb-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">ℹ️ Note:</span> Updates made here
              will automatically be reflected in invoices when creating invoices
              from this job order.
            </p>
          </div>

          {/* Address and Contact Section */}
          <div className="grid grid-cols-2 gap-2">
            {/* Address Section */}
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex">
                <Badge
                  variant="outline"
                  className="border-purple-200 bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800 shadow-sm transition-colors duration-200 hover:bg-purple-200"
                >
                  📍 Address Details
                </Badge>
              </div>

              <div className="mb-4 border-b border-gray-200"></div>

              <div className="grid gap-2">
                <CustomInput
                  form={form}
                  name="billName"
                  label="Bill Name"
                  isDisabled={!selectedAddress || isConfirmed}
                />
                <div className="grid grid-cols-2 gap-2">
                  <CustomTextarea
                    form={form}
                    name="address1"
                    label="Address Line 1"
                    isDisabled={!selectedAddress || isConfirmed}
                  />
                  <CustomTextarea
                    form={form}
                    name="address2"
                    label="Address Line 2"
                    isDisabled={!selectedAddress || isConfirmed}
                  />
                  <CustomTextarea
                    form={form}
                    name="address3"
                    label="Address Line 3"
                    isDisabled={!selectedAddress || isConfirmed}
                  />
                  <CustomTextarea
                    form={form}
                    name="address4"
                    label="Address Line 4"
                    isDisabled={!selectedAddress || isConfirmed}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <CountryAutocomplete
                    form={form}
                    name="countryId"
                    label="Country"
                    isDisabled={isConfirmed}
                  />
                  <CustomInput
                    form={form}
                    name="pinCode"
                    label="Pin Code"
                    isDisabled={!selectedAddress || isConfirmed}
                  />
                  <CustomInput
                    form={form}
                    name="phoneNo"
                    label="Phone No"
                    isDisabled={!selectedAddress || isConfirmed}
                  />
                  <CustomInput
                    form={form}
                    name="faxNo"
                    label="Fax No"
                    isDisabled={!selectedAddress || isConfirmed}
                  />
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex">
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-800 shadow-sm transition-colors duration-200 hover:bg-indigo-200"
                >
                  👤 Contact Details
                </Badge>
              </div>

              <div className="mb-4 border-b border-gray-200"></div>

              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    form={form}
                    name="contactName"
                    label="Contact Name"
                    isDisabled={!selectedContact || isConfirmed}
                  />
                  <CustomInput
                    form={form}
                    name="emailAdd"
                    label="Email"
                    isDisabled={!selectedContact || isConfirmed}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    form={form}
                    name="mobileNo"
                    label="Mobile No"
                    isDisabled={!selectedContact || isConfirmed}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
