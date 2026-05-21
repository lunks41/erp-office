"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"

import {
  SaveDocumentCategoryDto,
  SaveDocumentStatusDto,
  SaveDocumentTypeDto,
  SaveReferenceTypeDto,
} from "@/interfaces/document-expiry"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { SetupRow } from "./setup-master-page"

function CodeNameForm({
  row,
  onSubmit,
  isSubmitting,
  onCancel,
  idField,
  codeField,
  nameField,
  extra,
}: {
  row?: SetupRow | null
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
  idField: string
  codeField: string
  nameField: string
  extra?: React.ReactNode
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      [idField]: 0,
      [codeField]: "",
      [nameField]: "",
      isActive: true,
    },
  })

  useEffect(() => {
    if (row) {
      reset({
        [idField]: row.id,
        [codeField]: row.code,
        [nameField]: row.name,
        isActive: row.isActive,
      })
    } else {
      reset({
        [idField]: 0,
        [codeField]: "",
        [nameField]: "",
        isActive: true,
      })
    }
  }, [row, reset, idField, codeField, nameField])

  const isActive = watch("isActive")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Code</Label>
        <Input {...register(codeField, { required: true })} className="uppercase" />
      </div>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...register(nameField, { required: true })} />
      </div>
      {extra}
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={isActive} onCheckedChange={(v) => setValue("isActive", v)} />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  )
}

export function DocumentTypeSetupForm(props: {
  row?: SetupRow | null
  onSubmit: (values: SaveDocumentTypeDto) => void | Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<SaveDocumentTypeDto>({
    defaultValues: {
      documentTypeId: 0,
      documentTypeCode: "",
      documentTypeName: "",
      defaultReminderDays: 30,
      isExpiryRequired: true,
      isMandatory: false,
      isActive: true,
    },
  })

  useEffect(() => {
    if (props.row) {
      const meta = props.row.meta ?? {}
      reset({
        documentTypeId: props.row.id,
        documentTypeCode: props.row.code,
        documentTypeName: props.row.name,
        defaultReminderDays: Number(meta.defaultReminderDays ?? 30),
        isExpiryRequired: Boolean(meta.isExpiryRequired ?? true),
        isMandatory: Boolean(meta.isMandatory ?? false),
        isActive: props.row.isActive,
      })
    } else {
      reset({
        documentTypeId: 0,
        documentTypeCode: "",
        documentTypeName: "",
        defaultReminderDays: 30,
        isExpiryRequired: true,
        isMandatory: false,
        isActive: true,
      })
    }
  }, [props.row, reset])

  return (
    <form onSubmit={handleSubmit(props.onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Code</Label>
        <Input {...register("documentTypeCode", { required: true })} className="uppercase" />
      </div>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...register("documentTypeName", { required: true })} />
      </div>
      <div className="space-y-2">
        <Label>Default reminder days</Label>
        <Input
          type="number"
          min={1}
          max={365}
          {...register("defaultReminderDays", { valueAsNumber: true })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Expiry required</Label>
        <Switch
          checked={watch("isExpiryRequired")}
          onCheckedChange={(v) => setValue("isExpiryRequired", v)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Mandatory</Label>
        <Switch
          checked={watch("isMandatory")}
          onCheckedChange={(v) => setValue("isMandatory", v)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch
          checked={watch("isActive")}
          onCheckedChange={(v) => setValue("isActive", v)}
        />
      </div>
      <div className="flex justify-end gap-2">
        {props.onCancel && (
          <Button type="button" variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={props.isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  )
}

export function DocumentCategorySetupForm(props: {
  row?: SetupRow | null
  onSubmit: (values: SaveDocumentCategoryDto) => void | Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}) {
  return (
    <CodeNameForm
      {...props}
      idField="documentCategoryId"
      codeField="documentCategoryCode"
      nameField="documentCategoryName"
      onSubmit={(v) =>
        props.onSubmit(v as unknown as SaveDocumentCategoryDto)
      }
    />
  )
}

export function ReferenceTypeSetupForm(props: {
  row?: SetupRow | null
  onSubmit: (values: SaveReferenceTypeDto) => void | Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}) {
  return (
    <CodeNameForm
      {...props}
      idField="referenceTypeId"
      codeField="referenceTypeCode"
      nameField="referenceTypeName"
      onSubmit={(v) => props.onSubmit(v as unknown as SaveReferenceTypeDto)}
    />
  )
}

export function DocumentStatusSetupForm(props: {
  row?: SetupRow | null
  onSubmit: (values: SaveDocumentStatusDto) => void | Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}) {
  return (
    <CodeNameForm
      {...props}
      idField="statusId"
      codeField="statusCode"
      nameField="statusName"
      extra={
        <p className="text-muted-foreground text-xs">
          Status codes are used by the expiry engine (ACTIVE, EXPIRING, EXPIRED,
          etc.). Change codes only if you understand the impact.
        </p>
      }
      onSubmit={(v) => props.onSubmit(v as unknown as SaveDocumentStatusDto)}
    />
  )
}
