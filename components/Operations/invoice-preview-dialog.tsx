"use client"

import {
  IInvoicePreview,
  IInvoicePreviewHeader,
  IInvoicePreviewLine,
} from "@/interfaces/invoice-preview"
import { openInvoicePreviewReport } from "@/lib/open-invoice-preview-report"
import { Loader2, Printer } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function formatAmount(value: number | undefined, decimals = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—"
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function normalizePreview(data: unknown): IInvoicePreview | null {
  if (!data || typeof data !== "object") return null
  const raw = data as Record<string, unknown>
  const header = (raw.header ?? raw.Header) as IInvoicePreviewHeader | undefined
  const lines = (raw.lines ?? raw.Lines) as IInvoicePreviewLine[] | undefined
  const previewKey = (raw.previewKey ?? raw.PreviewKey) as string | undefined
  if (!header) return null
  return {
    header,
    lines: Array.isArray(lines) ? lines : [],
    previewKey: previewKey || undefined,
  }
}

type InvoicePreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: IInvoicePreview | null
  isLoading?: boolean
  loadError?: string | null
  onPostInvoice?: () => void
  isPosting?: boolean
  canPost?: boolean
  postButtonLabel?: string
  companyId: string | number
  userName?: string
  amtDec?: number
  locAmtDec?: number
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  preview,
  isLoading = false,
  loadError = null,
  onPostInvoice,
  isPosting = false,
  canPost = false,
  postButtonLabel = "Post Invoice",
  companyId,
  userName = "",
  amtDec = 2,
  locAmtDec = 2,
}: InvoicePreviewDialogProps) {
  const header = preview?.header
  const lines = preview?.lines ?? []

  const handlePrint = () => {
    if (!preview?.previewKey) {
      toast.error("Print preview is not available. Reload the invoice preview.")
      return
    }
    openInvoicePreviewReport({
      companyId,
      previewKey: preview.previewKey,
      userName,
      amtDec,
      locAmtDec,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] w-[90vw] max-w-[90vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[90vw]"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Invoice Preview</DialogTitle>
          <DialogDescription>
            Preview only — no invoice number is assigned until you post. Document
            no.: {header?.invoiceNo || "DRAFT"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading preview...
            </div>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : preview ? (
            <div className="space-y-4">
              <div className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  {header?.customerName || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Reference: </span>
                  {header?.referenceNo || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Account date: </span>
                  {header?.accountDate
                    ? String(header.accountDate).slice(0, 10)
                    : "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Currency: </span>
                  {header?.currencyCode || "—"} @ {header?.exhRate ?? 1}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Bill to: </span>
                  {header?.billName || "—"}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">VAT</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No invoice lines
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line) => (
                      <TableRow key={line.itemNo ?? line.remarks}>
                        <TableCell>{line.itemNo}</TableCell>
                        <TableCell className="max-w-md whitespace-pre-wrap">
                          {line.remarks || line.chargeName || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(line.qty)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(line.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(line.totAmt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(line.gstAmt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(line.totAmtAftGst)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex flex-col items-end gap-1 text-sm">
                <div>
                  Subtotal: {formatAmount(header?.totAmt)}{" "}
                  {header?.currencyCode}
                </div>
                <div>
                  VAT: {formatAmount(header?.gstAmt)} {header?.currencyCode}
                </div>
                <div className="text-base font-semibold">
                  Total: {formatAmount(header?.totAmtAftGst)}{" "}
                  {header?.currencyCode}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isLoading || !preview?.previewKey}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {canPost && onPostInvoice ? (
            <Button onClick={onPostInvoice} disabled={isPosting || isLoading}>
              {isPosting ? "Posting..." : postButtonLabel}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { normalizePreview }
