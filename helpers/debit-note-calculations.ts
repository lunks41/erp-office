import { IDecimal } from "@/interfaces/auth"
import { IDebitNoteDt, IDebitNoteHd } from "@/interfaces/checklist"

import {
  calculateAdditionAmount,
  calculateMultiplierAmount,
  calculatePercentagecAmount,
  mathRound,
} from "./account"

/**
 * Calculate quantity * unit price
 */
export const calculateQuantityUnitPrice = (
  qty: number,
  unitPrice: number,
  precision: number = 2
): number => {
  return calculateMultiplierAmount(qty, unitPrice, precision)
}

/**
 * Calculate VAT amount from VAT percentage
 */
export const calculateVatAmount = (
  totalAmount: number,
  vatPercentage: number,
  precision: number = 2
): number => {
  return calculatePercentagecAmount(totalAmount, vatPercentage, precision)
}

/**
 * Calculate total amount after VAT (total amount + VAT amount)
 */
export const calculateTotalAfterVat = (
  totalAmount: number,
  vatAmount: number,
  precision: number = 2
): number => {
  return calculateAdditionAmount(totalAmount, vatAmount, precision)
}

/**
 * Calculate all debit note detail amounts
 */
export const calculateDebitNoteDetailAmounts = (
  qty: number,
  unitPrice: number,
  vatPercentage: number,
  decimals?: Partial<IDecimal>
): {
  totalAmount: number
  vatAmount: number
  totalAfterVat: number
} => {
  const precision = decimals?.amtDec || 2

  // Calculate total amount (qty * unit price)
  const totalAmount = calculateQuantityUnitPrice(qty, unitPrice, precision)

  // Calculate VAT amount
  const vatAmount = calculateVatAmount(totalAmount, vatPercentage, precision)

  // Calculate total after VAT
  const totalAfterVat = calculateTotalAfterVat(
    totalAmount,
    vatAmount,
    precision
  )

  return {
    totalAmount,
    vatAmount,
    totalAfterVat,
  }
}

/**
 * Calculate sum of total amounts from debit note details
 */
export const calculateTotalAmountSum = (
  details: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): number => {
  const precision = decimals?.amtDec || 2
  const sum = details.reduce((total, detail) => {
    return calculateAdditionAmount(total, detail.totAmt || 0, precision)
  }, 0)

  return mathRound(sum, precision)
}

/**
 * Calculate sum of VAT amounts from debit note details
 */
export const calculateVatAmountSum = (
  details: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): number => {
  const precision = decimals?.amtDec || 2
  const sum = details.reduce((total, detail) => {
    return calculateAdditionAmount(total, detail.gstAmt || 0, precision)
  }, 0)

  return mathRound(sum, precision)
}

/**
 * Calculate sum of total after VAT amounts from debit note details
 */
export const calculateTotalAfterVatSum = (
  details: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): number => {
  const precision = decimals?.amtDec || 2
  const sum = details.reduce((total, detail) => {
    return calculateAdditionAmount(total, detail.totAmtAftGst || 0, precision)
  }, 0)

  return mathRound(sum, precision)
}

/**
 * Calculate all summary totals for debit note
 */
export const calculateDebitNoteSummary = (
  details: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): {
  totalAmount: number
  vatAmount: number
  totalAfterVat: number
} => {
  const totalAmount = calculateTotalAmountSum(details, decimals)
  const vatAmount = calculateVatAmountSum(details, decimals)
  const totalAfterVat = calculateTotalAfterVatSum(details, decimals)

  return {
    totalAmount,
    vatAmount,
    totalAfterVat,
  }
}

/**
 * Ensure line totAmtAftGst matches totAmt + gstAmt (fixes stale totals on edit/save).
 * Does not change gstAmt — VAT must be corrected manually when warned.
 */
export const normalizeDebitNoteLineTotals = <
  T extends { totAmt?: number; gstAmt?: number; totAmtAftGst?: number },
>(
  detail: T,
  decimals?: Partial<IDecimal>
): T => {
  const totAmt = detail.totAmt ?? 0
  const gstAmt = detail.gstAmt ?? 0
  const totAmtAftGst = calculateTotalAfterVat(
    totAmt,
    gstAmt,
    decimals?.amtDec ?? 2
  )
  return { ...detail, totAmt, gstAmt, totAmtAftGst }
}

/**
 * Normalize all detail lines before persisting or displaying summary totals.
 */
