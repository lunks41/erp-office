"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { AlertTriangle, Loader2, Save, Settings2 } from "lucide-react"

import { getData, saveData } from "@/lib/api-client"
import { EInvoicing } from "@/lib/api-routes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Types ────────────────────────────────────────────────────────────────────
type EInvoicingSettings = {
  tin: string
  brn: string
  sstRegNo: string
  msicCode: string
  msicDescription: string
  businessActivityDescription: string
  defaultCurrency: string
  defaultInvoiceType: string
  autoSubmit: boolean
  autoAcknowledge: boolean
  retryOnFailure: boolean
  maxRetries: number
  notifyEmail: string
}

const INVOICE_TYPES = [
  { value: "01", label: "01 – Invoice" },
  { value: "02", label: "02 – Credit Note" },
  { value: "03", label: "03 – Debit Note" },
  { value: "04", label: "04 – Refund Note" },
  { value: "11", label: "11 – Self-Billed Invoice" },
  { value: "12", label: "12 – Self-Billed Credit Note" },
  { value: "13", label: "13 – Self-Billed Debit Note" },
  { value: "14", label: "14 – Self-Billed Refund Note" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const asStr = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""))
const asNum = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const asBool = (v: unknown) => v === true || v === "true" || v === 1

const normalize = (payload: unknown): EInvoicingSettings => {
  const d = (typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>).data ?? payload
    : {}) as Record<string, unknown>
  return {
    tin: asStr(d.tin ?? d.taxIdentificationNo ?? ""),
    brn: asStr(d.brn ?? d.businessRegistrationNo ?? d.registrationNo ?? ""),
    sstRegNo: asStr(d.sstRegNo ?? d.sstRegistrationNo ?? ""),
    msicCode: asStr(d.msicCode ?? ""),
    msicDescription: asStr(d.msicDescription ?? ""),
    businessActivityDescription: asStr(d.businessActivityDescription ?? d.businessActivity ?? ""),
    defaultCurrency: asStr(d.defaultCurrency ?? d.currency ?? "MYR"),
    defaultInvoiceType: asStr(d.defaultInvoiceType ?? d.invoiceType ?? "01"),
    autoSubmit: asBool(d.autoSubmit ?? d.auto_submit ?? false),
    autoAcknowledge: asBool(d.autoAcknowledge ?? d.auto_acknowledge ?? false),
    retryOnFailure: asBool(d.retryOnFailure ?? d.retry_on_failure ?? true),
    maxRetries: asNum(d.maxRetries ?? d.max_retries ?? 3),
    notifyEmail: asStr(d.notifyEmail ?? d.notify_email ?? ""),
  }
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
          checked ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EInvoicingSettingsPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const [form, setForm] = useState<EInvoicingSettings | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const settingsQuery = useQuery({
    queryKey: ["einvoicing-settings", companyId],
    queryFn: () => getData(EInvoicing.settings, { companyId }),
    enabled: !!companyId,
  })

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(normalize(settingsQuery.data))
      setIsDirty(false)
    }
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => saveData(EInvoicing.settings, { ...form, companyId }),
    onSuccess: () => setIsDirty(false),
  })

  const patch = (changes: Partial<EInvoicingSettings>) => {
    setForm((f) => (f ? { ...f, ...changes } : f))
    setIsDirty(true)
  }

  const loading = settingsQuery.isPending

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">E-Invoicing Settings</h1>
        <p className="text-muted-foreground">
          Company registration details and submission behaviour.
        </p>
      </div>

      {settingsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load settings</AlertTitle>
          <AlertDescription>Check API availability and try again.</AlertDescription>
        </Alert>
      )}

      {/* Company Registration */}
      <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Company Registration
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { key: "tin", label: "TIN (Tax Identification No)", placeholder: "e.g. C12345678901" },
              { key: "brn", label: "BRN (Business Reg No)", placeholder: "e.g. 202301012345" },
              { key: "sstRegNo", label: "SST Registration No", placeholder: "Optional" },
              { key: "msicCode", label: "MSIC Code", placeholder: "e.g. 46510" },
            ] as const
          ).map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">{label}</label>
              {loading ? (
                <Skeleton className="h-9 rounded-md" />
              ) : (
                <Input
                  className="h-9 text-xs"
                  placeholder={placeholder}
                  value={form?.[key] ?? ""}
                  onChange={(e) => patch({ [key]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-muted-foreground text-xs font-medium">MSIC Description</label>
            {loading ? (
              <Skeleton className="h-9 rounded-md" />
            ) : (
              <Input
                className="h-9 text-xs"
                placeholder="e.g. Wholesale of computer hardware, software and peripherals"
                value={form?.msicDescription ?? ""}
                onChange={(e) => patch({ msicDescription: e.target.value })}
              />
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-muted-foreground text-xs font-medium">
              Business Activity Description
            </label>
            {loading ? (
              <Skeleton className="h-9 rounded-md" />
            ) : (
              <Input
                className="h-9 text-xs"
                placeholder="e.g. IT Products and Services"
                value={form?.businessActivityDescription ?? ""}
                onChange={(e) => patch({ businessActivityDescription: e.target.value })}
              />
            )}
          </div>
        </div>
      </section>

      {/* Defaults */}
      <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Defaults</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">Default Currency</label>
            {loading ? (
              <Skeleton className="h-9 rounded-md" />
            ) : (
              <Input
                className="h-9 text-xs"
                placeholder="MYR"
                value={form?.defaultCurrency ?? "MYR"}
                onChange={(e) => patch({ defaultCurrency: e.target.value })}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">Default Invoice Type</label>
            {loading ? (
              <Skeleton className="h-9 rounded-md" />
            ) : (
              <Select
                value={form?.defaultInvoiceType ?? "01"}
                onValueChange={(v) => patch({ defaultInvoiceType: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-muted-foreground text-xs font-medium">Notification Email</label>
            {loading ? (
              <Skeleton className="h-9 rounded-md" />
            ) : (
              <Input
                type="email"
                className="h-9 text-xs"
                placeholder="e.g. einvoicing@company.com"
                value={form?.notifyEmail ?? ""}
                onChange={(e) => patch({ notifyEmail: e.target.value })}
              />
            )}
          </div>
        </div>
      </section>

      {/* Automation */}
      <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Automation</h2>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            <div className="py-3 first:pt-0 last:pb-0">
              <Toggle
                checked={form?.autoSubmit ?? false}
                onChange={(v) => patch({ autoSubmit: v })}
                label="Auto Submit"
                description="Automatically submit outgoing invoices to LHDN upon posting."
              />
            </div>
            <div className="py-3 first:pt-0 last:pb-0">
              <Toggle
                checked={form?.autoAcknowledge ?? false}
                onChange={(v) => patch({ autoAcknowledge: v })}
                label="Auto Acknowledge Incoming"
                description="Automatically acknowledge valid incoming invoices from suppliers."
              />
            </div>
            <div className="py-3 first:pt-0 last:pb-0">
              <Toggle
                checked={form?.retryOnFailure ?? true}
                onChange={(v) => patch({ retryOnFailure: v })}
                label="Retry on Failure"
                description="Automatically retry failed submissions up to the maximum retry count."
              />
            </div>
            {form?.retryOnFailure && (
              <div className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      Max Retries
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Number of retry attempts before marking as failed.
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    className="h-8 w-20 text-center text-xs"
                    value={form?.maxRetries ?? 3}
                    onChange={(e) =>
                      patch({ maxRetries: Math.min(10, Math.max(1, Number(e.target.value))) })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saveMutation.isSuccess && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Settings saved successfully.
          </p>
        )}
        {saveMutation.isError && (
          <p className="text-xs text-red-600 dark:text-red-400">
            Failed to save. Please try again.
          </p>
        )}
        <Button
          size="sm"
          className="h-8"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !isDirty || !form}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3.5 w-3.5" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
