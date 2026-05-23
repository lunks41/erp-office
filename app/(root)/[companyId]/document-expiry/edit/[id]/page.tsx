"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { SaveDocumentWithDetailsViewModel } from "@/interfaces/document-expiry-view-model"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { useDocumentById, useSaveDocument } from "@/hooks/use-document-expiry"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentBundleForm } from "@/app/(root)/[companyId]/document-expiry/components/document-bundle-form"

export default function EditDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const base = `/${companyId}/document-expiry`
  const id = String(params.id ?? "")

  const { data: docRes, isLoading: docLoading } = useDocumentById(id)
  const saveMutation = useSaveDocument()

  const handleSubmit = async (values: SaveDocumentWithDetailsViewModel) => {
    const res = await saveMutation.mutateAsync({
      ...values,
      documentId: Number(id),
    })
    if (res.result === 1) {
      router.push(`${base}/details/${id}`)
    } else if (res.message) {
      toast.error(res.message)
    }
  }

  const header = docRes?.data

  return (
    <div className="@container mx-auto max-w-5xl space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${base}/details/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to details
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit document record</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentBundleForm
            header={header}
            onSubmit={handleSubmit}
            isSubmitting={saveMutation.isPending}
            isLoading={docLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
