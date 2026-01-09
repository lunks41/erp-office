"use client"

import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  handleGstPercentageChange,
  handleTotalamountChange,
  setGSTPercentage,
} from "@/helpers/account"
import {
  calculateGstLocalAndCtyAmounts,
  recalculateDetailFormAmounts,
  syncCountryExchangeRate,
} from "@/helpers/cb-pettycash-calculations"
import { ICbPettyCashDt } from "@/interfaces"
import {
  IBargeLookup,
  IChartOfAccountLookup,
  IDepartmentLookup,
  IEmployeeLookup,
  IGstLookup,
  IJobOrderLookup,
  IPortLookup,
  IServiceCategoryLookup,
  IServiceItemNoLookup,
  ITaskLookup,
  IVesselLookup,
  IVoyageLookup,
} from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  CbPettyCashDtSchema,
  CbPettyCashDtSchemaType,
  CbPettyCashHdSchemaType,
} from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { FormProvider, UseFormReturn, useForm } from "react-hook-form"
import { toast } from "sonner"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import {
  useChartOfAccountLookup,
  useGetDynamicLookup,
  useGstLookup,
} from "@/hooks/use-lookup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BargeAutocomplete,
  ChartOfAccountAutocomplete,
  DepartmentAutocomplete,
  DynamicJobOrderAutocomplete,
  EmployeeAutocomplete,
  GSTAutocomplete,
  JobOrderAutocomplete,
  JobOrderServiceAutocomplete,
  JobOrderTaskAutocomplete,
  PortAutocomplete,
  ServiceCategoryAutocomplete,
  VesselAutocomplete,
  VoyageAutocomplete,
} from "@/components/autocomplete"
import { DuplicateConfirmation } from "@/components/confirmation/duplicate-confirmation"
import { CustomDateNew, CustomInput } from "@/components/custom"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

import { getDefaultValues } from "./cbpettycash-defaultvalues"

export interface CbPettyCashDetailsFormRef {
  recalculateAmounts: (
    exchangeRate?: number,
    countryExchangeRate?: number
  ) => void
}

interface CbPettyCashDetailsFormProps {
  Hdform: UseFormReturn<CbPettyCashHdSchemaType>
  onAddRowAction?: (rowData: ICbPettyCashDt) => void
  onCancelEdit?: () => void
  editingDetail?: CbPettyCashDtSchemaType | null
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  existingDetails?: CbPettyCashDtSchemaType[]
  defaultGlId?: number
  defaultGstId?: number
  isCancelled?: boolean
}

const CbPettyCashDetailsForm = React.forwardRef<
  CbPettyCashDetailsFormRef,
  CbPettyCashDetailsFormProps
