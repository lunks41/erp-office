import {
  calculateDivisionAmount,
  calculateMultiplierAmount,
  calculateSubtractionAmount,
  mathRound,
} from "@/helpers/account"
import { IArReceiptDt, IDecimal } from "@/interfaces"

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

  if (targetIndex === -1) {
    let resetPerformed = false
    details.forEach((row) => {
      if (Number(row.centDiff) !== 0) {
        row.centDiff = 0
        resetPerformed = true
      }
    })
    return resetPerformed
  }

  details.forEach((row, idx) => {
    if (idx !== targetIndex && Number(row.centDiff) !== 0) {
      row.centDiff = 0
    }
  })

  const targetRow = details[targetIndex]
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
 * Auto allocation over details.
 * Conditions:
 * 1) If totAmt == 0: set allocAmt = docBalAmt for all rows
 * 2) If totAmt > 0: sort rows placing negative docBalAmt first, then allocate
 *    by consuming remaining amount across positives; negatives are fully taken first
 * After allocation, computes local amounts, doc allocations, gain/loss, sums, and unallocated.
 */
export const autoAllocateAmounts = (
  details: IArReceiptDt[],
  totAmt: number,
  decimals?: IDecimal
) => {
  const updatedDetails = (details || []).map((d) => ({ ...d }))

  if (totAmt === 0) {
    // Rule 1: totAmt == 0 → allocAmt = docBalAmt for all
    updatedDetails.forEach((row) => {
      const balanceAmount = Number(row.docBalAmt) || 0
      row.allocAmt = balanceAmount
    })
  } else {
    // Rule 2: totAmt <> 0 → allocate with negatives first
    let remainingAllocationAmt = Number(totAmt) || 0

    // Keep original order reference
    const byItemNo = new Map<number, IArReceiptDt>()
    updatedDetails.forEach((r) => byItemNo.set(r.itemNo, r))

    // Sort: negatives first, keep relative order otherwise
    const sorted = [...updatedDetails].sort((a, b) => {
      const aBal = Number(a.docBalAmt) || 0
      const bBal = Number(b.docBalAmt) || 0
      if (aBal < 0 && bBal >= 0) return -1
      if (aBal >= 0 && bBal < 0) return 1
      return 0
    })

    sorted.forEach((row) => {
      const balanceAmount = Number(row.docBalAmt) || 0

      if (balanceAmount < 0) {
        // Fully take negatives first; increases remaining
        row.allocAmt = balanceAmount
        remainingAllocationAmt = decimals
          ? calculateSubtractionAmount(
              remainingAllocationAmt,
              balanceAmount,
              decimals.amtDec
            )
          : remainingAllocationAmt - balanceAmount // subtracting a negative adds
        return
      }

      if (remainingAllocationAmt <= 0) {
        row.allocAmt = 0
        return
      }

      if (remainingAllocationAmt >= balanceAmount) {
        row.allocAmt = balanceAmount
        remainingAllocationAmt = decimals
          ? calculateSubtractionAmount(
              remainingAllocationAmt,
              balanceAmount,
              decimals.amtDec
            )
          : remainingAllocationAmt - balanceAmount
      } else {
        row.allocAmt = remainingAllocationAmt
        remainingAllocationAmt = 0
      }
    })

    // Write back allocations to objects in original order
    sorted.forEach((r) => {
      const target = byItemNo.get(r.itemNo)
      if (target) target.allocAmt = r.allocAmt
    })
  }

  return {
    updatedDetails,
  }
}

export const calauteLocalAmtandGainLoss = (
  details: IArReceiptDt[],
  rowNumber: number,
  exhRate: number,
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
    details[rowNumber].centDiff = 0
    details[rowNumber].exhGainLoss = 0
    return details[rowNumber]
  }

  const allocLocalAmt = calculateMultiplierAmount(
    allocAmt,
    exhRate,
    decimals.locAmtDec
  )

  const docAllocAmt = allocAmt

  const isFullBalanceAllocation =
    calculateSubtractionAmount(docBalAmt, allocAmt, decimals.amtDec) === 0

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
  details[rowNumber].docAllocAmt = docAllocAmt
  details[rowNumber].docAllocLocalAmt = docAllocLocalAmt
  details[rowNumber].centDiff = centDiff
  details[rowNumber].exhGainLoss = exhGainLoss

  return details[rowNumber]
}

