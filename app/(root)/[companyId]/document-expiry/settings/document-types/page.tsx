"use client"

import { DocumentTypeViewModel } from "@/interfaces/document-expiry-view-model"
import {
  useDeleteDocExpiryType,
  useDocExpiryTypesSetup,
  useSaveDocExpiryType,
} from "@/hooks/use-document-expiry-setup"
import { DocumentTypeSetupForm } from "@/components/document-expiry/setup-forms"
import {
  SetupMasterPage,
  SetupRow,
} from "@/components/document-expiry/setup-master-page"

function toRows(items: DocumentTypeViewModel[]): SetupRow[] {
  return items.map((t) => ({
    id: t.documentTypeId,
    code: t.documentTypeCode,
    name: t.documentTypeName,
    isActive: t.isActive,
    subtitle: `${t.defaultReminderDays} days · ${
      t.isExpiryRequired ? "expiry required" : "no expiry"
    } · ${t.isMandatory ? "mandatory" : "optional"}`,
    meta: {
      defaultReminderDays: t.defaultReminderDays,
      isExpiryRequired: t.isExpiryRequired,
      isMandatory: t.isMandatory,
    },
  }))
}

export default function DocumentTypesSetupPage() {
  const { data, isLoading, refetch } = useDocExpiryTypesSetup()
  const saveMutation = useSaveDocExpiryType()
  const deleteMutation = useDeleteDocExpiryType()

  return (
    <SetupMasterPage
      title="document type"
      description="Types used when creating and tracking expiry documents."
      rows={toRows(data?.data ?? [])}
      isLoading={isLoading}
      FormComponent={DocumentTypeSetupForm}
      onSave={(v) => saveMutation.mutateAsync(v)}
      isSaving={saveMutation.isPending}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      isDeleting={deleteMutation.isPending}
      refetch={() => refetch()}
    />
  )
}
