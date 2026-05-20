import { toast } from "sonner"

export type OpenInvoicePreviewReportParams = {
  companyId: string | number
  previewKey: string
  userName?: string
  amtDec?: number
  locAmtDec?: number
}

/** Opens Telerik report window for draft invoice (checklist/InvoicePreview.trdp). */
export function openInvoicePreviewReport({
  companyId,
  previewKey,
  userName = "",
  amtDec = 2,
  locAmtDec = 2,
}: OpenInvoicePreviewReportParams): boolean {
  if (!previewKey?.trim()) {
    toast.error("Print preview is not available. Load the invoice preview first.")
    return false
  }

  const reportData = {
    reportFile: "checklist/InvoicePreview.trdp",
    parameters: {
      companyId,
      previewKey,
      reportType: 2,
      userName,
      amtDec,
      locAmtDec,
    },
  }

  try {
    localStorage.setItem(
      `report_window_${companyId}`,
      JSON.stringify(reportData)
    )
    const windowFeatures =
      "width=1200,height=800,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes"
    const viewerUrl = `/${companyId}/reports/window`
    window.open(viewerUrl, "_blank", windowFeatures)
    return true
  } catch {
    toast.error("Failed to open report")
    return false
  }
}
