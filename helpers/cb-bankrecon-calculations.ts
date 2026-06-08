import {
  calculateAdditionAmount,
  calculateMultiplierAmount,
  calculateSubtractionAmount,
} from "@/helpers/account"
import { ICbBankReconDt, IDecimal } from "@/interfaces"

/**
 * Calculate total amounts (base currency) and debit/credit/alloc totals
 */
/**
 * Closing balance = opening balance + debits - credits
 */
export const calculateClosingBalance = (
  opBalAmt: number,
  debitTotAmt: number,
  creditTotAmt: number,
  amtDec: number
) => {
  let closing = Number(opBalAmt) || 0
  closing = calculateAdditionAmount(closing, Number(debitTotAmt) || 0, amtDec)
  closing = calculateSubtractionAmount(closing, Number(creditTotAmt) || 0, amtDec)
  return closing
}

export const calculateTotalAmounts = (
  details: ICbBankReconDt[],
  amtDec: number,
  locAmtDec: number = amtDec
) => {
  const totals = {
    totAmt: 0,
    debitTotAmt: 0,
    creditTotAmt: 0,
    debitLocalTotAmt: 0,
    creditLocalTotAmt: 0,
    allocTotAmt: 0,
    unAllocTotAmt: 0,
  }

  details.forEach((detail) => {
    const amt = Number(detail.totAmt) || 0
    const localAmt = Number(detail.totLocalAmt) || 0
    totals.totAmt = calculateAdditionAmount(totals.totAmt, amt, amtDec)
    if (detail.isDebit) {
      totals.debitTotAmt = calculateAdditionAmount(
        totals.debitTotAmt,
        amt,
        amtDec
      )
      totals.debitLocalTotAmt = calculateAdditionAmount(
        totals.debitLocalTotAmt,
        localAmt,
        locAmtDec
      )
    } else {
      totals.creditTotAmt = calculateAdditionAmount(
        totals.creditTotAmt,
        amt,
        amtDec
      )
      totals.creditLocalTotAmt = calculateAdditionAmount(
        totals.creditLocalTotAmt,
        localAmt,
        locAmtDec
      )
    }

    if (detail.isSel) {
      totals.allocTotAmt = calculateAdditionAmount(
        totals.allocTotAmt,
        amt,
        amtDec
      )
    } else {
      totals.unAllocTotAmt = calculateAdditionAmount(
        totals.unAllocTotAmt,
        amt,
        amtDec
      )
    }
  })

  return {
    totAmt: totals.totAmt,
    debitTotAmt: totals.debitTotAmt,
    creditTotAmt: totals.creditTotAmt,
    debitLocalTotAmt: totals.debitLocalTotAmt,
    creditLocalTotAmt: totals.creditLocalTotAmt,
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
