"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { setExchangeRate_JobOrder } from "@/helpers/account"
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
import { JobOrderHdSchema, JobOrderHdSchemaType } from "@/schemas"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parse } from "date-fns"
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
import { useSaveJobOrder } from "@/hooks/use-checklist"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import {
  CountryAutocomplete,
  CurrencyAutocomplete,
  CustomerAutocomplete,
  DynamicVesselAutocomplete,
  GSTAutocomplete,
  GeoLocationAutocomplete,
  JobStatusAutocomplete,
  PortAutocomplete,
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

export default function NewChecklistPage() {
  const { decimals } = useCompanyStore()
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string

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

  // Use the useSaveJobOrder hook
  const saveJobOrderMutation = useSaveJobOrder()

  // State to track customer code for label display
  const [customerCode, setCustomerCode] = useState<string>("")

  // State for address and contact
  const [selectedAddress, setSelectedAddress] =
    useState<ICustomerAddress | null>(null)
  const [selectedContact, setSelectedContact] =
    useState<ICustomerContact | null>(null)

  const form = useForm<JobOrderHdSchemaType>({
    resolver: zodResolver(JobOrderHdSchema),
    defaultValues: {
      jobOrderId: 0,
      jobOrderNo: "",
      jobOrderDate: format(new Date(), dateFormat),
      imoCode: "",
      vesselDistance: 10,
      portId: 0,
      customerId: 0,
      currencyId: 0,
      exhRate: 0,
      vesselId: 0,
      voyageId: 0,
      geoLocationId: 0,
      latitude: "",
      longitude: "",
      lastPortId: 0,
      nextPortId: 0,
      etaDate: undefined,
      etdDate: undefined,
      etbDate: undefined,
      ownerName: "",
      ownerAgent: "",
      masterName: "",
      charters: "",
      chartersAgent: "",
      accountDate: format(new Date(), dateFormat), // Set to current date as string for new records
      seriesDate: format(new Date(), dateFormat), // Set to current date as string for new records
      addressId: 0,
      contactId: 0,
      billName: "",
      address1: "",
      address2: "",
      address3: "",
      address4: "",
      pinCode: "",
      countryId: 0,
      phoneNo: "",
      faxNo: "",
      contactName: "",
      mobileNo: "",
      emailAdd: "",
      natureOfCall: "",
      isps: "",
      isTaxable: false,
      isClose: false,
      isPost: false,
      isActive: true,
      remarks: "",
      jobStatusId: 1,
      gstId: 0,
      gstPercentage: 0,
      editVersion: 0,
    },
  })

  // Watch isTaxable to conditionally show GST field
  const isTaxable = form.watch("isTaxable")

  // Watch customerId to reset address and contact when customer changes
  const customerId = form.watch("customerId")

  // Watch jobOrderDate to update accountDate
  const jobOrderDate = form.watch("jobOrderDate")

  // Watch accountDate to update exchange rate
  const accountDate = form.watch("accountDate")

  // Watch currencyId to update exchange rate
  const currencyId = form.watch("currencyId")

  // Watch gstId to fetch GST percentage
  const gstId = form.watch("gstId")

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

  // Reset address and contact when customer changes
  useEffect(() => {
    const currentAddressId = form.getValues("addressId")
    const currentContactId = form.getValues("contactId")

    // Reset address and contact when customer changes (for new form)
    if (customerId && (currentAddressId || currentContactId)) {
      form.setValue("addressId", 0)
      form.setValue("contactId", 0)
      toast.info("Address and contact have been reset for the new customer.")
    }
  }, [customerId, form])

  // Update accountDate when jobOrderDate changes
  useEffect(() => {
    if (jobOrderDate) {
      // Ensure accountDate is set as string
      const accountDateStr =
        typeof jobOrderDate === "string"
          ? jobOrderDate
          : format(jobOrderDate, dateFormat)
      form.setValue("accountDate", accountDateStr)
    }
  }, [dateFormat, form, jobOrderDate])

  // Update exchange rate when accountDate or currencyId changes
  useEffect(() => {
    const updateExchangeRate = async () => {
      if (accountDate && currencyId) {
        try {
          // Format date to yyyy-MM-dd (matching account.ts pattern)
          // accountDate is always a string in clientDateFormat
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
        } catch (error) {
          console.error("Error fetching exchange rate:", error)
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

  // Handle currency selection
  const handleCurrencyChange = useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      const selectedCurrencyId = selectedCurrency?.currencyId || 0
      const accountDate =
        form.getValues("accountDate") || form.getValues("jobOrderDate")

      if (selectedCurrencyId && accountDate) {
        // Format date to yyyy-MM-dd (matching account.ts pattern)
        // accountDate is always a string in clientDateFormat
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
  const handleCustomerChange = useCallback(
    async (selectedCustomer: ICustomerLookup | null) => {
      if (selectedCustomer) {
        // Reset address and contact when customer changes
        form.setValue("addressId", 0)
        form.setValue("contactId", 0)
        form.setValue("currencyId", selectedCustomer.currencyId || 0)

        // Store customer code for label display
        if (selectedCustomer.customerCode) {
          setCustomerCode(selectedCustomer.customerCode)
        } else {
          setCustomerCode("")
        }

        // Set exchange rate using the job order specific function
        await setExchangeRate_JobOrder(form, exhRateDec)

        toast.info("Address and contact have been reset for the new customer.")
      } else {
        // Clear fields when customer is cleared
        form.setValue("addressId", 0)
        form.setValue("contactId", 0)
        form.setValue("currencyId", 0)
        setCustomerCode("")
        form.setValue("exhRate", 0)
      }
    },
    [form, exhRateDec]
  )

  // Handle vessel selection
  const handleVesselChange = useCallback(
    (selectedVessel: IVesselLookup | null) => {
      if (selectedVessel) {
        // Populate IMO code when vessel changes
        if (selectedVessel.imoCode) {
          form.setValue("imoCode", selectedVessel.imoCode)
          toast.info(`IMO code has been populated: ${selectedVessel.imoCode}`)
        } else {
          form.setValue("imoCode", "")
          toast.info("Selected vessel has no IMO code")
        }
      } else {
        // Clear IMO code when vessel is cleared
        form.setValue("imoCode", "")
      }
    },
    [form]
  )

  // Handle geo location selection
  const handleGeoLocationChange = useCallback(
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

  // Handle address selection
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
    },
    [form]
  )

  // Handle contact selection
  const handleContactSelect = useCallback(
    (contact: ICustomerContact | ISupplierContact | IBankContact | null) => {
      const customerContact = contact as ICustomerContact | null
      setSelectedContact(customerContact)
      if (customerContact) {
        form.setValue("contactId", customerContact.contactId)
        form.setValue("contactName", customerContact.contactName || "")
        form.setValue("mobileNo", customerContact.mobileNo || "")
        form.setValue("emailAdd", customerContact.otherName || "")
      } else {
        form.setValue("contactId", 0)
        form.setValue("contactName", "")
        form.setValue("mobileNo", "")
        form.setValue("emailAdd", "")
      }
    },
    [form]
  )

  // Handle form submission
  const onSubmit = async (values: JobOrderHdSchemaType) => {
    console.log("onSubmit:", values)
    try {
      // Validate etaDate < etdDate before submission (with time)
      if (values.etaDate && values.etdDate) {
        const eta =
          values.etaDate instanceof Date
            ? values.etaDate
            : new Date(values.etaDate)
        const etd =
          values.etdDate instanceof Date
            ? values.etdDate
            : new Date(values.etdDate)

        // Compare dates with time (full timestamp comparison)
        // ETD must be greater than ETA (invalid if ETA >= ETD)
        if (eta >= etd) {
          toast.error("ETD Date must be greater than ETA Date (with time)")
          return
        }
      }

      // Format dates for API submission
      // Date-only fields: use formatDateForApi to format as yyyy-MM-dd
      // DateTime fields: use formatDateTimeForApi to format as yyyy-MM-ddTHH:mm:ss.SSS
      const formData: Partial<IJobOrderHd> = {
        ...values,
        // Date-only fields: format to yyyy-MM-dd using formatDateForApi
        jobOrderDate: formatDateForApi(values.jobOrderDate) || "",
        accountDate: formatDateForApi(values.accountDate) || "",
        seriesDate: formatDateForApi(values.seriesDate) || "",
        // DateTime fields: format with time using formatDateTimeForApi
        // Convert null to undefined to match IJobOrderHd interface (Date | string | undefined, not null)
        etaDate: formatDateTimeForApi(values.etaDate),
        etdDate: formatDateTimeForApi(values.etdDate),
        etbDate: formatDateTimeForApi(values.etbDate),
      }

      const response = await saveJobOrderMutation.mutateAsync(
        formData as JobOrderHdSchemaType
      )

      if (response.result === 1) {
        // Extract job order data from response (handle array or object)
        const jobOrderData = Array.isArray(response.data)
          ? response.data[0]
          : response.data

        // Get jobOrderId from response data
        const jobOrderId = (jobOrderData as IJobOrderHd)?.jobOrderId

        toast.success(response.message || "Job order created successfully!")

        // Redirect to the new job order page
        if (jobOrderId) {
          router.push(`/${companyId}/operations/checklist/${jobOrderId}`)
        } else {
          // Fallback: redirect to main checklist page
          router.push(`/${companyId}/operations/checklist`)
        }
      } else {
        toast.error(response.message || "Failed to create job order")
      }
    } catch {
      toast.error("Failed to save job order. Please try again.")
    }
  }

  // Handle reset form
  const handleReset = () => {
    form.reset()
    toast.info("Form has been reset")
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-8 sm:pt-3 sm:pb-6 lg:px-12">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <span className="text-lg">📋</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create New Checklist
            </h1>
            <p className="text-muted-foreground text-sm">
              Fill in the details to create a new checklist
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button
            type="submit"
            form="job-order-form"
            disabled={saveJobOrderMutation.isPending}
          >
            {saveJobOrderMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Form Section */}
      <div>
        <Form {...form}>
          <form
            id="job-order-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Main Content - Side by Side Layout */}
            <div className="flex gap-4">
              {/* Operation Card - 70% */}
              <div className="w-[75%] rounded-lg border p-4">
                <div className="mb-2 flex">
                  <Badge
                    variant="secondary"
                    className="border-border bg-blue-100 px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-colors duration-200 hover:bg-blue-200"
                  >
                    🔧 Operation
                  </Badge>
                </div>
                <div className="mb-4 border-b border-gray-200"></div>
                <div className="grid grid-cols-4 gap-2">
                  <CustomDateNew
                    form={form}
                    name="jobOrderDate"
                    label="Job Order Date"
                    isRequired={true}
                    isFutureShow={true}
                  />
                  <CustomerAutocomplete
                    form={form}
                    name="customerId"
                    label={`Customer${customerCode ? ` (${customerCode})` : ""}`}
                    isRequired={true}
                    onChangeEvent={handleCustomerChange}
                  />

                  <PortAutocomplete
                    form={form}
                    name="portId"
                    label="Port"
                    isRequired={true}
                  />

                  <CustomInput
                    form={form}
                    name="jobOrderNo"
                    label="Job Order No"
                    isDisabled={true}
                  />
                  <DynamicVesselAutocomplete
                    form={form}
                    name="vesselId"
                    label="Vessel"
                    isRequired={true}
                    onChangeEvent={handleVesselChange}
                  />
                  <CustomInput
                    form={form}
                    name="imoCode"
                    label="IMO No"
                    isRequired={false}
                  />

                  <CustomNumberInput
                    form={form}
                    name="vesselDistance"
                    label="Vessel Distance (NM)"
                    isRequired={true}
                  />
                  <PortAutocomplete
                    form={form}
                    name="lastPortId"
                    label="Last Port"
                    isRequired={false}
                  />
                  <GeoLocationAutocomplete
                    form={form}
                    name="geoLocationId"
                    label="Calling Location"
                    isRequired={false}
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
                  />
                  <VoyageAutocomplete
                    form={form}
                    name="voyageId"
                    label="Voyage"
                    isRequired={false}
                  />

                  <CustomDateTimePicker
                    form={form}
                    name="etaDate"
                    label="ETA Date"
                    isRequired={false}
                    isFutureShow={true}
                    onBlurEvent={handleEtaDateBlur}
                  />
                  <CustomDateTimePicker
                    form={form}
                    name="etdDate"
                    label="ETD Date"
                    isRequired={false}
                    isFutureShow={true}
                    onBlurEvent={handleEtdDateBlur}
                  />
                  <CustomDateTimePicker
                    form={form}
                    name="etbDate"
                    label="ETB Date"
                    isRequired={false}
                    isFutureShow={true}
                  />
                  <CustomInput
                    form={form}
                    name="ownerName"
                    label="Owner Name"
                    isRequired={false}
                  />
                  <CustomInput
                    form={form}
                    name="ownerAgent"
                    label="Owner Agent"
                    isRequired={false}
                  />
                  <CustomInput
                    form={form}
                    name="masterName"
                    label="Master Name"
                    isRequired={false}
                  />
                  <CustomInput
                    form={form}
                    name="charters"
                    label="Charters"
                    isRequired={false}
                  />
                  <CustomInput
                    form={form}
                    name="chartersAgent"
                    label="Charters Agent"
                    isRequired={false}
                  />
                  <CustomInput
                    form={form}
                    name="natureOfCall"
                    label="Nature of Call"
                    isRequired={false}
                  />
                  <CustomInput
                    form={form}
                    name="isps"
                    label="ISPS"
                    isRequired={false}
                  />
                  <JobStatusAutocomplete
                    form={form}
                    name="jobStatusId"
                    label="Job Status"
                    isRequired={true}
                  />
                  <div className="col-span-2">
                    <CustomTextarea
                      form={form}
                      name="remarks"
                      label="Remarks"
                      isRequired={false}
                    />
                  </div>
                </div>
              </div>

              {/* Accounts Card - 30% */}
              <div className="w-[25%] rounded-lg border p-4">
                <div className="mb-2 flex">
                  <Badge
                    variant="outline"
                    className="border-green-300 bg-green-100 inline-flex h-9 min-h-9 items-center px-3 py-0 text-xs font-semibold text-green-800 shadow-sm transition-colors duration-200 hover:bg-green-200"
                  >
                    💰 Accounts
                  </Badge>
                </div>
                <div className="mb-4 border-b border-gray-200"></div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <CurrencyAutocomplete
                      form={form}
                      name="currencyId"
                      label="Currency"
                      isRequired={true}
                      isDisabled={true}
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
                    isFutureShow={true}
                  />
                  <CustomDateNew
                    form={form}
                    name="seriesDate"
                    label="Series Date"
                    isFutureShow={true}
                  />

                  <DynamicAddressAutocomplete
                    form={form}
                    name="addressId"
                    label="Address"
                    entityId={customerId}
                    entityType={AddressEntityType.CUSTOMER}
                    onChangeEvent={handleAddressSelect}
                  />

                  <DynamicContactAutocomplete
                    form={form}
                    name="contactId"
                    label="Contact"
                    entityId={customerId}
                    entityType={ContactEntityType.CUSTOMER}
                    onChangeEvent={handleContactSelect}
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <CustomCheckbox
                      form={form}
                      name="isClose"
                      label="Close"
                      isRequired={false}
                    />
                    <CustomCheckbox
                      form={form}
                      name="isPost"
                      label="Post"
                      isRequired={false}
                    />
                    <CustomCheckbox
                      form={form}
                      name="isTaxable"
                      label="Taxable"
                      isRequired={false}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                  {isTaxable && (
                    <GSTAutocomplete
                      form={form}
                      name="gstId"
                      label="VAT"
                      isRequired={true}
                    />
                  )}
                  {isTaxable && (
                    <CustomNumberInput
                      form={form}
                      name="gstPercentage"
                      label="VAT Percentage"
                      isRequired={true}
                    />
                  )}
                  </div>
                  <CustomCheckbox
                    form={form}
                    name="isActive"
                    label="Active"
                    isRequired={false}
                  />
                </div>
              </div>
            </div>

            {/* Address and Contact Section */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              {/* Address Section */}
              <Card className="border-0">
                <CardContent>
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
                      isDisabled={!selectedAddress}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <CustomTextarea
                        form={form}
                        name="address1"
                        label="Address Line 1"
                        isDisabled={!selectedAddress}
                      />
                      <CustomTextarea
                        form={form}
                        name="address2"
                        label="Address Line 2"
                        isDisabled={!selectedAddress}
                      />
                      <CustomTextarea
                        form={form}
                        name="address3"
                        label="Address Line 3"
                        isDisabled={!selectedAddress}
                      />
                      <CustomTextarea
                        form={form}
                        name="address4"
                        label="Address Line 4"
                        isDisabled={!selectedAddress}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <CountryAutocomplete
                        form={form}
                        name="countryId"
                        label="Country"
                      />
                      <CustomInput
                        form={form}
                        name="pinCode"
                        label="Pin Code"
                        isDisabled={!selectedAddress}
                      />
                      <CustomInput
                        form={form}
                        name="phoneNo"
                        label="Phone No"
                        isDisabled={!selectedAddress}
                      />
                      <CustomInput
                        form={form}
                        name="faxNo"
                        label="Fax No"
                        isDisabled={!selectedAddress}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Section */}
              <Card className="border-0">
                <CardContent>
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
                        isDisabled={!selectedContact}
                      />
                      <CustomInput
                        form={form}
                        name="emailAdd"
                        label="Email"
                        isDisabled={!selectedContact}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <CustomInput
                        form={form}
                        name="mobileNo"
                        label="Mobile No"
                        isDisabled={!selectedContact}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
