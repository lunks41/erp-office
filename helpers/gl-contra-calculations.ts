import {
  calculateAdditionAmount,
  calculateMultiplierAmount,
  calculateSubtractionAmount,
} from "@/helpers/account"
import { IDecimal, IGLContraDt } from "@/interfaces"

// AR GL CONTRA CALCULATIONS

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const validateAllocation = (details: IGLContraDt[]): boolean => {
  return details.length > 0
}
// ============================================================================
// AUTO ALLOCATION
// ============================================================================

export const autoAllocateAmounts = (
  details: IGLContraDt[],
  decimals?: IDecimal
) => {
  const updatedDetails = (details || []).map((d) => ({ ...d }))

  const toNumber = (value: unknown): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const addAmount = (base: number, addition: number): number => {
    return decimals
      ? calculateAdditionAmount(base, addition, decimals.amtDec)
      : base + addition
  }

  const subtractAmount = (base: number, subtract: number): number => {
    return decimals
      ? calculateSubtractionAmount(base, subtract, decimals.amtDec)
      : base - subtract
  }

  let totalPositive = 0
  let totalNegativeAbs = 0

  updatedDetails.forEach((row) => {
    const balance = toNumber(row.docBalAmt)
    if (balance > 0) {
      totalPositive = addAmount(totalPositive, balance)
    } else if (balance < 0) {
      totalNegativeAbs = addAmount(totalNegativeAbs, Math.abs(balance))
    }
  })

  const hasBothSides = totalPositive > 0 && totalNegativeAbs > 0
  let appliedTotal = Math.min(totalPositive, totalNegativeAbs)

  if (!hasBothSides) {
    updatedDetails.forEach((row) => {
      const balanceAmount = toNumber(row.docBalAmt)
      row.allocAmt = balanceAmount
    })
    return {
      updatedDetails,
      appliedTotal,
    }
  }

  const positivesAreLimiting = totalPositive <= totalNegativeAbs
  const limitingTotal = positivesAreLimiting ? totalPositive : totalNegativeAbs
  appliedTotal = limitingTotal

  if (positivesAreLimiting) {
    // Allocate all positives fully, distribute across negatives
    updatedDetails.forEach((row) => {
      const balance = toNumber(row.docBalAmt)
      if (balance > 0) {
        row.allocAmt = balance
      } else if (balance === 0) {
        row.allocAmt = 0
      }
    })

    let remainingAbs = limitingTotal

    updatedDetails.forEach((row) => {
      const balance = toNumber(row.docBalAmt)
      if (balance >= 0) return

      if (remainingAbs <= 0) {
        row.allocAmt = 0
        return
      }

      const absoluteBalance = Math.abs(balance)
      const takeAmount = Math.min(absoluteBalance, remainingAbs)
      row.allocAmt = -takeAmount
      remainingAbs = subtractAmount(remainingAbs, takeAmount)
      if (Math.abs(remainingAbs) < 1e-9) {
        remainingAbs = 0
      }
    })
  } else {
    // Allocate all negatives fully, distribute across positives
    updatedDetails.forEach((row) => {
      const balance = toNumber(row.docBalAmt)
      if (balance < 0) {
        row.allocAmt = balance
      } else if (balance === 0) {
        row.allocAmt = 0
      }
    })

    let remaining = limitingTotal

    updatedDetails.forEach((row) => {
      const balance = toNumber(row.docBalAmt)
      if (balance <= 0) return

      if (remaining <= 0) {
        row.allocAmt = 0
        return
      }

      const takeAmount = Math.min(balance, remaining)
      row.allocAmt = takeAmount
      remaining = subtractAmount(remaining, takeAmount)
      if (Math.abs(remaining) < 1e-9) {
        remaining = 0
      }
    })
  }

  return {
    updatedDetails,
    appliedTotal,
  }
}

