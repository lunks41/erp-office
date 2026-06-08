"use client"

import {
  IInvoicePreview,
  IInvoicePreviewHeader,
  IInvoicePreviewLine,
} from "@/interfaces/invoice-preview"
import { Loader2, Printer } from "lucide-react"
import { toast } from "sonner"

import { openInvoicePreviewReport } from "@/lib/open-invoice-preview-report"
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

function formatPreviewDate(value: string | undefined) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  return d.toLocaleDateString("en-GB")
}

function joinNonEmpty(parts: (string | undefined)[], separator: string) {
  return parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(separator)
}

function formatCurrency(header: IInvoicePreviewHeader | undefined) {
  const name = header?.currencyName?.trim()
  const code = header?.currencyCode?.trim()
  if (name && code && name !== code) return `${name} (${code})`
  return name || code || "—"
}

function formatTelephone(phone: string | undefined) {
  const p = phone?.trim()
  if (!p) return "—"
  return p.toUpperCase().startsWith("TEL") ? p : `TEL : ${p}`
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
  companyId: string | number
  userName?: string
  amtDec?: number
  locAmtDec?: number
}

function PreviewHeaderBlock({ header }: { header: IInvoicePreviewHeader }) {
  const addressLine2Country = joinNonEmpty(
    [header.address2, header.countryName],
    ", "
  )

  return (
    <div className="grid gap-4 rounded-md border p-4 text-sm sm:grid-cols-2">
      <div className="space-y-1">
        <div className="text-muted-foreground font-medium">Address :</div>
        <div className="font-medium">{header.billName?.trim() || "—"}</div>
        {header.address1?.trim() ? <div>{header.address1}</div> : null}
        {addressLine2Country ? <div>{addressLine2Country}</div> : null}
        <div>{formatTelephone(header.phoneNo)}</div>
        {header.customerRegNo?.trim() ? (
          <div>VAT TRN#: {header.customerRegNo}</div>
        ) : null}
      </div>

      <div className="space-y-1 sm:text-right">
        <div>
          <span className="text-muted-foreground">Invoice Date : </span>
          {formatPreviewDate(
            header.accountDate ? String(header.accountDate) : undefined
          )}
        </div>
        <div>
          <span className="text-muted-foreground">Currency : </span>
          {formatCurrency(header)}
        </div>
        <div>
          <span className="text-muted-foreground">Ref No. : </span>
          {header.refNo?.trim() || "—"}
        </div>
        <div>
          <span className="text-muted-foreground">Vessel : </span>
          {header.vesselName?.trim() || "—"}
        </div>
      </div>
    </div>
  )
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  preview,
  isLoading = false,
  loadError = null,
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
            Preview only — no invoice number is assigned until you post.
            Document no.: {header?.invoiceNo || "DRAFT"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading preview...
            </div>
          ) : loadError ? (
            <p className="text-destructive text-sm">{loadError}</p>
          ) : preview && header ? (
            <div className="space-y-4">
              <PreviewHeaderBlock header={header} />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-24">GL Code</TableHead>
                    <TableHead>GL Name</TableHead>
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
                        colSpan={9}
                        className="text-muted-foreground text-center"
                      >
                        No invoice lines
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line, index) => (
                      <TableRow
                        key={`${line.itemNo ?? index}-${line.remarks ?? line.chargeName ?? index}`}
                      >
                        <TableCell>{line.itemNo}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {line.glCode?.trim() || "—"}
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate">
                          {line.glName?.trim() || "—"}
                        </TableCell>
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
                  Subtotal: {formatAmount(header.totAmt)} {header.currencyCode}
                </div>
                <div>
                  VAT: {formatAmount(header.gstAmt)} {header.currencyCode}
                </div>
                <div className="text-base font-semibold">
                  Total: {formatAmount(header.totAmtAftGst)}{" "}
                  {header.currencyCode}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { normalizePreview }
