"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ArrowLeft } from "lucide-react"

import { useExpiryReport } from "@/hooks/use-document-expiry"
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
import { ExpiryBadge } from "@/app/(root)/[companyId]/document-expiry/components/expiry-badge"

function fmtDate(value?: string | null) {
  if (!value) return "—"
  try {
    return format(parseISO(value), "dd/MM/yyyy")
  } catch {
    return value
  }
}

function priorityFromDays(days: number): 1 | 2 | 3 {
  if (days < 0 || days <= 7) return 3
  if (days <= 30) return 2
  return 1
}

export default function DocumentExpiryReportsPage() {
  const companyId = useParams().companyId as string
  const base = `/${companyId}/document-expiry`
  const { data, isLoading } = useExpiryReport({ pageSize: 500 })
  const rows = data?.data ?? []

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${base}/dashboard`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </Link>
      </Button>

      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Expiry report
        </h1>
        <p className="text-muted-foreground text-sm">
          Up to 500 documents sorted by expiry date.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expiry overview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.documentId}>
                      <TableCell>
                        <Link
                          href={`${base}/details/${r.documentId}`}
                          className="font-medium hover:underline"
                        >
                          {r.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.documentTypeName ?? "—"}
                      </TableCell>
                      <TableCell>{fmtDate(r.expiryDate)}</TableCell>
                      <TableCell>
                        <ExpiryBadge
                          priorityLevel={priorityFromDays(r.daysUntilExpiry)}
                          statusName={r.docStatusName}
                          daysUntilExpiry={r.daysUntilExpiry}
                        />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {r.daysUntilExpiry}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