export const calculateManualAllocation = (
  details: IArReceiptDt[],
  rowNumber: number,
  allocAmt: number,
  totAmt?: number,
  decimals?: IDecimal
): { result: IArReceiptDt; wasAutoSetToZero: boolean } => {
  if (!details || rowNumber < 0 || rowNumber >= details.length) {
    return { result: details[rowNumber], wasAutoSetToZero: false }
  }

  const currentBalance = Number(details[rowNumber].docBalAmt) || 0
  let finalAllocation = Number(allocAmt) || 0
  const originalRequestedAllocation = finalAllocation
  let wasAutoSetToZero = false

  // Helper function to subtract amount from remaining with decimals support
  const subtractFromRemaining = (remaining: number, amount: number) => {
    return decimals
      ? calculateSubtractionAmount(remaining, amount, decimals.amtDec)
      : remaining - amount
  }

  // Helper function to validate and clamp allocation to balance limits
  const clampAllocationToBalance = (allocation: number, balance: number) => {
    if (balance === 0) return 0

    const maxAbsBalance = Math.abs(balance)
    const absAllocation = Math.abs(allocation)
    if (absAllocation > maxAbsBalance) {
      return Math.sign(balance) * maxAbsBalance
    }
    return allocation
  }

  // If totAmt is provided, calculate with negatives-first logic
  if (totAmt !== undefined && totAmt > 0) {
    let remainingAllocationAmt = Number(totAmt) || 0

    // Process all other rows to calculate remaining allocation
    details.forEach((row, idx) => {
      if (idx === rowNumber) return // Skip current row

      const rowBalance = Number(row.docBalAmt) || 0
      const rowAllocatedAmt = Number(row.allocAmt) || 0

      // First, handle unallocated negative balances (adds to remaining)
      if (rowBalance < 0 && rowAllocatedAmt === 0) {
        remainingAllocationAmt = subtractFromRemaining(
          remainingAllocationAmt,
          rowBalance
        )
      }

      // Then, subtract already allocated amounts
      if (rowAllocatedAmt !== 0) {
        remainingAllocationAmt = subtractFromRemaining(
          remainingAllocationAmt,
          rowAllocatedAmt
        )
      }
    })

    // Handle current row based on its balance type
    if (currentBalance < 0) {
      // For negative balance, take it fully if desired amount allows
      if (finalAllocation < 0) {
        finalAllocation = currentBalance // Take full negative balance
        remainingAllocationAmt = subtractFromRemaining(
          remainingAllocationAmt,
          finalAllocation
        )
      } else {
        finalAllocation = 0 // Don't take if trying to allocate positive to negative
      }
    } else if (currentBalance > 0) {
      // For positive balance, validate against remaining amount
      finalAllocation = clampAllocationToBalance(
        finalAllocation,
        currentBalance
      )

      // Check if allocation is valid against remaining amount
      if (
        remainingAllocationAmt <= 0 ||
        finalAllocation > remainingAllocationAmt
      ) {
        // Only mark as auto-set if user actually requested an allocation
        if (originalRequestedAllocation > 0 && remainingAllocationAmt <= 0) {
          wasAutoSetToZero = true
        }
        finalAllocation = 0
        wasAutoSetToZero = true
      } else {
        // Valid allocation, reduce remaining
        remainingAllocationAmt = subtractFromRemaining(
          remainingAllocationAmt,
          finalAllocation
        )
      }
    } else {
      // currentBalance === 0, no allocation
      finalAllocation = 0
    }
  } else {
    // No totAmt validation, just enforce basic constraints
    finalAllocation = clampAllocationToBalance(finalAllocation, currentBalance)
  }

  details[rowNumber].allocAmt = finalAllocation
  return { result: details[rowNumber], wasAutoSetToZero }
}
