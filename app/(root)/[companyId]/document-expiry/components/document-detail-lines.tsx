"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { DocumentDetailViewModel } from "@/interfaces/document-expiry-view-model"
import { format, parseISO } from "date-fns"
import { Ban, RefreshCw, Upload } from "lucide-react"

import { formatDateForApi, parseDate } from "@/lib/date-utils"
import {
  useCancelDocumentDetail,
  useDocumentAttachments,
  useRenewDocument,
  useUploadDocumentAttachment,
} from "@/hooks/use-document-expiry"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExpiryBadge } from "@/app/(root)/[companyId]/document-expiry/components/expiry-badge"
import { RenewDocumentForm } from "@/app/(root)/[companyId]/document-expiry/components/renew-document-form"
import { UploadDropzone } from "@/app/(root)/[companyId]/document-expiry/components/upload-dropzone"

function fmtDate(value?: string | null) {
  if (!value) return "—"
  try {
    return format(parseISO(value), "dd/MM/yyyy")
  } catch {
    return value
  }
}

function LineAttachments({
  documentId,
  line,
}: {
  documentId: string
  line: DocumentDetailViewModel
}) {
  const lineItemNo = String(line.itemNo)
  const { data: attachmentsRes, refetch } = useDocumentAttachments(
    documentId,
    lineItemNo
  )
  const uploadMutation = useUploadDocumentAttachment()
  const attachments = attachmentsRes?.data ?? []

  return (
    <div className="bg-muted/30 mt-2 space-y-2 rounded-md border p-3">
      <UploadDropzone
        disabled={uploadMutation.isPending || line.statusCode === "CANCELLED"}
        onFileSelect={async (file) => {
          await uploadMutation.mutateAsync({
            documentId,
            itemNo: lineItemNo,
            file,
          })
          refetch()
        }}
      />
      {attachments.length > 0 && (
        <ul className="text-muted-foreground divide-y text-xs">
          {attachments.map((a) => (
            <li key={a.attachmentId} className="flex justify-between py-1">
              <span>{a.fileName}</span>
              <span>
                v{a.versionNo} · {fmtDate(a.uploadedDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DocumentDetailLines({
  documentId,
  lines,
}: {
  documentId: string
  lines: DocumentDetailViewModel[]
}) {
  const params = useParams()
  const companyId = params.companyId as string
  const base = `/${companyId}/document-expiry`

  const renewMutation = useRenewDocument()
  const cancelMutation = useCancelDocumentDetail()
  const [renewLine, setRenewLine] = useState<DocumentDetailViewModel | null>(
    null
  )
  const [expandedItemNo, setExpandedDtId] = useState<number | null>(null)

  const handleRenew = async (values: {
    newExpiryDate: string
    remarks?: string
  }) => {
    if (!renewLine) return
    const parsed = parseDate(values.newExpiryDate)
    if (!parsed) return
    await renewMutation.mutateAsync({
      documentId,
      itemNo: renewLine.itemNo,
      dto: {
        itemNo: renewLine.itemNo,
        newExpiryDate: formatDateForApi(values.newExpiryDate) ?? "",
        remarks: values.remarks,
      },
    })
    setRenewLine(null)
  }

  if (!lines.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No document lines on this record.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Doc no.</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Reminder</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <Fragment key={line.itemNo}>
                <TableRow>
                  <TableCell className="font-medium">
                    {line.documentTypeName ?? "—"}
                  </TableCell>
                  <TableCell>{line.documentNo ?? "—"}</TableCell>
                  <TableCell>{fmtDate(line.issueDate)}</TableCell>
                  <TableCell>{fmtDate(line.expiryDate)}</TableCell>
                  <TableCell>{line.reminderDays}</TableCell>
                  <TableCell>
                    <ExpiryBadge
                      priorityLevel={line.priorityLevel}
                      statusName={line.statusName}
                      daysUntilExpiry={line.daysUntilExpiry}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedDtId(
                            expandedItemNo === line.itemNo ? null : line.itemNo
                          )
                        }
                      >
                        <Upload className="mr-1 h-3.5 w-3.5" />
                        Files ({line.attachmentCount})
                      </Button>
                      {line.statusCode !== "CANCELLED" && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRenewLine(line)}
                          >
                            <RefreshCw className="mr-1 h-3.5 w-3.5" />
                            Renew
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={cancelMutation.isPending}
                            onClick={() =>
                              cancelMutation.mutate({
                                documentId,
                                itemNo: line.itemNo,
                              })
                            }
                          >
                            <Ban className="mr-1 h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {expandedItemNo === line.itemNo && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <LineAttachments documentId={documentId} line={line} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground text-xs">
        <Link href={`${base}/edit/${documentId}`} className="underline">
          Edit header and lines
        </Link>
      </p>

      <Dialog open={!!renewLine} onOpenChange={(o) => !o && setRenewLine(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Renew {renewLine?.documentTypeName ?? "document"}
            </DialogTitle>
          </DialogHeader>
          <RenewDocumentForm
            onSubmit={handleRenew}
            isSubmitting={renewMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
