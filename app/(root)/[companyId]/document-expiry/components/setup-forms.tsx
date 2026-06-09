"use client"

import { useEffect } from "react"
import { Path, useForm } from "react-hook-form"

import {
  SaveDocumentCategoryViewModel,
  SaveDocumentStatusViewModel,
  SaveDocumentTypeViewModel,
} from "@/interfaces/document-expiry-view-model"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomSwitch from "@/components/custom/custom-switch"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

import { SetupRow } from "./setup-master-page"

type CodeNameValues = {
  isActive: boolean
  [key: string]: string | number | boolean
}

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
  const form = useForm<CodeNameValues>({
    defaultValues: {
      [idField]: 0,
      [codeField]: "",
      [nameField]: "",
      isActive: true,
    },
  })

  useEffect(() => {
    if (row) {
      form.reset({
        [idField]: row.id,
        [codeField]: row.code,
        [nameField]: row.name,
        isActive: row.isActive,
      })
    } else {
      form.reset({
        [idField]: 0,
        [codeField]: "",
        [nameField]: "",
        isActive: true,
      })
    }
  }, [row, form, idField, codeField, nameField])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        className="space-y-4"
      >
        <CustomInput
          form={form}
          name={codeField as Path<CodeNameValues>}
          label="Code"
          isRequired
          className="uppercase"
        />
        <CustomInput
          form={form}
          name={nameField as Path<CodeNameValues>}
          label="Name"
          isRequired
        />
        {extra}
        <CustomSwitch form={form} name="isActive" label="Active" />
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
    </Form>
  )
}

export function DocumentTypeSetupForm(props: {
  row?: SetupRow | null
  onSubmit: (values: SaveDocumentTypeViewModel) => void | Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}) {
  const form = useForm<SaveDocumentTypeViewModel>({
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
      form.reset({
        documentTypeId: props.row.id,
        documentTypeCode: props.row.code,
        documentTypeName: props.row.name,
        defaultReminderDays: Number(meta.defaultReminderDays ?? 30),
        isExpiryRequired: Boolean(meta.isExpiryRequired ?? true),
        isMandatory: Boolean(meta.isMandatory ?? false),
        isActive: props.row.isActive,
      })
    } else {
      form.reset({
        documentTypeId: 0,
        documentTypeCode: "",
        documentTypeName: "",
        defaultReminderDays: 30,
        isExpiryRequired: true,
        isMandatory: false,
        isActive: true,
      })
    }
  }, [props.row, form])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(props.onSubmit)}
        className="space-y-4"
      >
        <CustomInput
          form={form}
          name="documentTypeCode"
          label="Code"
          isRequired
          className="uppercase"
        />
        <CustomInput
          form={form}
          name="documentTypeName"
          label="Name"
          isRequired
        />
        <CustomNumberInput
          form={form}
          name="defaultReminderDays"
          label="Default reminder days"
          round={0}
        />
        <CustomSwitch
          form={form}
          name="isExpiryRequired"
          label="Expiry required"
        />
        <CustomSwitch form={form} name="isMandatory" label="Mandatory" />
        <CustomSwitch form={form} name="isActive" label="Active" />
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
    </Form>
  )
}

export function DocumentCategorySetupForm(props: {
  row?: SetupRow | null
  onSubmit: (values: SaveDocumentCategoryViewModel) => void | Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}) {
  return (
    <CodeNameForm
      {...props}
      idField="docCategoryId"
      codeField="docCategoryCode"
      nameField="docCategoryName"
      onSubmit={(v) =>
        props.onSubmit(v as unknown as SaveDocumentCategoryViewModel)
      }
    />
  )
}

export function DocumentStatusSetupForm(props: {
  row?: SetupRow | null
  onSubmit: (values: SaveDocumentStatusViewModel) => void | Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}) {
  return (
    <CodeNameForm
      {...props}
      idField="docStatusId"
      codeField="docStatusCode"
      nameField="docStatusName"
      extra={
        <p className="text-muted-foreground text-xs">
          Status codes are used by the expiry engine (ACTIVE, EXPIRING, EXPIRED,
          etc.). Change codes only if you understand the impact.
        </p>
      }
      onSubmit={(v) => props.onSubmit(v as unknown as SaveDocumentStatusViewModel)}
    />
  )
}
