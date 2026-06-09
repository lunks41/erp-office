import {
  SaveDocumentDetailViewModel,
  SaveDocumentWithDetailsViewModel,
} from "@/interfaces/document-expiry-view-model"
import { formatDateForApi } from "@/lib/date-utils"

export function isDetailLineEmpty(line: SaveDocumentDetailViewModel): boolean {
  return (
    (!line.docTypeId || line.docTypeId <= 0) &&
    !formatDateForApi(line.expiryDate) &&
    !formatDateForApi(line.issueDate) &&
    !line.documentNo?.trim()
  )
}

export function isDetailLineComplete(line: SaveDocumentDetailViewModel): boolean {
  return (
    !!line.docTypeId &&
    line.docTypeId > 0 &&
    !!formatDateForApi(line.expiryDate) &&
    !!formatDateForApi(line.issueDate)
  )
}

function lineLabel(line: SaveDocumentDetailViewModel, index: number): string {
  return line.itemNo && line.itemNo > 0 ? String(line.itemNo) : String(index + 1)
}

/** Returns an error message, or null when valid. */
export function validateDocumentBundleSave(
  values: SaveDocumentWithDetailsViewModel
): string | null {
  if (!values.companyId || values.companyId <= 0) {
    return "Company is required."
  }
  if (!values.title?.trim()) {
    return "Document title is required."
  }
  if (!values.docCategoryId || values.docCategoryId <= 0) {
    return "Category is required."
  }

  const lines = values.details ?? []
  const filledLines = lines.filter(isDetailLineComplete)

  if (filledLines.length === 0) {
    return "Add at least one document line with type, issue date, and expiry date."
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isDetailLineEmpty(line)) continue

    if (!isDetailLineComplete(line)) {
      const label = lineLabel(line, i)
      if (!line.docTypeId || line.docTypeId <= 0) {
        return `Line ${label}: document type is required.`
      }
      if (!formatDateForApi(line.issueDate)) {
        return `Line ${label}: issue date is required.`
      }
      if (!formatDateForApi(line.expiryDate)) {
        return `Line ${label}: expiry date is required.`
      }
    }
  }

  return null
}

/** Strips blank lines and formats dates for the API. */
export function buildDocumentBundlePayload(
  values: SaveDocumentWithDetailsViewModel
): SaveDocumentWithDetailsViewModel {
  return {
    ...values,
    title: values.title.trim(),
    details: (values.details ?? [])
      .filter(isDetailLineComplete)
      .map((d) => ({
        ...d,
        documentNo: d.documentNo?.trim() ?? "",
        issueDate: formatDateForApi(d.issueDate) ?? "",
        expiryDate: formatDateForApi(d.expiryDate) ?? "",
      })),
  }
}
