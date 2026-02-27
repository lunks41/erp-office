"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import type { TelerikReportViewer } from "@progress/telerik-react-report-viewer"

import ReportView from "@/components/reports/reportview"

export default function ReportWindowViewerPage() {
  const params = useParams()
  const companyId = Number(params.companyId)
  const viewerRef = useRef<TelerikReportViewer>(null)
  const [reportData, setReportData] = useState<{
    reportFile: string
    parameters: Record<string, unknown>
  } | null>(null)

  useEffect(() => {
    // Use localStorage so the popup can read data (sessionStorage is not shared with new windows)
    // Delay removeItem so React Strict Mode (dev) double-mount doesn't clear before second read
    const storageKey = `report_window_${companyId}`
    try {
      const storedData = localStorage.getItem(storageKey)
      if (storedData) {
        const parsed = JSON.parse(storedData)
        setReportData({
          reportFile: parsed.reportFile,
          parameters: parsed.parameters,
        })
        // Clear after a short delay so dev Strict Mode's second mount can still read
        const clearTimer = setTimeout(() => {
          localStorage.removeItem(storageKey)
        }, 300)
        return () => clearTimeout(clearTimer)
      }
    } catch (error) {
      console.error("Error reading report data:", error)
    }

    setReportData(null)
  }, [companyId])

  if (!reportData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="text-destructive text-lg font-semibold">
            No Report Data Available
          </div>
          <div className="text-muted-foreground mt-2 text-sm">
            Please open a report from the application to view it here.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-full flex-col">
      <div className="relative w-full flex-1 overflow-hidden">
        <ReportView
          viewerRef={viewerRef}
          reportSource={{
            report: reportData.reportFile,
            parameters: reportData.parameters,
          }}
        />
      </div>
    </div>
  )
}
