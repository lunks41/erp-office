"use client"

import { IUniversalDocumentDt } from "@/interfaces/universal-documents"
import { FileCheck, FileMinus, Pencil, RotateCcw, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const classifyDays = (days: number | null): ExpiryStatus => {
  if (days === null) return "none"
  if (days < 0) return "expired"
  if (days <= 7) return "critical"
  if (days <= 30) return "warning"
  return "valid"
}

const EXPIRY_BADGE: Record<
  ExpiryStatus,
  { label: string; className: string }
> = {
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

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

const formatDaysLabel = (days: number | null): string => {
  if (days === null) return ""
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return "Today"
  return `in ${days}d`
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DocumentDetailsTableProps {
  details: IUniversalDocumentDt[]
  onEditAction?: (detail: IUniversalDocumentDt, index: number) => void
  onDeleteAction?: (index: number) => void
  isLoading?: boolean
}

export function DocumentDetailsTable({
  details,
  onEditAction,
  onDeleteAction,
  isLoading = false,
}: DocumentDetailsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Document Entries
          {details.length > 0 && (
            <span className="text-muted-foreground ml-2 font-normal">
              ({details.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4 font-semibold">Document Type</TableHead>
                <TableHead className="font-semibold">Doc Number</TableHead>
                <TableHead className="font-semibold">Ver.</TableHead>
                <TableHead className="font-semibold">Issued</TableHead>
                <TableHead className="font-semibold">Expiry</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Renewal</TableHead>
                <TableHead className="font-semibold">File</TableHead>
                <TableHead className="pr-4 text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : details.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <p className="text-muted-foreground text-sm">
                      No entries yet. Click &quot;Add Entry&quot; to attach
                      document details.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                details.map((dt, idx) => {
                  const days = getDaysUntilExpiry(dt.expiryOn ?? null)
                  const status = classifyDays(days)
                  const badge = EXPIRY_BADGE[status]
                  const daysLabel = formatDaysLabel(days)

                  return (
                    <TableRow key={idx} className="group">
                      {/* Document Type */}
                      <TableCell className="pl-4">
                        <span className="text-sm font-medium">
                          {dt.docTypeName || `Type #${dt.docTypeId}`}
                        </span>
                      </TableCell>

                      {/* Document Number */}
                      <TableCell>
                        <span className="text-sm">
                          {dt.documentNo || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </span>
                      </TableCell>

                      {/* Version */}
                      <TableCell>
                        <span className="text-muted-foreground text-sm tabular-nums">
                          v{dt.versionNo}
                        </span>
                      </TableCell>

                      {/* Issue Date */}
                      <TableCell>
                        <span className="text-sm">{formatDate(dt.issueOn)}</span>
                      </TableCell>

                      {/* Expiry Date + days label */}
                      <TableCell>
                        {dt.expiryOn ? (
                          <div>
                            <p className="text-sm">{formatDate(dt.expiryOn)}</p>
                            {daysLabel && (
                              <p
                                className={`text-xs tabular-nums ${
                                  status === "expired" || status === "critical"
                                    ? "text-red-500"
                                    : status === "warning"
                                      ? "text-yellow-600"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {daysLabel}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Status badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${badge.className}`}
                        >
                          {badge.label}
                        </Badge>
                      </TableCell>

                      {/* Renewal Required */}
                      <TableCell>
                        {dt.renewalRequired ? (
                          <div className="flex items-center gap-1 text-orange-600">
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="text-xs">Required</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Not required
                          </span>
                        )}
                      </TableCell>

                      {/* File */}
                      <TableCell>
                        {dt.filePath ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <FileCheck className="h-3.5 w-3.5" />
                            <span className="text-xs">Attached</span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground flex items-center gap-1">
                            <FileMinus className="h-3.5 w-3.5" />
                            <span className="text-xs">No file</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-60 group-hover:opacity-100"
                            onClick={() => onEditAction?.(dt, idx)}
                            title="Edit entry"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-7 w-7 p-0 opacity-60 group-hover:opacity-100"
                            onClick={() => onDeleteAction?.(idx)}
                            title="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
