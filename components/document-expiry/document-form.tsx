"use client"

import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"

import { format } from "date-fns"

import { DocumentDto, SaveDocumentDto } from "@/interfaces/document-expiry"
import { IDocExpiryDocumentTypeLookup } from "@/interfaces/lookup"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import {
  DocExpiryDocumentCategoryAutocomplete,
  DocExpiryDocumentTypeAutocomplete,
  DocExpiryReferenceTypeAutocomplete,
} from "@/components/autocomplete"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"

import { DocExpiryReferenceEntityField } from "./doc-expiry-reference-entity"

function toFormDate(value?: string | null) {
  if (!value) return ""
  const parsed = parseDate(value)
  if (!parsed) return ""
  return format(parsed, clientDateFormat)
}

export function DocumentForm({
  document,
  onSubmit,
  isSubmitting,
  isLoading,
}: {
  document?: DocumentDto | null
  onSubmit: (values: SaveDocumentDto) => void
  isSubmitting?: boolean
  isLoading?: boolean
}) {
  const form = useForm<SaveDocumentDto>({
    defaultValues: {
      documentId: 0,
      documentTypeId: 0,
      documentCategoryId: 0,
      referenceTypeId: 0,
      referenceId: 0,
      documentTitle: "",
      isMandatory: false,
      expiryDate: "",
    },
  })

  useEffect(() => {
    if (document) {
      form.reset({
        documentId: document.documentId,
        branchId: document.branchId ?? undefined,
        documentTypeId: document.documentTypeId,
        documentCategoryId: document.documentCategoryId,
        referenceTypeId: document.referenceTypeId,
        referenceId: document.referenceId,
        documentNo: document.documentNo ?? "",
        documentTitle: document.documentTitle,
        description: document.description ?? "",
        issueDate: toFormDate(document.issueDate),
        expiryDate: toFormDate(document.expiryDate),
        reminderDays: document.reminderDays,
        isMandatory: document.isMandatory,
        remarks: document.remarks ?? "",
      })
    }
  }, [document, form])

  const referenceTypeId = form.watch("referenceTypeId")
  const prevReferenceTypeId = useRef(referenceTypeId)

  useEffect(() => {
    if (
      prevReferenceTypeId.current !== referenceTypeId &&
      prevReferenceTypeId.current !== 0
    ) {
      form.setValue("referenceId", 0)
    }
    prevReferenceTypeId.current = referenceTypeId
  }, [referenceTypeId, form])

  const handleDocumentTypeChange = (type: IDocExpiryDocumentTypeLookup | null) => {
    if (document || !type) return
    if (type.defaultReminderDays) {
      form.setValue("reminderDays", type.defaultReminderDays)
    }
    if (type.isMandatory) {
      form.setValue("isMandatory", true)
    }
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <CustomInput
            form={form}
            name="documentTitle"
            label="Document title"
            isRequired
            className="md:col-span-2"
          />

          <DocExpiryDocumentTypeAutocomplete
            form={form}
            name="documentTypeId"
            label="Document type"
            isRequired
            onChangeEvent={handleDocumentTypeChange}
          />

          <DocExpiryDocumentCategoryAutocomplete
            form={form}
            name="documentCategoryId"
            label="Category"
            isRequired
          />

          <DocExpiryReferenceTypeAutocomplete
            form={form}
            name="referenceTypeId"
            label="Reference type"
            isRequired
          />

          <DocExpiryReferenceEntityField form={form} />

          <CustomInput form={form} name="documentNo" label="Document number" />

          <CustomDateNew
            form={form}
            name="issueDate"
            label="Issue date"
            isFutureShow
          />

          <CustomDateNew
            form={form}
            name="expiryDate"
            label="Expiry date"
            isRequired
            isFutureShow
          />

          <CustomNumberInput
            form={form}
            name="reminderDays"
            label="Reminder days"
            round={0}
          />

          <CustomCheckbox
            form={form}
            name="isMandatory"
            label="Mandatory document"
            className="pt-5"
          />
        </div>

        <CustomTextarea
          form={form}
          name="description"
          label="Description"
          minRows={3}
        />

        <CustomTextarea form={form} name="remarks" label="Remarks" minRows={2} />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving…"
              : document
                ? "Update document"
                : "Create document"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
