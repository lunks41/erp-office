"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { DocumentViewModel } from "@/interfaces/document-expiry-view-model"
import { format, parseISO } from "date-fns"
import { Eye, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExpiryBadge } from "@/app/(root)/[companyId]/document-expiry/components/expiry-badge"

function fmtDate(value?: string | null) {
  if (!value) return "—"
  try {
    return format(parseISO(value), "dd/MM/yyyy")
  } catch {
    return value
  }
}

export function DocumentTable({
  rows,
  isLoading,
  onDelete,
}: {
  rows: DocumentViewModel[]
  isLoading?: boolean
  onDelete?: (doc: DocumentViewModel) => void
}) {
  const companyId = useParams().companyId as string
  const base = `/${companyId}/document-expiry`

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!rows.length) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No documents found.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((doc) => (
            <TableRow key={`${doc.documentId}-${doc.itemNo}`}>
              <TableCell>
                <div className="font-medium">{doc.title}</div>
                {doc.documentNo && (
                  <span className="text-muted-foreground text-xs">
                    {doc.documentNo}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {doc.companyName ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {doc.documentTypeName ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {doc.docCategoryName ?? "—"}
              </TableCell>
              <TableCell>{fmtDate(doc.expiryDate)}</TableCell>
              <TableCell>
                <ExpiryBadge
                  priorityLevel={doc.priorityLevel}
                  statusName={doc.docStatusName}
                  daysUntilExpiry={doc.daysUntilExpiry}
                />
                {doc.isMandatory && (
                  <Badge variant="secondary" className="ml-1">
                    Required
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`${base}/details/${doc.documentId}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`${base}/edit/${doc.documentId}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(doc)}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
