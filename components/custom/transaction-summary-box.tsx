"use client"

export interface TransactionSummaryValues {
  totAmt?: number
  gstAmt?: number
  totAmtAftGst?: number
  payAmt?: number
  balAmt?: number
  totLocalAmt?: number
  gstLocalAmt?: number
  totLocalAmtAftGst?: number
  payLocalAmt?: number
  balLocalAmt?: number
}

interface TransactionSummaryBoxProps {
  values: TransactionSummaryValues
  amtDec?: number
  locAmtDec?: number
  showGst?: boolean
  showPaymentBalance?: boolean
  textSize?: "xs" | "sm"
  className?: string
}

function formatAmount(value: number | undefined, decimals: number) {
  return (value || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

const valueClass = "font-semibold tabular-nums text-card-foreground"
const totalValueClass = "font-bold tabular-nums text-card-foreground"
const subLabelClass = "font-medium text-secondary-foreground"

export default function TransactionSummaryBox({
  values,
  amtDec = 2,
  locAmtDec = 2,
  showGst = true,
  showPaymentBalance = true,
  textSize = "sm",
  className = "col-span-2 flex min-w-0 flex-col justify-start",
}: TransactionSummaryBoxProps) {
  const textClass = textSize === "xs" ? "text-xs" : "text-sm"

  return (
    <div className={className}>
      <div className="w-full rounded-md border border-border bg-card p-3 shadow-sm">
        <div
          className={`mb-1.5 grid grid-cols-3 gap-x-2 border-b border-border pb-1.5 ${textClass}`}
        >
          <div className="text-right font-bold text-primary">Trns</div>
          <div className="text-center"></div>
          <div className="text-right font-bold text-primary">Local</div>
        </div>

        <div className={`grid grid-cols-3 gap-x-2 leading-snug ${textClass}`}>
          <div className="space-y-1.5 text-right">
            <div className={valueClass}>
              {formatAmount(values.totAmt, amtDec)}
            </div>
            {showGst && (
              <div className={valueClass}>
                {formatAmount(values.gstAmt, amtDec)}
              </div>
            )}
            <hr className="my-0.5 border-border" />
            <div className={totalValueClass}>
              {formatAmount(values.totAmtAftGst, amtDec)}
            </div>
            {showPaymentBalance && (
              <>
                <div className={totalValueClass}>
                  {formatAmount(values.payAmt, amtDec)}
                </div>
                <div className={totalValueClass}>
                  {formatAmount(values.balAmt, amtDec)}
                </div>
              </>
            )}
          </div>

          <div className="space-y-1 text-center">
            <div className={subLabelClass}>Amt</div>
            {showGst && <div className={subLabelClass}>VAT</div>}
            <div></div>
            <div className="font-bold text-primary">Total</div>
            {showPaymentBalance && (
              <>
                <div className="font-bold text-primary">Payment</div>
                <div className="font-bold text-primary">Balance</div>
              </>
            )}
          </div>

          <div className="space-y-1.5 text-right">
            <div className={valueClass}>
              {formatAmount(values.totLocalAmt, locAmtDec)}
            </div>
            {showGst && (
              <div className={valueClass}>
                {formatAmount(values.gstLocalAmt, locAmtDec)}
              </div>
            )}
            <hr className="my-0.5 border-border" />
            <div className={totalValueClass}>
              {formatAmount(values.totLocalAmtAftGst, locAmtDec)}
            </div>
            {showPaymentBalance && (
              <>
                <div className={totalValueClass}>
                  {formatAmount(values.payLocalAmt, locAmtDec)}
                </div>
                <div className={totalValueClass}>
                  {formatAmount(values.balLocalAmt, locAmtDec)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface DebitNoteTotalSummaryProps {
  totalAmount?: number
  vatAmount?: number
  totalAfterVat?: number
  decimals?: number
  className?: string
}

export function DebitNoteTotalSummary({
  totalAmount = 0,
  vatAmount = 0,
  totalAfterVat = 0,
  decimals = 2,
  className = "w-[12%] min-w-0 shrink-0",
}: DebitNoteTotalSummaryProps) {
  return (
    <div className={className}>
      <div className="rounded-md border border-border bg-card p-3 shadow-sm">
        <div className="mb-1.5 border-b border-border pb-1.5 text-center text-sm font-bold text-primary">
          Total Summary
        </div>
        <div className="space-y-1.5 text-sm leading-snug">
          <div className="flex items-center justify-between gap-2">
            <span className={subLabelClass}>Amt</span>
            <span className={valueClass}>
              {formatAmount(totalAmount, decimals)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className={subLabelClass}>VAT</span>
            <span className={valueClass}>
              {formatAmount(vatAmount, decimals)}
            </span>
          </div>
          <hr className="my-0.5 border-border" />
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-primary">Total</span>
            <span className={totalValueClass}>
              {formatAmount(totalAfterVat, decimals)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
