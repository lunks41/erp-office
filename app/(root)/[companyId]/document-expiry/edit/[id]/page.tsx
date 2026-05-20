"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { DocumentForm } from "@/components/document-expiry/document-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useDocumentById,
  useDocumentExpiryMasters,
  useSaveDocument,
} from "@/hooks/use-document-expiry"
import { SaveDocumentDto } from "@/interfaces/document-expiry"

export default function EditDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = String(params.companyId ?? "")
  const id = String(params.id ?? "")

  const { data: docRes, isLoading: docLoading } = useDocumentById(id)
  const { data: masters, isLoading: mastersLoading } = useDocumentExpiryMasters()
  const saveMutation = useSaveDocument()

  const handleSubmit = async (values: SaveDocumentDto) => {
    const res = await saveMutation.mutateAsync({
      ...values,
      documentId: Number(id),
      expiryDate: values.expiryDate
        ? new Date(values.expiryDate).toISOString()
        : values.expiryDate,
      issueDate: values.issueDate
        ? new Date(values.issueDate).toISOString()
        : undefined,
    })
    if (res.result === 1) {
      router.push(`/${companyId}/document-expiry/details/${id}`)
    }
  }

  const m = masters
  const doc = docRes?.data

  return (
    <div className="@container mx-auto max-w-3xl space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/${companyId}/document-expiry/details/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to details
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit document</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentForm
            document={doc}
            types={m?.types ?? []}
            categories={m?.categories ?? []}
            referenceTypes={m?.referenceTypes ?? []}
            onSubmit={handleSubmit}
            isSubmitting={saveMutation.isPending}
            isLoading={docLoading || mastersLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
