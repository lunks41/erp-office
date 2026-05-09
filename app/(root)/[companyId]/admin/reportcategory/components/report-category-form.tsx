"use client"

import { useEffect } from "react"
import { IReportCategory } from "@/interfaces/admin"
import {
  ReportCategorySchemaType,
  reportCategorySchema,
} from "@/schemas/admin"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import CustomInput from "@/components/custom/custom-input"
import CustomTextarea from "@/components/custom/custom-textarea"

const defaultValues: ReportCategorySchemaType = {
  repCategoryId: 0,
  repCategoryCode: "",
  repCategoryName: "",
  remarks: "",
}

function fromRow(r: IReportCategory): ReportCategorySchemaType {
  return {
    repCategoryId: r.repCategoryId ?? 0,
    repCategoryCode: r.repCategoryCode ?? "",
    repCategoryName: r.repCategoryName ?? "",
    remarks: r.remarks ?? "",
  }
}

interface ReportCategoryFormProps {
  initialData?: IReportCategory
  submitAction: (data: ReportCategorySchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onSaveConfirmation?: (data: ReportCategorySchemaType) => void
}

export function ReportCategoryForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onSaveConfirmation,
}: ReportCategoryFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const form = useForm<ReportCategorySchemaType>({
    resolver: zodResolver(reportCategorySchema),
    defaultValues: initialData ? fromRow(initialData) : defaultValues,
  })

  useEffect(() => {
    form.reset(initialData ? fromRow(initialData) : defaultValues)
  }, [initialData, form])

  const onSubmit = (data: ReportCategorySchemaType) => {
    if (onSaveConfirmation) onSaveConfirmation(data)
    else submitAction(data)
  }

  const isEdit = Boolean(initialData?.repCategoryId)

  return (
    <div className="flex max-h-[min(85vh,720px)] flex-col gap-4 overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <CustomInput
              form={form}
              name="repCategoryCode"
              label="Category code"
              isRequired
              isDisabled={isReadOnly || isEdit}
              placeholder="Unique code"
            />
            <CustomInput
              form={form}
              name="repCategoryName"
              label="Category name"
              isRequired
              isDisabled={isReadOnly}
              placeholder="Display name"
            />
          </fieldset>
          <CustomTextarea
            form={form}
            name="remarks"
            label="Remarks"
            isDisabled={isReadOnly}
          />

          {isEdit && initialData && (
            <AuditTrailAccordion
              createBy={initialData.createBy}
              createDate={initialData.createDate}
              editBy={initialData.editBy}
              editDate={initialData.editDate}
              datetimeFormat={datetimeFormat}
            />
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onCancelAction}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : isEdit ? "Update" : "Create"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
