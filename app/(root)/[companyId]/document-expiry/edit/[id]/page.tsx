"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { DocumentForm } from "@/components/document-expiry/document-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDocumentById, useSaveDocument } from "@/hooks/use-document-expiry"
import { SaveDocumentDto } from "@/interfaces/document-expiry"
import { formatDateForApi } from "@/lib/date-utils"

export default function EditDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const base = `/${companyId}/document-expiry`
  const id = String(params.id ?? "")

  const { data: docRes, isLoading: docLoading } = useDocumentById(id)
  const saveMutation = useSaveDocument()

  const handleSubmit = async (values: SaveDocumentDto) => {
    const res = await saveMutation.mutateAsync({
      ...values,
      documentId: Number(id),
      documentTitle: values.documentTitle.trim(),
      expiryDate: formatDateForApi(values.expiryDate) ?? "",
      issueDate: formatDateForApi(values.issueDate) ?? undefined,
    })
    if (res.result === 1) {
      router.push(`${base}/details/${id}`)
    }
  }

  const doc = docRes?.data

  return (
    <div className="@container mx-auto max-w-3xl space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${base}/details/${id}`}>
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
            onSubmit={handleSubmit}
            isSubmitting={saveMutation.isPending}
            isLoading={docLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