>(
  (
    {
      Hdform,
      onAddRowAction,
      onCancelEdit: _onCancelEdit,
      editingDetail,
      visible,
      required,
      companyId,
      existingDetails = [],
      defaultGlId = 0,
      defaultGstId = 0,
      isCancelled = false,
    },
    ref
  ) => {
    const { decimals } = useAuthStore()
    const amtDec = decimals?.[0]?.amtDec || 2
    const locAmtDec = decimals?.[0]?.locAmtDec || 2
    const dateFormat = useMemo(
      () => decimals?.[0]?.dateFormat || clientDateFormat,
      [decimals]
    )
    const defaultCbPettyCashDetails = useMemo(
      () => getDefaultValues(dateFormat).defaultCbPettyCashDetails,
      [dateFormat]
    )

    // State for duplicate confirmation dialog
    const [showDuplicateConfirmation, setShowDuplicateConfirmation] =
      useState(false)
    const [pendingSubmitData, setPendingSubmitData] =
      useState<CbPettyCashDtSchemaType | null>(null)

    // Track if submit was attempted to show errors only after submit
    const [submitAttempted, setSubmitAttempted] = useState(false)

    // Refs to store original values on focus for comparison on change
    const originalTotAmtRef = useRef<number>(0)
    const originalGstPercentageRef = useRef<number>(0)

    // Store exchange rates when detail is loaded for editing
    // This allows us to check if exchange rate changed and only recalculate if needed
    const exchangeRateWhenLoadedRef = useRef<number>(0)
    const countryExchangeRateWhenLoadedRef = useRef<number>(0)

    // Calculate next itemNo based on existing details
    const getNextItemNo = () => {
      if (existingDetails.length === 0) return 1
      const maxItemNo = Math.max(...existingDetails.map((d) => d.itemNo || 0))
      return maxItemNo + 1
    }

    // Factory function to create default values with dynamic itemNo and defaults
    const createDefaultValues = (itemNo: number): CbPettyCashDtSchemaType => {
      // Use defaults if available, otherwise use defaultCbPettyCashDetails values
      const glId =
        defaultGlId && defaultGlId > 0
          ? defaultGlId
          : defaultCbPettyCashDetails.glId
      const gstId =
        defaultGstId && defaultGstId > 0
          ? defaultGstId
          : defaultCbPettyCashDetails.gstId

      // Get account date from header form, fallback to current date
      const accountDate = Hdform.getValues("accountDate")
      let invoiceDate: string

      try {
        if (accountDate) {
          if (typeof accountDate === "string" && accountDate.trim()) {
            // If it's already a string, try to parse it to ensure it's valid
            const parsed = parseDate(accountDate)
            if (parsed && !isNaN(parsed.getTime())) {
              invoiceDate = format(parsed, dateFormat)
            } else {
              // If parsing fails, use current date
              const now = new Date()
              if (!isNaN(now.getTime())) {
                invoiceDate = format(now, dateFormat)
              } else {
                invoiceDate = clientDateFormat // Fallback to default format string
              }
            }
          } else if (
            accountDate instanceof Date &&
            !isNaN(accountDate.getTime())
          ) {
            invoiceDate = format(accountDate, dateFormat)
          } else {
            const now = new Date()
            if (!isNaN(now.getTime())) {
              invoiceDate = format(now, dateFormat)
            } else {
              invoiceDate = clientDateFormat // Fallback to default format string
            }
          }
        } else {
          const now = new Date()
          if (!isNaN(now.getTime())) {
            invoiceDate = format(now, dateFormat)
          } else {
            invoiceDate = clientDateFormat // Fallback to default format string
          }
        }
      } catch (error) {
        console.error(
          "Error formatting invoiceDate in createDefaultValues:",
          error
        )
        // Ultimate fallback - use current date string in client format
        try {
          invoiceDate = format(new Date(), dateFormat)
        } catch {
          invoiceDate = clientDateFormat
        }
      }

      return {
        ...defaultCbPettyCashDetails,
        itemNo,
        seqNo: itemNo,
        glId,
        gstId,
        invoiceDate,
      }
    }

    const form = useForm<CbPettyCashDtSchemaType>({
      resolver: zodResolver(CbPettyCashDtSchema(required, visible)),
      mode: "onSubmit",
      reValidateMode: "onChange",
      defaultValues: editingDetail
        ? {
            paymentId: editingDetail.paymentId ?? "0",
            paymentNo: editingDetail.paymentNo ?? "",
            itemNo: editingDetail.itemNo ?? getNextItemNo(),
            seqNo: editingDetail.seqNo ?? getNextItemNo(),
            invoiceDate: (() => {
              // Validate and format invoiceDate from editingDetail
              if (editingDetail.invoiceDate) {
                if (typeof editingDetail.invoiceDate === "string") {
                  const parsed = parseDate(editingDetail.invoiceDate)
                  if (parsed && !isNaN(parsed.getTime())) {
                    return format(parsed, dateFormat)
                  }
                } else if (
                  editingDetail.invoiceDate instanceof Date &&
                  !isNaN(editingDetail.invoiceDate.getTime())
                ) {
                  return format(editingDetail.invoiceDate, dateFormat)
                }
              }
              return format(new Date(), dateFormat)
            })(),
            invoiceNo: editingDetail.invoiceNo ?? "",
            supplierName: editingDetail.supplierName ?? "",
            supplierRegNo: editingDetail.supplierRegNo ?? "",
            serviceCategoryId: editingDetail.serviceCategoryId ?? 0,
            serviceCategoryName: editingDetail.serviceCategoryName ?? "",
            glId: editingDetail.glId ?? 0,
            glCode: editingDetail.glCode ?? "",
            glName: editingDetail.glName ?? "",
            totAmt: editingDetail.totAmt ?? 0,
            totLocalAmt: editingDetail.totLocalAmt ?? 0,
            totCtyAmt: editingDetail.totCtyAmt ?? 0,
            remarks: editingDetail.remarks ?? "",
            gstId: editingDetail.gstId ?? 0,
            gstName: editingDetail.gstName ?? "",
            gstPercentage: editingDetail.gstPercentage ?? 0,
            gstAmt: editingDetail.gstAmt ?? 0,
            gstLocalAmt: editingDetail.gstLocalAmt ?? 0,
            gstCtyAmt: editingDetail.gstCtyAmt ?? 0,
            departmentId: editingDetail.departmentId ?? 0,
            departmentCode: editingDetail.departmentCode ?? "",
            departmentName: editingDetail.departmentName ?? "",
            employeeId: editingDetail.employeeId ?? 0,
            employeeCode: editingDetail.employeeCode ?? "",
            employeeName: editingDetail.employeeName ?? "",
            portId: editingDetail.portId ?? 0,
            portCode: editingDetail.portCode ?? "",
            portName: editingDetail.portName ?? "",
            vesselId: editingDetail.vesselId ?? 0,
            vesselCode: editingDetail.vesselCode ?? "",
            vesselName: editingDetail.vesselName ?? "",
            bargeId: editingDetail.bargeId ?? 0,
            bargeCode: editingDetail.bargeCode ?? "",
            bargeName: editingDetail.bargeName ?? "",
            voyageId: editingDetail.voyageId ?? 0,
            voyageNo: editingDetail.voyageNo ?? "",
            jobOrderId: editingDetail.jobOrderId ?? 0,
            jobOrderNo: editingDetail.jobOrderNo ?? "",
            taskId: editingDetail.taskId ?? 0,
            taskName: editingDetail.taskName ?? "",
            serviceItemNo: editingDetail.serviceItemNo ?? 0,
            serviceItemNoName: editingDetail.serviceItemNoName ?? "",
            editVersion: editingDetail.editVersion ?? 0,
          }
        : createDefaultValues(getNextItemNo()),
    })

    // Fetch lookup data for autocomplete fields
    const { data: chartOfAccounts } = useChartOfAccountLookup(companyId)
    const { data: gsts } = useGstLookup()
    const { data: dynamicLookup } = useGetDynamicLookup()
    const isDynamicLookup = dynamicLookup?.isJobOrder ?? false

    // State to manage job-specific vs department-specific rendering
    const [isJobSpecific, setIsJobSpecific] = useState(false)

    // Function to populate code/name fields from lookup data
    const populateCodeNameFields = (
      formData: CbPettyCashDtSchemaType
    ): CbPettyCashDtSchemaType => {
      const populatedData = { ...formData }

      // Populate GL code/name if glId is set
      if (populatedData.glId && populatedData.glId > 0) {
        const glData = chartOfAccounts?.find(
          (gl: IChartOfAccountLookup) => gl.glId === populatedData.glId
        )
        if (glData) {
          populatedData.glCode = glData.glCode || ""
          populatedData.glName = glData.glName || ""
        }
      }

      // Populate GST name if gstId is set
      if (populatedData.gstId && populatedData.gstId > 0) {
        const gstData = gsts?.find(
          (gst: IGstLookup) => gst.gstId === populatedData.gstId
        )
        if (gstData) {
          populatedData.gstName = gstData.gstName || ""
        }
      }

      return populatedData
    }

    // Function to focus on the first visible field after form operations
    const focusFirstVisibleField = () => {
      setTimeout(() => {
        const seqNoInput = document.getElementById("seqNo") as HTMLInputElement
        if (seqNoInput) {
          seqNoInput.focus()
          seqNoInput.select()
        }
      }, 300)
    }

    // Handler for cancel edit
    const handleCancelEdit = () => {
      _onCancelEdit?.()
      const nextItemNo = getNextItemNo()
      const defaultValues = createDefaultValues(nextItemNo)
      const populatedValues = populateCodeNameFields(defaultValues)
      form.reset(populatedValues)
      // Reset submit attempted flag when canceling
      setSubmitAttempted(false)
      toast.info("Detail cancelled")
      focusFirstVisibleField()
    }

    // Function to recalculate local amounts when exchange rate changes
    // This is called during form validation/submission and from handleExchangeRateBlur
    // Uses reusable helper function from cb-payment-calculations
    const recalculateAmountsOnExchangeRateChange = (
      exchangeRate?: number,
      countryExchangeRate?: number
    ) => {
      recalculateDetailFormAmounts(
        form,
        Hdform,
        decimals?.[0] || {},
        visible,
        exchangeRate,
        countryExchangeRate
      )
    }

    // Expose recalculation function via ref so it can be called from parent
    useImperativeHandle(ref, () => ({
      recalculateAmounts: recalculateAmountsOnExchangeRateChange,
    }))

    // Apply default IDs when they become available (only for new records)
    useEffect(() => {
      if (editingDetail) return // Skip for edit mode

      // Wait a bit to ensure form is reset before applying defaults
      const timeoutId = setTimeout(() => {
        const currentGlId = form.getValues("glId")
        const currentGstId = form.getValues("gstId")

        // Set default GL ID if not already set
        if (
          defaultGlId &&
          defaultGlId > 0 &&
          (!currentGlId || currentGlId === 0)
        ) {
          form.setValue("glId", defaultGlId, { shouldValidate: false })
        }

        // Set default GST ID if not already set
        if (
          defaultGstId &&
          defaultGstId > 0 &&
          (!currentGstId || currentGstId === 0)
        ) {
          form.setValue("gstId", defaultGstId, { shouldValidate: false })
        }
      }, 100)

      return () => clearTimeout(timeoutId)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultGlId, defaultGstId, editingDetail, existingDetails.length])

    // Populate code/name fields when defaults are applied (only for new records)
    useEffect(() => {
      if (editingDetail) return // Skip for edit mode

      const currentGlId = form.getValues("glId")
      const currentGstId = form.getValues("gstId")

      // Populate GL code/name if glId is set and code/name are empty
      if (currentGlId && currentGlId > 0 && !form.getValues("glCode")) {
        const glData = chartOfAccounts?.find(
          (gl: IChartOfAccountLookup) => gl.glId === currentGlId
        )
        if (glData) {
          form.setValue("glCode", glData.glCode || "")
          form.setValue("glName", glData.glName || "")
        }
      }

      // Populate GST name if gstId is set and name is empty
      if (currentGstId && currentGstId > 0 && !form.getValues("gstName")) {
        const gstData = gsts?.find(
          (gst: IGstLookup) => gst.gstId === currentGstId
        )
        if (gstData) {
          form.setValue("gstName", gstData.gstName || "")
          // Trigger GST percentage calculation after setting default GST
          setGSTPercentage(Hdform, form, decimals?.[0] || {}, visible)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartOfAccounts, gsts, editingDetail, defaultGlId, defaultGstId])

    // Watch glId to detect changes
    const watchedGlId = form.watch("glId")

    // Set isJobSpecific based on chart of account when editing detail is loaded or glId changes
    useEffect(() => {
      if (editingDetail && editingDetail.glId && editingDetail.glId > 0) {
        const glData = chartOfAccounts?.find(
          (gl: IChartOfAccountLookup) => gl.glId === editingDetail.glId
        )
        if (glData) {
          setIsJobSpecific(glData.isJobSpecific || false)
        }
      } else if (watchedGlId && watchedGlId > 0 && chartOfAccounts) {
        const glData = chartOfAccounts?.find(
          (gl: IChartOfAccountLookup) => gl.glId === watchedGlId
        )
        if (glData) {
          setIsJobSpecific(glData.isJobSpecific || false)
        }
      }
    }, [editingDetail, chartOfAccounts, watchedGlId])

    // Reset form when editingDetail changes
    useEffect(() => {
      const nextItemNo =
        existingDetails.length === 0
          ? 1
          : Math.max(...existingDetails.map((d) => d.itemNo || 0)) + 1

      if (editingDetail) {
        // Store exchange rates when detail is loaded for editing
        // This allows us to check if exchange rate changed and only recalculate if needed
        exchangeRateWhenLoadedRef.current = Hdform.getValues("exhRate") || 0
        countryExchangeRateWhenLoadedRef.current =
          Hdform.getValues("ctyExhRate") || 0

        // Determine if editing detail is job-specific or department-specific
        form.reset({
          paymentId: editingDetail.paymentId ?? "0",
          paymentNo: editingDetail.paymentNo ?? "",
          itemNo: editingDetail.itemNo ?? nextItemNo,
          seqNo: editingDetail.seqNo ?? nextItemNo,
          invoiceDate: (() => {
            // Validate and format invoiceDate from editingDetail
            if (editingDetail.invoiceDate) {
              if (typeof editingDetail.invoiceDate === "string") {
                const parsed = parseDate(editingDetail.invoiceDate)
                if (parsed && !isNaN(parsed.getTime())) {
                  return format(parsed, dateFormat)
                }
              } else if (
                editingDetail.invoiceDate instanceof Date &&
                !isNaN(editingDetail.invoiceDate.getTime())
              ) {
                return format(editingDetail.invoiceDate, dateFormat)
              }
            }
            return format(new Date(), dateFormat)
          })(),
          invoiceNo: editingDetail.invoiceNo ?? "",
          supplierName: editingDetail.supplierName ?? "",
          supplierRegNo: editingDetail.supplierRegNo ?? "",
          serviceCategoryId: editingDetail.serviceCategoryId ?? 0,
          serviceCategoryName: editingDetail.serviceCategoryName ?? "",
          glId: editingDetail.glId ?? 0,
          glCode: editingDetail.glCode ?? "",
          glName: editingDetail.glName ?? "",
          totAmt: editingDetail.totAmt ?? 0,
          totLocalAmt: editingDetail.totLocalAmt ?? 0,
          totCtyAmt: editingDetail.totCtyAmt ?? 0,
          remarks: editingDetail.remarks ?? "",
          gstId: editingDetail.gstId ?? 0,
          gstName: editingDetail.gstName ?? "",
          gstPercentage: editingDetail.gstPercentage ?? 0,
          gstAmt: editingDetail.gstAmt ?? 0,
          gstLocalAmt: editingDetail.gstLocalAmt ?? 0,
          gstCtyAmt: editingDetail.gstCtyAmt ?? 0,
          departmentId: editingDetail.departmentId ?? 0,
          departmentCode: editingDetail.departmentCode ?? "",
          departmentName: editingDetail.departmentName ?? "",
          employeeId: editingDetail.employeeId ?? 0,
          employeeCode: editingDetail.employeeCode ?? "",
          employeeName: editingDetail.employeeName ?? "",
          portId: editingDetail.portId ?? 0,
          portCode: editingDetail.portCode ?? "",
          portName: editingDetail.portName ?? "",
          vesselId: editingDetail.vesselId ?? 0,
          vesselCode: editingDetail.vesselCode ?? "",
          vesselName: editingDetail.vesselName ?? "",
          bargeId: editingDetail.bargeId ?? 0,
          bargeCode: editingDetail.bargeCode ?? "",
          bargeName: editingDetail.bargeName ?? "",
          voyageId: editingDetail.voyageId ?? 0,
          voyageNo: editingDetail.voyageNo ?? "",
          jobOrderId: editingDetail.jobOrderId ?? 0,
          jobOrderNo: editingDetail.jobOrderNo ?? "",
          taskId: editingDetail.taskId ?? 0,
          taskName: editingDetail.taskName ?? "",
          serviceItemNo: editingDetail.serviceItemNo ?? 0,
          serviceItemNoName: editingDetail.serviceItemNoName ?? "",
          editVersion: editingDetail.editVersion ?? 0,
        })
      } else {
        // New record - reset to defaults with proper default values
        const defaultValues = createDefaultValues(nextItemNo)
        form.reset(defaultValues)

        // Store current exchange rates for new record
        exchangeRateWhenLoadedRef.current = Hdform.getValues("exhRate") || 0
        countryExchangeRateWhenLoadedRef.current =
          Hdform.getValues("ctyExhRate") || 0

        // Reset submit attempted flag when creating new record
        setSubmitAttempted(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingDetail, existingDetails.length])

    // Watch account date from header form
    const watchedAccountDate = Hdform.watch("accountDate")

    // Sync invoice date with account date when account date changes (only for new records, not editing)
    useEffect(() => {
      // Only sync if not editing an existing detail
      if (editingDetail) return

      if (watchedAccountDate) {
        let accountDateStr: string | null = null

        if (typeof watchedAccountDate === "string") {
          // If it's a string, try to parse it to ensure it's valid
          const parsed = parseDate(watchedAccountDate)
          if (parsed && !isNaN(parsed.getTime())) {
            accountDateStr = format(parsed, dateFormat)
          }
        } else if (
          watchedAccountDate instanceof Date &&
          !isNaN(watchedAccountDate.getTime())
        ) {
          accountDateStr = format(watchedAccountDate, dateFormat)
        }

        if (accountDateStr) {
          // Update invoice date to match account date
          form.setValue("invoiceDate", accountDateStr, {
            shouldValidate: false,
          })
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedAccountDate, editingDetail, dateFormat])

    const onSubmit = async (_data: CbPettyCashDtSchemaType) => {
      try {
        // Only recalculate amounts if exchange rate has changed since detail was loaded
        // This prevents unnecessary recalculation when user only changes remarks or other non-amount fields
        const currentExchangeRate = Hdform.getValues("exhRate") || 0
        const currentCountryExchangeRate = Hdform.getValues("ctyExhRate") || 0
        const exchangeRateChanged =
          currentExchangeRate !== exchangeRateWhenLoadedRef.current ||
          currentCountryExchangeRate !==
            countryExchangeRateWhenLoadedRef.current

        if (exchangeRateChanged) {
          // Recalculate amounts based on current exchange rate before validation
          // This happens during form submission, not immediately on exchange rate change
          recalculateAmountsOnExchangeRateChange(
            currentExchangeRate,
            currentCountryExchangeRate
          )
        }

        // Get updated data after recalculation (if it happened)
        const updatedData = form.getValues()

        // Trigger validation - React Hook Form will validate automatically via zodResolver
        const isValid = await form.trigger()

        if (!isValid) {
          // Validation failed - React Hook Form will display errors automatically
          const errors = form.formState.errors
          const errorFields = Object.keys(errors)
          const errorMessages = errorFields
            .map((field) => {
              const error = errors[field as keyof typeof errors]
              return error?.message || `${field} is invalid`
            })
            .filter(Boolean)

          if (errorMessages.length > 0) {
            toast.error(
              `Please fix validation errors: ${errorMessages.join(", ")}`
            )
          } else {
            toast.error("Please fix form validation errors")
          }
          console.error("Form validation errors:", errors)
          return
        }

        // Additional Zod validation for safety (use updated data after recalculation)
        const validationResult = CbPettyCashDtSchema(
          required,
          visible
        ).safeParse(updatedData)

        if (!validationResult.success) {
          // Set field-level errors from Zod validation
          validationResult.error.issues.forEach((issue) => {
            const fieldPath = issue.path.join(
              "."
            ) as keyof CbPettyCashDtSchemaType
            form.setError(fieldPath, {
              type: "validation",
              message: issue.message,
            })
          })

          const errors = validationResult.error.issues
          const errorMessage = errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ")
          toast.error(`Validation failed: ${errorMessage}`)
          setSubmitAttempted(true)
          console.error("Zod validation errors:", errors)
          return
        }

        // Use itemNo as the unique identifier
        const currentItemNo = updatedData.itemNo || getNextItemNo()

        // Populate code/name fields from lookup data (use updated data after recalculation)
        const populatedData = populateCodeNameFields(updatedData)

        const rowData: ICbPettyCashDt = {
          paymentId: updatedData.paymentId ?? "0",
          paymentNo: updatedData.paymentNo ?? "",
          itemNo: updatedData.itemNo ?? currentItemNo,
          seqNo: updatedData.seqNo ?? currentItemNo,
          glId: populatedData.glId ?? 0,
          glCode: populatedData.glCode ?? "",
          glName: populatedData.glName ?? "",
          invoiceDate: (() => {
            // Ensure invoiceDate is valid before using it
            if (updatedData.invoiceDate) {
              if (typeof updatedData.invoiceDate === "string") {
                const parsed = parseDate(updatedData.invoiceDate)
                if (parsed && !isNaN(parsed.getTime())) {
                  return updatedData.invoiceDate
                }
              } else if (
                updatedData.invoiceDate instanceof Date &&
                !isNaN(updatedData.invoiceDate.getTime())
              ) {
                return format(updatedData.invoiceDate, dateFormat)
              }
            }
            // Fallback to current date if invalid
            return format(new Date(), dateFormat)
          })(),
          invoiceNo: updatedData.invoiceNo ?? "",
          supplierName: updatedData.supplierName ?? "",
          supplierRegNo: updatedData.supplierRegNo ?? "",
          serviceCategoryId: updatedData.serviceCategoryId ?? 0,
          serviceCategoryName: updatedData.serviceCategoryName ?? "",
          totAmt: updatedData.totAmt ?? 0,
          totLocalAmt: updatedData.totLocalAmt ?? 0,
          totCtyAmt: updatedData.totCtyAmt ?? 0,
          remarks: updatedData.remarks ?? "",
          gstId: populatedData.gstId ?? 0,
          gstName: populatedData.gstName ?? "",
          gstPercentage: updatedData.gstPercentage ?? 0,
          gstAmt: updatedData.gstAmt ?? 0,
          gstLocalAmt: updatedData.gstLocalAmt ?? 0,
          gstCtyAmt: updatedData.gstCtyAmt ?? 0,
          departmentId: updatedData.departmentId ?? 0,
          departmentCode: updatedData.departmentCode ?? "",
          departmentName: updatedData.departmentName ?? "",
          employeeId: updatedData.employeeId ?? 0,
          employeeCode: updatedData.employeeCode ?? "",
          employeeName: updatedData.employeeName ?? "",
          portId: updatedData.portId ?? 0,
          portCode: updatedData.portCode ?? "",
          portName: updatedData.portName ?? "",
          vesselId: updatedData.vesselId ?? 0,
          vesselCode: updatedData.vesselCode ?? "",
          vesselName: updatedData.vesselName ?? "",
          bargeId: updatedData.bargeId ?? 0,
          bargeCode: updatedData.bargeCode ?? "",
          bargeName: updatedData.bargeName ?? "",
          voyageId: updatedData.voyageId ?? 0,
          voyageNo: updatedData.voyageNo ?? "",
          jobOrderId: updatedData.jobOrderId ?? 0,
          jobOrderNo: updatedData.jobOrderNo ?? "",
          taskId: updatedData.taskId ?? 0,
          taskName: updatedData.taskName ?? "",
          serviceItemNo: updatedData.serviceItemNo ?? 0,
          serviceItemNoName: updatedData.serviceItemNoName ?? "",
          editVersion: updatedData.editVersion ?? 0,
        }

        if (rowData) {
          onAddRowAction?.(rowData)

          // Show success message
          if (editingDetail) {
            toast.success(`Row ${currentItemNo} updated successfully`)
          } else {
            toast.success(`Row ${currentItemNo} added successfully`)
          }

          // Reset the form with incremented itemNo
          const nextItemNo = getNextItemNo()
          const defaultValues = createDefaultValues(nextItemNo)
          const populatedValues = populateCodeNameFields(defaultValues)
          form.reset(populatedValues)

          // Reset submit attempted flag on successful submission
          setSubmitAttempted(false)

          // Focus on the first visible field after successful submission
          focusFirstVisibleField()
        }
      } catch (error) {
        console.error("Error adding row:", error)
        toast.error("Failed to add row. Please check the form and try again.")
      }
    }

    // ============================================================================
    // Check for duplicates
    // ============================================================================

    // Check for duplicate records based on invoiceDate, invoiceNo, and supplierName
    const checkDuplicateRecord = (
      data: CbPettyCashDtSchemaType
    ): CbPettyCashDtSchemaType | null => {
      if (existingDetails.length === 0) return null

      // Find if any existing record has the same invoiceDate, invoiceNo, and supplierName
      const duplicate = existingDetails.find(
        (detail: CbPettyCashDtSchemaType) =>
          detail.invoiceDate === data.invoiceDate &&
          detail.invoiceNo === data.invoiceNo &&
          detail.supplierName === data.supplierName &&
          detail.itemNo !== data.itemNo // Exclude the current record if editing
      )

      return duplicate || null
    }

    // Check for duplicates on field change
    const checkDuplicateOnChange = () => {
      const currentData = form.getValues()
      // Only check if all three fields have values
      if (
        currentData.invoiceDate &&
        currentData.invoiceNo &&
        currentData.supplierName
      ) {
        const duplicateRecord = checkDuplicateRecord(currentData)
        if (duplicateRecord) {
          setPendingSubmitData(duplicateRecord)
          setShowDuplicateConfirmation(true)
        }
      }
    }

    // Handle duplicate confirmation - keep data in form for user to modify
    const handleDuplicateConfirm = () => {
      // Don't submit - just keep the data in the form for user to modify
      setPendingSubmitData(null)
      toast.info("You can modify the data and submit again")
    }

    // Handle duplicate confirmation - cancel and reset form
    const handleDuplicateCancel = () => {
      setPendingSubmitData(null)
      const nextItemNo = getNextItemNo()
      form.reset(createDefaultValues(nextItemNo))
      toast.info("Form reset due to duplicate record")
    }

    // ============================================================================
    // HANDLERS
    // ============================================================================

    // Handle chart of account selection
    const handleChartOfAccountChange = (
      selectedOption: IChartOfAccountLookup | null
    ) => {
      if (selectedOption) {
        form.setValue("glId", selectedOption.glId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("glCode", selectedOption.glCode || "")
        form.setValue("glName", selectedOption.glName || "")

        // CRITICAL: Use the actual isJobSpecific property from the chart of account data
        // This determines which fields will be shown/required
        const isJobSpecificAccount = selectedOption.isJobSpecific || false

        setIsJobSpecific(isJobSpecificAccount)

        // Reset dependent fields when switching between job-specific and department-specific
        // This prevents invalid data from being submitted
        if (!isJobSpecificAccount) {
          // Department-Specific: Reset job-related fields
          form.setValue("jobOrderId", 0, { shouldValidate: true })
          form.setValue("jobOrderNo", "")
          form.setValue("taskId", 0, { shouldValidate: true })
          form.setValue("taskName", "")
          form.setValue("serviceItemNo", 0, { shouldValidate: true })
          form.setValue("serviceItemNoName", "")
        } else {
          // Job-Specific: Reset department field
          form.setValue("departmentId", 0, { shouldValidate: true })
          form.setValue("departmentCode", "")
          form.setValue("departmentName", "")
        }
      } else {
        form.setValue("glId", 0, { shouldValidate: true })
        form.setValue("glCode", "")
        form.setValue("glName", "")
      }
    }

    const handleGSTChange = async (selectedOption: IGstLookup | null) => {
      if (selectedOption) {
        form.setValue("gstId", selectedOption.gstId)
        form.setValue("gstName", selectedOption.gstName || "")

        // Set GST percentage from lookup
        await setGSTPercentage(Hdform, form, decimals?.[0] || {}, visible)

        // Get updated form values after percentage is set
        const rowData = form.getValues()

        // Sync city exchange rate with exchange rate if needed
        const exchangeRate = Hdform.getValues("exhRate") || 0
        syncCountryExchangeRate(Hdform, exchangeRate, visible)

        // Calculate GST amounts with the new percentage
        handleGstPercentageChange(Hdform, rowData, decimals?.[0] || {}, visible)

        // Update form with calculated GST amounts
        form.setValue("gstAmt", rowData.gstAmt)
        form.setValue("gstLocalAmt", rowData.gstLocalAmt)
        form.setValue("gstCtyAmt", rowData.gstCtyAmt)
      } else {
        form.setValue("gstId", 0)
        form.setValue("gstName", "")
        form.setValue("gstPercentage", 0)
        form.setValue("gstAmt", 0)
        form.setValue("gstLocalAmt", 0)
        form.setValue("gstCtyAmt", 0)
      }
    }

    // Handle job order selection
    const handleJobOrderChange = (selectedOption: IJobOrderLookup | null) => {
      if (selectedOption) {
        form.setValue("jobOrderId", selectedOption.jobOrderId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("jobOrderNo", selectedOption.jobOrderNo || "")
        // Reset task and service when job order changes
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      } else {
        form.setValue("jobOrderId", 0, { shouldValidate: true })
        form.setValue("jobOrderNo", "")
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    }

    // Handle task selection
    const handleTaskChange = (selectedOption: ITaskLookup | null) => {
      if (selectedOption) {
        form.setValue("taskId", selectedOption.taskId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("taskName", selectedOption.taskName || "")
        // Reset service when task changes
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      } else {
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    }

    // Handle service selection
    const handleServiceChange = (
      selectedOption: IServiceItemNoLookup | null
    ) => {
      if (selectedOption) {
        form.setValue("serviceItemNo", selectedOption.serviceItemNo, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue(
          "serviceItemNoName",
          selectedOption.serviceItemNoName || ""
        )
      } else {
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    }

    // Handle department selection
    const handleDepartmentChange = (
      selectedOption: IDepartmentLookup | null
    ) => {
      if (selectedOption) {
        form.setValue("departmentId", selectedOption.departmentId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("departmentCode", selectedOption.departmentCode || "")
        form.setValue("departmentName", selectedOption.departmentName || "")
      } else {
        form.setValue("departmentId", 0, { shouldValidate: true })
        form.setValue("departmentCode", "")
        form.setValue("departmentName", "")
      }
    }

    // Handle employee selection
    const handleEmployeeChange = (selectedOption: IEmployeeLookup | null) => {
      if (selectedOption) {
        form.setValue("employeeId", selectedOption.employeeId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("employeeCode", selectedOption.employeeCode || "")
        form.setValue("employeeName", selectedOption.employeeName || "")
      } else {
        form.setValue("employeeId", 0, { shouldValidate: true })
        form.setValue("employeeCode", "")
        form.setValue("employeeName", "")
      }
    }

    // Handle barge selection
    const handleBargeChange = (selectedOption: IBargeLookup | null) => {
      if (selectedOption) {
        form.setValue("bargeId", selectedOption.bargeId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("bargeCode", selectedOption.bargeCode || "")
        form.setValue("bargeName", selectedOption.bargeName || "")
      } else {
        form.setValue("bargeId", 0, { shouldValidate: true })
        form.setValue("bargeCode", "")
        form.setValue("bargeName", "")
      }
    }

    // Handle Port selection
    const handlePortChange = (selectedOption: IPortLookup | null) => {
      if (selectedOption) {
        form.setValue("portId", selectedOption.portId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("portCode", selectedOption.portCode || "")
        form.setValue("portName", selectedOption.portName || "")
      } else {
        form.setValue("portId", 0, { shouldValidate: true })
        form.setValue("portCode", "")
        form.setValue("portName", "")
      }
    }

    // Handle Vessel selection
    const handleVesselChange = (selectedOption: IVesselLookup | null) => {
      if (selectedOption) {
        form.setValue("vesselId", selectedOption.vesselId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("vesselCode", selectedOption.vesselCode || "")
        form.setValue("vesselName", selectedOption.vesselName || "")
      } else {
        form.setValue("vesselId", 0, { shouldValidate: true })
        form.setValue("vesselCode", "")
        form.setValue("vesselName", "")
      }
    }

    // Handle Voyage selection
    const handleVoyageChange = (selectedOption: IVoyageLookup | null) => {
      if (selectedOption) {
        form.setValue("voyageId", selectedOption.voyageId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("voyageNo", selectedOption.voyageNo || "")
      } else {
        form.setValue("voyageId", 0, { shouldValidate: true })
        form.setValue("voyageNo", "")
      }
    }

    // Handle Service Category change
    const handleServiceCategoryChange = (
      selectedOption: IServiceCategoryLookup | null
    ) => {
      if (selectedOption) {
        form.setValue("serviceCategoryId", selectedOption.serviceCategoryId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue(
          "serviceCategoryName",
          selectedOption.serviceCategoryName || ""
        )
      } else {
        form.setValue("serviceCategoryId", 0, { shouldValidate: true })
        form.setValue("serviceCategoryName", "")
      }
    }

    // ============================================================================
    // CALCULATION HANDLERS
    // ============================================================================

    const triggerTotalAmountCalculation = () => {
      const rowData = form.getValues()

      // Sync city exchange rate with exchange rate if needed
      const exchangeRate = Hdform.getValues("exhRate") || 0
      syncCountryExchangeRate(Hdform, exchangeRate, visible)

      handleTotalamountChange(Hdform, rowData, decimals?.[0] || {}, visible)
      // Update only the calculated fields
      form.setValue("totLocalAmt", rowData.totLocalAmt)
      form.setValue("totCtyAmt", rowData.totCtyAmt)
      form.setValue("gstAmt", rowData.gstAmt)
      form.setValue("gstLocalAmt", rowData.gstLocalAmt)
      form.setValue("gstCtyAmt", rowData.gstCtyAmt)
    }

    const triggerGstCalculation = () => {
      // Only calculate GST if visible?.m_GstId is true
      if (!visible?.m_GstId) {
        form.setValue("gstAmt", 0)
        form.setValue("gstLocalAmt", 0)
        form.setValue("gstCtyAmt", 0)
        return
      }

      const rowData = form.getValues()

      // Sync city exchange rate with exchange rate if needed
      const exchangeRate = Hdform.getValues("exhRate") || 0
      syncCountryExchangeRate(Hdform, exchangeRate, visible)

      handleGstPercentageChange(Hdform, rowData, decimals?.[0] || {}, visible)
      // Update only the calculated fields
      form.setValue("gstAmt", rowData.gstAmt)
      form.setValue("gstLocalAmt", rowData.gstLocalAmt)
      form.setValue("gstCtyAmt", rowData.gstCtyAmt)
    }

    // Handle totAmt focus - capture original value
    const handleTotalAmountFocus = () => {
      originalTotAmtRef.current = form.getValues("totAmt") || 0
    }

    const handleTotalAmountChange = (value: number) => {
      const originalTotAmt = originalTotAmtRef.current

      // Only recalculate if value is different from original
      if (value === originalTotAmt) {
        return
      }

      form.setValue("totAmt", value)
      triggerTotalAmountCalculation()
    }

    // Handle gstPercentage focus - capture original value
    const handleGstPercentageFocus = () => {
      originalGstPercentageRef.current = form.getValues("gstPercentage") || 0
    }

    const handleGstPercentageManualChange = (value: number) => {
      // Only calculate GST if visible?.m_GstId is true
      if (!visible?.m_GstId) {
        form.setValue("gstPercentage", 0)
        form.setValue("gstAmt", 0)
        form.setValue("gstLocalAmt", 0)
        form.setValue("gstCtyAmt", 0)
        return
      }

      const originalGstPercentage = originalGstPercentageRef.current

      // Only recalculate if value is different from original
      if (value === originalGstPercentage) {
        return
      }

      form.setValue("gstPercentage", value)
      triggerGstCalculation()
    }

    const handleGstAmountChange = (value: number) => {
      form.setValue("gstAmt", value)

      // Only calculate GST if visible?.m_GstId is true
      if (!visible?.m_GstId) {
        form.setValue("gstLocalAmt", 0)
        form.setValue("gstCtyAmt", 0)
        return
      }

      // Get form values after setting gstAmt
      const rowData = form.getValues()

      // Ensure the updated gstAmt is in rowData
      rowData.gstAmt = value

      // Sync city exchange rate with exchange rate if needed
      const exchangeRate = Hdform.getValues("exhRate") || 0
      const countryExchangeRate = syncCountryExchangeRate(
        Hdform,
        exchangeRate,
        visible
      )

      // Calculate GST local and city amounts
      const { gstLocalAmt, gstCtyAmt } = calculateGstLocalAndCtyAmounts(
        value,
        exchangeRate,
        countryExchangeRate,
        decimals?.[0] || {},
        visible
      )
      rowData.gstLocalAmt = gstLocalAmt
      rowData.gstCtyAmt = gstCtyAmt

      // Update form with calculated values
      form.setValue("gstLocalAmt", gstLocalAmt)
      form.setValue("gstCtyAmt", gstCtyAmt)
    }

    // Watch form values to trigger re-renders when they change
    const watchedJobOrderId = form.watch("jobOrderId")
    const watchedTaskId = form.watch("taskId")

    const gstPercentage = form.watch("gstPercentage")

    const isServiceCategoryRequired = () => {
      const value = Number(gstPercentage ?? 0)
      return value > 0
    }

    return (
      <>
        {/* Display form errors only after submit attempt */}
        {submitAttempted && Object.keys(form.formState.errors).length > 0 && (
          <div className="mx-2 mb-2 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="mb-1 font-semibold text-red-800">
              Please fix the following errors:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <li key={field}>
                  {/* <span className="font-medium capitalize">{field}:</span>{" "} */}
                  {error?.message?.toString() || "Invalid value"}
                </li>
              ))}
            </ul>
          </div>
        )}

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={`-mt-2 mb-1 grid w-full grid-cols-8 gap-1 p-2 ${
              isCancelled ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {/* Section Header */}
            <div className="col-span-8 mb-1">
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={`px-3 py-1 text-sm font-medium ${
                    isCancelled
                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                      : editingDetail
                        ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                >
                  {isCancelled
                    ? "Details (Disabled - CbPettyCash Cancelled)"
                    : editingDetail
                      ? `Details (Edit Mode - Item No. ${editingDetail.itemNo})`
                      : "Details (Add New)"}
                </Badge>
              </div>
            </div>

            {/* Item No / Seq No */}
            <div className="col-span-1 flex flex-row gap-1">
              <div className="flex-1">
                <CustomNumberInput
                  form={form}
                  name="itemNo"
                  label="Item No"
                  round={0}
                  className="text-right"
                  isDisabled={true}
                />
              </div>
              <div className="flex-1">
                <CustomNumberInput
                  form={form}
                  name="seqNo"
                  label="Seq No"
                  round={0}
                  className="text-right"
                />
              </div>
            </div>

            {/* Invoice Date */}
            {visible?.m_InvoiceDate && (
              <CustomDateNew
                form={form}
                name="invoiceDate"
                label="Invoice Date"
                isRequired={true}
                onChangeEvent={checkDuplicateOnChange}
              />
            )}

            {/* Supplier Name */}
            {visible?.m_InvoiceNo && (
              <CustomInput
                form={form}
                name="invoiceNo"
                label="Invoice No"
                isRequired={true}
                onChangeEvent={checkDuplicateOnChange}
              />
            )}

            {/* Supplier Name */}
            {visible?.m_SupplierName && (
              <CustomInput
                form={form}
                name="supplierName"
                label="Supplier Name"
                isRequired={true}
                onChangeEvent={checkDuplicateOnChange}
              />
            )}

            {/* Chart Of Account */}
            <ChartOfAccountAutocomplete
              form={form}
              name="glId"
              label="Chart Of Account"
              isRequired={required?.m_GLId}
              onChangeEvent={handleChartOfAccountChange}
              companyId={companyId}
            />

            {/* 
            CONDITIONAL RENDERING BASED ON CHART OF ACCOUNT TYPE
            =====================================================
            If Chart of Account is Job-Specific (isJobSpecific = true):
              - Shows: Job Order → Task → Service (cascading dropdowns)
              - Hides: Department
            
            If Chart of Account is Department-Specific (isJobSpecific = false):
              - Shows: Department
              - Hides: Job Order, Task, Service
            
            The isJobSpecific state is set by:
            1. Chart of Account selection (handleChartOfAccountChange)
            2. Edit mode detection (useEffect checking existing jobOrderId/departmentId)
          */}
            {isJobSpecific ? (
              <>
                {/* JOB-SPECIFIC MODE: Job Order → Task → Service */}
                {visible?.m_JobOrderId && !isDynamicLookup && (
                  <JobOrderAutocomplete
                    form={form}
                    name="jobOrderId"
                    label="Job Order-S"
                    isRequired={required?.m_JobOrderId && isJobSpecific}
                    onChangeEvent={handleJobOrderChange}
                  />
                )}

                {visible?.m_JobOrderId && isDynamicLookup && (
                  <DynamicJobOrderAutocomplete
                    form={form}
                    name="jobOrderId"
                    label="Job Order-D"
                    onChangeEvent={handleJobOrderChange}
                  />
                )}

                {visible?.m_JobOrderId && (
                  <JobOrderTaskAutocomplete
                    key={`task-${watchedJobOrderId}`}
                    form={form}
                    name="taskId"
                    jobOrderId={watchedJobOrderId || 0}
                    label="Task"
                    //isRequired={required?.m_JobOrderId && isJobSpecific}
                    onChangeEvent={handleTaskChange}
                  />
                )}

                {visible?.m_JobOrderId && (
                  <JobOrderServiceAutocomplete
                    key={`service-${watchedJobOrderId}-${watchedTaskId}`}
                    form={form}
                    name="serviceItemNo"
                    jobOrderId={watchedJobOrderId || 0}
                    taskId={watchedTaskId || 0}
                    label="Service"
                    //isRequired={required?.m_JobOrderId && isJobSpecific}
                    onChangeEvent={handleServiceChange}
                  />
                )}
              </>
            ) : (
              <>
                {/* DEPARTMENT-SPECIFIC MODE: Department only */}
                {visible?.m_DepartmentId && (
                  <DepartmentAutocomplete
                    form={form}
                    name="departmentId"
                    label="Department"
                    isRequired={required?.m_DepartmentId && !isJobSpecific}
                    onChangeEvent={handleDepartmentChange}
                  />
                )}
              </>
            )}

            {/* Employee */}
            {visible?.m_EmployeeId && (
              <EmployeeAutocomplete
                form={form}
                name="employeeId"
                label="Employee"
                isRequired={required?.m_EmployeeId}
                onChangeEvent={handleEmployeeChange}
              />
            )}

            {/* Barge */}
            {visible?.m_BargeId && (
              <BargeAutocomplete
                form={form}
                name="bargeId"
                label="Barge"
                isRequired={required?.m_BargeId}
                onChangeEvent={handleBargeChange}
              />
            )}

            {/* Port */}
            {visible?.m_PortId && (
              <PortAutocomplete
                form={form}
                name="portId"
                label="Port"
                isRequired={required?.m_PortId}
                onChangeEvent={handlePortChange}
              />
            )}

            {/* Barge */}
            {visible?.m_VesselId && (
              <VesselAutocomplete
                form={form}
                name="vesselId"
                label="Vessel"
                isRequired={required?.m_VesselId}
                onChangeEvent={handleVesselChange}
              />
            )}

            {/* Voyage */}
            {visible?.m_VoyageId && (
              <VoyageAutocomplete
                form={form}
                name="voyageId"
                label="Voyage"
                isRequired={required?.m_VoyageId}
                onChangeEvent={handleVoyageChange}
              />
            )}

            {/* Total Amount */}
            <CustomNumberInput
              form={form}
              name="totAmt"
              label="Total Amount"
              isRequired={required?.m_TotAmt}
              round={amtDec}
              className="text-right"
              onFocusEvent={handleTotalAmountFocus}
              onChangeEvent={handleTotalAmountChange}
            />

            {/* Local Amount */}
            <CustomNumberInput
              form={form}
              name="totLocalAmt"
              label="Total Local Amount"
              round={locAmtDec}
              className="text-right"
              isDisabled={true}
            />

            {/* Country Amount */}
            {visible?.m_CtyCurr && (
              <CustomNumberInput
                form={form}
                name="totCtyAmt"
                label="Total Country Amount"
                round={locAmtDec}
                className="text-right"
                isDisabled={true}
              />
            )}

            {/* GST */}
            {visible?.m_GstId && (
              <GSTAutocomplete
                form={form}
                name="gstId"
                label="VAT"
                isRequired={required?.m_GstId}
                onChangeEvent={handleGSTChange}
              />
            )}

            {/* GST Percentage */}
            {visible?.m_GstId && (
              <CustomNumberInput
                form={form}
                name="gstPercentage"
                label="VAT Percentage"
                round={amtDec}
                className="text-right"
                onFocusEvent={handleGstPercentageFocus}
                onChangeEvent={handleGstPercentageManualChange}
              />
            )}

            {/* GST Amount */}
            {visible?.m_GstId && (
              <CustomNumberInput
                form={form}
                name="gstAmt"
                label="VAT Amount"
                round={amtDec}
                isDisabled={false}
                className="text-right"
                onChangeEvent={handleGstAmountChange}
              />
            )}

            {/* GST Local Amount */}
            {visible?.m_GstId && (
              <CustomNumberInput
                form={form}
                name="gstLocalAmt"
                label="VAT Local Amount"
                round={locAmtDec}
                className="text-right"
                isDisabled={true}
              />
            )}

            {/* GST Country Amount */}
            {visible?.m_CtyCurr && visible?.m_GstId && (
              <CustomNumberInput
                form={form}
                name="gstCtyAmt"
                label="GST Country Amount"
                round={locAmtDec}
                className="text-right"
                isDisabled={true}
              />
            )}

            {/* TRN No */}
            {visible?.m_GstNo && (
              <CustomInput
                form={form}
                name="supplierRegNo"
                label="TRN No"
                isRequired={isServiceCategoryRequired()}
              />
            )}

            {/* Service Category */}
            {visible?.m_ServiceCategoryId && (
              <ServiceCategoryAutocomplete
                form={form}
                name="serviceCategoryId"
                label="Service Category"
                isRequired={isServiceCategoryRequired()}
                onChangeEvent={handleServiceCategoryChange}
              />
            )}

            {/* Remarks */}
            {visible?.m_Remarks && (
              <CustomTextarea
                form={form}
                name="remarks"
                label="Remarks"
                isRequired={required?.m_Remarks}
                className="col-span-2"
                minRows={2}
                maxRows={6}
              />
            )}

            {/* Action buttons */}
            <div className="col-span-1 flex items-center gap-1">
              <Button
                type="submit"
                size="sm"
                variant="default"
                className={
                  editingDetail
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }
                disabled={form.formState.isSubmitting}
                title="Update | Add"
              >
                {editingDetail ? "Update" : "Add"}
              </Button>

              <Button
                type="button"
                variant="outline"
                title="Cancel"
                size="sm"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </div>
          </form>
        </FormProvider>

        {/* Duplicate Confirmation */}
        <DuplicateConfirmation
          open={showDuplicateConfirmation}
          onOpenChange={setShowDuplicateConfirmation}
          onConfirm={handleDuplicateConfirm}
          onCancelAction={handleDuplicateCancel}
          duplicateInfo={
            pendingSubmitData
              ? {
                  invoiceDate:
                    pendingSubmitData.invoiceDate instanceof Date
                      ? format(pendingSubmitData.invoiceDate, clientDateFormat)
                      : typeof pendingSubmitData.invoiceDate === "string"
                        ? format(
                            parseDate(pendingSubmitData.invoiceDate) ||
                              new Date(),
                            clientDateFormat
                          )
                        : "",
                  invoiceNo: pendingSubmitData.invoiceNo,
                  supplierName: pendingSubmitData.supplierName,
                  glCode: pendingSubmitData.glCode,
                  glName: pendingSubmitData.glName,
                  totAmt: pendingSubmitData.totAmt,
                  totLocalAmt: pendingSubmitData.totLocalAmt,
                  gstPercentage: pendingSubmitData.gstPercentage,
                  gstAmt: pendingSubmitData.gstAmt,
                  remarks: pendingSubmitData.remarks,
                }
              : undefined
          }
        />
      </>
    )
  }
)

CbPettyCashDetailsForm.displayName = "CbPettyCashDetailsForm"

export default CbPettyCashDetailsForm
