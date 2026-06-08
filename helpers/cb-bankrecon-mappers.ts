import type { CbBankReconDtSchemaType } from "@/schemas/cb-bankrecon"

type DetailLike = Record<string, unknown>

export function parseNumericField(value: unknown): number {
  if (value == null || value === "") return 0
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value).trim())
  return Number.isFinite(parsed) ? parsed : 0
}

/** API view model returns PrevReconId as string (Int64). */
export function parseBankReconPrevReconId(value: unknown): number {
  return parseNumericField(value)
}

/** API returns DocumentId as string (often module prefix + id). */
export function parseBankReconDocumentId(detail: DetailLike): number {
  const raw =
    detail.documentId ?? detail.DocumentId ?? detail.documentID ?? detail.DOCUMENT_ID

  const parsed = parseNumericField(raw)
  if (parsed > 0) return parsed

  const moduleId = parseNumericField(detail.moduleId ?? detail.ModuleId)
  const documentIdOnly = parseNumericField(
    detail.document_Id ?? detail.docId ?? detail.DocId
  )
  if (moduleId > 0 && documentIdOnly > 0) {
    const composite = Number(`${moduleId}${documentIdOnly}`)
    if (Number.isFinite(composite) && composite > 0) return composite
  }

  return 0
}

/** Match SQL default: ISNULL(EX_RATE, 1.0) */
export function parseBankReconExhRate(value: unknown): number {
  const parsed = parseNumericField(value)
  return parsed > 0 ? parsed : 1
}

export function normalizeBankReconDetailFields(detail: DetailLike): DetailLike {
  return {
    ...detail,
    moduleId: parseNumericField(detail.moduleId ?? detail.ModuleId),
    transactionId: parseNumericField(detail.transactionId ?? detail.TransactionId),
    documentId: parseBankReconDocumentId(detail),
    exhRate: parseBankReconExhRate(detail.exhRate ?? detail.ExhRate),
    totAmt: parseNumericField(detail.totAmt ?? detail.TotAmt),
    totLocalAmt: parseNumericField(detail.totLocalAmt ?? detail.TotLocalAmt),
  }
}

export function mapBankReconDetailFromApi(
  detail: DetailLike,
  overrides: DetailLike = {}
): CbBankReconDtSchemaType {
  return normalizeBankReconDetailFields({
    ...detail,
    ...overrides,
  }) as unknown as CbBankReconDtSchemaType
}
