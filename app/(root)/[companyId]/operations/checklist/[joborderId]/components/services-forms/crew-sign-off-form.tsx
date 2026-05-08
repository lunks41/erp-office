"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { ICrewSignOff, IJobOrderHd } from "@/interfaces/checklist"
import { CrewSignOffSchema, CrewSignOffSchemaType } from "@/schemas/checklist"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { Task } from "@/lib/operations-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  ChargeAutocomplete,
  CountryAutocomplete,
  RankAutocomplete,
  TaskStatusAutocomplete,
  VisaAutocomplete,
} from "@/components/autocomplete"
import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface CrewSignOffFormProps {
  jobData: IJobOrderHd
  initialData?: ICrewSignOff
  taskDefaults?: Record<string, number> // Add taskDefaults prop
  submitAction: (data: CrewSignOffSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
}

export function CrewSignOffForm({
  jobData,
  initialData,
  taskDefaults = {}, // Default to empty object
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
}: CrewSignOffFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<CrewSignOffSchemaType>({
    mode: "onChange",
    resolver: zodResolver(CrewSignOffSchema),
    defaultValues: {
      crewSignOffId: initialData?.crewSignOffId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.CrewSignOff,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,

      visaId: initialData?.visaId ?? taskDefaults.visaId ?? 0,
      crewName: initialData?.crewName ?? "",
      nationalityId: initialData?.nationalityId ?? 0,
      rankId: initialData?.rankId ?? 0,
      flightDetails: initialData?.flightDetails ?? "",
      hotelName: initialData?.hotelName ?? "",
      departureDetails: initialData?.departureDetails ?? "",
      transportName: initialData?.transportName ?? "",
      clearing: initialData?.clearing ?? "",
      taskStatusId:
        initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 807,
      remarks: initialData?.remarks ?? "",
      overStayRemark: initialData?.overStayRemark ?? "",
      modificationRemark: initialData?.modificationRemark ?? "",
      cidClearance: initialData?.cidClearance ?? "",
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      editVersion: initialData?.editVersion ?? 0,
    },
  })

  useEffect(() => {
    form.reset({
      crewSignOffId: initialData?.crewSignOffId ?? 0,
      jobOrderId: jobData.jobOrderId,
      jobOrderNo: jobData.jobOrderNo,
      taskId: Task.CrewSignOff,
      chargeId: initialData?.chargeId ?? taskDefaults.chargeId ?? 0,

      visaId: initialData?.visaId ?? taskDefaults.visaId ?? 0,
      crewName: initialData?.crewName ?? "",
      nationalityId: initialData?.nationalityId ?? 0,
      rankId: initialData?.rankId ?? 0,
      flightDetails: initialData?.flightDetails ?? "",
      hotelName: initialData?.hotelName ?? "",
      departureDetails: initialData?.departureDetails ?? "",
      transportName: initialData?.transportName ?? "",
      clearing: initialData?.clearing ?? "",
      taskStatusId:
        initialData?.taskStatusId ?? taskDefaults.taskStatusId ?? 807,
      remarks: initialData?.remarks ?? "",
      overStayRemark: initialData?.overStayRemark ?? "",
      modificationRemark: initialData?.modificationRemark ?? "",
      cidClearance: initialData?.cidClearance ?? "",
      debitNoteId: initialData?.debitNoteId ?? 0,
      debitNoteNo: initialData?.debitNoteNo ?? "",
      poNo: initialData?.poNo ?? "",
      editVersion: initialData?.editVersion ?? 0,
    })
  }, [initialData, taskDefaults, form, jobData.jobOrderId, jobData.jobOrderNo])

  const onSubmit = (data: CrewSignOffSchemaType) => {
    submitAction(data)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            {/* Main Information Card */}

            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                form={form}
                name="crewName"
                label="Crew Name"
                isRequired
                isDisabled={isConfirmed}
              />
              <CountryAutocomplete
                form={form}
                name="nationalityId"
                label="Nationality"
                isRequired
                isDisabled={isConfirmed}
              />
              <RankAutocomplete
                form={form}
                name="rankId"
                label="Rank"
                isDisabled={isConfirmed}
                isRequired
              />
              <ChargeAutocomplete
                form={form}
                name="chargeId"
                label="Charge Name"
                isRequired={true}
                isDisabled={isConfirmed}
              />
              <VisaAutocomplete
                form={form}
                name="visaId"
                label="Visa Type"
                isRequired
                isDisabled={isConfirmed}
              />
              <CustomInput
                form={form}
                name="poNo"
                label="PO No"
                isDisabled={isConfirmed}
              />

              <TaskStatusAutocomplete
                form={form}
                name="taskStatusId"
                label="Status"
                isRequired={true}
                isDisabled={isConfirmed}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <CustomTextarea
                form={form}
                name="transportName"
                label="Transport Details"
                isDisabled={isConfirmed}
              />
              <CustomTextarea
                form={form}
                name="hotelName"
                label="Hotel Name"
                isDisabled={isConfirmed}
              />
              <CustomTextarea
                form={form}
                name="flightDetails"
                label="Flight Details"
                isDisabled={isConfirmed}
              />
              <CustomTextarea
                form={form}
                name="departureDetails"
                label="Departure Details"
                isDisabled={isConfirmed}
              />

              <CustomTextarea
                form={form}
                name="clearing"
                label="Clearing Details"
                isDisabled={isConfirmed}
              />

              <CustomTextarea
                form={form}
                name="overStayRemark"
                label="Over Stay Remark"
                isDisabled={isConfirmed}
              />
              <CustomTextarea
                form={form}
                name="modificationRemark"
                label="Modification Remark"
                isDisabled={isConfirmed}
              />
              <CustomTextarea
                form={form}
                name="cidClearance"
                label="CID Clearance"
                isDisabled={isConfirmed}
              />

              <CustomTextarea
                form={form}
                name="remarks"
                label="Remarks"
                isDisabled={isConfirmed}
              />
            </div>

            {/* Audit Information Card */}
            {/* Audit Information Section */}
            {initialData &&
              (initialData.createBy ||
                initialData.createDate ||
                initialData.editBy ||
                initialData.editDate) && (
                <div className="space-y-3 pt-4">
                  <div className="border-t pt-4">
                    <CustomAccordion
                      type="single"
                      collapsible
                      className="bg-muted/30 rounded-lg border-0"
                    >
                      <CustomAccordionItem
                        value="audit-info"
                        className="border-none"
                      >
                        <CustomAccordionTrigger className="hover:bg-muted/50 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                              Audit Trail
                            </span>
                            <div className="flex items-center gap-2">
                              {initialData.createDate && (
                                <Badge
                                  variant="secondary"
                                  className="px-2 py-1 text-xs"
                                >
                                  Created
                                </Badge>
                              )}
                              {initialData.editDate && (
                                <Badge
                                  variant="secondary"
                                  className="px-2 py-1 text-xs"
                                >
                                  Modified
                                </Badge>
                              )}
                              {initialData.editVersion > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="px-2 py-1 text-xs"
                                >
                                  Edit Version No. {initialData.editVersion}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CustomAccordionTrigger>
                        <CustomAccordionContent className="px-4 pb-4">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {initialData.createDate && (
                              <div className="bg-background rounded-md border p-2">
                                <div className="space-y-1">
                                  <p className="text-muted-foreground text-xs">
                                    Created By
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {initialData.createBy}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {format(
                                      new Date(initialData.createDate),
                                      datetimeFormat
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                            {initialData.editBy && (
                              <div className="bg-background rounded-md border p-2">
                                <div className="space-y-1">
                                  <p className="text-muted-foreground text-xs">
                                    Modified By
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {initialData.editBy}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {initialData.editDate
                                      ? format(
                                          new Date(initialData.editDate),
                                          datetimeFormat
                                        )
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CustomAccordionContent>
                      </CustomAccordionItem>
                    </CustomAccordion>
                  </div>
                </div>
              )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onCancelAction}>
              {isConfirmed ? "Close" : "Cancel"}
            </Button>
            {!isConfirmed && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className={
                  initialData
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
                }
              >
                {isSubmitting
                  ? "Saving..."
                  : initialData
                    ? "Update Crew Sign Off"
                    : "Add Crew Sign Off"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