export const normalizeDebitNoteDetails = (
  details: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): IDebitNoteDt[] =>
  details.map((detail) => normalizeDebitNoteLineTotals(detail, decimals))

/** One line where stored Total (totAmtAftGst) does not equal Amount + VAT. */
export interface DebitNoteLineTotalMismatch {
  itemNo: number
  remarks: string
  totAmt: number
  gstAmt: number
  storedTotAmtAftGst: number
  correctedTotAmtAftGst: number
}

/** Header fields that do not match the sum of detail lines. */
export interface DebitNoteHeaderTotalMismatch {
  field: "totAmt" | "gstAmt" | "totAmtAftGst"
  label: string
  storedValue: number
  correctedValue: number
}

/** gstId 1 = zero / exempt VAT in debit note defaults. */
export const DEBIT_NOTE_EXEMPT_GST_ID = 1

export type DebitNoteGstIssueKind =
  | "should_be_zero"
  | "missing_percentage"
  | "amount_wrong"

/** Line where VAT amount or % does not match gstId and totAmt. */
export interface DebitNoteGstMismatch {
  itemNo: number
  remarks: string
  gstId: number
  gstPercentage: number
  totAmt: number
  storedGstAmt: number
  expectedGstAmt: number
  issue: DebitNoteGstIssueKind
  /** Human-readable reason for the warning banner. */
  reason: string
}

const formatAmt = (value: number, precision: number) =>
  mathRound(value, precision).toFixed(precision)

const buildGstMismatchReason = (
  issue: DebitNoteGstIssueKind,
  row: {
    gstId: number
    gstPercentage: number
    totAmt: number
    storedGstAmt: number
    expectedGstAmt: number
  },
  precision: number
): string => {
  switch (issue) {
    case "missing_percentage":
      return `VAT code ${row.gstId} is taxable but VAT % is 0 (Amount ${formatAmt(row.totAmt, precision)}) — change VAT code or enter VAT Amt manually`
    case "should_be_zero":
      if (row.gstId <= DEBIT_NOTE_EXEMPT_GST_ID) {
        return `Exempt VAT (code ${row.gstId}): VAT amount must be 0 — stored ${formatAmt(row.storedGstAmt, precision)}. Set VAT Amt to 0 and Update`
      }
      return `Amount is 0: VAT amount must be 0 — stored ${formatAmt(row.storedGstAmt, precision)}`
    case "amount_wrong":
      return `VAT should be ${formatAmt(row.expectedGstAmt, precision)} (${row.gstPercentage}% of Amount ${formatAmt(row.totAmt, precision)}) — stored ${formatAmt(row.storedGstAmt, precision)}. Edit VAT Amt on the row and Update`
  }
}

const amountEquals = (a: number, b: number, precision: number) =>
  mathRound(a, precision) === mathRound(b, precision)

/**
 * Find lines where totAmtAftGst on record ≠ totAmt + gstAmt (before normalize).
 */
export const findDebitNoteLineTotalMismatches = (
  details: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): DebitNoteLineTotalMismatch[] => {
  const precision = decimals?.amtDec ?? 2
  const mismatches: DebitNoteLineTotalMismatch[] = []

  for (const detail of details) {
    const totAmt = detail.totAmt ?? 0
    const gstAmt = detail.gstAmt ?? 0
    const storedTotAmtAftGst = detail.totAmtAftGst ?? 0
    const correctedTotAmtAftGst = calculateTotalAfterVat(
      totAmt,
      gstAmt,
      precision
    )

    if (amountEquals(storedTotAmtAftGst, correctedTotAmtAftGst, precision)) {
      continue
    }

    mismatches.push({
      itemNo: detail.itemNo ?? 0,
      remarks: (detail.remarks ?? "").trim(),
      totAmt,
      gstAmt,
      storedTotAmtAftGst,
      correctedTotAmtAftGst,
    })
  }

  return mismatches.sort((a, b) => a.itemNo - b.itemNo)
}

/**
 * Find lines where gstAmt / gstPercentage do not match gstId and totAmt.
 * Uses current line values (table + new rows before Save).
 */