const cloneContraDetails = (details: IGLContraDt[] = []) =>
  details.map((row) => ({ ...row }))

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const allocateBetweenModules = (
  arDetails: IGLContraDt[],
  apDetails: IGLContraDt[],
  decimals?: IDecimal
) => {
  const arClone = cloneContraDetails(arDetails)
  const apClone = cloneContraDetails(apDetails)

  const addAmount = (base: number, addition: number) => {
    return decimals
      ? calculateAdditionAmount(base, addition, decimals.amtDec)
      : base + addition
  }

  const subtractAmount = (base: number, subtract: number) => {
    return decimals
      ? calculateSubtractionAmount(base, subtract, decimals.amtDec)
      : base - subtract
  }

  // Net signed sum of all docBalAmt (invoices positive, credit notes negative)
  const getNetSum = (rows: IGLContraDt[]) =>
    rows.reduce((sum, row) => addAmount(sum, toSafeNumber(row.docBalAmt)), 0)

  const arSum = getNetSum(arClone)
  const apSum = getNetSum(apClone)
  // Limiting amount = the smaller absolute net sum
  const limitingAmount = Math.min(Math.abs(arSum), Math.abs(apSum))

  // Fully allocate all rows: allocAmt = docBalAmt
  const fullyAllocate = (rows: IGLContraDt[]): IGLContraDt[] =>
    rows.map((row) => ({ ...row, allocAmt: toSafeNumber(row.docBalAmt) }))

  // Distribute a limit across rows, negatives first then positives.
  // Negatives are taken in full and INCREASE remaining (they offset positives).
  // Positives consume remaining up to their balance.
  const distributeAllocation = (rows: IGLContraDt[], limit: number): IGLContraDt[] => {
    const sorted = rows
      .map((row) => ({ ...row }))
      .sort((a, b) => {
        const aBal = toSafeNumber(a.docBalAmt)
        const bBal = toSafeNumber(b.docBalAmt)
        if (aBal < 0 && bBal >= 0) return -1
        if (aBal >= 0 && bBal < 0) return 1
        return 0
      })

    let remaining = limit

    sorted.forEach((row) => {
      const balance = toSafeNumber(row.docBalAmt)

      if (balance < 0) {
        // Take full negative; its absolute value increases remaining budget
        row.allocAmt = balance
        remaining = addAmount(remaining, Math.abs(balance))
        return
      }

      if (remaining <= 0) {
        row.allocAmt = 0
        return
      }

      const take = Math.min(balance, remaining)
      row.allocAmt = take
      remaining = Math.max(0, subtractAmount(remaining, take))
    })

    return sorted
  }

  if (limitingAmount <= 0) {
    return {
      updatedArDetails: arClone,
      updatedApDetails: apClone,
      limitingAmount,
    }
  }

  // The side with the smaller absolute net sum is fully allocated;
  // the other side is distributed using that smaller sum as the limit.
  let updatedArDetails: IGLContraDt[]
  let updatedApDetails: IGLContraDt[]

  if (Math.abs(arSum) <= Math.abs(apSum)) {
    // AR is smaller → AR fully allocated, AP distributed
    updatedArDetails = fullyAllocate(arClone)
    updatedApDetails = distributeAllocation(apClone, limitingAmount)
  } else {
    // AP is smaller → AP fully allocated, AR distributed
    updatedApDetails = fullyAllocate(apClone)
    updatedArDetails = distributeAllocation(arClone, limitingAmount)
  }

  return {
    updatedArDetails,
    updatedApDetails,
    limitingAmount,
  }
}

export const calculateUnallocated = (
  limitAmount: number,
  allocatedAmount: number,
  decimals: IDecimal
) => {
  const unAllocAmt = calculateSubtractionAmount(
    limitAmount,
    allocatedAmount,
    decimals.amtDec
  )

  return {
    unAllocAmt,
  }
}

