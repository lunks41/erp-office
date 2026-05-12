"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Save,
  ShieldCheck,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react"

import { getData, saveData } from "@/lib/api-client"
import { EInvoicing } from "@/lib/api-routes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ─── Types ────────────────────────────────────────────────────────────────────
type ProviderConfig = {
  environment: "sandbox" | "production"
  clientId: string
  clientSecret: string
  apiBaseUrl: string
  tokenUrl: string
  isActive: boolean
  lastTestedAt: string
  lastTestStatus: string
}

type TestResult = {
  success: boolean
  message: string
  testedAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const asStr = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""))
const asBool = (v: unknown) => v === true || v === "true" || v === 1

const normalizeConfig = (payload: unknown): ProviderConfig => {
  const d = (typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>).data ?? payload
    : {}) as Record<string, unknown>
  return {
    environment: asStr(d.environment) === "production" ? "production" : "sandbox",
    clientId: asStr(d.clientId ?? d.client_id ?? ""),
    clientSecret: asStr(d.clientSecret ?? d.client_secret ?? ""),
    apiBaseUrl: asStr(
      d.apiBaseUrl ?? d.api_base_url ??
      (asStr(d.environment) === "production"
        ? "https://myinvois.hasil.gov.my"
        : "https://preprod.myinvois.hasil.gov.my")
    ),
    tokenUrl: asStr(
      d.tokenUrl ?? d.token_url ??
      (asStr(d.environment) === "production"
        ? "https://myinvois.hasil.gov.my/connect/token"
        : "https://preprod.myinvois.hasil.gov.my/connect/token")
    ),
    isActive: asBool(d.isActive ?? d.is_active ?? true),
    lastTestedAt: asStr(d.lastTestedAt ?? d.last_tested_at ?? ""),
    lastTestStatus: asStr(d.lastTestStatus ?? d.last_test_status ?? ""),
  }
}

