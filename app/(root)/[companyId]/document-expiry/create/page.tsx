"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { DocumentForm } from "@/components/document-expiry/document-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useDocumentExpiryMasters,
  useSaveDocument,
} from "@/hooks/use-document-expiry"
import { SaveDocumentDto } from "@/interfaces/document-expiry"

export default function CreateDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = String(params.companyId ?? "")

  const { data: masters, isLoading: mastersLoading } = useDocumentExpiryMasters()
  const saveMutation = useSaveDocument()

  const handleSubmit = async (values: SaveDocumentDto) => {
    const res = await saveMutation.mutateAsync({
      ...values,
      documentId: 0,
      expiryDate: values.expiryDate
        ? new Date(values.expiryDate).toISOString()
        : values.expiryDate,
      issueDate: values.issueDate
        ? new Date(values.issueDate).toISOString()
        : undefined,
    })
    if (res.result === 1 && res.data?.documentId) {
      router.push(
        `/${companyId}/document-expiry/details/${res.data.documentId}`
      )
    }
  }

  const m = masters

  return (
    <div className="@container mx-auto max-w-3xl space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/${companyId}/document-expiry/list`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New document</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentForm
            types={m?.types ?? []}
            categories={m?.categories ?? []}
            referenceTypes={m?.referenceTypes ?? []}
            onSubmit={handleSubmit}
            isSubmitting={saveMutation.isPending}
            isLoading={mastersLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
