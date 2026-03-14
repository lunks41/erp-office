"use client"

import React, { useEffect, useState } from "react"
import { IEmployeeLookup, ILeaveTypeLookup } from "@/interfaces/lookup"
import { LeaveRequestSchemaType, leaveRequestSchema } from "@/schemas/leave"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, Upload, X } from "lucide-react"
import { useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormLabel } from "@/components/ui/form"
import {
  EmployeeAutocomplete,
  LeaveTypeAutocomplete,
} from "@/components/autocomplete"
import { formatDateForApi } from "@/lib/date-utils"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomTextarea from "@/components/custom/custom-textarea"

interface LeaveRequestFormProps {
  onSubmit: (data: LeaveRequestSchemaType) => Promise<void>
}

export function LeaveRequestForm({ onSubmit }: LeaveRequestFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])

  // Listen for custom event to open the form
  useEffect(() => {
    const handleOpenForm = () => {
      setOpen(true)
    }

    window.addEventListener("openLeaveRequestForm", handleOpenForm)
    return () => {
      window.removeEventListener("openLeaveRequestForm", handleOpenForm)
    }
  }, [])

  const form = useForm<LeaveRequestSchemaType>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      employeeId: 0,
      leaveTypeId: 1,
      startDate: "",
      endDate: "",
      totalDays: 0,
      reason: "",
      attachments: "",
    },
  })

  // Watch for date changes and update totalDays
  useEffect(() => {
    const startDate = form.watch("startDate")
    const endDate = form.watch("endDate")

    if (startDate && endDate) {
      const calculatedDays = calculateDays()
      form.setValue("totalDays", calculatedDays)
    } else {
      form.setValue("totalDays", 0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- form.watch in deps intentionally; adding calculateDays causes unnecessary recalc
  }, [form.watch("startDate"), form.watch("endDate"), form])

  const handleSubmit = async (data: LeaveRequestSchemaType) => {
    try {
      setLoading(true)

      // Ensure totalDays is calculated and included
      const calculatedDays = calculateDays()
      // Format dates for API submission
      const formData = {
        ...data,
        startDate: formatDateForApi(data.startDate) || "",
        endDate: formatDateForApi(data.endDate) || "",
        totalDays: calculatedDays,
        attachments: attachments.join(","),
      }

      await onSubmit(formData)
      setOpen(false)
      form.reset()
      setAttachments([])
    } catch (error) {
      console.error("Failed to submit leave request:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      // In a real app, you would upload files to server and get URLs
      const newAttachments = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      )
      setAttachments((prev) => [...prev, ...newAttachments])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const calculateDays = () => {
    const startDate = form.watch("startDate")
    const endDate = form.watch("endDate")

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    }
    return 0
  }

  const handleEmployeeChange = (selectedOption: IEmployeeLookup | null) => {
    if (selectedOption) {
      form.setValue("employeeId", selectedOption.employeeId)
    } else {
      form.setValue("employeeId", 0)
    }
  }

  const handleLeaveTypeChange = (selectedOption: ILeaveTypeLookup | null) => {
    if (selectedOption) {
      form.setValue("leaveTypeId", selectedOption.leaveTypeId)
    } else {
      form.setValue("leaveTypeId", 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pt-4"
          >
            {/* Employee Selection */}
            <EmployeeAutocomplete
              form={form}
              name="employeeId"
              label=""
              isRequired={true}
              onChangeEvent={handleEmployeeChange}
            />

            {/* Leave Type Selection */}
            <LeaveTypeAutocomplete
              form={form}
              name="leaveTypeId"
              label=""
              isRequired={true}
              onChangeEvent={handleLeaveTypeChange}
            />

            {/* Date Range */}

            <CustomDateNew
              form={form}
              name="startDate"
              label="Start Date"
              isRequired={true}
            />
            <CustomDateNew
              form={form}
              name="endDate"
              label="End Date"
              isRequired={true}
            />

            {/* Days Calculation */}
            {calculateDays() > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Days:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{calculateDays()} days</Badge>
                      <span className="text-muted-foreground text-xs">
                        (Form value: {form.watch("totalDays")})
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reason */}
            <CustomTextarea
              form={form}
              name="reason"
              label="Reason for Leave"
              isRequired={true}
            />

            {/* Attachments */}
            <div className="space-y-2">
              <FormLabel>Attachments (Optional)</FormLabel>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </div>
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm">Attachment {index + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