const SANDBOX_URLS = {
  apiBaseUrl: "https://preprod.myinvois.hasil.gov.my",
  tokenUrl: "https://preprod.myinvois.hasil.gov.my/connect/token",
}
const PROD_URLS = {
  apiBaseUrl: "https://myinvois.hasil.gov.my",
  tokenUrl: "https://myinvois.hasil.gov.my/connect/token",
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EInvoicingProviderPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const [form, setForm] = useState<ProviderConfig>({
    environment: "sandbox",
    clientId: "",
    clientSecret: "",
    apiBaseUrl: SANDBOX_URLS.apiBaseUrl,
    tokenUrl: SANDBOX_URLS.tokenUrl,
    isActive: true,
    lastTestedAt: "",
    lastTestStatus: "",
  })
  const [showSecret, setShowSecret] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const providerQuery = useQuery({
    queryKey: ["einvoicing-provider", companyId],
    queryFn: () => getData(EInvoicing.provider, { companyId }),
    enabled: !!companyId,
  })

  useEffect(() => {
    if (providerQuery.data) {
      setForm(normalizeConfig(providerQuery.data))
      setIsDirty(false)
    }
  }, [providerQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => saveData(EInvoicing.provider, { ...form, companyId }),
    onSuccess: () => setIsDirty(false),
  })

  const testMutation = useMutation({
    mutationFn: () =>
      saveData(EInvoicing.providerTest, {
        companyId,
        clientId: form.clientId,
        clientSecret: form.clientSecret,
        environment: form.environment,
      }),
    onSuccess: (data) => {
      const d = (data as Record<string, unknown>) ?? {}
      setTestResult({
        success: asBool(d.success ?? d.data),
        message: asStr(d.message ?? d.detail ?? (d.success ? "Connection successful." : "Connection failed.")),
        testedAt: new Date().toLocaleString("en-GB"),
      })
    },
    onError: () => {
      setTestResult({
        success: false,
        message: "Connection test failed. Check credentials and network.",
        testedAt: new Date().toLocaleString("en-GB"),
      })
    },
  })

  const patch = (changes: Partial<ProviderConfig>) => {
    setForm((f) => ({ ...f, ...changes }))
    setIsDirty(true)
  }

  const handleEnvChange = (env: "sandbox" | "production") => {
    const urls = env === "production" ? PROD_URLS : SANDBOX_URLS
    patch({ environment: env, ...urls })
  }

  const lastStatus = form.lastTestStatus.toLowerCase()

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Provider Configuration</h1>
        <p className="text-muted-foreground">
          Configure LHDN MyInvois API credentials and environment settings.
        </p>
      </div>

      {providerQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load provider configuration</AlertTitle>
          <AlertDescription>Check API availability and try again.</AlertDescription>
        </Alert>
      )}

      {/* Environment toggle */}
      <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Environment
          </h2>
        </div>
        <div className="flex gap-3">
          {(["sandbox", "production"] as const).map((env) => (
            <button
              key={env}
              onClick={() => handleEnvChange(env)}
              className={[
                "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                form.environment === env
                  ? env === "production"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
              ].join(" ")}
            >
              <div className="capitalize">{env}</div>
              <div className="mt-0.5 text-[10px] font-normal opacity-70">
                {env === "production"
                  ? "myinvois.hasil.gov.my"
                  : "preprod.myinvois.hasil.gov.my"}
              </div>
            </button>
          ))}
        </div>
        {form.environment === "production" && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Production mode — submissions will be sent to LHDN and carry legal weight.
          </p>
        )}
      </div>

      {/* Credentials */}
      <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
          API Credentials
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">Client ID</label>
            {providerQuery.isPending ? (
              <div className="h-9 animate-pulse rounded-md bg-slate-100 dark:bg-slate-700" />
            ) : (
              <Input
                className="h-9 font-mono text-xs"
                placeholder="Enter MyInvois client ID"
                value={form.clientId}
                onChange={(e) => patch({ clientId: e.target.value })}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">Client Secret</label>
            {providerQuery.isPending ? (
              <div className="h-9 animate-pulse rounded-md bg-slate-100 dark:bg-slate-700" />
            ) : (
              <div className="relative">
                <Input
                  className="h-9 pr-9 font-mono text-xs"
                  type={showSecret ? "text" : "password"}
                  placeholder="Enter MyInvois client secret"
                  value={form.clientSecret}
                  onChange={(e) => patch({ clientSecret: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((s) => !s)}
                  className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  {showSecret ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Endpoints (read-only, auto-filled) */}
      <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
          API Endpoints
          <span className="text-muted-foreground ml-2 text-[10px] font-normal">
            Auto-filled based on environment
          </span>
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">Base URL</label>
            <Input
              className="h-9 font-mono text-xs"
              value={form.apiBaseUrl}
              onChange={(e) => patch({ apiBaseUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">Token URL</label>
            <Input
              className="h-9 font-mono text-xs"
              value={form.tokenUrl}
              onChange={(e) => patch({ tokenUrl: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Connection status */}
      {(form.lastTestedAt || testResult) && (
        <div
          className={[
            "flex items-start gap-3 rounded-lg border p-4",
            (testResult?.success ??
              (lastStatus.includes("success") || lastStatus.includes("ok")))
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
          ].join(" ")}
        >
          {(testResult?.success ?? lastStatus.includes("success")) ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          )}
          <div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
              {testResult?.message ?? form.lastTestStatus}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              Tested: {testResult?.testedAt ?? form.lastTestedAt}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge
            variant={form.isActive ? "default" : "outline"}
            className="cursor-pointer text-[11px]"
            onClick={() => patch({ isActive: !form.isActive })}
          >
            {form.isActive ? (
              <><Wifi className="mr-1 h-3 w-3" />Active</>
            ) : (
              <><WifiOff className="mr-1 h-3 w-3" />Inactive</>
            )}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => testMutation.mutate()}
            disabled={!form.clientId || !form.clientSecret || testMutation.isPending}
          >
            {testMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Test Connection
          </Button>
          <Button
            size="sm"
            className="h-8"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !isDirty}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      {saveMutation.isSuccess && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Provider configuration saved successfully.
        </p>
      )}
      {saveMutation.isError && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Failed to save. Please try again.
        </p>
      )}
    </div>
  )
}