export const findDebitNoteGstMismatches = (
  details: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): DebitNoteGstMismatch[] => {
  const precision = decimals?.amtDec ?? 2
  const mismatches: DebitNoteGstMismatch[] = []

  for (const detail of details) {
    const itemNo = detail.itemNo ?? 0
    const remarks = (detail.remarks ?? "").trim()
    const gstId = Number(detail.gstId) || 0
    const gstPercentage = Number(detail.gstPercentage) || 0
    const totAmt = detail.totAmt ?? 0
    const gstAmt = detail.gstAmt ?? 0

    if (gstId <= DEBIT_NOTE_EXEMPT_GST_ID) {
      if (!amountEquals(gstAmt, 0, precision) || gstPercentage !== 0) {
        const issue = "should_be_zero" as const
        const row = {
          gstId,
          gstPercentage,
          totAmt,
          storedGstAmt: gstAmt,
          expectedGstAmt: 0,
        }
        mismatches.push({
          itemNo,
          remarks,
          ...row,
          issue,
          reason: buildGstMismatchReason(issue, row, precision),
        })
      }
      continue
    }

    if (totAmt <= 0) {
      if (!amountEquals(gstAmt, 0, precision)) {
        const issue = "should_be_zero" as const
        const row = {
          gstId,
          gstPercentage,
          totAmt,
          storedGstAmt: gstAmt,
          expectedGstAmt: 0,
        }
        mismatches.push({
          itemNo,
          remarks,
          ...row,
          issue,
          reason: buildGstMismatchReason(issue, row, precision),
        })
      }
      continue
    }

    if (gstPercentage <= 0) {
      const issue = "missing_percentage" as const
      const row = {
        gstId,
        gstPercentage,
        totAmt,
        storedGstAmt: gstAmt,
        expectedGstAmt: 0,
      }
      mismatches.push({
        itemNo,
        remarks,
        ...row,
        issue,
        reason: buildGstMismatchReason(issue, row, precision),
      })
      continue
    }

    const expectedGstAmt = calculateVatAmount(totAmt, gstPercentage, precision)
    if (!amountEquals(gstAmt, expectedGstAmt, precision)) {
      const issue = "amount_wrong" as const
      const row = {
        gstId,
        gstPercentage,
        totAmt,
        storedGstAmt: gstAmt,
        expectedGstAmt,
      }
      mismatches.push({
        itemNo,
        remarks,
        ...row,
        issue,
        reason: buildGstMismatchReason(issue, row, precision),
      })
    }
  }

  return mismatches.sort((a, b) => a.itemNo - b.itemNo)
}

/**
 * Header where TotAmtAftGst ≠ TotAmt + GstAmt (DB header row inconsistent).
 */
export const findDebitNoteHeaderInternalMismatch = (
  header: {
    totAmt?: number
    gstAmt?: number
    totAmtAftGst?: number
  },
  decimals?: Partial<IDecimal>
): DebitNoteHeaderTotalMismatch | null => {
  const precision = decimals?.amtDec ?? 2
  const totAmt = header.totAmt ?? 0
  const gstAmt = header.gstAmt ?? 0
  const storedTotAmtAftGst = header.totAmtAftGst ?? 0
  const correctedTotAmtAftGst = calculateTotalAfterVat(
    totAmt,
    gstAmt,
    precision
  )

  if (amountEquals(storedTotAmtAftGst, correctedTotAmtAftGst, precision)) {
    return null
  }

  return {
    field: "totAmtAftGst",
    label: "Total (header Amount + VAT)",
    storedValue: storedTotAmtAftGst,
    correctedValue: correctedTotAmtAftGst,
  }
}

/**
 * Compare current working lines to last-saved snapshot (add/update/delete/reorder).
 * Uses raw stored values — do not normalize before compare or DB mismatches are hidden.
 */
export const debitNoteDetailsDifferFromSnapshot = (
  current: IDebitNoteDt[],
  snapshot: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): boolean => {
  const precision = decimals?.amtDec ?? 2

  if (current.length !== snapshot.length) return true

  const snapshotByItem = new Map(snapshot.map((row) => [row.itemNo ?? 0, row]))

  for (const row of current) {
    const saved = snapshotByItem.get(row.itemNo ?? 0)
    if (!saved) return true

    const fields: (keyof IDebitNoteDt)[] = [
      "chargeId",
      "qty",
      "unitPrice",
      "totAmt",
      "gstId",
      "gstPercentage",
      "gstAmt",
      "totAmtAftGst",
      "remarks",
      "refItemNo",
      "isServiceCharge",
      "serviceCharge",
    ]

    for (const field of fields) {
      const a = row[field]
      const b = saved[field]
      if (field === "remarks") {
        if (String(a ?? "") !== String(b ?? "")) return true
      } else if (typeof a === "boolean" || typeof b === "boolean") {
        if (Boolean(a) !== Boolean(b)) return true
      } else if (!amountEquals(Number(a) || 0, Number(b) || 0, precision)) {
        return true
      }
    }
  }

  return false
}

