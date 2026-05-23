"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { SaveDocumentWithDetailsViewModel } from "@/interfaces/document-expiry-view-model"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { useSaveDocument } from "@/hooks/use-document-expiry"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentBundleForm } from "@/app/(root)/[companyId]/document-expiry/components/document-bundle-form"

export default function NewDocumentPage() {
  const params = useParams()

  const router = useRouter()

  const companyId = params.companyId as string

  const base = `/${companyId}/document-expiry`

  const saveMutation = useSaveDocument()

  const handleSubmit = async (values: SaveDocumentWithDetailsViewModel) => {
    const res = await saveMutation.mutateAsync({
      ...values,

      documentId: 0,
    })

    if (res.result === 1 && res.data?.documentId) {
      router.push(`${base}/details/${res.data.documentId}`)
    } else if (res.message) {
      toast.error(res.message)
    }
  }

  return (
    <div className="@container mx-auto max-w-5xl space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${base}/list`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New document record</CardTitle>
        </CardHeader>

        <CardContent>
          <DocumentBundleForm
            onSubmit={handleSubmit}
            isSubmitting={saveMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
