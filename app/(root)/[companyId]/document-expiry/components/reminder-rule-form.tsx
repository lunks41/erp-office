"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"

import {
  ReminderRuleViewModel,
  SaveReminderRuleViewModel,
} from "@/interfaces/document-expiry-view-model"
import { DocExpiryDocumentTypeAutocomplete } from "@/components/autocomplete"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomSelect from "@/components/custom/custom-select"
import CustomSwitch from "@/components/custom/custom-switch"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

export type ReminderRuleFormValues = SaveReminderRuleViewModel

const PRIORITY_OPTIONS = [
  { value: 1, label: "Info" },
  { value: 2, label: "Warning" },
  { value: 3, label: "Critical" },
]

export function ReminderRuleForm({
  rule,
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  rule?: ReminderRuleViewModel | null
  onSubmit: (values: ReminderRuleFormValues) => void
  isSubmitting?: boolean
  onCancel?: () => void
}) {
  const form = useForm<ReminderRuleFormValues>({
    defaultValues: {
      reminderRuleId: 0,
      docTypeId: null,
      daysBeforeExpiry: 30,
      priorityLevel: 2,
      isPopupEnabled: true,
      isEmailEnabled: false,
      isActive: true,
    },
  })

  useEffect(() => {
    if (rule) {
      form.reset({
        reminderRuleId: rule.reminderRuleId,
        docTypeId: rule.docTypeId ?? null,
        daysBeforeExpiry: rule.daysBeforeExpiry,
        priorityLevel: rule.priorityLevel,
        isPopupEnabled: rule.isPopupEnabled,
        isEmailEnabled: rule.isEmailEnabled,
        isActive: rule.isActive,
      })
    } else {
      form.reset({
        reminderRuleId: 0,
        docTypeId: null,
        daysBeforeExpiry: 30,
        priorityLevel: 2,
        isPopupEnabled: true,
        isEmailEnabled: false,
        isActive: true,
      })
    }
  }, [rule, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DocExpiryDocumentTypeAutocomplete
          form={form}
          name="docTypeId"
          label="Document type (optional)"
          optional
          optionalLabel="All document types"
        />

        <CustomNumberInput
          form={form}
          name="daysBeforeExpiry"
          label="Days before expiry"
          isRequired
          round={0}
        />

        <CustomSelect
          name="priorityLevel"
          label="Priority"
          options={PRIORITY_OPTIONS}
          isRequired
        />

        <CustomSwitch
          form={form}
          name="isPopupEnabled"
          label="Popup notification"
        />

        <CustomSwitch
          form={form}
          name="isEmailEnabled"
          label="Email notification"
        />

        <CustomSwitch form={form} name="isActive" label="Active" />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : rule ? "Update rule" : "Create rule"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
