"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Download,
  Loader2,
} from "lucide-react"

import { getData } from "@/lib/api-client"
import { EInvoicing } from "@/lib/api-routes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ─── XML syntax highlighter (no external dep) ────────────────────────────────
function highlightXml(xml: string): string {
  return xml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;(\?xml[^?]*)\?&gt;/g, '<span class="text-slate-400">&lt;$1?&gt;</span>')
    .replace(
      /&lt;!--[\s\S]*?--&gt;/g,
      (m) => `<span class="text-slate-400 italic">${m}</span>`
    )
    .replace(
      /&lt;\/?([A-Za-z0-9_:.-]+)((?:\s+[A-Za-z0-9_:.-]+=(?:"[^"]*"|'[^']*'))*)\s*\/?&gt;/g,
      (_, tag, attrs) => {
        const coloredAttrs = attrs.replace(
          /([A-Za-z0-9_:.-]+)=("[^"]*"|'[^']*')/g,
          '<span class="text-sky-400">$1</span>=<span class="text-amber-300">$2</span>'
        )
        return `&lt;<span class="text-teal-400">${tag}</span>${coloredAttrs}&gt;`
      }
    )
    .replace(
      /&gt;([^&<]+)&lt;/g,
      (_, text) =>
        text.trim()
          ? `&gt;<span class="text-slate-200">${text}</span>&lt;`
          : `&gt;${text}&lt;`
    )
}

function prettyPrintXml(xml: string): string {
  try {
    const INDENT = "  "
    let formatted = ""
    let depth = 0
    const parts = xml.match(/<[^>]+>|[^<]+/g) ?? []
    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed) continue
      if (/^<\//.test(trimmed)) {
        depth = Math.max(0, depth - 1)
        formatted += `${INDENT.repeat(depth)}${trimmed}\n`
      } else if (/^<[^?!]/.test(trimmed) && !/\/>$/.test(trimmed) && !/<.*>.*<\/.*>/.test(trimmed)) {
        formatted += `${INDENT.repeat(depth)}${trimmed}\n`
        if (!/<\//.test(trimmed)) depth++
      } else {
        formatted += `${INDENT.repeat(depth)}${trimmed}\n`
      }
    }
    return formatted.trim()
  } catch {
    return xml
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EInvoicingXmlViewerPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = String(params?.companyId ?? "")

  const docId = searchParams.get("docId") ?? ""
  const docNo = searchParams.get("docNo") ?? ""

  const [copied, setCopied] = useState(false)
  const [prettyHtml, setPrettyHtml] = useState("")

  const xmlQuery = useQuery({
    queryKey: ["einvoicing-xml", docId],
    queryFn: () => getData(`${EInvoicing.xmlPayload}/${docId}`, { companyId }),
    enabled: !!docId,
    select: (data) => {
      if (typeof data === "string") return data
      if (typeof data?.data === "string") return data.data
      if (typeof data?.xml === "string") return data.xml
      if (typeof data?.payload === "string") return data.payload
      return JSON.stringify(data, null, 2)
    },
  })

  const rawXml: string = xmlQuery.data ?? ""

  useEffect(() => {
    if (rawXml) {
      const pretty = prettyPrintXml(rawXml)
      setPrettyHtml(highlightXml(pretty))
    }
  }, [rawXml])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawXml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  const handleDownload = () => {
    const blob = new Blob([rawXml], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${docNo || docId || "invoice"}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto space-y-4 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">XML Viewer</h1>
            <p className="text-muted-foreground text-sm">
              {docNo ? (
                <>
                  Document{" "}
                  <Badge variant="outline" className="font-mono text-xs">
                    {docNo}
                  </Badge>
                </>
              ) : (
                "Inspect raw XML payload for this e-invoice submission."
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={handleCopy}
            disabled={!rawXml}
          >
            {copied ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={handleDownload}
            disabled={!rawXml}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      {!docId && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No document selected</AlertTitle>
          <AlertDescription>
            Navigate here from an outgoing or incoming invoice row using the XML button.
          </AlertDescription>
        </Alert>
      )}

      {xmlQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load XML payload</AlertTitle>
          <AlertDescription>
            The document may not exist or has no XML payload stored yet.
          </AlertDescription>
        </Alert>
      )}

      {/* XML panel */}
      <div className="overflow-hidden rounded-lg border bg-slate-950">
        {/* toolbar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
          <span className="font-mono text-xs text-slate-400">
            {docNo || docId || "—"}.xml
          </span>
          {rawXml && (
            <span className="text-[10px] text-slate-500">
              {rawXml.length.toLocaleString()} bytes
            </span>
          )}
        </div>

        {/* content */}
        <div className="min-h-[400px] overflow-auto p-4">
          {xmlQuery.isPending && docId ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading XML payload…</span>
            </div>
          ) : prettyHtml ? (
            <pre
              className="font-mono text-xs leading-5 text-slate-300 [&_span]:transition-none"
              dangerouslySetInnerHTML={{ __html: prettyHtml }}
            />
          ) : (
            <p className="text-xs text-slate-500">
              {docId ? "No XML content returned." : "Select a document to view its XML."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
