"use client"

import { useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IJobOrderHd } from "@/interfaces/checklist"
import { IJobOrderLookup } from "@/interfaces/lookup"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  ArrowRight,
  CalendarIcon,
  CheckCircle,
  Database,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { useForm as useBulkUpdateForm, useForm } from "react-hook-form"
import { toast } from "sonner"

import { formatDateForApi, formatDateForDisplay } from "@/lib/date-utils"
import { usePersist } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  ChargeAutocomplete,
  JobOrderCustomerAutocomplete,
  TaskStatusAutocomplete,
  VisaAutocomplete,
} from "@/components/autocomplete"

interface TaskForwardSchemaType extends Record<string, unknown> {
  customerId: number
  jobOrderId: number
}

interface BulkUpdateData {
  jobOrderId: number
  taskId: number
  multipleId: string
  fieldName: string
  fieldValue: string
}

// Configuration for bulk update fields based on task type
interface BulkUpdateFieldConfig {
  field: string
  label: string
  type: "date" | "text" | "number" | "select"
  options?: { value: string; label: string }[]
}

const BULK_UPDATE_CONFIG: Record<number, BulkUpdateFieldConfig[]> = {
  // Type 1: Port Expenses (1), Third Party (10)
  // Fields: deliverDate, remarks, chargeId, taskStatusId
  1: [
    // PortExpenses
    { field: "deliverDate", label: "Delivery Date", type: "date" },
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  10: [
    // ThirdParty
    { field: "deliverDate", label: "Delivery Date", type: "date" },
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],

  // Type 2: Consignment Export (9), Consignment Import (8), Landing Items (13)
  // Fields: location, deliverDate, remarks, chargeId, taskStatusId
  8: [
    // ConsignmentImport - using deliveryLocation
    { field: "deliveryLocation", label: "Location", type: "text" },
    { field: "deliverDate", label: "Delivery Date", type: "date" },
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  9: [
    // ConsignmentExport - using deliveryLocation
    { field: "deliveryLocation", label: "Location", type: "text" },
    { field: "deliverDate", label: "Delivery Date", type: "date" },
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  13: [
    // LandingItems - using locationName
    { field: "locationName", label: "Location", type: "text" },
    { field: "deliverDate", label: "Delivery Date", type: "date" },
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],

  // Type 3: Crew Sign On (4), Crew Sign Off (5)
  // Fields: visaId, flightDetails, hotelName, transportName, remarks, chargeId, taskStatusId, clearing
  4: [
    // CrewSignOn
    { field: "visaId", label: "Visa Type", type: "select" },
    { field: "flightDetails", label: "Flight Details", type: "text" },
    { field: "departureDetails", label: "Departure Details", type: "text" },
    { field: "hotelName", label: "Hotel", type: "text" },
    { field: "transportName", label: "Transportation", type: "text" },
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
    { field: "clearing", label: "Clearing", type: "text" },
  ],
  5: [
    // CrewSignOff
    { field: "visaId", label: "Visa Type", type: "select" },
    { field: "flightDetails", label: "Flight Details", type: "text" },
    { field: "departureDetails", label: "Departure Details", type: "text" },
    { field: "hotelName", label: "Hotel", type: "text" },
    { field: "transportName", label: "Transportation", type: "text" },
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
    { field: "clearing", label: "Clearing", type: "text" },
  ],

  // Type 4: All other tasks (default)
  // Fields: remarks, chargeId, taskStatusId
  // Tasks: LaunchServices (2), EquipmentUsed (3), CrewMiscellaneous (6),
  //        MedicalAssistance (7), FreshWater (11), TechniciansSurveyors (12),
  //        OtherService (14), AgencyRemuneration (15)
  2: [
    // LaunchServices
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  3: [
    // EquipmentUsed
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  6: [
    // CrewMiscellaneous
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  7: [
    // MedicalAssistance
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  11: [
    // FreshWater
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  12: [
    // TechniciansSurveyors
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  14: [
    // OtherService
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
  15: [
    // AgencyRemuneration
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ],
}

interface TaskForwardData {
  multipleId: string
  taskId: number
  previousJobOrderId: number
  targetJobOrderId: number
  targetJobOrderNo: string
}

interface CombinedFormsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobData: IJobOrderHd
  moduleId: number
  transactionId: number
  isConfirmed?: boolean
  taskId: number
  multipleId: string
  onTaskAdded?: () => void
  onClearSelection?: () => void
  onCancelAction?: () => void
  title?: string
  description?: string
}

export function CombinedFormsDialog({
  open,
  onOpenChange,
  jobData,
  moduleId: _moduleId,
  transactionId: _transactionId,
  isConfirmed,
  taskId,
  multipleId,
  onTaskAdded,
  onClearSelection,
  onCancelAction,
  title = "Combined Services",
  description = "Manage bulk updates and task forwarding operations",
}: CombinedFormsDialogProps) {
  const queryClient = useQueryClient()

  console.log(isConfirmed, "isConfirmed combined forms")
  console.log(jobData, "jobData combined forms")
  console.log(taskId, "taskId combined forms")
  console.log(multipleId, "multipleId combined forms")

  // Bulk Update Form State
  const [selectedField, setSelectedField] = useState<string>("")

  // Get available fields for current task
  // Default fallback: remarks, chargeId, and taskStatusId for any unmapped tasks
  const availableFields = BULK_UPDATE_CONFIG[taskId] || [
    { field: "remarks", label: "Remarks", type: "text" },
    { field: "chargeId", label: "Charge", type: "select" },
    { field: "taskStatusId", label: "Status", type: "select" },
  ]

  // Get selected field config
  const selectedFieldConfig = availableFields.find(
    (f) => f.field === selectedField
  )

  // Bulk update form for different field types
  const bulkUpdateForm = useBulkUpdateForm<{
    date?: string
    textValue?: string
    taskStatusId?: number
    visaId?: number
    chargeId?: number
  }>({
    defaultValues: {
      date: "",
      textValue: "",
      taskStatusId: 0,
      visaId: 0,
      chargeId: 0,
    },
  })

  // Reset form when field changes
  const handleFieldChange = (field: string) => {
    setSelectedField(field)
    bulkUpdateForm.reset({
      date: "",
      textValue: "",
      taskStatusId: 0,
      visaId: 0,
      chargeId: 0,
    })
  }

  // Task Forward Form State
  const [selectedJobOrder, setSelectedJobOrder] =
    useState<IJobOrderLookup | null>(null)

  const form = useForm<TaskForwardSchemaType>({
    defaultValues: {
      customerId: 0,
      jobOrderId: 0,
    },
  })

  // Helper function to safely invalidate queries and force refetch
  // This ensures tables refresh after task forwarding or bulk updates
  const safeInvalidateQueries = () => {
    const queryKeys = [
      "joborder",
      "agencyRemuneration",
      "consignmentExport",
      "consignmentImport",
      "crewMiscellaneous",
      "crewSignOff",
      "crewSignOn",
      "equipmentUsed",
      "freshWater",
      "landingItems",
      "launchServices",
      "medicalAssistance",
      "otherService",
      "portExpenses",
      "technicianSurveyor",
      "thirdParty",
      "taskCount",
    ]

    // Invalidate all queries that start with each query key
    // This matches queries with jobOrderId like ["portExpenses", "11171"]
    // Using refetchType: "active" ensures active queries (currently used by components) refetch immediately
    queryKeys.forEach((queryKey) => {
      try {
        queryClient.invalidateQueries({
          queryKey: [queryKey], // Match all queries starting with this key, regardless of additional params
          refetchType: "active", // Refetch active queries to refresh tables immediately
        })
      } catch (error) {
        // Silently handle individual query invalidation errors
        console.warn(`Failed to invalidate query ${queryKey}:`, error)
      }
    })
  }

  // Bulk Update Hook
  const bulkUpdateMutation = usePersist<BulkUpdateData>(
    "/operations/savebulkupdate"
  )

  // Task Forward Hook
  const taskForwardMutation = usePersist<TaskForwardData>(
    "/operations/savetaskforward"
  )

  // Bulk Update Handlers
  const handleBulkUpdate = async () => {
    if (!selectedField || !selectedFieldConfig || !jobData) {
      toast.error("Please select a field to update")
      return
    }

    // Validate multipleId is provided
    if (!multipleId || multipleId.trim() === "") {
      toast.error("No records selected for bulk update")
      return
    }

    try {
      const formValues = bulkUpdateForm.getValues()
      let fieldValue: string = ""

      // Get value based on field type and convert to string
      if (selectedFieldConfig.type === "date") {
        const dateValue = formValues.date || ""
        if (!dateValue) {
          toast.error("Please select a date")
          return
        }
        // Format date to yyyy-MM-dd format for API
        fieldValue = formatDateForApi(dateValue) || ""
      } else if (selectedFieldConfig.type === "text") {
        const textValue = formValues.textValue || ""
        if (!textValue || textValue.trim() === "") {
          toast.error("Please enter a value")
          return
        }
        fieldValue = textValue // Text is already a string
      } else if (selectedFieldConfig.type === "select") {
        if (selectedField === "taskStatusId") {
          const statusValue = formValues.taskStatusId || 0
          if (!statusValue || statusValue === 0) {
            toast.error("Please select a status")
            return
          }
          fieldValue = String(statusValue) // Convert number to string
        } else if (selectedField === "visaId") {
          const visaValue = formValues.visaId || 0
          if (!visaValue || visaValue === 0) {
            toast.error("Please select a visa type")
            return
          }
          fieldValue = String(visaValue) // Convert number to string
        } else if (selectedField === "chargeId") {
          const chargeValue = formValues.chargeId || 0
          if (!chargeValue || chargeValue === 0) {
            toast.error("Please select a charge")
            return
          }
          fieldValue = String(chargeValue)
        }
      }

      // Ensure multipleId is a comma-separated string
      // multipleId should already be a string (comma-separated IDs like "102,103,104")
      const multipleIdString = String(multipleId || "")

      const bulkUpdateData: BulkUpdateData = {
        jobOrderId: jobData.jobOrderId,
        taskId: taskId,
        multipleId: multipleIdString,
        fieldName: selectedField,
        fieldValue: fieldValue,
      }

      console.log("Bulk Update Data:", bulkUpdateData)

      const response = (await bulkUpdateMutation.mutateAsync(
        bulkUpdateData
      )) as ApiResponse<BulkUpdateData>

      // Check if the operation was successful (result=1)
      if (response && response.result === 1) {
        // Clear selections FIRST to prevent errors when accessing item.id on undefined items
        if (onClearSelection) {
          onClearSelection()
        }

        // Reset form
        setSelectedField("")
        bulkUpdateForm.reset()

        // Use requestAnimationFrame to ensure clear selection completes before invalidating
        // This prevents the table from trying to access item.id on undefined items
        requestAnimationFrame(() => {
          // Use setTimeout to allow React to process the state update from clear selection
          setTimeout(() => {
            safeInvalidateQueries()
          }, 50) // Small delay to allow clear selection state update to complete
        })

        toast.success("Bulk update completed successfully!")

        if (onTaskAdded) {
          onTaskAdded()
        }

        // Close the dialog on success
        if (onCancelAction) {
          onCancelAction()
        }
      } else {
        // Operation failed, keep dialog open
        const errorMessage = response?.message || "Bulk update failed"
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error in bulk update:", error)
      toast.error("Failed to perform bulk update")
      // Keep dialog open on error
    }
  }

  // Task Forward Handlers
  const handleJobOrderChange = (jobOrder: IJobOrderLookup | null) => {
    setSelectedJobOrder(jobOrder)
    form.setValue("jobOrderId", jobOrder?.jobOrderId || 0)
  }

  const handleTaskForward = async () => {
    if (selectedJobOrder && jobData) {
      try {
        const taskForwardData: TaskForwardData = {
          multipleId: multipleId || "",
          taskId: taskId || 0,
          previousJobOrderId: jobData.jobOrderId,
          targetJobOrderId: selectedJobOrder.jobOrderId,
          targetJobOrderNo: selectedJobOrder.jobOrderNo || "",
        }

        const response = (await taskForwardMutation.mutateAsync(
          taskForwardData
        )) as ApiResponse<TaskForwardData>

        // Check if the operation was successful (result=1)
        if (response && response.result === 1) {
          console.log(response, "response task forward")
          console.log(taskForwardData, "taskForwardData task forward")

          // Save target job order ID before resetting
          const targetJobOrderId = selectedJobOrder?.jobOrderId

          // Clear selections FIRST to prevent errors when accessing item.id on undefined items
          // This ensures the table clears selectedRowIds before data refreshes
          if (onClearSelection) {
            onClearSelection()
          }

          // Reset form
          setSelectedJobOrder(null)
          form.reset()

          // Use requestAnimationFrame to ensure clear selection completes before invalidating
          // This prevents the table from trying to access item.id on undefined items
          requestAnimationFrame(() => {
            // Use setTimeout to allow React to process the state update from clear selection
            setTimeout(() => {
              // Invalidate queries for both source and target job orders
              // This ensures tables refresh on both the source (where items were removed)
              // and target (where items were added) job orders
              safeInvalidateQueries()

              // Also explicitly invalidate queries for the target job order
              // in case the user has it open in another tab/window
              if (targetJobOrderId) {
                queryClient.invalidateQueries({
                  predicate: (query) => {
                    return (
                      Array.isArray(query.queryKey) &&
                      (query.queryKey[0] === "portExpenses" ||
                        query.queryKey[0] === "taskCount" ||
                        query.queryKey[0] === "joborder") &&
                      query.queryKey[1] === String(targetJobOrderId)
                    )
                  },
                  refetchType: "active",
                })
              }
            }, 50) // Small delay to allow clear selection state update to complete
          })

          // toast.success("Task forwarded successfully!")

          if (onTaskAdded) {
            onTaskAdded()
          }

          // Close the dialog on success
          if (onCancelAction) {
            onCancelAction()
          }
        } else {
          // Operation failed, keep dialog open
          const errorMessage = response?.message || "Task forward failed"
          toast.error(errorMessage)
        }
      } catch (error) {
        console.error("Error in task forward:", error)
        toast.error("Failed to forward task")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-[90vw] max-w-6xl overflow-y-auto"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mx-auto w-full max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            {jobData && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  Job Order: {jobData.jobOrderNo}
                </Badge>
              </div>
            )}
          </div>

          <Tabs defaultValue="bulk-update" className="w-full">
            <TabsList className="flex gap-2">
              <TabsTrigger
                value="bulk-update"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Bulk Update
              </TabsTrigger>
              <TabsTrigger
                value="task-forward"
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Task Forward
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bulk-update" className="mt-6">
              <Card className="border-2 border-dashed border-border bg-transparent">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <RefreshCw className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Bulk Update Operations
                      </CardTitle>
                      <CardDescription>
                        Update multiple records with a single operation
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="bulkField"
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        <FileText className="h-4 w-4" />
                        Select Field to Update
                      </Label>
                      <Select
                        value={selectedField}
                        onValueChange={handleFieldChange}
                        disabled={isConfirmed}
                      >
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder="Choose a field to update" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((field) => (
                            <SelectItem key={field.field} value={field.field}>
                              <div className="flex items-center gap-2">
                                {field.type === "date" && (
                                  <CalendarIcon className="h-4 w-4" />
                                )}
                                {field.type === "text" && (
                                  <FileText className="h-4 w-4" />
                                )}
                                {field.type === "select" && (
                                  <Database className="h-4 w-4" />
                                )}
                                {field.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedFieldConfig && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="bulkValue"
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          {selectedFieldConfig.type === "date" && (
                            <CalendarIcon className="h-4 w-4" />
                          )}
                          {selectedFieldConfig.type === "text" && (
                            <FileText className="h-4 w-4" />
                          )}
                          {selectedFieldConfig.type === "select" && (
                            <Database className="h-4 w-4" />
                          )}
                          Update {selectedFieldConfig.label}
                        </Label>
                        {selectedFieldConfig.type === "date" && (
                          <div className="relative">
                            <Input
                              id="bulkDate"
                              type="date"
                              {...bulkUpdateForm.register("date")}
                              className="h-11 w-full pr-10"
                              disabled={isConfirmed}
                            />
                            <CalendarIcon className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
                          </div>
                        )}
                        {selectedFieldConfig.type === "text" && (
                          <Textarea
                            id="bulkText"
                            {...bulkUpdateForm.register("textValue")}
                            placeholder={`Enter ${selectedFieldConfig.label.toLowerCase()}`}
                            className="h-20 w-full"
                            disabled={isConfirmed}
                          />
                        )}
                        {selectedFieldConfig.type === "select" &&
                          selectedField === "taskStatusId" && (
                            <TaskStatusAutocomplete
                              form={bulkUpdateForm}
                              name="taskStatusId"
                              label=""
                              isDisabled={isConfirmed}
                              isRequired={true}
                            />
                          )}
                        {selectedFieldConfig.type === "select" &&
                          selectedField === "chargeId" && (
                            <ChargeAutocomplete
                              form={bulkUpdateForm}
                              name="chargeId"
                              label=""
                              isDisabled={isConfirmed}
                              isRequired={true}
                            />
                          )}
                        {selectedFieldConfig.type === "select" &&
                          selectedField === "visaId" && (
                            <VisaAutocomplete
                              form={bulkUpdateForm}
                              name="visaId"
                              label=""
                              isDisabled={isConfirmed}
                              isRequired={true}
                            />
                          )}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {selectedField && selectedFieldConfig && (
                    <div className="rounded-lg border border-border bg-card/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          Update Summary
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Will update <strong>{selectedFieldConfig.label}</strong>
                        {selectedFieldConfig.type === "date" &&
                          bulkUpdateForm.watch("date") && (
                            <>
                              {" "}
                              to{" "}
                              <strong>
                                {formatDateForDisplay(
                                  bulkUpdateForm.watch("date") || ""
                                )}
                              </strong>
                            </>
                          )}
                        {selectedFieldConfig.type === "text" &&
                          bulkUpdateForm.watch("textValue") && (
                            <>
                              {" "}
                              to{" "}
                              <strong>
                                {bulkUpdateForm.watch("textValue")}
                              </strong>
                            </>
                          )}
                        {selectedFieldConfig.type === "select" &&
                          (bulkUpdateForm.watch("taskStatusId") ||
                            bulkUpdateForm.watch("visaId") ||
                            bulkUpdateForm.watch("chargeId")) && (
                            <> to the selected value</>
                          )}{" "}
                        for all selected records.
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-3">
                    <Button
                      onClick={handleBulkUpdate}
                      disabled={
                        isConfirmed ||
                        !selectedField ||
                        !selectedFieldConfig ||
                        bulkUpdateMutation.isPending ||
                        (selectedFieldConfig?.type === "date" &&
                          !bulkUpdateForm.watch("date")) ||
                        (selectedFieldConfig?.type === "text" &&
                          !bulkUpdateForm.watch("textValue")) ||
                        (selectedFieldConfig?.type === "select" &&
                          selectedField === "taskStatusId" &&
                          !bulkUpdateForm.watch("taskStatusId")) ||
                        (selectedFieldConfig?.type === "select" &&
                          selectedField === "chargeId" &&
                          !bulkUpdateForm.watch("chargeId")) ||
                        (selectedFieldConfig?.type === "select" &&
                          selectedField === "visaId" &&
                          !bulkUpdateForm.watch("visaId"))
                      }
                      className="h-10 min-w-[140px]"
                      size="default"
                    >
                      {bulkUpdateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Update All
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onCancelAction}
                      className="h-10"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="task-forward" className="mt-6">
              <Card className="border-2 border-dashed border-green-200 bg-transparent">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <ArrowRight className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Task Forward Operations
                      </CardTitle>
                      <CardDescription>
                        Forward tasks to different job orders or customers
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4" />
                        Target Job Order
                      </Label>
                      <JobOrderCustomerAutocomplete
                        form={form}
                        name="jobOrderId"
                        label="JobOrder No"
                        isDisabled={isConfirmed}
                        isRequired={true}
                        onChangeEvent={handleJobOrderChange}
                        customerId={jobData?.customerId || 0}
                        jobOrderId={jobData?.jobOrderId || 0}
                      />
                    </div>

                    {/* Current Job Order Info */}
                    {jobData && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Current Job Order
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          Forwarding from: <strong>{jobData.jobOrderNo}</strong>
                        </p>
                      </div>
                    )}

                    {/* Target Job Order Info */}
                    {selectedJobOrder && (
                      <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            Target Job Order
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          Forwarding to:{" "}
                          <strong>{selectedJobOrder.jobOrderNo}</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <Button
                      onClick={handleTaskForward}
                      disabled={
                        isConfirmed ||
                        !selectedJobOrder ||
                        taskForwardMutation.isPending
                      }
                      className="h-10 min-w-[140px]"
                      size="default"
                    >
                      {taskForwardMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Forwarding...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Forward Task
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onCancelAction}
                      className="h-10"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CombinedFormsDialog
