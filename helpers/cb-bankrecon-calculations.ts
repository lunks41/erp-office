import {
  calculateAdditionAmount,
  calculateMultiplierAmount,
} from "@/helpers/account"
import { ICbBankReconDt, IDecimal } from "@/interfaces"

/**
 * Calculate total amounts (base currency) and debit/credit/alloc totals
 */
export const calculateTotalAmounts = (
  details: ICbBankReconDt[],
  amtDec: number
) => {
  const totals = {
    totAmt: 0,
    debitTotAmt: 0,
    creditTotAmt: 0,
    allocTotAmt: 0,
    unAllocTotAmt: 0,
  }

  details.forEach((detail) => {
    const amt = Number(detail.totAmt) || 0
    totals.totAmt = calculateAdditionAmount(totals.totAmt, amt, amtDec)
    if (detail.isDebit) {
      totals.debitTotAmt = calculateAdditionAmount(
        totals.debitTotAmt,
        amt,
        amtDec
      )
    } else {
      totals.creditTotAmt = calculateAdditionAmount(
        totals.creditTotAmt,
        amt,
        amtDec
      )
    }
    // allocTotAmt / unAllocTotAmt can be set by backend; client keeps 0 here
  })

  return {
    totAmt: totals.totAmt,
    debitTotAmt: totals.debitTotAmt,
    creditTotAmt: totals.creditTotAmt,
    allocTotAmt: totals.allocTotAmt,
    unAllocTotAmt: totals.unAllocTotAmt,
  }
}

/**
 * Calculate local currency amounts
 */
export const calculateLocalAmounts = (
  details: ICbBankReconDt[],
  locAmtDec: number
) => {
  const totals = {
    totLocalAmt: 0,
  }

  details.forEach((detail) => {
    totals.totLocalAmt = calculateAdditionAmount(
      totals.totLocalAmt,
      Number(detail.totLocalAmt) || 0,
      locAmtDec
    )
  })

  return {
    totLocalAmt: totals.totLocalAmt,
  }
}

/**
 * Calculate country currency amounts
 */
export const calculateCtyAmounts = (
  details: ICbBankReconDt[],
  ctyAmtDec: number
) => {
  const totals = {
    totCtyAmt: 0,
  }

  details.forEach((detail) => {
    totals.totCtyAmt = calculateAdditionAmount(
      totals.totCtyAmt,
      Number(detail.totAmt) || 0,
      ctyAmtDec
    )
  })

  return {
    totCtyAmt: totals.totCtyAmt,
  }
}

/**
 * Calculate local amount based on total amount and exchange rate
 */
export const calculateLocalAmount = (
  totAmt: number,
  exchangeRate: number,
  decimals: IDecimal
) => {
  return calculateMultiplierAmount(totAmt, exchangeRate, decimals.locAmtDec)
}

/**
 * Calculate total amount based on quantity and unit price
 */
export const calculateTotalAmount = (
  qty: number,
  unitPrice: number,
  decimals: IDecimal
) => {
  return calculateMultiplierAmount(qty, unitPrice, decimals.amtDec)
}
