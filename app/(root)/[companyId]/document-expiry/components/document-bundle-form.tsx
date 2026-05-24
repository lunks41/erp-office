"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import {
  DocumentHeaderViewModel,
  SaveDocumentDetailViewModel,
  SaveDocumentWithDetailsViewModel,
} from "@/interfaces/document-expiry-view-model"
import { IDocExpiryDocumentTypeLookup } from "@/interfaces/lookup"
import { format } from "date-fns"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import {
  buildDocumentBundlePayload,
  validateDocumentBundleSave,
} from "@/lib/document-expiry-validation"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DocExpiryDocumentCategoryAutocomplete,
  DocExpiryDocumentTypeAutocomplete,
} from "@/components/autocomplete"
import CompanyAutocomplete from "@/components/autocomplete/autocomplete-company"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

function toFormDate(value?: string | null) {
  if (!value) return ""
  const parsed = parseDate(value)
  if (!parsed) return ""
  return format(parsed, clientDateFormat)
}

function nextLineItemNo(details: SaveDocumentDetailViewModel[]): number {
  const max = details.reduce((m, d) => Math.max(m, d.itemNo ?? 0), 0)
  return max + 1
}

function displayLineItemNo(
  details: SaveDocumentDetailViewModel[],
  index: number
): string {
  const itemNo = details[index]?.itemNo ?? 0
  return String(itemNo > 0 ? itemNo : index + 1)
}

const createEmptyLine = (itemNo: number): SaveDocumentDetailViewModel => ({
  itemNo,
  documentTypeId: 0,
  documentNo: "",
  issueDate: "",
  expiryDate: "",
  reminderDays: 30,
  isMandatory: false,
  remarks: "",
})

function headerToFormValues(
  header: DocumentHeaderViewModel
): SaveDocumentWithDetailsViewModel {
  return {
    documentId: header.documentId,
    companyId: header.companyId,
    branchId: header.branchId ?? undefined,
    documentCategoryId: header.documentCategoryId,
    documentTitle: header.documentTitle,
    description: header.description ?? "",
    remarks: header.remarks ?? "",
    details:
      header.details.length > 0
        ? header.details.map((d) => ({
            itemNo: d.itemNo,
            documentTypeId: d.documentTypeId,
            documentNo: d.documentNo ?? "",
            issueDate: toFormDate(d.issueDate),
            expiryDate: toFormDate(d.expiryDate),
            reminderDays: d.reminderDays,
            isMandatory: d.isMandatory,
            remarks: d.remarks ?? "",
          }))
        : [createEmptyLine(1)],
  }
}

export function DocumentBundleForm({
  header,
  onSubmit,
  isSubmitting,
  isLoading,
}: {
  header?: DocumentHeaderViewModel | null
  onSubmit: (values: SaveDocumentWithDetailsViewModel) => void
  isSubmitting?: boolean
  isLoading?: boolean
}) {
  const params = useParams()
  const routeCompanyId = Number(params.companyId ?? 0)

  const form = useForm<SaveDocumentWithDetailsViewModel>({
    defaultValues: {
      documentId: 0,
      companyId: routeCompanyId || 0,
      documentCategoryId: 0,
      documentTitle: "",
      description: "",
      remarks: "",
      details: [createEmptyLine(1)],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "details",
  })

  useEffect(() => {
    if (header) {
      form.reset(headerToFormValues(header))
    } else if (routeCompanyId > 0) {
      form.setValue("companyId", routeCompanyId)
    }
  }, [header, form, routeCompanyId])

  const details = form.watch("details")

  const formCompat = form as unknown as UseFormReturn<Record<string, unknown>>

  const handleFormSubmit = (values: SaveDocumentWithDetailsViewModel) => {
    const validationError = validateDocumentBundleSave(values)
    if (validationError) {
      toast.error(validationError)
      return
    }
    onSubmit(buildDocumentBundlePayload(values))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Header</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <CompanyAutocomplete
              form={formCompat}
              name="companyId"
              label="Company"
              isRequired
            />
            <DocExpiryDocumentCategoryAutocomplete
              form={formCompat}
              name="documentCategoryId"
              label="Category"
              isRequired
            />

            <CustomInput
              form={formCompat}
              name="documentTitle"
              label="Document title"
              isRequired
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
            <CustomTextarea
              form={formCompat}
              name="description"
              label="Description"
              minRows={2}
              className="w-full min-w-0"
            />

            <CustomTextarea
              form={formCompat}
              name="remarks"
              label="Header remarks"
              minRows={2}
              className="w-full min-w-0"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Document lines</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = form.getValues("details") ?? []
                append(createEmptyLine(nextLineItemNo(current)))
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add line
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Item no.</TableHead>
                  <TableHead className="min-w-[220px]">Type</TableHead>
                  <TableHead className="min-w-[120px]">Doc no.</TableHead>
                  <TableHead className="min-w-[150px]">Issue</TableHead>
                  <TableHead className="min-w-[150px]">Expiry</TableHead>
                  <TableHead className="min-w-[90px]">Reminder</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell className="text-muted-foreground pt-3 text-center align-top text-sm tabular-nums">
                      <input
                        type="hidden"
                        {...form.register(`details.${index}.itemNo`, {
                          valueAsNumber: true,
                        })}
                      />
                      {displayLineItemNo(details ?? [], index)}
                    </TableCell>
                    <TableCell className="align-top">
                      <DocExpiryDocumentTypeAutocomplete
                        form={formCompat}
                        name={`details.${index}.documentTypeId`}
                        label=""
                        isRequired
                        onChangeEvent={(
                          type: IDocExpiryDocumentTypeLookup | null
                        ) => {
                          if (!type) return
                          if (type.defaultReminderDays) {
                            form.setValue(
                              `details.${index}.reminderDays`,
                              type.defaultReminderDays
                            )
                          }
                          if (type.isMandatory) {
                            form.setValue(`details.${index}.isMandatory`, true)
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <CustomInput
                        form={formCompat}
                        name={`details.${index}.documentNo`}
                        label=""
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <CustomDateNew
                        form={formCompat}
                        name={`details.${index}.issueDate`}
                        label=""
                        isFutureShow
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <CustomDateNew
                        form={formCompat}
                        name={`details.${index}.expiryDate`}
                        label=""
                        isRequired
                        isFutureShow
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <CustomNumberInput
                        form={formCompat}
                        name={`details.${index}.reminderDays`}
                        label=""
                        round={0}
                      />
                    </TableCell>
                    <TableCell className="pt-2 align-top">
                      <CustomCheckbox
                        form={formCompat}
                        name={`details.${index}.isMandatory`}
                        label=""
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving…"
              : header
                ? "Update record"
                : "Create record"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
