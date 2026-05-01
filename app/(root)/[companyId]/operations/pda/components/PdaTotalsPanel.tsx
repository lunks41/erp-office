"use client"

interface PdaTotalsPanelProps {
  subTotal: number
  vatAmount: number
  advanceReceived: number
  grandTotal: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0))

export function PdaTotalsPanel({
  subTotal,
  vatAmount,
  advanceReceived,
  grandTotal,
}: PdaTotalsPanelProps) {
  return (
    <div className="ml-auto w-full rounded-lg border bg-muted/20 p-3 md:w-[360px]">
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Sub Total</span>
          <span>{fmt(subTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>VAT</span>
          <span>{fmt(vatAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Advance Received</span>
          <span>{fmt(advanceReceived)}</span>
        </div>
        <div className="flex items-center justify-between border-t pt-2 font-semibold">
          <span>Grand Total</span>
          <span>{fmt(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}
