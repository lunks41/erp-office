import {
  calculateAdditionAmount,
  calculateDivisionAmount,
  calculateMultiplierAmount,
  calculateSubtractionAmount,
  mathRound,
} from "@/helpers/account"
import { IArReceiptDt, IDecimal } from "@/interfaces"

// ============================================================================
// PRECISION — ENTERPRISE ROUNDING
// ============================================================================

/** Tolerance for treating allocation as "full" when difference is within 0.01 (rule 6). */
const ROUNDING_TOLERANCE = 0.01

/** Default decimals when not provided (avoid undefined in math). */
const DEFAULT_DECIMALS: IDecimal = {
  amtDec: 2,
  locAmtDec: 2,
  ctyAmtDec: 2,
  priceDec: 2,
  qtyDec: 2,
  exhRateDec: 4,
  dateFormat: "dd/MM/yyyy",
  longDateFormat: "dd/MM/yyyy HH:mm",
}

function getDecimals(decimals?: IDecimal): IDecimal {
  return decimals && typeof decimals.amtDec === "number"
    ? decimals
    : DEFAULT_DECIMALS
}

// ============================================================================
// ALLOC AMOUNTS — allocAmt, allocLocalAmt, allocPayAmt (TABLE FORM)
// ============================================================================
//
// ┌─────────────┬──────────────────┬─────────────────────────┬────────────────────────────────────────────┐
// │ Field       │ Currency          │ Formula                  │ Where set / how to add                      │
// ├─────────────┼──────────────────┼─────────────────────────┼────────────────────────────────────────────┤
// │ allocAmt    │ Document currency │ (input: auto or manual)  │ autoAllocateAmounts or user →              │
// │             │ (e.g. USD, AED)   │                         │ calculateManualAllocation; details[i].allocAmt │
// ├─────────────┼──────────────────┼─────────────────────────┼────────────────────────────────────────────┤
// │ allocLocalAmt│ Local (e.g. AED) │ allocAmt * docExhRate   │ calauteLocalAmtandGainLoss:                 │
// │             │                  │ (Rule 3)                │ calculateMultiplierAmount(allocAmt,        │
// │             │                  │                         │   docExhRate, decimals.locAmtDec)           │
// ├─────────────┼──────────────────┼─────────────────────────┼────────────────────────────────────────────┤
// │ allocPayAmt │ Receiving currency│ allocLocalAmt/recExhRate│ calauteLocalAmtandGainLoss:                 │
// │             │ (receipt currency)│ (Rule 4)                │ calculateDivisionAmount(allocLocalAmt,       │
// │             │                  │ = (allocAmt*docExh)/recExh│   recExhRate, decimals.amtDec)             │
// └─────────────┴──────────────────┴─────────────────────────┴────────────────────────────────────────────┘
//
// FLOW (per row):
//   allocAmt ──(× docExhRate)──► allocLocalAmt ──(÷ recExhRate)──► allocPayAmt
//
// TOTALS & UNALLOCATED:
//   sum(allocPayAmt) - recTotAmt = unAllocAmt  (Rule 5)
//
// EXAMPLE ROW (doc USD, docExhRate 3.6725, recExhRate 1, AED local/receiving):
//   allocAmt=250 → allocLocalAmt=250*3.6725=918.13 → allocPayAmt=918.13/1=918.13
//
// ---------------------------------------------------------------------------
// FULL EXAMPLE (recTotAmt = 3672.50 AED, recExhRate = 1) — correct: last row partial.
// ---------------------------------------------------------------------------
//
//   Doc No        | Cur | docExhRate | docBalAmt  | allocAmt   | allocLocalAmt | allocPayAmt
//   --------------|-----|------------|------------|------------|---------------|-------------
//   RCT25-12-099  | USD | 3.6725     | -1962.06   | -1962.06   | -7205.67      | -7205.67
//   AM-2512-0036  | AED | 1          | 9826.81    | 9826.81    | 9826.81       | 9826.81
//   AM-DI2602001  | USD | 3.6725     | 250        | 250        | 918.13        | 918.13
//   AM-DI2601021  | AED | 1          | 1000       | 133.23     | 133.23        | 133.23   ← last row partial
//   --------------|-----|------------|------------|------------|---------------|-------------
//   (totals)      |     |            |            |            |               | 3672.50
//
//   Check (Rule 5): unAllocAmt = -recTotAmt + sum(allocPayAmt)
//   = (-3672.50) + (-7205.67 + 9826.81 + 918.13 + 133.23) = -3672.50 + 3672.50 = 0
//
//   Last invoice (AM-DI2601021): partial allocAmt = 133.23 so sum(allocPayAmt) exactly matches recTotAmt.
//   Row 4: allocLocalAmt = 133.23 * 1 = 133.23; allocPayAmt = 133.23 / 1 = 133.23
//
// ---------------------------------------------------------------------------
// DETAIL TABLE COLUMNS (UI) → FIELDS:
// ┌─────────────────┬──────────────────┐
// │ Table column    │ Field / source   │
// ├─────────────────┼──────────────────┤
// │ Bal Amt         │ docBalAmt        │
// │ Bal Loc An      │ docBalLocalAmt   │
// │ Exh Rate        │ docExhRate       │
// │ Alloc Amt       │ allocAmt (edit)  │
// │ Alloc Loc Amt   │ allocLocalAmt    │
// │ Alloc Pay Amt   │ allocPayAmt      │
// └─────────────────┴──────────────────┘
//
// ============================================================================

