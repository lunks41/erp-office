"use client"

import { useEffect } from "react"
import {
  AnnouncementSchemaType,
  announcementSchema,
} from "@/schemas/admin"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, parseISO } from "date-fns"
import { useForm } from "react-hook-form"

import { parseDate } from "@/lib/date-utils"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomTextarea from "@/components/custom/custom-textarea"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

export type AnnouncementFormValues = AnnouncementSchemaType

const emptyValues: AnnouncementFormValues = {
  title: "",
  message: "",
  isUrgent: false,
  validFrom: "",
  validTo: "",
}

function toFormDate(
  iso: string | null | undefined,
  dateFormat: string
): string {
  if (!iso) return ""
  try {
    return format(parseISO(iso), dateFormat)
  } catch {
    return ""
  }
}

export function toAnnouncementIsoDate(dateStr: string | undefined): string | null {
  if (!dateStr?.trim()) return null
  const parsed = parseDate(dateStr.trim())
  return parsed ? parsed.toISOString() : null
}

interface AnnouncementFormProps {
  initialValues?: AnnouncementFormValues
  isSubmitting?: boolean
  submitLabel?: string
  onSubmit: (values: AnnouncementFormValues) => void
  onCancel: () => void
}

export function AnnouncementForm({
  initialValues,
  isSubmitting = false,
  submitLabel = "Create",
  onSubmit,
  onCancel,
}: AnnouncementFormProps) {
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: initialValues ?? emptyValues,
  })

  useEffect(() => {
    form.reset(initialValues ?? emptyValues)
  }, [form, initialValues])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 py-2"
      >
        <CustomInput
          form={form}
          name="title"
          label="Title"
          placeholder="Announcement title"
          isRequired
        />

        <CustomTextarea
          form={form}
          name="message"
          label="Message"
          placeholder="Announcement message"
          isRequired
          minRows={3}
          maxRows={6}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CustomDateNew
            form={form}
            name="validFrom"
            label="Valid From"
            isFutureShow
          />
          <CustomDateNew
            form={form}
            name="validTo"
            label="Valid To"
            isFutureShow
          />
        </div>

        <CustomCheckbox
          form={form}
          name="isUrgent"
          label="Mark as Urgent"
        />

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export { toFormDate }