export const calauteLocalAmtandGainLoss = (
  details: IGLContraDt[],
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

  const isFullBalanceAllocation =
    calculateSubtractionAmount(docBalAmt, allocAmt, decimals.amtDec) === 0

  const allocLocalAmt = isFullBalanceAllocation
    ? docBalLocalAmt
    : calculateMultiplierAmount(allocAmt, exhRate, decimals.locAmtDec)

  const docAllocAmt = allocAmt
  const docAllocLocalAmt = calculateMultiplierAmount(
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
  details: IGLContraDt[],
  rowNumber: number,
  allocAmt: number,
  decimals?: IDecimal
): { result: IGLContraDt; wasAutoSetToZero: boolean } => {
  // console.log(
  //   "calculateManualAllocation",
  //   details,
  //   rowNumber,
  //   allocAmt,
  //   totAmt,
  //   decimals
  // )
  if (!details || rowNumber < 0 || rowNumber >= details.length) {
    //console.log("calculateManualAllocation not valid", details, rowNumber)
    return { result: details[rowNumber], wasAutoSetToZero: false }
  }

  const currentBalance = Number(details[rowNumber].docBalAmt) || 0
  //console.log("calculateManualAllocation currentBalance", currentBalance)
  let finalAllocation = Number(allocAmt) || 0
  const originalRequestedAllocation = finalAllocation
  let wasAutoSetToZero = false
  //console.log("calculateManualAllocation finalAllocation", finalAllocation)

  // Helper function to subtract amount from remaining with decimals support
  const addAmount = (base: number, addition: number) => {
    return decimals
      ? calculateAdditionAmount(base, addition, decimals.amtDec)
      : base + addition
  }

  const subtractAmount = (remaining: number, amount: number) => {
    return decimals
      ? calculateSubtractionAmount(remaining, amount, decimals.amtDec)
      : remaining - amount
  }

  // Helper function to validate and clamp allocation to balance limits
  const clampAllocationToBalance = (allocation: number, balance: number) => {
    //console.log("clampAllocationToBalance", allocation, balance)
    if (balance === 0) return 0

    const maxAbsBalance = Math.abs(balance)
    const absAllocation = Math.abs(allocation)
    if (absAllocation > maxAbsBalance) {
      return Math.sign(balance) * maxAbsBalance
    }
    return allocation
  }

  const totalPositiveBalance = details.reduce((sum, row) => {
    const bal = Number(row.docBalAmt) || 0
    return bal > 0 ? addAmount(sum, bal) : sum
  }, 0)

  const totalNegativeAbsBalance = details.reduce((sum, row) => {
    const bal = Number(row.docBalAmt) || 0
    return bal < 0 ? addAmount(sum, Math.abs(bal)) : sum
  }, 0)

  const limitingTotal = Math.min(totalPositiveBalance, totalNegativeAbsBalance)
  const hasBothSides = totalPositiveBalance > 0 && totalNegativeAbsBalance > 0

  const allocationsExcludingRow = details.reduce(
    (acc, row, idx) => {
      if (idx === rowNumber) return acc
      const allocation = Number(row.allocAmt) || 0
      if (allocation > 0) {
        acc.positive = addAmount(acc.positive, allocation)
      } else if (allocation < 0) {
        acc.negativeAbs = addAmount(acc.negativeAbs, Math.abs(allocation))
      }
      return acc
    },
    { positive: 0, negativeAbs: 0 }
  )

  finalAllocation = clampAllocationToBalance(finalAllocation, currentBalance)

  if (!hasBothSides) {
    if (currentBalance > 0 && finalAllocation < 0) {
      finalAllocation = 0
      if (originalRequestedAllocation < 0) {
        wasAutoSetToZero = true
      }
    }
    if (currentBalance < 0 && finalAllocation > 0) {
      finalAllocation = 0
      if (originalRequestedAllocation > 0) {
        wasAutoSetToZero = true
      }
    }
    details[rowNumber].allocAmt = finalAllocation
    return { result: details[rowNumber], wasAutoSetToZero }
  }

  if (currentBalance > 0) {
    const available = Math.max(
      0,
      subtractAmount(limitingTotal, allocationsExcludingRow.positive)
    )
    if (available <= 0 && originalRequestedAllocation > 0) {
      wasAutoSetToZero = true
    }

    if (available <= 0) {
      finalAllocation = 0
    } else if (finalAllocation > available) {
      finalAllocation = available
      if (originalRequestedAllocation > available) {
        wasAutoSetToZero = true
      }
    }

    if (finalAllocation < 0) {
      finalAllocation = 0
    }
  } else if (currentBalance < 0) {
    const availableAbs = Math.max(
      0,
      subtractAmount(limitingTotal, allocationsExcludingRow.negativeAbs)
    )

    const desiredAbs = Math.min(
      Math.abs(finalAllocation),
      Math.abs(currentBalance)
    )
    const cappedAbs = Math.min(desiredAbs, availableAbs)

    if (availableAbs <= 0 && originalRequestedAllocation < 0) {
      wasAutoSetToZero = true
    }

    finalAllocation = cappedAbs === 0 ? 0 : -cappedAbs

    if (desiredAbs > availableAbs && originalRequestedAllocation < 0) {
      wasAutoSetToZero = true
    }
  } else {
    if (originalRequestedAllocation !== 0) {
      wasAutoSetToZero = true
    }
    finalAllocation = 0
  }

  details[rowNumber].allocAmt = finalAllocation
  return { result: details[rowNumber], wasAutoSetToZero }
}
