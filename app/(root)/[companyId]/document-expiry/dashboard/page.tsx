"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  BarChart3,
  FileText,
  List,
  Settings,
} from "lucide-react"

import { DashboardCards } from "@/components/document-expiry/dashboard-cards"
import { DocumentTable } from "@/components/document-expiry/document-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useCriticalDocuments,
  useDashboardSummary,
  useExpiringDocuments,
} from "@/hooks/use-document-expiry"

export default function DocumentExpiryDashboardPage() {
  const params = useParams()
  const companyId = String(params.companyId ?? "")

  const { data: summaryRes, isLoading: summaryLoading } = useDashboardSummary()
  const { data: expiringRes, isLoading: expiringLoading } = useExpiringDocuments({
    pageSize: 5,
  })
  const { data: criticalRes, isLoading: criticalLoading } = useCriticalDocuments()

  const summary = summaryRes?.data
  const expiring = expiringRes?.data ?? []
  const critical = criticalRes?.data ?? []

  return (
    <div className="@container mx-auto space-y-6 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Document Expiry
          </h1>
          <p className="text-muted-foreground text-sm">
            Track licenses, certificates, and compliance documents.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${companyId}/document-expiry/list`}>
              <List className="mr-2 h-4 w-4" />
              All documents
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/${companyId}/document-expiry/create`}>
              <FileText className="mr-2 h-4 w-4" />
              New document
            </Link>
          </Button>
        </div>
      </div>

      <DashboardCards
        companyId={companyId}
        summary={summary}
        isLoading={summaryLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Expiring soon</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href={`/${companyId}/document-expiry/list`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DocumentTable
              companyId={companyId}
              rows={expiring}
              isLoading={expiringLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Critical (7 days)</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href={`/${companyId}/document-expiry/list?filter=critical`}>
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DocumentTable
              companyId={companyId}
              rows={critical}
              isLoading={criticalLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            By category (placeholder)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed text-sm">
            Category distribution chart — connect when analytics endpoint is available.
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${companyId}/document-expiry/reports`}>
            Reports
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${companyId}/document-expiry/settings/reminders`}>
            <Settings className="mr-2 h-4 w-4" />
            Reminder rules
          </Link>
        </Button>
      </div>
    </div>
  )
}
