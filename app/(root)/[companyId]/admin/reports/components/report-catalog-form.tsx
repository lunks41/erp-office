"use client"

import { useEffect } from "react"
import { IReportCatalog } from "@/interfaces/admin"
import {
  ReportCatalogSaveSchemaType,
  reportCatalogSaveSchema,
} from "@/schemas/admin"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { Resolver, useForm } from "react-hook-form"

import ModuleAutocomplete from "@/components/autocomplete/autocomplete-module"
import ReportCategoryAutocomplete from "@/components/autocomplete/autocomplete-report-category"
import TransactionAutocomplete from "@/components/autocomplete/autocomplete-transaction"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"

const emptyDefaults: ReportCatalogFormValues = {
  moduleId: 0,
  reportId: 0,
  itemNo: 0,
  transactionId: 0,
  repCategoryId: 0,
  reportFolder: "",
  reportName: "",
  reportFileName: "",
  isScreen: false,
  isList: true,
  isCompSpecific: false,
  repParamGroup: 0,
  seqNo: 0,
  isActive: true,
}

function fromRow(r: IReportCatalog): ReportCatalogFormValues {
  return {
    moduleId: r.moduleId ?? 0,
    reportId: r.reportId ?? 0,
    itemNo: r.itemNo ?? 0,
    transactionId: r.transactionId ?? 0,
    repCategoryId: r.repCategoryId ?? 0,
    reportFolder: r.reportFolder ?? "",
    reportName: r.reportName ?? "",
    reportFileName: r.reportFileName ?? "",
    isScreen: r.isScreen ?? false,
    isList: r.isList ?? true,
    isCompSpecific: r.isCompSpecific ?? false,
    repParamGroup: r.repParamGroup ?? 0,
    seqNo: r.seqNo ?? 0,
    isActive: r.isActive ?? true,
  }
}

/** Satisfies autocomplete components (`Record<string, unknown>`). */
type ReportCatalogFormValues = ReportCatalogSaveSchemaType &
  Record<string, unknown>

interface ReportCatalogFormProps {
  initialData?: IReportCatalog
  submitAction: (data: ReportCatalogSaveSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
  onSaveConfirmation?: (data: ReportCatalogSaveSchemaType) => void
}

export function ReportCatalogForm({
  initialData,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
  onSaveConfirmation,
}: ReportCatalogFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<ReportCatalogFormValues>({
    resolver: zodResolver(
      reportCatalogSaveSchema
    ) as Resolver<ReportCatalogFormValues>,
    defaultValues: initialData ? fromRow(initialData) : emptyDefaults,
  })

  const moduleIdWatch = form.watch("moduleId")

  useEffect(() => {
    form.reset(initialData ? fromRow(initialData) : emptyDefaults)
  }, [initialData, form])

  const onSubmit = (data: ReportCatalogFormValues) => {
    const payload: ReportCatalogSaveSchemaType = {
      moduleId: data.moduleId,
      reportId: data.reportId,
      itemNo: data.itemNo,
      transactionId: data.transactionId,
      repCategoryId: data.repCategoryId,
      reportFolder: data.reportFolder,
      reportName: data.reportName,
      reportFileName: data.reportFileName,
      isScreen: data.isScreen,
      isList: data.isList,
      isCompSpecific: data.isCompSpecific,
      repParamGroup: data.repParamGroup,
      seqNo: data.seqNo,
      isActive: data.isActive,
    }
    if (onSaveConfirmation) onSaveConfirmation(payload)
    else submitAction(payload)
  }

  const isEdit = Boolean(initialData?.reportId && initialData?.itemNo)

  return (
    <div className="flex max-h-[min(85vh,720px)] flex-col gap-4 overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ModuleAutocomplete
              form={form}
              name="moduleId"
              label="Module"
              isRequired
              isDisabled={isReadOnly}
              onChangeEvent={() => {
                form.setValue("transactionId", 0)
              }}
            />
            <TransactionAutocomplete
              key={String(moduleIdWatch)}
              form={form}
              name="transactionId"
              label="Transaction"
              isRequired
              isDisabled={isReadOnly || !moduleIdWatch}
            />
            <ReportCategoryAutocomplete
              form={form}
              name="repCategoryId"
              label="Report category"
              isRequired
              isDisabled={isReadOnly}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CustomInput
              form={form}
              name="reportFolder"
              label="Report folder"
              isDisabled={isReadOnly}
              placeholder="e.g. cb"
            />
            <CustomInput
              form={form}
              name="reportName"
              label="Report name"
              isRequired
              isDisabled={isReadOnly}
            />
            <CustomInput
              form={form}
              name="reportFileName"
              label="Report file (.trdp)"
              isDisabled={isReadOnly}
              placeholder="Optional if screen report"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CustomInput
              form={form}
              name="reportId"
              label="Report ID"
              type="number"
              isDisabled={isReadOnly || !isEdit}
              placeholder={isEdit ? "" : "Auto on save"}
            />
            <CustomInput
              form={form}
              name="itemNo"
              label="Item no."
              type="number"
              isDisabled={isReadOnly || !isEdit}
              placeholder={isEdit ? "" : "Auto on save"}
            />
            <CustomInput
              form={form}
              name="seqNo"
              label="Seq no."
              type="number"
              isDisabled={isReadOnly}
            />
            <CustomInput
              form={form}
              name="repParamGroup"
              label="Param group"
              type="number"
              isDisabled={isReadOnly}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CustomSwitch
              form={form}
              name="isScreen"
              label="Screen report"
              isDisabled={isReadOnly}
            />
            <CustomSwitch
              form={form}
              name="isList"
              label="List"
              isDisabled={isReadOnly}
            />
            <CustomSwitch
              form={form}
              name="isCompSpecific"
              label="Company-specific"
              isDisabled={isReadOnly}
            />
            <CustomSwitch
              form={form}
              name="isActive"
              label="Active"
              isDisabled={isReadOnly}
            />
          </div>

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
