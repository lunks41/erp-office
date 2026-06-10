export type DebitNoteReportOpenParams = {
  companyId: string
  debitNoteId: number
  debitNoteNo: string
  jobOrderId: string
  taskId: number
  amtDec: number
  locAmtDec: number
  userName: string
  /** When set, overrides getDebitNoteReportFile (e.g. tally service debit note). */
  reportFile?: string
}

/** Resolve Telerik report path from checklist task id (matches service debit-note dialog). */
export function getDebitNoteReportFile(taskId: number): string {
  if (taskId === 8) return "debitnote/DebitNote_Import.trdp"
  if (taskId === 9) return "debitnote/DebitNote_Export.trdp"
  if (taskId === 3) return "debitnote/DebitNote_Used.trdp"
  return "debitnote/DebitNote.trdp"
}

export const TALLY_DEBIT_NOTE_REPORT_FILE = "tallyservice/DebitNote.trdp"

export function openDebitNoteReportWindow(
  params: DebitNoteReportOpenParams
): void {
  const reportFile =
    params.reportFile ?? getDebitNoteReportFile(params.taskId)

  const reportParameters: Record<string, string | number> = {
    companyId: params.companyId,
    debitNoteId: params.debitNoteId.toString(),
    debitNoteNo: params.debitNoteNo,
    jobOrderId: params.jobOrderId,
    taskId: params.taskId,
    amtDec: params.amtDec,
    locAmtDec: params.locAmtDec,
    userName: params.userName,
  }

  // Tally debit note report SQL uses @inJobOrderId (tally service id).
  // Pass aliases so bindings work whether the .trdp maps jobOrderId or inJobOrderId.
  if (reportFile === TALLY_DEBIT_NOTE_REPORT_FILE) {
    reportParameters.inJobOrderId = params.jobOrderId
    reportParameters.tallyServiceId = params.jobOrderId
    reportParameters.inTallyServiceId = params.jobOrderId
  }

  openReportWindow(params.companyId, reportFile, reportParameters)
}

function openReportWindow(
  companyId: string,
  reportFile: string,
  parameters: Record<string, string | number>
): void {
  localStorage.setItem(
    `report_window_${companyId}`,
    JSON.stringify({ reportFile, parameters })
  )

  const windowFeatures =
    "width=1200,height=800,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes"
  window.open(`/${companyId}/reports/window`, "_blank", windowFeatures)
}
