"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"

import {
  DocumentCategoryDto,
  DocumentDto,
  DocumentTypeDto,
  ReferenceTypeDto,
  SaveDocumentDto,
} from "@/interfaces/document-expiry"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

function toDateInput(value?: string | null) {
  if (!value) return ""
  try {
    return value.split("T")[0]
  } catch {
    return ""
  }
}

export function DocumentForm({
  document,
  types,
  categories,
  referenceTypes,
  onSubmit,
  isSubmitting,
  isLoading,
}: {
  document?: DocumentDto | null
  types: DocumentTypeDto[]
  categories: DocumentCategoryDto[]
  referenceTypes: ReferenceTypeDto[]
  onSubmit: (values: SaveDocumentDto) => void
  isSubmitting?: boolean
  isLoading?: boolean
}) {
  const { register, handleSubmit, setValue, watch, reset } =
    useForm<SaveDocumentDto>({
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
      reset({
        documentId: document.documentId,
        branchId: document.branchId ?? undefined,
        documentTypeId: document.documentTypeId,
        documentCategoryId: document.documentCategoryId,
        referenceTypeId: document.referenceTypeId,
        referenceId: document.referenceId,
        documentNo: document.documentNo ?? "",
        documentTitle: document.documentTitle,
        description: document.description ?? "",
        issueDate: toDateInput(document.issueDate),
        expiryDate: toDateInput(document.expiryDate),
        reminderDays: document.reminderDays,
        isMandatory: document.isMandatory,
        remarks: document.remarks ?? "",
      })
    }
  }, [document, reset])

  const selectedTypeId = watch("documentTypeId")

  useEffect(() => {
    if (!selectedTypeId || document) return
    const t = types.find((x) => x.documentTypeId === selectedTypeId)
    if (t?.defaultReminderDays) {
      setValue("reminderDays", t.defaultReminderDays)
      if (t.isMandatory) setValue("isMandatory", true)
    }
  }, [selectedTypeId, types, setValue, document])

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="documentTitle">Document title *</Label>
          <Input
            id="documentTitle"
            {...register("documentTitle", { required: true })}
          />
        </div>

        <div className="space-y-2">
          <Label>Document type *</Label>
          <Select
            value={selectedTypeId ? String(selectedTypeId) : ""}
            onValueChange={(v) => setValue("documentTypeId", Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem
                  key={t.documentTypeId}
                  value={String(t.documentTypeId)}
                >
                  {t.documentTypeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={
              watch("documentCategoryId")
                ? String(watch("documentCategoryId"))
                : ""
            }
            onValueChange={(v) => setValue("documentCategoryId", Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem
                  key={c.documentCategoryId}
                  value={String(c.documentCategoryId)}
                >
                  {c.documentCategoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Reference type *</Label>
          <Select
            value={
              watch("referenceTypeId") ? String(watch("referenceTypeId")) : ""
            }
            onValueChange={(v) => setValue("referenceTypeId", Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reference" />
            </SelectTrigger>
            <SelectContent>
              {referenceTypes.map((r) => (
                <SelectItem
                  key={r.referenceTypeId}
                  value={String(r.referenceTypeId)}
                >
                  {r.referenceTypeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="referenceId">Reference ID *</Label>
          <Input
            id="referenceId"
            type="number"
            {...register("referenceId", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentNo">Document number</Label>
          <Input id="documentNo" {...register("documentNo")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issueDate">Issue date</Label>
          <Input id="issueDate" type="date" {...register("issueDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry date *</Label>
          <Input
            id="expiryDate"
            type="date"
            {...register("expiryDate", { required: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reminderDays">Reminder days</Label>
          <Input
            id="reminderDays"
            type="number"
            {...register("reminderDays", { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="isMandatory"
            checked={watch("isMandatory")}
            onCheckedChange={(c) => setValue("isMandatory", c)}
          />
          <Label htmlFor="isMandatory">Mandatory document</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...register("description")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea id="remarks" rows={2} {...register("remarks")} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : document ? "Update document" : "Create document"}
        </Button>
      </div>
    </form>
  )
}