/** Read header amounts from API payload (camelCase or PascalCase). */
export const readDebitNoteHeaderAmounts = (
  header?: IDebitNoteHd | null
): { totAmt: number; gstAmt: number; totAmtAftGst: number } => {
  const raw = header as Record<string, unknown> | null | undefined
  return {
    totAmt: Number(raw?.totAmt ?? raw?.TotAmt ?? 0) || 0,
    gstAmt: Number(raw?.gstAmt ?? raw?.GstAmt ?? 0) || 0,
    totAmtAftGst: Number(raw?.totAmtAftGst ?? raw?.TotAmtAftGst ?? 0) || 0,
  }
}

/** Read detail lines from API payload (data_details or DataDetails). */
export const readDebitNoteDetailsFromHd = (
  header?: IDebitNoteHd | null
): IDebitNoteDt[] => {
  const raw = header as Record<string, unknown> | null | undefined
  const list = raw?.data_details ?? raw?.DataDetails
  return Array.isArray(list) ? (list as IDebitNoteDt[]) : []
}

/** Any stored total issue on lines or header (from server snapshot). */
export const hasDebitNoteStoredTotalIssues = (
  header: { totAmt?: number; gstAmt?: number; totAmtAftGst?: number },
  details: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): boolean => {
  if (findDebitNoteLineTotalMismatches(details, decimals).length > 0) {
    return true
  }
  if (findDebitNoteHeaderInternalMismatch(header, decimals)) {
    return true
  }
  if (
    findDebitNoteHeaderTotalMismatches(header, details, decimals).length > 0
  ) {
    return true
  }
  if (findDebitNoteGstMismatches(details, decimals).length > 0) {
    return true
  }
  return false
}

/**
 * Header totals that do not match rolled-up detail lines.
 */
export const findDebitNoteHeaderTotalMismatches = (
  header: {
    totAmt?: number
    gstAmt?: number
    totAmtAftGst?: number
  },
  details: IDebitNoteDt[],
  decimals?: Partial<IDecimal>
): DebitNoteHeaderTotalMismatch[] => {
  const precision = decimals?.amtDec ?? 2
  const summary = calculateDebitNoteSummary(
    normalizeDebitNoteDetails(details, decimals),
    decimals
  )
  const checks: {
    field: DebitNoteHeaderTotalMismatch["field"]
    label: string
    stored: number
    corrected: number
  }[] = [
    {
      field: "totAmt",
      label: "Amount",
      stored: header.totAmt ?? 0,
      corrected: summary.totalAmount,
    },
    {
      field: "gstAmt",
      label: "VAT",
      stored: header.gstAmt ?? 0,
      corrected: summary.vatAmount,
    },
    {
      field: "totAmtAftGst",
      label: "Total",
      stored: header.totAmtAftGst ?? 0,
      corrected: summary.totalAfterVat,
    },
  ]

  return checks
    .filter((c) => !amountEquals(c.stored, c.corrected, precision))
    .map((c) => ({
      field: c.field,
      label: c.label,
      storedValue: c.stored,
      correctedValue: c.corrected,
    }))
}

/**
 * Recalculate all amounts for a debit note detail when any field changes
 */
export const recalculateDebitNoteDetail = (
  detail: Partial<IDebitNoteDt>,
  decimals?: Partial<IDecimal>
): Partial<IDebitNoteDt> => {
  const qty = detail.qty || 0
  const unitPrice = detail.unitPrice || 0
  const vatPercentage = detail.gstPercentage || 0

  const calculated = calculateDebitNoteDetailAmounts(
    qty,
    unitPrice,
    vatPercentage,
    decimals
  )

  return {
    ...detail,
    totAmt: calculated.totalAmount,
    gstAmt: calculated.vatAmount,
    totAmtAftGst: calculated.totalAfterVat,
  }
}

/**
 * Validate and format amounts for display
 */
export const formatAmount = (
  amount: number,
  decimals?: Partial<IDecimal>,
  type: "amount" | "local" | "city" = "amount"
): number => {
  const precision =
    type === "amount"
      ? decimals?.amtDec || 2
      : type === "local"
        ? decimals?.locAmtDec || 2
        : decimals?.ctyAmtDec || 2

  return mathRound(amount, precision)
}
