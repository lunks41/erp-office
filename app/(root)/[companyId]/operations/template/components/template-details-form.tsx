"use client"

import React, { useState } from "react"
import { ITemplateDt } from "@/interfaces/template"
import {
  TemplateDtSchemaType,
  TemplateHdSchemaType,
  templateDtSchema,
} from "@/schemas/template"
import { zodResolver } from "@hookform/resolvers/zod"
import { HelpCircle, XIcon } from "lucide-react"
import { UseFormReturn, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { ChargeAutocomplete } from "@/components/autocomplete"

import { TemplateDetailsTable } from "./template-details-table"

interface TemplateDetailsFormProps {
  form: UseFormReturn<TemplateHdSchemaType>
  taskId: number
  templateId: number
}

export function TemplateDetailsForm({
  form,
  taskId: _taskId,
  templateId,
}: TemplateDetailsFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDetail, setEditingDetail] = useState<ITemplateDt | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const detailsForm = useForm<TemplateDtSchemaType>({
    resolver: zodResolver(templateDtSchema),
    defaultValues: {
      templateId: templateId,
      itemNo: 0,
      chargeId: 0,
      remarks: "",
    },
  })

  const details = form.watch("data_details") || []

  const handleAdd = () => {
    setEditingDetail(null)
    setEditingIndex(null)
    detailsForm.reset({
      templateId: templateId,
      itemNo:
        details.length > 0 ? Math.max(...details.map((d) => d.itemNo)) + 1 : 1,
      chargeId: 0,
      remarks: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (detail: ITemplateDt, index: number) => {
    setEditingDetail(detail)
    setEditingIndex(index)
    detailsForm.reset({
      templateId: detail.templateId,
      itemNo: detail.itemNo,
      chargeId: detail.chargeId,
      chargeName: detail.chargeName,
      remarks: detail.remarks || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (index: number) => {
    const currentDetails = form.getValues("data_details") || []
    const updatedDetails = currentDetails.filter((_, i) => i !== index)
    form.setValue("data_details", updatedDetails, {
      shouldDirty: true,
      shouldTouch: true,
    })
    form.trigger("data_details")
    toast.success("Detail removed successfully")
  }

  const handleSaveDetail = (
    data: TemplateDtSchemaType,
    e?: React.BaseSyntheticEvent
  ) => {
    // Prevent event from bubbling to parent form
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const currentDetails = form.getValues("data_details") || []

    if (editingIndex !== null) {
      // Update existing detail
      const updatedDetails = [...currentDetails]
      updatedDetails[editingIndex] = {
        ...data,
        chargeName: detailsForm.getValues("chargeName"),
        remarks: data.remarks || "",
      }
      form.setValue("data_details", updatedDetails, {
        shouldDirty: true,
        shouldTouch: true,
      })
      toast.success("Detail updated successfully")
    } else {
      // Add new detail
      const newDetail: ITemplateDt = {
        ...data,
        chargeName: detailsForm.getValues("chargeName"),
        remarks: data.remarks || "",
      }
      form.setValue("data_details", [...currentDetails, newDetail], {
        shouldDirty: true,
        shouldTouch: true,
      })
      toast.success("Detail added successfully")
    }

    form.trigger("data_details")
    setIsDialogOpen(false)
    setEditingDetail(null)
    setEditingIndex(null)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingDetail(null)
    setEditingIndex(null)
    detailsForm.reset()
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-indigo-400 bg-linear-to-r from-indigo-100 to-indigo-200 text-sm font-medium text-indigo-800 shadow-sm"
          >
            <span className="mr-1.5">•</span>Template Details
          </Badge>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
                aria-label="Field help"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="left"
              align="end"
              className="max-h-[70vh] w-[320px] overflow-y-auto sm:w-[380px]"
            >
              <div className="space-y-3 text-xs">
                <p className="text-sm font-semibold">Field help</p>
                <div>
                  <p className="text-foreground mb-0.5 font-semibold">Charge</p>
                  <p className="text-muted-foreground">
                    Select the charge that this template detail line applies to.
                  </p>
                </div>
                <div>
                  <p className="text-foreground mb-0.5 font-semibold">Remarks</p>
                  <p className="text-muted-foreground">
                    Enter the template text for this charge. This will be used in
                    generated operations documents.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isDialogOpen && (
        <div className="mb-3 space-y-3">
          <Form {...detailsForm}>
            <div className="space-y-3">
              <div className="bg-card grid grid-cols-1 gap-2 rounded-lg border p-2 shadow-sm md:grid-cols-3">
                <div className="md:col-span-1">
                  <ChargeAutocomplete
                    form={detailsForm}
                    name="chargeId"
                    label="Charge"
                    isRequired
                    onChangeEvent={(selected) => {
                      if (selected) {
                        detailsForm.setValue("chargeName", selected.chargeName || "")
                      }
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormField
                    control={detailsForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={4}
                            className="resize-y"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="flex items-center gap-2"
                >
                  <XIcon className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    detailsForm.handleSubmit((data) => handleSaveDetail(data, e))()
                  }}
                >
                  {editingDetail ? "Edit" : "Add"}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}

      <TemplateDetailsTable
        data={details.map((d) => ({
          ...d,
          remarks: d.remarks || "",
        }))}
        onEditAction={(detail) => {
          const index = details.findIndex((d) => d.itemNo === detail.itemNo)
          if (index !== -1) {
            handleEdit(detail, index)
          }
        }}
        onDeleteAction={(detail) => {
          const index = details.findIndex((d) => d.itemNo === detail.itemNo)
          if (index !== -1) {
            handleDelete(index)
          }
        }}
        onCreateAction={handleAdd}
        canEdit={true}
        canDelete={true}
        canView={true}
        canCreate={true}
        createButtonText="Add Detail"
      />
    </div>
  )
}
