"use client"

import React, { useState } from "react"
import { ITariffDt } from "@/interfaces/tariff"
import {
  TariffDtSchemaType,
  TariffHdSchemaType,
  tariffDtSchema,
} from "@/schemas/tariff"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { HelpCircle, XIcon } from "lucide-react"
import { UseFormReturn, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import CustomNumberInput from "@/components/custom/custom-number-input"

import { TariffDetailsTable } from "./tariff-details-table"

interface TariffDetailsFormProps {
  form: UseFormReturn<TariffHdSchemaType>
  tariffId: number
  companyId: number
  exhRate: number
  uomCode?: string
}

export function TariffDetailsForm({
  form,
  tariffId,
  companyId: _companyId,
  exhRate,
  uomCode,
}: TariffDetailsFormProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDetail, setEditingDetail] = useState<ITariffDt | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const detailsForm = useForm<TariffDtSchemaType>({
    resolver: zodResolver(tariffDtSchema),
    defaultValues: {
      tariffId: tariffId,
      itemNo: 0,
      displayRate: 0,
      basicRate: 0,
      minUnit: 0,
      maxUnit: 0,
      isMultiply: false,
      isAdditional: false,
      additionalUnit: 0,
      additionalRate: 0,
      editVersion: 0,
    },
  })

  const details = form.watch("data_details") || []

  const handleAdd = () => {
    setEditingDetail(null)
    setEditingIndex(null)
    detailsForm.reset({
      tariffId: tariffId,
      itemNo:
        details.length > 0 ? Math.max(...details.map((d) => d.itemNo)) + 1 : 1,
      displayRate: 0,
      basicRate: 0,
      minUnit: 0,
      maxUnit: 0,
      isMultiply: false,
      isAdditional: false,
      additionalUnit: 0,
      additionalRate: 0,
      editVersion: 0,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (detail: ITariffDt, index: number) => {
    setEditingDetail(detail)
    setEditingIndex(index)
    detailsForm.reset({
      tariffId: detail.tariffId,
      itemNo: detail.itemNo,
      displayRate: detail.displayRate,
      basicRate: detail.basicRate,
      minUnit: detail.minUnit,
      maxUnit: detail.maxUnit,
      isMultiply: detail.isMultiply,
      isAdditional: detail.isAdditional,
      additionalUnit: detail.additionalUnit,
      additionalRate: detail.additionalRate,
      editVersion: detail.editVersion,
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
    data: TariffDtSchemaType,
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
      }
      form.setValue("data_details", updatedDetails, {
        shouldDirty: true,
        shouldTouch: true,
      })
      toast.success("Detail updated successfully")
    } else {
      // Add new detail
      const newDetail: ITariffDt = {
        ...data,
      }
      form.setValue("data_details", [...currentDetails, newDetail], {
        shouldDirty: true,
        shouldTouch: true,
      })
      toast.success("Detail added successfully")
    }

    // Trigger validation after updating data_details
    form.trigger("data_details")
    // Also trigger full form validation to update error state
    form.trigger()
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

  // Watch isAdditional for conditional fields
  const isAdditional = detailsForm.watch("isAdditional")

  // Basic rate = local (display) rate / exchange rate.
  // Do not parse e.target.value — NumericFormat uses thousand separators (e.g. "2,449.67")
  // and parseFloat would read 2 instead of 2449.67.
  const handleDisplayRateBlur = React.useCallback(() => {
    const raw = detailsForm.getValues("displayRate")
    const displayRate = typeof raw === "number" && !Number.isNaN(raw) ? raw : 0

    if (displayRate > 0 && exhRate > 0) {
      const basicRate = displayRate / exhRate
      detailsForm.setValue("basicRate", Number(basicRate.toFixed(amtDec)))
      detailsForm.trigger("basicRate")
    } else if (displayRate === 0) {
      detailsForm.setValue("basicRate", 0)
    }
  }, [exhRate, detailsForm, amtDec])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Badge
          variant="outline"
          className="border-indigo-400 bg-gradient-to-r from-indigo-100 to-indigo-200 text-sm font-medium text-indigo-800 shadow-sm"
        >
          <span className="mr-1.5">•</span>Tariff Details
        </Badge>
      </div>

      <TariffDetailsTable
        data={details}
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

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="flex-1">
                {editingDetail ? "Edit Detail" : "Add Detail"}
                {" Uom : "} {uomCode}
              </DialogTitle>
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
                  <div className="space-y-4">
                    <p className="text-sm font-semibold">Field help</p>
                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-foreground mb-0.5 font-semibold">
                          Local Rate
                        </p>
                        <p className="text-muted-foreground">
                          The rate displayed in your local currency. This is the
                          amount customers will see. The system automatically
                          calculates the Basic Rate by dividing this value by
                          the Exchange Rate when you leave this field.
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground mb-0.5 font-semibold">
                          Minimum Slab
                        </p>
                        <p className="text-muted-foreground">
                          The minimum quantity/unit range for which this rate
                          applies. This rate will be used when the quantity is
                          equal to or greater than this value and less than or
                          equal to the Maximum Slab.
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground mb-0.5 font-semibold">
                          Maximum Slab
                        </p>
                        <p className="text-muted-foreground">
                          The maximum quantity/unit range for which this rate
                          applies. This rate will be used when the quantity is
                          between the Minimum Slab and this value (inclusive).
                          If you need rates for higher quantities, create
                          additional tariff details with different slab ranges.
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground mb-0.5 font-semibold">
                          Additional Charges
                        </p>
                        <p className="text-muted-foreground">
                          Enable this option to apply additional charges beyond
                          the base rate. When enabled, you can specify an
                          Additional Slab (quantity threshold) and Additional
                          Rate (charge per unit) that applies when the quantity
                          exceeds the specified threshold. This is useful for
                          tiered pricing structures.
                        </p>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <DialogDescription>
              {editingDetail
                ? "Update tariff detail information"
                : "Add a new tariff detail"}
            </DialogDescription>
          </DialogHeader>
          <Form {...detailsForm}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                detailsForm.handleSubmit((data) => handleSaveDetail(data, e))()
              }}
              className="space-y-3"
            >
              <div className="bg-card grid grid-cols-4 gap-2 rounded-lg border p-2 shadow-sm">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium">Local Rate</label>
                    <span className="text-sm text-red-500">*</span>
                  </div>
                  <CustomNumberInput
                    form={detailsForm}
                    name="displayRate"
                    label=""
                    isRequired
                    round={amtDec}
                    onBlurEvent={handleDisplayRateBlur}
                  />
                </div>
                <CustomNumberInput
                  form={detailsForm}
                  name="basicRate"
                  label="Basic Rate"
                  isRequired
                  round={amtDec}
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium">Min Slab</label>
                    <span className="text-sm text-red-500">*</span>
                  </div>
                  <CustomNumberInput
                    form={detailsForm}
                    name="minUnit"
                    label=""
                    isRequired
                    round={amtDec}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium">Max Slab</label>
                    <span className="text-sm text-red-500">*</span>
                  </div>
                  <CustomNumberInput
                    form={detailsForm}
                    name="maxUnit"
                    label=""
                    isRequired
                    round={amtDec}
                  />
                </div>
              </div>
              <div className="bg-card grid grid-cols-4 gap-2 rounded-lg border p-2 shadow-sm">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium">Is Multiply</label>
                  </div>
                  <CustomCheckbox
                    form={detailsForm}
                    name="isMultiply"
                    label=""
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium">Additional</label>
                  </div>
                  <CustomCheckbox
                    form={detailsForm}
                    name="isAdditional"
                    label=""
                  />
                </div>
                <CustomNumberInput
                  form={detailsForm}
                  name="additionalUnit"
                  label="Additional Slab"
                  isRequired={isAdditional}
                  isDisabled={!isAdditional}
                  round={amtDec}
                />
                <CustomNumberInput
                  form={detailsForm}
                  name="additionalRate"
                  label="Additional Rate"
                  isRequired={isAdditional}
                  isDisabled={!isAdditional}
                  round={amtDec}
                />
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
                <Button type="submit">
                  {editingDetail ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
