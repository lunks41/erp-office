"use client"

import { useEffect } from "react"
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { Plus, Trash2 } from "lucide-react"

import {
  DocumentHeaderViewModel,
  SaveDocumentDetailViewModel,
  SaveDocumentWithDetailsViewModel,
} from "@/interfaces/document-expiry-view-model"
import { IDocExpiryDocumentTypeLookup } from "@/interfaces/lookup"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import CompanyAutocomplete from "@/components/autocomplete/autocomplete-company"
import {
  DocExpiryDocumentCategoryAutocomplete,
  DocExpiryDocumentTypeAutocomplete,
} from "@/components/autocomplete"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"
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

function toFormDate(value?: string | null) {
  if (!value) return ""
  const parsed = parseDate(value)
  if (!parsed) return ""
  return format(parsed, clientDateFormat)
}

function displayLineItemNo(
  details: SaveDocumentDetailViewModel[],
  index: number
): string {
  const itemNo = details[index]?.itemNo ?? 0
  if (itemNo > 0) return String(itemNo)
  const max = details.reduce((m, d) => Math.max(m, d.itemNo ?? 0), 0)
  return String(max + 1)
}

const emptyLine = (): SaveDocumentDetailViewModel => ({
  itemNo: 0,
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
        : [emptyLine()],
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
      details: [emptyLine()],
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

  const formCompat = form as UseFormReturn<Record<string, unknown>>

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Header</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <CompanyAutocomplete
              form={formCompat}
              name="companyId"
              label="Company"
              isRequired
            />

            <CustomInput
              form={formCompat}
              name="documentTitle"
              label="Document title"
              isRequired
              className="md:col-span-2"
            />

            <DocExpiryDocumentCategoryAutocomplete
              form={formCompat}
              name="documentCategoryId"
              label="Category"
              isRequired
            />
          </div>

          <CustomTextarea
            form={formCompat}
            name="description"
            label="Description"
            minRows={2}
          />

          <CustomTextarea
            form={formCompat}
            name="remarks"
            label="Header remarks"
            minRows={2}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Document lines</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyLine())}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add line
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Line</TableHead>
                  <TableHead className="min-w-[160px]">Type</TableHead>
                  <TableHead>Doc no.</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell className="text-muted-foreground align-top pt-3 text-center text-sm tabular-nums">
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
                        onChangeEvent={(type: IDocExpiryDocumentTypeLookup | null) => {
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
                    <TableCell className="align-top pt-2">
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
