"use client"

import { useState } from "react"
import { IUniversalDocumentHd } from "@/interfaces/universal-documents"
import { Building2, Pencil, Search, User } from "lucide-react"

import { useGetUniversalDocuments } from "@/hooks/use-universal-documents"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
  if (!expiryDate) return null
  return Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
}

type ExpiryStatus = "expired" | "critical" | "warning" | "valid" | "none"

const getWorstStatus = (doc: IUniversalDocumentHd): ExpiryStatus => {
  if (!doc.data_details?.length) return "none"
  const statuses = doc.data_details.map((dt) => {
    const days = getDaysUntilExpiry(dt.expiryOn ?? null)
    if (days === null) return "none" as ExpiryStatus
    if (days < 0) return "expired" as ExpiryStatus
    if (days <= 7) return "critical" as ExpiryStatus
    if (days <= 30) return "warning" as ExpiryStatus
    return "valid" as ExpiryStatus
  })
  const priority: ExpiryStatus[] = ["expired", "critical", "warning", "valid", "none"]
  for (const p of priority) {
    if (statuses.includes(p)) return p
  }
  return "none"
}

const STATUS_BADGE: Record<ExpiryStatus, { label: string; className: string }> =
  {
    expired: {
      label: "Expired",
      className: "bg-red-100 text-red-700 border-red-200",
    },
    critical: {
      label: "Critical",
      className: "bg-orange-100 text-orange-700 border-orange-200",
    },
    warning: {
      label: "Expiring Soon",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    valid: {
      label: "Valid",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    none: {
      label: "No Expiry",
      className: "bg-gray-100 text-gray-600 border-gray-200",
    },
  }

const ENTITY_ICON: Record<string, React.ReactNode> = {
  Employee: <User className="h-3.5 w-3.5" />,
  Company: <Building2 className="h-3.5 w-3.5" />,
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DocumentTableProps {
  onEditAction?: (document: IUniversalDocumentHd) => void
}

export function DocumentTable({ onEditAction }: DocumentTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: res, isLoading } = useGetUniversalDocuments(searchTerm)

  const documents: IUniversalDocumentHd[] = Array.isArray(res)
    ? res
    : Array.isArray((res as { data?: unknown })?.data)
      ? ((res as { data: IUniversalDocumentHd[] }).data)
      : []

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            Documents
            {!isLoading && (
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                ({documents.length})
              </span>
            )}
          </CardTitle>
          <div className="relative w-full sm:w-56">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4 font-semibold">Entity Type</TableHead>
                <TableHead className="font-semibold">Document Name</TableHead>
                <TableHead className="font-semibold">Entries</TableHead>
                <TableHead className="font-semibold">Document Types</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="pr-4 text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <p className="text-muted-foreground text-sm">
                      {searchTerm
                        ? `No documents found for "${searchTerm}"`
                        : "No documents yet. Click Add Document to get started."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => {
                  const status = getWorstStatus(doc)
                  const badge = STATUS_BADGE[status]
                  const icon = ENTITY_ICON[doc.entityTypeName ?? ""] ?? null

                  return (
                    <TableRow key={doc.documentId} className="group">
                      {/* Entity Type */}
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          {icon && (
                            <span className="text-muted-foreground">{icon}</span>
                          )}
                          <span>{doc.entityTypeName || "—"}</span>
                        </div>
                      </TableCell>

                      {/* Document Name */}
                      <TableCell>
                        <span
                          className="max-w-[200px] truncate text-sm font-medium"
                          title={doc.documentName ?? undefined}
                        >
                          {doc.documentName || `Document #${doc.documentId}`}
                        </span>
                      </TableCell>

                      {/* Entries count */}
                      <TableCell>
                        <span className="tabular-nums text-sm">
                          {doc.detailsCount ?? doc.data_details?.length ?? 0}
                        </span>
                      </TableCell>

                      {/* Document types (detailsName) */}
                      <TableCell>
                        {doc.detailsName ? (
                          <span
                            className="text-muted-foreground max-w-[180px] truncate text-sm"
                            title={doc.detailsName}
                          >
                            {doc.detailsName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Worst expiry status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${badge.className}`}
                        >
                          {badge.label}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100"
                          onClick={() => onEditAction?.(doc)}
                          title="Edit document"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
