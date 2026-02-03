"use client"

import { useMemo, type RefObject } from "react"
import dynamic from "next/dynamic"
import type { TelerikReportViewer } from "@progress/telerik-react-report-viewer"

const ReactReportViewer = dynamic(
  () =>
    import("@progress/telerik-react-report-viewer").then(
      (types) => types.TelerikReportViewer
    ),
  { ssr: false }
) as typeof TelerikReportViewer

interface IReportViewProps {
  viewerRef: RefObject<TelerikReportViewer | null>
  reportSource: { report: string; parameters: Record<string, unknown> }
}

export default function ReportView({
  viewerRef,
  reportSource,
}: IReportViewProps) {
  // Create a unique key based on report and parameters to force remount on change
  const reportKey = useMemo(
    () => `${reportSource.report}-${JSON.stringify(reportSource.parameters)}`,
    [reportSource.report, reportSource.parameters]
  )

  // Handle ref assignment and patch dispose method immediately
  const handleRef = (instance: TelerikReportViewer | null) => {
    if (instance) {
      const viewer = instance as unknown as {
        dispose?: () => void
        viewerObject?: { dispose?: () => void }
      }

      // Patch dispose method to safely check if viewerObject.dispose exists
      if (viewer.dispose) {
        const originalDispose = viewer.dispose.bind(viewer)
        viewer.dispose = () => {
          try {
            if (
              viewer.viewerObject &&
              typeof viewer.viewerObject.dispose === "function"
            ) {
              viewer.viewerObject.dispose()
            } else {
              // If viewerObject doesn't have dispose, try original dispose
              // but catch any errors
              try {
                originalDispose()
              } catch (error) {
                // Silently handle - viewerObject.dispose doesn't exist
                console.warn(
                  "Error in dispose (viewerObject.dispose not available):",
                  error
                )
              }
            }
          } catch (error) {
            console.warn("Error disposing viewer:", error)
          }
        }
      }

      // Ensure viewerObject has a dispose method if it doesn't exist
      // This prevents the "dispose is not a function" error
      if (viewer.viewerObject && !viewer.viewerObject.dispose) {
        viewer.viewerObject.dispose = () => {
          // No-op if dispose doesn't exist - prevents errors
        }
      }
    }

    // Assign to the ref
    if (viewerRef && "current" in viewerRef) {
      viewerRef.current = instance
    }
  }

  return (
    <ReactReportViewer
      key={reportKey}
      ref={handleRef}
      serviceUrl={process.env.NEXT_PUBLIC_TELERIK_REPORT_API}
      reportSource={{
        report: reportSource.report,
        parameters: reportSource.parameters,
      }}
      viewerContainerStyle={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
      //viewMode="INTERACTIVE"
      viewMode="PRINT_PREVIEW"
      scaleMode="SPECIFIC"
      scale={1.0}
      enableAccessibility={false}
    />
  )
}
