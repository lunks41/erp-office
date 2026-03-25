"use client"

import { useEffect, useMemo, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IModuleTransactionLookup } from "@/interfaces/lookup"
import { INumberFormatGrid } from "@/interfaces/setting"
import { DocumentNoSchemaType, documentNoFormSchema } from "@/schemas/setting"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  useModuleTransactionListGet,
  useNumberFormatDataById,
  useNumberFormatDetailsDataGet,
  useNumberFormatSave,
} from "@/hooks/use-settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import CustomInput from "@/components/custom/custom-input"
import SelectCommon from "@/components/custom/select-common"

interface ModuleGroup {
  id: number
  name: string
  transactions: Array<{ id: number; name: string }>
}

export function DocumentNoForm() {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [selectedModule, setSelectedModule] = useState<number | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(
    null
  )
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  )

  const form = useForm<DocumentNoSchemaType>({
    resolver: zodResolver(documentNoFormSchema),
    defaultValues: {
      numberId: 0,
      moduleId: 0,
      transactionId: 0,
      prefix: "",
      prefixDelimiter: "-",
      prefixSeq: 1,
      includeYear: true,
      yearDelimiter: "-",
      yearSeq: 2,
      yearFormat: "YY",
      includeMonth: true,
      monthDelimiter: "",
      monthSeq: 3,
      monthFormat: "MM",
      noDigits: 3,
      digitSeq: 4,
      resetYearly: false,
    },
  })

  // Get module transaction list
  const {
    data: moduleTrnsListResponse,
    isLoading: isModuleListLoading,
    isError: isModuleListError,
  } = useModuleTransactionListGet()

  const { data: moduleTrnsData } =
    (moduleTrnsListResponse as ApiResponse<IModuleTransactionLookup>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  // Get number format data when module and transaction are selected
  const {
    data: numberFormatDataResponse,
    isLoading: isNumberFormatLoading,
    isError: isNumberFormatError,
    refetch: refetchNumberFormat,
  } = useNumberFormatDataById({
    moduleId: selectedModule ?? 0,
    transactionId: selectedTransaction ?? 0,
  })

  // Get number format details when numberId and year are selected
  const {
    data: numberFormatDetailsDataResponse,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
  } = useNumberFormatDetailsDataGet({
    id: numberFormatDataResponse?.data?.numberId ?? 0,
    year: selectedYear,
  })

  const { data: numberFormatDetailsData } =
    (numberFormatDetailsDataResponse as ApiResponse<INumberFormatGrid>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  const numberFormatGridData = useMemo(() => {
    // Fallback to 0 for all values
    const fallbackData = {
      month1: 0,
      month2: 0,
      month3: 0,
      month4: 0,
      month5: 0,
      month6: 0,
      month7: 0,
      month8: 0,
      month9: 0,
      month10: 0,
      month11: 0,
      month12: 0,
      LastNumber: 0,
      ...numberFormatDetailsData,
    }

    return [
      { month: "1", count: fallbackData.month1 },
      { month: "2", count: fallbackData.month2 },
      { month: "3", count: fallbackData.month3 },
      { month: "4", count: fallbackData.month4 },
      { month: "5", count: fallbackData.month5 },
      { month: "6", count: fallbackData.month6 },
      { month: "7", count: fallbackData.month7 },
      { month: "8", count: fallbackData.month8 },
      { month: "9", count: fallbackData.month9 },
      { month: "10", count: fallbackData.month10 },
      { month: "11", count: fallbackData.month11 },
      { month: "12", count: fallbackData.month12 },
      { month: "Last Number", count: fallbackData.LastNumber },
    ]
  }, [numberFormatDetailsData])

  // Save number format
  const { mutate: saveNumberFormat, isPending } = useNumberFormatSave()

  // Determine if this is a create or update operation
  const isUpdate = useMemo(() => {
    return (
      numberFormatDataResponse?.result === 1 &&
      numberFormatDataResponse?.data?.numberId &&
      numberFormatDataResponse.data.numberId > 0
    )
  }, [numberFormatDataResponse])

  // Update form when number format data is loaded
  useEffect(() => {
    if (
      numberFormatDataResponse?.result === 1 &&
      numberFormatDataResponse.data
    ) {
      form.reset({
        numberId: numberFormatDataResponse.data.numberId ?? 0,
        moduleId: numberFormatDataResponse.data.moduleId ?? 0,
        transactionId: numberFormatDataResponse.data.transactionId ?? 0,
        prefix: numberFormatDataResponse.data.prefix ?? "",
        prefixDelimiter: numberFormatDataResponse.data.prefixDelimiter ?? "-",
        prefixSeq: numberFormatDataResponse.data.prefixSeq ?? 1,
        includeYear: numberFormatDataResponse.data.includeYear ?? true,
        yearDelimiter: numberFormatDataResponse.data.yearDelimiter ?? "-",
        yearSeq: numberFormatDataResponse.data.yearSeq ?? 2,
        yearFormat: numberFormatDataResponse.data.yearFormat ?? "YY",
        includeMonth: numberFormatDataResponse.data.includeMonth ?? true,
        monthDelimiter: numberFormatDataResponse.data.monthDelimiter ?? "",
        monthSeq: numberFormatDataResponse.data.monthSeq ?? 3,
        monthFormat: numberFormatDataResponse.data.monthFormat ?? "MM",
        noDigits: numberFormatDataResponse.data.noDigits ?? 3,
        digitSeq: numberFormatDataResponse.data.digitSeq ?? 4,
        resetYearly: numberFormatDataResponse.data.resetYearly ?? false,
      })
    } else if (
      numberFormatDataResponse?.result !== undefined &&
      (numberFormatDataResponse.result < 0 || !numberFormatDataResponse.data)
    ) {
      // Clear form when result is negative or data is null
      form.reset({
        numberId: 0,
        moduleId: 0,
        transactionId: 0,
        prefix: "",
        prefixDelimiter: "-",
        prefixSeq: 1,
        includeYear: true,
        yearDelimiter: "-",
        yearSeq: 2,
        yearFormat: "YY",
        includeMonth: true,
        monthDelimiter: "",
        monthSeq: 3,
        monthFormat: "MM",
        noDigits: 4,
        digitSeq: 4,
        resetYearly: false,
      })
    }
  }, [numberFormatDataResponse, form])

  // --- Fix: Auto-select first module when loaded ---
  useEffect(() => {
    if (moduleTrnsData && moduleTrnsData.length > 0 && !selectedModule) {
      setSelectedModule(moduleTrnsData[0].moduleId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleTrnsData])

  // Helper to get selected module/transaction names
  const selectedModuleName = useMemo(() => {
    return (
      moduleTrnsData?.find((m) => m.moduleId === selectedModule)?.moduleName ||
      ""
    )
  }, [moduleTrnsData, selectedModule])

  const selectedTransactionName = useMemo(() => {
    return (
      moduleTrnsData?.find(
        (m) =>
          m.moduleId === selectedModule &&
          m.transactionId === selectedTransaction
      )?.transactionName || ""
    )
  }, [moduleTrnsData, selectedModule, selectedTransaction])

  function onSubmit() {
    if (!selectedModule || !selectedTransaction) {
      toast.error("Please select a module and transaction")
      return
    }
    setShowSaveConfirmation(true)
  }

  function handleConfirmSave() {
    const data = form.getValues()

    // Ensure required fields have default values (C# API requires non-empty strings)
    const payload = {
      ...data,
      moduleId: selectedModule,
      transactionId: selectedTransaction,
      // Ensure required string fields are never empty
      prefix: data.prefix || "DOC",
      yearFormat: data.yearFormat || "",
      monthFormat: data.monthFormat || "",
      yearDelimiter: data.yearDelimiter || "",
      prefixDelimiter: data.prefixDelimiter || "",
      monthDelimiter: data.monthDelimiter || "",
    }

    saveNumberFormat(payload, {
      onSuccess: (response) => {
        if (response.result === 1) {
          toast.success("Document number format saved successfully")
          refetchNumberFormat()
        } else {
          toast.error(
            response.message || "Failed to save document number format"
          )
        }
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to save document number format"
        )
      },
    })
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]

  // Watch form values to make preview reactive
  const watchedValues = form.watch()

  const previewDocumentNo = () => {
    const values = watchedValues
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // 1-12

    interface Part {
      seq: number
      value: string
      delimiter: string
    }

    const parts: Part[] = []

    if (values.prefix) {
      parts.push({
        seq: values.prefixSeq ?? 1,
        value: values.prefix,
        delimiter: values.prefixDelimiter || "",
      })
    }

    if (values.includeYear) {
      let yearStr = ""
      if (values.yearFormat === "YYYY") {
        yearStr = String(year)
      } else if (values.yearFormat === "YY") {
        yearStr = String(year).slice(-2)
      }
      parts.push({
        seq: values.yearSeq ?? 2,
        value: yearStr,
        delimiter: values.yearDelimiter || "",
      })
    }

    if (values.includeMonth) {
      let monthStr = ""
      if (values.monthFormat === "MM") {
        monthStr = String(month).padStart(2, "0")
      } else if (values.monthFormat === "MMM") {
        monthStr = monthNames[month - 1]
      }
      parts.push({
        seq: values.monthSeq ?? 3,
        value: monthStr,
        delimiter: values.monthDelimiter || "",
      })
    }

    const sequence = "0".repeat(Number(values.noDigits) || 4)
    parts.push({
      seq: values.digitSeq ?? 4,
      value: sequence,
      delimiter: "",
    })

    parts.sort((a, b) => a.seq - b.seq)

    return parts
      .map((part, index) => {
        if (index < parts.length - 1) {
          return part.value + part.delimiter
        }
        return part.value
      })
      .join("")
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 xl:h-[calc(100vh-12rem)] xl:flex-row">
      {/* Left Panel - Module List */}
      <Card className="w-full lg:w-[25%] xl:w-[20%]">
        <CardContent className="p-3 sm:p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="text-lg font-semibold">Modules</span>
          </div>
          {isModuleListLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Spinner size="sm" className="text-primary" />
              Loading...
            </div>
          ) : isModuleListError ? (
            <div className="text-destructive flex items-center gap-2 text-sm">
              <span>❌</span>
              Failed to load modules
            </div>
          ) : moduleTrnsData && moduleTrnsData.length > 0 ? (
            <div className="space-y-2">
              {moduleTrnsData
                .reduce<ModuleGroup[]>((acc, curr) => {
                  const existingModule = acc.find((m) => m.id === curr.moduleId)
                  if (existingModule) {
                    existingModule.transactions.push({
                      id: curr.transactionId,
                      name: curr.transactionName,
                    })
                  } else {
                    acc.push({
                      id: curr.moduleId,
                      name: curr.moduleName,
                      transactions: [
                        {
                          id: curr.transactionId,
                          name: curr.transactionName,
                        },
                      ],
                    })
                  }
                  return acc
                }, [])
                .map((module) => (
                  <div key={module.id} className="space-y-1">
                    <div
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-md p-3 transition-all duration-200 ${
                        selectedModule === module.id
                          ? "bg-primary/10 border-primary/20 border"
                          : "hover:bg-accent/50 border border-transparent"
                      }`}
                      onClick={() =>
                        setSelectedModule((prev) =>
                          prev === module.id ? null : module.id
                        )
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📁</span>
                        <span className="text-sm font-medium">
                          {module.name}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {module.transactions.length}
                      </Badge>
                    </div>
                    {selectedModule === module.id && (
                      <div className="space-y-1 pl-4">
                        {module.transactions.map(
                          (transaction: { id: number; name: string }) => (
                            <div
                              key={transaction.id}
                              className={`flex cursor-pointer items-center justify-between gap-2 rounded-md p-2 transition-all duration-200 ${
                                selectedTransaction === transaction.id
                                  ? "bg-accent border-accent-foreground/20 border"
                                  : "hover:bg-accent/30 border border-transparent"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTransaction(transaction.id)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs">📄</span>
                                <span className="text-xs font-medium">
                                  {transaction.name}
                                </span>
                              </div>
                              {selectedTransaction === transaction.id && (
                                <Badge
                                  variant="default"
                                  className="bg-green-500 text-xs text-white"
                                >
                                  Active
                                </Badge>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>📭</span>
              No modules available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Middle Panel - Form */}
      <Card className="w-full lg:w-[50%] xl:w-[55%]">
        <CardContent className="p-4 sm:p-6">
          {isNumberFormatLoading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Spinner size="md" className="text-primary" />
              <span className="text-muted-foreground">
                Loading configuration...
              </span>
            </div>
          ) : isNumberFormatError ? (
            <div className="text-destructive flex items-center justify-center gap-2 py-8">
              <span>❌</span>
              <span>Failed to load number format</span>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Selection Status */}
                <div className="mb-4">
                  {!selectedModule ? (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                      <span>⚠️</span>
                      <span className="text-xs font-medium sm:text-sm">
                        Please select a Module from the left panel
                      </span>
                    </div>
                  ) : !selectedTransaction ? (
                    <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400">
                      <span>⚠️</span>
                      <span className="text-xs font-medium sm:text-sm">
                        Please select a Transaction from the left panel
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                      <span>✅</span>
                      <span className="text-xs font-medium sm:text-sm">
                        Ready to configure: {selectedModuleName} -{" "}
                        {selectedTransactionName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-6">
                    {/* Live Preview Section */}
                    <div className="space-y-4">
                      <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 dark:border-blue-800 dark:from-blue-950/20 dark:to-purple-950/20">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">👁️</span>
                            <h3 className="text-base font-semibold text-blue-700 sm:text-lg dark:text-blue-300">
                              Live Preview
                            </h3>
                          </div>
                          {selectedModule && selectedTransaction && (
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                              <span className="text-sm font-bold sm:text-base">
                                {selectedModuleName} - {selectedTransactionName}
                              </span>
                              <Badge
                                className={`inline-block rounded-full px-2 py-1 text-xs font-semibold text-white sm:px-3 sm:py-1 sm:text-sm ${
                                  isUpdate ? "bg-green-500" : "bg-red-500"
                                }`}
                              >
                                {isUpdate ? "Configured" : "Not Configured"}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
                          See how your document number will look with current
                          settings
                        </p>
                        <div className="rounded-md border-2 border-dashed border-gray-300 bg-white p-4 text-center sm:p-6 dark:border-gray-600 dark:bg-gray-900">
                          <div className="text-primary font-mono text-xl font-bold tracking-wider break-all sm:text-2xl lg:text-3xl">
                            {previewDocumentNo()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Configuration Header */}
                    <div className="space-y-6">
                      <div className="border-b pb-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10">
                              <span className="text-sm sm:text-lg">⚙️</span>
                            </div>
                            <div>
                              <h3 className="text-foreground text-base font-semibold sm:text-lg">
                                Document Number Configuration
                              </h3>
                              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                                Configure how your document numbers will be
                                formatted
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => {
                                form.reset()
                                setSelectedModule(null)
                                setSelectedTransaction(null)
                              }}
                              className="flex items-center gap-2 text-xs sm:text-sm"
                            >
                              <span>🗑️</span>
                              <span className="hidden sm:inline">Clear</span>
                            </Button>
                            <Button
                              type="submit"
                              disabled={isPending}
                              className="flex items-center gap-2 text-xs sm:text-sm"
                            >
                              {isPending ? (
                                <>
                                  <Spinner size="sm" />
                                  <span className="hidden sm:inline">
                                    {isUpdate ? "Updating..." : "Saving..."}
                                  </span>
                                  <span className="sm:hidden">
                                    {isUpdate ? "Update..." : "Save..."}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span>💾</span>
                                  <span className="hidden sm:inline">
                                    {isUpdate
                                      ? "Update Configuration"
                                      : "Save Configuration"}
                                  </span>
                                  <span className="sm:hidden">
                                    {isUpdate ? "Update" : "Save"}
                                  </span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {/* Column 1: Prefix */}
                          <div className="flex h-full w-full min-w-0 flex-col space-y-4">
                            <div className="bg-primary/10 flex h-full w-full flex-col rounded-md p-3">
                              <h4 className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold">
                                📝 Prefix Settings
                              </h4>
                              <CustomInput
                                form={form}
                                name="prefix"
                                placeholder="Enter prefix (e.g., INV)"
                              />

                              <div className="space-y-3">
                                <CustomCheckbox
                                  form={form}
                                  name="includeYear"
                                  label="Year"
                                />
                                <CustomCheckbox
                                  form={form}
                                  name="includeMonth"
                                  label="Month"
                                />
                              </div>

                              <CustomInput
                                form={form}
                                name="noDigits"
                                type="number"
                                placeholder="Number of digits (e.g., 4)"
                              />
                            </div>
                          </div>
                          {/* Column 2: Delimiter */}
                          <div className="flex h-full w-full min-w-0 flex-col space-y-4">
                            <div className="flex h-full w-full flex-col rounded-md bg-blue-500/10 p-3">
                              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-600">
                                🔗 Delimiter Settings
                              </h4>
                              <div className="space-y-3">
                                <CustomInput
                                  form={form}
                                  name="prefixDelimiter"
                                  placeholder="Prefix delimiter (e.g., -)"
                                />
                                <CustomInput
                                  form={form}
                                  name="yearDelimiter"
                                  placeholder="Year delimiter (e.g., -)"
                                />
                                <CustomInput
                                  form={form}
                                  name="monthDelimiter"
                                  placeholder="Month delimiter (e.g., -)"
                                />
                              </div>
                            </div>
                          </div>
                          {/* Column 3: Sequence Number */}
                          <div className="flex h-full w-full min-w-0 flex-col space-y-4">
                            <div className="flex h-full w-full flex-col rounded-md bg-green-500/10 p-3">
                              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-600">
                                🔢 Sequence Order
                              </h4>
                              <div className="w-full space-y-3">
                                <SelectCommon
                                  form={form}
                                  name="prefixSeq"
                                  options={[
                                    { value: "1", label: "Position 1" },
                                    { value: "2", label: "Position 2" },
                                    { value: "3", label: "Position 3" },
                                    { value: "4", label: "Position 4" },
                                  ]}
                                  placeholder="Prefix position"
                                  onValueChange={(value) =>
                                    form.setValue("prefixSeq", Number(value))
                                  }
                                />
                                <SelectCommon
                                  form={form}
                                  name="yearSeq"
                                  options={[
                                    { value: "1", label: "Position 1" },
                                    { value: "2", label: "Position 2" },
                                    { value: "3", label: "Position 3" },
                                    { value: "4", label: "Position 4" },
                                  ]}
                                  placeholder="Year position"
                                  onValueChange={(value) =>
                                    form.setValue("yearSeq", Number(value))
                                  }
                                />
                                <SelectCommon
                                  form={form}
                                  name="monthSeq"
                                  options={[
                                    { value: "1", label: "Position 1" },
                                    { value: "2", label: "Position 2" },
                                    { value: "3", label: "Position 3" },
                                    { value: "4", label: "Position 4" },
                                  ]}
                                  placeholder="Month position"
                                  onValueChange={(value) =>
                                    form.setValue("monthSeq", Number(value))
                                  }
                                />
                                <SelectCommon
                                  form={form}
                                  name="digitSeq"
                                  options={[
                                    { value: "1", label: "Position 1" },
                                    { value: "2", label: "Position 2" },
                                    { value: "3", label: "Position 3" },
                                    { value: "4", label: "Position 4" },
                                  ]}
                                  placeholder="Digits position"
                                  onValueChange={(value) =>
                                    form.setValue("digitSeq", Number(value))
                                  }
                                />
                              </div>
                            </div>
                          </div>
                          {/* Column 4: Format */}
                          <div className="flex h-full w-full min-w-0 flex-col space-y-4">
                            <div className="flex h-full w-full flex-col rounded-md bg-purple-500/10 p-3">
                              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-purple-600">
                                🎨 Format Settings
                              </h4>
                              <div className="w-full space-y-3">
                                <SelectCommon
                                  form={form}
                                  name="yearFormat"
                                  options={[
                                    { value: "YY", label: "YY (00)" },
                                    { value: "YYYY", label: "YYYY (0000)" },
                                  ]}
                                  placeholder="Year format"
                                />
                                <SelectCommon
                                  form={form}
                                  name="monthFormat"
                                  options={[
                                    { value: "MM", label: "MM (01-12)" },
                                    { value: "MMM", label: "MMM (Jan-Dec)" },
                                  ]}
                                  placeholder="Month format"
                                />
                                <CustomCheckbox
                                  form={form}
                                  name="resetYearly"
                                  label="Sequence yearly"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Right Panel - Document Content */}
      <Card className="w-full lg:w-[25%] xl:w-[25%]">
        <CardContent className="p-3 sm:p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="text-base font-semibold sm:text-lg">
              Document Statistics
            </span>
          </div>

          {/* Year Selector with Enhanced UI */}
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm">📅</span>
              <span className="text-xs font-medium sm:text-sm">
                Select Year
              </span>
            </div>
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() + i
                  const isCurrentYear = year === new Date().getFullYear()
                  return (
                    <SelectItem key={year} value={String(year)}>
                      <div className="flex items-center gap-2">
                        <span>{year}</span>
                        {isCurrentYear && (
                          <Badge
                            variant="default"
                            className="bg-green-500 text-xs text-white"
                          >
                            Current
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          {numberFormatGridData && numberFormatGridData.length > 0 && (
            <div className="mb-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-3 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📈</span>
                  <span className="text-xs font-medium sm:text-sm">
                    Total Documents
                  </span>
                </div>
                <Badge className="bg-purple-500 text-xs text-white sm:text-sm">
                  {numberFormatGridData
                    .filter((row) => row.month !== "Last Number")
                    .reduce((sum, row) => sum + row.count, 0)
                    .toLocaleString()}
                </Badge>
              </div>
            </div>
          )}

          <ScrollArea className="h-[300px] sm:h-[380px]">
            <div className="space-y-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 sm:px-3 dark:text-gray-300">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs">📅</span>
                        <span className="hidden sm:inline">Month</span>
                        <span className="sm:hidden">M</span>
                      </div>
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 sm:px-3 dark:text-gray-300">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs">📊</span>
                        <span className="hidden sm:inline">Count</span>
                        <span className="sm:hidden">#</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isDetailsLoading ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center">
                        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                          <Spinner size="sm" className="text-primary" />
                          Loading statistics...
                        </div>
                      </td>
                    </tr>
                  ) : isDetailsError ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center">
                        <div className="text-destructive flex items-center justify-center gap-2 text-sm">
                          <span>❌</span>
                          Failed to load details
                        </div>
                      </td>
                    </tr>
                  ) : numberFormatGridData &&
                    numberFormatGridData.length > 0 ? (
                    numberFormatGridData.map((row, i) => {
                      const isLastNumber = row.month === "Last Number"
                      const isCurrentMonth =
                        !isLastNumber &&
                        Number(row.month) === new Date().getMonth() + 1

                      return (
                        <tr
                          key={`month-row-${i}`}
                          className={`transition-colors duration-200 ${
                            isLastNumber
                              ? "border-l-4 border-gray-400 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
                              : i % 2 === 1
                                ? "bg-muted/20"
                                : "bg-background"
                          } ${isCurrentMonth ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
                        >
                          <td className="px-2 py-2 text-xs sm:px-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span
                                className={
                                  isLastNumber
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                                }
                              >
                                {isLastNumber ? "🔢" : "📅"}
                              </span>
                              <span
                                className={`font-medium ${isLastNumber ? "text-yellow-800 dark:text-yellow-200" : ""}`}
                              >
                                {row.month}
                              </span>
                              {isCurrentMonth && (
                                <Badge
                                  variant="default"
                                  className="hidden bg-blue-500 text-xs text-white sm:inline-flex"
                                >
                                  Current
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-xs sm:px-3">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                isLastNumber
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : row.count > 0
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {row.count.toLocaleString()}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center">
                        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                          <span>📭</span>
                          No data available
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <SaveConfirmation
        title={
          isUpdate
            ? "Update Document Number Format"
            : "Save Document Number Format"
        }
        itemName={
          selectedModule && selectedTransaction
            ? `${selectedModuleName} - ${selectedTransactionName}`
            : "document number format"
        }
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
        onConfirm={handleConfirmSave}
        isSaving={isPending}
        operationType={isUpdate ? "update" : "create"}
      />
    </div>
  )
}
