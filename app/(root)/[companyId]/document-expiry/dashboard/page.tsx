"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  FileText,
  List,
  RefreshCw,
  Settings,
  SlidersHorizontal,
} from "lucide-react"

import {
  buildCategoryBars,
  buildExpiryTimeline,
  buildMandatoryBars,
  buildStatusBarsFromSummary,
  buildTypeBars,
} from "@/lib/document-expiry-analytics"
import { DashboardCards } from "@/components/document-expiry/dashboard-cards"
import { DashboardCharts } from "@/components/document-expiry/dashboard-charts"
import { DashboardInsight } from "@/components/document-expiry/dashboard-insight"
import { DocumentTable } from "@/components/document-expiry/document-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useCriticalDocuments,
  useDashboardSummary,
  useDocumentsList,
  useExpiringDocuments,
} from "@/hooks/use-document-expiry"
export default function DocumentExpiryDashboardPage() {
  const companyId = useParams().companyId as string
  const base = `/${companyId}/document-expiry`

  const {
    data: summaryRes,
    isLoading: summaryLoading,
    refetch: refetchSummary,
    isFetching: summaryFetching,
  } = useDashboardSummary()
  const { data: expiringRes, isLoading: expiringLoading } = useExpiringDocuments({
    pageSize: 5,
  })
  const { data: criticalRes, isLoading: criticalLoading } = useCriticalDocuments()
  const { data: allDocsRes, isLoading: docsLoading } = useDocumentsList({
    pageSize: 500,
    pageNumber: 1,
  })

  const summary = summaryRes?.data
  const expiring = expiringRes?.data ?? []
  const critical = criticalRes?.data ?? []
  const allDocuments = useMemo(
    () => allDocsRes?.data ?? [],
    [allDocsRes?.data]
  )

  const statusBars = useMemo(
    () => (summary ? buildStatusBarsFromSummary(summary) : []),
    [summary]
  )
  const categoryBars = useMemo(
    () => buildCategoryBars(allDocuments),
    [allDocuments]
  )
  const typeBars = useMemo(() => buildTypeBars(allDocuments), [allDocuments])
  const mandatoryBars = useMemo(
    () => buildMandatoryBars(allDocuments),
    [allDocuments]
  )
  const timelineItems = useMemo(
    () => buildExpiryTimeline(allDocuments),
    [allDocuments]
  )

  const chartsLoading = summaryLoading || docsLoading

  const handleRefresh = () => {
    void refetchSummary()
  }

  return (
    <div className="@container mx-auto space-y-6 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Document Expiry
          </h1>
          <p className="text-muted-foreground text-sm">
            Track licenses, certificates, and compliance documents — with live
            status charts and renewal priorities.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={summaryFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${summaryFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/list`}>
              <List className="mr-2 h-4 w-4" />
              All documents
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`${base}/new`}>
              <FileText className="mr-2 h-4 w-4" />
              New document
            </Link>
          </Button>
        </div>
      </div>

      <DashboardCards
        summary={summary}
        isLoading={summaryLoading}
      />

      {!summaryLoading && <DashboardInsight summary={summary} />}

      <DashboardCharts
        statusBars={statusBars}
        categoryBars={categoryBars}
        typeBars={typeBars}
        mandatoryBars={mandatoryBars}
        timelineItems={timelineItems}
        isLoading={chartsLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Expiring soon</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Documents approaching expiry — renew before status changes.
              </p>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link href={`${base}/list`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DocumentTable
              rows={expiring}
              isLoading={expiringLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Critical (7 days)</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Highest priority — due within the next week.
              </p>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link href={`${base}/list?filter=critical`}>
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DocumentTable
              rows={critical}
              isLoading={criticalLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
          <p className="text-muted-foreground text-sm">
            Reports, reminders, and setup for document types and categories.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/reports`}>
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/settings/reminders`}>
              <Settings className="mr-2 h-4 w-4" />
              Reminder rules
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/settings`}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Module settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