/**
 * AllocPayAmt in receiving currency: allocLocalAmt / RecExhRate.
 * allocLocalAmt = allocAmt * docExhRate (rule 3).
 * So allocPayAmt = (allocAmt * docExhRate) / recExhRate — rounded to amtDec.
 */
function allocPayAmtFromAlloc(
  allocAmt: number,
  docExhRate: number,
  recExhRate: number,
  amtDec: number
): number {
  if (recExhRate === 0) return 0
  const allocLocalAmt = calculateMultiplierAmount(allocAmt, docExhRate, amtDec)
  return calculateDivisionAmount(allocLocalAmt, recExhRate, amtDec)
}

/**
 * Whether a difference is within rounding tolerance (rule 6).
 */
function withinTolerance(
  diff: number,
  tolerance: number = ROUNDING_TOLERANCE
): boolean {
  return Math.abs(diff) <= tolerance
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const validateAllocation = (details: IArReceiptDt[]): boolean => {
  return details.length > 0
}

// ============================================================================
// HEADER CALCULATIONS
// ============================================================================

/**
 * Same Currency scenario
 * Inputs: totAmt, exhRate
 * Outputs: { totAmt, totLocalAmt, recTotAmt, recTotLocalAmt }
 */
export const calculateSameCurrency = (
  totAmt: number,
  exhRate: number,
  decimals: IDecimal
) => {
  const totLocalAmt = calculateMultiplierAmount(
    totAmt,
    exhRate,
    decimals.locAmtDec
  )
  const recTotAmt = totAmt
  const recTotLocalAmt = totLocalAmt

  return {
    totAmt,
    totLocalAmt,
    recTotAmt,
    recTotLocalAmt,
  }
}

/**
 * Different Currency scenario
 * Inputs: recTotAmt, recExhRate, exhRate
 * Outputs: { recTotAmt, recTotLocalAmt, totAmt, totLocalAmt }
 */
export const calculateDiffCurrency = (
  recTotAmt: number,
  recExhRate: number,
  exhRate: number,
  decimals: IDecimal
) => {
  const recTotLocalAmt = calculateMultiplierAmount(
    recTotAmt,
    recExhRate,
    decimals.locAmtDec
  )
  const totAmt = calculateDivisionAmount(
    recTotLocalAmt,
    exhRate,
    decimals.amtDec
  )
  const totLocalAmt = calculateMultiplierAmount(
    totAmt,
    exhRate,
    decimals.locAmtDec
  )

  return {
    recTotAmt,
    recTotLocalAmt,
    totAmt,
    totLocalAmt,
  }
}

/**
 * Unallocated Amounts
 * Inputs: totAmt, totLocalAmt, allocTotAmt, allocTotLocalAmt
 * Outputs: { unAllocAmt, unAllocLocalAmt }
 */
export const calculateUnallocated = (
  totAmt: number,
  totLocalAmt: number,
  allocTotAmt: number,
  allocTotLocalAmt: number,
  decimals: IDecimal
) => {
  const unAllocAmt = calculateSubtractionAmount(
    totAmt,
    allocTotAmt,
    decimals.amtDec
  )
  const unAllocLocalAmt = calculateSubtractionAmount(
    totLocalAmt,
    allocTotLocalAmt,
    decimals.locAmtDec
  )

  return {
    unAllocAmt,
    unAllocLocalAmt,
  }
}

export const applyCentDiffAdjustment = (
  details: IArReceiptDt[],
  unAllocAmt: number,
  unAllocLocalAmt: number,
  decimals: IDecimal
): boolean => {
  if (!Array.isArray(details) || details.length === 0) {
    return false
  }

  const normalizedUnAllocAmt = Number(unAllocAmt) || 0

  const precision = decimals?.locAmtDec ?? 2
  const roundedUnAllocLocal = mathRound(Number(unAllocLocalAmt) || 0, precision)

  if (
    normalizedUnAllocAmt !== 0 ||
    roundedUnAllocLocal === 0 ||
    roundedUnAllocLocal >= 1
  ) {
    let resetPerformed = false
    details.forEach((row) => {
      if (Number(row.centDiff) !== 0) {
        row.centDiff = 0
        resetPerformed = true
      }
    })
    return resetPerformed
  }

  const targetIndex = details.findIndex((row) => Number(row.exhGainLoss) !== 0)
  // When no row has exhGainLoss, apply cent-diff to first detail row (index 0)
  const applyIndex = targetIndex === -1 ? 0 : targetIndex

  details.forEach((row, idx) => {
    if (idx !== applyIndex && Number(row.centDiff) !== 0) {
      row.centDiff = 0
    }
  })

  const targetRow = details[applyIndex]
  const existingCentDiff = Number(targetRow.centDiff) || 0
  targetRow.centDiff = mathRound(
    existingCentDiff + roundedUnAllocLocal,
    precision
  )

  return true
}

// ============================================================================
// AUTO ALLOCATION
// ============================================================================

/**
 * Auto-allocate receipt amount (recTotAmt, in receiving currency) across details.
 *
 * Rule 1: recTotAmt === 0 → allocAmt = docBalAmt for all rows (full allocation).
 *
 * Rule 2: recTotAmt > 0 (process when user clicks Auto Alloc):
 *   1. Effective amount = recTotAmt + (all -ve amount from details).
 *   2. Allocate positives using min(remainingRec, maxPayForRow); last row (by itemNo) gets the remainder.
 *
 * allocPayAmt = allocLocalAmt / RecExhRate; allocLocalAmt = allocAmt * docExhRate.
 * Rule 6: if diff = sum(allocPayAmt) - recTotAmt is non-zero but |diff| <= 0.01, set last partial row to full docBalAmt to absorb rounding; when diff === 0 keep last row partial.
 *
 * ---------------------------------------------------------------------------
 * EXAMPLE (as in AR receipt allocation table), recTotAmt = 3672.50 AED, recExhRate = 1:
 *
 * INPUT TABLE (details):
 *   itemNo | Doc No        | Cur | docExhRate | docBalAmt  | docBalLocalAmt
 *   -------|---------------|-----|------------|------------|----------------
 *   1      | RCT25-12-099  | USD | 3.6725     | -1962.06   | -7205.68
 *   2      | AM-2512-0036  | AED | 1          | 9826.81    | 9826.81
 *   3      | AM-DI2602001  | USD | 3.6725     | 250        | 918.13
 *   4      | AM-DI2601021  | AED | 1          | 1000       | 1000
 *
 * SORT: negatives first, then positives by itemNo → order: 1, 2, 3, 4.
 *
 * ALLOCATION LOOP:
 *   Row 1 (neg): allocAmt = -1962.06, allocPayAmt = -7205.67 → runningSumPay = -7205.67
 *   remainingRec = 3672.50 - (-7205.67) = 10878.17 (effective = recTotAmt + |negatives|)
 *
 *   Row 2: remainingRec = 1051.36, maxPayForRow = 9826.81 → full → allocAmt = 9826.81, runningSumPay = 2621.14
 *   Row 3: remainingRec = 1051.36, maxPayForRow = 918.13  → full → allocAmt = 250,    runningSumPay = 3539.27
 *   Row 4: remainingRec = 133.23, maxPayForRow = 1000    → partial → allocAmt = 133.23, lastPartialIndex = 3
 *
 * OUTPUT: allocAmt = -1962.06, 9826.81, 250, 133.23 (last row partial so sum(allocPayAmt) = recTotAmt).
 * When diff === 0 we keep last row partial (133.23). Rule 6 only runs when diff !== 0 but within 0.01.
 */
export const autoAllocateAmounts = (
  details: IArReceiptDt[],
  recTotAmt: number,
  decimals?: IDecimal,
  recCurrencyId?: number,
  recExhRate?: number
) => {
  const dec = getDecimals(decimals)
  const amtDec = dec.amtDec
  const locAmtDec = dec.locAmtDec
  const recRate = Number(recExhRate) || 1
  const updatedDetails = (details || []).map((d) => ({ ...d }))

  if (recTotAmt === 0) {
    updatedDetails.forEach((row) => {
      const docBal = Number(row.docBalAmt) || 0
      row.allocAmt = mathRound(docBal, amtDec)
    })
    return { updatedDetails }
  }

  const byItemNo = new Map<number, IArReceiptDt>()
  updatedDetails.forEach((r) => byItemNo.set(r.itemNo, r))

  // Negatives first; then positives by itemNo ascending so the last row in table gets the remainder (partial)
  const sorted = [...updatedDetails].sort((a, b) => {
    const aBal = Number(a.docBalAmt) || 0
    const bBal = Number(b.docBalAmt) || 0
    if (aBal < 0 && bBal >= 0) return -1
    if (aBal >= 0 && bBal < 0) return 1
    if (aBal >= 0 && bBal >= 0) return (a.itemNo ?? 0) - (b.itemNo ?? 0)
    return 0
  })

  // remainingRec = recTotAmt - sum(allocPayAmt so far); allocate so sum(allocPayAmt) → recTotAmt
  let runningSumPay = 0
  let lastPartialIndex = -1

  sorted.forEach((row, idx) => {
    const docBal = Number(row.docBalAmt) || 0
    const docBalLocalAmt = Number(row.docBalLocalAmt) || 0
    const docExhRate = Number(row.docExhRate) || 0
    const remainingRec = mathRound(
      calculateSubtractionAmount(recTotAmt, runningSumPay, amtDec),
      amtDec
    )

    if (docBal < 0) {
      row.allocAmt = mathRound(docBal, amtDec)
      const pay = allocPayAmtFromAlloc(
        row.allocAmt,
        docExhRate,
        recRate,
        amtDec
      )
      runningSumPay = calculateAdditionAmount(runningSumPay, pay, amtDec)
      return
    }

    if (remainingRec <= 0) {
      row.allocAmt = 0
      return
    }

    const docBalLocal =
      docExhRate !== 0
        ? calculateMultiplierAmount(docBal, docExhRate, locAmtDec)
        : docBalLocalAmt
    const maxPayForRow =
      recRate !== 0 ? calculateDivisionAmount(docBalLocal, recRate, amtDec) : 0

    const payToUse = maxPayForRow > 0 ? Math.min(remainingRec, maxPayForRow) : 0

    if (payToUse <= 0) {
      row.allocAmt = 0
      return
    }

    if (payToUse >= maxPayForRow) {
      row.allocAmt = mathRound(docBal, amtDec)
      const pay = allocPayAmtFromAlloc(
        row.allocAmt,
        docExhRate,
        recRate,
        amtDec
      )
      runningSumPay = calculateAdditionAmount(runningSumPay, pay, amtDec)
      console.log("if pay", pay)
      console.log("if allocAmt", row.allocAmt)
    } else {
      const allocAmtFromRemaining =
        docExhRate !== 0 && recRate !== 0
          ? calculateDivisionAmount(payToUse * recRate, docExhRate, amtDec)
          : payToUse
      const clamp = Math.min(Math.abs(docBal), Math.abs(allocAmtFromRemaining))
      row.allocAmt = mathRound(Math.sign(docBal) * clamp, amtDec)
      const pay = allocPayAmtFromAlloc(
        row.allocAmt,
        docExhRate,
        recRate,
        amtDec
      )

      runningSumPay = calculateAdditionAmount(runningSumPay, pay, amtDec)
      lastPartialIndex = idx
      console.log("else pay", pay)
      console.log("else allocAmt", row.allocAmt)
    }
    console.log("runningSumPay", runningSumPay)
  })

  sorted.forEach((r) => {
    const target = byItemNo.get(r.itemNo)
    if (target) target.allocAmt = r.allocAmt
  })

  const sumPay = updatedDetails.reduce(
    (acc, row) =>
      calculateAdditionAmount(
        acc,
        allocPayAmtFromAlloc(
          Number(row.allocAmt) || 0,
          Number(row.docExhRate) || 0,
          recRate,
          amtDec
        ),
        amtDec
      ),
    0
  )
  const diff = mathRound(sumPay - recTotAmt, amtDec)

  // Rule 6: only absorb rounding by setting last partial row to full when there is a small non-zero gap.
  // When diff === 0 the last row partial is correct (e.g. 133.23); do not expand to full.
  if (diff !== 0 && withinTolerance(diff) && lastPartialIndex >= 0) {
    const row = sorted[lastPartialIndex]
    const docBal = Number(row.docBalAmt) || 0
    if (docBal > 0 && (Number(row.allocAmt) || 0) < docBal) {
      row.allocAmt = mathRound(docBal, amtDec)
      const target = byItemNo.get(row.itemNo)
      if (target) target.allocAmt = row.allocAmt
    }
  }

  return { updatedDetails }
}

export const calauteLocalAmtandGainLoss = (
  details: IArReceiptDt[],
  rowNumber: number,
  exhRate: number,
  recExhRate: number,
  decimals: IDecimal
) => {
  if (!details || rowNumber < 0 || rowNumber >= details.length) {
    return details?.[rowNumber]
  }

  const allocAmt = Number(details[rowNumber].allocAmt) || 0
  const docBalAmt = Number(details[rowNumber].docBalAmt) || 0
  const docBalLocalAmt = Number(details[rowNumber].docBalLocalAmt) || 0

  if (allocAmt === 0) {
    details[rowNumber].allocLocalAmt = 0
    details[rowNumber].docAllocAmt = 0
    details[rowNumber].docAllocLocalAmt = 0
    details[rowNumber].allocPayAmt = 0
    details[rowNumber].centDiff = 0
    details[rowNumber].exhGainLoss = 0
    return details[rowNumber]
  }

  const isFullBalanceAllocation =
    calculateSubtractionAmount(docBalAmt, allocAmt, decimals.amtDec) === 0

  console.log("isFullBalanceAllocation", isFullBalanceAllocation)
  console.log("docBalAmt", docBalAmt)
  console.log("allocAmt", allocAmt)

  const allocLocalAmt = isFullBalanceAllocation
    ? docBalLocalAmt
    : calculateMultiplierAmount(
        allocAmt,
        details[rowNumber].docExhRate,
        decimals.locAmtDec
      )

  console.log("allocLocalAmt", allocLocalAmt)

  const allocPayAmt = calculateDivisionAmount(
    allocLocalAmt,
    recExhRate,
    decimals.amtDec
  )

  const docAllocAmt = allocAmt

  const docAllocLocalAmt = isFullBalanceAllocation
    ? docBalLocalAmt
    : calculateMultiplierAmount(
        allocAmt,
        details[rowNumber].docExhRate,
        decimals.locAmtDec
      )

  const exhGainLoss = calculateSubtractionAmount(
    allocLocalAmt,
    docAllocLocalAmt,
    decimals.locAmtDec
  )
  // centDiff is always set to 0
  const centDiff = 0

  details[rowNumber].allocLocalAmt = allocLocalAmt
  details[rowNumber].allocPayAmt = allocPayAmt
  details[rowNumber].docAllocAmt = docAllocAmt
  details[rowNumber].docAllocLocalAmt = docAllocLocalAmt
  details[rowNumber].centDiff = centDiff
  details[rowNumber].exhGainLoss = exhGainLoss

  return details[rowNumber]
}

/**
 * Manual allocation: cap allocAmt by doc balance and by remaining receipt in receiving currency.
 * remainingRec = recTotAmt - sum(other rows' allocPayAmt); allocPayAmt = allocLocalAmt/RecExhRate = (allocAmt*docExhRate)/recExhRate.
 * All arithmetic uses decimals.amtDec for precision.
 */
export const calculateManualAllocation = (
  details: IArReceiptDt[],
  rowNumber: number,
  allocAmt: number,
  recTotAmt?: number,
  recExhRate?: number,
  decimals?: IDecimal
): { result: IArReceiptDt; wasAutoSetToZero: boolean } => {
  if (!details || rowNumber < 0 || rowNumber >= details.length) {
    return { result: details[rowNumber], wasAutoSetToZero: false }
  }

  const dec = getDecimals(decimals)
  const amtDec = dec.amtDec
  const docBalAmt = Number(details[rowNumber].docBalAmt) || 0
  const docExhRate = Number(details[rowNumber].docExhRate) || 0
  let finalAlloc = mathRound(Number(allocAmt) || 0, amtDec)
  const originalRequested = finalAlloc
  let wasAutoSetToZero = false

  const clampToBalance = (allocation: number, balance: number): number => {
    if (balance === 0) return 0
    const maxAbs = Math.abs(balance)
    const absAlloc = Math.abs(allocation)
    return mathRound(Math.sign(balance) * Math.min(absAlloc, maxAbs), amtDec)
  }

  const recRate = Number(recExhRate) || 1
  const recTotal = Number(recTotAmt) ?? 0

  if (recTotal > 0 && recRate > 0) {
    let sumOtherPay = 0
    details.forEach((row, idx) => {
      if (idx === rowNumber) return
      const rowAlloc = Number(row.allocAmt) || 0
      const rowDocExh = Number(row.docExhRate) || 0
      const pay = allocPayAmtFromAlloc(rowAlloc, rowDocExh, recRate, amtDec)
      sumOtherPay = calculateAdditionAmount(sumOtherPay, pay, amtDec)
    })
    const remainingRec = calculateSubtractionAmount(
      recTotal,
      sumOtherPay,
      amtDec
    )

    if (docBalAmt < 0) {
      if (finalAlloc < 0) {
        finalAlloc = mathRound(docBalAmt, amtDec)
      } else {
        finalAlloc = 0
      }
    } else if (docBalAmt > 0) {
      finalAlloc = clampToBalance(finalAlloc, docBalAmt)
      const payForRequested = allocPayAmtFromAlloc(
        finalAlloc,
        docExhRate,
        recRate,
        amtDec
      )
      if (remainingRec <= 0) {
        if (originalRequested > 0) wasAutoSetToZero = true
        finalAlloc = 0
      } else if (payForRequested > remainingRec) {
        const maxAllocFromRemaining =
          docExhRate !== 0
            ? calculateDivisionAmount(
                remainingRec * recRate,
                docExhRate,
                amtDec
              )
            : remainingRec
        finalAlloc = clampToBalance(maxAllocFromRemaining, docBalAmt)
        if (originalRequested > 0 && finalAlloc < originalRequested) {
          wasAutoSetToZero = true
        }
      }
    } else {
      finalAlloc = 0
    }
  } else {
    finalAlloc = clampToBalance(finalAlloc, docBalAmt)
  }

  details[rowNumber].allocAmt = finalAlloc
  return { result: details[rowNumber], wasAutoSetToZero }
}
