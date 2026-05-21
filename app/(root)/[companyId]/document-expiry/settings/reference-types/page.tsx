"use client"

import { ReferenceTypeDto } from "@/interfaces/document-expiry"
import {
  useDeleteDocExpiryReferenceType,
  useDocExpiryReferenceTypesSetup,
  useSaveDocExpiryReferenceType,
} from "@/hooks/use-document-expiry-setup"
import { ReferenceTypeSetupForm } from "@/components/document-expiry/setup-forms"
import {
  SetupMasterPage,
  SetupRow,
} from "@/components/document-expiry/setup-master-page"

function toRows(items: ReferenceTypeDto[]): SetupRow[] {
  return items.map((r) => ({
    id: r.referenceTypeId,
    code: r.referenceTypeCode,
    name: r.referenceTypeName,
    isActive: r.isActive,
  }))
}

export default function ReferenceTypesSetupPage() {
  const { data, isLoading, refetch } = useDocExpiryReferenceTypesSetup()
  const saveMutation = useSaveDocExpiryReferenceType()
  const deleteMutation = useDeleteDocExpiryReferenceType()

  return (
    <SetupMasterPage
      title="reference type"
      description="Defines what entity a document is attached to (employee, vessel, etc.)."
      rows={toRows(data?.data ?? [])}
      isLoading={isLoading}
      FormComponent={ReferenceTypeSetupForm}
      onSave={(v) => saveMutation.mutateAsync(v)}
      isSaving={saveMutation.isPending}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      isDeleting={deleteMutation.isPending}
      refetch={() => refetch()}
    />
  )
}
