"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"

import {
  DocumentTypeDto,
  ReminderRuleDto,
  SaveReminderRuleDto,
} from "@/interfaces/document-expiry"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export type ReminderRuleFormValues = SaveReminderRuleDto

export function ReminderRuleForm({
  rule,
  types,
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  rule?: ReminderRuleDto | null
  types: DocumentTypeDto[]
  onSubmit: (values: ReminderRuleFormValues) => void
  isSubmitting?: boolean
  onCancel?: () => void
}) {
  const { register, handleSubmit, setValue, watch, reset } =
    useForm<ReminderRuleFormValues>({
      defaultValues: {
        reminderRuleId: 0,
        documentTypeId: null,
        daysBeforeExpiry: 30,
        priorityLevel: 2,
        isPopupEnabled: true,
        isEmailEnabled: false,
        isActive: true,
      },
    })

  useEffect(() => {
    if (rule) {
      reset({
        reminderRuleId: rule.reminderRuleId,
        documentTypeId: rule.documentTypeId ?? null,
        daysBeforeExpiry: rule.daysBeforeExpiry,
        priorityLevel: rule.priorityLevel,
        isPopupEnabled: rule.isPopupEnabled,
        isEmailEnabled: rule.isEmailEnabled,
        isActive: rule.isActive,
      })
    }
  }, [rule, reset])

  const documentTypeId = watch("documentTypeId")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Document type (optional)</Label>
        <Select
          value={documentTypeId ? String(documentTypeId) : "all"}
          onValueChange={(v) =>
            setValue("documentTypeId", v === "all" ? null : Number(v))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All document types</SelectItem>
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
        <Label htmlFor="daysBeforeExpiry">Days before expiry</Label>
        <Input
          id="daysBeforeExpiry"
          type="number"
          min={1}
          max={365}
          {...register("daysBeforeExpiry", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={String(watch("priorityLevel"))}
          onValueChange={(v) => setValue("priorityLevel", Number(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Info</SelectItem>
            <SelectItem value="2">Warning</SelectItem>
            <SelectItem value="3">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="popup">Popup notification</Label>
        <Switch
          id="popup"
          checked={watch("isPopupEnabled")}
          onCheckedChange={(c) => setValue("isPopupEnabled", c)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="email">Email notification</Label>
        <Switch
          id="email"
          checked={watch("isEmailEnabled")}
          onCheckedChange={(c) => setValue("isEmailEnabled", c)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="active">Active</Label>
        <Switch
          id="active"
          checked={watch("isActive")}
          onCheckedChange={(c) => setValue("isActive", c)}
        />
      </div>

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
  )
}
